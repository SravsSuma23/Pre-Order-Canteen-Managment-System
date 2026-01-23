const express = require('express');
const Joi = require('joi');

const db = require('../config/database');
const { asyncHandler, AppError } = require('../middleware/errorMiddleware');
const { protect, authorize } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

const router = express.Router();

// All admin routes require authentication and admin/canteen_staff role
router.use(protect);
router.use(authorize('admin', 'canteen_staff'));

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/stats
// @access  Private (Admin/Staff)
const getDashboardStats = asyncHandler(async (req, res) => {
  const { period = '7d' } = req.query;

  let dateFilter = '';
  switch (period) {
    case '1d':
      dateFilter = 'AND DATE(o.created_at) = CURDATE()';
      break;
    case '7d':
      dateFilter = 'AND o.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
      break;
    case '30d':
      dateFilter = 'AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
      break;
    default:
      dateFilter = 'AND o.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
  }

  // Get overall statistics
  const { rows: overallStats } = await db.execute(`
    SELECT 
      COUNT(DISTINCT o.order_id) as total_orders,
      COUNT(DISTINCT CASE WHEN o.payment_status = 'paid' THEN o.order_id END) as paid_orders,
      COUNT(DISTINCT CASE WHEN o.order_status = 'completed' THEN o.order_id END) as completed_orders,
      COUNT(DISTINCT CASE WHEN o.order_status = 'cancelled' THEN o.order_id END) as cancelled_orders,
      COALESCE(SUM(CASE WHEN o.payment_status = 'paid' THEN o.total_amount ELSE 0 END), 0) as total_revenue,
      AVG(CASE WHEN o.payment_status = 'paid' THEN o.total_amount END) as avg_order_value,
      COUNT(DISTINCT o.user_id) as unique_customers
    FROM orders o 
    WHERE 1=1 ${dateFilter}
  `);

  // Get orders by status
  const { rows: statusStats } = await db.execute(`
    SELECT 
      o.order_status,
      COUNT(*) as count
    FROM orders o 
    WHERE 1=1 ${dateFilter}
    GROUP BY o.order_status
  `);

  // Get top menu items
  const { rows: topItems } = await db.execute(`
    SELECT 
      oi.item_name,
      SUM(oi.quantity) as total_ordered,
      COUNT(DISTINCT oi.order_id) as order_count,
      AVG(oi.unit_price) as avg_price
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.order_id
    WHERE o.payment_status = 'paid' ${dateFilter}
    GROUP BY oi.item_name, oi.item_id
    ORDER BY total_ordered DESC
    LIMIT 10
  `);

  // Get canteen performance
  const { rows: canteenStats } = await db.execute(`
    SELECT 
      c.name as canteen_name,
      COUNT(DISTINCT o.order_id) as total_orders,
      COALESCE(SUM(CASE WHEN o.payment_status = 'paid' THEN o.total_amount ELSE 0 END), 0) as revenue
    FROM canteens c
    LEFT JOIN orders o ON c.canteen_id = o.canteen_id ${dateFilter.replace('AND', 'AND o.order_id IS NOT NULL AND')}
    WHERE c.is_active = true
    GROUP BY c.canteen_id, c.name
    ORDER BY revenue DESC
  `);

  // Get recent orders
  const { rows: recentOrders } = await db.execute(`
    SELECT 
      o.order_id,
      o.created_at,
      o.total_amount,
      o.order_status,
      o.payment_status,
      u.name as customer_name,
      c.name as canteen_name
    FROM orders o
    JOIN users u ON o.user_id = u.user_id
    JOIN canteens c ON o.canteen_id = c.canteen_id
    ORDER BY o.created_at DESC
    LIMIT 10
  `);

  res.json({
    success: true,
    data: {
      period,
      overview: overallStats[0],
      orders_by_status: statusStats,
      top_menu_items: topItems,
      canteen_performance: canteenStats,
      recent_orders: recentOrders
    }
  });
});

// @desc    Get all orders for admin/canteen staff
// @route   GET /api/admin/orders
// @access  Private (Admin/Staff)
const getAllOrders = asyncHandler(async (req, res) => {
  const { 
    status, 
    payment_status, 
    canteen_id, 
    limit = 50, 
    offset = 0,
    date_from,
    date_to,
    search
  } = req.query;

  let query = `
    SELECT 
      o.order_id,
      o.pickup_time,
      o.total_amount,
      o.payment_status,
      o.order_status,
      o.created_at,
      u.name as customer_name,
      u.phone as customer_phone,
      u.email as customer_email,
      c.name as canteen_name,
      c.location as canteen_location,
      COUNT(oi.id) as total_items
    FROM orders o
    JOIN users u ON o.user_id = u.user_id
    JOIN canteens c ON o.canteen_id = c.canteen_id
    LEFT JOIN order_items oi ON o.order_id = oi.order_id
    WHERE 1=1
  `;
  
  const params = [];

  // Apply filters
  if (status) {
    query += ' AND o.order_status = ?';
    params.push(status);
  }

  if (payment_status) {
    query += ' AND o.payment_status = ?';
    params.push(payment_status);
  }

  if (canteen_id) {
    query += ' AND o.canteen_id = ?';
    params.push(parseInt(canteen_id));
  }

  if (date_from) {
    query += ' AND DATE(o.created_at) >= ?';
    params.push(date_from);
  }

  if (date_to) {
    query += ' AND DATE(o.created_at) <= ?';
    params.push(date_to);
  }

  if (search) {
    query += ' AND (o.order_id LIKE ? OR u.name LIKE ? OR u.phone LIKE ? OR u.email LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  query += ' GROUP BY o.order_id ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const { rows } = await db.execute(query, params);

  // Get total count
  let countQuery = query.replace(/SELECT .* FROM/, 'SELECT COUNT(DISTINCT o.order_id) as total FROM');
  countQuery = countQuery.replace(/GROUP BY .* ORDER BY .* LIMIT .* OFFSET .*$/, '');
  
  const { rows: countRows } = await db.execute(countQuery, params.slice(0, -2));
  const totalCount = countRows[0]?.total || 0;

  res.json({
    success: true,
    count: rows.length,
    total: totalCount,
    data: {
      orders: rows
    }
  });
});

// @desc    Get pending orders (orders that need attention)
// @route   GET /api/admin/orders/pending
// @access  Private (Admin/Staff)
const getPendingOrders = asyncHandler(async (req, res) => {
  const { canteen_id } = req.query;

  let query = `
    SELECT 
      o.order_id,
      o.pickup_time,
      o.total_amount,
      o.order_status,
      o.special_instructions,
      o.created_at,
      u.name as customer_name,
      u.phone as customer_phone,
      c.name as canteen_name,
      COUNT(oi.id) as total_items,
      TIMESTAMPDIFF(MINUTE, o.created_at, NOW()) as minutes_since_order
    FROM orders o
    JOIN users u ON o.user_id = u.user_id
    JOIN canteens c ON o.canteen_id = c.canteen_id
    LEFT JOIN order_items oi ON o.order_id = oi.order_id
    WHERE o.payment_status = 'paid' 
    AND o.order_status IN ('placed', 'confirmed', 'preparing')
  `;
  
  const params = [];

  if (canteen_id) {
    query += ' AND o.canteen_id = ?';
    params.push(parseInt(canteen_id));
  }

  query += ' GROUP BY o.order_id ORDER BY o.pickup_time ASC';

  const { rows } = await db.execute(query, params);

  res.json({
    success: true,
    count: rows.length,
    data: {
      pending_orders: rows
    }
  });
});

// @desc    Update order status
// @route   PATCH /api/admin/orders/:orderId/status
// @access  Private (Admin/Staff)
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { status, notes } = req.body;

  const validStatuses = ['placed', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    throw new AppError('Invalid order status', 400);
  }

  // Get current order
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

  // If cancelled and was paid, you might want to initiate refund process here
  if (status === 'cancelled' && order.payment_status === 'paid') {
    // Add refund logic here if needed
    logger.info(`Order ${orderId} cancelled - refund may be required`);
  }

  logger.logUserActivity(req.user.user_id, 'ORDER_STATUS_UPDATED', {
    order_id: orderId,
    old_status: order.order_status,
    new_status: status,
    notes,
    admin_action: true
  });

  res.json({
    success: true,
    message: `Order status updated to ${status}`,
    data: {
      order_id: orderId,
      old_status: order.order_status,
      new_status: status,
      updated_at: new Date().toISOString()
    }
  });
});

// @desc    Get user management data
// @route   GET /api/admin/users
// @access  Private (Admin only)
const getUsers = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    throw new AppError('Only admins can access user management', 403);
  }

  const { role, search, limit = 50, offset = 0 } = req.query;

  let query = `
    SELECT 
      user_id,
      name,
      email,
      phone,
      role,
      is_active,
      created_at,
      (SELECT COUNT(*) FROM orders WHERE user_id = u.user_id) as total_orders,
      (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE user_id = u.user_id AND payment_status = 'paid') as total_spent
    FROM users u
    WHERE 1=1
  `;
  
  const params = [];

  if (role) {
    query += ' AND role = ?';
    params.push(role);
  }

  if (search) {
    query += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const { rows } = await db.execute(query, params);

  res.json({
    success: true,
    count: rows.length,
    data: {
      users: rows
    }
  });
});

// @desc    Toggle user active status
// @route   PATCH /api/admin/users/:userId/toggle-status
// @access  Private (Admin only)
const toggleUserStatus = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    throw new AppError('Only admins can manage users', 403);
  }

  const { userId } = req.params;

  const { rows: userRows } = await db.execute(
    'SELECT user_id, name, email, is_active FROM users WHERE user_id = ?',
    [userId]
  );

  if (userRows.length === 0) {
    throw new AppError('User not found', 404);
  }

  const user = userRows[0];
  const newStatus = !user.is_active;

  await db.execute(
    'UPDATE users SET is_active = ?, updated_at = NOW() WHERE user_id = ?',
    [newStatus, userId]
  );

  // Invalidate user sessions if deactivating
  if (!newStatus) {
    await db.execute(
      'UPDATE user_sessions SET is_active = false WHERE user_id = ?',
      [userId]
    );
  }

  logger.logUserActivity(req.user.user_id, 'USER_STATUS_CHANGED', {
    target_user_id: userId,
    target_user_email: user.email,
    old_status: user.is_active,
    new_status: newStatus
  });

  res.json({
    success: true,
    message: `User ${newStatus ? 'activated' : 'deactivated'} successfully`,
    data: {
      user_id: userId,
      is_active: newStatus
    }
  });
});

// @desc    Get menu item performance
// @route   GET /api/admin/menu/performance
// @access  Private (Admin/Staff)
const getMenuPerformance = asyncHandler(async (req, res) => {
  const { canteen_id, period = '30d' } = req.query;

  let dateFilter = '';
  switch (period) {
    case '7d':
      dateFilter = 'AND o.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
      break;
    case '30d':
      dateFilter = 'AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
      break;
    case '90d':
      dateFilter = 'AND o.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)';
      break;
    default:
      dateFilter = 'AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
  }

  let query = `
    SELECT 
      m.item_id,
      m.name,
      m.category,
      m.price,
      m.available_quantity,
      c.name as canteen_name,
      COALESCE(SUM(oi.quantity), 0) as total_ordered,
      COUNT(DISTINCT oi.order_id) as order_count,
      COALESCE(SUM(oi.total_price), 0) as total_revenue,
      m.rating,
      m.total_ratings
    FROM menu_items m
    JOIN canteens c ON m.canteen_id = c.canteen_id
    LEFT JOIN order_items oi ON m.item_id = oi.item_id
    LEFT JOIN orders o ON oi.order_id = o.order_id AND o.payment_status = 'paid' ${dateFilter}
    WHERE m.is_available = true
  `;
  
  const params = [];

  if (canteen_id) {
    query += ' AND m.canteen_id = ?';
    params.push(parseInt(canteen_id));
  }

  query += ' GROUP BY m.item_id ORDER BY total_ordered DESC';

  const { rows } = await db.execute(query, params);

  res.json({
    success: true,
    data: {
      period,
      menu_performance: rows
    }
  });
});

// @desc    Get system logs (Admin only)
// @route   GET /api/admin/logs
// @access  Private (Admin only)
const getSystemLogs = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    throw new AppError('Only admins can view system logs', 403);
  }

  const { action, user_id, limit = 100, offset = 0 } = req.query;

  let query = `
    SELECT 
      log_id,
      user_id,
      action,
      table_name,
      record_id,
      ip_address,
      created_at
    FROM audit_logs
    WHERE 1=1
  `;
  
  const params = [];

  if (action) {
    query += ' AND action = ?';
    params.push(action);
  }

  if (user_id) {
    query += ' AND user_id = ?';
    params.push(user_id);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const { rows } = await db.execute(query, params);

  res.json({
    success: true,
    count: rows.length,
    data: {
      logs: rows
    }
  });
});

// Routes
router.get('/stats', getDashboardStats);
router.get('/orders', getAllOrders);
router.get('/orders/pending', getPendingOrders);
router.patch('/orders/:orderId/status', updateOrderStatus);
router.get('/users', getUsers);
router.patch('/users/:userId/toggle-status', toggleUserStatus);
router.get('/menu/performance', getMenuPerformance);
router.get('/logs', getSystemLogs);

module.exports = router;