const express = require('express');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

const db = require('../config/database');
const { asyncHandler, AppError } = require('../middleware/errorMiddleware');
const { protect, authorize, checkOwnership } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

const router = express.Router();

// Validation schemas
const createOrderSchema = Joi.object({
  pickup_time: Joi.string().isoDate().required(),
  special_instructions: Joi.string().max(500).allow('').optional(),
  payment_method: Joi.string().valid('upi', 'cash').default('upi')
});

const updateOrderStatusSchema = Joi.object({
  status: Joi.string().valid('confirmed', 'preparing', 'ready', 'completed', 'cancelled').required(),
  notes: Joi.string().max(500).optional()
});

// Helper function to validate pickup time
const validatePickupTime = (pickupTime) => {
  const now = moment();
  const pickup = moment(pickupTime);
  
  if (pickup.isBefore(now)) {
    throw new AppError('Pickup time cannot be in the past', 400);
  }
  
  const minDelay = parseInt(process.env.DEFAULT_PICKUP_DELAY_MINUTES) || 30;
  const maxDelay = parseInt(process.env.MAX_PICKUP_DELAY_HOURS) || 4;
  
  const earliestTime = moment(now).add(minDelay, 'minutes');
  const latestTime = moment(now).add(maxDelay, 'hours');
  
  if (pickup.isBefore(earliestTime)) {
    throw new AppError(`Pickup time must be at least ${minDelay} minutes from now`, 400);
  }
  
  if (pickup.isAfter(latestTime)) {
    throw new AppError(`Pickup time cannot be more than ${maxDelay} hours from now`, 400);
  }
  
  return pickup;
};

// @desc    Create new order from cart
// @route   POST /api/orders
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
  // Debug authentication
  logger.info('Create Order Request - User:', req.user);
  if (!req.user || !req.user.user_id) {
    throw new AppError('Authentication required - user not found', 401);
  }
  
  const { error, value } = createOrderSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  const { pickup_time, special_instructions, payment_method } = value;

  // Validate pickup time
  const validatedPickupTime = validatePickupTime(pickup_time);

  // Get cart items
  logger.info(`Creating order for user: ${req.user.user_id}`);
  const { rows: cartItems } = await db.execute(`
    SELECT 
      c.quantity,
      m.item_id,
      m.name,
      m.description,
      m.price,
      m.canteen_id,
      m.available_quantity,
      can.name as canteen_name
    FROM cart c
    JOIN menu_items m ON c.item_id = m.item_id
    JOIN canteens can ON m.canteen_id = can.canteen_id
    WHERE c.user_id = ? AND m.is_available = true AND can.is_active = true
  `, [req.user.user_id]);

  logger.info(`Found ${cartItems.length} cart items for user ${req.user.user_id}`);
  logger.debug('Cart items:', cartItems);

  if (cartItems.length === 0) {
    throw new AppError('Cart is empty', 400);
  }

  // Verify all items are from same canteen
  const canteenId = cartItems[0].canteen_id;
  const differentCanteen = cartItems.find(item => item.canteen_id !== canteenId);
  if (differentCanteen) {
    throw new AppError('All items must be from the same canteen', 400);
  }

  // Check availability for all items
  for (const item of cartItems) {
    if (item.quantity > item.available_quantity) {
      throw new AppError(`${item.name} - Only ${item.available_quantity} available, but ${item.quantity} requested`, 400);
    }
  }

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxRate = parseFloat(process.env.DEFAULT_TAX_RATE) || 0.05;
  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal + taxAmount;

  // Start transaction
  const orderId = uuidv4();

  try {
    await db.transaction([
      // Create order
      {
        query: `
          INSERT INTO orders (
            order_id, user_id, canteen_id, pickup_time, subtotal_amount, 
            tax_amount, total_amount, payment_method, special_instructions
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        params: [
          orderId,
          req.user.user_id,
          canteenId,
          validatedPickupTime.format('YYYY-MM-DD HH:mm:ss'),
          subtotal,
          taxAmount,
          totalAmount,
          payment_method,
          special_instructions
        ]
      },
      // Create order items
      ...cartItems.map(item => ({
        query: `
          INSERT INTO order_items (
            order_id, item_id, quantity, unit_price, total_price, 
            item_name, item_description
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        params: [
          orderId,
          item.item_id,
          item.quantity,
          item.price,
          item.price * item.quantity,
          item.name,
          item.description
        ]
      })),
      // Update menu item availability
      ...cartItems.map(item => ({
        query: 'UPDATE menu_items SET available_quantity = available_quantity - ? WHERE item_id = ?',
        params: [item.quantity, item.item_id]
      })),
      // Clear cart
      {
        query: 'DELETE FROM cart WHERE user_id = ?',
        params: [req.user.user_id]
      }
    ]);

    logger.logUserActivity(req.user.user_id, 'ORDER_CREATED', {
      order_id: orderId,
      canteen_id: canteenId,
      total_amount: totalAmount,
      pickup_time: pickup_time,
      payment_method
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        order_id: orderId,
        canteen: {
          canteen_id: canteenId,
          name: cartItems[0].canteen_name
        },
        pickup_time: validatedPickupTime.toISOString(),
        total_amount: totalAmount,
        payment_method,
        payment_status: 'pending'
      }
    });

  } catch (error) {
    logger.error('Order creation failed:', error);
    throw new AppError('Failed to create order. Please try again.', 500);
  }
});

// @desc    Get user's orders
// @route   GET /api/orders
// @access  Private
const getUserOrders = asyncHandler(async (req, res) => {
  const { status, limit = 20, offset = 0 } = req.query;

  let query = `
    SELECT 
      o.order_id,
      o.pickup_time,
      o.total_amount,
      o.payment_status,
      o.order_status,
      o.created_at,
      c.name as canteen_name,
      c.location as canteen_location,
      COUNT(oi.id) as total_items
    FROM orders o
    JOIN canteens c ON o.canteen_id = c.canteen_id
    LEFT JOIN order_items oi ON o.order_id = oi.order_id
    WHERE o.user_id = ?
  `;
  
  const params = [req.user.user_id];

  if (status) {
    query += ' AND o.order_status = ?';
    params.push(status);
  }

  query += ' GROUP BY o.order_id ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const { rows } = await db.execute(query, params);

  res.json({
    success: true,
    count: rows.length,
    data: {
      orders: rows
    }
  });
});

// @desc    Get single order details
// @route   GET /api/orders/:orderId
// @access  Private
const getOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  // Get order details
  const { rows: orderRows } = await db.execute(`
    SELECT 
      o.*,
      c.name as canteen_name,
      c.location as canteen_location,
      c.contact as canteen_contact,
      u.name as user_name,
      u.phone as user_phone,
      u.email as user_email
    FROM orders o
    JOIN canteens c ON o.canteen_id = c.canteen_id
    JOIN users u ON o.user_id = u.user_id
    WHERE o.order_id = ?
  `, [orderId]);

  if (orderRows.length === 0) {
    throw new AppError('Order not found', 404);
  }

  const order = orderRows[0];

  // Check if user owns this order (unless admin/staff)
  if (!['admin', 'canteen_staff'].includes(req.user.role) && order.user_id !== req.user.user_id) {
    throw new AppError('Not authorized to view this order', 403);
  }

  // Get order items
  const { rows: itemRows } = await db.execute(`
    SELECT 
      oi.*,
      m.image_url,
      m.is_veg
    FROM order_items oi
    LEFT JOIN menu_items m ON oi.item_id = m.item_id
    WHERE oi.order_id = ?
    ORDER BY oi.id
  `, [orderId]);

  // Get payment details
  const { rows: paymentRows } = await db.execute(
    'SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC LIMIT 1',
    [orderId]
  );

  res.json({
    success: true,
    data: {
      order: {
        ...order,
        items: itemRows.map(item => ({
          ...item,
          vegetarian: Boolean(item.is_veg)
        })),
        payment: paymentRows.length > 0 ? paymentRows[0] : null
      }
    }
  });
});

// @desc    Cancel order
// @route   PATCH /api/orders/:orderId/cancel
// @access  Private
const cancelOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  // Get order details
  const { rows: orderRows } = await db.execute(
    'SELECT * FROM orders WHERE order_id = ? AND user_id = ?',
    [orderId, req.user.user_id]
  );

  if (orderRows.length === 0) {
    throw new AppError('Order not found', 404);
  }

  const order = orderRows[0];

  // Check if order can be cancelled
  if (['completed', 'cancelled'].includes(order.order_status)) {
    throw new AppError('Order cannot be cancelled', 400);
  }

  if (order.payment_status === 'paid' && ['preparing', 'ready'].includes(order.order_status)) {
    throw new AppError('Paid orders that are being prepared cannot be cancelled. Please contact the canteen.', 400);
  }

  // Get order items to restore availability
  const { rows: orderItems } = await db.execute(
    'SELECT item_id, quantity FROM order_items WHERE order_id = ?',
    [orderId]
  );

  try {
    await db.transaction([
      // Update order status
      {
        query: 'UPDATE orders SET order_status = ?, updated_at = NOW() WHERE order_id = ?',
        params: ['cancelled', orderId]
      },
      // Restore menu item availability
      ...orderItems.map(item => ({
        query: 'UPDATE menu_items SET available_quantity = available_quantity + ? WHERE item_id = ?',
        params: [item.quantity, item.item_id]
      }))
    ]);

    logger.logUserActivity(req.user.user_id, 'ORDER_CANCELLED', {
      order_id: orderId
    });

    res.json({
      success: true,
      message: 'Order cancelled successfully'
    });

  } catch (error) {
    logger.error('Order cancellation failed:', error);
    throw new AppError('Failed to cancel order. Please try again.', 500);
  }
});

// @desc    Update order status (Admin/Staff only)
// @route   PATCH /api/orders/:orderId/status
// @access  Private (Admin/Staff)
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { error, value } = updateOrderStatusSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  const { orderId } = req.params;
  const { status, notes } = value;

  // Get order details
  const { rows: orderRows } = await db.execute(
    'SELECT * FROM orders WHERE order_id = ?',
    [orderId]
  );

  if (orderRows.length === 0) {
    throw new AppError('Order not found', 404);
  }

  const order = orderRows[0];

  // Validate status transition
  const validTransitions = {
    'placed': ['confirmed', 'cancelled'],
    'confirmed': ['preparing', 'cancelled'],
    'preparing': ['ready', 'cancelled'],
    'ready': ['completed'],
    'completed': [],
    'cancelled': []
  };

  if (!validTransitions[order.order_status].includes(status)) {
    throw new AppError(`Cannot change status from ${order.order_status} to ${status}`, 400);
  }

  // Update order status
  await db.execute(
    'UPDATE orders SET order_status = ?, updated_at = NOW() WHERE order_id = ?',
    [status, orderId]
  );

  // Log status change
  logger.logUserActivity(req.user.user_id, 'ORDER_STATUS_UPDATED', {
    order_id: orderId,
    old_status: order.order_status,
    new_status: status,
    notes
  });

  res.json({
    success: true,
    message: `Order status updated to ${status}`,
    data: {
      order_id: orderId,
      status,
      updated_at: new Date().toISOString()
    }
  });
});

// @desc    Get order statistics for user
// @route   GET /api/orders/stats
// @access  Private
const getOrderStats = asyncHandler(async (req, res) => {
  const { rows } = await db.execute(`
    SELECT 
      COUNT(*) as total_orders,
      COUNT(CASE WHEN order_status = 'completed' THEN 1 END) as completed_orders,
      COUNT(CASE WHEN order_status = 'cancelled' THEN 1 END) as cancelled_orders,
      COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_orders,
      COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) as total_spent,
      AVG(CASE WHEN order_status = 'completed' THEN total_amount END) as avg_order_value
    FROM orders 
    WHERE user_id = ?
  `, [req.user.user_id]);

  const stats = rows[0];

  res.json({
    success: true,
    data: {
      statistics: {
        total_orders: parseInt(stats.total_orders),
        completed_orders: parseInt(stats.completed_orders),
        cancelled_orders: parseInt(stats.cancelled_orders),
        paid_orders: parseInt(stats.paid_orders),
        total_spent: parseFloat(stats.total_spent || 0),
        average_order_value: parseFloat(stats.avg_order_value || 0)
      }
    }
  });
});

// Routes
router.use(protect); // All routes require authentication

router.get('/', getUserOrders);
router.get('/stats', getOrderStats);
router.post('/', createOrder);
router.get('/:orderId', getOrder);
router.patch('/:orderId/cancel', cancelOrder);
router.patch('/:orderId/status', authorize('admin', 'canteen_staff'), updateOrderStatus);

module.exports = router;