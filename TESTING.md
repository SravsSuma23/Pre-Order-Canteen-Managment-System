# Testing Guide - Pre-Order Canteen Management System

## Overview

This document provides comprehensive testing instructions for the Pre-Order Canteen Management System, including backend API testing, frontend testing, integration testing, and automated testing procedures.

## Prerequisites

- Node.js (v16 or higher)
- MySQL database running
- Postman or similar API testing tool
- Environment variables configured (.env file)

---

## Backend API Testing

### 1. Setting Up Test Environment

First, ensure your backend server is running:

```bash
cd backend
npm install
npm run dev
```

### 2. Authentication Testing

#### Register New User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "9876543210",
    "password": "password123",
    "upi_id": "test@upi"
  }'
```

Expected Response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "user_id": "uuid",
      "name": "Test User",
      "email": "test@example.com"
    },
    "token": "jwt_token"
  }
}
```

#### User Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Save the JWT token from the response for subsequent requests**

#### Get User Profile
```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Canteen and Menu Testing

#### Get All Canteens
```bash
curl -X GET http://localhost:5000/api/canteens
```

#### Get Canteen Menu
```bash
curl -X GET "http://localhost:5000/api/canteens/1/menu?category=Non-Veg&available_only=true"
```

#### Search Menu Items
```bash
curl -X GET "http://localhost:5000/api/canteens/search?q=biryani&is_veg=false"
```

### 4. Cart Management Testing

#### Add Item to Cart
```bash
curl -X POST http://localhost:5000/api/cart \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "item_id": 1,
    "quantity": 2
  }'
```

#### Get Cart
```bash
curl -X GET http://localhost:5000/api/cart \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Update Cart Item
```bash
curl -X PUT http://localhost:5000/api/cart/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 3
  }'
```

#### Get Cart Summary
```bash
curl -X GET http://localhost:5000/api/cart/summary \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5. Order Management Testing

#### Create Order
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pickup_time": "2024-12-01T13:00:00.000Z",
    "special_instructions": "Extra spicy",
    "payment_method": "upi"
  }'
```

#### Get User Orders
```bash
curl -X GET "http://localhost:5000/api/orders?status=pending&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Get Order Details
```bash
curl -X GET http://localhost:5000/api/orders/ORDER_UUID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 6. Payment Testing

#### Initiate Payment
```bash
curl -X POST http://localhost:5000/api/payments/initiate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "ORDER_UUID",
    "amount": 210.00,
    "upi_id": "test@upi"
  }'
```

#### Verify Payment
```bash
curl -X POST http://localhost:5000/api/payments/verify \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "ORDER_UUID",
    "transaction_ref": "TXN123456789",
    "upi_ref_id": "UPI123456789",
    "amount": 210.00
  }'
```

### 7. Receipt Testing

#### Get Receipt Data
```bash
curl -X GET http://localhost:5000/api/receipts/ORDER_UUID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Download PDF Receipt
```bash
curl -X GET http://localhost:5000/api/receipts/ORDER_UUID/pdf \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  --output receipt.pdf
```

### 8. Admin Testing (requires admin role)

#### Get Admin Statistics
```bash
curl -X GET "http://localhost:5000/api/admin/stats?period=7d" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

#### Get All Orders (Admin)
```bash
curl -X GET "http://localhost:5000/api/admin/orders?status=pending&limit=50" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

#### Update Order Status
```bash
curl -X PATCH http://localhost:5000/api/admin/orders/ORDER_UUID/status \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "confirmed",
    "notes": "Order confirmed by staff"
  }'
```

---

## Frontend Testing

### 1. Setup Frontend Testing Environment

```bash
cd frontend
npm install
npm run dev
```

### 2. Manual Testing Checklist

#### Authentication Flow
- [ ] Register new user account
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (error handling)
- [ ] Access protected routes without authentication
- [ ] Logout functionality
- [ ] Profile update functionality

#### Menu and Cart Flow
- [ ] Browse canteens list
- [ ] View canteen menu with filters
- [ ] Search menu items
- [ ] Add items to cart
- [ ] Update cart item quantities
- [ ] Remove items from cart
- [ ] Clear entire cart
- [ ] View cart summary

#### Order Flow
- [ ] Create order from cart
- [ ] Select pickup time
- [ ] Add special instructions
- [ ] View order history
- [ ] View order details
- [ ] Cancel order (if allowed)

#### Payment Flow
- [ ] Initiate UPI payment
- [ ] Display QR code
- [ ] Copy UPI payment link
- [ ] Verify payment completion
- [ ] Handle payment failure

#### Receipt Generation
- [ ] View receipt in browser (HTML)
- [ ] Download receipt as PDF
- [ ] Verify receipt data accuracy

#### Admin Dashboard (if admin role)
- [ ] View dashboard statistics
- [ ] Manage orders
- [ ] Update order statuses
- [ ] View user management
- [ ] Generate reports

### 3. Frontend Unit Testing

Run frontend unit tests:

```bash
cd frontend
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

---

## Integration Testing

### 1. Full User Journey Testing

#### Complete Order Flow Test
1. Register new user
2. Login
3. Browse canteens
4. Add multiple items to cart
5. Modify cart (update quantities, remove items)
6. Create order
7. Initiate payment
8. Verify payment
9. View order details
10. Download receipt

#### Admin Management Flow Test
1. Login as admin
2. View dashboard statistics
3. Check pending orders
4. Update order status to confirmed
5. Update order status to ready
6. Update order status to completed
7. Generate reports

### 2. Error Handling Testing

#### Authentication Errors
- [ ] Invalid credentials
- [ ] Expired JWT token
- [ ] Missing authorization header
- [ ] Invalid JWT format

#### Validation Errors
- [ ] Missing required fields
- [ ] Invalid email format
- [ ] Invalid phone number
- [ ] Password too short
- [ ] Invalid pickup time

#### Business Logic Errors
- [ ] Adding unavailable items to cart
- [ ] Creating order with empty cart
- [ ] Ordering more items than available
- [ ] Payment verification with incorrect amount
- [ ] Accessing other user's orders

#### System Errors
- [ ] Database connection failure
- [ ] External service unavailability
- [ ] File upload errors
- [ ] PDF generation failures

---

## Performance Testing

### 1. Load Testing

Use tools like Apache Bench (ab) or Artillery for load testing:

#### Test User Registration
```bash
ab -n 100 -c 10 -T application/json -p register.json http://localhost:5000/api/auth/register
```

#### Test Menu Retrieval
```bash
ab -n 1000 -c 50 http://localhost:5000/api/canteens/1/menu
```

### 2. Database Performance Testing

#### Test Query Performance
```sql
-- Test menu query performance
EXPLAIN ANALYZE SELECT * FROM menu_items 
WHERE canteen_id = 1 AND is_available = true 
ORDER BY category, name;

-- Test order query performance  
EXPLAIN ANALYZE SELECT o.*, c.name as canteen_name 
FROM orders o 
JOIN canteens c ON o.canteen_id = c.canteen_id 
WHERE o.user_id = 'user_uuid' 
ORDER BY o.created_at DESC;
```

---

## Automated Testing

### 1. Backend API Tests

Create test files in `backend/tests/`:

```javascript
// backend/tests/auth.test.js
const request = require('supertest');
const app = require('../app');

describe('Authentication Endpoints', () => {
  test('POST /api/auth/register', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        phone: '9876543210'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe('test@example.com');
  });

  test('POST /api/auth/login', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
  });
});
```

Run backend tests:
```bash
cd backend
npm test
```

### 2. Frontend Component Tests

Create test files in `frontend/src/__tests__/`:

```javascript
// frontend/src/__tests__/Login.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import Login from '../components/Login';

test('renders login form', () => {
  render(<Login />);
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
});

test('handles form submission', () => {
  const mockSubmit = jest.fn();
  render(<Login onSubmit={mockSubmit} />);
  
  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: 'test@example.com' }
  });
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: 'password123' }
  });
  fireEvent.click(screen.getByRole('button', { name: /login/i }));
  
  expect(mockSubmit).toHaveBeenCalledWith({
    email: 'test@example.com',
    password: 'password123'
  });
});
```

### 3. End-to-End Testing with Playwright

```javascript
// e2e/tests/order-flow.spec.js
const { test, expect } = require('@playwright/test');

test('complete order flow', async ({ page }) => {
  // Register and login
  await page.goto('http://localhost:3000/register');
  await page.fill('[data-testid="name"]', 'Test User');
  await page.fill('[data-testid="email"]', 'test@example.com');
  await page.fill('[data-testid="password"]', 'password123');
  await page.click('[data-testid="register-btn"]');

  // Navigate to menu
  await page.click('[data-testid="canteen-1"]');
  
  // Add items to cart
  await page.click('[data-testid="add-to-cart-1"]');
  await page.click('[data-testid="add-to-cart-2"]');
  
  // Go to cart
  await page.click('[data-testid="cart-icon"]');
  
  // Create order
  await page.click('[data-testid="checkout-btn"]');
  await page.selectOption('[data-testid="pickup-time"]', '13:00');
  await page.click('[data-testid="place-order-btn"]');
  
  // Verify order created
  await expect(page.locator('[data-testid="order-success"]')).toBeVisible();
});
```

---

## Security Testing

### 1. Authentication Security
- [ ] JWT token validation
- [ ] Password hashing verification
- [ ] Session management
- [ ] CORS configuration
- [ ] Rate limiting functionality

### 2. Authorization Testing
- [ ] Role-based access control
- [ ] User can only access own data
- [ ] Admin-only endpoints protection
- [ ] Cart isolation between users

### 3. Input Validation
- [ ] SQL injection prevention
- [ ] XSS attack prevention
- [ ] File upload security
- [ ] Data sanitization

### 4. API Security
- [ ] HTTPS enforcement (in production)
- [ ] Request size limits
- [ ] Rate limiting
- [ ] API versioning
- [ ] Error message security (no sensitive data leakage)

---

## Database Testing

### 1. Data Integrity Tests
```sql
-- Test foreign key constraints
INSERT INTO cart_items (user_id, item_id, quantity) 
VALUES ('invalid-user-id', 1, 2);
-- Should fail with foreign key constraint error

-- Test data validation
INSERT INTO menu_items (name, price, canteen_id) 
VALUES ('', -10, 1);
-- Should fail with validation errors
```

### 2. Backup and Recovery Testing
```bash
# Create database backup
mysqldump -u root -p canteen_management > backup.sql

# Restore database
mysql -u root -p canteen_management < backup.sql
```

---

## Monitoring and Logging Testing

### 1. Verify Logging
Check that logs are generated for:
- [ ] User authentication attempts
- [ ] Order creation and updates  
- [ ] Payment processing
- [ ] Error conditions
- [ ] System performance metrics

### 2. Health Check Testing
```bash
curl -X GET http://localhost:5000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600,
  "database": "connected"
}
```

---

## Troubleshooting Common Issues

### 1. Database Connection Issues
- Verify MySQL service is running
- Check database credentials in .env file
- Ensure database exists and is accessible

### 2. Authentication Issues
- Verify JWT secret is set in environment
- Check token expiration settings
- Ensure password hashing is working correctly

### 3. File Upload Issues
- Check upload directory permissions
- Verify file size limits
- Test various file formats

### 4. Payment Integration Issues
- Verify UPI configuration
- Test QR code generation
- Check payment verification logic

---

## Test Reports

Generate test reports using:

```bash
# Backend test coverage
cd backend
npm run test:coverage

# Frontend test coverage  
cd frontend
npm run test:coverage

# Generate combined report
npm run test:report
```

---

This testing guide ensures comprehensive coverage of all system components and user workflows. Regular testing following these procedures will help maintain system reliability and user experience quality.