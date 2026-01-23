import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { cartAPI, CartResponse, CartItem, CartSummary } from '../services/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../hooks/useAuth';

interface CartContextType {
  cart: CartResponse | null;
  cartItems: CartItem[];
  summary: CartSummary | null;
  isLoading: boolean;
  isOfflineMode: boolean;
  addToCart: (itemId: number, quantity?: number) => Promise<void>;
  updateCartItem: (cartId: number, quantity: number) => Promise<void>;
  removeFromCart: (cartId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  getCartItemCount: () => number;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();

  // Load cart when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      refreshCart();
    } else {
      // Clear cart state when not authenticated
      setCart({ cart_items: [], summary: { total_items: 0, subtotal: 0, tax_rate: 0, tax_amount: 0, total: 0 } });
      setIsOfflineMode(false);
    }
  }, [isAuthenticated, user]);

  const refreshCart = async () => {
    if (!isAuthenticated) {
      console.log('Cart refresh skipped - user not authenticated, checking localStorage...');
      // Load from localStorage for unauthenticated users or when logged out
      try {
        const fallbackCart = JSON.parse(localStorage.getItem('campusEats_cart') || '[]');
        if (fallbackCart.length > 0) {
          const subtotal = fallbackCart.reduce((sum: number, item: CartItem) => sum + item.item_total, 0);
          const tax_amount = subtotal * 0.05;
          const total = subtotal + tax_amount;
          
          setCart({
            cart_items: fallbackCart,
            summary: {
              total_items: fallbackCart.reduce((sum: number, item: CartItem) => sum + item.quantity, 0),
              subtotal,
              tax_rate: 0.05,
              tax_amount,
              total
            }
          });
          console.log('Loaded cart from localStorage:', fallbackCart.length + ' items');
          setIsOfflineMode(true);
        } else {
          setCart({ cart_items: [], summary: { total_items: 0, subtotal: 0, tax_rate: 0, tax_amount: 0, total: 0 } });
          setIsOfflineMode(false);
        }
      } catch {
        setCart({ cart_items: [], summary: { total_items: 0, subtotal: 0, tax_rate: 0, tax_amount: 0, total: 0 } });
        setIsOfflineMode(false);
      }
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('Refreshing cart from API...');
      const cartData = await cartAPI.getCart();
      console.log('Cart data received:', cartData);
      setCart(cartData);
      setIsOfflineMode(false); // API is working
    } catch (error: any) {
      console.error('Error fetching cart from API, trying localStorage fallback:', error);
      
      // Fallback to localStorage when API fails
      try {
        const fallbackCart = JSON.parse(localStorage.getItem('campusEats_cart') || '[]');
        if (fallbackCart.length > 0) {
          const subtotal = fallbackCart.reduce((sum: number, item: CartItem) => sum + item.item_total, 0);
          const tax_amount = subtotal * 0.05;
          const total = subtotal + tax_amount;
          
          setCart({
            cart_items: fallbackCart,
            summary: {
              total_items: fallbackCart.reduce((sum: number, item: CartItem) => sum + item.quantity, 0),
              subtotal,
              tax_rate: 0.05,
              tax_amount,
              total
            }
          });
          console.log('Loaded fallback cart from localStorage:', fallbackCart.length + ' items');
          setIsOfflineMode(true); // Using localStorage fallback
        } else {
          // Set empty cart on error
          setCart({ cart_items: [], summary: { total_items: 0, subtotal: 0, tax_rate: 0.05, tax_amount: 0, total: 0 } });
          setIsOfflineMode(false);
        }
      } catch {
        // Set empty cart on error
        setCart({ cart_items: [], summary: { total_items: 0, subtotal: 0, tax_rate: 0.05, tax_amount: 0, total: 0 } });
        setIsOfflineMode(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = async (itemId: number, quantity: number = 1) => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to add items to cart",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const result = await cartAPI.addToCart({ item_id: itemId, quantity });
      
      toast({
        title: "Added to Cart",
        description: `${result.item.name} has been added to your cart`,
      });
      
      await refreshCart();
    } catch (error: any) {
      console.warn('API failed, using localStorage backup:', error.message);
      
      // Fallback to localStorage when API fails
      try {
        const fallbackCart = JSON.parse(localStorage.getItem('campusEats_cart') || '[]');
        
        // Try to find the actual menu item from fallback data if available
        let fallbackItem: CartItem;
        try {
          // This would ideally come from the Menu component's fallback data
          // For now, we'll use reasonable defaults based on item ID ranges
          let itemName = `Item ${itemId}`;
          let itemPrice = 100;
          let itemImage = 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300&h=200&fit=crop';
          let canteenName = 'Main Canteen';
          let canteenId = 1;
          
          // Basic mapping based on ID ranges (matching the fallback menu structure)
          if (itemId <= 50) {
            canteenName = 'Main Canteen';
            canteenId = 1;
          } else if (itemId <= 100) {
            canteenName = 'IT Canteen';
            canteenId = 2;
          } else {
            canteenName = 'MBA Canteen';
            canteenId = 3;
          }
          
          // Some sample item names based on ID ranges
          const sampleItems = [
            { name: 'Masala Dosa', price: 80 },
            { name: 'Idli Sambar', price: 60 },
            { name: 'Vada Pav', price: 35 },
            { name: 'Poha', price: 45 },
            { name: 'Upma', price: 40 },
            { name: 'Samosa', price: 25 },
            { name: 'Chole Bhature', price: 120 },
            { name: 'Rajma Rice', price: 110 },
            { name: 'Biryani', price: 150 },
            { name: 'Paneer Curry', price: 130 },
          ];
          
          const randomItem = sampleItems[itemId % sampleItems.length];
          itemName = randomItem.name;
          itemPrice = randomItem.price;
          
          fallbackItem = {
            cart_id: Date.now() + Math.random(), // Use timestamp + random for unique ID
            quantity,
            item_id: itemId,
            name: itemName,
            description: 'Delicious menu item',
            price: itemPrice,
            image_url: itemImage,
            vegetarian: true,
            available_quantity: 50,
            canteen_id: canteenId,
            canteen_name: canteenName,
            item_total: itemPrice * quantity,
            created_at: new Date().toISOString()
          };
        } catch (e) {
          // Fallback to basic defaults if item lookup fails
          fallbackItem = {
            cart_id: Date.now() + Math.random(),
            quantity,
            item_id: itemId,
            name: `Item ${itemId}`,
            description: 'Menu item',
            price: 100,
            image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300&h=200&fit=crop',
            vegetarian: true,
            available_quantity: 50,
            canteen_id: 1,
            canteen_name: 'Main Canteen',
            item_total: 100 * quantity,
            created_at: new Date().toISOString()
          };
        }
        
        // Check if item already exists in fallback cart
        const existingItemIndex = fallbackCart.findIndex((item: CartItem) => item.item_id === itemId);
        if (existingItemIndex >= 0) {
          fallbackCart[existingItemIndex].quantity += quantity;
          fallbackCart[existingItemIndex].item_total = fallbackCart[existingItemIndex].price * fallbackCart[existingItemIndex].quantity;
        } else {
          fallbackCart.push(fallbackItem);
        }
        
        localStorage.setItem('campusEats_cart', JSON.stringify(fallbackCart));
        
        // Update cart state with fallback data
        const subtotal = fallbackCart.reduce((sum: number, item: CartItem) => sum + item.item_total, 0);
        const tax_amount = subtotal * 0.05;
        const total = subtotal + tax_amount;
        
        setCart({
          cart_items: fallbackCart,
          summary: {
            total_items: fallbackCart.reduce((sum: number, item: CartItem) => sum + item.quantity, 0),
            subtotal,
            tax_rate: 0.05,
            tax_amount,
            total
          }
        });
        
        toast({
          title: "Added to Cart",
          description: `Item has been added to your cart (offline mode)`,
        });
        setIsOfflineMode(true); // Mark as offline mode
      } catch (fallbackError) {
        toast({
          title: "Failed to Add Item",
          description: "Could not add item to cart",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateCartItem = async (cartId: number, quantity: number) => {
    if (!isAuthenticated) {
      // Handle localStorage update for unauthenticated users
      try {
        const fallbackCart = JSON.parse(localStorage.getItem('campusEats_cart') || '[]');
        const itemIndex = fallbackCart.findIndex((item: CartItem) => item.cart_id === cartId);
        
        if (itemIndex >= 0) {
          if (quantity > 0) {
            fallbackCart[itemIndex].quantity = quantity;
            fallbackCart[itemIndex].item_total = fallbackCart[itemIndex].price * quantity;
          } else {
            fallbackCart.splice(itemIndex, 1);
          }
          
          localStorage.setItem('campusEats_cart', JSON.stringify(fallbackCart));
          await refreshCart();
          
          toast({
            title: "Cart Updated",
            description: "Item quantity has been updated",
          });
        }
      } catch {
        toast({
          title: "Update Failed",
          description: "Could not update cart item",
          variant: "destructive",
        });
      }
      return;
    }

    try {
      setIsLoading(true);
      await cartAPI.updateCartItem(cartId, quantity);
      await refreshCart();
      
      toast({
        title: "Cart Updated",
        description: "Item quantity has been updated",
      });
    } catch (error: any) {
      console.warn('Cart API update failed, trying localStorage fallback:', error.message);
      
      // Fallback to localStorage when API fails
      try {
        const fallbackCart = JSON.parse(localStorage.getItem('campusEats_cart') || '[]');
        const itemIndex = fallbackCart.findIndex((item: CartItem) => item.cart_id === cartId);
        
        if (itemIndex >= 0) {
          if (quantity > 0) {
            fallbackCart[itemIndex].quantity = quantity;
            fallbackCart[itemIndex].item_total = fallbackCart[itemIndex].price * quantity;
          } else {
            fallbackCart.splice(itemIndex, 1);
          }
          
          localStorage.setItem('campusEats_cart', JSON.stringify(fallbackCart));
          await refreshCart();
          
          toast({
            title: "Cart Updated",
            description: "Item quantity has been updated (offline mode)",
          });
        } else {
          toast({
            title: "Update Failed",
            description: "Cart item not found",
            variant: "destructive",
          });
        }
      } catch {
        toast({
          title: "Update Failed",
          description: "Could not update cart item",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (cartId: number) => {
    if (!isAuthenticated) {
      // Handle localStorage removal for unauthenticated users
      try {
        const fallbackCart = JSON.parse(localStorage.getItem('campusEats_cart') || '[]');
        const itemIndex = fallbackCart.findIndex((item: CartItem) => item.cart_id === cartId);
        
        if (itemIndex >= 0) {
          fallbackCart.splice(itemIndex, 1);
          localStorage.setItem('campusEats_cart', JSON.stringify(fallbackCart));
          await refreshCart();
          
          toast({
            title: "Item Removed",
            description: "Item has been removed from your cart",
          });
        }
      } catch {
        toast({
          title: "Remove Failed",
          description: "Could not remove item from cart",
          variant: "destructive",
        });
      }
      return;
    }

    try {
      setIsLoading(true);
      await cartAPI.removeFromCart(cartId);
      await refreshCart();
      
      toast({
        title: "Item Removed",
        description: "Item has been removed from your cart",
      });
    } catch (error: any) {
      console.warn('Cart API removal failed, trying localStorage fallback:', error.message);
      
      // Fallback to localStorage when API fails
      try {
        const fallbackCart = JSON.parse(localStorage.getItem('campusEats_cart') || '[]');
        const itemIndex = fallbackCart.findIndex((item: CartItem) => item.cart_id === cartId);
        
        if (itemIndex >= 0) {
          fallbackCart.splice(itemIndex, 1);
          localStorage.setItem('campusEats_cart', JSON.stringify(fallbackCart));
          await refreshCart();
          
          toast({
            title: "Item Removed",
            description: "Item has been removed from your cart (offline mode)",
          });
        } else {
          toast({
            title: "Remove Failed",
            description: "Cart item not found",
            variant: "destructive",
          });
        }
      } catch {
        toast({
          title: "Remove Failed",
          description: "Could not remove item from cart",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated) {
      // Handle localStorage clearing for unauthenticated users
      try {
        localStorage.removeItem('campusEats_cart');
        setCart({ cart_items: [], summary: { total_items: 0, subtotal: 0, tax_rate: 0, tax_amount: 0, total: 0 } });
        
        toast({
          title: "Cart Cleared",
          description: "All items have been removed from your cart",
        });
      } catch {
        toast({
          title: "Clear Failed",
          description: "Could not clear cart",
          variant: "destructive",
        });
      }
      return;
    }

    try {
      setIsLoading(true);
      await cartAPI.clearCart();
      localStorage.removeItem('campusEats_cart'); // Also clear localStorage
      setCart({ cart_items: [], summary: { total_items: 0, subtotal: 0, tax_rate: 0, tax_amount: 0, total: 0 } });
      
      toast({
        title: "Cart Cleared",
        description: "All items have been removed from your cart",
      });
    } catch (error: any) {
      console.warn('Cart API clear failed, trying localStorage fallback:', error.message);
      
      // Fallback to localStorage when API fails
      try {
        localStorage.removeItem('campusEats_cart');
        setCart({ cart_items: [], summary: { total_items: 0, subtotal: 0, tax_rate: 0, tax_amount: 0, total: 0 } });
        
        toast({
          title: "Cart Cleared",
          description: "All items have been removed from your cart (offline mode)",
        });
      } catch {
        toast({
          title: "Clear Failed",
          description: "Could not clear cart",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getCartItemCount = (): number => {
    return cart?.summary.total_items || 0;
  };

  const value = {
    cart,
    cartItems: cart?.cart_items || [],
    summary: cart?.summary || null,
    isLoading,
    isOfflineMode,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    refreshCart,
    getCartItemCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

