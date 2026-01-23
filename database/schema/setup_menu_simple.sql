-- Clean setup for three canteens with all menu items
-- Using existing canteen IDs: 1=Main, 2=IT, 3=MBA

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- First, clear existing menu items to avoid duplicates
DELETE FROM menu_items WHERE canteen_id IN (1, 2, 3);

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Create admin accounts for the three canteens (using bcrypt hash for 'admin123')
INSERT INTO admins (name, username, password_hash, role, canteen_id) VALUES
('Main Canteen Admin', 'main_admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'canteen_manager', 1),
('IT Canteen Admin', 'it_admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'canteen_manager', 2),
('MBA Canteen Admin', 'mba_admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'canteen_manager', 3)
ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash);

-- Main Canteen (ID: 1) - Vegetarian Items
INSERT INTO menu_items (canteen_id, name, description, price, category, is_veg, available_quantity, is_available) VALUES
(1, 'Veg Fried Rice', 'Aromatic basmati rice with mixed vegetables', 80, 'Rice', 1, 25, 1),
(1, 'Paneer Butter Masala', 'Rich and creamy paneer curry', 120, 'Curry', 1, 20, 1),
(1, 'Veg Noodles', 'Stir-fried noodles with vegetables', 70, 'Noodles', 1, 30, 1),
(1, 'Gobi Manchurian', 'Crispy cauliflower in tangy sauce', 90, 'Starter', 1, 15, 1),
(1, 'Veg Biryani', 'Fragrant rice with mixed vegetables', 100, 'Biryani', 1, 20, 1),
(1, 'Chole Bhature', 'Spiced chickpeas with fried bread', 85, 'North Indian', 1, 18, 1),
(1, 'Veg Sandwich', 'Fresh vegetable sandwich', 50, 'Sandwich', 1, 35, 1),
(1, 'Masala Dosa', 'Crispy crepe with spiced potato filling', 60, 'South Indian', 1, 25, 1),
(1, 'Idli & Sambar', 'Steamed rice cakes with lentil curry', 45, 'South Indian', 1, 30, 1),
(1, 'Poori Curry', 'Deep-fried bread with curry', 65, 'North Indian', 1, 20, 1),
(1, 'Veg Pulao', 'Mildly spiced rice with vegetables', 75, 'Rice', 1, 22, 1),
(1, 'Veg Burger', 'Vegetarian burger with patty', 80, 'Burger', 1, 20, 1),
(1, 'Aloo Paratha', 'Stuffed flatbread with potato', 55, 'Paratha', 1, 25, 1),
(1, 'Veg Momos', 'Steamed dumplings with vegetables', 60, 'Momos', 1, 30, 1),
(1, 'Mixed Veg Curry', 'Assorted vegetables in curry', 70, 'Curry', 1, 18, 1);

-- Main Canteen (ID: 1) - Non-Vegetarian Items  
INSERT INTO menu_items (canteen_id, name, description, price, category, is_veg, available_quantity, is_available) VALUES
(1, 'Chicken Fried Rice', 'Basmati rice with tender chicken pieces', 110, 'Rice', 0, 20, 1),
(1, 'Egg Noodles', 'Stir-fried noodles with scrambled eggs', 80, 'Noodles', 0, 25, 1),
(1, 'Chicken 65', 'Spicy fried chicken appetizer', 130, 'Starter', 0, 15, 1),
(1, 'Chicken Biryani', 'Aromatic rice with marinated chicken', 140, 'Biryani', 0, 18, 1),
(1, 'Fish Curry & Rice', 'Fresh fish curry with steamed rice', 120, 'Curry', 0, 12, 1),
(1, 'Chicken Shawarma', 'Middle eastern chicken wrap', 90, 'Wrap', 0, 20, 1),
(1, 'Chicken Roll', 'Spiced chicken wrapped in paratha', 85, 'Roll', 0, 22, 1),
(1, 'Chicken Manchurian', 'Indo-Chinese chicken in sauce', 110, 'Starter', 0, 18, 1),
(1, 'Egg Curry', 'Hard-boiled eggs in spicy curry', 70, 'Curry', 0, 20, 1),
(1, 'Chicken Sandwich', 'Grilled chicken sandwich', 75, 'Sandwich', 0, 25, 1),
(1, 'Chicken Burger', 'Juicy chicken burger', 95, 'Burger', 0, 18, 1),
(1, 'Mutton Curry', 'Tender mutton in rich gravy', 160, 'Curry', 0, 10, 1),
(1, 'Grilled Chicken', 'Herb-marinated grilled chicken', 125, 'Grilled', 0, 15, 1),
(1, 'Butter Chicken', 'Creamy tomato-based chicken curry', 135, 'Curry', 0, 16, 1),
(1, 'Egg Puff', 'Flaky pastry with spiced egg filling', 35, 'Snacks', 0, 30, 1);

-- IT Canteen (ID: 2) - Vegetarian Items
INSERT INTO menu_items (canteen_id, name, description, price, category, is_veg, available_quantity, is_available) VALUES
(2, 'Veg Hakka Noodles', 'Indo-Chinese style vegetable noodles', 75, 'Noodles', 1, 28, 1),
(2, 'Veg Fried Rice', 'Wok-fried rice with mixed vegetables', 80, 'Rice', 1, 25, 1),
(2, 'Paneer Tikka', 'Grilled cottage cheese cubes', 100, 'Starter', 1, 20, 1),
(2, 'Veg Puff', 'Crispy pastry with vegetable filling', 30, 'Snacks', 1, 40, 1),
(2, 'Veg Cutlet', 'Deep-fried vegetable patties', 45, 'Snacks', 1, 35, 1),
(2, 'Veg Sandwich', 'Multi-layer vegetable sandwich', 50, 'Sandwich', 1, 30, 1),
(2, 'Masala Dosa', 'South Indian crepe with potato curry', 60, 'South Indian', 1, 25, 1),
(2, 'Onion Uttapam', 'Thick pancake with onion toppings', 55, 'South Indian', 1, 20, 1),
(2, 'Chapathi & Curry', 'Indian flatbread with curry', 65, 'North Indian', 1, 22, 1),
(2, 'Veg Biryani', 'Aromatic rice with mixed vegetables', 100, 'Biryani', 1, 20, 1),
(2, 'Veg Momos', 'Steamed vegetable dumplings', 60, 'Momos', 1, 30, 1),
(2, 'Veg Burger', 'Plant-based burger patty', 80, 'Burger', 1, 18, 1),
(2, 'Idli Sambar', 'Steamed rice cakes with lentil soup', 45, 'South Indian', 1, 30, 1),
(2, 'Lemon Rice', 'Tangy rice with curry leaves', 50, 'Rice', 1, 25, 1),
(2, 'Aloo Curry & Rice', 'Spiced potato curry with rice', 70, 'Curry', 1, 20, 1);

-- IT Canteen (ID: 2) - Non-Vegetarian Items
INSERT INTO menu_items (canteen_id, name, description, price, category, is_veg, available_quantity, is_available) VALUES
(2, 'Chicken Fried Rice', 'Wok-fried rice with chicken pieces', 110, 'Rice', 0, 20, 1),
(2, 'Egg Fried Rice', 'Rice stir-fried with scrambled eggs', 85, 'Rice', 0, 25, 1),
(2, 'Chicken Noodles', 'Stir-fried noodles with chicken', 95, 'Noodles', 0, 22, 1),
(2, 'Chicken Puff', 'Flaky pastry with spiced chicken', 40, 'Snacks', 0, 35, 1),
(2, 'Chicken Curry & Rice', 'Traditional chicken curry with rice', 115, 'Curry', 0, 18, 1),
(2, 'Egg Roll', 'Scrambled eggs wrapped in paratha', 50, 'Roll', 0, 28, 1),
(2, 'Chicken Roll', 'Spiced chicken wrapped in bread', 85, 'Roll', 0, 22, 1),
(2, 'Chicken Biryani', 'Fragrant rice with marinated chicken', 140, 'Biryani', 0, 15, 1),
(2, 'Fish Fry', 'Crispy fried fish fillets', 100, 'Fried', 0, 12, 1),
(2, 'Egg Dosa', 'Crispy crepe with egg topping', 65, 'South Indian', 0, 20, 1),
(2, 'Chicken Lollipop', 'Spicy chicken drumettes', 120, 'Starter', 0, 16, 1),
(2, 'Egg Curry', 'Boiled eggs in spicy gravy', 70, 'Curry', 0, 20, 1),
(2, 'Chicken Kebab', 'Grilled marinated chicken skewers', 110, 'Grilled', 0, 14, 1),
(2, 'Chicken Sandwich', 'Grilled chicken breast sandwich', 75, 'Sandwich', 0, 25, 1),
(2, 'Chicken Wrap', 'Spiced chicken in tortilla wrap', 90, 'Wrap', 0, 20, 1);

-- MBA Canteen (ID: 3) - All Vegetarian Items (30 items total)
INSERT INTO menu_items (canteen_id, name, description, price, category, is_veg, available_quantity, is_available) VALUES
(3, 'Veg Fried Rice', 'Aromatic rice with fresh vegetables', 80, 'Rice', 1, 25, 1),
(3, 'Veg Biryani', 'Premium vegetable biryani', 100, 'Biryani', 1, 20, 1),
(3, 'Paneer Butter Masala', 'Rich creamy paneer curry', 120, 'Curry', 1, 18, 1),
(3, 'Veg Noodles', 'Indo-Chinese style vegetable noodles', 70, 'Noodles', 1, 30, 1),
(3, 'Gobi Manchurian', 'Crispy cauliflower in tangy sauce', 90, 'Starter', 1, 15, 1),
(3, 'Masala Dosa', 'Traditional South Indian crepe', 60, 'South Indian', 1, 25, 1),
(3, 'Veg Sandwich', 'Fresh multi-layer vegetable sandwich', 50, 'Sandwich', 1, 35, 1),
(3, 'Idli Sambar', 'Soft steamed cakes with lentil curry', 45, 'South Indian', 1, 30, 1),
(3, 'Chapathi & Curry', 'Whole wheat bread with vegetable curry', 65, 'North Indian', 1, 22, 1),
(3, 'Lemon Rice', 'Tangy turmeric rice with peanuts', 50, 'Rice', 1, 25, 1),
(3, 'Veg Burger', 'Gourmet vegetarian burger', 80, 'Burger', 1, 20, 1),
(3, 'Veg Puff', 'Crispy puff pastry with vegetables', 30, 'Snacks', 1, 40, 1),
(3, 'Veg Momos', 'Steamed vegetable dumplings', 60, 'Momos', 1, 30, 1),
(3, 'Aloo Paratha', 'Potato-stuffed flatbread', 55, 'Paratha', 1, 25, 1),
(3, 'Curd Rice', 'Cooling yogurt rice with tempering', 40, 'Rice', 1, 30, 1),
(3, 'Tomato Rice', 'Tangy rice with tomato and spices', 55, 'Rice', 1, 25, 1),
(3, 'Veg Pulao', 'Mildly spiced rice with vegetables', 75, 'Rice', 1, 22, 1),
(3, 'Veg Cutlet', 'Crispy vegetable patties', 45, 'Snacks', 1, 35, 1),
(3, 'Veg Spring Roll', 'Crispy rolls with vegetable filling', 55, 'Snacks', 1, 30, 1),
(3, 'Veg Thali', 'Complete vegetarian meal platter', 150, 'Thali', 1, 15, 1),
(3, 'Veg Maggi', 'Instant noodles with vegetables', 40, 'Noodles', 1, 35, 1),
(3, 'Veg Chowmein', 'Stir-fried noodles Chinese style', 65, 'Noodles', 1, 25, 1),
(3, 'Dal Fry & Rice', 'Tempered lentils with steamed rice', 60, 'Curry', 1, 25, 1),
(3, 'Veg Korma', 'Mixed vegetables in creamy gravy', 85, 'Curry', 1, 18, 1),
(3, 'Mixed Veg Curry', 'Assorted vegetables in spiced gravy', 70, 'Curry', 1, 20, 1),
(3, 'Poori Curry', 'Deep-fried bread with spiced curry', 65, 'North Indian', 1, 20, 1),
(3, 'Veg Soup', 'Hot and nutritious vegetable soup', 35, 'Soup', 1, 30, 1),
(3, 'Veg Pakoda', 'Deep-fried vegetable fritters', 50, 'Snacks', 1, 35, 1),
(3, 'Veg Manchurian Rice', 'Fried rice with vegetable manchurian', 95, 'Rice', 1, 20, 1),
(3, 'Veg Sandwich Toast', 'Grilled vegetable sandwich', 55, 'Sandwich', 1, 30, 1);

-- Update canteen descriptions to match the requirements
UPDATE canteens SET description = 'Main campus canteen serving both vegetarian and non-vegetarian items' WHERE canteen_id = 1;
UPDATE canteens SET description = 'IT department canteen with variety of veg and non-veg options' WHERE canteen_id = 2; 
UPDATE canteens SET description = 'MBA block canteen serving exclusively vegetarian items' WHERE canteen_id = 3;

SELECT 'Menu setup completed successfully!' as Result;
SELECT COUNT(*) as 'Total Menu Items Added' FROM menu_items WHERE canteen_id IN (1,2,3);
SELECT canteen_id, COUNT(*) as 'Items per Canteen' FROM menu_items WHERE canteen_id IN (1,2,3) GROUP BY canteen_id;