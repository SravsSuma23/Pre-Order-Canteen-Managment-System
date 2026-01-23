const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true
};

const dbName = process.env.DB_NAME || 'canteen_management';

async function createDatabase() {
  let connection;
  
  try {
    console.log('📁 Creating database and tables...');
    
    // Connect without database first
    connection = await mysql.createConnection(dbConfig);
    
    // Create database if it doesn't exist
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`✅ Database '${dbName}' created/verified`);
    
    // Use the database
    await connection.query(`USE \`${dbName}\``);
    
    // Create tables
    const createTablesSQL = `
      -- Users table
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

      -- User sessions table
      CREATE TABLE IF NOT EXISTS user_sessions (
        session_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        user_id VARCHAR(36) NOT NULL,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        INDEX idx_sessions_user (user_id),
        INDEX idx_sessions_expires (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      -- Canteens table
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

      -- Menu items table
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

      -- Cart items table
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

      -- Orders table
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

      -- Order items table
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

      -- Payments table
      CREATE TABLE IF NOT EXISTS payments (
        payment_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        order_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        payment_mode VARCHAR(50) NOT NULL,
        transaction_ref VARCHAR(100),
        upi_ref_id VARCHAR(100),
        payment_status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
        gateway_response JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        verified_at TIMESTAMP NULL,
        FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
        INDEX idx_payments_order (order_id),
        INDEX idx_payments_user (user_id),
        INDEX idx_payments_status (payment_status),
        INDEX idx_payments_ref (transaction_ref)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      -- Menu item ratings table
      CREATE TABLE IF NOT EXISTS menu_item_ratings (
        rating_id INT PRIMARY KEY AUTO_INCREMENT,
        item_id INT NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        review TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (item_id) REFERENCES menu_items(item_id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_item_rating (user_id, item_id),
        INDEX idx_ratings_item (item_id),
        INDEX idx_ratings_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      -- System logs table
      CREATE TABLE IF NOT EXISTS system_logs (
        log_id INT PRIMARY KEY AUTO_INCREMENT,
        user_id VARCHAR(36),
        action VARCHAR(100) NOT NULL,
        details JSON,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
        INDEX idx_logs_user (user_id),
        INDEX idx_logs_action (action),
        INDEX idx_logs_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    await connection.query(createTablesSQL);
    console.log('✅ All tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  createDatabase()
    .then(() => {
      console.log('🎉 Database setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database setup failed:', error);
      process.exit(1);
    });
}

module.exports = { createDatabase };