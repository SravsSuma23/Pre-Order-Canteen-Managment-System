# Stock/Menu Management System - Deployment & Testing Guide

## 🎯 Overview

This guide provides complete setup and testing instructions for the enhanced Stock/Menu Management System with three separate canteen admin portals and real-time synchronization.

## 🏗️ System Architecture

### Components Implemented:
1. **Backend API**: Enhanced with dedicated stock management endpoints
2. **Three Admin Portals**: Separate login and management interfaces for each canteen
3. **Student Frontend**: Real-time menu display with stock indicators
4. **Socket.IO Integration**: Live synchronization between admin and student views

### Key Features:
- ✅ **Real-time Stock Updates**: Instant updates when admins change quantities
- ✅ **Availability Management**: Toggle items on/off instantly
- ✅ **Canteen-specific Admin Portals**: Isolated management for each canteen
- ✅ **Smart Stock Indicators**: Color-coded stock levels for students
- ✅ **Bulk Update Capabilities**: Update multiple items at once
- ✅ **Live Connection Status**: Real-time connection indicators

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- MySQL (v8.0+)
- Git

### 1. Setup Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your database credentials

# Start the server
npm run dev
```

The backend will start on `http://localhost:5000` with Socket.IO enabled.

### 2. Setup Frontend

```bash
# Navigate to root directory (from backend)
cd ..

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will start on `http://localhost:5173` (or next available port).

## 📋 Testing Instructions

### Phase 1: Admin Portal Access

#### Test 1.1: Canteen Portal Selector
1. Navigate to: `http://localhost:5173/admin/portals`
2. **Expected**: See three canteen cards with statistics
3. **Verify**: Each canteen shows different information (Main, IT, MBA)

#### Test 1.2: Canteen-specific Admin Login
1. Click "Access Admin Portal" for **Main Canteen**
2. **Expected**: Redirected to `/admin/canteen/1/login`
3. **Verify**: Header shows "Main Canteen Admin"
4. Use credentials: `admin_main` / `admin123`

#### Test 1.3: Admin Dashboard Access
1. After successful login
2. **Expected**: Redirected to `/admin/canteen/1/dashboard`
3. **Verify**: 
   - Dashboard shows canteen-specific data
   - "Stock" tab is available
   - Header shows correct canteen name

### Phase 2: Stock Management Testing

#### Test 2.1: Quick Stock Updates
1. Go to the **Stock** tab in admin dashboard
2. **Expected**: See list of menu items with current quantities
3. **Actions to test**:
   - Use +/- buttons to change quantities
   - Type directly in quantity input
   - Toggle availability switch
   - **Verify**: Changes are applied immediately

#### Test 2.2: Stock Status Indicators
1. Test different stock levels:
   - Set quantity to 0: Should show "Not Available" (red)
   - Set quantity to 3: Should show "Low Stock" (yellow)
   - Set quantity to 8: Should show "X left" (blue)
   - Set quantity to 20: Should show "X available" (green)

#### Test 2.3: Bulk Updates
1. Switch to **Bulk Update** tab
2. **Actions**:
   - Modify quantities for multiple items
   - Change availability for several items
   - Click "Apply Updates"
3. **Verify**: All changes are applied at once

### Phase 3: Student Frontend Testing

#### Test 3.1: Student Menu View
1. Open new browser window/tab
2. Navigate to: `http://localhost:5173/menu/1` (Main Canteen)
3. **Verify**:
   - Menu items display with stock badges
   - Real-time connection indicator shows "🟢 Live Updates"
   - Stock badges match admin settings

#### Test 3.2: Real-time Synchronization
1. **Setup**: Keep both admin and student pages open side by side
2. **Test Admin → Student Updates**:
   - In admin: Change quantity of "Chicken Biryani" to 5
   - **Expected**: Student view updates immediately
   - **Verify**: Stock badge changes color and shows "Low Stock (5)"

3. **Test Availability Toggle**:
   - In admin: Toggle "Veg Thali" to unavailable
   - **Expected**: Student view shows "Not Available" badge
   - **Expected**: "Add to Cart" button becomes disabled

#### Test 3.3: Cross-tab Synchronization
1. Open multiple student menu tabs
2. Make changes in admin
3. **Verify**: All student tabs update simultaneously

### Phase 4: Multi-Canteen Testing

#### Test 4.1: Isolated Canteen Management
1. **Test Setup**: Login to different canteen admins:
   - Tab 1: Main Canteen admin (`/admin/canteen/1/dashboard`)
   - Tab 2: IT Canteen admin (`/admin/canteen/2/dashboard`)
   - Tab 3: MBA Canteen admin (`/admin/canteen/3/dashboard`)

2. **Test Isolation**:
   - Make stock changes in Main Canteen admin
   - **Verify**: IT and MBA admin dashboards are unaffected
   - **Verify**: Student menus for different canteens show different data

#### Test 4.2: Canteen-specific Student Views
1. Test student menus for each canteen:
   - `/menu/1` (Main Canteen)
   - `/menu/2` (IT Canteen) 
   - `/menu/3` (MBA Canteen)
2. **Verify**: Each shows different menu items and stock levels

### Phase 5: Error Handling & Edge Cases

#### Test 5.1: Network Disconnection
1. Open browser dev tools → Network tab
2. Switch to offline mode
3. **Verify**:
   - Connection indicator shows "⚫ Offline"
   - Admin changes are stored locally
   - Student view shows cached data

#### Test 5.2: Invalid Quantity Inputs
1. In admin stock management:
   - Try negative quantities: Should default to 0
   - Try non-numeric values: Should handle gracefully
   - Try extremely large numbers: Should be accepted

#### Test 5.3: Concurrent Admin Updates
1. **Setup**: Multiple admin sessions for same canteen
2. **Test**: Make simultaneous changes
3. **Verify**: Last update wins, no data corruption

## 🔧 Configuration Options

### Environment Variables

#### Backend (.env)
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=canteen_user
DB_PASSWORD=your_password
DB_NAME=canteen_management

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Socket.IO Configuration (optional)
SOCKET_CORS_ORIGIN=http://localhost:5173
```

#### Frontend (.env.local - optional)
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:5000/api
```

### Stock Management Settings

#### Customizable Thresholds
You can modify stock alert levels in `src/components/admin/StockManager.tsx`:

```typescript
// Current thresholds
item.available_quantity <= 5    // Low Stock (Yellow)
item.available_quantity <= 10   // Medium Stock (Blue)
item.available_quantity > 10    // Good Stock (Green)
```

#### Auto-availability Rules
Items automatically become unavailable when quantity = 0, and available when quantity > 0.

## 🐛 Troubleshooting

### Common Issues

#### 1. Socket Connection Failed
**Symptoms**: Connection indicator shows offline
**Solutions**:
- Verify backend is running on port 5000
- Check firewall settings
- Ensure CORS is configured correctly

#### 2. Stock Updates Not Syncing
**Symptoms**: Admin changes don't appear in student view
**Solutions**:
- Check browser console for Socket.IO errors
- Verify both pages are connected to the same canteen
- Clear localStorage and refresh

#### 3. Admin Login Issues
**Symptoms**: Cannot login to canteen-specific admin
**Solutions**:
- Use correct credentials for each canteen:
  - Main: `admin_main` / `admin123`
  - IT: `admin_it` / `admin123`
  - MBA: `admin_mba` / `admin123`
- Check backend logs for authentication errors

#### 4. Menu Items Not Loading
**Symptoms**: Empty menu in student view
**Solutions**:
- Check localStorage for stored menu data
- Verify canteen ID is valid (1, 2, or 3)
- Check backend API endpoints are responding

### Debug Commands

#### Check Socket Connection
```javascript
// In browser console on student menu page
console.log('Socket connected:', window.socket?.connected);
```

#### View Stored Menu Data
```javascript
// Check what's stored locally
console.log(JSON.parse(localStorage.getItem('canteen_1_menu') || '[]'));
```

#### Clear All Local Data
```javascript
// Reset all localStorage data
['canteen_1_menu', 'canteen_2_menu', 'canteen_3_menu', 
 'canteen_1_admin_menu', 'canteen_2_admin_menu', 'canteen_3_admin_menu']
.forEach(key => localStorage.removeItem(key));
```

## 📊 Performance Considerations

### Optimization Tips

1. **Socket.IO Room Management**: Each canteen uses separate rooms for targeted updates
2. **Local Storage Caching**: Reduces API calls and improves offline functionality
3. **Bulk Updates**: Process multiple changes efficiently
4. **Debounced Updates**: Prevents excessive real-time updates

### Scaling Recommendations

For production deployment:

1. **Database Optimization**:
   - Index frequently queried columns (canteen_id, item_id)
   - Use database triggers for stock alerts

2. **Caching Strategy**:
   - Implement Redis for session management
   - Cache menu data at API level

3. **Load Balancing**:
   - Use sticky sessions for Socket.IO
   - Consider Redis adapter for multi-server Socket.IO

## 🔒 Security Notes

### Authentication
- JWT tokens for admin sessions
- Canteen-specific access control
- Session timeout and refresh

### Data Validation
- Input sanitization on all endpoints
- Quantity bounds checking
- SQL injection prevention

### Rate Limiting
- API endpoints are rate-limited
- Socket connection limits per IP

## 📱 Mobile Testing

### Responsive Design
Test on various screen sizes:
- Admin panels work on tablets (768px+)
- Student menu fully responsive
- Touch-friendly controls

### Mobile-specific Features
- Swipe gestures for navigation
- Touch-optimized quantity controls
- Mobile-friendly stock indicators

## 🎯 Success Criteria

Your implementation is successful if:

✅ **Admin Functionality**:
- [ ] Can login to each canteen admin portal separately
- [ ] Stock quantities update in real-time
- [ ] Availability toggles work instantly
- [ ] Bulk updates process correctly

✅ **Student Experience**:
- [ ] Menu displays current stock levels
- [ ] Real-time updates appear without refresh
- [ ] Stock indicators are color-coded correctly
- [ ] Connection status is visible

✅ **System Integration**:
- [ ] Socket.IO connects successfully
- [ ] Cross-tab synchronization works
- [ ] Data persists between sessions
- [ ] No errors in browser console

✅ **Business Logic**:
- [ ] Stock goes to 0 → item becomes unavailable
- [ ] Low stock triggers yellow warning
- [ ] Changes are isolated per canteen
- [ ] Concurrent updates handled gracefully

## 📞 Support

For issues or questions:
1. Check browser console for error messages
2. Verify all services are running
3. Test with provided sample data
4. Review this guide for troubleshooting steps

---

**Built with ❤️ for efficient canteen stock management**

*Last updated: October 2024*