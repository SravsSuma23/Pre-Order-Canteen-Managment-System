const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080', 'http://localhost:8081'],
    credentials: true
}));
app.use(express.json());

// Simple test routes
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV
    });
});

app.post('/api/auth/login', (req, res) => {
    console.log('Login request received:', req.body);
    res.json({
        success: false,
        message: 'This is a test response - login not implemented yet'
    });
});

app.post('/api/auth/register', (req, res) => {
    console.log('Register request received:', req.body);
    res.json({
        success: false,
        message: 'This is a test response - register not implemented yet'
    });
});

app.get('/api/canteens', (req, res) => {
    res.json({
        success: true,
        count: 3,
        data: {
            canteens: [
                { id: 1, name: 'Main Canteen' },
                { id: 2, name: 'IT Canteen' },
                { id: 3, name: 'MBA Canteen' }
            ]
        }
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'Server error: ' + err.message
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

app.listen(PORT, () => {
    console.log(`✅ Test server running on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 Test login: http://localhost:${PORT}/api/auth/login`);
});