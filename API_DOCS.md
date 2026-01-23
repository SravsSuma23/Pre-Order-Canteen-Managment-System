# API Documentation - Pre-Order Canteen Management System

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Response Format
All API responses follow this format:
```json
{
  "success": true|false,
  "message": "Response message",
  "data": {}, // Response data
  "error": {} // Error details (if any)
}
```

---

## Authentication Endpoints

### Register User
**POST** `/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "password123",
  "upi_id": "john@upi", // optional
  "role": "student" // optional, defaults to "student"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "user_id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "9876543210",
      "role": "student",
      "upi_id": "john@upi"
    },
    "token": "jwt_token",
    "sessionId": "session_uuid"
  }
}
```

### Login User
**POST** `/auth/login`

Authenticate user and get access token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "user_id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "9876543210",
      "role": "student",
      "upi_id": "john@upi"
    },
    "token": "jwt_token",
    "sessionId": "session_uuid"
  }
}
```

### Get Profile
**GET** `/auth/profile`

Get current user's profile information.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "user_id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "9876543210",
      "role": "student",
      "upi_id": "john@upi",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Update Profile
**PUT** `/auth/profile`

Update user profile information.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "John Updated",
  "phone": "9876543211",
  "upi_id": "john_new@upi"
}
```

### Change Password
**PUT** `/auth/password`

Change user password.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "currentPassword": "oldPassword",
  "newPassword": "newPassword123"
}
```

### Logout
**POST** `/auth/logout`

Logout user and invalidate current session.

**Headers:** `Authorization: Bearer <token>`

---

## Canteen Endpoints

### Get All Canteens
**GET** `/canteens`

Get list of all active canteens.

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": {
    "canteens": [
      {
        "canteen_id": 1,
        "name": "Main Cafeteria",
        "location": "Ground Floor, Academic Block A",
        "contact": "080-12345678",
        "description": "Our main cafeteria serving diverse cuisines",
        "opening_hours": {
          "monday": "07:00-22:00",
          "tuesday": "07:00-22:00"
        },
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### Get Single Canteen
**GET** `/canteens/:id`

Get details of a specific canteen.

**Parameters:**
- `id` (number): Canteen ID

**Response:**
```json
{
  "success": true,
  "data": {
    "canteen": {
      "canteen_id": 1,
      "name": "Main Cafeteria",
      "location": "Ground Floor, Academic Block A",
      "contact": "080-12345678",
      "description": "Our main cafeteria serving diverse cuisines",
      "opening_hours": {},
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Get Canteen Menu
**GET** `/canteens/:id/menu`

Get menu items for a specific canteen.

**Parameters:**
- `id` (number): Canteen ID

**Query Parameters:**
- `category` (string): Filter by category
- `is_veg` (boolean): Filter vegetarian items
- `available_only` (boolean): Show only available items

**Response:**
```json
{
  "success": true,
  "count": 30,
  "data": {
    "canteen_id": 1,
    "menu_items": [
      {
        "item_id": 1,
        "name": "Chicken Biryani",
        "description": "Fragrant basmati rice with chicken",
        "price": 100.00,
        "category": "Non-Veg",
        "is_veg": false,
        "vegetarian": false,
        "image_url": "https://example.com/image.jpg",
        "available_quantity": 20,
        "available": 20,
        "is_available": true,
        "rating": 4.6,
        "total_ratings": 156,
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "menu_by_category": {
      "Non-Veg": [/* items */],
      "Veg": [/* items */]
    }
  }
}
```

### Search Menu Items
**GET** `/canteens/search`

Search for menu items across all canteens.

**Query Parameters:**
- `q` (string, required): Search query (min 2 characters)
- `category` (string): Filter by category
- `is_veg` (boolean): Filter vegetarian items
- `min_price` (number): Minimum price filter
- `max_price` (number): Maximum price filter
- `canteen_id` (number): Filter by canteen

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": {
    "search_query": "biryani",
    "menu_items": [
      {
        "item_id": 1,
        "name": "Chicken Biryani",
        "description": "Fragrant basmati rice with chicken",
        "price": 100.00,
        "category": "Non-Veg",
        "is_veg": false,
        "vegetarian": false,
        "canteen_id": 1,
        "canteen_name": "Main Cafeteria",
        "canteen_location": "Ground Floor, Academic Block A"
      }
    ]
  }
}
```

---

## Cart Management

### Get Cart
**GET** `/cart`

Get current user's cart items.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "cart_items": [
      {
        "cart_id": 1,
        "quantity": 2,
        "item_id": 1,
        "name": "Chicken Biryani",
        "description": "Fragrant basmati rice with chicken",
        "price": 100.00,
        "image_url": "https://example.com/image.jpg",
        "vegetarian": false,
        "available_quantity": 20,
        "canteen_id": 1,
        "canteen_name": "Main Cafeteria",
        "item_total": 200.00,
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "summary": {
      "total_items": 2,
      "subtotal": 200.00,
      "tax_rate": 0.05,
      "tax_amount": 10.00,
      "total": 210.00
    }
  }
}
```

### Add to Cart
**POST** `/cart`

Add item to cart or update quantity if item exists.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "item_id": 1,
  "quantity": 2
}
```

**Response:**
```json
{
  "success": true,
  "message": "Item added to cart successfully",
  "data": {
    "item": {
      "item_id": 1,
      "name": "Chicken Biryani",
      "price": 100.00,
      "canteen_name": "Main Cafeteria"
    },
    "quantity": 2
  }
}
```

### Update Cart Item
**PUT** `/cart/:cartId`

Update quantity of specific cart item.

**Headers:** `Authorization: Bearer <token>`

**Parameters:**
- `cartId` (number): Cart item ID

**Request Body:**
```json
{
  "quantity": 3
}
```

### Remove from Cart
**DELETE** `/cart/:cartId`

Remove specific item from cart.

**Headers:** `Authorization: Bearer <token>`

**Parameters:**
- `cartId` (number): Cart item ID

### Clear Cart
**DELETE** `/cart`

Remove all items from cart.

**Headers:** `Authorization: Bearer <token>`

### Get Cart Summary
**GET** `/cart/summary`

Get cart summary for checkout.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "canteen": {
      "canteen_id": 1,
      "name": "Main Cafeteria"
    },
    "items": [
      {
        "item_id": 1,
        "name": "Chicken Biryani",
        "price": 100.00,
        "quantity": 2,
        "item_total": 200.00
      }
    ],
    "summary": {
      "subtotal": 200.00,
      "tax_rate": 0.05,
      "tax_amount": 10.00,
      "total": 210.00,
      "total_items": 1
    }
  }
}
```

---

## Order Management

### Get User Orders
**GET** `/orders`

Get current user's order history.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status` (string): Filter by order status
- `limit` (number): Number of orders to return (default: 20)
- `offset` (number): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": {
    "orders": [
      {
        "order_id": "uuid",
        "pickup_time": "2024-01-01T13:00:00.000Z",
        "total_amount": 210.00,
        "payment_status": "paid",
        "order_status": "completed",
        "created_at": "2024-01-01T12:00:00.000Z",
        "canteen_name": "Main Cafeteria",
        "canteen_location": "Ground Floor, Academic Block A",
        "total_items": 2
      }
    ]
  }
}
```

### Create Order
**POST** `/orders`

Create a new order from cart items.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "pickup_time": "2024-01-01T13:00:00.000Z",
  "special_instructions": "Extra spicy",
  "payment_method": "upi"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "order_id": "uuid",
    "canteen": {
      "canteen_id": 1,
      "name": "Main Cafeteria"
    },
    "pickup_time": "2024-01-01T13:00:00.000Z",
    "total_amount": 210.00,
    "payment_method": "upi",
    "payment_status": "pending"
  }
}
```

### Get Order Details
**GET** `/orders/:orderId`

Get detailed information about a specific order.

**Headers:** `Authorization: Bearer <token>`

**Parameters:**
- `orderId` (string): Order UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "order_id": "uuid",
      "user_id": "user_uuid",
      "canteen_id": 1,
      "pickup_time": "2024-01-01T13:00:00.000Z",
      "subtotal_amount": 200.00,
      "tax_amount": 10.00,
      "total_amount": 210.00,
      "payment_status": "paid",
      "order_status": "completed",
      "transaction_id": "TXN123456",
      "payment_method": "upi",
      "special_instructions": "Extra spicy",
      "created_at": "2024-01-01T12:00:00.000Z",
      "canteen_name": "Main Cafeteria",
      "canteen_location": "Ground Floor",
      "user_name": "John Doe",
      "user_phone": "9876543210",
      "user_email": "john@example.com",
      "items": [
        {
          "id": 1,
          "order_id": "uuid",
          "item_id": 1,
          "quantity": 2,
          "unit_price": 100.00,
          "total_price": 200.00,
          "item_name": "Chicken Biryani",
          "item_description": "Fragrant basmati rice",
          "vegetarian": false,
          "created_at": "2024-01-01T12:00:00.000Z"
        }
      ],
      "payment": {
        "payment_id": "payment_uuid",
        "amount": 210.00,
        "payment_mode": "upi",
        "transaction_ref": "TXN123456",
        "payment_status": "success"
      }
    }
  }
}
```

### Cancel Order
**PATCH** `/orders/:orderId/cancel`

Cancel an existing order.

**Headers:** `Authorization: Bearer <token>`

**Parameters:**
- `orderId` (string): Order UUID

### Get Order Statistics
**GET** `/orders/stats`

Get order statistics for current user.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "statistics": {
      "total_orders": 10,
      "completed_orders": 8,
      "cancelled_orders": 1,
      "paid_orders": 9,
      "total_spent": 2100.00,
      "average_order_value": 233.33
    }
  }
}
```

---

## Payment Processing

### Initiate Payment
**POST** `/payments/initiate`

Initiate UPI payment for an order.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "order_id": "order_uuid",
  "amount": 210.00,
  "upi_id": "user@upi"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment initiated successfully",
  "data": {
    "payment_id": "payment_uuid",
    "order_id": "order_uuid",
    "amount": 210.00,
    "upi_link": "upi://pay?pa=merchant@upi&pn=Canteen&am=210.00&tn=Order123",
    "qr_code_url": "/uploads/qr-codes/payment-uuid.png",
    "merchant_upi": "merchant@upi",
    "merchant_name": "Canteen Management System",
    "transaction_note": "Order 12345 - Main Cafeteria",
    "expires_at": "2024-01-01T12:15:00.000Z",
    "instructions": {
      "scan_qr": "Scan the QR code with any UPI app",
      "manual_payment": "Send ₹210.00 to UPI ID: merchant@upi",
      "reference": "Use reference: Order 12345 - Main Cafeteria"
    }
  }
}
```

### Verify Payment
**POST** `/payments/verify`

Verify UPI payment completion.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "order_id": "order_uuid",
  "transaction_ref": "TXN123456789",
  "upi_ref_id": "UPI123456789",
  "amount": 210.00
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "payment_id": "payment_uuid",
    "order_id": "order_uuid",
    "transaction_ref": "TXN123456789",
    "amount": 210.00,
    "status": "success",
    "verified_at": "2024-01-01T12:05:00.000Z"
  }
}
```

### Get Payment Status
**GET** `/payments/:paymentId/status`

Get payment status and details.

**Headers:** `Authorization: Bearer <token>`

**Parameters:**
- `paymentId` (string): Payment UUID

### Get Payment History
**GET** `/payments`

Get payment history for current user.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `limit` (number): Number of payments to return (default: 20)
- `offset` (number): Pagination offset (default: 0)
- `status` (string): Filter by payment status

---

## Receipt Generation

### Get Receipt Data
**GET** `/receipts/:orderId`

Get receipt data in JSON format.

**Headers:** `Authorization: Bearer <token>`

**Parameters:**
- `orderId` (string): Order UUID

### Get HTML Receipt
**GET** `/receipts/:orderId/html`

Get receipt as HTML page.

**Headers:** `Authorization: Bearer <token>`

**Parameters:**
- `orderId` (string): Order UUID

### Download PDF Receipt
**GET** `/receipts/:orderId/pdf`

Download receipt as PDF file.

**Headers:** `Authorization: Bearer <token>`

**Parameters:**
- `orderId` (string): Order UUID

---

## Admin Dashboard

### Get Dashboard Statistics
**GET** `/admin/stats`

Get admin dashboard statistics.

**Headers:** `Authorization: Bearer <token>` (Admin/Staff only)

**Query Parameters:**
- `period` (string): Time period (1d, 7d, 30d)

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "7d",
    "overview": {
      "total_orders": 150,
      "paid_orders": 140,
      "completed_orders": 135,
      "cancelled_orders": 5,
      "total_revenue": 15750.00,
      "avg_order_value": 112.50,
      "unique_customers": 85
    },
    "orders_by_status": [
      {
        "order_status": "completed",
        "count": 135
      }
    ],
    "top_menu_items": [
      {
        "item_name": "Chicken Biryani",
        "total_ordered": 45,
        "order_count": 30,
        "avg_price": 100.00
      }
    ],
    "canteen_performance": [
      {
        "canteen_name": "Main Cafeteria",
        "total_orders": 80,
        "revenue": 8500.00
      }
    ],
    "recent_orders": [/* recent order list */]
  }
}
```

### Get All Orders
**GET** `/admin/orders`

Get all orders (admin view).

**Headers:** `Authorization: Bearer <token>` (Admin/Staff only)

**Query Parameters:**
- `status` (string): Filter by order status
- `payment_status` (string): Filter by payment status
- `canteen_id` (number): Filter by canteen
- `limit` (number): Results limit (default: 50)
- `offset` (number): Pagination offset
- `date_from` (string): Start date filter (YYYY-MM-DD)
- `date_to` (string): End date filter (YYYY-MM-DD)
- `search` (string): Search orders by ID, customer name, phone, email

### Get Pending Orders
**GET** `/admin/orders/pending`

Get orders that need attention (paid but not completed).

**Headers:** `Authorization: Bearer <token>` (Admin/Staff only)

### Update Order Status
**PATCH** `/admin/orders/:orderId/status`

Update order status.

**Headers:** `Authorization: Bearer <token>` (Admin/Staff only)

**Parameters:**
- `orderId` (string): Order UUID

**Request Body:**
```json
{
  "status": "confirmed",
  "notes": "Order confirmed by staff"
}
```

### Get Users
**GET** `/admin/users`

Get user management data.

**Headers:** `Authorization: Bearer <token>` (Admin only)

### Toggle User Status
**PATCH** `/admin/users/:userId/toggle-status`

Activate/deactivate a user.

**Headers:** `Authorization: Bearer <token>` (Admin only)

### Get Menu Performance
**GET** `/admin/menu/performance`

Get menu item performance analytics.

**Headers:** `Authorization: Bearer <token>` (Admin/Staff only)

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 429 | Too Many Requests |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

## Rate Limits

- Authentication endpoints: 5 requests per 15 minutes
- Payment endpoints: 10 requests per 5 minutes
- General endpoints: 100 requests per 15 minutes (development), 100 requests per 15 minutes (production)

## Common Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "statusCode": 400,
    "stack": "Error stack trace (development only)"
  },
  "timestamp": "2024-01-01T12:00:00.000Z",
  "path": "/api/endpoint",
  "method": "POST"
}
```