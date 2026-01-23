import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Wifi,
  WifiOff,
  Activity,
  Zap,
  Eye,
  Settings,
  Users,
  ArrowRight,
  CheckCircle,
  Package,
  PlayCircle
} from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { useToast } from '@/hooks/use-toast';

export default function RealtimeDemo() {
  const { toast } = useToast();
  const [updates, setUpdates] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<{[key: number]: boolean}>({});

  // Socket connections for all three canteens
  const mainCanteenSocket = useSocket(1, {
    onMenuItemUpdate: (data) => handleUpdate('Main Canteen', data, 'quantity_update'),
    onMenuItemAvailability: (data) => handleUpdate('Main Canteen', data, 'availability_change'),
    onLowStockAlert: (data) => handleUpdate('Main Canteen', data, 'low_stock_alert'),
    onMenuItemAdded: (data) => handleUpdate('Main Canteen', data, 'item_added')
  });

  const itCanteenSocket = useSocket(2, {
    onMenuItemUpdate: (data) => handleUpdate('IT Canteen', data, 'quantity_update'),
    onMenuItemAvailability: (data) => handleUpdate('IT Canteen', data, 'availability_change'),
    onLowStockAlert: (data) => handleUpdate('IT Canteen', data, 'low_stock_alert'),
    onMenuItemAdded: (data) => handleUpdate('IT Canteen', data, 'item_added')
  });

  const mbaCanteenSocket = useSocket(3, {
    onMenuItemUpdate: (data) => handleUpdate('MBA Canteen', data, 'quantity_update'),
    onMenuItemAvailability: (data) => handleUpdate('MBA Canteen', data, 'availability_change'),
    onLowStockAlert: (data) => handleUpdate('MBA Canteen', data, 'low_stock_alert'),
    onMenuItemAdded: (data) => handleUpdate('MBA Canteen', data, 'item_added')
  });

  useEffect(() => {
    setConnectionStatus({
      1: mainCanteenSocket.isConnected,
      2: itCanteenSocket.isConnected,
      3: mbaCanteenSocket.isConnected
    });
  }, [mainCanteenSocket.isConnected, itCanteenSocket.isConnected, mbaCanteenSocket.isConnected]);

  const handleUpdate = (canteenName: string, data: any, type: string) => {
    const update = {
      id: Date.now() + Math.random(),
      canteenName,
      type,
      data,
      timestamp: new Date()
    };
    
    setUpdates(prev => [update, ...prev.slice(0, 19)]); // Keep last 20 updates
    
    // Show toast notification
    let title = '';
    let description = '';
    
    switch (type) {
      case 'quantity_update':
        title = '📦 Quantity Updated';
        description = `${data.name || data.itemName} in ${canteenName} - Qty: ${data.availableQuantity}`;
        break;
      case 'availability_change':
        title = data.isAvailable ? '✅ Item Available' : '❌ Item Unavailable';
        description = `${data.itemName} in ${canteenName}`;
        break;
      case 'low_stock_alert':
        title = '⚠️ Low Stock Alert';
        description = `${data.itemName} in ${canteenName} - Only ${data.availableQuantity} left`;
        break;
      case 'item_added':
        title = '🆕 New Item Added';
        description = `${data.menuItem.name} added to ${canteenName}`;
        break;
    }
    
    toast({
      title,
      description,
      duration: 4000,
    });
  };

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case 'quantity_update': return <Package className="w-4 h-4 text-blue-600" />;
      case 'availability_change': return <Eye className="w-4 h-4 text-green-600" />;
      case 'low_stock_alert': return <Activity className="w-4 h-4 text-orange-600" />;
      case 'item_added': return <CheckCircle className="w-4 h-4 text-purple-600" />;
      default: return <Zap className="w-4 h-4 text-gray-600" />;
    }
  };

  const getUpdateColor = (type: string) => {
    switch (type) {
      case 'quantity_update': return 'bg-blue-50 border-blue-200';
      case 'availability_change': return 'bg-green-50 border-green-200';
      case 'low_stock_alert': return 'bg-orange-50 border-orange-200';
      case 'item_added': return 'bg-purple-50 border-purple-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const formatUpdateText = (update: any) => {
    const { type, data, canteenName } = update;
    
    switch (type) {
      case 'quantity_update':
        return `${data.name || data.itemName} quantity changed to ${data.availableQuantity} (${data.isAvailable ? 'Available' : 'Unavailable'})`;
      case 'availability_change':
        return `${data.itemName} is now ${data.isAvailable ? 'available' : 'unavailable'}`;
      case 'low_stock_alert':
        return `${data.itemName} low stock alert - ${data.availableQuantity} remaining`;
      case 'item_added':
        return `${data.menuItem.name} added (₹${data.menuItem.price})`;
      default:
        return 'Unknown update';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🔄 Real-time Sync Demo</h1>
            <p className="text-lg text-gray-600 mb-4">
              Watch live updates between Admin Dashboard and Student Portal
            </p>
            
            {/* Connection Status */}
            <div className="flex justify-center gap-4 mb-4">
              {[
                { id: 1, name: 'Main Canteen', connected: connectionStatus[1] },
                { id: 2, name: 'IT Canteen', connected: connectionStatus[2] },
                { id: 3, name: 'MBA Canteen', connected: connectionStatus[3] }
              ].map((canteen) => (
                <Badge 
                  key={canteen.id}
                  variant={canteen.connected ? "default" : "destructive"}
                  className="flex items-center gap-1"
                >
                  {canteen.connected ? (
                    <Wifi className="w-3 h-3" />
                  ) : (
                    <WifiOff className="w-3 h-3" />
                  )}
                  {canteen.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Admin Panel */}
          <Card className="h-fit">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Admin Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="p-4 bg-orange-50 rounded-lg">
                  <h3 className="font-semibold text-orange-800 mb-2">Make Changes Here</h3>
                  <p className="text-sm text-orange-700 mb-3">
                    Open the admin dashboard to modify menu items
                  </p>
                  <Button 
                    onClick={() => window.open('http://localhost:8080/admin/dashboard', '_blank')}
                    className="w-full"
                  >
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Open Admin Dashboard
                  </Button>
                </div>
                
                <div className="text-sm text-gray-600 space-y-2">
                  <p><strong>Login Credentials:</strong></p>
                  <div className="bg-gray-50 p-2 rounded text-xs space-y-1">
                    <div>Main: main_admin / admin123</div>
                    <div>IT: it_admin / admin123</div>
                    <div>MBA: mba_admin / admin123</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Student Panel */}
          <Card className="h-fit">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Student Portal
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">See Changes Here</h3>
                  <p className="text-sm text-blue-700 mb-3">
                    View the live menu updates as they happen
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => window.open('http://localhost:8080/student-portal', '_blank')}
                    className="w-full"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Open Student Portal
                  </Button>
                </div>
                
                <div className="text-sm text-gray-600">
                  <p>Watch for:</p>
                  <div className="text-xs space-y-1 mt-2">
                    <div className="flex items-center gap-2">
                      <Package className="w-3 h-3 text-blue-600" />
                      Quantity changes
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="w-3 h-3 text-green-600" />
                      Availability updates
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="w-3 h-3 text-orange-600" />
                      Low stock alerts
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Updates Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Live Updates Feed
              <Badge variant="outline" className="ml-2">
                {updates.length} updates
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {updates.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 mb-2">No updates yet</p>
                <p className="text-sm text-gray-400">
                  Make changes in the admin dashboard to see real-time updates here
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {updates.map((update) => (
                  <div 
                    key={update.id}
                    className={`p-3 rounded-lg border ${getUpdateColor(update.type)} transition-all duration-300 hover:shadow-sm`}
                  >
                    <div className="flex items-start gap-3">
                      {getUpdateIcon(update.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{update.canteenName}</span>
                          <ArrowRight className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-600 capitalize">
                            {update.type.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800">
                          {formatUpdateText(update)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {update.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {updates.length > 0 && (
              <div className="mt-4 text-center">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setUpdates([])}
                >
                  Clear Updates
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800">🚀 How to Test Real-time Sync</CardTitle>
          </CardHeader>
          <CardContent className="text-green-700">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Click "Open Admin Dashboard" and login with any admin credentials</li>
              <li>Click "Open Student Portal" in a new tab</li>
              <li>In the admin dashboard, try these actions:
                <ul className="list-disc list-inside ml-6 mt-1 space-y-1 text-xs">
                  <li>Click the + or - buttons to change quantities</li>
                  <li>Toggle "Show/Hide" to change availability</li>
                  <li>Use "Set Qty" for bulk quantity changes</li>
                  <li>Add new menu items</li>
                </ul>
              </li>
              <li>Watch this page and the student portal update instantly!</li>
              <li>Notice the toast notifications and visual indicators</li>
            </ol>
            
            <Alert className="mt-4 border-green-300 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Pro Tip:</strong> Open the browser's developer console to see Socket.IO connection logs and events in real-time!
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}