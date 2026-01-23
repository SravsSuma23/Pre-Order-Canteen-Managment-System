import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, QrCode, Smartphone, Copy, CheckCircle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { paymentsAPI } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { order, payment } = location.state || {};
  const [isVerifying, setIsVerifying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  useEffect(() => {
    if (!order || !payment) {
      navigate('/cart');
      return;
    }

    // Generate QR code for UPI payment
    generateQRCode();

    // Countdown timer
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          toast({
            title: "Payment Expired",
            description: "Payment session has expired. Please try again.",
            variant: "destructive",
          });
          navigate('/cart');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [order, payment, navigate, toast]);

  const generateQRCode = async () => {
    if (!payment) return;
    
    try {
      // UPI payment string
      const upiString = `upi://pay?pa=${payment.merchant_upi}&pn=CampusEats&am=${payment.amount}&cu=INR&tn=${encodeURIComponent(payment.transaction_note)}`;
      
      // Generate QR code using a simple library-free approach
      // For production, you'd use a proper QR code library like qrcode
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        canvas.width = 256;
        canvas.height = 256;
        
        // Simple QR code placeholder - in production use proper QR library
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 256, 256);
        
        ctx.fillStyle = '#000000';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('UPI QR CODE', 128, 60);
        ctx.fillText('Scan with GPay', 128, 80);
        ctx.fillText('PhonePe, Paytm', 128, 100);
        ctx.fillText(`₹${payment.amount}`, 128, 140);
        ctx.fillText(payment.merchant_upi, 128, 160);
        
        // Draw a simple pattern to represent QR code
        for (let i = 0; i < 20; i++) {
          for (let j = 0; j < 20; j++) {
            if ((i + j) % 3 === 0) {
              ctx.fillRect(50 + i * 8, 180 + j * 3, 6, 2);
            }
          }
        }
        
        setQrCodeDataUrl(canvas.toDataURL());
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const launchUPIApp = (app: 'gpay' | 'phonepe' | 'paytm' | 'upi') => {
    if (!payment) return;
    
    const upiString = `upi://pay?pa=${payment.merchant_upi}&pn=CampusEats&am=${payment.amount}&cu=INR&tn=${encodeURIComponent(payment.transaction_note)}`;
    
    let appUrl = upiString;
    
    switch (app) {
      case 'gpay':
        appUrl = `tez://upi/pay?pa=${payment.merchant_upi}&pn=CampusEats&am=${payment.amount}&cu=INR&tn=${encodeURIComponent(payment.transaction_note)}`;
        break;
      case 'phonepe':
        appUrl = `phonepe://upi/pay?pa=${payment.merchant_upi}&pn=CampusEats&am=${payment.amount}&cu=INR&tn=${encodeURIComponent(payment.transaction_note)}`;
        break;
      case 'paytm':
        appUrl = `paytmmp://upi/pay?pa=${payment.merchant_upi}&pn=CampusEats&am=${payment.amount}&cu=INR&tn=${encodeURIComponent(payment.transaction_note)}`;
        break;
    }
    
    // Try to open the specific app, fallback to generic UPI
    window.location.href = appUrl;
    
    // Fallback to generic UPI after a short delay if app doesn't open
    setTimeout(() => {
      if (app !== 'upi') {
        window.location.href = upiString;
      }
    }, 2000);
    
    toast({
      title: "Opening UPI App",
      description: `Launching ${app === 'gpay' ? 'Google Pay' : app === 'phonepe' ? 'PhonePe' : app === 'paytm' ? 'Paytm' : 'UPI app'}...`,
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "UPI ID copied to clipboard",
    });
  };

  const handlePaymentVerification = async () => {
    setIsVerifying(true);
    
    try {
      toast({
        title: "Payment Verification",
        description: "Please complete the payment and wait for verification...",
      });
      
      // Simulate verification delay
      setTimeout(() => {
        // Create receipt data
        const receiptData = {
          receipt_id: 'RCP' + Date.now(),
          order: order,
          payment: payment,
          user: user,
          payment_status: 'completed',
          payment_timestamp: new Date().toISOString(),
          transaction_id: 'TXN' + Date.now()
        };
        
        // Store receipt for later retrieval
        const receipts = JSON.parse(localStorage.getItem('campusEats_receipts') || '[]');
        receipts.push(receiptData);
        localStorage.setItem('campusEats_receipts', JSON.stringify(receipts));
        
        // Clear cart after successful payment
        localStorage.removeItem('campusEats_cart');
        
        toast({
          title: "Payment Successful!",
          description: "Your order has been placed successfully. Generating receipt...",
        });
        
        // Navigate to receipt page
        navigate('/receipt', {
          state: { receipt: receiptData }
        });
      }, 3000);
      
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Could not verify payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  if (!order || !payment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>Invalid payment session. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/cart')}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Cart</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Methods */}
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Complete Payment</h1>
          
          {/* Timer */}
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-orange-800">Payment expires in:</span>
                <span className="text-lg font-bold text-orange-600">{formatTime(timeLeft)}</span>
              </div>
            </CardContent>
          </Card>

          {/* QR Code Payment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <QrCode className="h-5 w-5" />
                <span>Scan QR Code</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center p-6 bg-white border-2 border-dashed rounded-lg">
                {qrCodeDataUrl ? (
                  <img 
                    src={qrCodeDataUrl}
                    alt="UPI QR Code"
                    className="w-48 h-48 border rounded-lg"
                  />
                ) : (
                  <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                    <QrCode className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
              <p className="text-sm text-center text-muted-foreground">
                Scan this QR code with any UPI app (GPay, PhonePe, Paytm, etc.)
              </p>
              
              {/* Direct UPI App Launch Buttons */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-center">Or open directly in app:</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => launchUPIApp('gpay')}
                    className="flex items-center space-x-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Google Pay</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => launchUPIApp('phonepe')}
                    className="flex items-center space-x-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>PhonePe</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => launchUPIApp('paytm')}
                    className="flex items-center space-x-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Paytm</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => launchUPIApp('upi')}
                    className="flex items-center space-x-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Any UPI App</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Manual UPI Payment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Smartphone className="h-5 w-5" />
                <span>Manual Payment</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">UPI ID:</label>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 p-2 bg-muted rounded text-sm">
                    {payment.merchant_upi}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(payment.merchant_upi)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount:</label>
                <div className="p-2 bg-muted rounded text-lg font-bold">
                  ₹{payment.amount}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Reference:</label>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 p-2 bg-muted rounded text-sm">
                    {payment.transaction_note}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(payment.transaction_note)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Verification */}
          <Card>
            <CardContent className="p-6 text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                After completing the payment, click below to verify
              </p>
              <Button
                onClick={handlePaymentVerification}
                disabled={isVerifying}
                className="w-full"
                size="lg"
              >
                {isVerifying ? (
                  "Verifying Payment..."
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    I've Completed the Payment
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Order ID:</span>
                  <span className="font-mono">{order.order_id.slice(-8)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Canteen:</span>
                  <span>{order.canteen.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pickup Time:</span>
                  <span>{new Date(order.pickup_time).toLocaleTimeString()}</span>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span>₹{payment.amount}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>₹{payment.amount}</span>
                </div>
              </div>

              <div className="text-xs text-center text-muted-foreground mt-4 p-3 bg-blue-50 rounded">
                <strong>Instructions:</strong><br />
                {payment.instructions?.scan_qr || "Complete the payment using the QR code or manual UPI details above"}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}