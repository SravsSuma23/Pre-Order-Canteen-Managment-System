import { initializeCanteenData } from '@/data/menuData';

export const resetAllMenuData = () => {
  // Clear all existing menu data
  const keysToRemove = [
    'mockMenuItems',
    'canteen_1_menu', 'canteen_2_menu', 'canteen_3_menu',
    'canteen_1_admin_menu', 'canteen_2_admin_menu', 'canteen_3_admin_menu',
    'canteen_general_admin_menu'
  ];
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });
  
  console.log('🧹 Cleared all existing menu data');
};

export const initializeAllCanteenData = () => {
  // Initialize data for all three canteens
  const canteens = [1, 2, 3];
  const results = [];
  
  for (const canteenId of canteens) {
    const menuItems = initializeCanteenData(canteenId);
    results.push({
      canteenId,
      itemCount: menuItems.length,
      items: menuItems
    });
    
    console.log(`📋 Initialized ${menuItems.length} items for Canteen ${canteenId}`);
  }
  
  return results;
};

export const syncMenuData = () => {
  console.log('🔄 Syncing menu data...');
  
  // Reset everything first
  resetAllMenuData();
  
  // Initialize fresh data
  const results = initializeAllCanteenData();
  
  console.log('✅ Menu data synchronized successfully!');
  
  // Dispatch storage events to notify all open tabs
  results.forEach(({ canteenId, items }) => {
    const storageKey = `canteen_${canteenId}_menu`;
    window.dispatchEvent(new StorageEvent('storage', {
      key: storageKey,
      newValue: JSON.stringify(items),
      storageArea: localStorage
    }));
  });
  
  return results;
};

// Debug function to check current data
export const debugMenuData = () => {
  console.log('🔍 Current localStorage menu data:');
  
  [1, 2, 3].forEach(canteenId => {
    const adminData = localStorage.getItem(`canteen_${canteenId}_admin_menu`);
    const studentData = localStorage.getItem(`canteen_${canteenId}_menu`);
    
    console.log(`Canteen ${canteenId}:`);
    console.log('  Admin data:', adminData ? JSON.parse(adminData).length + ' items' : 'None');
    console.log('  Student data:', studentData ? JSON.parse(studentData).length + ' items' : 'None');
  });
};