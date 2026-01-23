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
  if (name.includes('noodles')) return 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=300&h=200&fit=crop';
  if (name.includes('burger')) return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=200&fit=crop';
  if (name.includes('sandwich')) return 'https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=300&h=200&fit=crop';
  if (name.includes('momos')) return 'https://images.unsplash.com/photo-1626776879286-0e2b0a9b0b8e?w=300&h=200&fit=crop';
  if (name.includes('shawarma') || name.includes('roll')) return 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop';
  if (name.includes('curry') || name.includes('masala')) return 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=200&fit=crop';
  if (name.includes('paratha')) return 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=300&h=200&fit=crop';
  if (name.includes('thali')) return 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=200&fit=crop';
  if (name.includes('puff')) return 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&h=200&fit=crop';
  if (name.includes('cutlet')) return 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&h=200&fit=crop';
  if (name.includes('maggi')) return 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=300&h=200&fit=crop';
  if (name.includes('chowmein')) return 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=300&h=200&fit=crop';
  if (name.includes('soup')) return 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=300&h=200&fit=crop';
  if (name.includes('pakoda')) return 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&h=200&fit=crop';
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

    // Updated menu items for all canteens (30 items each as requested)
    const menuItems = [
      // MAIN CANTEEN ITEMS (Canteen ID: 1) - 15 Veg + 15 Non-Veg = 30 items

      // 🥦 VEGETARIAN ITEMS (15 items)
      { item_id: 1, canteen_id: 1, name: 'Veg Fried Rice', description: 'Mixed vegetable fried rice', price: 80, category: 'Rice & Noodles', is_veg: 1, available_quantity: 45, is_available: 1, rating: 4.3, total_ratings: 156 },
      { item_id: 2, canteen_id: 1, name: 'Paneer Butter Masala', description: 'Creamy paneer curry', price: 140, category: 'Main Course', is_veg: 1, available_quantity: 35, is_available: 1, rating: 4.6, total_ratings: 203 },
      { item_id: 3, canteen_id: 1, name: 'Veg Noodles', description: 'Chinese style vegetable noodles', price: 75, category: 'Rice & Noodles', is_veg: 1, available_quantity: 40, is_available: 1, rating: 4.2, total_ratings: 134 },
      { item_id: 4, canteen_id: 1, name: 'Gobi Manchurian', description: 'Crispy cauliflower manchurian', price: 90, category: 'Starters', is_veg: 1, available_quantity: 30, is_available: 1, rating: 4.4, total_ratings: 167 },
      { item_id: 5, canteen_id: 1, name: 'Veg Biryani', description: 'Aromatic vegetable biryani', price: 100, category: 'Rice & Noodles', is_veg: 1, available_quantity: 50, is_available: 1, rating: 4.5, total_ratings: 189 },
      { item_id: 6, canteen_id: 1, name: 'Chole Bhature', description: 'Spicy chickpeas with fried bread', price: 85, category: 'Main Course', is_veg: 1, available_quantity: 35, is_available: 1, rating: 4.3, total_ratings: 145 },
      { item_id: 7, canteen_id: 1, name: 'Veg Sandwich', description: 'Fresh vegetable sandwich', price: 60, category: 'Fast Food', is_veg: 1, available_quantity: 55, is_available: 1, rating: 4.1, total_ratings: 123 },
      { item_id: 8, canteen_id: 1, name: 'Masala Dosa', description: 'Dosa with spiced potato filling', price: 70, category: 'South Indian', is_veg: 1, available_quantity: 60, is_available: 1, rating: 4.6, total_ratings: 234 },
      { item_id: 9, canteen_id: 1, name: 'Idli & Sambar', description: 'Steamed idli with sambar and chutney', price: 50, category: 'South Indian', is_veg: 1, available_quantity: 80, is_available: 1, rating: 4.4, total_ratings: 178 },
      { item_id: 10, canteen_id: 1, name: 'Poori Curry', description: 'Fried bread with potato curry', price: 65, category: 'Main Course', is_veg: 1, available_quantity: 45, is_available: 1, rating: 4.2, total_ratings: 156 },
      { item_id: 11, canteen_id: 1, name: 'Veg Pulao', description: 'Seasoned vegetable rice', price: 75, category: 'Rice & Noodles', is_veg: 1, available_quantity: 40, is_available: 1, rating: 4.3, total_ratings: 134 },
      { item_id: 12, canteen_id: 1, name: 'Veg Burger', description: 'Vegetable patty burger', price: 90, category: 'Fast Food', is_veg: 1, available_quantity: 30, is_available: 1, rating: 4.1, total_ratings: 167 },
      { item_id: 13, canteen_id: 1, name: 'Aloo Paratha', description: 'Stuffed potato paratha', price: 60, category: 'Main Course', is_veg: 1, available_quantity: 50, is_available: 1, rating: 4.2, total_ratings: 145 },
      { item_id: 14, canteen_id: 1, name: 'Veg Momos', description: 'Steamed vegetable dumplings', price: 70, category: 'Starters', is_veg: 1, available_quantity: 35, is_available: 1, rating: 4.3, total_ratings: 123 },
      { item_id: 15, canteen_id: 1, name: 'Mixed Veg Curry', description: 'Assorted vegetable curry', price: 85, category: 'Main Course', is_veg: 1, available_quantity: 40, is_available: 1, rating: 4.4, total_ratings: 189 },

      // 🍗 NON-VEGETARIAN ITEMS (15 items)
      { item_id: 16, canteen_id: 1, name: 'Chicken Fried Rice', description: 'Chicken fried rice with vegetables', price: 120, category: 'Rice & Noodles', is_veg: 0, available_quantity: 35, is_available: 1, rating: 4.5, total_ratings: 167 },
      { item_id: 17, canteen_id: 1, name: 'Egg Noodles', description: 'Noodles with scrambled eggs', price: 95, category: 'Rice & Noodles', is_veg: 0, available_quantity: 40, is_available: 1, rating: 4.3, total_ratings: 134 },
      { item_id: 18, canteen_id: 1, name: 'Chicken 65', description: 'Spicy fried chicken starter', price: 130, category: 'Starters', is_veg: 0, available_quantity: 30, is_available: 1, rating: 4.7, total_ratings: 203 },
      { item_id: 19, canteen_id: 1, name: 'Chicken Biryani', description: 'Traditional chicken biryani', price: 150, category: 'Rice & Noodles', is_veg: 0, available_quantity: 25, is_available: 1, rating: 4.8, total_ratings: 234 },
      { item_id: 20, canteen_id: 1, name: 'Fish Curry & Rice', description: 'Fish curry with steamed rice', price: 140, category: 'Main Course', is_veg: 0, available_quantity: 20, is_available: 1, rating: 4.6, total_ratings: 178 },
      { item_id: 21, canteen_id: 1, name: 'Chicken Shawarma', description: 'Middle Eastern chicken wrap', price: 110, category: 'Fast Food', is_veg: 0, available_quantity: 35, is_available: 1, rating: 4.4, total_ratings: 156 },
      { item_id: 22, canteen_id: 1, name: 'Chicken Roll', description: 'Spicy chicken roll', price: 100, category: 'Fast Food', is_veg: 0, available_quantity: 40, is_available: 1, rating: 4.3, total_ratings: 145 },
      { item_id: 23, canteen_id: 1, name: 'Chicken Manchurian', description: 'Indo-Chinese chicken dish', price: 135, category: 'Main Course', is_veg: 0, available_quantity: 25, is_available: 1, rating: 4.5, total_ratings: 189 },
      { item_id: 24, canteen_id: 1, name: 'Egg Curry', description: 'Spicy egg curry', price: 90, category: 'Main Course', is_veg: 0, available_quantity: 45, is_available: 1, rating: 4.2, total_ratings: 134 },
      { item_id: 25, canteen_id: 1, name: 'Chicken Sandwich', description: 'Grilled chicken sandwich', price: 105, category: 'Fast Food', is_veg: 0, available_quantity: 30, is_available: 1, rating: 4.4, total_ratings: 167 },
      { item_id: 26, canteen_id: 1, name: 'Chicken Burger', description: 'Chicken patty burger', price: 125, category: 'Fast Food', is_veg: 0, available_quantity: 25, is_available: 1, rating: 4.6, total_ratings: 203 },
      { item_id: 27, canteen_id: 1, name: 'Mutton Curry', description: 'Rich mutton curry', price: 180, category: 'Main Course', is_veg: 0, available_quantity: 15, is_available: 1, rating: 4.8, total_ratings: 145 },
      { item_id: 28, canteen_id: 1, name: 'Grilled Chicken', description: 'Grilled chicken with spices', price: 160, category: 'Main Course', is_veg: 0, available_quantity: 20, is_available: 1, rating: 4.7, total_ratings: 178 },
      { item_id: 29, canteen_id: 1, name: 'Butter Chicken', description: 'Creamy butter chicken', price: 170, category: 'Main Course', is_veg: 0, available_quantity: 18, is_available: 1, rating: 4.9, total_ratings: 234 },
      { item_id: 30, canteen_id: 1, name: 'Egg Puff', description: 'Flaky pastry with egg filling', price: 45, category: 'Snacks', is_veg: 0, available_quantity: 60, is_available: 1, rating: 4.1, total_ratings: 123 },

      // IT CANTEEN ITEMS (Canteen ID: 2) - 15 Veg + 15 Non-Veg = 30 items

      // 🥗 VEGETARIAN ITEMS (15 items)
      { item_id: 31, canteen_id: 2, name: 'Veg Hakka Noodles', description: 'Chinese hakka style noodles', price: 80, category: 'Rice & Noodles', is_veg: 1, available_quantity: 50, is_available: 1, rating: 4.3, total_ratings: 145 },
      { item_id: 32, canteen_id: 2, name: 'Veg Fried Rice', description: 'Mixed vegetable fried rice', price: 75, category: 'Rice & Noodles', is_veg: 1, available_quantity: 55, is_available: 1, rating: 4.2, total_ratings: 167 },
      { item_id: 33, canteen_id: 2, name: 'Paneer Tikka', description: 'Grilled paneer with spices', price: 120, category: 'Starters', is_veg: 1, available_quantity: 35, is_available: 1, rating: 4.5, total_ratings: 189 },
      { item_id: 34, canteen_id: 2, name: 'Veg Puff', description: 'Vegetable stuffed puff pastry', price: 40, category: 'Snacks', is_veg: 1, available_quantity: 70, is_available: 1, rating: 4.1, total_ratings: 134 },
      { item_id: 35, canteen_id: 2, name: 'Veg Cutlet', description: 'Crispy vegetable cutlets', price: 60, category: 'Starters', is_veg: 1, available_quantity: 45, is_available: 1, rating: 4.2, total_ratings: 156 },
      { item_id: 36, canteen_id: 2, name: 'Veg Sandwich', description: 'Fresh vegetable sandwich', price: 55, category: 'Fast Food', is_veg: 1, available_quantity: 60, is_available: 1, rating: 4.0, total_ratings: 123 },
      { item_id: 37, canteen_id: 2, name: 'Masala Dosa', description: 'Dosa with spiced potato filling', price: 65, category: 'South Indian', is_veg: 1, available_quantity: 65, is_available: 1, rating: 4.4, total_ratings: 178 },
      { item_id: 38, canteen_id: 2, name: 'Onion Uttapam', description: 'Thick pancake with onions', price: 70, category: 'South Indian', is_veg: 1, available_quantity: 40, is_available: 1, rating: 4.3, total_ratings: 145 },
      { item_id: 39, canteen_id: 2, name: 'Chapathi & Curry', description: 'Indian flatbread with curry', price: 85, category: 'Main Course', is_veg: 1, available_quantity: 35, is_available: 1, rating: 4.2, total_ratings: 134 },
      { item_id: 40, canteen_id: 2, name: 'Veg Biryani', description: 'Aromatic vegetable biryani', price: 95, category: 'Rice & Noodles', is_veg: 1, available_quantity: 45, is_available: 1, rating: 4.4, total_ratings: 167 },
      { item_id: 41, canteen_id: 2, name: 'Veg Momos', description: 'Steamed vegetable dumplings', price: 65, category: 'Starters', is_veg: 1, available_quantity: 50, is_available: 1, rating: 4.3, total_ratings: 189 },
      { item_id: 42, canteen_id: 2, name: 'Veg Burger', description: 'Vegetable patty burger', price: 85, category: 'Fast Food', is_veg: 1, available_quantity: 35, is_available: 1, rating: 4.1, total_ratings: 156 },
      { item_id: 43, canteen_id: 2, name: 'Idli Sambar', description: 'Idli with sambar and chutney', price: 45, category: 'South Indian', is_veg: 1, available_quantity: 75, is_available: 1, rating: 4.5, total_ratings: 203 },
      { item_id: 44, canteen_id: 2, name: 'Lemon Rice', description: 'Tangy lemon rice', price: 60, category: 'Rice & Noodles', is_veg: 1, available_quantity: 55, is_available: 1, rating: 4.2, total_ratings: 134 },
      { item_id: 45, canteen_id: 2, name: 'Aloo Curry & Rice', description: 'Potato curry with rice', price: 75, category: 'Main Course', is_veg: 1, available_quantity: 40, is_available: 1, rating: 4.3, total_ratings: 167 },

      // 🍳 NON-VEGETARIAN ITEMS (15 items)
      { item_id: 46, canteen_id: 2, name: 'Chicken Fried Rice', description: 'Chicken fried rice with vegetables', price: 115, category: 'Rice & Noodles', is_veg: 0, available_quantity: 40, is_available: 1, rating: 4.4, total_ratings: 178 },
      { item_id: 47, canteen_id: 2, name: 'Egg Fried Rice', description: 'Egg fried rice', price: 95, category: 'Rice & Noodles', is_veg: 0, available_quantity: 45, is_available: 1, rating: 4.3, total_ratings: 145 },
      { item_id: 48, canteen_id: 2, name: 'Chicken Noodles', description: 'Chicken noodles with vegetables', price: 110, category: 'Rice & Noodles', is_veg: 0, available_quantity: 35, is_available: 1, rating: 4.5, total_ratings: 189 },
      { item_id: 49, canteen_id: 2, name: 'Chicken Puff', description: 'Chicken stuffed puff pastry', price: 55, category: 'Snacks', is_veg: 0, available_quantity: 60, is_available: 1, rating: 4.2, total_ratings: 134 },
      { item_id: 50, canteen_id: 2, name: 'Chicken Curry & Rice', description: 'Chicken curry with rice', price: 130, category: 'Main Course', is_veg: 0, available_quantity: 30, is_available: 1, rating: 4.6, total_ratings: 203 },
      { item_id: 51, canteen_id: 2, name: 'Egg Roll', description: 'Egg wrapped in paratha', price: 70, category: 'Fast Food', is_veg: 0, available_quantity: 50, is_available: 1, rating: 4.3, total_ratings: 167 },
      { item_id: 52, canteen_id: 2, name: 'Chicken Roll', description: 'Spicy chicken roll', price: 90, category: 'Fast Food', is_veg: 0, available_quantity: 45, is_available: 1, rating: 4.4, total_ratings: 156 },
      { item_id: 53, canteen_id: 2, name: 'Chicken Biryani', description: 'Traditional chicken biryani', price: 140, category: 'Rice & Noodles', is_veg: 0, available_quantity: 25, is_available: 1, rating: 4.7, total_ratings: 234 },
      { item_id: 54, canteen_id: 2, name: 'Fish Fry', description: 'Crispy fried fish', price: 125, category: 'Starters', is_veg: 0, available_quantity: 20, is_available: 1, rating: 4.5, total_ratings: 178 },
      { item_id: 55, canteen_id: 2, name: 'Egg Dosa', description: 'Dosa with egg topping', price: 80, category: 'South Indian', is_veg: 0, available_quantity: 35, is_available: 1, rating: 4.2, total_ratings: 145 },
      { item_id: 56, canteen_id: 2, name: 'Chicken Lollipop', description: 'Spicy chicken lollipops', price: 135, category: 'Starters', is_veg: 0, available_quantity: 25, is_available: 1, rating: 4.6, total_ratings: 189 },
      { item_id: 57, canteen_id: 2, name: 'Egg Curry', description: 'Spicy egg curry', price: 85, category: 'Main Course', is_veg: 0, available_quantity: 40, is_available: 1, rating: 4.3, total_ratings: 134 },
      { item_id: 58, canteen_id: 2, name: 'Chicken Kebab', description: 'Grilled chicken kebab', price: 150, category: 'Starters', is_veg: 0, available_quantity: 20, is_available: 1, rating: 4.8, total_ratings: 203 },
      { item_id: 59, canteen_id: 2, name: 'Chicken Sandwich', description: 'Grilled chicken sandwich', price: 100, category: 'Fast Food', is_veg: 0, available_quantity: 35, is_available: 1, rating: 4.4, total_ratings: 167 },
      { item_id: 60, canteen_id: 2, name: 'Chicken Wrap', description: 'Chicken wrapped in tortilla', price: 110, category: 'Fast Food', is_veg: 0, available_quantity: 30, is_available: 1, rating: 4.5, total_ratings: 156 },

      // MBA CANTEEN ITEMS (Canteen ID: 3) - 100% Vegetarian (30 items)

      // 🌿 VEGETARIAN ITEMS (30 items)
      { item_id: 61, canteen_id: 3, name: 'Veg Fried Rice', description: 'Mixed vegetable fried rice', price: 90, category: 'Rice & Noodles', is_veg: 1, available_quantity: 50, is_available: 1, rating: 4.4, total_ratings: 167 },
      { item_id: 62, canteen_id: 3, name: 'Veg Biryani', description: 'Aromatic vegetable biryani', price: 110, category: 'Rice & Noodles', is_veg: 1, available_quantity: 45, is_available: 1, rating: 4.6, total_ratings: 203 },
      { item_id: 63, canteen_id: 3, name: 'Paneer Butter Masala', description: 'Creamy paneer curry', price: 150, category: 'Main Course', is_veg: 1, available_quantity: 35, is_available: 1, rating: 4.8, total_ratings: 234 },
      { item_id: 64, canteen_id: 3, name: 'Veg Noodles', description: 'Chinese style vegetable noodles', price: 85, category: 'Rice & Noodles', is_veg: 1, available_quantity: 55, is_available: 1, rating: 4.3, total_ratings: 145 },
      { item_id: 65, canteen_id: 3, name: 'Gobi Manchurian', description: 'Crispy cauliflower manchurian', price: 95, category: 'Starters', is_veg: 1, available_quantity: 40, is_available: 1, rating: 4.5, total_ratings: 189 },
      { item_id: 66, canteen_id: 3, name: 'Masala Dosa', description: 'Dosa with spiced potato filling', price: 75, category: 'South Indian', is_veg: 1, available_quantity: 60, is_available: 1, rating: 4.7, total_ratings: 178 },
      { item_id: 67, canteen_id: 3, name: 'Veg Sandwich', description: 'Fresh vegetable sandwich', price: 65, category: 'Fast Food', is_veg: 1, available_quantity: 65, is_available: 1, rating: 4.2, total_ratings: 134 },
      { item_id: 68, canteen_id: 3, name: 'Idli Sambar', description: 'Idli with sambar and chutney', price: 55, category: 'South Indian', is_veg: 1, available_quantity: 80, is_available: 1, rating: 4.6, total_ratings: 203 },
      { item_id: 69, canteen_id: 3, name: 'Chapathi & Curry', description: 'Indian flatbread with curry', price: 90, category: 'Main Course', is_veg: 1, available_quantity: 40, is_available: 1, rating: 4.4, total_ratings: 167 },
      { item_id: 70, canteen_id: 3, name: 'Lemon Rice', description: 'Tangy lemon rice', price: 65, category: 'Rice & Noodles', is_veg: 1, available_quantity: 60, is_available: 1, rating: 4.3, total_ratings: 145 },
      { item_id: 71, canteen_id: 3, name: 'Veg Burger', description: 'Vegetable patty burger', price: 95, category: 'Fast Food', is_veg: 1, available_quantity: 35, is_available: 1, rating: 4.2, total_ratings: 156 },
      { item_id: 72, canteen_id: 3, name: 'Veg Puff', description: 'Vegetable stuffed puff pastry', price: 45, category: 'Snacks', is_veg: 1, available_quantity: 75, is_available: 1, rating: 4.1, total_ratings: 134 },
      { item_id: 73, canteen_id: 3, name: 'Veg Momos', description: 'Steamed vegetable dumplings', price: 70, category: 'Starters', is_veg: 1, available_quantity: 50, is_available: 1, rating: 4.4, total_ratings: 189 },
      { item_id: 74, canteen_id: 3, name: 'Aloo Paratha', description: 'Stuffed potato paratha', price: 65, category: 'Main Course', is_veg: 1, available_quantity: 55, is_available: 1, rating: 4.3, total_ratings: 167 },
      { item_id: 75, canteen_id: 3, name: 'Curd Rice', description: 'Cooling curd rice', price: 60, category: 'Rice & Noodles', is_veg: 1, available_quantity: 70, is_available: 1, rating: 4.5, total_ratings: 178 },
      { item_id: 76, canteen_id: 3, name: 'Tomato Rice', description: 'Flavorful tomato rice', price: 70, category: 'Rice & Noodles', is_veg: 1, available_quantity: 65, is_available: 1, rating: 4.2, total_ratings: 145 },
      { item_id: 77, canteen_id: 3, name: 'Veg Pulao', description: 'Seasoned vegetable rice', price: 80, category: 'Rice & Noodles', is_veg: 1, available_quantity: 45, is_available: 1, rating: 4.4, total_ratings: 189 },
      { item_id: 78, canteen_id: 3, name: 'Veg Cutlet', description: 'Crispy vegetable cutlets', price: 65, category: 'Starters', is_veg: 1, available_quantity: 50, is_available: 1, rating: 4.3, total_ratings: 134 },
      { item_id: 79, canteen_id: 3, name: 'Veg Spring Roll', description: 'Crispy vegetable spring rolls', price: 75, category: 'Starters', is_veg: 1, available_quantity: 40, is_available: 1, rating: 4.5, total_ratings: 167 },
      { item_id: 80, canteen_id: 3, name: 'Veg Thali', description: 'Complete vegetarian meal', price: 120, category: 'Main Course', is_veg: 1, available_quantity: 30, is_available: 1, rating: 4.7, total_ratings: 203 },
      { item_id: 81, canteen_id: 3, name: 'Veg Maggi', description: 'Instant noodles with vegetables', price: 50, category: 'Rice & Noodles', is_veg: 1, available_quantity: 85, is_available: 1, rating: 4.1, total_ratings: 156 },
      { item_id: 82, canteen_id: 3, name: 'Veg Chowmein', description: 'Chinese style vegetable noodles', price: 85, category: 'Rice & Noodles', is_veg: 1, available_quantity: 45, is_available: 1, rating: 4.3, total_ratings: 134 },
      { item_id: 83, canteen_id: 3, name: 'Dal Fry & Rice', description: 'Lentils with rice', price: 80, category: 'Main Course', is_veg: 1, available_quantity: 50, is_available: 1, rating: 4.4, total_ratings: 178 },
      { item_id: 84, canteen_id: 3, name: 'Veg Korma', description: 'Creamy vegetable korma', price: 100, category: 'Main Course', is_veg: 1, available_quantity: 35, is_available: 1, rating: 4.5, total_ratings: 145 },
      { item_id: 85, canteen_id: 3, name: 'Mixed Veg Curry', description: 'Assorted vegetable curry', price: 90, category: 'Main Course', is_veg: 1, available_quantity: 45, is_available: 1, rating: 4.6, total_ratings: 189 },
      { item_id: 86, canteen_id: 3, name: 'Poori Curry', description: 'Fried bread with potato curry', price: 70, category: 'Main Course', is_veg: 1, available_quantity: 55, is_available: 1, rating: 4.2, total_ratings: 167 },
      { item_id: 87, canteen_id: 3, name: 'Veg Soup', description: 'Hot vegetable soup', price: 45, category: 'Starters', is_veg: 1, available_quantity: 60, is_available: 1, rating: 4.3, total_ratings: 134 },
      { item_id: 88, canteen_id: 3, name: 'Veg Pakoda', description: 'Mixed vegetable fritters', price: 55, category: 'Snacks', is_veg: 1, available_quantity: 70, is_available: 1, rating: 4.4, total_ratings: 156 },
      { item_id: 89, canteen_id: 3, name: 'Veg Manchurian Rice', description: 'Vegetable manchurian with rice', price: 95, category: 'Rice & Noodles', is_veg: 1, available_quantity: 40, is_available: 1, rating: 4.5, total_ratings: 178 },
      { item_id: 90, canteen_id: 3, name: 'Veg Sandwich Toast', description: 'Toasted vegetable sandwich', price: 60, category: 'Fast Food', is_veg: 1, available_quantity: 65, is_available: 1, rating: 4.1, total_ratings: 145 }
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
