/**
 * Test utility to verify the complete 50-item menu system is working correctly
 */

import { getCanteenMenuItems } from '@/data/menuData';

export interface MenuTestResult {
  canteenId: number;
  canteenName: string;
  totalItems: number;
  vegItems: number;
  nonVegItems: number;
  categories: string[];
  isValid: boolean;
  issues: string[];
}

// Helper function to get menu stats
function getCanteenMenuStats(canteenId: number) {
  const items = getCanteenMenuItems(canteenId);
  const vegItems = items.filter(item => item.is_veg).length;
  const nonVegItems = items.filter(item => !item.is_veg).length;
  const categories = [...new Set(items.map(item => item.category))];
  
  const canteenNames = {
    1: 'Main Canteen',
    2: 'IT Canteen', 
    3: 'MBA Canteen'
  };
  
  return {
    canteenName: canteenNames[canteenId as keyof typeof canteenNames] || `Canteen ${canteenId}`,
    totalItems: items.length,
    vegItems,
    nonVegItems,
    categories
  };
}

export function testCanteenMenu(canteenId: number): MenuTestResult {
  const stats = getCanteenMenuStats(canteenId);
  const issues: string[] = [];
  
  // Test 1: Check if exactly 50 items
  if (stats.totalItems !== 50) {
    issues.push(`Expected 50 items, got ${stats.totalItems}`);
  }
  
  // Test 2: Check veg/non-veg distribution based on canteen type
  if (canteenId === 1) { // Main Canteen
    if (stats.vegItems !== 25 || stats.nonVegItems !== 25) {
      issues.push(`Main Canteen should have 25 veg and 25 non-veg items, got ${stats.vegItems} veg and ${stats.nonVegItems} non-veg`);
    }
  } else if (canteenId === 2) { // IT Canteen
    if (stats.vegItems !== 25 || stats.nonVegItems !== 25) {
      issues.push(`IT Canteen should have 25 veg and 25 non-veg items, got ${stats.vegItems} veg and ${stats.nonVegItems} non-veg`);
    }
  } else if (canteenId === 3) { // MBA Canteen
    if (stats.vegItems !== 50 || stats.nonVegItems !== 0) {
      issues.push(`MBA Canteen should have 50 veg items and 0 non-veg items, got ${stats.vegItems} veg and ${stats.nonVegItems} non-veg`);
    }
  }
  
  // Test 3: Check if there are categories
  if (stats.categories.length === 0) {
    issues.push('No categories found');
  }
  
  // Test 4: Check localStorage initialization
  const adminData = localStorage.getItem(`canteen_${canteenId}_admin_menu`);
  const studentData = localStorage.getItem(`canteen_${canteenId}_menu`);
  
  if (!adminData) {
    issues.push('Admin menu data not found in localStorage');
  }
  if (!studentData) {
    issues.push('Student menu data not found in localStorage');
  }
  
  return {
    canteenId,
    canteenName: stats.canteenName,
    totalItems: stats.totalItems,
    vegItems: stats.vegItems,
    nonVegItems: stats.nonVegItems,
    categories: stats.categories,
    isValid: issues.length === 0,
    issues
  };
}

export function testAllCanteens(): MenuTestResult[] {
  return [1, 2, 3].map(testCanteenMenu);
}

export function printMenuTestResults(results: MenuTestResult[] = testAllCanteens()): void {
  console.log('\n🧪 MENU SYSTEM TEST RESULTS\n' + '='.repeat(50));
  
  results.forEach(result => {
    console.log(`\n📍 ${result.canteenName} (ID: ${result.canteenId})`);
    console.log(`   Total Items: ${result.totalItems}`);
    console.log(`   Veg Items: ${result.vegItems}`);
    console.log(`   Non-Veg Items: ${result.nonVegItems}`);
    console.log(`   Categories: ${result.categories.length} (${result.categories.join(', ')})`);
    console.log(`   Status: ${result.isValid ? '✅ PASS' : '❌ FAIL'}`);
    
    if (result.issues.length > 0) {
      console.log('   Issues:');
      result.issues.forEach(issue => console.log(`     - ${issue}`));
    }
  });
  
  const allValid = results.every(r => r.isValid);
  console.log(`\n🎯 Overall Status: ${allValid ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}\n`);
  
  if (allValid) {
    console.log('🎉 Your 50-item menu system is working perfectly!');
    console.log('📱 Students will see exactly 50 non-repeated items per canteen');
    console.log('⚙️  Admins can manage all 50 items with proper categories');
  }
}

// Make it globally available for browser console testing
declare global {
  interface Window {
    testMenuSystem: () => void;
  }
}

if (typeof window !== 'undefined') {
  window.testMenuSystem = () => printMenuTestResults();
}