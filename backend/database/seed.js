const mysql = require('mysql2/promise');
require('dotenv').config();

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'canteen_management'
};

async function seedDatabase() {
  let connection;
  
  try {
    console.log('🌱 Seeding database with sample data...');
    
    connection = await mysql.createConnection(dbConfig);
    
    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🧹 Clearing existing data...');
    await connection.query('DELETE FROM menu_items');
    await connection.query('DELETE FROM canteens');
    await connection.query('ALTER TABLE canteens AUTO_INCREMENT = 1');
    await connection.query('ALTER TABLE menu_items AUTO_INCREMENT = 1');
    
    // Insert sample canteens
    console.log('🏪 Inserting canteens...');
    const canteens = [
      {
        name: 'Main Canteen',
        location: 'Ground Floor, Academic Block A',
        contact: '080-12345678',
        description: 'Our main cafeteria serving diverse cuisines including traditional Indian meals, continental dishes, and daily specials',
        opening_hours: JSON.stringify({
          monday: '07:00-22:00',
          tuesday: '07:00-22:00',
          wednesday: '07:00-22:00',
          thursday: '07:00-22:00',
          friday: '07:00-22:00',
          saturday: '08:00-21:00',
          sunday: '08:00-20:00'
        })
      },
      {
        name: 'IT Canteen',
        location: 'Second Floor, IT Block',
        contact: '080-12345679',
        description: 'Quick bites and fast food - perfect for students looking for pizzas, burgers, sandwiches and street food',
        opening_hours: JSON.stringify({
          monday: '08:00-20:00',
          tuesday: '08:00-20:00',
          wednesday: '08:00-20:00',
          thursday: '08:00-20:00',
          friday: '08:00-20:00',
          saturday: '09:00-19:00',
          sunday: 'closed'
        })
      },
      {
        name: 'MBA Canteen',
        location: 'Ground Floor, MBA Block',
        contact: '080-12345680',
        description: 'Health-focused dining with fresh salads, smoothies, juices, and organic food options',
        opening_hours: JSON.stringify({
          monday: '09:00-18:00',
          tuesday: '09:00-18:00',
          wednesday: '09:00-18:00',
          thursday: '09:00-18:00',
          friday: '09:00-18:00',
          saturday: '10:00-16:00',
          sunday: 'closed'
        })
      }
    ];

    for (const canteen of canteens) {
      await connection.query(
        'INSERT INTO canteens (name, location, contact, description, opening_hours) VALUES (?, ?, ?, ?, ?)',
        [canteen.name, canteen.location, canteen.contact, canteen.description, canteen.opening_hours]
      );
    }
    
    console.log('✅ Canteens inserted successfully!');

    // Insert sample menu items
    console.log('🍽️ Inserting menu items...');
    const menuItems = [
      // Main Canteen items
      { canteen_id: 1, name: 'Chicken Biryani', description: 'Fragrant basmati rice with tender chicken pieces and aromatic spices', price: 120.00, category: 'Non-Veg', is_veg: false, available_quantity: 50, image_url: 'https://images.unsplash.com/photo-1563379091339-03246963d96c?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80' },
      { canteen_id: 1, name: 'Mutton Biryani', description: 'Rich and aromatic mutton biryani with basmati rice', price: 140.00, category: 'Non-Veg', is_veg: false, available_quantity: 30, image_url: 'https://images.unsplash.com/photo-1563379091339-03246963d96c?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80' },
      { canteen_id: 1, name: 'Veg Biryani', description: 'Fragrant vegetable biryani with mixed vegetables and spices', price: 90.00, category: 'Veg', is_veg: true, available_quantity: 40, image_url: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80' },
      { canteen_id: 1, name: 'Dal Tadka with Rice', description: 'Yellow lentils with tempering served with steamed rice', price: 70.00, category: 'Veg', is_veg: true, available_quantity: 60, image_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80' },
      { canteen_id: 1, name: 'Paneer Butter Masala', description: 'Creamy paneer curry in rich tomato-based gravy', price: 110.00, category: 'Veg', is_veg: true, available_quantity: 35, image_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80' },
      { canteen_id: 1, name: 'Fish Curry Meals', description: 'Traditional fish curry with rice and sides', price: 130.00, category: 'Non-Veg', is_veg: false, available_quantity: 25, image_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80' },
      
      // IT Canteen items
      { canteen_id: 2, name: 'Margherita Pizza', description: 'Classic pizza with tomato sauce, mozzarella and fresh basil', price: 180.00, category: 'Veg', is_veg: true, available_quantity: 20, image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80' },
      { canteen_id: 2, name: 'Chicken Pizza', description: 'Loaded pizza with grilled chicken and vegetables', price: 220.00, category: 'Non-Veg', is_veg: false, available_quantity: 15, image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80' },
      { canteen_id: 2, name: 'Veg Burger', description: 'Crispy vegetable patty with fresh lettuce and sauces', price: 80.00, category: 'Veg', is_veg: true, available_quantity: 30, image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80' },
      { canteen_id: 2, name: 'Chicken Burger', description: 'Grilled chicken patty with cheese and fresh vegetables', price: 120.00, category: 'Non-Veg', is_veg: false, available_quantity: 25, image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80' },
      { canteen_id: 2, name: 'Club Sandwich', description: 'Triple layer sandwich with chicken, lettuce, tomato and mayo', price: 100.00, category: 'Non-Veg', is_veg: false, available_quantity: 20, image_url: 'https://images.unsplash.com/photo-1553909489-cd47e0ef937f?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80' },
      { canteen_id: 2, name: 'French Fries', description: 'Crispy golden french fries with ketchup', price: 60.00, category: 'Veg', is_veg: true, available_quantity: 40, image_url: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80' },
      
      // MBA Canteen items
      { canteen_id: 3, name: 'Caesar Salad', description: 'Fresh romaine lettuce with caesar dressing and croutons', price: 120.00, category: 'Veg', is_veg: true, available_quantity: 25, image_url: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80' },
      { canteen_id: 3, name: 'Greek Salad', description: 'Mediterranean salad with feta cheese, olives and fresh vegetables', price: 140.00, category: 'Veg', is_veg: true, available_quantity: 20, image_url: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80' },
      { canteen_id: 3, name: 'Grilled Chicken Salad', description: 'Healthy salad with grilled chicken breast and mixed greens', price: 160.00, category: 'Non-Veg', is_veg: false, available_quantity: 15, image_url: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80' },
      { canteen_id: 3, name: 'Green Smoothie', description: 'Healthy smoothie with spinach, apple, banana and ginger', price: 80.00, category: 'Beverages', is_veg: true, available_quantity: 30, image_url: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80' },
      { canteen_id: 3, name: 'Protein Smoothie', description: 'Post-workout smoothie with protein powder and fresh fruits', price: 100.00, category: 'Beverages', is_veg: true, available_quantity: 25, image_url: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80' },
      { canteen_id: 3, name: 'Quinoa Bowl', description: 'Nutritious quinoa bowl with roasted vegetables and tahini dressing', price: 150.00, category: 'Veg', is_veg: true, available_quantity: 20, image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80' },
      
      // Additional items for better variety
      { canteen_id: 1, name: 'Masala Dosa', description: 'Crispy rice crepe stuffed with spiced potato filling', price: 70.00, category: 'South Indian', is_veg: true, available_quantity: 30, image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80' },
      { canteen_id: 1, name: 'Idli Sambar', description: 'Steamed rice cakes served with lentil curry and chutney', price: 50.00, category: 'South Indian', is_veg: true, available_quantity: 40, image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80' },
      { canteen_id: 1, name: 'Chole Bhature', description: 'Spiced chickpeas served with fluffy fried bread', price: 90.00, category: 'North Indian', is_veg: true, available_quantity: 25, image_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80' },
      { canteen_id: 2, name: 'Chicken Wings', description: 'Spicy buffalo chicken wings with ranch dip', price: 140.00, category: 'Non-Veg', is_veg: false, available_quantity: 20, image_url: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80' },
      { canteen_id: 2, name: 'Pasta Arrabbiata', description: 'Spicy tomato pasta with herbs and garlic', price: 110.00, category: 'Veg', is_veg: true, available_quantity: 25, image_url: 'https://images.unsplash.com/photo-1551892589-865f69869476?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80' },
      { canteen_id: 3, name: 'Fresh Orange Juice', description: 'Freshly squeezed orange juice with no added sugar', price: 60.00, category: 'Beverages', is_veg: true, available_quantity: 35, image_url: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80' }
    ];

    for (const item of menuItems) {
      await connection.query(
        'INSERT INTO menu_items (canteen_id, name, description, price, category, is_veg, available_quantity, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [item.canteen_id, item.name, item.description, item.price, item.category, item.is_veg, item.available_quantity, item.image_url]
      );
    }
    
    console.log('✅ Menu items inserted successfully!');
    
    // Insert sample ratings for menu items
    console.log('⭐ Adding sample ratings...');
    const menuItemIds = await connection.query('SELECT item_id FROM menu_items');
    
    // Add ratings for each menu item (simulating user ratings)
    for (let i = 1; i <= menuItemIds[0].length; i++) {
      const rating = (Math.random() * 2 + 3).toFixed(1); // Random rating between 3.0 - 5.0
      await connection.query(
        'UPDATE menu_items SET nutritional_info = JSON_OBJECT("rating", ?, "total_ratings", ?) WHERE item_id = ?',
        [parseFloat(rating), Math.floor(Math.random() * 200) + 10, i]
      );
    }
    
    console.log('✅ Sample ratings added successfully!');
    
    // Show summary
    const [canteenCount] = await connection.query('SELECT COUNT(*) as count FROM canteens');
    const [menuCount] = await connection.query('SELECT COUNT(*) as count FROM menu_items');
    
    console.log(`\n🎉 Database seeded successfully!`);
    console.log(`📊 Summary:`);
    console.log(`   - Canteens: ${canteenCount[0].count}`);
    console.log(`   - Menu Items: ${menuCount[0].count}`);
    console.log(`\n🚀 Your backend is ready to serve delicious data!`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Database seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };