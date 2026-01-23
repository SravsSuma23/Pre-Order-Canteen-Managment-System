import { getCanteenMenuItems, getCanteenMenuStats } from '@/data/menuData';

export interface MenuConsistencyReport {
  canteenId: number;
  canteenName: string;
  totalItems: number;
  vegItems: number;
  nonVegItems: number;
  categories: string[];
  adminDataExists: boolean;
  studentDataExists: boolean;
  dataMatches: boolean;
  issues: string[];
}

export const verifyMenuConsistency = (): MenuConsistencyReport[] => {
  const results: MenuConsistencyReport[] = [];
  
  for (let canteenId = 1; canteenId <= 3; canteenId++) {
    const stats = getCanteenMenuStats(canteenId);
    const unifiedData = getCanteenMenuItems(canteenId);
    
    // Check localStorage data
    const adminStorageKey = `canteen_${canteenId}_admin_menu`;
    const studentStorageKey = `canteen_${canteenId}_menu`;
    
    const adminDataStr = localStorage.getItem(adminStorageKey);
    const studentDataStr = localStorage.getItem(studentStorageKey);
    
    const adminDataExists = !!adminDataStr;
    const studentDataExists = !!studentDataStr;
    
    let dataMatches = false;
    const issues: string[] = [];
    
    // Validate expected item counts
    const expectedCounts = {
      1: { total: 50, veg: 25, nonVeg: 25 }, // Main Canteen
      2: { total: 50, veg: 25, nonVeg: 25 }, // IT Canteen  
      3: { total: 50, veg: 50, nonVeg: 0 }   // MBA Canteen (Veg only)
    };
    
    const expected = expectedCounts[canteenId as keyof typeof expectedCounts];
    
    if (stats.total !== expected.total) {
      issues.push(`Expected ${expected.total} total items, got ${stats.total}`);
    }
    
    if (stats.veg !== expected.veg) {
      issues.push(`Expected ${expected.veg} vegetarian items, got ${stats.veg}`);
    }
    
    if (stats.nonVeg !== expected.nonVeg) {
      issues.push(`Expected ${expected.nonVeg} non-vegetarian items, got ${stats.nonVeg}`);
    }
    
    // Check if stored data matches unified data
    if (adminDataExists && studentDataExists) {
      try {
        const adminData = JSON.parse(adminDataStr);
        const studentData = JSON.parse(studentDataStr);
        
        const adminIds = adminData.map((item: any) => item.item_id).sort();
        const studentIds = studentData.map((item: any) => item.item_id).sort();
        const unifiedIds = unifiedData.map(item => item.item_id).sort();
        
        const adminMatches = JSON.stringify(adminIds) === JSON.stringify(unifiedIds);
        const studentMatches = JSON.stringify(studentIds) === JSON.stringify(unifiedIds);
        
        dataMatches = adminMatches && studentMatches;
        
        if (!adminMatches) {
          issues.push('Admin localStorage data does not match unified menu data');
        }
        
        if (!studentMatches) {
          issues.push('Student localStorage data does not match unified menu data');
        }
        
        if (JSON.stringify(adminIds) !== JSON.stringify(studentIds)) {
          issues.push('Admin and student localStorage data do not match each other');
        }
        
      } catch (error) {
        issues.push('Error parsing localStorage data');
        dataMatches = false;
      }
    } else {
      if (!adminDataExists) issues.push('Admin localStorage data missing');
      if (!studentDataExists) issues.push('Student localStorage data missing');
    }
    
    results.push({
      canteenId,
      canteenName: stats.canteenName,
      totalItems: stats.total,
      vegItems: stats.veg,
      nonVegItems: stats.nonVeg,
      categories: stats.categories,
      adminDataExists,
      studentDataExists,
      dataMatches,
      issues
    });
  }
  
  return results;
};

export const printConsistencyReport = () => {
  const results = verifyMenuConsistency();
  
  console.log('🔍 MENU CONSISTENCY VERIFICATION REPORT');
  console.log('=' .repeat(50));
  
  results.forEach(result => {
    console.log(`\n📍 ${result.canteenName} (ID: ${result.canteenId})`);
    console.log(`   Total Items: ${result.totalItems}`);
    console.log(`   Vegetarian: ${result.vegItems}`);
    console.log(`   Non-Vegetarian: ${result.nonVegItems}`);
    console.log(`   Categories: ${result.categories.length} (${result.categories.join(', ')})`);
    console.log(`   Admin Data: ${result.adminDataExists ? '✅' : '❌'}`);
    console.log(`   Student Data: ${result.studentDataExists ? '✅' : '❌'}`);
    console.log(`   Data Consistency: ${result.dataMatches ? '✅' : '❌'}`);
    
    if (result.issues.length > 0) {
      console.log('   ⚠️ Issues:');
      result.issues.forEach(issue => console.log(`     • ${issue}`));
    }
  });
  
  const allConsistent = results.every(r => r.dataMatches && r.issues.length === 0);
  
  console.log('\n' + '=' .repeat(50));
  console.log(`Overall Status: ${allConsistent ? '✅ ALL CONSISTENT' : '❌ ISSUES FOUND'}`);
  
  return results;
};

// Helper function to fix any consistency issues
export const fixMenuConsistency = () => {
  console.log('🔧 Fixing menu consistency issues...');
  
  for (let canteenId = 1; canteenId <= 3; canteenId++) {
    const unifiedData = getCanteenMenuItems(canteenId);
    const adminStorageKey = `canteen_${canteenId}_admin_menu`;
    const studentStorageKey = `canteen_${canteenId}_menu`;
    
    // Set both admin and student data to the same unified data
    localStorage.setItem(adminStorageKey, JSON.stringify(unifiedData));
    localStorage.setItem(studentStorageKey, JSON.stringify(unifiedData));
    
    console.log(`✅ Fixed data for ${getCanteenMenuStats(canteenId).canteenName}`);
  }
  
  console.log('🎉 Menu consistency fixed for all canteens!');
  
  // Dispatch storage events to notify components
  for (let canteenId = 1; canteenId <= 3; canteenId++) {
    const unifiedData = getCanteenMenuItems(canteenId);
    const storageKey = `canteen_${canteenId}_menu`;
    
    window.dispatchEvent(new StorageEvent('storage', {
      key: storageKey,
      newValue: JSON.stringify(unifiedData),
      storageArea: localStorage
    }));
  }
};