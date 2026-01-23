-- Clean up duplicate canteens and keep only the three main canteens
-- This script will remove all canteens except IDs 1, 2, and 3

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Delete menu items for duplicate canteens (keeping only canteens 1, 2, 3)
DELETE FROM menu_items WHERE canteen_id NOT IN (1, 2, 3);

-- Delete orders for duplicate canteens
DELETE FROM orders WHERE canteen_id NOT IN (1, 2, 3);

-- Delete admin users for duplicate canteens
DELETE FROM admins WHERE canteen_id NOT IN (1, 2, 3);

-- Delete duplicate canteens (keeping only the first three)
DELETE FROM canteens WHERE canteen_id NOT IN (1, 2, 3);

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Update the locations and descriptions for the three canteens to be clearer
UPDATE canteens SET 
  location = 'Ground Floor, Main Block',
  description = 'Main campus canteen serving both vegetarian and non-vegetarian items',
  opening_hours = '{"monday": "8:00-20:00", "tuesday": "8:00-20:00", "wednesday": "8:00-20:00", "thursday": "8:00-20:00", "friday": "8:00-20:00", "saturday": "8:00-14:00", "sunday": "closed"}'
WHERE canteen_id = 1 AND name = 'Main Canteen';

UPDATE canteens SET 
  location = 'Ground Floor, IT Block', 
  description = 'IT department canteen with variety of veg and non-veg options',
  opening_hours = '{"monday": "8:00-20:00", "tuesday": "8:00-20:00", "wednesday": "8:00-20:00", "thursday": "8:00-20:00", "friday": "8:00-20:00", "saturday": "8:00-14:00", "sunday": "closed"}'
WHERE canteen_id = 2 AND name = 'IT Canteen';

UPDATE canteens SET 
  location = 'Ground Floor, MBA Block',
  description = 'MBA block canteen serving exclusively vegetarian items',
  opening_hours = '{"monday": "8:00-20:00", "tuesday": "8:00-20:00", "wednesday": "8:00-20:00", "thursday": "8:00-20:00", "friday": "8:00-20:00", "saturday": "8:00-14:00", "sunday": "closed"}'
WHERE canteen_id = 3 AND name = 'MBA Canteen';

-- Show the final result
SELECT 'Cleanup completed successfully!' as Result;
SELECT canteen_id, name, location, description FROM canteens ORDER BY canteen_id;
SELECT COUNT(*) as 'Total Menu Items' FROM menu_items;
SELECT canteen_id, COUNT(*) as 'Items per Canteen' FROM menu_items GROUP BY canteen_id ORDER BY canteen_id;