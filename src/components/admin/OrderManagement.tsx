import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Filter, 
  Clock, 
  User, 
  Phone, 
  CreditCard, 
  Package, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RotateCcw,
  IndianRupee,
  Calendar,
  MapPin
} from 'lucide-react';
import { AdminOrder, adminOrderAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export default function OrderManagement() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchOrders();
  }, [currentPage, selectedStatus, selectedPaymentStatus]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
        ...(selectedPaymentStatus !== 'all' && { payment_status: selectedPaymentStatus })
      };
      
      const data = await adminOrderAPI.getOrders(params);
      setOrders(data.orders);
      setTotalPages(Math.ceil(data.total / itemsPerPage));
      setError(null);
    } catch (error: any) {
      setError(error.message || 'Failed to load orders');
      toast({
        title: "Failed to load orders",
        description: error.message || "Could not fetch orders",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter orders based on search term
  const filteredOrders = orders.filter(order =>
    order.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.student_phone?.includes(searchTerm) ||
    order.order_id.toString().includes(searchTerm)
  );

  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    try {
      const response = await adminOrderAPI.updateOrderStatus(orderId, newStatus);
      
      setOrders(prev =>
        prev.map(order =>
          order.order_id === orderId
            ? { ...order, status: response.order.status }
            : order
        )
      );

      toast({
        title: "Order Status Updated",
        description: `Order #${orderId} status changed to ${newStatus}`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to update status",
        description: error.message || "Could not update order status",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, color: "text-yellow-600", icon: Clock },
      confirmed: { variant: "default" as const, color: "text-blue-600", icon: CheckCircle },
      preparing: { variant: "default" as const, color: "text-orange-600", icon: Package },
      ready: { variant: "default" as const, color: "text-green-600", icon: CheckCircle },
      delivered: { variant: "default" as const, color: "text-green-700", icon: CheckCircle },
      cancelled: { variant: "destructive" as const, color: "text-red-600", icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        <Icon className="w-3 h-3" />
        <span className="capitalize">{status}</span>
      </Badge>
    );
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    const isPaid = paymentStatus === 'completed';
    return (
      <Badge variant={isPaid ? "default" : "secondary"} className={isPaid ? "text-green-700" : "text-orange-600"}>
        {isPaid ? 'Paid' : 'Pending'}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNextStatus = (currentStatus: string) => {
    const statusFlow = {
      pending: 'confirmed',
      confirmed: 'preparing',
      preparing: 'ready',
      ready: 'delivered'
    };
    return statusFlow[currentStatus as keyof typeof statusFlow];
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-8 bg-gray-200 rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrders}
            className="ml-2"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search orders, students, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>

          {/* Status Filter */}
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="preparing">Preparing</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          {/* Payment Status Filter */}
          <Select value={selectedPaymentStatus} onValueChange={setSelectedPaymentStatus}>
            <SelectTrigger className="w-full sm:w-40">
              <CreditCard className="w-4 h-4 mr-2" />
              <SelectValue placeholder="All Payments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="completed">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={fetchOrders} variant="outline">
          <RotateCcw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{orders.length}</div>
            <div className="text-sm text-gray-600">Total Orders</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {orders.filter(order => ['pending', 'confirmed', 'preparing'].includes(order.status)).length}
            </div>
            <div className="text-sm text-gray-600">Active Orders</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {orders.filter(order => order.status === 'delivered').length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {formatCurrency(orders.reduce((sum, order) => sum + order.total_amount, 0))}
            </div>
            <div className="text-sm text-gray-600">Total Revenue</div>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No orders found</p>
            {searchTerm || selectedStatus !== 'all' || selectedPaymentStatus !== 'all' ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedStatus('all');
                  setSelectedPaymentStatus('all');
                }}
                className="mt-2"
              >
                Clear filters
              </Button>
            ) : null}
          </div>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.order_id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <span>Order #{order.order_id}</span>
                      {getStatusBadge(order.status)}
                    </CardTitle>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDateTime(order.created_at)}</span>
                      </div>
                      {order.estimated_time && (
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{order.estimated_time} min</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">{formatCurrency(order.total_amount)}</div>
                    {getPaymentStatusBadge(order.payment_status)}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Customer Info */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <h4 className="font-medium mb-2">Customer Details</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span>{order.student_name || 'N/A'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span>{order.student_phone || 'N/A'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span>{order.delivery_address || 'Pickup'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="flex-1">
                    <h4 className="font-medium mb-2">Items ({order.items.length})</h4>
                    <div className="space-y-1 text-sm max-h-20 overflow-y-auto">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between">
                          <span>{item.name} x{item.quantity}</span>
                          <span>{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="text-sm text-gray-500">
                    Payment: {order.payment_method || 'Unknown'}
                  </div>
                  
                  <div className="flex space-x-2">
                    {order.status === 'pending' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusUpdate(order.order_id, 'cancelled')}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(order.order_id, 'confirmed')}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Confirm
                        </Button>
                      </>
                    )}
                    
                    {getNextStatus(order.status) && order.status !== 'delivered' && order.status !== 'cancelled' && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(order.order_id, getNextStatus(order.status)!)}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Mark as {getNextStatus(order.status)?.replace('_', ' ')}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}