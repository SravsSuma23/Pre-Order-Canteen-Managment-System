const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Database connection
let db;
async function connectDB() {
    try {
        db = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT
        });
        console.log('✅ Database connected successfully!');
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    }
}

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080', 'http://localhost:8081'],
    credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV
    });
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
    try {
        console.log('Register request:', req.body);
        const { name, email, phone, password } = req.body;

        // Check if user exists
        const [existing] = await db.query('SELECT user_id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const userId = 'user_' + Date.now();
        await db.query(
            'INSERT INTO users (user_id, name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, name, email, phone, hashedPassword, 'student']
        );

        // Generate token
        const token = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: { user_id: userId, name, email, phone, role: 'student' },
                token
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed: ' + error.message
        });
    }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
    try {
        console.log('Login request:', req.body);
        const { email, password } = req.body;

        // Find user
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const user = users[0];

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate token
        const token = jwt.sign({ id: user.user_id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    user_id: user.user_id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role
                },
                token
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed: ' + error.message
        });
    }
});

// Get canteens
app.get('/api/canteens', async (req, res) => {
    try {
        const [canteens] = await db.query('SELECT * FROM canteens WHERE is_active = 1');
        res.json({
            success: true,
            count: canteens.length,
            data: { canteens }
        });
    } catch (error) {
        console.error('Canteens error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch canteens'
        });
    }
});

// Get menu items for a canteen
app.get('/api/menu/canteen/:canteenId', async (req, res) => {
    try {
        const { canteenId } = req.params;
        const [items] = await db.query('SELECT * FROM menu_items WHERE canteen_id = ? AND is_available = 1', [canteenId]);
        res.json({
            success: true,
            count: items.length,
            data: { items }
        });
    } catch (error) {
        console.error('Menu error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch menu items'
        });
    }
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Start server
async function startServer() {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`✅ Server running on port ${PORT}`);
            console.log(`🔗 Health check: http://localhost:${PORT}/health`);
            console.log(`🔗 Frontend can now connect to: http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();