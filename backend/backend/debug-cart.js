const db = require('./config/database');

(async () => {
  try {
    console.log('Checking user and cart data...');
    
    const { rows: users } = await db.execute('SELECT email, user_id FROM users WHERE email = "sravanthi@student.com"');
    console.log('User data:', JSON.stringify(users, null, 2));
    
    if (users.length > 0) {
      const userId = users[0].user_id;
      
      const { rows: cartItems } = await db.execute('SELECT * FROM cart WHERE user_id = ?', [userId]);
      console.log('Cart items:', JSON.stringify(cartItems, null, 2));
      
      const { rows: cartWithMenu } = await db.execute(`
        SELECT 
          c.cart_id, c.quantity,
          m.item_id, m.name, m.price, m.canteen_id, m.is_available,
          can.name as canteen_name, can.is_active
        FROM cart c
        JOIN menu_items m ON c.item_id = m.item_id
        JOIN canteens can ON m.canteen_id = can.canteen_id
        WHERE c.user_id = ?
      `, [userId]);
      console.log('Cart with menu details:', JSON.stringify(cartWithMenu, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
})();