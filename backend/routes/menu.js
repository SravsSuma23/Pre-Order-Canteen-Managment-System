const express = require('express');
const Joi = require('joi');

const db = require('../config/database');
const { asyncHandler, AppError } = require('../middleware/errorMiddleware');
const { optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// @desc    Get menu item by ID
// @route   GET /api/menu/:itemId
// @access  Public
const getMenuItem = asyncHandler(async (req, res) => {
  const { itemId } = req.params;

  const { rows } = await db.execute(`
    SELECT 
      m.*,
      c.name as canteen_name,
      c.location as canteen_location
    FROM menu_items m
    JOIN canteens c ON m.canteen_id = c.canteen_id
    WHERE m.item_id = ? AND m.is_available = true AND c.is_active = true
  `, [parseInt(itemId)]);

  if (rows.length === 0) {
    throw new AppError('Menu item not found', 404);
  }

  const item = rows[0];

  res.json({
    success: true,
    data: {
      item: {
        ...item,
        vegetarian: Boolean(item.is_veg),
        available: item.available_quantity
      }
    }
  });
});

// @desc    Get menu items by canteen
// @route   GET /api/menu/canteen/:canteenId
// @access  Public
const getMenuByCanteen = asyncHandler(async (req, res) => {
  const { canteenId } = req.params;
  const { category, veg_only, search } = req.query;

  let query = `
    SELECT 
      m.item_id,
      m.name,
      m.description,
      m.price,
      m.category,
      m.is_veg,
      m.image_url,
      m.available_quantity,
      m.rating,
      m.total_ratings,
      c.name as canteen_name
    FROM menu_items m
    JOIN canteens c ON m.canteen_id = c.canteen_id
    WHERE m.canteen_id = ? AND m.is_available = true AND c.is_active = true
  `;
  
  const params = [parseInt(canteenId)];

  if (category && category !== 'All Categories') {
    query += ' AND m.category = ?';
    params.push(category);
  }

  if (veg_only === 'true') {
    query += ' AND m.is_veg = true';
  }

  if (search) {
    query += ' AND (m.name LIKE ? OR m.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY m.category, m.name';

  const { rows } = await db.execute(query, params);

  res.json({
    success: true,
    data: {
      items: rows.map(item => ({
        ...item,
        vegetarian: Boolean(item.is_veg),
        available: item.available_quantity
      }))
    }
  });
});

// @desc    Get menu categories
// @route   GET /api/menu/categories
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
  const { canteen_id } = req.query;

  let query = `
    SELECT DISTINCT category, COUNT(*) as item_count
    FROM menu_items m
    JOIN canteens c ON m.canteen_id = c.canteen_id
    WHERE m.is_available = true AND c.is_active = true
  `;
  
  const params = [];

  if (canteen_id) {
    query += ' AND m.canteen_id = ?';
    params.push(parseInt(canteen_id));
  }

  query += ' GROUP BY category ORDER BY category';

  const { rows } = await db.execute(query, params);

  res.json({
    success: true,
    data: {
      categories: rows
    }
  });
});

// Routes
router.get('/categories', optionalAuth, getCategories);
router.get('/canteen/:canteenId', optionalAuth, getMenuByCanteen);
router.get('/:itemId', optionalAuth, getMenuItem);

module.exports = router;