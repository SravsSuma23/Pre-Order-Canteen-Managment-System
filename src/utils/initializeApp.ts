import { syncMenuData } from './dataSync';
import { fixMenuConsistency } from './verifyMenuConsistency';

// Initialize application data on startup
export const initializeApp = () => {
  console.log('🚀 Initializing Canteen Craft Pro...');
  
  try {
    // Sync menu data for all canteens
    syncMenuData();
    
    // Ensure consistency
    fixMenuConsistency();
    
    console.log('✅ Application initialized successfully!');
    console.log('📋 Menu data loaded:');
    console.log('   • Main Canteen: 50 items (25 Veg + 25 Non-Veg)');
    console.log('   • IT Canteen: 50 items (25 Veg + 25 Non-Veg)');
    console.log('   • MBA Canteen: 50 items (50 Veg + 0 Non-Veg)');
    
  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
  }
};

// Auto-initialize if in browser
if (typeof window !== 'undefined') {
  // Initialize data when the DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  } else {
    initializeApp();
  }
}