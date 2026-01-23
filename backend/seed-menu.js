const db = require('./config/database');

// Helper function to generate image URLs based on item type
const getImageUrl = (itemName) => {
  const name = itemName.toLowerCase();
  if (name.includes('biryani')) return 'https://images.unsplash.com/photo-1563379091339-03246963d96c?w=300&h=200&fit=crop';
  if (name.includes('dosa')) return 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300&h=200&fit=crop';
  if (name.includes('idli')) return 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&h=200&fit=crop';
  if (name.includes('chicken')) return 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=300&h=200&fit=crop';
  if (name.includes('paneer')) return 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&h=200&fit=crop';
  if (name.includes('fish')) return 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop';
  if (name.includes('samosa')) return 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&h=200&fit=crop';
  if (name.includes('chai') || name.includes('tea')) return 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=300&h=200&fit=crop';
  return 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300&h=200&fit=crop'; // default food image
};

const seedMenuData = async () => {
  try {
    console.log('Starting database seeding...');

    // Three canteens data
    const canteens = [
      {
        canteen_id: 1,
        name: 'Main Canteen',
        location: 'Academic Block A',
        contact: '080-12345678',
        description: 'The main campus canteen with diverse food options',
        opening_hours: JSON.stringify({
          monday: '08:00-20:00',
          tuesday: '08:00-20:00',
          wednesday: '08:00-20:00',
          thursday: '08:00-20:00',
          friday: '08:00-20:00',
          saturday: '08:00-16:00',
          sunday: 'Closed'
        }),
        is_active: 1
      },
      {
        canteen_id: 2,
        name: 'IT Canteen',
        location: 'IT Block',
        contact: '080-23456789',
        description: 'Specialized canteen for IT department with quick meals',
        opening_hours: JSON.stringify({
          monday: '08:00-19:00',
          tuesday: '08:00-19:00',
          wednesday: '08:00-19:00',
          thursday: '08:00-19:00',
          friday: '08:00-19:00',
          saturday: '08:00-15:00',
          sunday: 'Closed'
        }),
        is_active: 1
      },
      {
        canteen_id: 3,
        name: 'MBA Canteen',
        location: 'Management Block',
        contact: '080-34567890',
        description: 'Premium vegetarian canteen for MBA students',
        opening_hours: JSON.stringify({
          monday: '08:00-18:00',
          tuesday: '08:00-18:00',
          wednesday: '08:00-18:00',
          thursday: '08:00-18:00',
          friday: '08:00-18:00',
          saturday: '08:00-14:00',
          sunday: 'Closed'
        }),
        is_active: 1
      }
    ];

    // Comprehensive menu items for all canteens
    const menuItems = [
      // MAIN CANTEEN ITEMS (Canteen ID: 1)
      // Biryani & Rice Items
      { item_id: 1, canteen_id: 1, name: 'KL Biryani', description: 'Kerala style aromatic biryani with spices', price: 120.00, category: 'Biryani', is_veg: 0, available_quantity: 30, is_available: 1, rating: 4.7, total_ratings: 89 },
      { item_id: 2, canteen_id: 1, name: 'TN Biryani', description: 'Tamil Nadu style biryani with unique flavors', price: 110.00, category: 'Biryani', is_veg: 0, available_quantity: 25, is_available: 1, rating: 4.6, total_ratings: 76 },
      { item_id: 3, canteen_id: 1, name: 'Chicken Biryani', description: 'Traditional chicken biryani with basmati rice', price: 130.00, category: 'Biryani', is_veg: 0, available_quantity: 40, is_available: 1, rating: 4.8, total_ratings: 156 },
      { item_id: 4, canteen_id: 1, name: 'Mutton Biryani', description: 'Rich mutton biryani with tender meat pieces', price: 180.00, category: 'Biryani', is_veg: 0, available_quantity: 20, is_available: 1, rating: 4.9, total_ratings: 92 },
      { item_id: 5, canteen_id: 1, name: 'Egg Biryani', description: 'Delicious egg biryani with aromatic spices', price: 90.00, category: 'Biryani', is_veg: 0, available_quantity: 35, is_available: 1, rating: 4.4, total_ratings: 67 },
      { item_id: 6, canteen_id: 1, name: 'Prawn Biryani', description: 'Coastal style prawn biryani', price: 160.00, category: 'Biryani', is_veg: 0, available_quantity: 15, is_available: 1, rating: 4.7, total_ratings: 43 },
      { item_id: 7, canteen_id: 1, name: 'Fish Biryani', description: 'Fresh fish biryani with coastal spices', price: 150.00, category: 'Biryani', is_veg: 0, available_quantity: 18, is_available: 1, rating: 4.6, total_ratings: 38 },
      { item_id: 8, canteen_id: 1, name: 'Veg Biryani', description: 'Mixed vegetable biryani with aromatic rice', price: 80.00, category: 'Biryani', is_veg: 1, available_quantity: 45, is_available: 1, rating: 4.3, total_ratings: 123 },
      
      // Fried Rice & Main Courses
      { item_id: 9, canteen_id: 1, name: 'Chicken Fried Rice', description: 'Wok-tossed rice with chicken and vegetables', price: 100.00, category: 'Fried Rice', is_veg: 0, available_quantity: 30, is_available: 1, rating: 4.4, total_ratings: 78 },
      { item_id: 10, canteen_id: 1, name: 'Mutton Fried Rice', description: 'Spicy mutton fried rice', price: 140.00, category: 'Fried Rice', is_veg: 0, available_quantity: 22, is_available: 1, rating: 4.6, total_ratings: 54 },
      { item_id: 11, canteen_id: 1, name: 'Egg Fried Rice', description: 'Classic egg fried rice with vegetables', price: 70.00, category: 'Fried Rice', is_veg: 0, available_quantity: 40, is_available: 1, rating: 4.2, total_ratings: 98 },
      { item_id: 12, canteen_id: 1, name: 'Veg Fried Rice', description: 'Mixed vegetable fried rice', price: 60.00, category: 'Fried Rice', is_veg: 1, available_quantity: 50, is_available: 1, rating: 4.1, total_ratings: 145 },
      
      // Curry Meals
      { item_id: 13, canteen_id: 1, name: 'Chicken Curry with Rice', description: 'Spicy chicken curry served with steamed rice', price: 110.00, category: 'Curry Meals', is_veg: 0, available_quantity: 35, is_available: 1, rating: 4.5, total_ratings: 87 },
      { item_id: 14, canteen_id: 1, name: 'Mutton Curry with Rice', description: 'Rich mutton curry with rice', price: 150.00, category: 'Curry Meals', is_veg: 0, available_quantity: 25, is_available: 1, rating: 4.7, total_ratings: 63 },
      { item_id: 15, canteen_id: 1, name: 'Fish Curry Meals', description: 'Traditional fish curry with rice', price: 120.00, category: 'Curry Meals', is_veg: 0, available_quantity: 20, is_available: 1, rating: 4.6, total_ratings: 45 },
      { item_id: 16, canteen_id: 1, name: 'Egg Curry with Rice', description: 'Egg curry in spicy gravy with rice', price: 80.00, category: 'Curry Meals', is_veg: 0, available_quantity: 30, is_available: 1, rating: 4.3, total_ratings: 72 },
      
      // Starters & Kebabs
      { item_id: 17, canteen_id: 1, name: 'Chicken 65', description: 'Spicy fried chicken starter', price: 120.00, category: 'Starters', is_veg: 0, available_quantity: 25, is_available: 1, rating: 4.8, total_ratings: 134 },
      { item_id: 18, canteen_id: 1, name: 'Chicken Kebab', description: 'Grilled chicken kebab with spices', price: 140.00, category: 'Starters', is_veg: 0, available_quantity: 20, is_available: 1, rating: 4.7, total_ratings: 89 },
      { item_id: 19, canteen_id: 1, name: 'Mutton Kebab', description: 'Tender mutton kebab', price: 160.00, category: 'Starters', is_veg: 0, available_quantity: 15, is_available: 1, rating: 4.8, total_ratings: 67 },
      { item_id: 20, canteen_id: 1, name: 'Fish Fry', description: 'Crispy fried fish pieces', price: 130.00, category: 'Starters', is_veg: 0, available_quantity: 18, is_available: 1, rating: 4.6, total_ratings: 54 },
      
      // South Indian & Rice Varieties
      { item_id: 21, canteen_id: 1, name: 'Curd Rice', description: 'Cooling curd rice with tempering', price: 50.00, category: 'South Indian', is_veg: 1, available_quantity: 60, is_available: 1, rating: 4.2, total_ratings: 156 },
      { item_id: 22, canteen_id: 1, name: 'Lemon Rice', description: 'Tangy lemon rice with nuts', price: 55.00, category: 'South Indian', is_veg: 1, available_quantity: 45, is_available: 1, rating: 4.3, total_ratings: 98 },
      { item_id: 23, canteen_id: 1, name: 'Tamarind Rice', description: 'Spicy tamarind rice', price: 60.00, category: 'South Indian', is_veg: 1, available_quantity: 40, is_available: 1, rating: 4.4, total_ratings: 76 },
      { item_id: 24, canteen_id: 1, name: 'Tomato Rice', description: 'Flavorful tomato rice', price: 55.00, category: 'South Indian', is_veg: 1, available_quantity: 42, is_available: 1, rating: 4.1, total_ratings: 83 },
      { item_id: 25, canteen_id: 1, name: 'Idli with Sambar', description: 'Steamed idli with sambar and chutney', price: 40.00, category: 'South Indian', is_veg: 1, available_quantity: 80, is_available: 1, rating: 4.5, total_ratings: 189 },
      { item_id: 26, canteen_id: 1, name: 'Vada with Chutney', description: 'Crispy vada with coconut chutney', price: 35.00, category: 'South Indian', is_veg: 1, available_quantity: 70, is_available: 1, rating: 4.3, total_ratings: 142 },
      { item_id: 27, canteen_id: 1, name: 'Dosa with Chutney', description: 'Crispy dosa with chutneys and sambar', price: 50.00, category: 'South Indian', is_veg: 1, available_quantity: 55, is_available: 1, rating: 4.6, total_ratings: 167 },
      { item_id: 28, canteen_id: 1, name: 'Masala Dosa', description: 'Dosa stuffed with spiced potato filling', price: 65.00, category: 'South Indian', is_veg: 1, available_quantity: 50, is_available: 1, rating: 4.7, total_ratings: 203 },
      
      // North Indian
      { item_id: 29, canteen_id: 1, name: 'Paneer Butter Masala with Roti', description: 'Creamy paneer curry with rotis', price: 130.00, category: 'North Indian', is_veg: 1, available_quantity: 35, is_available: 1, rating: 4.6, total_ratings: 124 },
      { item_id: 30, canteen_id: 1, name: 'Chole Bhature', description: 'Spicy chickpea curry with fried bread', price: 90.00, category: 'North Indian', is_veg: 1, available_quantity: 30, is_available: 1, rating: 4.5, total_ratings: 156 },
      
      // IT CANTEEN ITEMS (Canteen ID: 2)
      // Biryani Items
      { item_id: 31, canteen_id: 2, name: 'KL Biryani', description: 'Kerala style aromatic biryani', price: 115.00, category: 'Biryani', is_veg: 0, available_quantity: 25, is_available: 1, rating: 4.6, total_ratings: 67 },
      { item_id: 32, canteen_id: 2, name: 'TN Biryani', description: 'Tamil Nadu style biryani', price: 105.00, category: 'Biryani', is_veg: 0, available_quantity: 22, is_available: 1, rating: 4.5, total_ratings: 54 },
      { item_id: 33, canteen_id: 2, name: 'Chicken Biryani', description: 'Traditional chicken biryani', price: 125.00, category: 'Biryani', is_veg: 0, available_quantity: 35, is_available: 1, rating: 4.7, total_ratings: 123 },
      { item_id: 34, canteen_id: 2, name: 'Mutton Biryani', description: 'Rich mutton biryani', price: 175.00, category: 'Biryani', is_veg: 0, available_quantity: 15, is_available: 1, rating: 4.8, total_ratings: 78 },
      { item_id: 35, canteen_id: 2, name: 'Egg Biryani', description: 'Egg biryani with spices', price: 85.00, category: 'Biryani', is_veg: 0, available_quantity: 30, is_available: 1, rating: 4.3, total_ratings: 89 },
      { item_id: 36, canteen_id: 2, name: 'Prawn Biryani', description: 'Coastal prawn biryani', price: 155.00, category: 'Biryani', is_veg: 0, available_quantity: 12, is_available: 1, rating: 4.6, total_ratings: 34 },
      { item_id: 37, canteen_id: 2, name: 'Fish Biryani', description: 'Fresh fish biryani', price: 145.00, category: 'Biryani', is_veg: 0, available_quantity: 15, is_available: 1, rating: 4.5, total_ratings: 43 },
      { item_id: 38, canteen_id: 2, name: 'Veg Biryani', description: 'Mixed vegetable biryani', price: 75.00, category: 'Biryani', is_veg: 1, available_quantity: 40, is_available: 1, rating: 4.2, total_ratings: 98 },
      { item_id: 39, canteen_id: 2, name: 'Paneer Biryani', description: 'Paneer biryani with aromatic rice', price: 110.00, category: 'Biryani', is_veg: 1, available_quantity: 25, is_available: 1, rating: 4.4, total_ratings: 67 },
      
      // Main Courses & Rice
      { item_id: 40, canteen_id: 2, name: 'Chicken Fried Rice', description: 'Chicken fried rice with vegetables', price: 95.00, category: 'Fried Rice', is_veg: 0, available_quantity: 30, is_available: 1, rating: 4.3, total_ratings: 76 },
      { item_id: 41, canteen_id: 2, name: 'Mutton Curry with Rice', description: 'Mutton curry served with rice', price: 145.00, category: 'Curry Meals', is_veg: 0, available_quantity: 20, is_available: 1, rating: 4.6, total_ratings: 54 },
      { item_id: 42, canteen_id: 2, name: 'Fish Curry Meals', description: 'Fish curry with steamed rice', price: 115.00, category: 'Curry Meals', is_veg: 0, available_quantity: 18, is_available: 1, rating: 4.5, total_ratings: 43 },
      { item_id: 43, canteen_id: 2, name: 'Chicken Curry with Roti', description: 'Chicken curry with fresh rotis', price: 105.00, category: 'Curry Meals', is_veg: 0, available_quantity: 25, is_available: 1, rating: 4.4, total_ratings: 67 },
      { item_id: 44, canteen_id: 2, name: 'Egg Curry', description: 'Spicy egg curry', price: 70.00, category: 'Curry Meals', is_veg: 0, available_quantity: 35, is_available: 1, rating: 4.2, total_ratings: 89 },
      
      // Starters
      { item_id: 45, canteen_id: 2, name: 'Chicken 65', description: 'Spicy fried chicken pieces', price: 115.00, category: 'Starters', is_veg: 0, available_quantity: 20, is_available: 1, rating: 4.7, total_ratings: 98 },
      { item_id: 46, canteen_id: 2, name: 'Chicken Kebab', description: 'Grilled chicken kebab', price: 135.00, category: 'Starters', is_veg: 0, available_quantity: 18, is_available: 1, rating: 4.6, total_ratings: 76 },
      { item_id: 47, canteen_id: 2, name: 'Mutton Kebab', description: 'Tender mutton kebab', price: 155.00, category: 'Starters', is_veg: 0, available_quantity: 12, is_available: 1, rating: 4.7, total_ratings: 54 },
      { item_id: 48, canteen_id: 2, name: 'Fish Fry', description: 'Crispy fish fry', price: 125.00, category: 'Starters', is_veg: 0, available_quantity: 15, is_available: 1, rating: 4.5, total_ratings: 43 },
      
      // Vegetarian Items
      { item_id: 49, canteen_id: 2, name: 'Curd Rice', description: 'Cooling curd rice', price: 45.00, category: 'South Indian', is_veg: 1, available_quantity: 50, is_available: 1, rating: 4.1, total_ratings: 123 },
      { item_id: 50, canteen_id: 2, name: 'Lemon Rice', description: 'Tangy lemon rice', price: 50.00, category: 'South Indian', is_veg: 1, available_quantity: 40, is_available: 1, rating: 4.2, total_ratings: 89 },
      { item_id: 51, canteen_id: 2, name: 'Tomato Rice', description: 'Spicy tomato rice', price: 50.00, category: 'South Indian', is_veg: 1, available_quantity: 38, is_available: 1, rating: 4.0, total_ratings: 76 },
      { item_id: 52, canteen_id: 2, name: 'Paneer Butter Masala with Roti', description: 'Paneer curry with rotis', price: 125.00, category: 'North Indian', is_veg: 1, available_quantity: 30, is_available: 1, rating: 4.5, total_ratings: 98 },
      { item_id: 53, canteen_id: 2, name: 'Chole Bhature', description: 'Chickpea curry with bhature', price: 85.00, category: 'North Indian', is_veg: 1, available_quantity: 25, is_available: 1, rating: 4.4, total_ratings: 134 },
      { item_id: 54, canteen_id: 2, name: 'Aloo Paratha', description: 'Stuffed potato paratha', price: 60.00, category: 'North Indian', is_veg: 1, available_quantity: 35, is_available: 1, rating: 4.3, total_ratings: 156 },
      { item_id: 55, canteen_id: 2, name: 'Gobi Paratha', description: 'Cauliflower stuffed paratha', price: 65.00, category: 'North Indian', is_veg: 1, available_quantity: 32, is_available: 1, rating: 4.2, total_ratings: 112 },
      
      // Snacks
      { item_id: 56, canteen_id: 2, name: 'Samosa', description: 'Crispy fried samosa', price: 12.00, category: 'Snacks', is_veg: 1, available_quantity: 100, is_available: 1, rating: 4.1, total_ratings: 234 },
      { item_id: 57, canteen_id: 2, name: 'Pav Bhaji', description: 'Spicy vegetable curry with bread', price: 70.00, category: 'Snacks', is_veg: 1, available_quantity: 40, is_available: 1, rating: 4.4, total_ratings: 167 },
      { item_id: 58, canteen_id: 2, name: 'Pani Puri', description: 'Crispy puris with spicy water', price: 30.00, category: 'Snacks', is_veg: 1, available_quantity: 60, is_available: 1, rating: 4.5, total_ratings: 189 },
      { item_id: 59, canteen_id: 2, name: 'Vada Pav', description: 'Mumbai style vada pav', price: 25.00, category: 'Snacks', is_veg: 1, available_quantity: 50, is_available: 1, rating: 4.2, total_ratings: 145 },
      
      // MBA CANTEEN ITEMS (Canteen ID: 3) - All Vegetarian
      // Rice & Biryani
      { item_id: 60, canteen_id: 3, name: 'Veg Biryani', description: 'Premium vegetable biryani', price: 90.00, category: 'Rice & Biryani', is_veg: 1, available_quantity: 50, is_available: 1, rating: 4.5, total_ratings: 156 },
      { item_id: 61, canteen_id: 3, name: 'Paneer Biryani', description: 'Aromatic paneer biryani', price: 120.00, category: 'Rice & Biryani', is_veg: 1, available_quantity: 35, is_available: 1, rating: 4.6, total_ratings: 123 },
      { item_id: 62, canteen_id: 3, name: 'Mushroom Biryani', description: 'Exotic mushroom biryani', price: 110.00, category: 'Rice & Biryani', is_veg: 1, available_quantity: 30, is_available: 1, rating: 4.4, total_ratings: 89 },
      { item_id: 63, canteen_id: 3, name: 'Curd Rice', description: 'Traditional curd rice', price: 55.00, category: 'Rice & Biryani', is_veg: 1, available_quantity: 60, is_available: 1, rating: 4.3, total_ratings: 167 },
      { item_id: 64, canteen_id: 3, name: 'Lemon Rice', description: 'Zesty lemon rice', price: 60.00, category: 'Rice & Biryani', is_veg: 1, available_quantity: 45, is_available: 1, rating: 4.2, total_ratings: 134 },
      { item_id: 65, canteen_id: 3, name: 'Tamarind Rice', description: 'Tangy tamarind rice', price: 65.00, category: 'Rice & Biryani', is_veg: 1, available_quantity: 40, is_available: 1, rating: 4.3, total_ratings: 98 },
      { item_id: 66, canteen_id: 3, name: 'Tomato Rice', description: 'Flavorful tomato rice', price: 60.00, category: 'Rice & Biryani', is_veg: 1, available_quantity: 42, is_available: 1, rating: 4.1, total_ratings: 112 },
      { item_id: 67, canteen_id: 3, name: 'Veg Fried Rice', description: 'Mixed vegetable fried rice', price: 70.00, category: 'Rice & Biryani', is_veg: 1, available_quantity: 55, is_available: 1, rating: 4.2, total_ratings: 145 },
      
      // South Indian Specials
      { item_id: 68, canteen_id: 3, name: 'Idli', description: 'Soft steamed idli with sambar and chutney', price: 45.00, category: 'South Indian Specials', is_veg: 1, available_quantity: 80, is_available: 1, rating: 4.4, total_ratings: 203 },
      { item_id: 69, canteen_id: 3, name: 'Vada', description: 'Crispy vada with chutneys', price: 40.00, category: 'South Indian Specials', is_veg: 1, available_quantity: 70, is_available: 1, rating: 4.2, total_ratings: 178 },
      { item_id: 70, canteen_id: 3, name: 'Dosa', description: 'Crispy plain dosa', price: 55.00, category: 'South Indian Specials', is_veg: 1, available_quantity: 60, is_available: 1, rating: 4.5, total_ratings: 189 },
      { item_id: 71, canteen_id: 3, name: 'Masala Dosa', description: 'Dosa with spiced potato filling', price: 70.00, category: 'South Indian Specials', is_veg: 1, available_quantity: 50, is_available: 1, rating: 4.6, total_ratings: 234 },
      { item_id: 72, canteen_id: 3, name: 'Onion Dosa', description: 'Dosa topped with onions', price: 65.00, category: 'South Indian Specials', is_veg: 1, available_quantity: 45, is_available: 1, rating: 4.3, total_ratings: 156 },
      { item_id: 73, canteen_id: 3, name: 'Rava Dosa', description: 'Crispy semolina dosa', price: 75.00, category: 'South Indian Specials', is_veg: 1, available_quantity: 40, is_available: 1, rating: 4.4, total_ratings: 123 },
      { item_id: 74, canteen_id: 3, name: 'Uttapam', description: 'Thick pancake with toppings', price: 60.00, category: 'South Indian Specials', is_veg: 1, available_quantity: 35, is_available: 1, rating: 4.2, total_ratings: 98 },
      { item_id: 75, canteen_id: 3, name: 'Pongal', description: 'Traditional rice and lentil dish', price: 50.00, category: 'South Indian Specials', is_veg: 1, available_quantity: 30, is_available: 1, rating: 4.1, total_ratings: 76 },
      { item_id: 76, canteen_id: 3, name: 'Upma', description: 'Savory semolina upma', price: 40.00, category: 'South Indian Specials', is_veg: 1, available_quantity: 50, is_available: 1, rating: 4.0, total_ratings: 134 },
      
      // North Indian & Curries
      { item_id: 77, canteen_id: 3, name: 'Paneer Butter Masala', description: 'Creamy paneer curry', price: 140.00, category: 'North Indian & Curries', is_veg: 1, available_quantity: 40, is_available: 1, rating: 4.6, total_ratings: 167 },
      { item_id: 78, canteen_id: 3, name: 'Palak Paneer', description: 'Paneer in spinach gravy', price: 130.00, category: 'North Indian & Curries', is_veg: 1, available_quantity: 35, is_available: 1, rating: 4.5, total_ratings: 145 },
      { item_id: 79, canteen_id: 3, name: 'Chole Bhature', description: 'Spicy chickpeas with bhature', price: 95.00, category: 'North Indian & Curries', is_veg: 1, available_quantity: 30, is_available: 1, rating: 4.4, total_ratings: 178 },
      { item_id: 80, canteen_id: 3, name: 'Rajma Chawal', description: 'Kidney bean curry with rice', price: 85.00, category: 'North Indian & Curries', is_veg: 1, available_quantity: 40, is_available: 1, rating: 4.3, total_ratings: 156 },
      { item_id: 81, canteen_id: 3, name: 'Aloo Paratha', description: 'Potato stuffed paratha', price: 65.00, category: 'North Indian & Curries', is_veg: 1, available_quantity: 45, is_available: 1, rating: 4.2, total_ratings: 189 },
      { item_id: 82, canteen_id: 3, name: 'Gobi Paratha', description: 'Cauliflower stuffed paratha', price: 70.00, category: 'North Indian & Curries', is_veg: 1, available_quantity: 40, is_available: 1, rating: 4.3, total_ratings: 123 },
      { item_id: 83, canteen_id: 3, name: 'Paneer Paratha', description: 'Paneer stuffed paratha', price: 80.00, category: 'North Indian & Curries', is_veg: 1, available_quantity: 35, is_available: 1, rating: 4.4, total_ratings: 134 },
      
      // Snacks & Street Food
      { item_id: 84, canteen_id: 3, name: 'Samosa', description: 'Crispy vegetable samosa', price: 15.00, category: 'Snacks & Street Food', is_veg: 1, available_quantity: 100, is_available: 1, rating: 4.2, total_ratings: 234 },
      { item_id: 85, canteen_id: 3, name: 'Pav Bhaji', description: 'Mumbai style pav bhaji', price: 75.00, category: 'Snacks & Street Food', is_veg: 1, available_quantity: 50, is_available: 1, rating: 4.5, total_ratings: 203 },
      { item_id: 86, canteen_id: 3, name: 'Pani Puri', description: 'Crispy puris with flavored water', price: 35.00, category: 'Snacks & Street Food', is_veg: 1, available_quantity: 80, is_available: 1, rating: 4.6, total_ratings: 278 }
    ];

    // Insert canteen data
    for (const canteen of canteens) {
      try {
        await db.execute(`
          INSERT INTO canteens (canteen_id, name, location, contact, description, opening_hours, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
          name = VALUES(name),
          location = VALUES(location),
          contact = VALUES(contact),
          description = VALUES(description),
          opening_hours = VALUES(opening_hours),
          is_active = VALUES(is_active)
        `, [
          canteen.canteen_id,
          canteen.name,
          canteen.location,
          canteen.contact,
          canteen.description,
          canteen.opening_hours,
          canteen.is_active
        ]);
        console.log(`✅ Canteen ${canteen.name} added/updated`);
      } catch (error) {
        console.error(`❌ Error adding canteen ${canteen.name}:`, error.message);
      }
    }

    // Insert menu items
    for (const item of menuItems) {
      try {
        await db.execute(`
          INSERT INTO menu_items (
            item_id, canteen_id, name, description, price, category, 
            is_veg, available_quantity, is_available, rating, total_ratings, image_url
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
          name = VALUES(name),
          description = VALUES(description),
          price = VALUES(price),
          category = VALUES(category),
          is_veg = VALUES(is_veg),
          available_quantity = VALUES(available_quantity),
          is_available = VALUES(is_available),
          rating = VALUES(rating),
          total_ratings = VALUES(total_ratings),
          image_url = VALUES(image_url)
        `, [
          item.item_id,
          item.canteen_id,
          item.name,
          item.description,
          item.price,
          item.category,
          item.is_veg,
          item.available_quantity,
          item.is_available,
          item.rating,
          item.total_ratings,
          getImageUrl(item.name)
        ]);
        console.log(`✅ Menu item ${item.name} added/updated`);
      } catch (error) {
        console.error(`❌ Error adding menu item ${item.name}:`, error.message);
      }
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log(`Added ${canteens.length} canteen(s) and ${menuItems.length} menu items`);

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
  } finally {
    process.exit(0);
  }
};

// Run the seeding
seedMenuData();