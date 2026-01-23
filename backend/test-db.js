const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
    console.log('Testing database connection...');
    console.log('DB_HOST:', process.env.DB_HOST);
    console.log('DB_USER:', process.env.DB_USER);
    console.log('DB_NAME:', process.env.DB_NAME);
    console.log('DB_PORT:', process.env.DB_PORT);
    
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT
        });
        
        console.log('✅ Database connected successfully!');
        
        // Test query
        const [rows] = await connection.query('SELECT COUNT(*) as count FROM users');
        console.log('✅ Users table accessible:', rows[0].count, 'users found');
        
        const [canteens] = await connection.query('SELECT COUNT(*) as count FROM canteens');
        console.log('✅ Canteens table accessible:', canteens[0].count, 'canteens found');
        
        await connection.end();
        console.log('✅ Connection closed successfully');
        
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.error('Error details:', error);
    }
}

testConnection();