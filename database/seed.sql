-- Seed data for Pre-Order Canteen Management System

USE canteen_management;

-- Insert sample users (passwords are hashed version of "password123")
INSERT INTO users (user_id, name, phone, email, password_hash, upi_id, role) VALUES
('user-001', 'Raj Kumar', '9876543210', 'raj.kumar@example.com', '$2b$10$8K1p/aCMTaorr3Hb/wWJC.vGlwGbKEVrFfmG3Uo1qPvMHgILxLxnG', 'raj@paytm', 'student'),
('user-002', 'Priya Sharma', '9876543211', 'priya.sharma@example.com', '$2b$10$8K1p/aCMTaorr3Hb/wWJC.vGlwGbKEVrFfmG3Uo1qPvMHgILxLxnG', 'priya@phonepe', 'student'),
('user-003', 'Dr. Anjali Singh', '9876543212', 'anjali.singh@example.com', '$2b$10$8K1p/aCMTaorr3Hb/wWJC.vGlwGbKEVrFfmG3Uo1qPvMHgILxLxnG', 'anjali@gpay', 'faculty'),
('admin-001', 'Admin User', '9876543213', 'admin@example.com', '$2b$10$8K1p/aCMTaorr3Hb/wWJC.vGlwGbKEVrFfmG3Uo1qPvMHgILxLxnG', 'admin@upi', 'admin'),
('staff-001', 'Canteen Manager', '9876543214', 'canteen@example.com', '$2b$10$8K1p/aCMTaorr3Hb/wWJC.vGlwGbKEVrFfmG3Uo1qPvMHgILxLxnG', 'canteen@paytm', 'canteen_staff');

-- Insert canteens
INSERT INTO canteens (canteen_id, name, location, contact, description, opening_hours) VALUES
(1, 'Main Cafeteria', 'Ground Floor, Academic Block A', '080-12345678', 'Our main cafeteria serving diverse cuisines throughout the day', 
 JSON_OBJECT('monday', '07:00-22:00', 'tuesday', '07:00-22:00', 'wednesday', '07:00-22:00', 'thursday', '07:00-22:00', 'friday', '07:00-22:00', 'saturday', '08:00-20:00', 'sunday', '08:00-20:00')),
(2, 'IT Canteen', 'Second Floor, IT Department', '080-12345679', 'Specialized canteen for IT department with quick bites and beverages', 
 JSON_OBJECT('monday', '08:00-18:00', 'tuesday', '08:00-18:00', 'wednesday', '08:00-18:00', 'thursday', '08:00-18:00', 'friday', '08:00-18:00', 'saturday', 'closed', 'sunday', 'closed')),
(3, 'MBA Canteen', 'MBA Block, Level 1', '080-12345680', 'Executive canteen serving premium meals for MBA students and faculty', 
 JSON_OBJECT('monday', '07:30-21:00', 'tuesday', '07:30-21:00', 'wednesday', '07:30-21:00', 'thursday', '07:30-21:00', 'friday', '07:30-21:00', 'saturday', '08:00-19:00', 'sunday', '08:00-19:00'));

-- Insert menu items for Main Cafeteria (Canteen ID: 1)
INSERT INTO menu_items (canteen_id, name, description, price, category, is_veg, image_url, available_quantity, rating, total_ratings) VALUES
-- Non-Veg Items
(1, 'KL Biryani', 'Authentic Kolkata-style biryani with aromatic spices', 120.00, 'Non-Veg', 0, 'https://images.unsplash.com/photo-1563379091339-03246963d96c?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 15, 4.8, 125),
(1, 'TN Biryani', 'Spicy Tamil Nadu style biryani with authentic flavors', 110.00, 'Non-Veg', 0, 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 12, 4.7, 98),
(1, 'Chicken Biryani', 'Fragrant basmati rice with tender chicken pieces', 100.00, 'Non-Veg', 0, 'https://images.unsplash.com/photo-1563379091339-03246963d96c?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 20, 4.6, 156),
(1, 'Mutton Biryani', 'Rich and aromatic mutton biryani with basmati rice', 140.00, 'Non-Veg', 0, 'https://images.unsplash.com/photo-1563379091339-03246963d96c?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 8, 4.9, 87),
(1, 'Egg Biryani', 'Flavorful biryani with boiled eggs and spices', 80.00, 'Non-Veg', 0, 'https://images.unsplash.com/photo-1563379091339-03246963d96c?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 25, 4.4, 134),
(1, 'Chicken Fried Rice', 'Wok-tossed rice with chicken and vegetables', 90.00, 'Non-Veg', 0, 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 18, 4.5, 89),
(1, 'Chicken Curry with Rice', 'Spicy chicken curry served with steamed rice', 95.00, 'Non-Veg', 0, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 15, 4.7, 76),
(1, 'Fish Curry Meals', 'Traditional fish curry with rice and sides', 100.00, 'Non-Veg', 0, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 12, 4.6, 65),
(1, 'Chicken 65', 'Spicy deep-fried chicken appetizer', 85.00, 'Non-Veg', 0, 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 20, 4.7, 112),
(1, 'Fish Fry', 'Crispy fried fish with South Indian spices', 80.00, 'Non-Veg', 0, 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 18, 4.5, 94),

-- Veg Items
(1, 'Veg Biryani', 'Fragrant vegetable biryani with mixed vegetables', 80.00, 'Veg', 1, 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 25, 4.5, 189),
(1, 'Curd Rice', 'Comforting rice mixed with fresh curd and spices', 45.00, 'Veg', 1, 'https://images.unsplash.com/photo-1596797038530-2c107229654b?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 30, 4.3, 145),
(1, 'Lemon Rice', 'Tangy rice flavored with lemon and curry leaves', 50.00, 'Veg', 1, 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 25, 4.4, 156),
(1, 'Idli with Sambar', 'Steamed rice cakes served with lentil curry', 40.00, 'Veg', 1, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 35, 4.6, 234),
(1, 'Masala Dosa', 'Crispy dosa stuffed with spiced potato filling', 60.00, 'Veg', 1, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 20, 4.8, 198),
(1, 'Paneer Butter Masala with Roti', 'Creamy paneer curry served with fresh roti', 90.00, 'Veg', 1, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 18, 4.7, 167),
(1, 'Chole Bhature', 'Spiced chickpeas with fried bread', 70.00, 'Veg', 1, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 22, 4.6, 143),
(1, 'Veg Fried Rice', 'Stir-fried rice with mixed vegetables', 65.00, 'Veg', 1, 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 28, 4.4, 121),
(1, 'South Indian Thali', 'Complete meal with rice, sambar, rasam, vegetables', 85.00, 'Veg', 1, 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 15, 4.8, 176),
(1, 'North Indian Thali', 'Dal, sabzi, roti, rice, pickle, and sweet', 90.00, 'Veg', 1, 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 12, 4.7, 134);

-- Insert menu items for IT Canteen (Canteen ID: 2)
INSERT INTO menu_items (canteen_id, name, description, price, category, is_veg, image_url, available_quantity, rating, total_ratings) VALUES
(2, 'Masala Chai', 'Traditional Indian spiced tea', 15.00, 'Beverages', 1, 'https://images.unsplash.com/photo-1571934811019-96040d31386c?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 50, 4.5, 89),
(2, 'Filter Coffee', 'South Indian style filter coffee', 20.00, 'Beverages', 1, 'https://images.unsplash.com/photo-1571934811019-96040d31386c?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 45, 4.7, 124),
(2, 'Sandwich', 'Grilled vegetable sandwich with chutney', 40.00, 'Snacks', 1, 'https://images.unsplash.com/photo-1553909489-cd47e0ef937f?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 30, 4.3, 67),
(2, 'Samosa', 'Crispy triangular pastry with spiced potato filling', 15.00, 'Snacks', 1, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 40, 4.6, 156),
(2, 'Pav Bhaji', 'Spiced vegetable curry with buttered bread rolls', 55.00, 'Main Course', 1, 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 25, 4.8, 98),
(2, 'Vada Pav', 'Mumbai street food - spiced potato fritter in bun', 25.00, 'Snacks', 1, 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 35, 4.4, 78),
(2, 'Aloo Paratha', 'Stuffed flatbread with spiced potato filling', 45.00, 'Main Course', 1, 'https://images.unsplash.com/photo-1596636014633-8efe5dfe85e0?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 20, 4.6, 89),
(2, 'Upma', 'Savory semolina porridge with vegetables', 35.00, 'Breakfast', 1, 'https://images.unsplash.com/photo-1596797038530-2c107229654b?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 30, 4.2, 56),
(2, 'Poha', 'Flattened rice with onions, peanuts and spices', 30.00, 'Breakfast', 1, 'https://images.unsplash.com/photo-1596797038530-2c107229654b?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 25, 4.3, 67),
(2, 'Fresh Lime Soda', 'Refreshing lime soda with mint', 25.00, 'Beverages', 1, 'https://images.unsplash.com/photo-1546171753-97d7676e4602?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 40, 4.1, 45);

-- Insert menu items for MBA Canteen (Canteen ID: 3) - Using your provided menu
INSERT INTO menu_items (canteen_id, name, description, price, category, is_veg, image_url, available_quantity, rating, total_ratings) VALUES
-- Rice Items
(3, 'Veg Biryani', 'Fragrant vegetable biryani with mixed vegetables and aromatic spices', 80.00, 'Rice Items', 1, 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 25, 4.5, 89),
(3, 'Paneer Biryani', 'Delicious biryani with paneer cubes and fragrant basmati rice', 90.00, 'Rice Items', 1, 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 20, 4.6, 76),
(3, 'Mushroom Biryani', 'Aromatic biryani with fresh mushrooms and spices', 85.00, 'Rice Items', 1, 'https://images.unsplash.com/photo-1589302168-964664d93dc0?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 18, 4.4, 56),
(3, 'Curd Rice', 'Comforting rice mixed with fresh curd and traditional tempering', 45.00, 'Rice Items', 1, 'https://images.unsplash.com/photo-1596797038530-2c107229654b?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 30, 4.3, 145),
(3, 'Lemon Rice', 'Tangy rice flavored with fresh lemon juice and curry leaves', 50.00, 'Rice Items', 1, 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 25, 4.4, 123),
(3, 'Tamarind Rice', 'Traditional South Indian rice dish with tangy tamarind sauce', 55.00, 'Rice Items', 1, 'https://images.unsplash.com/photo-1596797038530-2c107229654b?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 20, 4.2, 87),
(3, 'Tomato Rice', 'Flavorful rice cooked with fresh tomatoes and aromatic spices', 50.00, 'Rice Items', 1, 'https://images.unsplash.com/photo-1596797038530-2c107229654b?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 22, 4.1, 98),
(3, 'Veg Fried Rice', 'Wok-tossed rice with mixed vegetables and soy sauce', 65.00, 'Rice Items', 1, 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 28, 4.4, 112),

-- South Indian Items
(3, 'Idli', 'Soft steamed rice cakes served with sambar and chutney', 30.00, 'South Indian', 1, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 40, 4.6, 234),
(3, 'Vada', 'Crispy lentil donuts served with coconut chutney', 25.00, 'South Indian', 1, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 35, 4.4, 167),
(3, 'Dosa', 'Crispy rice crepe served with sambar and coconut chutney', 40.00, 'South Indian', 1, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 30, 4.7, 198),
(3, 'Masala Dosa', 'Crispy dosa stuffed with spiced potato filling', 55.00, 'South Indian', 1, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 25, 4.8, 189),
(3, 'Onion Dosa', 'Crispy dosa topped with caramelized onions', 50.00, 'South Indian', 1, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 28, 4.5, 134),
(3, 'Rava Dosa', 'Crispy semolina crepe with vegetables and spices', 60.00, 'South Indian', 1, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 20, 4.6, 156),
(3, 'Uttapam', 'Thick pancake topped with vegetables and served with chutney', 45.00, 'South Indian', 1, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 25, 4.4, 123),
(3, 'Pongal', 'Traditional rice and lentil dish with ghee and black pepper', 35.00, 'South Indian', 1, 'https://images.unsplash.com/photo-1596797038530-2c107229654b?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 30, 4.3, 87),
(3, 'Upma', 'Savory semolina porridge with vegetables and spices', 30.00, 'South Indian', 1, 'https://images.unsplash.com/photo-1596797038530-2c107229654b?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 35, 4.2, 98),

-- North Indian Items
(3, 'Paneer Butter Masala', 'Creamy paneer curry in rich tomato-based gravy', 80.00, 'North Indian', 1, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 20, 4.7, 167),
(3, 'Palak Paneer', 'Paneer cubes in spiced spinach gravy', 75.00, 'North Indian', 1, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 18, 4.6, 145),
(3, 'Chole Bhature', 'Spiced chickpeas served with fluffy fried bread', 65.00, 'North Indian', 1, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 25, 4.8, 189),
(3, 'Rajma Chawal', 'Kidney bean curry served with steamed rice', 70.00, 'North Indian', 1, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 22, 4.5, 134),
(3, 'Aloo Paratha', 'Stuffed flatbread with spiced potato filling', 40.00, 'North Indian', 1, 'https://images.unsplash.com/photo-1596636014633-8efe5dfe85e0?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 30, 4.6, 156),
(3, 'Gobi Paratha', 'Flatbread stuffed with spiced cauliflower', 45.00, 'North Indian', 1, 'https://images.unsplash.com/photo-1596636014633-8efe5dfe85e0?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 25, 4.4, 123),
(3, 'Paneer Paratha', 'Soft flatbread stuffed with seasoned paneer', 50.00, 'North Indian', 1, 'https://images.unsplash.com/photo-1596636014633-8efe5dfe85e0?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 20, 4.7, 178),

-- Snacks
(3, 'Samosa', 'Crispy triangular pastry stuffed with spiced potatoes', 15.00, 'Snacks', 1, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 50, 4.5, 234),
(3, 'Pav Bhaji', 'Spiced vegetable curry served with buttered bread rolls', 55.00, 'Snacks', 1, 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 30, 4.7, 198),
(3, 'Pani Puri', 'Crispy hollow puris filled with spiced water and chutneys', 25.00, 'Snacks', 1, 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 40, 4.8, 267),
(3, 'Bhel Puri', 'Tangy mixture of puffed rice, sev, and chutneys', 30.00, 'Snacks', 1, 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 35, 4.6, 189),
(3, 'Vada Pav', 'Mumbai''s famous street food - spiced potato fritter in bread bun', 20.00, 'Snacks', 1, 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80', 45, 4.5, 156);

-- Insert some sample orders (for testing purposes)
INSERT INTO orders (order_id, user_id, canteen_id, pickup_time, subtotal_amount, tax_amount, total_amount, payment_status, order_status, transaction_id, payment_method) VALUES
('order-001', 'user-001', 1, '2024-01-15 13:00:00', 200.00, 10.00, 210.00, 'paid', 'completed', 'TXN123456789', 'upi'),
('order-002', 'user-002', 2, '2024-01-15 14:30:00', 95.00, 4.75, 99.75, 'paid', 'ready', 'TXN123456790', 'upi'),
('order-003', 'user-003', 3, '2024-01-15 19:00:00', 150.00, 7.50, 157.50, 'paid', 'preparing', 'TXN123456791', 'upi');

-- Insert corresponding order items
INSERT INTO order_items (order_id, item_id, quantity, unit_price, total_price, item_name, item_description) VALUES
('order-001', 1, 1, 120.00, 120.00, 'KL Biryani', 'Authentic Kolkata-style biryani with aromatic spices'),
('order-001', 11, 1, 80.00, 80.00, 'Veg Biryani', 'Fragrant vegetable biryani with mixed vegetables'),
('order-002', 21, 2, 15.00, 30.00, 'Masala Chai', 'Traditional Indian spiced tea'),
('order-002', 24, 1, 40.00, 40.00, 'Sandwich', 'Grilled vegetable sandwich with chutney'),
('order-002', 25, 1, 15.00, 15.00, 'Samosa', 'Crispy triangular pastry with spiced potato filling'),
('order-003', 31, 1, 80.00, 80.00, 'Veg Biryani', 'Fragrant vegetable biryani with mixed vegetables and aromatic spices'),
('order-003', 42, 1, 65.00, 65.00, 'Chole Bhature', 'Spiced chickpeas served with fluffy fried bread');

-- Insert corresponding payment records
INSERT INTO payments (payment_id, order_id, amount, payment_mode, transaction_ref, upi_ref_id, payment_status, gateway_response) VALUES
('pay-001', 'order-001', 210.00, 'upi', 'TXN123456789', 'UPI123456789', 'success', JSON_OBJECT('status', 'success', 'txn_id', 'TXN123456789', 'amount', 210.00)),
('pay-002', 'order-002', 99.75, 'upi', 'TXN123456790', 'UPI123456790', 'success', JSON_OBJECT('status', 'success', 'txn_id', 'TXN123456790', 'amount', 99.75)),
('pay-003', 'order-003', 157.50, 'upi', 'TXN123456791', 'UPI123456791', 'success', JSON_OBJECT('status', 'success', 'txn_id', 'TXN123456791', 'amount', 157.50));