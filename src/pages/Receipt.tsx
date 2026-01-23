import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Download, Share2, CheckCircle, Clock, MapPin, User, Phone, Mail, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Receipt() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { receipt } = location.state || {};

  if (!receipt) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>No receipt data found. Redirecting...</p>
          <Button onClick={() => navigate('/dashboard')} className="mt-4">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const { order, payment, user, payment_status, payment_timestamp, transaction_id, receipt_id } = receipt;

  const downloadReceipt = () => {
    // Create a printable version
    const receiptContent = document.getElementById('receipt-content');
    if (receiptContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Payment Receipt - ${receipt_id}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .receipt { max-width: 600px; margin: 0 auto; }
                .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                .section { margin-bottom: 20px; }
                .flex { display: flex; justify-content: space-between; }
                .bold { font-weight: bold; }
              </style>
            </head>
            <body>
              <div class="receipt">
                ${receiptContent.innerHTML}
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
    
    toast({
      title: "Receipt Downloaded",
      description: "Receipt is ready for printing/saving",
    });
  };

  const shareReceipt = () => {
    if (navigator.share) {
      navigator.share({
        title: `CampusEats Receipt - ${receipt_id}`,
        text: `Payment successful for order ${order.order_id}. Amount: ₹${payment.amount}`,
      });
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(`CampusEats Receipt - ${receipt_id}\nOrder ID: ${order.order_id}\nAmount: ₹${payment.amount}\nTransaction ID: ${transaction_id}`);
      toast({
        title: "Receipt Copied",
        description: "Receipt details copied to clipboard",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard')}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Button>
      </div>

      <div id="receipt-content" className="space-y-6">
        {/* Success Header */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-green-800 mb-2">Payment Successful!</h1>
            <p className="text-green-700">Your order has been confirmed and is being prepared.</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Receipt Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Payment Receipt</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Receipt ID:</span>
                  <span className="font-mono">{receipt_id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Transaction ID:</span>
                  <span className="font-mono">{transaction_id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payment Date:</span>
                  <span>{new Date(payment_timestamp).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payment Method:</span>
                  <span>UPI</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="text-green-600 font-medium capitalize">{payment_status}</span>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex justify-between font-bold text-lg">
                <span>Amount Paid:</span>
                <span className="text-green-600">₹{payment.amount}</span>
              </div>
              
              <div className="flex space-x-2 mt-4">
                <Button 
                  onClick={downloadReceipt}
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button 
                  onClick={shareReceipt}
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Student Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Student Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">Student ID: {user.student_id}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{user.email}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{user.phone}</span>
              </div>
              <div className="text-sm">
                <p><span className="text-muted-foreground">Course:</span> {user.course}</p>
                <p><span className="text-muted-foreground">Year:</span> {user.year}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-muted-foreground">Order ID:</span>
                <span className="font-mono">{order.order_id}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{order.canteen.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Pickup: {new Date(order.pickup_time).toLocaleTimeString()}</span>
              </div>
            </div>

            <Separator />

            {/* Order Items */}
            <div className="space-y-3">
              <h4 className="font-medium">Items Ordered:</h4>
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-dashed last:border-b-0">
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.canteen_name} • Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹{item.item_total}</p>
                    <p className="text-sm text-muted-foreground">₹{item.price} each</p>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Order Summary */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>₹{order.subtotal}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax (5%)</span>
                <span>₹{order.tax_amount}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total Amount</span>
                <span>₹{order.total_amount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pickup Instructions */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <h4 className="font-medium text-blue-800 mb-2">Pickup Instructions</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Please arrive at {order.canteen.name} by {new Date(order.pickup_time).toLocaleTimeString()}</li>
              <li>• Show this receipt or your order ID ({order.order_id}) to the staff</li>
              <li>• Your order will be ready for pickup approximately 5 minutes before the scheduled time</li>
              <li>• For any issues, contact the canteen directly or visit the help desk</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4 mt-8">
        <Button onClick={() => navigate('/dashboard')} variant="default" size="lg">
          Order Again
        </Button>
        <Button onClick={() => navigate('/orders')} variant="outline" size="lg">
          View All Orders
        </Button>
      </div>
    </div>
  );
}