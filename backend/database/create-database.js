const mysql = require('mysql2/promise');
const fs = require('fs');

async function setupDatabase() {
    console.log('\n🔧 Creating MySQL Database for Canteen Management System\n');
    
    try {
        // MySQL credentials 
        const host = 'localhost';
        const username = 'root';
        const password = 'Sravanthi@2003'; // Using the password that worked
        const port = 3306;

        console.log('🔄 Connecting to MySQL...');

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
        await connection.query('CREATE DATABASE IF NOT EXISTS canteen_management');
        console.log('✅ Database "canteen_management" created successfully!');

        // Update .env file
        console.log('⚙️  Updating .env file...');
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
        console.log('\n🎉 Database created successfully!');
        console.log('\n📋 Next steps:');
        console.log('   1. Run "npm run migrate" to create the tables');
        console.log('   2. Run "npm run seed" to insert sample data');
        console.log('   3. Run "npm start" to start the backend server');
        
    } catch (error) {
        console.error('\n❌ Setup failed:', error.message);
        console.log('\n💡 Troubleshooting tips:');
        console.log('   - Make sure MySQL is running');
        console.log('   - Check your username and password');
    }
}

setupDatabase();