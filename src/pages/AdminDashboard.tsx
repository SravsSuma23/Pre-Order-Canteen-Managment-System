import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  ShoppingCart, 
  LogOut, 
  Store,
  Bell,
  Users,
  TrendingUp,
  Package
} from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useToast } from '@/hooks/use-toast';
import DashboardStats from '@/components/admin/DashboardStats';
import MenuManagement from '@/components/admin/MenuManagement';
import OrderManagement from '@/components/admin/OrderManagement';
import StockManager from '@/components/admin/StockManager';
import { restoreOriginalMenus } from '@/utils/menuRecovery';

interface AdminDashboardProps {
  canteenId?: number;
}

export default function AdminDashboard({ canteenId }: AdminDashboardProps = {}) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { admin, logout, isAuthenticated } = useAdminAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Debug logging
  console.log('AdminDashboard rendered - isAuthenticated:', isAuthenticated, 'admin:', admin);

  // Redirect if not authenticated
  useEffect(() => {
    console.log('AdminDashboard auth check - isAuthenticated:', isAuthenticated);
    if (!isAuthenticated) {
      console.log('Not authenticated, redirecting to admin login');
      navigate('/admin/login');
    }
  }, [isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
    navigate('/admin/login');
  };

  const handleRestoreMenu = () => {
    try {
      const result = restoreOriginalMenus();
      toast({
        title: "Menu Restored Successfully! 🎉",
        description: `Restored ${result.total} items across all canteens. Please refresh the Menu tab to see changes.`,
        variant: "default",
      });
      
      // Force a page reload to refresh all components
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      toast({
        title: "Restore Failed",
        description: "Failed to restore original menu data",
        variant: "destructive",
      });
    }
  };

  if (!admin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Store className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    Admin Dashboard
                  </h1>
                  <p className="text-sm text-gray-500">
                    {admin.canteen.name}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="hidden sm:flex">
                  {admin.canteen.location}
                </Badge>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">Welcome {admin.username}</p>
                  <p className="text-xs text-gray-500">{admin.name}</p>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={handleRestoreMenu}
                className="flex items-center space-x-2 bg-green-50 hover:bg-green-100 border-green-200"
              >
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">Restore Menu</span>
              </Button>

              <Button
                variant="outline"
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4 mb-8">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="stock" className="flex items-center space-x-2">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Stock</span>
            </TabsTrigger>
            <TabsTrigger value="menu" className="flex items-center space-x-2">
              <UtensilsCrossed className="w-4 h-4" />
              <span className="hidden sm:inline">Menu</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center space-x-2">
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Orders</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
                <p className="text-gray-600">Monitor your canteen's performance and metrics</p>
              </div>
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-gray-400" />
                <Badge variant="secondary">Live</Badge>
              </div>
            </div>
            <DashboardStats />
          </TabsContent>

          {/* Stock Management Tab */}
          <TabsContent value="stock" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Stock Management</h2>
                <p className="text-gray-600">Update inventory levels and item availability in real-time</p>
              </div>
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-gray-400" />
                <Badge variant="secondary">Live Updates</Badge>
              </div>
            </div>
            <StockManager />
          </TabsContent>

          {/* Menu Management Tab */}
          <TabsContent value="menu" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Menu Management</h2>
                <p className="text-gray-600">Manage your menu items, prices, and availability</p>
              </div>
              <div className="flex items-center space-x-2">
                <UtensilsCrossed className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-500">Canteen ID: {admin.canteen.canteen_id}</span>
              </div>
            </div>
            <MenuManagement />
          </TabsContent>

          {/* Order Management Tab */}
          <TabsContent value="orders" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
                <p className="text-gray-600">View and manage customer orders</p>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-gray-400" />
                <Badge variant="outline">Real-time</Badge>
              </div>
            </div>
            <OrderManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}