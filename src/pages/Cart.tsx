import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Plus, Minus, Trash2, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/useCart";
import { ordersAPI, paymentsAPI, cartAPI } from "@/services/api";

export default function Cart() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { cartItems, summary, isLoading, isOfflineMode, updateCartItem, removeFromCart, refreshCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);

  const updateQuantity = async (cartId: number, newQuantity: number) => {
    if (newQuantity === 0) {
      await removeItem(cartId);
      return;
    }
    
    await updateCartItem(cartId, newQuantity);
  };

  const removeItem = async (cartId: number) => {
    await removeFromCart(cartId);
  };

  const getSubtotal = () => {
    return summary?.subtotal || 0;
  };

  const getTax = () => {
    return summary?.tax_amount || 0;
  };

  const getTotal = () => {
    return summary?.total || 0;
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast({
        title: "Cart is Empty",
        description: "Please add some items to your cart before proceeding.",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    
    // Force refresh cart before checkout
    console.log('Refreshing cart before checkout...');
    await refreshCart();
    
    try {
      // Step 1: Create order from cart
      const pickupTime = new Date();
      pickupTime.setMinutes(pickupTime.getMinutes() + 45); // 45 minutes from now
      
      const orderData = {
        pickup_time: pickupTime.toISOString(),
        payment_method: "upi",
        special_instructions: ""
      };
      
      console.log('Creating order with data:', orderData);
      
      let orderResult;
      let paymentResult;
      
      if (isOfflineMode || localStorage.getItem('campusEats_isOfflineAuth') === 'true') {
        // Create offline order
        console.log('Creating offline order...');
        orderResult = {
          order_id: 'ORD' + Date.now(),
          total_amount: getTotal(),
          subtotal: getSubtotal(),
          tax_amount: getTax(),
          items: cartItems,
          pickup_time: pickupTime.toISOString(),
          status: 'pending',
          canteen: {
            name: cartItems[0]?.canteen_name || 'Campus Canteen',
            location: 'Campus'
          },
          created_at: new Date().toISOString()
        };
        
        // Create offline payment data with UPI integration
        paymentResult = {
          payment_id: 'PAY' + Date.now(),
          order_id: orderResult.order_id,
          amount: orderResult.total_amount,
          merchant_upi: 'campuseats@paytm', // Default merchant UPI ID
          transaction_note: `Order ${orderResult.order_id.slice(-8)}`,
          qr_code_url: null, // Will be generated dynamically
          upi_intent_url: `upi://pay?pa=campuseats@paytm&pn=CampusEats&am=${orderResult.total_amount}&cu=INR&tn=Order%20${orderResult.order_id.slice(-8)}`,
          instructions: {
            scan_qr: 'Scan the QR code with your UPI app (GPay, PhonePe, Paytm, etc.) to complete payment.',
            manual_pay: `Send ₹${orderResult.total_amount} to campuseats@paytm with reference ${orderResult.order_id.slice(-8)}`
          },
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
        };
        
        // Store order locally
        const orders = JSON.parse(localStorage.getItem('campusEats_orders') || '[]');
        orders.push(orderResult);
        localStorage.setItem('campusEats_orders', JSON.stringify(orders));
        
      } else {
        // Use API for order creation
        console.log('Current user token:', localStorage.getItem('campusEats_token'));
        console.log('Current cart items:', cartItems);
        
        orderResult = await ordersAPI.createOrder(orderData);
        console.log('Order created successfully:', orderResult);
        
        // Step 2: Initiate UPI payment
        const paymentData = {
          order_id: orderResult.order_id,
          amount: orderResult.total_amount
        };
        
        paymentResult = await paymentsAPI.initiatePayment(paymentData);
      }
      
      // Step 3: Navigate to payment page with payment details
      navigate(`/payment`, {
        state: {
          order: orderResult,
          payment: paymentResult
        }
      });
      
    } catch (error: any) {
      console.error('Checkout failed:', error);
      toast({
        title: "Checkout Failed",
        description: error.message || "Could not create order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center space-x-4 mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/dashboard")}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Canteens</span>
          </Button>
        </div>
        <div className="text-center py-12">
          <p>Loading cart...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center space-x-4 mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/dashboard")}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Canteens</span>
          </Button>
        </div>
        
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">
            Add some delicious items from our canteens to get started!
          </p>
          <div className="space-x-4">
            <Button onClick={() => navigate("/dashboard")}>
              Browse Canteens
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Your Cart</h1>
            <Button 
              variant="outline" 
              onClick={refreshCart}
              disabled={isLoading}
            >
              {isLoading ? "Refreshing..." : "Refresh Cart"}
            </Button>
          </div>
          
          {/* Offline Mode Indicator */}
          {isOfflineMode && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Offline Mode
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Cart data is saved locally. Backend connection unavailable. Some features may be limited.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            {cartItems.map((item) => (
              <Card key={item.cart_id}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    {/* Item Image */}
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.image_url || "https://images.unsplash.com/photo-1563379091339-03246963d96c?w=300&h=200&fit=crop"}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Item Details */}
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.canteen_name}</p>
                      <p className="font-bold text-primary">₹{parseFloat(item.price.toString()).toFixed(2)}</p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.cart_id, item.quantity - 1)}
                        disabled={isLoading}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="font-medium w-8 text-center">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.cart_id, item.quantity + 1)}
                        disabled={isLoading}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.cart_id)}
                      disabled={isLoading}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{getSubtotal()}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (5%)</span>
                <span>₹{getTax()}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>₹{getTotal()}</span>
              </div>
              
              <Button 
                onClick={handleCheckout}
                disabled={isProcessing}
                className="w-full bg-gradient-accent hover:opacity-90 mt-6"
                size="lg"
              >
                {isProcessing ? (
                  "Processing..."
                ) : (
                  <>
                    <CreditCard className="h-5 w-5 mr-2" />
                    Proceed to Payment
                  </>
                )}
              </Button>
              
              <div className="text-xs text-muted-foreground text-center mt-4">
                Secure payment powered by UPI
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}