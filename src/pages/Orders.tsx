import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, CheckCircle, Package, Utensils } from "lucide-react";

const mockOrders = [
  {
    id: "ORD001",
    date: "2024-01-20",
    time: "12:45 PM",
    canteen: "Main Cafeteria",
    items: [
      { name: "Chicken Biryani", quantity: 2, price: 120 },
      { name: "South Indian Thali", quantity: 1, price: 80 },
    ],
    total: 320,
    status: "delivered",
    estimatedTime: "15-20 mins",
  },
  {
    id: "ORD002", 
    date: "2024-01-19",
    time: "2:30 PM",
    canteen: "Fast Food Corner",
    items: [
      { name: "Margherita Pizza", quantity: 1, price: 150 },
      { name: "Chicken Burger", quantity: 1, price: 100 },
    ],
    total: 250,
    status: "ready",
    estimatedTime: "5 mins",
  },
  {
    id: "ORD003",
    date: "2024-01-19",
    time: "10:15 AM", 
    canteen: "Healthy Bites",
    items: [
      { name: "Mediterranean Salad", quantity: 2, price: 70 },
      { name: "Green Smoothie", quantity: 1, price: 60 },
    ],
    total: 200,
    status: "preparing",
    estimatedTime: "8 mins",
  },
  {
    id: "ORD004",
    date: "2024-01-18",
    time: "1:00 PM",
    canteen: "Main Cafeteria", 
    items: [
      { name: "Paneer Butter Masala", quantity: 1, price: 90 },
    ],
    total: 90,
    status: "placed",
    estimatedTime: "12 mins",
  },
];

const statusConfig = {
  placed: {
    label: "Order Placed",
    icon: Clock,
    color: "bg-blue-500",
    variant: "secondary" as const,
  },
  preparing: {
    label: "Preparing",
    icon: Utensils,
    color: "bg-orange-500",
    variant: "default" as const,
  },
  ready: {
    label: "Ready for Pickup",
    icon: Package,
    color: "bg-green-500",
    variant: "default" as const,
  },
  delivered: {
    label: "Delivered",
    icon: CheckCircle,
    color: "bg-green-600",
    variant: "secondary" as const,
  },
};

export default function Orders() {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState("all");

  const filterOrders = (status: string) => {
    if (status === "all") return mockOrders;
    if (status === "active") return mockOrders.filter(order => ["placed", "preparing", "ready"].includes(order.status));
    return mockOrders.filter(order => order.status === status);
  };

  const filteredOrders = filterOrders(selectedTab);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/dashboard")}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Order History
        </h1>
        <p className="text-muted-foreground">
          Track your current and past orders
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 mb-8 bg-muted p-1 rounded-lg w-fit">
        {[
          { key: "all", label: "All Orders" },
          { key: "active", label: "Active" },
          { key: "delivered", label: "Completed" },
        ].map((tab) => (
          <Button
            key={tab.key}
            variant={selectedTab === tab.key ? "default" : "ghost"}
            onClick={() => setSelectedTab(tab.key)}
            className="rounded-md"
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-6">
        {filteredOrders.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No orders found</h3>
              <p className="text-muted-foreground mb-6">
                {selectedTab === "all" 
                  ? "You haven't placed any orders yet."
                  : `No ${selectedTab} orders found.`
                }
              </p>
              <Button onClick={() => navigate("/dashboard")}>
                Start Ordering
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => {
            const StatusIcon = statusConfig[order.status as keyof typeof statusConfig].icon;
            return (
              <Card key={order.id} className="overflow-hidden hover:shadow-medium transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-3">
                        <span>Order #{order.id}</span>
                        <Badge variant={statusConfig[order.status as keyof typeof statusConfig].variant}>
                          <StatusIcon className="h-4 w-4 mr-1" />
                          {statusConfig[order.status as keyof typeof statusConfig].label}
                        </Badge>
                      </CardTitle>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-2">
                        <span>{order.canteen}</span>
                        <span>•</span>
                        <span>{order.date} at {order.time}</span>
                        {order.status !== "delivered" && (
                          <>
                            <span>•</span>
                            <span className="text-primary font-medium">ETA: {order.estimatedTime}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">₹{order.total}</div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Order Items */}
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm">
                          {item.quantity}x {item.name}
                        </span>
                        <span className="text-sm font-medium">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 mt-6">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    {order.status === "delivered" && (
                      <Button variant="outline" size="sm">
                        Rate & Review
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      Reorder
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Order Again CTA */}
      {filteredOrders.length > 0 && (
        <div className="mt-12 text-center">
          <Button 
            onClick={() => navigate("/dashboard")}
            className="bg-gradient-primary hover:opacity-90"
            size="lg"
          >
            Order Again
          </Button>
        </div>
      )}
    </div>
  );
}