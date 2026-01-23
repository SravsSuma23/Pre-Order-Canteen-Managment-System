// Demo script to test menu consistency
// Run this in browser console to verify everything is working

import { syncMenuData } from './dataSync';
import { printConsistencyReport, fixMenuConsistency } from './verifyMenuConsistency';
import { getCanteenMenuStats } from '@/data/menuData';

export const demoMenuConsistency = () => {
  console.log('🎯 DEMO: Menu Consistency Test');
  console.log('=' .repeat(60));
  
  // Step 1: Show current unified menu stats
  console.log('\n📊 STEP 1: Current Unified Menu Data');
  console.log('-' .repeat(40));
  
  for (let canteenId = 1; canteenId <= 3; canteenId++) {
    const stats = getCanteenMenuStats(canteenId);
    console.log(`${stats.canteenName}: ${stats.total} items (${stats.veg} veg, ${stats.nonVeg} non-veg)`);
  }
  
  // Step 2: Initialize menu data for all canteens
  console.log('\n🔄 STEP 2: Syncing Menu Data');
  console.log('-' .repeat(40));
  syncMenuData();
  
  // Step 3: Verify consistency
  console.log('\n🔍 STEP 3: Verification Report');
  console.log('-' .repeat(40));
  const report = printConsistencyReport();
  
  // Step 4: Fix any issues (if needed)
  const hasIssues = report.some(r => r.issues.length > 0);
  if (hasIssues) {
    console.log('\n🔧 STEP 4: Fixing Issues');
    console.log('-' .repeat(40));
    fixMenuConsistency();
    
    console.log('\n✅ STEP 5: Final Verification');
    console.log('-' .repeat(40));
    printConsistencyReport();
  } else {
    console.log('\n✅ No issues found - all data is consistent!');
  }
  
  console.log('\n🎉 Demo completed! Both admin and student portals should now show identical menu data.');
  console.log('💡 Tips:');
  console.log('  • Student portals automatically load from localStorage when API fails');
  console.log('  • Admin portals now have fallback to unified menu data');
  console.log('   • All menus have exactly 50 items as specified');
  console.log('   • Main & IT Canteens: 25 Veg + 25 Non-Veg');
  console.log('   • MBA Canteen: 50 Veg items only');
};

// Quick verification function
export const quickMenuCheck = () => {
  console.log('🚀 Quick Menu Check');
  console.log('-' .repeat(30));
  
  const results = [];
  
  for (let canteenId = 1; canteenId <= 3; canteenId++) {
    const stats = getCanteenMenuStats(canteenId);
    const adminData = localStorage.getItem(`canteen_${canteenId}_admin_menu`);
    const studentData = localStorage.getItem(`canteen_${canteenId}_menu`);
    
    results.push({
      canteen: stats.canteenName,
      unified: `${stats.total} items (${stats.veg}V/${stats.nonVeg}NV)`,
      admin: adminData ? `${JSON.parse(adminData).length} items` : '❌ Missing',
      student: studentData ? `${JSON.parse(studentData).length} items` : '❌ Missing'
    });
  }
  
  console.table(results);
  
  return results;
};

// Function to reset and re-initialize everything
export const resetAndInitialize = () => {
  console.log('🔄 Resetting and initializing all menu data...');
  
  // Clear everything
  ['mockMenuItems', 
   'canteen_1_menu', 'canteen_2_menu', 'canteen_3_menu',
   'canteen_1_admin_menu', 'canteen_2_admin_menu', 'canteen_3_admin_menu'
  ].forEach(key => localStorage.removeItem(key));
  
  // Re-sync everything
  syncMenuData();
  
  console.log('✅ Reset and initialization complete!');
  
  return quickMenuCheck();
};