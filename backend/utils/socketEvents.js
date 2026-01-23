/**
 * Socket.IO Event Utilities for Real-time Menu Updates
 * Handles broadcasting of menu changes to connected clients
 */

/**
 * Emit menu item quantity update to all clients in a canteen room
 * @param {Object} io - Socket.IO server instance
 * @param {number} canteenId - The canteen ID
 * @param {Object} menuItem - Updated menu item data
 */
const emitMenuItemUpdate = (io, canteenId, menuItem) => {
  const eventData = {
    canteenId,
    itemId: menuItem.item_id,
    name: menuItem.name,
    availableQuantity: menuItem.available_quantity,
    isAvailable: menuItem.is_available,
    updatedAt: new Date().toISOString(),
    category: menuItem.category,
    isVeg: menuItem.is_veg
  };

  // Broadcast to all clients in the canteen room
  io.to(`canteen-${canteenId}`).emit('menu-item-updated', eventData);
  
  // Also broadcast to general menu room for dashboard updates
  io.emit('menu-update', eventData);
  
  console.log(`🔄 Menu update broadcast for canteen ${canteenId}:`, {
    item: menuItem.name,
    quantity: menuItem.available_quantity,
    available: menuItem.is_available
  });
};

/**
 * Emit menu item availability status change
 * @param {Object} io - Socket.IO server instance
 * @param {number} canteenId - The canteen ID
 * @param {number} itemId - Menu item ID
 * @param {string} itemName - Menu item name
 * @param {boolean} isAvailable - New availability status
 */
const emitMenuItemAvailability = (io, canteenId, itemId, itemName, isAvailable) => {
  const eventData = {
    canteenId,
    itemId,
    itemName,
    isAvailable,
    updatedAt: new Date().toISOString(),
    type: 'availability'
  };

  io.to(`canteen-${canteenId}`).emit('menu-availability-changed', eventData);
  io.emit('availability-update', eventData);
  
  console.log(`${isAvailable ? '🟢' : '🔴'} Availability update for ${itemName}: ${isAvailable ? 'Available' : 'Not Available'}`);
};

/**
 * Emit low stock warning
 * @param {Object} io - Socket.IO server instance
 * @param {number} canteenId - The canteen ID
 * @param {Object} menuItem - Menu item with low stock
 */
const emitLowStockAlert = (io, canteenId, menuItem) => {
  const eventData = {
    canteenId,
    itemId: menuItem.item_id,
    itemName: menuItem.name,
    availableQuantity: menuItem.available_quantity,
    threshold: 5, // You can make this configurable
    alertType: 'low-stock',
    updatedAt: new Date().toISOString()
  };

  // Send to admin dashboard
  io.to(`canteen-${canteenId}`).emit('low-stock-alert', eventData);
  
  console.log(`⚠️ Low stock alert for ${menuItem.name}: ${menuItem.available_quantity} left`);
};

/**
 * Emit new menu item added
 * @param {Object} io - Socket.IO server instance
 * @param {number} canteenId - The canteen ID
 * @param {Object} menuItem - New menu item data
 */
const emitMenuItemAdded = (io, canteenId, menuItem) => {
  const eventData = {
    canteenId,
    menuItem: {
      item_id: menuItem.item_id,
      name: menuItem.name,
      description: menuItem.description,
      price: menuItem.price,
      category: menuItem.category,
      is_veg: menuItem.is_veg,
      available_quantity: menuItem.available_quantity,
      is_available: menuItem.is_available,
      created_at: menuItem.created_at
    },
    action: 'added',
    updatedAt: new Date().toISOString()
  };

  io.to(`canteen-${canteenId}`).emit('menu-item-added', eventData);
  io.emit('menu-change', eventData);
  
  console.log(`✅ New menu item added in canteen ${canteenId}: ${menuItem.name}`);
};

/**
 * Emit menu item removed/deleted
 * @param {Object} io - Socket.IO server instance
 * @param {number} canteenId - The canteen ID
 * @param {number} itemId - Removed menu item ID
 * @param {string} itemName - Removed menu item name
 */
const emitMenuItemRemoved = (io, canteenId, itemId, itemName) => {
  const eventData = {
    canteenId,
    itemId,
    itemName,
    action: 'removed',
    updatedAt: new Date().toISOString()
  };

  io.to(`canteen-${canteenId}`).emit('menu-item-removed', eventData);
  io.emit('menu-change', eventData);
  
  console.log(`❌ Menu item removed from canteen ${canteenId}: ${itemName}`);
};

/**
 * Emit bulk menu updates (useful for batch operations)
 * @param {Object} io - Socket.IO server instance
 * @param {number} canteenId - The canteen ID
 * @param {Array} menuItems - Array of updated menu items
 */
const emitBulkMenuUpdate = (io, canteenId, menuItems) => {
  const eventData = {
    canteenId,
    items: menuItems.map(item => ({
      item_id: item.item_id,
      name: item.name,
      available_quantity: item.available_quantity,
      is_available: item.is_available
    })),
    updatedAt: new Date().toISOString(),
    type: 'bulk-update'
  };

  io.to(`canteen-${canteenId}`).emit('bulk-menu-update', eventData);
  io.emit('menu-bulk-change', eventData);
  
  console.log(`🔄 Bulk menu update for canteen ${canteenId}: ${menuItems.length} items updated`);
};

/**
 * Emit canteen status update (open/closed)
 * @param {Object} io - Socket.IO server instance
 * @param {number} canteenId - The canteen ID
 * @param {string} canteenName - The canteen name
 * @param {boolean} isOpen - Canteen operational status
 */
const emitCanteenStatus = (io, canteenId, canteenName, isOpen) => {
  const eventData = {
    canteenId,
    canteenName,
    isOpen,
    updatedAt: new Date().toISOString()
  };

  io.to(`canteen-${canteenId}`).emit('canteen-status-changed', eventData);
  io.emit('canteen-status-update', eventData);
  
  console.log(`${isOpen ? '🟢' : '🔴'} Canteen ${canteenName} is now ${isOpen ? 'open' : 'closed'}`);
};

module.exports = {
  emitMenuItemUpdate,
  emitMenuItemAvailability,
  emitLowStockAlert,
  emitMenuItemAdded,
  emitMenuItemRemoved,
  emitBulkMenuUpdate,
  emitCanteenStatus
};