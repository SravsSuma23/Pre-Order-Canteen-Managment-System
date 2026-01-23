# Pre-Order Canteen Management System

A comprehensive web application for managing canteen operations with pre-ordering, UPI payments, and real-time order management.

## 🎯 Features

### Core Functionality
- **Multi-Canteen Support**: Manage multiple canteens from a single system
- **Pre-Order System**: Users can place orders with scheduled pickup times
- **UPI Payment Integration**: Secure UPI payments with QR codes and deep links
- **Real-time Order Tracking**: Track orders from placement to completion
- **Digital Receipts**: PDF and HTML receipt generation
- **Role-based Access**: Different access levels for students, faculty, admin, and canteen staff

### Key Features Implemented
- ✅ **Authentication & Authorization**: JWT-based secure authentication
- ✅ **Cart Management**: Add, update, remove items with real-time totals
- ✅ **Order Management**: Create orders with pickup scheduling
- ✅ **UPI Payments**: Generate UPI links and QR codes for payments
- ✅ **Receipt Generation**: Automated PDF/HTML receipt creation
- ✅ **Admin Dashboard**: Comprehensive management interface
- ✅ **Real-time Analytics**: Order statistics and performance metrics
- ✅ **Mobile Responsive**: Works perfectly on mobile devices

## 🏗️ Architecture

### Backend (Node.js + Express + MySQL)
- **RESTful API** with comprehensive endpoints
- **MySQL Database** with properly normalized schema
- **JWT Authentication** with session management
- **Role-based Authorization** (student, faculty, admin, canteen_staff)
- **Comprehensive Logging** with Winston
- **Error Handling** with detailed error responses
- **Input Validation** using Joi schemas
- **Rate Limiting** for security

### Frontend (React + TypeScript + Vite)
- **Modern React** with TypeScript and Vite
- **Responsive Design** using Tailwind CSS
- **Component Library** with shadcn/ui
- **State Management** with React Query
- **Routing** with React Router
- **Form Handling** with React Hook Form

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **MySQL** (v8.0 or higher)
- **Docker & Docker Compose** (recommended)

### Option 1: Docker Setup (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd canteen-craft-pro-main
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start with Docker Compose**
   ```bash
   # Development with phpMyAdmin
   docker-compose --profile development up -d

   # Production
   docker-compose --profile production up -d

   # Basic setup (just app + database)
   docker-compose up -d
   ```

4. **Access the application**
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:5000
   - **phpMyAdmin**: http://localhost:8080 (development profile)

### Option 2: Manual Setup

1. **Database Setup**
   ```bash
   # Create MySQL database
   mysql -u root -p
   CREATE DATABASE canteen_management;
   
   # Run schema and seed files
   mysql -u root -p canteen_management < database/schema.sql
   mysql -u root -p canteen_management < database/seed.sql
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your database credentials
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd ..  # Back to root directory
   npm install
   npm run dev
   ```

## 📖 API Documentation

### Authentication Endpoints
```
POST   /api/auth/register     - User registration
POST   /api/auth/login        - User login
GET    /api/auth/profile      - Get user profile
PUT    /api/auth/profile      - Update user profile
PUT    /api/auth/password     - Change password
POST   /api/auth/logout       - Logout user
```

### Canteen & Menu Endpoints
```
GET    /api/canteens          - List all canteens
GET    /api/canteens/:id      - Get canteen details
GET    /api/canteens/:id/menu - Get canteen menu
GET    /api/canteens/search   - Search menu items
GET    /api/menu/:itemId      - Get menu item details
GET    /api/menu/categories   - Get menu categories
```

### Cart Management
```
GET    /api/cart              - Get user's cart
POST   /api/cart              - Add item to cart
PUT    /api/cart/:cartId      - Update cart item
DELETE /api/cart/:cartId      - Remove cart item
DELETE /api/cart              - Clear entire cart
GET    /api/cart/summary      - Get checkout summary
```

### Order Management
```
GET    /api/orders            - Get user's orders
POST   /api/orders            - Create new order
GET    /api/orders/:orderId   - Get order details
PATCH  /api/orders/:orderId/cancel - Cancel order
GET    /api/orders/stats      - Get order statistics
```

### Payment Processing
```
POST   /api/payments/initiate - Initiate UPI payment
POST   /api/payments/verify   - Verify payment
GET    /api/payments          - Get payment history
GET    /api/payments/:id/status - Get payment status
```

### Receipt Generation
```
GET    /api/receipts/:orderId     - Get receipt data (JSON)
GET    /api/receipts/:orderId/html - Get HTML receipt
GET    /api/receipts/:orderId/pdf  - Download PDF receipt
```

### Admin Dashboard
```
GET    /api/admin/stats           - Dashboard statistics
GET    /api/admin/orders          - All orders management
GET    /api/admin/orders/pending  - Pending orders
PATCH  /api/admin/orders/:id/status - Update order status
GET    /api/admin/users           - User management
GET    /api/admin/menu/performance - Menu analytics
```

## 💳 UPI Payment Integration

### Features
- **UPI Deep Links**: Direct integration with UPI apps
- **QR Code Generation**: Scannable QR codes for payments
- **Multiple UPI Apps**: Supports GPay, PhonePe, Paytm, etc.
- **Payment Verification**: Manual and automated verification
- **Transaction Tracking**: Complete payment audit trail

### UPI Flow
1. User selects items and proceeds to checkout
2. System generates UPI payment link and QR code
3. User pays via any UPI app
4. Payment verification (manual/automated)
5. Order confirmed and receipt generated

## 📱 Demo Credentials

### Test Users (Password: password123)
- **Student**: raj.kumar@example.com
- **Faculty**: anjali.singh@example.com (Dr. Anjali Singh)
- **Admin**: admin@example.com
- **Canteen Staff**: canteen@example.com

### Sample Data
- **3 Canteens**: Main Cafeteria, IT Canteen, MBA Canteen
- **70+ Menu Items**: Variety of Indian cuisine
- **Sample Orders**: Pre-loaded order history

## 🔒 Security Features

- **JWT Authentication** with secure token storage
- **Password Hashing** using bcryptjs
- **Rate Limiting** on sensitive endpoints
- **Input Validation** and sanitization
- **SQL Injection Protection** using parameterized queries
- **XSS Prevention** with proper input handling
- **CORS Configuration** for cross-origin requests
- **Helmet.js** for security headers

## 🛠️ Technologies Used

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- shadcn/ui component library
- React Router for navigation
- React Query for state management
- React Hook Form for forms

### Backend
- Node.js with Express.js
- MySQL 8.0 database
- JWT for authentication
- Joi for validation
- Winston for logging
- Puppeteer for PDF generation
- QRCode for QR generation
- bcryptjs for password hashing

### DevOps
- Docker & Docker Compose
- Nginx for reverse proxy
- phpMyAdmin for database management

## 🚀 Deployment

### Docker Deployment (Recommended)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Manual Deployment
1. Set up MySQL database
2. Configure environment variables
3. Build frontend: `npm run build`
4. Start backend: `npm start`
5. Set up reverse proxy

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   docker-compose logs mysql
   mysql -h localhost -u canteen_user -p
   ```

2. **Port Already in Use**
   ```bash
   # Check what's using the port
   netstat -tulpn | grep :3000
   # Kill the process
   sudo kill -9 <PID>
   ```

3. **Permission Issues**
   ```bash
   sudo chown -R $USER:$USER .
   chmod +x backend/scripts/*
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support and questions:
- 📧 Email: contact@yourinstitution.edu
- 📞 Phone: +91-80-12345678
- 💬 Create an issue in this repository

## 📄 License

This project is licensed under the MIT License.

---

**Built with ❤️ for better canteen management**
