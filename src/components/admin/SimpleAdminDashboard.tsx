import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  LogOut,
  Wifi,
  WifiOff,
  Activity,
  Save,
  RefreshCw,
  Package,
  Eye,
  EyeOff,
  Building2,
  Computer,
  GraduationCap
} from 'lucide-react';
import { AdminMenuItem, adminMenuAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useMenuSocket } from '@/hooks/useSocket';

interface AdminInfo {
  admin_id: string;
  name: string;
  username: string;
  canteen: {
    canteen_id: number;
    name: string;
    location: string;
  };
}

interface Props {
  admin: AdminInfo;
  onLogout: () => void;
}

interface MenuItemUpdate {
  item_id: number;
  quantity: number;
  is_available: boolean;
  hasChanges: boolean;
}

export default function SimpleAdminDashboard({ admin, onLogout }: Props) {
  const { toast } = useToast();
  const [menuItems, setMenuItems] = useState<AdminMenuItem[]>([]);
  const [updates, setUpdates] = useState<{[key: number]: MenuItemUpdate}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'veg' | 'non-veg'>('all');

  // Real-time socket connection
  const { 
    isConnected, 
    connectionError, 
    lowStockAlerts, 
    clearAlerts 
  } = useMenuSocket(admin.canteen.canteen_id);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    setIsLoading(true);
    try {
      const data = await adminMenuAPI.getMenu();
      setMenuItems(data.menu_items);
      
      // Initialize updates tracking
      const initialUpdates: {[key: number]: MenuItemUpdate} = {};
      data.menu_items.forEach(item => {
        initialUpdates[item.item_id] = {
          item_id: item.item_id,
          quantity: item.available_quantity,
          is_available: item.is_available,
          hasChanges: false
        };
      });
      setUpdates(initialUpdates);
      
      setError(null);
    } catch (error: any) {
      setError('Failed to load menu items. Please try again.');
      console.error('Failed to fetch menu:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuantityChange = (itemId: number, newQuantity: number) => {
    const quantity = Math.max(0, newQuantity);
    const is_available = quantity > 0;
    
    setUpdates(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        quantity,
        is_available,
        hasChanges: true
      }
    }));
  };

  const toggleAvailability = (itemId: number) => {
    setUpdates(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        is_available: !prev[itemId].is_available,
        hasChanges: true
      }
    }));
  };

  const saveChanges = async () => {
    const changedItems = Object.values(updates).filter(update => update.hasChanges);
    
    if (changedItems.length === 0) {
      toast({
        title: "No Changes",
        description: "No changes to save.",
      });
      return;
    }

    setIsSaving(true);
    let successCount = 0;
    let errorCount = 0;

    for (const update of changedItems) {
      try {
        // Update quantity first
        const originalItem = menuItems.find(item => item.item_id === update.item_id);
        if (originalItem && originalItem.available_quantity !== update.quantity) {
          const quantityChange = update.quantity - originalItem.available_quantity;
          await adminMenuAPI.updateQuantity(update.item_id, quantityChange);
        }

        // Update availability if needed
        if (originalItem && originalItem.is_available !== update.is_available) {
          await adminMenuAPI.updateMenuItem(update.item_id, {
            is_available: update.is_available
          });
        }

        successCount++;
      } catch (error) {
        console.error(`Failed to update item ${update.item_id}:`, error);
        errorCount++;
      }
    }

    if (successCount > 0) {
      toast({
        title: "Changes Saved",
        description: `Successfully updated ${successCount} item(s)${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
      });
      
      // Refresh data and reset changes
      await fetchMenuItems();
    } else {
      toast({
        title: "Save Failed",
        description: "Failed to save changes. Please try again.",
        variant: "destructive"
      });
    }

    setIsSaving(false);
  };

  const resetChanges = () => {
    const resetUpdates: {[key: number]: MenuItemUpdate} = {};
    menuItems.forEach(item => {
      resetUpdates[item.item_id] = {
        item_id: item.item_id,
        quantity: item.available_quantity,
        is_available: item.is_available,
        hasChanges: false
      };
    });
    setUpdates(resetUpdates);
  };

  const getCanteenIcon = () => {
    if (admin.canteen.name.toLowerCase().includes('main')) return <Building2 className="w-5 h-5" />;
    if (admin.canteen.name.toLowerCase().includes('it')) return <Computer className="w-5 h-5" />;
    if (admin.canteen.name.toLowerCase().includes('mba')) return <GraduationCap className="w-5 h-5" />;
    return <Building2 className="w-5 h-5" />;
  };

  const filteredItems = menuItems.filter(item => {
    if (filter === 'veg') return item.is_veg;
    if (filter === 'non-veg') return !item.is_veg;
    return true;
  });

  const hasChanges = Object.values(updates).some(update => update.hasChanges);
  const changedCount = Object.values(updates).filter(update => update.hasChanges).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading menu items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 text-white rounded-full">
                {getCanteenIcon()}
              </div>
              <div>
                <h1 className="text-xl font-bold">{admin.canteen.name} - Admin Portal</h1>
                <p className="text-sm text-gray-600">{admin.canteen.location}</p>
              </div>
              {isConnected ? (
                <Badge className="bg-green-100 text-green-800">
                  <Wifi className="w-3 h-3 mr-1" />
                  Live
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <WifiOff className="w-3 h-3 mr-1" />
                  Offline
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Welcome, {admin.name}</span>
              <Button variant="outline" onClick={onLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Connection Error Alert */}
        {connectionError && (
          <Alert variant="destructive" className="mb-4">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              Connection error: {connectionError}. Changes may not sync in real-time.
            </AlertDescription>
          </Alert>
        )}

        {/* Low Stock Alerts */}
        {lowStockAlerts.length > 0 && (
          <Alert className="mb-4 border-orange-200 bg-orange-50">
            <Package className="h-4 w-4 text-orange-600" />
            <AlertDescription>
              <div className="font-medium text-orange-800 mb-2">Low Stock Alerts</div>
              <div className="space-y-1">
                {lowStockAlerts.map(alert => (
                  <div key={alert.itemId} className="text-sm text-orange-700">
                    {alert.itemName}: Only {alert.availableQuantity} left
                  </div>
                ))}
              </div>
              <Button size="sm" variant="outline" className="mt-2" onClick={clearAlerts}>
                Clear Alerts
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Action Bar */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  All Items ({menuItems.length})
                </Button>
                <Button
                  variant={filter === 'veg' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('veg')}
                >
                  Veg ({menuItems.filter(i => i.is_veg).length})
                </Button>
                <Button
                  variant={filter === 'non-veg' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('non-veg')}
                >
                  Non-Veg ({menuItems.filter(i => !i.is_veg).length})
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={fetchMenuItems}
                  disabled={isSaving}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                
                {hasChanges && (
                  <>
                    <Button
                      variant="outline"
                      onClick={resetChanges}
                      disabled={isSaving}
                    >
                      Reset Changes
                    </Button>
                    <Button
                      onClick={saveChanges}
                      disabled={isSaving}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes ({changedCount})
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Menu Items Table */}
        <Card>
          <CardHeader>
            <CardTitle>Menu Inventory Management</CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>
                  {error}
                  <Button variant="outline" size="sm" className="ml-2" onClick={fetchMenuItems}>
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-4 py-2 text-left font-medium">Item Name</th>
                      <th className="border border-gray-200 px-4 py-2 text-center font-medium">Type</th>
                      <th className="border border-gray-200 px-4 py-2 text-center font-medium">Price</th>
                      <th className="border border-gray-200 px-4 py-2 text-center font-medium">Quantity</th>
                      <th className="border border-gray-200 px-4 py-2 text-center font-medium">Status</th>
                      <th className="border border-gray-200 px-4 py-2 text-center font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => {
                      const update = updates[item.item_id];
                      const hasItemChanges = update?.hasChanges || false;
                      
                      return (
                        <tr 
                          key={item.item_id}
                          className={`hover:bg-gray-50 ${hasItemChanges ? 'bg-blue-50 border-blue-200' : ''}`}
                        >
                          <td className="border border-gray-200 px-4 py-2">
                            <div>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-xs text-gray-500">{item.category}</div>
                              {hasItemChanges && (
                                <Badge variant="outline" className="text-xs mt-1">
                                  Modified
                                </Badge>
                              )}
                            </div>
                          </td>
                          
                          <td className="border border-gray-200 px-4 py-2 text-center">
                            <Badge variant={item.is_veg ? "success" : "secondary"}>
                              {item.is_veg ? 'Veg' : 'Non-Veg'}
                            </Badge>
                          </td>
                          
                          <td className="border border-gray-200 px-4 py-2 text-center">
                            ₹{item.price}
                          </td>
                          
                          <td className="border border-gray-200 px-4 py-2 text-center">
                            <Input
                              type="number"
                              min="0"
                              value={update?.quantity || 0}
                              onChange={(e) => handleQuantityChange(item.item_id, parseInt(e.target.value) || 0)}
                              className="w-20 text-center"
                            />
                          </td>
                          
                          <td className="border border-gray-200 px-4 py-2 text-center">
                            <Badge
                              variant={update?.is_available ? "success" : "destructive"}
                              className="cursor-pointer"
                              onClick={() => toggleAvailability(item.item_id)}
                            >
                              {update?.is_available ? '✅ Available' : '❌ Not Available'}
                            </Badge>
                          </td>
                          
                          <td className="border border-gray-200 px-4 py-2 text-center">
                            <div className="flex gap-1 justify-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleQuantityChange(item.item_id, (update?.quantity || 0) + 1)}
                              >
                                +1
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleQuantityChange(item.item_id, (update?.quantity || 0) - 1)}
                                disabled={(update?.quantity || 0) <= 0}
                              >
                                -1
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleAvailability(item.item_id)}
                              >
                                {update?.is_available ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                
                {filteredItems.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No items found matching the current filter.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-blue-800 text-sm">
              <p className="font-medium mb-2">💡 How to use:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Change quantities by typing in the quantity field or using +1/-1 buttons</li>
                <li>Click on the status badge to toggle availability</li>
                <li>Items automatically become "Not Available" when quantity is 0</li>
                <li>Click "Save Changes" to apply all modifications</li>
                <li>Changes sync instantly to the student portal when saved</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}