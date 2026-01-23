import { syncMenuData } from './dataSync';
import { fixMenuConsistency } from './verifyMenuConsistency';

// Force reset and reload all menu data
export const forceDataReset = () => {
  console.log('🔄 FORCE RESETTING ALL MENU DATA...');
  
  // Clear all existing localStorage data
  const keysToRemove = [
    'mockMenuItems',
    'canteen_1_menu', 'canteen_2_menu', 'canteen_3_menu',
    'canteen_1_admin_menu', 'canteen_2_admin_menu', 'canteen_3_admin_menu',
    'canteen_general_admin_menu',
    'campusEats_menu_cache',
    'menu_cache_timestamp'
  ];
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log(`🗑️ Removed ${key}`);
  });
  
  // Clear any session storage as well
  sessionStorage.clear();
  console.log('🗑️ Cleared session storage');
  
  // Force sync new data
  console.log('📥 Loading fresh 50-item menu data...');
  syncMenuData();
  
  // Ensure consistency
  fixMenuConsistency();
  
  console.log('✅ Force reset complete! Please refresh the page.');
  console.log('📊 Each canteen now has:');
  console.log('   • Main Canteen: 50 items (25 Veg + 25 Non-Veg)');
  console.log('   • IT Canteen: 50 items (25 Veg + 25 Non-Veg)');
  console.log('   • MBA Canteen: 50 items (50 Veg + 0 Non-Veg)');
  
  // Force page reload to ensure fresh data
  if (typeof window !== 'undefined') {
    console.log('🔄 Reloading page to apply changes...');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }
  
  return true;
};

// Auto-run on import in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Add global function for easy browser console access
  (window as any).forceDataReset = forceDataReset;
  console.log('💡 Run forceDataReset() in console to reset menu data');
}