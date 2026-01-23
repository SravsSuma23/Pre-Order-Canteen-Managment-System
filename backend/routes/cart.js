const express = require('express');
const Joi = require('joi');

const db = require('../config/database');
const { asyncHandler, AppError } = require('../middleware/errorMiddleware');
const { protect } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

const router = express.Router();

// Validation schemas
const addToCartSchema = Joi.object({
  item_id: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().min(1).max(10).required()
});

const updateCartSchema = Joi.object({
  quantity: Joi.number().integer().min(0).max(10).required()
});

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
const getCart = asyncHandler(async (req, res) => {
  logger.info(`Getting cart for user: ${req.user.user_id}`);
  
  const { rows } = await db.execute(`
    SELECT 
      c.cart_id,
      c.quantity,
      c.created_at,
      m.item_id,
      m.name,
      m.description,
      m.price,
      m.image_url,
      m.is_veg as vegetarian,
      m.available_quantity,
      m.is_available,
      can.canteen_id,
      can.name as canteen_name,
      can.location as canteen_location
    FROM cart c
    JOIN menu_items m ON c.item_id = m.item_id
    JOIN canteens can ON m.canteen_id = can.canteen_id
    WHERE c.user_id = ? AND m.is_available = true AND can.is_active = true
    ORDER BY c.created_at DESC
  `, [req.user.user_id]);

  // Calculate totals
  let subtotal = 0;
  let totalItems = 0;
  const cartItems = rows.map(item => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;
    totalItems += item.quantity;
    
    return {
      ...item,
      item_total: itemTotal,
      vegetarian: Boolean(item.vegetarian)
    };
  });

  const taxRate = parseFloat(process.env.DEFAULT_TAX_RATE) || 0.05;
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  res.json({
    success: true,
    data: {
      cart_items: cartItems,
      summary: {
        total_items: totalItems,
        subtotal: subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total: total
      }
    }
  });
});

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
const addToCart = asyncHandler(async (req, res) => {
  const { error, value } = addToCartSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  const { item_id, quantity } = value;

  // Check if item exists and is available
  const { rows: itemRows } = await db.execute(`
    SELECT m.*, c.name as canteen_name
    FROM menu_items m
    JOIN canteens c ON m.canteen_id = c.canteen_id
    WHERE m.item_id = ? AND m.is_available = true AND c.is_active = true
  `, [item_id]);

  if (itemRows.length === 0) {
    throw new AppError('Menu item not found or not available', 404);
  }

  const item = itemRows[0];

  // Check if requested quantity is available
  if (quantity > item.available_quantity) {
    throw new AppError(`Only ${item.available_quantity} items available`, 400);
  }

  // Check if item already exists in cart
  const { rows: existingCart } = await db.execute(
    'SELECT cart_id, quantity FROM cart WHERE user_id = ? AND item_id = ?',
    [req.user.user_id, item_id]
  );

  if (existingCart.length > 0) {
    // Update existing cart item
    const newQuantity = existingCart[0].quantity + quantity;
    
    if (newQuantity > item.available_quantity) {
      throw new AppError(`Cannot add ${quantity} more. Only ${item.available_quantity - existingCart[0].quantity} more items can be added`, 400);
    }

    if (newQuantity > 10) {
      throw new AppError('Cannot add more than 10 items of same type', 400);
    }

    await db.execute(
      'UPDATE cart SET quantity = ?, updated_at = NOW() WHERE cart_id = ?',
      [newQuantity, existingCart[0].cart_id]
    );

    logger.logUserActivity(req.user.user_id, 'CART_UPDATED', {
      item_id,
      old_quantity: existingCart[0].quantity,
      new_quantity: newQuantity
    });
  } else {
    // Add new item to cart
    await db.execute(
      'INSERT INTO cart (user_id, item_id, quantity) VALUES (?, ?, ?)',
      [req.user.user_id, item_id, quantity]
    );

    logger.logUserActivity(req.user.user_id, 'ITEM_ADDED_TO_CART', {
      item_id,
      quantity,
      item_name: item.name
    });
  }

  res.status(201).json({
    success: true,
    message: 'Item added to cart successfully',
    data: {
      item: {
        item_id: item.item_id,
        name: item.name,
        price: item.price,
        canteen_name: item.canteen_name
      },
      quantity
    }
  });
});

// @desc    Update cart item quantity
// @route   PUT /api/cart/:cartId
// @access  Private
const updateCartItem = asyncHandler(async (req, res) => {
  const { error, value } = updateCartSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  const { quantity } = value;
  const cartId = parseInt(req.params.cartId);

  if (!cartId) {
    throw new AppError('Invalid cart ID', 400);
  }

  // Check if cart item belongs to user
  const { rows: cartRows } = await db.execute(`
    SELECT c.*, m.name, m.available_quantity
    FROM cart c
    JOIN menu_items m ON c.item_id = m.item_id
    WHERE c.cart_id = ? AND c.user_id = ?
  `, [cartId, req.user.user_id]);

  if (cartRows.length === 0) {
    throw new AppError('Cart item not found', 404);
  }

  const cartItem = cartRows[0];

  if (quantity === 0) {
    // Remove item from cart
    await db.execute('DELETE FROM cart WHERE cart_id = ?', [cartId]);
    
    logger.logUserActivity(req.user.user_id, 'ITEM_REMOVED_FROM_CART', {
      item_id: cartItem.item_id,
      item_name: cartItem.name
    });

    return res.json({
      success: true,
      message: 'Item removed from cart'
    });
  }

  // Check availability
  if (quantity > cartItem.available_quantity) {
    throw new AppError(`Only ${cartItem.available_quantity} items available`, 400);
  }

  // Update quantity
  await db.execute(
    'UPDATE cart SET quantity = ?, updated_at = NOW() WHERE cart_id = ?',
    [quantity, cartId]
  );

  logger.logUserActivity(req.user.user_id, 'CART_QUANTITY_UPDATED', {
    item_id: cartItem.item_id,
    old_quantity: cartItem.quantity,
    new_quantity: quantity
  });

  res.json({
    success: true,
    message: 'Cart updated successfully',
    data: {
      cart_id: cartId,
      quantity
    }
  });
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/:cartId
// @access  Private
const removeFromCart = asyncHandler(async (req, res) => {
  const cartId = parseInt(req.params.cartId);

  if (!cartId) {
    throw new AppError('Invalid cart ID', 400);
  }

  // Check if cart item belongs to user
  const { rows: cartRows } = await db.execute(`
    SELECT c.*, m.name
    FROM cart c
    JOIN menu_items m ON c.item_id = m.item_id
    WHERE c.cart_id = ? AND c.user_id = ?
  `, [cartId, req.user.user_id]);

  if (cartRows.length === 0) {
    throw new AppError('Cart item not found', 404);
  }

  const cartItem = cartRows[0];

  await db.execute('DELETE FROM cart WHERE cart_id = ?', [cartId]);

  logger.logUserActivity(req.user.user_id, 'ITEM_REMOVED_FROM_CART', {
    item_id: cartItem.item_id,
    item_name: cartItem.name
  });

  res.json({
    success: true,
    message: 'Item removed from cart successfully'
  });
});

// @desc    Clear entire cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = asyncHandler(async (req, res) => {
  const { rows } = await db.execute(
    'SELECT COUNT(*) as count FROM cart WHERE user_id = ?',
    [req.user.user_id]
  );

  const itemCount = rows[0].count;

  await db.execute('DELETE FROM cart WHERE user_id = ?', [req.user.user_id]);

  logger.logUserActivity(req.user.user_id, 'CART_CLEARED', {
    items_removed: itemCount
  });

  res.json({
    success: true,
    message: `Cart cleared successfully. ${itemCount} items removed.`
  });
});

// @desc    Get cart summary (for checkout)
// @route   GET /api/cart/summary
// @access  Private
const getCartSummary = asyncHandler(async (req, res) => {
  const { rows } = await db.execute(`
    SELECT 
      c.quantity,
      m.item_id,
      m.name,
      m.price,
      m.canteen_id,
      can.name as canteen_name
    FROM cart c
    JOIN menu_items m ON c.item_id = m.item_id
    JOIN canteens can ON m.canteen_id = can.canteen_id
    WHERE c.user_id = ? AND m.is_available = true AND can.is_active = true
  `, [req.user.user_id]);

  if (rows.length === 0) {
    throw new AppError('Cart is empty', 400);
  }

  // Group by canteen (orders can only be from one canteen at a time)
  const canteenGroups = {};
  rows.forEach(item => {
    if (!canteenGroups[item.canteen_id]) {
      canteenGroups[item.canteen_id] = {
        canteen_id: item.canteen_id,
        canteen_name: item.canteen_name,
        items: [],
        subtotal: 0
      };
    }
    
    const itemTotal = item.price * item.quantity;
    canteenGroups[item.canteen_id].items.push({
      item_id: item.item_id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      item_total: itemTotal
    });
    canteenGroups[item.canteen_id].subtotal += itemTotal;
  });

  const canteenCount = Object.keys(canteenGroups).length;

  if (canteenCount > 1) {
    throw new AppError('Cart contains items from multiple canteens. Please order from one canteen at a time.', 400);
  }

  const canteenOrder = Object.values(canteenGroups)[0];
  const taxRate = parseFloat(process.env.DEFAULT_TAX_RATE) || 0.05;
  const taxAmount = canteenOrder.subtotal * taxRate;
  const total = canteenOrder.subtotal + taxAmount;

  res.json({
    success: true,
    data: {
      canteen: {
        canteen_id: canteenOrder.canteen_id,
        name: canteenOrder.canteen_name
      },
      items: canteenOrder.items,
      summary: {
        subtotal: canteenOrder.subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total: total,
        total_items: canteenOrder.items.length
      }
    }
  });
});

// Routes
router.use(protect); // All cart routes require authentication

router.get('/', getCart);
router.get('/summary', getCartSummary);
router.post('/', addToCart);
router.put('/:cartId', updateCartItem);
router.delete('/:cartId', removeFromCart);
router.delete('/', clearCart);

module.exports = router;