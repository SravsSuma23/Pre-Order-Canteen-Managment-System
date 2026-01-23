// Simple script to clear all authentication and menu data
// Run this in browser console if you're having login issues

function resetAllData() {
  console.log('🧹 Clearing all authentication and menu data...');
  
  // Clear all authentication data
  [
    'campusEats_admin_token',
    'campusEats_admin_data', 
    'campusEats_admin_isOffline',
    'campusEats_token',
    'campusEats_user_data'
  ].forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      console.log(`✅ Cleared ${key}`);
    }
  });
  
  // Clear all menu data
  [
    'mockMenuItems',
    'canteen_1_menu', 'canteen_2_menu', 'canteen_3_menu',
    'canteen_1_admin_menu', 'canteen_2_admin_menu', 'canteen_3_admin_menu',
    'canteen_general_admin_menu'
  ].forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      console.log(`✅ Cleared ${key}`);
    }
  });
  
  console.log('🎉 All data cleared! Please refresh the page and try login again.');
  console.log('📋 Demo credentials:');
  console.log('• Main Canteen: admin_main / admin123');
  console.log('• IT Canteen: admin_it / admin123'); 
  console.log('• MBA Canteen: admin_mba / admin123');
  
  // Auto-refresh after 2 seconds
  setTimeout(() => {
    window.location.reload();
  }, 2000);
}

// Auto-run the reset
resetAllData();