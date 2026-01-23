const mysql = require('mysql2/promise');
const readline = require('readline');
require('dotenv').config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function setupDatabase() {
  try {
    console.log('🚀 Welcome to CampusEats Backend Setup!');
    console.log('=====================================\n');

    // Get database password
    const dbPassword = await askQuestion('Enter your MySQL root password (leave empty if no password): ');
    
    // Database connection configuration
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: dbPassword,
      multipleStatements: true
    };

    const dbName = process.env.DB_NAME || 'canteen_management';

    console.log('\n📁 Testing database connection...');
    
    // Test connection
    let connection = await mysql.createConnection(dbConfig);
    console.log('✅ MySQL connection successful!');

    // Create database
    console.log(`📊 Creating database '${dbName}'...`);
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connection.execute(`USE \`${dbName}\``);
    console.log('✅ Database created successfully!');

    // Create tables
    console.log('🏗️ Creating tables...');
    
    const createTablesSQL = `
      CREATE TABLE IF NOT EXISTS users (
        user_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(15) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('student', 'staff', 'admin') DEFAULT 'student',
        upi_id VARCHAR(100) DEFAULT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        email_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_users_email (email),
        INDEX idx_users_phone (phone),
        INDEX idx_users_role (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      CREATE TABLE IF NOT EXISTS canteens (
        canteen_id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        location VARCHAR(255) NOT NULL,
        contact VARCHAR(15),
        description TEXT,
        opening_hours JSON,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_canteens_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      CREATE TABLE IF NOT EXISTS menu_items (
        item_id INT PRIMARY KEY AUTO_INCREMENT,
        canteen_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        category VARCHAR(50) NOT NULL,
        image_url VARCHAR(500),
        is_veg BOOLEAN DEFAULT TRUE,
        is_available BOOLEAN DEFAULT TRUE,
        available_quantity INT DEFAULT 0,
        preparation_time INT DEFAULT 15,
        nutritional_info JSON,
        allergens JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (canteen_id) REFERENCES canteens(canteen_id) ON DELETE CASCADE,
        INDEX idx_menu_canteen (canteen_id),
        INDEX idx_menu_category (category),
        INDEX idx_menu_available (is_available),
        INDEX idx_menu_veg (is_veg),
        INDEX idx_menu_price (price)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      CREATE TABLE IF NOT EXISTS cart_items (
        cart_id INT PRIMARY KEY AUTO_INCREMENT,
        user_id VARCHAR(36) NOT NULL,
        item_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES menu_items(item_id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_item (user_id, item_id),
        INDEX idx_cart_user (user_id),
        INDEX idx_cart_item (item_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      CREATE TABLE IF NOT EXISTS orders (
        order_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        user_id VARCHAR(36) NOT NULL,
        canteen_id INT NOT NULL,
        pickup_time TIMESTAMP NOT NULL,
        subtotal_amount DECIMAL(10,2) NOT NULL,
        tax_amount DECIMAL(10,2) DEFAULT 0.00,
        total_amount DECIMAL(10,2) NOT NULL,
        payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
        order_status ENUM('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled') DEFAULT 'pending',
        transaction_id VARCHAR(100),
        payment_method VARCHAR(50),
        special_instructions TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
        FOREIGN KEY (canteen_id) REFERENCES canteens(canteen_id) ON DELETE RESTRICT,
        INDEX idx_orders_user (user_id),
        INDEX idx_orders_canteen (canteen_id),
        INDEX idx_orders_status (order_status),
        INDEX idx_orders_payment (payment_status),
        INDEX idx_orders_pickup (pickup_time),
        INDEX idx_orders_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      CREATE TABLE IF NOT EXISTS order_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        order_id VARCHAR(36) NOT NULL,
        item_id INT NOT NULL,
        quantity INT NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES menu_items(item_id) ON DELETE RESTRICT,
        INDEX idx_order_items_order (order_id),
        INDEX idx_order_items_item (item_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createTablesSQL);
    console.log('✅ Tables created successfully!');

    // Insert sample data
    console.log('🌱 Adding sample data...');
    
    // Insert canteens
    const canteens = [
      ['Main Canteen', 'Ground Floor, Academic Block A', '080-12345678', 'Our main cafeteria serving diverse cuisines', '{"monday":"07:00-22:00","tuesday":"07:00-22:00","wednesday":"07:00-22:00","thursday":"07:00-22:00","friday":"07:00-22:00","saturday":"08:00-21:00","sunday":"08:00-20:00"}'],
      ['IT Canteen', 'Second Floor, IT Block', '080-12345679', 'Quick bites and fast food for students', '{"monday":"08:00-20:00","tuesday":"08:00-20:00","wednesday":"08:00-20:00","thursday":"08:00-20:00","friday":"08:00-20:00","saturday":"09:00-19:00","sunday":"closed"}'],
      ['MBA Canteen', 'Ground Floor, MBA Block', '080-12345680', 'Health-focused dining with fresh options', '{"monday":"09:00-18:00","tuesday":"09:00-18:00","wednesday":"09:00-18:00","thursday":"09:00-18:00","friday":"09:00-18:00","saturday":"10:00-16:00","sunday":"closed"}']
    ];

    for (const canteen of canteens) {
      await connection.execute(
        'INSERT IGNORE INTO canteens (name, location, contact, description, opening_hours) VALUES (?, ?, ?, ?, ?)',
        canteen
      );
    }

    // Insert menu items
    const menuItems = [
      [1, 'Chicken Biryani', 'Fragrant basmati rice with tender chicken', 120.00, 'Non-Veg', false, 50, 'https://images.unsplash.com/photo-1563379091339-03246963d96c?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80'],
      [1, 'Veg Biryani', 'Fragrant vegetable biryani with spices', 90.00, 'Veg', true, 40, 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80'],
      [1, 'Dal Tadka', 'Yellow lentils with tempering and rice', 70.00, 'Veg', true, 60, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80'],
      [1, 'Paneer Butter Masala', 'Creamy paneer in rich tomato gravy', 110.00, 'Veg', true, 35, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80'],
      [2, 'Margherita Pizza', 'Classic pizza with mozzarella and basil', 180.00, 'Veg', true, 20, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80'],
      [2, 'Chicken Burger', 'Grilled chicken with cheese and vegetables', 120.00, 'Non-Veg', false, 25, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80'],
      [2, 'French Fries', 'Crispy golden fries with ketchup', 60.00, 'Veg', true, 40, 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80'],
      [3, 'Caesar Salad', 'Fresh romaine with caesar dressing', 120.00, 'Veg', true, 25, 'https://images.unsplash.com/photo-1546793665-c74683f339c1?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80'],
      [3, 'Green Smoothie', 'Healthy smoothie with spinach and fruits', 80.00, 'Beverages', true, 30, 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80'],
      [3, 'Quinoa Bowl', 'Nutritious quinoa with roasted vegetables', 150.00, 'Veg', true, 20, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80']
    ];

    for (const item of menuItems) {
      await connection.execute(
        'INSERT IGNORE INTO menu_items (canteen_id, name, description, price, category, is_veg, available_quantity, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        item
      );
    }

    await connection.end();

    console.log('\n🎉 Setup completed successfully!');
    console.log('📊 Database Summary:');
    console.log('   ✅ Database: canteen_management');
    console.log('   ✅ Tables: users, canteens, menu_items, cart_items, orders, order_items');
    console.log('   ✅ Sample data: 3 canteens, 10+ menu items');
    console.log('\n🚀 Your backend is ready! You can now start the server with: npm run dev');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 MySQL connection failed. Please check:');
      console.log('   - MySQL is running');
      console.log('   - Correct password entered');
      console.log('   - User "root" exists and has permissions');
    }
  } finally {
    rl.close();
  }
}

setupDatabase();