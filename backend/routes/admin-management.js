const express = require('express');
const Joi = require('joi');

const db = require('../config/database');
const { asyncHandler, AppError } = require('../middleware/errorMiddleware');
const { protectAdmin } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');
const { 
  emitMenuItemUpdate, 
  emitMenuItemAdded, 
  emitLowStockAlert,
  emitMenuItemAvailability 
} = require('../utils/socketEvents');

const router = express.Router();

// Apply admin protection to all routes
router.use(protectAdmin);

// Validation schemas
const updateMenuItemSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  description: Joi.string().max(500).optional(),
  price: Joi.number().positive().precision(2).optional(),
  category: Joi.string().max(50).optional(),
  is_veg: Joi.boolean().optional(),
  is_available: Joi.boolean().optional(),
  available_quantity: Joi.number().integer().min(0).optional(),
  preparation_time: Joi.number().integer().min(1).optional(),
  image_url: Joi.string().uri().optional().allow(null, '')
});

const addMenuItemSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).optional(),
  price: Joi.number().positive().precision(2).required(),
  category: Joi.string().max(50).required(),
  is_veg: Joi.boolean().default(true),
  available_quantity: Joi.number().integer().min(0).default(10),
  preparation_time: Joi.number().integer().min(1).default(15),
  image_url: Joi.string().uri().optional().allow(null, '')
});

const updateOrderStatusSchema = Joi.object({
  order_status: Joi.string().valid('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled').required()
});

const updateQuantitySchema = Joi.object({
  quantity_change: Joi.number().integer().required() // Can be positive or negative
});

// @desc    Get canteen menu for admin management
// @route   GET /api/admin/menu
// @access  Private (Admin)
const getCanteenMenu = asyncHandler(async (req, res) => {
  const canteenId = req.user.canteen_id;
  const { category, available_only } = req.query;

  let query = `
    SELECT 
      item_id, name, description, price, category, image_url,
      is_veg, is_available, available_quantity, preparation_time,
      rating, total_ratings, created_at, updated_at
    FROM menu_items 
    WHERE canteen_id = ?
  `;
  
  const params = [canteenId];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  if (available_only === 'true') {
    query += ' AND is_available = true AND available_quantity > 0';
  }

  query += ' ORDER BY category, name';

  const { rows } = await db.execute(query, params);

  // Group by category
  const menuByCategory = rows.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  res.json({
    success: true,
    count: rows.length,
    data: {
      menu_items: rows,
      menu_by_category: menuByCategory
    }
  });
});

// @desc    Add new menu item
// @route   POST /api/admin/menu
// @access  Private (Admin)
const addMenuItem = asyncHandler(async (req, res) => {
  const { error, value } = addMenuItemSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  const canteenId = req.user.canteen_id;
  const { name, description, price, category, is_veg, available_quantity, preparation_time, image_url } = value;

  // Check if item with same name already exists in this canteen
  const { rows: existingItems } = await db.execute(
    'SELECT item_id FROM menu_items WHERE canteen_id = ? AND name = ?',
    [canteenId, name]
  );

  if (existingItems.length > 0) {
    throw new AppError('Menu item with this name already exists', 400);
  }

  // Insert new menu item
  const { rows } = await db.execute(`
    INSERT INTO menu_items (
      canteen_id, name, description, price, category, is_veg, 
      available_quantity, preparation_time, image_url, is_available
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, true)
  `, [canteenId, name, description, price, category, is_veg, available_quantity, preparation_time, image_url]);

  // Get the inserted item
  const { rows: newItem } = await db.execute(
    'SELECT * FROM menu_items WHERE item_id = LAST_INSERT_ID()'
  );

  logger.logUserActivity(req.user.admin_id, 'MENU_ITEM_ADDED', {
    canteen_id: canteenId,
    item_name: name,
    item_id: newItem[0].item_id
  });

  // Emit real-time update
  const io = req.app.get('io');
  if (io) {
    emitMenuItemAdded(io, canteenId, newItem[0]);
  }

  res.status(201).json({
    success: true,
    message: 'Menu item added successfully',
    data: {
      menu_item: newItem[0]
    }
  });
});

// @desc    Update menu item
// @route   PUT /api/admin/menu/:itemId
// @access  Private (Admin)
const updateMenuItem = asyncHandler(async (req, res) => {
  const { error, value } = updateMenuItemSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  const { itemId } = req.params;
  const canteenId = req.user.canteen_id;

  // Check if item exists and belongs to this canteen
  const { rows: existingItems } = await db.execute(
    'SELECT * FROM menu_items WHERE item_id = ? AND canteen_id = ?',
    [itemId, canteenId]
  );

  if (existingItems.length === 0) {
    throw new AppError('Menu item not found or not authorized', 404);
  }

  // Build dynamic update query
  const updateFields = [];
  const updateValues = [];

  Object.keys(value).forEach(key => {
    if (value[key] !== undefined) {
      updateFields.push(`${key} = ?`);
      updateValues.push(value[key]);
    }
  });

  if (updateFields.length === 0) {
    throw new AppError('No fields to update', 400);
  }

  updateValues.push(itemId);

  await db.execute(
    `UPDATE menu_items SET ${updateFields.join(', ')}, updated_at = NOW() WHERE item_id = ?`,
    updateValues
  );

  // Get updated item
  const { rows: updatedItem } = await db.execute(
    'SELECT * FROM menu_items WHERE item_id = ?',
    [itemId]
  );

  logger.logUserActivity(req.user.admin_id, 'MENU_ITEM_UPDATED', {
    canteen_id: canteenId,
    item_id: itemId,
    updates: Object.keys(value)
  });

  // Emit real-time update
  const io = req.app.get('io');
  if (io) {
    emitMenuItemUpdate(io, canteenId, updatedItem[0]);
    
    // Check if availability was changed
    if (value.is_available !== undefined && value.is_available !== existingItems[0].is_available) {
      emitMenuItemAvailability(io, canteenId, itemId, updatedItem[0].name, value.is_available);
    }
  }

  res.json({
    success: true,
    message: 'Menu item updated successfully',
    data: {
      menu_item: updatedItem[0]
    }
  });
});

// @desc    Update menu item quantity (increase/decrease stock)
// @route   PATCH /api/admin/menu/:itemId/quantity
// @access  Private (Admin)
const updateMenuItemQuantity = asyncHandler(async (req, res) => {
  const { error, value } = updateQuantitySchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  const { itemId } = req.params;
  const { quantity_change } = value;
  const canteenId = req.user.canteen_id;

  // Get current item
  const { rows: items } = await db.execute(
    'SELECT * FROM menu_items WHERE item_id = ? AND canteen_id = ?',
    [itemId, canteenId]
  );

  if (items.length === 0) {
    throw new AppError('Menu item not found or not authorized', 404);
  }

  const currentQuantity = items[0].available_quantity;
  const newQuantity = Math.max(0, currentQuantity + quantity_change); // Don't allow negative quantities

  // Update quantity
  await db.execute(
    'UPDATE menu_items SET available_quantity = ?, updated_at = NOW() WHERE item_id = ?',
    [newQuantity, itemId]
  );

  // Auto-update availability based on quantity
  if (newQuantity === 0) {
    await db.execute(
      'UPDATE menu_items SET is_available = false WHERE item_id = ?',
      [itemId]
    );
  } else if (currentQuantity === 0 && newQuantity > 0) {
    await db.execute(
      'UPDATE menu_items SET is_available = true WHERE item_id = ?',
      [itemId]
    );
  }

  logger.logUserActivity(req.user.admin_id, 'MENU_QUANTITY_UPDATED', {
    canteen_id: canteenId,
    item_id: itemId,
    old_quantity: currentQuantity,
    quantity_change,
    new_quantity: newQuantity
  });

  // Get updated item for broadcasting
  const { rows: updatedItem } = await db.execute(
    'SELECT * FROM menu_items WHERE item_id = ?',
    [itemId]
  );

  // Emit real-time updates
  const io = req.app.get('io');
  if (io) {
    emitMenuItemUpdate(io, canteenId, updatedItem[0]);
    
    // Emit availability change if quantity went to/from zero
    if (currentQuantity === 0 && newQuantity > 0) {
      emitMenuItemAvailability(io, canteenId, itemId, updatedItem[0].name, true);
    } else if (currentQuantity > 0 && newQuantity === 0) {
      emitMenuItemAvailability(io, canteenId, itemId, updatedItem[0].name, false);
    }
    
    // Emit low stock alert if quantity is low (but not zero)
    if (newQuantity > 0 && newQuantity <= 5 && currentQuantity > 5) {
      emitLowStockAlert(io, canteenId, updatedItem[0]);
    }
  }

  res.json({
    success: true,
    message: 'Quantity updated successfully',
    data: {
      item_id: itemId,
      old_quantity: currentQuantity,
      quantity_change,
      new_quantity: newQuantity,
      is_available: newQuantity > 0
    }
  });
});

// @desc    Get orders for canteen
// @route   GET /api/admin/orders
// @access  Private (Admin)
const getCanteenOrders = asyncHandler(async (req, res) => {
  const canteenId = req.user.canteen_id;
  const { status, date, limit = 50, offset = 0 } = req.query;

  let query = `
    SELECT 
      o.order_id, o.pickup_time, o.subtotal_amount, o.tax_amount, o.total_amount,
      o.payment_status, o.order_status, o.payment_method, o.special_instructions,
      o.created_at, o.updated_at,
      u.name as customer_name, u.phone as customer_phone, u.email as customer_email,
      u.role as customer_role,
      COUNT(oi.id) as total_items
    FROM orders o
    JOIN users u ON o.user_id = u.user_id
    LEFT JOIN order_items oi ON o.order_id = oi.order_id
    WHERE o.canteen_id = ?
  `;
  
  const params = [canteenId];

  if (status) {
    query += ' AND o.order_status = ?';
    params.push(status);
  }

  if (date) {
    query += ' AND DATE(o.created_at) = ?';
    params.push(date);
  }

  query += ' GROUP BY o.order_id ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const { rows } = await db.execute(query, params);

  // Get order items for each order (optional detailed view)
  const ordersWithItems = await Promise.all(
    rows.map(async (order) => {
      const { rows: items } = await db.execute(`
        SELECT 
          oi.quantity, oi.unit_price, oi.total_price, oi.item_name,
          m.is_veg, m.category
        FROM order_items oi
        LEFT JOIN menu_items m ON oi.item_id = m.item_id
        WHERE oi.order_id = ?
      `, [order.order_id]);

      return {
        ...order,
        items
      };
    })
  );

  res.json({
    success: true,
    count: rows.length,
    data: {
      orders: ordersWithItems
    }
  });
});

// @desc    Update order status
// @route   PATCH /api/admin/orders/:orderId/status
// @access  Private (Admin)
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { error, value } = updateOrderStatusSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  const { orderId } = req.params;
  const { order_status } = value;
  const canteenId = req.user.canteen_id;

  // Check if order exists and belongs to this canteen
  const { rows: orders } = await db.execute(
    'SELECT * FROM orders WHERE order_id = ? AND canteen_id = ?',
    [orderId, canteenId]
  );

  if (orders.length === 0) {
    throw new AppError('Order not found or not authorized', 404);
  }

  const order = orders[0];

  // Validate status transition (basic validation)
  const validTransitions = {
    'pending': ['confirmed', 'cancelled'],
    'confirmed': ['preparing', 'cancelled'],
    'preparing': ['ready', 'cancelled'],
    'ready': ['completed'],
    'completed': [], // Final state
    'cancelled': [] // Final state
  };

  if (!validTransitions[order.order_status]?.includes(order_status) && order.order_status !== order_status) {
    throw new AppError(`Cannot change status from ${order.order_status} to ${order_status}`, 400);
  }

  // Update order status
  await db.execute(
    'UPDATE orders SET order_status = ?, updated_at = NOW() WHERE order_id = ?',
    [order_status, orderId]
  );

  logger.logUserActivity(req.user.admin_id, 'ORDER_STATUS_UPDATED', {
    canteen_id: canteenId,
    order_id: orderId,
    old_status: order.order_status,
    new_status: order_status
  });

  res.json({
    success: true,
    message: 'Order status updated successfully',
    data: {
      order_id: orderId,
      old_status: order.order_status,
      new_status: order_status
    }
  });
});

// @desc    Get canteen dashboard statistics
// @route   GET /api/admin/dashboard/stats
// @access  Private (Admin)
const getDashboardStats = asyncHandler(async (req, res) => {
  const canteenId = req.user.canteen_id;

  // Today's stats
  const today = new Date().toISOString().split('T')[0];

  // Get various statistics
  const [
    { rows: orderStats },
    { rows: revenueStats },
    { rows: menuStats },
    { rows: recentOrders }
  ] = await Promise.all([
    // Order statistics
    db.execute(`
      SELECT 
        order_status,
        COUNT(*) as count,
        SUM(total_amount) as revenue
      FROM orders 
      WHERE canteen_id = ? AND DATE(created_at) = ?
      GROUP BY order_status
    `, [canteenId, today]),

    // Revenue statistics
    db.execute(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders,
        SUM(total_amount) as revenue
      FROM orders 
      WHERE canteen_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, [canteenId]),

    // Menu statistics
    db.execute(`
      SELECT 
        COUNT(*) as total_items,
        COUNT(CASE WHEN is_available = true THEN 1 END) as available_items,
        COUNT(CASE WHEN available_quantity = 0 THEN 1 END) as out_of_stock
      FROM menu_items 
      WHERE canteen_id = ?
    `, [canteenId]),

    // Recent orders
    db.execute(`
      SELECT 
        o.order_id, o.order_status, o.total_amount, o.created_at,
        u.name as customer_name
      FROM orders o
      JOIN users u ON o.user_id = u.user_id
      WHERE o.canteen_id = ?
      ORDER BY o.created_at DESC
      LIMIT 5
    `, [canteenId])
  ]);

  res.json({
    success: true,
    data: {
      today_stats: {
        orders: orderStats,
        date: today
      },
      revenue_trend: revenueStats,
      menu_stats: menuStats[0],
      recent_orders: recentOrders
    }
  });
});

// Routes
router.get('/menu', getCanteenMenu);
router.post('/menu', addMenuItem);
router.put('/menu/:itemId', updateMenuItem);
router.patch('/menu/:itemId/quantity', updateMenuItemQuantity);

router.get('/orders', getCanteenOrders);
router.patch('/orders/:orderId/status', updateOrderStatus);

router.get('/dashboard/stats', getDashboardStats);

// @desc    Set exact stock quantity for menu item
// @route   PUT /api/admin/stock/:itemId
// @access  Private (Admin)
const setStockQuantity = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const { quantity } = req.body;
  const canteenId = req.user.canteen_id;

  // Validate quantity
  if (typeof quantity !== 'number' || quantity < 0 || !Number.isInteger(quantity)) {
    throw new AppError('Quantity must be a non-negative integer', 400);
  }

  // Check if item exists and belongs to this canteen
  const { rows: items } = await db.execute(
    'SELECT * FROM menu_items WHERE item_id = ? AND canteen_id = ?',
    [itemId, canteenId]
  );

  if (items.length === 0) {
    throw new AppError('Menu item not found or not authorized', 404);
  }

  const currentItem = items[0];
  const oldQuantity = currentItem.available_quantity;

  // Update quantity
  await db.execute(
    'UPDATE menu_items SET available_quantity = ?, updated_at = NOW() WHERE item_id = ?',
    [quantity, itemId]
  );

  // Auto-update availability based on quantity
  const newAvailability = quantity > 0;
  if (currentItem.is_available !== newAvailability) {
    await db.execute(
      'UPDATE menu_items SET is_available = ? WHERE item_id = ?',
      [newAvailability, itemId]
    );
  }

  // Get updated item
  const { rows: updatedItem } = await db.execute(
    'SELECT * FROM menu_items WHERE item_id = ?',
    [itemId]
  );

  logger.logUserActivity(req.user.admin_id, 'STOCK_QUANTITY_SET', {
    canteen_id: canteenId,
    item_id: itemId,
    item_name: currentItem.name,
    old_quantity: oldQuantity,
    new_quantity: quantity
  });

  // Emit real-time update
  const io = req.app.get('io');
  if (io) {
    emitMenuItemUpdate(io, canteenId, updatedItem[0]);
    
    // Emit availability change if needed
    if (currentItem.is_available !== newAvailability) {
      emitMenuItemAvailability(io, canteenId, itemId, currentItem.name, newAvailability);
    }
    
    // Emit low stock alert if quantity is low (but not zero)
    if (quantity > 0 && quantity <= 5 && oldQuantity > 5) {
      emitLowStockAlert(io, canteenId, updatedItem[0]);
    }
  }

  res.json({
    success: true,
    message: 'Stock quantity updated successfully',
    data: {
      item_id: itemId,
      item_name: currentItem.name,
      old_quantity: oldQuantity,
      new_quantity: quantity,
      is_available: newAvailability
    }
  });
});

// @desc    Toggle item availability
// @route   PATCH /api/admin/stock/:itemId/availability
// @access  Private (Admin)
const toggleItemAvailability = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const { is_available } = req.body;
  const canteenId = req.user.canteen_id;

  if (typeof is_available !== 'boolean') {
    throw new AppError('is_available must be a boolean value', 400);
  }

  // Check if item exists and belongs to this canteen
  const { rows: items } = await db.execute(
    'SELECT * FROM menu_items WHERE item_id = ? AND canteen_id = ?',
    [itemId, canteenId]
  );

  if (items.length === 0) {
    throw new AppError('Menu item not found or not authorized', 404);
  }

  const currentItem = items[0];

  // Update availability
  await db.execute(
    'UPDATE menu_items SET is_available = ?, updated_at = NOW() WHERE item_id = ?',
    [is_available, itemId]
  );

  // Get updated item
  const { rows: updatedItem } = await db.execute(
    'SELECT * FROM menu_items WHERE item_id = ?',
    [itemId]
  );

  logger.logUserActivity(req.user.admin_id, 'ITEM_AVAILABILITY_TOGGLED', {
    canteen_id: canteenId,
    item_id: itemId,
    item_name: currentItem.name,
    old_availability: currentItem.is_available,
    new_availability: is_available
  });

  // Emit real-time update
  const io = req.app.get('io');
  if (io) {
    emitMenuItemUpdate(io, canteenId, updatedItem[0]);
    emitMenuItemAvailability(io, canteenId, itemId, currentItem.name, is_available);
  }

  res.json({
    success: true,
    message: `Item ${is_available ? 'enabled' : 'disabled'} successfully`,
    data: {
      item_id: itemId,
      item_name: currentItem.name,
      old_availability: currentItem.is_available,
      new_availability: is_available
    }
  });
});

// @desc    Bulk update stock for multiple items
// @route   POST /api/admin/stock/bulk-update
// @access  Private (Admin)
const bulkUpdateStock = asyncHandler(async (req, res) => {
  const { updates } = req.body; // Array of {item_id, quantity, is_available}
  const canteenId = req.user.canteen_id;

  if (!Array.isArray(updates) || updates.length === 0) {
    throw new AppError('Updates must be a non-empty array', 400);
  }

  const validationSchema = Joi.array().items(
    Joi.object({
      item_id: Joi.number().integer().positive().required(),
      quantity: Joi.number().integer().min(0).optional(),
      is_available: Joi.boolean().optional()
    })
  );

  const { error } = validationSchema.validate(updates);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  const results = [];
  const io = req.app.get('io');

  // Process each update
  for (const update of updates) {
    const { item_id, quantity, is_available } = update;

    try {
      // Check if item exists and belongs to this canteen
      const { rows: items } = await db.execute(
        'SELECT * FROM menu_items WHERE item_id = ? AND canteen_id = ?',
        [item_id, canteenId]
      );

      if (items.length === 0) {
        results.push({
          item_id,
          success: false,
          error: 'Item not found or not authorized'
        });
        continue;
      }

      const currentItem = items[0];
      const updateFields = [];
      const updateValues = [];

      if (quantity !== undefined) {
        updateFields.push('available_quantity = ?');
        updateValues.push(quantity);
      }

      if (is_available !== undefined) {
        updateFields.push('is_available = ?');
        updateValues.push(is_available);
      } else if (quantity !== undefined) {
        // Auto-update availability based on quantity if not explicitly set
        updateFields.push('is_available = ?');
        updateValues.push(quantity > 0);
      }

      if (updateFields.length > 0) {
        updateFields.push('updated_at = NOW()');
        updateValues.push(item_id);

        await db.execute(
          `UPDATE menu_items SET ${updateFields.join(', ')} WHERE item_id = ?`,
          updateValues
        );

        // Get updated item for real-time broadcast
        const { rows: updatedItem } = await db.execute(
          'SELECT * FROM menu_items WHERE item_id = ?',
          [item_id]
        );

        // Emit real-time update
        if (io) {
          emitMenuItemUpdate(io, canteenId, updatedItem[0]);
        }

        results.push({
          item_id,
          success: true,
          item_name: currentItem.name,
          old_quantity: currentItem.available_quantity,
          new_quantity: quantity !== undefined ? quantity : currentItem.available_quantity,
          old_availability: currentItem.is_available,
          new_availability: updatedItem[0].is_available
        });
      }
    } catch (itemError) {
      results.push({
        item_id,
        success: false,
        error: itemError.message
      });
    }
  }

  logger.logUserActivity(req.user.admin_id, 'BULK_STOCK_UPDATE', {
    canteen_id: canteenId,
    updates_count: updates.length,
    successful_updates: results.filter(r => r.success).length
  });

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  res.json({
    success: true,
    message: `Bulk update completed: ${successful} successful, ${failed} failed`,
    data: {
      results,
      summary: {
        total: updates.length,
        successful,
        failed
      }
    }
  });
});

// Add new routes
router.put('/stock/:itemId', setStockQuantity);
router.patch('/stock/:itemId/availability', toggleItemAvailability);
router.post('/stock/bulk-update', bulkUpdateStock);

module.exports = router;
