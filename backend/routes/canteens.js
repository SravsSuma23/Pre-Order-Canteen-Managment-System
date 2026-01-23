const express = require('express');
const Joi = require('joi');

const db = require('../config/database');
const { asyncHandler, AppError } = require('../middleware/errorMiddleware');
const { optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// @desc    Get all active canteens
// @route   GET /api/canteens
// @access  Public
const getCanteens = asyncHandler(async (req, res) => {
  const { rows } = await db.execute(
    `SELECT canteen_id, name, location, contact, description, opening_hours, created_at 
     FROM canteens 
     WHERE is_active = true 
     ORDER BY name`
  );

  res.json({
    success: true,
    count: rows.length,
    data: {
      canteens: rows
    }
  });
});

// @desc    Get single canteen by ID
// @route   GET /api/canteens/:id
// @access  Public
const getCanteen = asyncHandler(async (req, res) => {
  const canteenId = parseInt(req.params.id);

  if (!canteenId) {
    throw new AppError('Invalid canteen ID', 400);
  }

  const { rows } = await db.execute(
    `SELECT canteen_id, name, location, contact, description, opening_hours, created_at 
     FROM canteens 
     WHERE canteen_id = ? AND is_active = true`,
    [canteenId]
  );

  if (rows.length === 0) {
    throw new AppError('Canteen not found', 404);
  }

  res.json({
    success: true,
    data: {
      canteen: rows[0]
    }
  });
});

// @desc    Get menu items for a canteen
// @route   GET /api/canteens/:id/menu
// @access  Public
const getCanteenMenu = asyncHandler(async (req, res) => {
  const canteenId = parseInt(req.params.id);
  const { category, is_veg, available_only } = req.query;

  if (!canteenId) {
    throw new AppError('Invalid canteen ID', 400);
  }

  // Check if canteen exists
  const { rows: canteenRows } = await db.execute(
    'SELECT canteen_id FROM canteens WHERE canteen_id = ? AND is_active = true',
    [canteenId]
  );

  if (canteenRows.length === 0) {
    throw new AppError('Canteen not found', 404);
  }

  // Build menu query
  let query = `
    SELECT item_id, name, description, price, category, is_veg, image_url, 
           available_quantity, is_available, rating, total_ratings, created_at
    FROM menu_items 
    WHERE canteen_id = ?
  `;
  const params = [canteenId];

  // Add filters
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  if (is_veg !== undefined) {
    query += ' AND is_veg = ?';
    params.push(is_veg === 'true' ? 1 : 0);
  }

  if (available_only === 'true') {
    query += ' AND is_available = true AND available_quantity > 0';
  }

  query += ' ORDER BY category, name';

  const { rows } = await db.execute(query, params);

  // Group items by category
  const menuByCategory = {};
  rows.forEach(item => {
    if (!menuByCategory[item.category]) {
      menuByCategory[item.category] = [];
    }
    menuByCategory[item.category].push({
      ...item,
      vegetarian: Boolean(item.is_veg),
      available: item.available_quantity
    });
  });

  res.json({
    success: true,
    count: rows.length,
    data: {
      canteen_id: canteenId,
      menu_items: rows,
      menu_by_category: menuByCategory
    }
  });
});

// @desc    Search menu items across all canteens
// @route   GET /api/canteens/search
// @access  Public
const searchMenuItems = asyncHandler(async (req, res) => {
  const { q, category, is_veg, min_price, max_price, canteen_id } = req.query;

  if (!q || q.trim().length < 2) {
    throw new AppError('Search query must be at least 2 characters', 400);
  }

  let query = `
    SELECT m.item_id, m.name, m.description, m.price, m.category, m.is_veg, 
           m.image_url, m.available_quantity, m.is_available, m.rating, 
           c.canteen_id, c.name as canteen_name, c.location as canteen_location
    FROM menu_items m
    JOIN canteens c ON m.canteen_id = c.canteen_id
    WHERE c.is_active = true AND m.is_available = true 
    AND (m.name LIKE ? OR m.description LIKE ?)
  `;
  
  const searchTerm = `%${q.trim()}%`;
  const params = [searchTerm, searchTerm];

  // Add filters
  if (category) {
    query += ' AND m.category = ?';
    params.push(category);
  }

  if (is_veg !== undefined) {
    query += ' AND m.is_veg = ?';
    params.push(is_veg === 'true' ? 1 : 0);
  }

  if (min_price) {
    query += ' AND m.price >= ?';
    params.push(parseFloat(min_price));
  }

  if (max_price) {
    query += ' AND m.price <= ?';
    params.push(parseFloat(max_price));
  }

  if (canteen_id) {
    query += ' AND c.canteen_id = ?';
    params.push(parseInt(canteen_id));
  }

  query += ' ORDER BY m.rating DESC, m.name LIMIT 50';

  const { rows } = await db.execute(query, params);

  res.json({
    success: true,
    count: rows.length,
    data: {
      search_query: q,
      menu_items: rows.map(item => ({
        ...item,
        vegetarian: Boolean(item.is_veg),
        available: item.available_quantity
      }))
    }
  });
});

// Routes
router.get('/', optionalAuth, getCanteens);
router.get('/search', optionalAuth, searchMenuItems);
router.get('/:id', optionalAuth, getCanteen);
router.get('/:id/menu', optionalAuth, getCanteenMenu);

module.exports = router;