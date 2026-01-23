-- Canteens and Menu Management Schema
-- This schema supports three canteens: Main, IT, and MBA with their respective menu items

-- Update existing canteens table to include the three specific canteens
INSERT INTO canteens (name, location, contact, description, opening_hours) VALUES
('Main Canteen', 'Ground Floor, Main Block', '+91-80-12345001', 'Main campus canteen serving both vegetarian and non-vegetarian items', '{"monday": "8:00-20:00", "tuesday": "8:00-20:00", "wednesday": "8:00-20:00", "thursday": "8:00-20:00", "friday": "8:00-20:00", "saturday": "8:00-14:00", "sunday": "closed"}'),
('IT Canteen', 'Ground Floor, IT Block', '+91-80-12345002', 'IT department canteen with variety of veg and non-veg options', '{"monday": "8:00-20:00", "tuesday": "8:00-20:00", "wednesday": "8:00-20:00", "thursday": "8:00-20:00", "friday": "8:00-20:00", "saturday": "8:00-14:00", "sunday": "closed"}'),
('MBA Canteen', 'Ground Floor, MBA Block', '+91-80-12345003', 'MBA block canteen serving exclusively vegetarian items', '{"monday": "8:00-20:00", "tuesday": "8:00-20:00", "wednesday": "8:00-20:00", "thursday": "8:00-20:00", "friday": "8:00-20:00", "saturday": "8:00-14:00", "sunday": "closed"}')
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    location = VALUES(location),
    contact = VALUES(contact),
    description = VALUES(description),
    opening_hours = VALUES(opening_hours);

-- Add new columns to menu_items table for better inventory management
-- Check if columns exist and add them if they don't
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'menu_items' AND COLUMN_NAME = 'low_stock_threshold') > 0,
    'SELECT "Column low_stock_threshold already exists"',
    'ALTER TABLE menu_items ADD COLUMN low_stock_threshold INT DEFAULT 5'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'menu_items' AND COLUMN_NAME = 'last_updated') > 0,
    'SELECT "Column last_updated already exists"',
    'ALTER TABLE menu_items ADD COLUMN last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'menu_items' AND COLUMN_NAME = 'category_type') > 0,
    'SELECT "Column category_type already exists"',
    'ALTER TABLE menu_items ADD COLUMN category_type ENUM(\'VEG\', \'NON_VEG\') NOT NULL DEFAULT \'VEG\''
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create admin users for each canteen
INSERT INTO admins (name, username, password_hash, role, canteen_id) VALUES
('Main Canteen Admin', 'main_admin', '$2b$10$8K1p2q3r4s5t6u7v8w9x0y', 'canteen_manager', (SELECT canteen_id FROM canteens WHERE name = 'Main Canteen')),
('IT Canteen Admin', 'it_admin', '$2b$10$8K1p2q3r4s5t6u7v8w9x0y', 'canteen_manager', (SELECT canteen_id FROM canteens WHERE name = 'IT Canteen')),
('MBA Canteen Admin', 'mba_admin', '$2b$10$8K1p2q3r4s5t6u7v8w9x0y', 'canteen_manager', (SELECT canteen_id FROM canteens WHERE name = 'MBA Canteen'))
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    password_hash = VALUES(password_hash),
    role = VALUES(role);

-- Insert menu items for Main Canteen (Veg + Non-Veg)
-- Main Canteen - Vegetarian Items
INSERT INTO menu_items (canteen_id, name, description, price, category, is_veg, category_type, available_quantity, is_available, low_stock_threshold) VALUES
((SELECT canteen_id FROM canteens WHERE name = 'Main Canteen'), 'Veg Fried Rice', 'Aromatic basmati rice with mixed vegetables', 80, 'Rice', 1, 'VEG', 25, 1, 5),
((SELECT canteen_id FROM canteens WHERE name = 'Main Canteen'), 'Paneer Butter Masala', 'Rich and creamy paneer curry', 120, 'Curry', 1, 'VEG', 20, 1, 5),
((SELECT canteen_id FROM canteens WHERE name = 'Main Canteen'), 'Veg Noodles', 'Stir-fried noodles with vegetables', 70, 'Noodles', 1, 'VEG', 30, 1, 5),
((SELECT canteen_id FROM canteens WHERE name = 'Main Canteen'), 'Gobi Manchurian', 'Crispy cauliflower in tangy sauce', 90, 'Starter', 1, 'VEG', 15, 1, 3),
((SELECT canteen_id FROM canteens WHERE name = 'Main Canteen'), 'Veg Biryani', 'Fragrant rice with mixed vegetables', 100, 'Biryani', 1, 'VEG', 20, 1, 5),
((SELECT canteen_id FROM canteens WHERE name = 'Main Canteen'), 'Chole Bhature', 'Spiced chickpeas with fried bread', 85, 'North Indian', 1, 'VEG', 18, 1, 4),
((SELECT canteen_id FROM canteens WHERE name = 'Main Canteen'), 'Veg Sandwich', 'Fresh vegetable sandwich', 50, 'Sandwich', 1, 'VEG', 35, 1, 8),
((SELECT canteen_id FROM canteens WHERE name = 'Main Canteen'), 'Masala Dosa', 'Crispy crepe with spiced potato filling', 60, 'South Indian', 1, 'VEG', 25, 1, 5),
((SELECT canteen_id FROM canteens WHERE name = 'Main Canteen'), 'Idli & Sambar', 'Steamed rice cakes with lentil curry', 45, 'South Indian', 1, 'VEG', 30, 1, 6),
((SELECT canteen_id FROM canteens WHERE name = 'Main Canteen'), 'Poori Curry', 'Deep-fried bread with curry', 65, 'North Indian', 1, 'VEG', 20, 1, 4),
((SELECT canteen_id FROM canteens WHERE name = 'Main Canteen'), 'Veg Pulao', 'Mildly spiced rice with vegetables', 75, 'Rice', 1, 'VEG', 22, 1, 5),
((SELECT canteen_id FROM canteens WHERE name = 'Main Canteen'), 'Veg Burger', 'Vegetarian burger with patty', 80, 'Burger', 1, 'VEG', 20, 1, 4),
((SELECT canteen_id FROM canteens WHERE name = 'Main Canteen'), 'Aloo Paratha', 'Stuffed flatbread with potato', 55, 'Paratha', 1, 'VEG', 25, 1, 5),
((SELECT canteen_id FROM canteens WHERE name = 'Main Canteen'), 'Veg Momos', 'Steamed dumplings with vegetables', 60, 'Momos', 1, 'VEG', 30, 1, 6),
((SELECT canteen_id FROM canteens WHERE name = 'Main Canteen'), 'Mixed Veg Curry', 'Assorted vegetables in curry', 70, 'Curry', 1, 'VEG', 18, 1, 4);

-- Main Canteen - Non-Vegetarian Items
INSERT INTO menu_items (canteen_id, name, description, price, category, is_veg, category_type, available_quantity, is_available, low_stock_threshold) VALUES
((SELECT canteen_id FROM canteens WHERE name = 'Main Canteen'), 'Chicken Fried Rice', 'Basmati rice with tender chicken pieces', 110, 'Rice', 0, 'NON_VEG', 20, 1, 4),
((SELECT canteen_id FROM canteens WHERE name = 'Main Canteen'), 'Egg Noodles', 'Stir-fried noodles with scrambled eggs', 80, 'Noodles', 0, 'NON_VEG', 25, 1, 5),
((SELECT canteen_id FROM canteens WHERE name = 'Main Canteen'), 'Chicken 65', 'Spicy fried chicken appetizer', 130, 'Starter', 0, 'NON_VEG', 15, 1, 3),
((SELECT canteen_id FROM canteens WHERE name = 'Main Canteen'), 'Chicken Biryani', 'Aromatic rice with marinated chicken', 140, 'Biryani', 0, 'NON_VEG', 18, 1, 4),
((SELECT canteen_id FROM canteens WHERE name = 'Main Canteen'), 'Fish Curry & Rice', 'Fresh fish curry with steamed rice', 120, 'Curry', 0, 'NON_VEG', 12, 1, 3),
((SELECT canteen_id FROM canteens WHERE name = 'Main Canteen'), 'Chicken Shawarma', 'Middle eastern chicken wrap', 90, 'Wrap', 0, 'NON_VEG', 20, 1, 4),
((SELECT canteen_id FROM canteens WHERE name = 'Main Canteen'), 'Chicken Roll', 'Spiced chicken wrapped in paratha', 85, 'Roll', 0, 'NON_VEG', 22, 1, 4),
((SELECT canteen_id FROM canteens WHERE name = 'Main Canteen'), 'Chicken Manchurian', 'Indo-Chinese chicken in sauce', 110, 'Starter', 0, 'NON_VEG', 18, 1, 4),
((SELECT canteen_id FROM canteens WHERE name = 'Main Canteen'), 'Egg Curry', 'Hard-boiled eggs in spicy curry', 70, 'Curry', 0, 'NON_VEG', 20, 1, 4),
((SELECT canteen_id FROM canteens WHERE name = 'Main Canteen'), 'Chicken Sandwich', 'Grilled chicken sandwich', 75, 'Sandwich', 0, 'NON_VEG', 25, 1, 5),
((SELECT canteen_id FROM canteens WHERE name = 'Main Canteen'), 'Chicken Burger', 'Juicy chicken burger', 95, 'Burger', 0, 'NON_VEG', 18, 1, 4),
((SELECT canteen_id FROM canteens WHERE name = 'Main Canteen'), 'Mutton Curry', 'Tender mutton in rich gravy', 160, 'Curry', 0, 'NON_VEG', 10, 1, 2),
((SELECT canteen_id FROM canteens WHERE name = 'Main Canteen'), 'Grilled Chicken', 'Herb-marinated grilled chicken', 125, 'Grilled', 0, 'NON_VEG', 15, 1, 3),
((SELECT canteen_id FROM canteens WHERE name = 'Main Canteen'), 'Butter Chicken', 'Creamy tomato-based chicken curry', 135, 'Curry', 0, 'NON_VEG', 16, 1, 3),
((SELECT canteen_id FROM canteens WHERE name = 'Main Canteen'), 'Egg Puff', 'Flaky pastry with spiced egg filling', 35, 'Snacks', 0, 'NON_VEG', 30, 1, 6);

-- Insert menu items for IT Canteen (Veg + Non-Veg)
-- IT Canteen - Vegetarian Items
INSERT INTO menu_items (canteen_id, name, description, price, category, is_veg, category_type, available_quantity, is_available, low_stock_threshold) VALUES
((SELECT canteen_id FROM canteens WHERE name = 'IT Canteen'), 'Veg Hakka Noodles', 'Indo-Chinese style vegetable noodles', 75, 'Noodles', 1, 'VEG', 28, 1, 5),
((SELECT canteen_id FROM canteens WHERE name = 'IT Canteen'), 'Veg Fried Rice', 'Wok-fried rice with mixed vegetables', 80, 'Rice', 1, 'VEG', 25, 1, 5),
((SELECT canteen_id FROM canteens WHERE name = 'IT Canteen'), 'Paneer Tikka', 'Grilled cottage cheese cubes', 100, 'Starter', 1, 'VEG', 20, 1, 4),
((SELECT canteen_id FROM canteens WHERE name = 'IT Canteen'), 'Veg Puff', 'Crispy pastry with vegetable filling', 30, 'Snacks', 1, 'VEG', 40, 1, 8),
((SELECT canteen_id FROM canteens WHERE name = 'IT Canteen'), 'Veg Cutlet', 'Deep-fried vegetable patties', 45, 'Snacks', 1, 'VEG', 35, 1, 7),
((SELECT canteen_id FROM canteens WHERE name = 'IT Canteen'), 'Veg Sandwich', 'Multi-layer vegetable sandwich', 50, 'Sandwich', 1, 'VEG', 30, 1, 6),
((SELECT canteen_id FROM canteens WHERE name = 'IT Canteen'), 'Masala Dosa', 'South Indian crepe with potato curry', 60, 'South Indian', 1, 'VEG', 25, 1, 5),
((SELECT canteen_id FROM canteens WHERE name = 'IT Canteen'), 'Onion Uttapam', 'Thick pancake with onion toppings', 55, 'South Indian', 1, 'VEG', 20, 1, 4),
((SELECT canteen_id FROM canteens WHERE name = 'IT Canteen'), 'Chapathi & Curry', 'Indian flatbread with curry', 65, 'North Indian', 1, 'VEG', 22, 1, 4),
((SELECT canteen_id FROM canteens WHERE name = 'IT Canteen'), 'Veg Biryani', 'Aromatic rice with mixed vegetables', 100, 'Biryani', 1, 'VEG', 20, 1, 4),
((SELECT canteen_id FROM canteens WHERE name = 'IT Canteen'), 'Veg Momos', 'Steamed vegetable dumplings', 60, 'Momos', 1, 'VEG', 30, 1, 6),
((SELECT canteen_id FROM canteens WHERE name = 'IT Canteen'), 'Veg Burger', 'Plant-based burger patty', 80, 'Burger', 1, 'VEG', 18, 1, 4),
((SELECT canteen_id FROM canteens WHERE name = 'IT Canteen'), 'Idli Sambar', 'Steamed rice cakes with lentil soup', 45, 'South Indian', 1, 'VEG', 30, 1, 6),
((SELECT canteen_id FROM canteens WHERE name = 'IT Canteen'), 'Lemon Rice', 'Tangy rice with curry leaves', 50, 'Rice', 1, 'VEG', 25, 1, 5),
((SELECT canteen_id FROM canteens WHERE name = 'IT Canteen'), 'Aloo Curry & Rice', 'Spiced potato curry with rice', 70, 'Curry', 1, 'VEG', 20, 1, 4);

-- IT Canteen - Non-Vegetarian Items
INSERT INTO menu_items (canteen_id, name, description, price, category, is_veg, category_type, available_quantity, is_available, low_stock_threshold) VALUES
((SELECT canteen_id FROM canteens WHERE name = 'IT Canteen'), 'Chicken Fried Rice', 'Wok-fried rice with chicken pieces', 110, 'Rice', 0, 'NON_VEG', 20, 1, 4),
((SELECT canteen_id FROM canteens WHERE name = 'IT Canteen'), 'Egg Fried Rice', 'Rice stir-fried with scrambled eggs', 85, 'Rice', 0, 'NON_VEG', 25, 1, 5),
((SELECT canteen_id FROM canteens WHERE name = 'IT Canteen'), 'Chicken Noodles', 'Stir-fried noodles with chicken', 95, 'Noodles', 0, 'NON_VEG', 22, 1, 4),
((SELECT canteen_id FROM canteens WHERE name = 'IT Canteen'), 'Chicken Puff', 'Flaky pastry with spiced chicken', 40, 'Snacks', 0, 'NON_VEG', 35, 1, 7),
((SELECT canteen_id FROM canteens WHERE name = 'IT Canteen'), 'Chicken Curry & Rice', 'Traditional chicken curry with rice', 115, 'Curry', 0, 'NON_VEG', 18, 1, 4),
((SELECT canteen_id FROM canteens WHERE name = 'IT Canteen'), 'Egg Roll', 'Scrambled eggs wrapped in paratha', 50, 'Roll', 0, 'NON_VEG', 28, 1, 6),
((SELECT canteen_id FROM canteens WHERE name = 'IT Canteen'), 'Chicken Roll', 'Spiced chicken wrapped in bread', 85, 'Roll', 0, 'NON_VEG', 22, 1, 4),
((SELECT canteen_id FROM canteens WHERE name = 'IT Canteen'), 'Chicken Biryani', 'Fragrant rice with marinated chicken', 140, 'Biryani', 0, 'NON_VEG', 15, 1, 3),
((SELECT canteen_id FROM canteens WHERE name = 'IT Canteen'), 'Fish Fry', 'Crispy fried fish fillets', 100, 'Fried', 0, 'NON_VEG', 12, 1, 3),
((SELECT canteen_id FROM canteens WHERE name = 'IT Canteen'), 'Egg Dosa', 'Crispy crepe with egg topping', 65, 'South Indian', 0, 'NON_VEG', 20, 1, 4),
((SELECT canteen_id FROM canteens WHERE name = 'IT Canteen'), 'Chicken Lollipop', 'Spicy chicken drumettes', 120, 'Starter', 0, 'NON_VEG', 16, 1, 3),
((SELECT canteen_id FROM canteens WHERE name = 'IT Canteen'), 'Egg Curry', 'Boiled eggs in spicy gravy', 70, 'Curry', 0, 'NON_VEG', 20, 1, 4),
((SELECT canteen_id FROM canteens WHERE name = 'IT Canteen'), 'Chicken Kebab', 'Grilled marinated chicken skewers', 110, 'Grilled', 0, 'NON_VEG', 14, 1, 3),
((SELECT canteen_id FROM canteens WHERE name = 'IT Canteen'), 'Chicken Sandwich', 'Grilled chicken breast sandwich', 75, 'Sandwich', 0, 'NON_VEG', 25, 1, 5),
((SELECT canteen_id FROM canteens WHERE name = 'IT Canteen'), 'Chicken Wrap', 'Spiced chicken in tortilla wrap', 90, 'Wrap', 0, 'NON_VEG', 20, 1, 4);

-- Insert menu items for MBA Canteen (Veg Only)
-- MBA Canteen - All Vegetarian Items
INSERT INTO menu_items (canteen_id, name, description, price, category, is_veg, category_type, available_quantity, is_available, low_stock_threshold) VALUES
((SELECT canteen_id FROM canteens WHERE name = 'MBA Canteen'), 'Veg Fried Rice', 'Aromatic rice with fresh vegetables', 80, 'Rice', 1, 'VEG', 25, 1, 5),
((SELECT canteen_id FROM canteens WHERE name = 'MBA Canteen'), 'Veg Biryani', 'Premium vegetable biryani', 100, 'Biryani', 1, 'VEG', 20, 1, 4),
((SELECT canteen_id FROM canteens WHERE name = 'MBA Canteen'), 'Paneer Butter Masala', 'Rich creamy paneer curry', 120, 'Curry', 1, 'VEG', 18, 1, 4),
((SELECT canteen_id FROM canteens WHERE name = 'MBA Canteen'), 'Veg Noodles', 'Indo-Chinese style vegetable noodles', 70, 'Noodles', 1, 'VEG', 30, 1, 6),
((SELECT canteen_id FROM canteens WHERE name = 'MBA Canteen'), 'Gobi Manchurian', 'Crispy cauliflower in tangy sauce', 90, 'Starter', 1, 'VEG', 15, 1, 3),
((SELECT canteen_id FROM canteens WHERE name = 'MBA Canteen'), 'Masala Dosa', 'Traditional South Indian crepe', 60, 'South Indian', 1, 'VEG', 25, 1, 5),
((SELECT canteen_id FROM canteens WHERE name = 'MBA Canteen'), 'Veg Sandwich', 'Fresh multi-layer vegetable sandwich', 50, 'Sandwich', 1, 'VEG', 35, 1, 7),
((SELECT canteen_id FROM canteens WHERE name = 'MBA Canteen'), 'Idli Sambar', 'Soft steamed cakes with lentil curry', 45, 'South Indian', 1, 'VEG', 30, 1, 6),
((SELECT canteen_id FROM canteens WHERE name = 'MBA Canteen'), 'Chapathi & Curry', 'Whole wheat bread with vegetable curry', 65, 'North Indian', 1, 'VEG', 22, 1, 4),
((SELECT canteen_id FROM canteens WHERE name = 'MBA Canteen'), 'Lemon Rice', 'Tangy turmeric rice with peanuts', 50, 'Rice', 1, 'VEG', 25, 1, 5),
((SELECT canteen_id FROM canteens WHERE name = 'MBA Canteen'), 'Veg Burger', 'Gourmet vegetarian burger', 80, 'Burger', 1, 'VEG', 20, 1, 4),
((SELECT canteen_id FROM canteens WHERE name = 'MBA Canteen'), 'Veg Puff', 'Crispy puff pastry with vegetables', 30, 'Snacks', 1, 'VEG', 40, 1, 8),
((SELECT canteen_id FROM canteens WHERE name = 'MBA Canteen'), 'Veg Momos', 'Steamed vegetable dumplings', 60, 'Momos', 1, 'VEG', 30, 1, 6),
((SELECT canteen_id FROM canteens WHERE name = 'MBA Canteen'), 'Aloo Paratha', 'Potato-stuffed flatbread', 55, 'Paratha', 1, 'VEG', 25, 1, 5),
((SELECT canteen_id FROM canteens WHERE name = 'MBA Canteen'), 'Curd Rice', 'Cooling yogurt rice with tempering', 40, 'Rice', 1, 'VEG', 30, 1, 6),
((SELECT canteen_id FROM canteens WHERE name = 'MBA Canteen'), 'Tomato Rice', 'Tangy rice with tomato and spices', 55, 'Rice', 1, 'VEG', 25, 1, 5),
((SELECT canteen_id FROM canteens WHERE name = 'MBA Canteen'), 'Veg Pulao', 'Mildly spiced rice with vegetables', 75, 'Rice', 1, 'VEG', 22, 1, 4),
((SELECT canteen_id FROM canteens WHERE name = 'MBA Canteen'), 'Veg Cutlet', 'Crispy vegetable patties', 45, 'Snacks', 1, 'VEG', 35, 1, 7),
((SELECT canteen_id FROM canteens WHERE name = 'MBA Canteen'), 'Veg Spring Roll', 'Crispy rolls with vegetable filling', 55, 'Snacks', 1, 'VEG', 30, 1, 6),
((SELECT canteen_id FROM canteens WHERE name = 'MBA Canteen'), 'Veg Thali', 'Complete vegetarian meal platter', 150, 'Thali', 1, 'VEG', 15, 1, 3),
((SELECT canteen_id FROM canteens WHERE name = 'MBA Canteen'), 'Veg Maggi', 'Instant noodles with vegetables', 40, 'Noodles', 1, 'VEG', 35, 1, 7),
((SELECT canteen_id FROM canteens WHERE name = 'MBA Canteen'), 'Veg Chowmein', 'Stir-fried noodles Chinese style', 65, 'Noodles', 1, 'VEG', 25, 1, 5),
((SELECT canteen_id FROM canteens WHERE name = 'MBA Canteen'), 'Dal Fry & Rice', 'Tempered lentils with steamed rice', 60, 'Curry', 1, 'VEG', 25, 1, 5),
((SELECT canteen_id FROM canteens WHERE name = 'MBA Canteen'), 'Veg Korma', 'Mixed vegetables in creamy gravy', 85, 'Curry', 1, 'VEG', 18, 1, 4),
((SELECT canteen_id FROM canteens WHERE name = 'MBA Canteen'), 'Mixed Veg Curry', 'Assorted vegetables in spiced gravy', 70, 'Curry', 1, 'VEG', 20, 1, 4),
((SELECT canteen_id FROM canteens WHERE name = 'MBA Canteen'), 'Poori Curry', 'Deep-fried bread with spiced curry', 65, 'North Indian', 1, 'VEG', 20, 1, 4),
((SELECT canteen_id FROM canteens WHERE name = 'MBA Canteen'), 'Veg Soup', 'Hot and nutritious vegetable soup', 35, 'Soup', 1, 'VEG', 30, 1, 6),
((SELECT canteen_id FROM canteens WHERE name = 'MBA Canteen'), 'Veg Pakoda', 'Deep-fried vegetable fritters', 50, 'Snacks', 1, 'VEG', 35, 1, 7),
((SELECT canteen_id FROM canteens WHERE name = 'MBA Canteen'), 'Veg Manchurian Rice', 'Fried rice with vegetable manchurian', 95, 'Rice', 1, 'VEG', 20, 1, 4),
((SELECT canteen_id FROM canteens WHERE name = 'MBA Canteen'), 'Veg Sandwich Toast', 'Grilled vegetable sandwich', 55, 'Sandwich', 1, 'VEG', 30, 1, 6);

-- Create indexes for better performance
SELECT 'Creating indexes for better performance' as Info;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'menu_items' AND INDEX_NAME = 'idx_menu_items_canteen_category') > 0,
    'SELECT "Index idx_menu_items_canteen_category already exists"',
    'CREATE INDEX idx_menu_items_canteen_category ON menu_items(canteen_id, category_type)'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'menu_items' AND INDEX_NAME = 'idx_menu_items_availability') > 0,
    'SELECT "Index idx_menu_items_availability already exists"',
    'CREATE INDEX idx_menu_items_availability ON menu_items(is_available, available_quantity)'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'menu_items' AND INDEX_NAME = 'idx_menu_items_updated') > 0,
    'SELECT "Index idx_menu_items_updated already exists"',
    'CREATE INDEX idx_menu_items_updated ON menu_items(last_updated)'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
