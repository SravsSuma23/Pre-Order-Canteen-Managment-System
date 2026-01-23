const mysql = require('mysql2/promise');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function setupDatabase() {
    console.log('\n🔧 MySQL Database Setup for Canteen Management System\n');
    
    try {
        // Prompt for MySQL credentials
        const username = await new Promise(resolve => {
            rl.question('Enter MySQL username (default: root): ', (answer) => {
                resolve(answer.trim() || 'root');
            });
        });

        const password = await new Promise(resolve => {
            rl.question('Enter MySQL password (press Enter if no password): ', (answer) => {
                resolve(answer.trim());
            });
        });

        const host = await new Promise(resolve => {
            rl.question('Enter MySQL host (default: localhost): ', (answer) => {
                resolve(answer.trim() || 'localhost');
            });
        });

        const port = await new Promise(resolve => {
            rl.question('Enter MySQL port (default: 3306): ', (answer) => {
                resolve(parseInt(answer.trim()) || 3306);
            });
        });

        console.log('\n🔄 Connecting to MySQL...');

        // Create connection without database first
        const connection = await mysql.createConnection({
            host: host,
            user: username,
            password: password,
            port: port
        });

        console.log('✅ Connected to MySQL successfully!');

        // Create database
        console.log('📊 Creating database...');
        await connection.execute('CREATE DATABASE IF NOT EXISTS canteen_management');
        console.log('✅ Database "canteen_management" created/verified');

        // Switch to the database
        await connection.execute('USE canteen_management');

        // Create tables
        console.log('🏗️  Creating tables...');

        // Users table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('student', 'canteen_owner', 'admin') DEFAULT 'student',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Canteens table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS canteens (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                image VARCHAR(255),
                rating DECIMAL(2,1) DEFAULT 0.0,
                delivery_time VARCHAR(20) DEFAULT '15-30 min',
                is_open BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Menu items table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS menu_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                canteen_id INT NOT NULL,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                price DECIMAL(10,2) NOT NULL,
                image VARCHAR(255),
                category VARCHAR(50) NOT NULL,
                is_veg BOOLEAN DEFAULT TRUE,
                is_available BOOLEAN DEFAULT TRUE,
                rating DECIMAL(2,1) DEFAULT 0.0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (canteen_id) REFERENCES canteens(id) ON DELETE CASCADE
            )
        `);

        // Orders table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                canteen_id INT NOT NULL,
                total_amount DECIMAL(10,2) NOT NULL,
                status ENUM('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled') DEFAULT 'pending',
                pickup_time DATETIME,
                payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (canteen_id) REFERENCES canteens(id) ON DELETE CASCADE
            )
        `);

        // Order items table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS order_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_id INT NOT NULL,
                menu_item_id INT NOT NULL,
                quantity INT NOT NULL DEFAULT 1,
                price DECIMAL(10,2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
                FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
            )
        `);

        // Cart table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS cart (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                menu_item_id INT NOT NULL,
                quantity INT NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
            )
        `);

        console.log('✅ All tables created successfully!');

        // Insert sample data
        console.log('🌱 Inserting sample data...');

        // Sample canteens
        await connection.execute(`
            INSERT IGNORE INTO canteens (id, name, description, image, rating, delivery_time) VALUES
            (1, 'Main Canteen', 'The primary canteen serving delicious meals', '/images/canteens/main-canteen.jpg', 4.2, '15-20 min'),
            (2, 'Food Court', 'Multiple food stalls under one roof', '/images/canteens/food-court.jpg', 4.0, '10-15 min'),
            (3, 'Coffee Corner', 'Your daily dose of caffeine and snacks', '/images/canteens/coffee-corner.jpg', 4.5, '5-10 min')
        `);

        // Sample menu items for Main Canteen
        await connection.execute(`
            INSERT IGNORE INTO menu_items (id, canteen_id, name, description, price, image, category, is_veg, rating) VALUES
            (1, 1, 'Veg Thali', 'Complete vegetarian meal with dal, rice, roti, and vegetables', 85.00, '/images/food/veg-thali.jpg', 'main_course', TRUE, 4.3),
            (2, 1, 'Chicken Biryani', 'Aromatic basmati rice with tender chicken pieces', 120.00, '/images/food/chicken-biryani.jpg', 'main_course', FALSE, 4.5),
            (3, 1, 'Masala Dosa', 'Crispy crepe with spiced potato filling', 60.00, '/images/food/masala-dosa.jpg', 'breakfast', TRUE, 4.2),
            (4, 1, 'Paneer Butter Masala', 'Rich and creamy paneer curry', 95.00, '/images/food/paneer-butter-masala.jpg', 'main_course', TRUE, 4.4),
            (5, 1, 'Samosa', 'Deep-fried pastry with spiced potato filling', 15.00, '/images/food/samosa.jpg', 'snacks', TRUE, 4.0)
        `);

        // Sample menu items for Food Court
        await connection.execute(`
            INSERT IGNORE INTO menu_items (id, canteen_id, name, description, price, image, category, is_veg, rating) VALUES
            (6, 2, 'Margherita Pizza', 'Classic pizza with tomato sauce and mozzarella', 180.00, '/images/food/margherita-pizza.jpg', 'fast_food', TRUE, 4.1),
            (7, 2, 'Chicken Burger', 'Juicy chicken patty with fresh vegetables', 95.00, '/images/food/chicken-burger.jpg', 'fast_food', FALSE, 4.3),
            (8, 2, 'Veg Fried Rice', 'Stir-fried rice with mixed vegetables', 75.00, '/images/food/veg-fried-rice.jpg', 'chinese', TRUE, 4.0),
            (9, 2, 'Chaat Platter', 'Assorted Indian street food items', 65.00, '/images/food/chaat-platter.jpg', 'snacks', TRUE, 4.2),
            (10, 2, 'Ice Cream Sundae', 'Vanilla ice cream with chocolate sauce', 45.00, '/images/food/ice-cream-sundae.jpg', 'desserts', TRUE, 4.4)
        `);

        // Sample menu items for Coffee Corner
        await connection.execute(`
            INSERT IGNORE INTO menu_items (id, canteen_id, name, description, price, image, category, is_veg, rating) VALUES
            (11, 3, 'Cappuccino', 'Rich espresso with steamed milk foam', 55.00, '/images/food/cappuccino.jpg', 'beverages', TRUE, 4.6),
            (12, 3, 'Black Coffee', 'Strong black coffee for coffee lovers', 35.00, '/images/food/black-coffee.jpg', 'beverages', TRUE, 4.2),
            (13, 3, 'Chocolate Muffin', 'Moist chocolate chip muffin', 40.00, '/images/food/chocolate-muffin.jpg', 'desserts', TRUE, 4.3),
            (14, 3, 'Grilled Sandwich', 'Toasted sandwich with cheese and vegetables', 70.00, '/images/food/grilled-sandwich.jpg', 'snacks', TRUE, 4.1),
            (15, 3, 'Fresh Juice', 'Seasonal fresh fruit juice', 50.00, '/images/food/fresh-juice.jpg', 'beverages', TRUE, 4.0)
        `);

        console.log('✅ Sample data inserted successfully!');

        // Update .env file
        console.log('⚙️  Updating .env file...');
        const fs = require('fs');
        const envContent = `# Database Configuration
DB_HOST=${host}
DB_USER=${username}
DB_PASSWORD=${password}
DB_NAME=canteen_management
DB_PORT=${port}

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=7d

# Other Configuration
COMPANY_NAME=CanteenCraft Pro
COMPANY_EMAIL=admin@canteencraft.com
`;
        
        fs.writeFileSync('.env', envContent);
        console.log('✅ .env file updated successfully!');

        await connection.end();
        console.log('\n🎉 Database setup completed successfully!');
        console.log('\n📋 Next steps:');
        console.log('   1. Run "npm start" to start the backend server');
        console.log('   2. Run "npm run dev" in the frontend to start the React app');
        console.log('   3. Open http://localhost:5173 in your browser');
        
    } catch (error) {
        console.error('\n❌ Setup failed:', error.message);
        console.log('\n💡 Troubleshooting tips:');
        console.log('   - Make sure MySQL is running');
        console.log('   - Check your username and password');
        console.log('   - Try using MySQL Workbench to connect first');
    } finally {
        rl.close();
    }
}

setupDatabase();