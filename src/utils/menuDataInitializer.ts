import { getCanteenMenuItems, initializeCanteenData } from '@/data/menuData';

// Version flag to force data refresh when menu structure changes
const MENU_DATA_VERSION = '50-items-v1.0';
const VERSION_KEY = 'menu_data_version';

export const forceInitializeMenuData = () => {
  console.log('🔄 Initializing 50-item menu data...');
  
  // Clear all existing menu-related localStorage
  const keysToRemove = [
    'mockMenuItems',
    'canteen_1_menu', 'canteen_2_menu', 'canteen_3_menu',
    'canteen_1_admin_menu', 'canteen_2_admin_menu', 'canteen_3_admin_menu',
    'canteen_general_admin_menu',
    'campusEats_menu_cache',
    'menu_cache_timestamp'
  ];
  
  keysToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      console.log(`🗑️ Cleared old data: ${key}`);
    }
  });
  
  // Initialize fresh data for all canteens
  for (let canteenId = 1; canteenId <= 3; canteenId++) {
    const items = initializeCanteenData(canteenId);
    console.log(`✅ Initialized Canteen ${canteenId}: ${items.length} items`);
    
    // Verify the count
    const stats = getMenuStats(canteenId);
    console.log(`   ${stats.canteenName}: ${stats.total} total (${stats.veg} veg, ${stats.nonVeg} non-veg)`);
  }
  
  // Set version flag
  localStorage.setItem(VERSION_KEY, MENU_DATA_VERSION);
  console.log(`🏷️ Set data version: ${MENU_DATA_VERSION}`);
  
  return true;
};

export const checkAndInitializeMenuData = () => {
  const currentVersion = localStorage.getItem(VERSION_KEY);
  
  if (currentVersion !== MENU_DATA_VERSION) {
    console.log('🔍 Menu data version mismatch or missing, forcing initialization...');
    console.log(`   Current: ${currentVersion || 'none'}`);
    console.log(`   Required: ${MENU_DATA_VERSION}`);
    
    forceInitializeMenuData();
    
    // Dispatch event to notify components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('menuDataUpdated'));
    }
    
    return true;
  }
  
  // Verify data integrity
  let needsReinit = false;
  for (let canteenId = 1; canteenId <= 3; canteenId++) {
    const studentData = localStorage.getItem(`canteen_${canteenId}_menu`);
    if (!studentData) {
      console.log(`⚠️ Missing student data for canteen ${canteenId}`);
      needsReinit = true;
      break;
    }
    
    try {
      const items = JSON.parse(studentData);
      if (items.length !== 50) {
        console.log(`⚠️ Incorrect item count for canteen ${canteenId}: ${items.length} (expected 50)`);
        needsReinit = true;
        break;
      }
    } catch (error) {
      console.log(`⚠️ Corrupted data for canteen ${canteenId}`);
      needsReinit = true;
      break;
    }
  }
  
  if (needsReinit) {
    console.log('🔄 Data integrity check failed, reinitializing...');
    forceInitializeMenuData();
    return true;
  }
  
  console.log('✅ Menu data integrity verified - 50 items per canteen');
  return false;
};

function getMenuStats(canteenId: number) {
  const items = getCanteenMenuItems(canteenId);
  const veg = items.filter(item => item.is_veg).length;
  const nonVeg = items.filter(item => !item.is_veg).length;
  
  const canteenNames = {
    1: 'Main Canteen',
    2: 'IT Canteen', 
    3: 'MBA Canteen'
  };
  
  return {
    canteenName: canteenNames[canteenId as keyof typeof canteenNames],
    total: items.length,
    veg,
    nonVeg
  };
}

// Auto-initialize on module load
if (typeof window !== 'undefined') {
  // Run initialization check
  checkAndInitializeMenuData();
  
  // Add global function for debugging
  (window as any).forceMenuReset = forceInitializeMenuData;
  (window as any).checkMenuData = checkAndInitializeMenuData;
}