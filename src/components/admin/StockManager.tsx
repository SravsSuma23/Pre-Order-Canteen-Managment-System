import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Package, 
  Plus, 
  Minus, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Save,
  Eye,
  EyeOff,
  Zap
} from 'lucide-react';
import { AdminMenuItem } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { getCanteenMenuItems, initializeCanteenData, UnifiedMenuItem } from '@/data/menuData';

interface StockManagerProps {
  canteenId?: number;
}

interface StockUpdate {
  item_id: number;
  quantity?: number;
  is_available?: boolean;
}

export default function StockManager({ canteenId: propCanteenId }: StockManagerProps) {
  const { toast } = useToast();
  const { admin } = useAdminAuth();
  const [menuItems, setMenuItems] = useState<UnifiedMenuItem[]>([]);
  
  // Use admin's canteen ID, fall back to prop, then default to 1
  const canteenId = admin?.canteen?.canteen_id || propCanteenId || 1;
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('quick-update');
  const [pendingUpdates, setPendingUpdates] = useState<Map<number, StockUpdate>>(new Map());
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadMenuData();
  }, [canteenId]);
  
  // Listen for menu data updates
  useEffect(() => {
    const handleMenuDataUpdate = () => {
      console.log('🔄 Stock manager: menu data updated, refreshing...');
      loadMenuData(); // Refresh the stock data
    };
    
    window.addEventListener('menuDataUpdated', handleMenuDataUpdate);
    return () => window.removeEventListener('menuDataUpdated', handleMenuDataUpdate);
  }, []);

  const loadMenuData = async () => {
    setIsLoading(true);
    try {
      if (!canteenId) {
        setMenuItems([]);
        setIsLoading(false);
        return;
      }

      // Try to load from localStorage first
      const storageKey = `canteen_${canteenId}_admin_menu`;
      const storedData = localStorage.getItem(storageKey);
      
      if (storedData) {
        setMenuItems(JSON.parse(storedData));
      } else {
        // Initialize with unified canteen data
        const menuItems = initializeCanteenData(canteenId);
        setMenuItems(menuItems);
        
        toast({
          title: "Menu Data Initialized",
          description: `Loaded ${menuItems.length} items for ${['', 'Main', 'IT', 'MBA'][canteenId]} Canteen`,
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error loading menu data:', error);
      // Fallback to unified data
      const menuItems = getCanteenMenuItems(canteenId || 1);
      setMenuItems(menuItems);
    } finally {
      setIsLoading(false);
    }
  };

  const updateLocalData = (updatedItems: UnifiedMenuItem[]) => {
    if (!canteenId) return;
    
    const adminStorageKey = `canteen_${canteenId}_admin_menu`;
    const studentStorageKey = `canteen_${canteenId}_menu`;
    
    // Update both admin and student data to keep them in sync
    localStorage.setItem(adminStorageKey, JSON.stringify(updatedItems));
    localStorage.setItem(studentStorageKey, JSON.stringify(updatedItems));
    setMenuItems(updatedItems);
    
    // Trigger storage event for cross-tab communication
    window.dispatchEvent(new StorageEvent('storage', {
      key: studentStorageKey,
      newValue: JSON.stringify(updatedItems),
      storageArea: localStorage
    }));
    
    console.log(`📦 Updated menu data for canteen ${canteenId}:`, updatedItems.length, 'items');
  };

  const handleQuickQuantityUpdate = (itemId: number, newQuantity: number) => {
    const updatedItems = menuItems.map(item => 
      item.item_id === itemId 
        ? { 
            ...item, 
            available_quantity: Math.max(0, newQuantity),
            is_available: newQuantity > 0 ? true : item.is_available,
            updated_at: new Date().toISOString()
          }
        : item
    );
    
    updateLocalData(updatedItems);
    
    toast({
      title: "Quantity Updated",
      description: `Updated stock for ${menuItems.find(i => i.item_id === itemId)?.name}`,
      variant: "default",
    });
  };

  const handleAvailabilityToggle = (itemId: number, isAvailable: boolean) => {
    const updatedItems = menuItems.map(item => 
      item.item_id === itemId 
        ? { ...item, is_available: isAvailable, updated_at: new Date().toISOString() }
        : item
    );
    
    updateLocalData(updatedItems);
    
    const itemName = menuItems.find(i => i.item_id === itemId)?.name;
    toast({
      title: `Item ${isAvailable ? 'Enabled' : 'Disabled'}`,
      description: `${itemName} is now ${isAvailable ? 'available' : 'unavailable'}`,
      variant: isAvailable ? "default" : "destructive",
    });
  };

  const addToPendingUpdates = (itemId: number, update: Partial<StockUpdate>) => {
    setPendingUpdates(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(itemId) || { item_id: itemId };
      newMap.set(itemId, { ...existing, ...update });
      return newMap;
    });
  };

  const applyPendingUpdates = async () => {
    if (pendingUpdates.size === 0) return;
    
    setIsUpdating(true);
    try {
      const updatedItems = menuItems.map(item => {
        const update = pendingUpdates.get(item.item_id);
        if (update) {
          return {
            ...item,
            available_quantity: update.quantity !== undefined ? update.quantity : item.available_quantity,
            is_available: update.is_available !== undefined ? update.is_available : item.is_available,
            updated_at: new Date().toISOString()
          };
        }
        return item;
      });
      
      updateLocalData(updatedItems);
      setPendingUpdates(new Map());
      
      toast({
        title: "Bulk Update Applied",
        description: `Successfully updated ${pendingUpdates.size} items`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to apply bulk updates",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStockStatusColor = (item: UnifiedMenuItem) => {
    if (!item.is_available) return 'bg-red-100 text-red-800';
    if (item.available_quantity === 0) return 'bg-red-100 text-red-800';
    if (item.available_quantity <= 5) return 'bg-yellow-100 text-yellow-800';
    if (item.available_quantity <= 10) return 'bg-blue-100 text-blue-800';
    return 'bg-green-100 text-green-800';
  };

  const getStockStatusIcon = (item: UnifiedMenuItem) => {
    if (!item.is_available || item.available_quantity === 0) return <XCircle className="w-4 h-4" />;
    if (item.available_quantity <= 5) return <AlertTriangle className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Loading menu data...</span>
      </div>
    );
  }

  const canteenNames = {
    1: 'Main Canteen',
    2: 'IT Canteen', 
    3: 'MBA Canteen'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Stock Management</h2>
          <p className="text-gray-600">
            {canteenId ? `Managing ${canteenNames[canteenId as keyof typeof canteenNames]} inventory` : 'Manage your menu inventory and availability'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Zap className="w-3 h-3" />
            <span>Real-time</span>
          </Badge>
          {pendingUpdates.size > 0 && (
            <Button onClick={applyPendingUpdates} disabled={isUpdating} className="flex items-center space-x-2">
              <Save className="w-4 h-4" />
              <span>Apply Updates ({pendingUpdates.size})</span>
            </Button>
          )}
          <Button variant="outline" onClick={loadMenuData} className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-xl font-bold">{menuItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Available</p>
                <p className="text-xl font-bold text-green-600">
                  {menuItems.filter(item => item.is_available && item.available_quantity > 0).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-xl font-bold text-yellow-600">
                  {menuItems.filter(item => item.is_available && item.available_quantity > 0 && item.available_quantity <= 5).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Out of Stock</p>
                <p className="text-xl font-bold text-red-600">
                  {menuItems.filter(item => !item.is_available || item.available_quantity === 0).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="quick-update">Quick Update</TabsTrigger>
          <TabsTrigger value="bulk-update">Bulk Update</TabsTrigger>
        </TabsList>

        {/* Quick Update Tab */}
        <TabsContent value="quick-update" className="space-y-4">
          {pendingUpdates.size > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You have {pendingUpdates.size} pending changes. Don't forget to apply them!
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 gap-4">
            {menuItems.map((item) => (
              <Card key={item.item_id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-600">{item.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline">{item.category}</Badge>
                        <Badge className={getStockStatusColor(item)}>
                          <div className="flex items-center space-x-1">
                            {getStockStatusIcon(item)}
                            <span>{item.available_quantity} left</span>
                          </div>
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuickQuantityUpdate(item.item_id, item.available_quantity - 1)}
                        disabled={item.available_quantity <= 0}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      
                      <div className="w-16 text-center">
                        <Input
                          type="number"
                          value={item.available_quantity}
                          onChange={(e) => handleQuickQuantityUpdate(item.item_id, parseInt(e.target.value) || 0)}
                          className="text-center text-sm"
                          min="0"
                        />
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuickQuantityUpdate(item.item_id, item.available_quantity + 1)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`available-${item.item_id}`} className="text-sm">
                        {item.is_available ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </Label>
                      <Switch
                        id={`available-${item.item_id}`}
                        checked={item.is_available}
                        onCheckedChange={(checked) => handleAvailabilityToggle(item.item_id, checked)}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Bulk Update Tab */}
        <TabsContent value="bulk-update" className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Make multiple changes and apply them all at once. Changes are saved when you click "Apply Updates".
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {menuItems.map((item) => {
              const pendingUpdate = pendingUpdates.get(item.item_id);
              const displayQuantity = pendingUpdate?.quantity !== undefined ? pendingUpdate.quantity : item.available_quantity;
              const displayAvailability = pendingUpdate?.is_available !== undefined ? pendingUpdate.is_available : item.is_available;
              
              return (
                <Card key={item.item_id} className={`p-4 ${pendingUpdate ? 'border-blue-500 bg-blue-50' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Label htmlFor={`bulk-quantity-${item.item_id}`} className="text-sm">Qty:</Label>
                        <Input
                          id={`bulk-quantity-${item.item_id}`}
                          type="number"
                          value={displayQuantity}
                          onChange={(e) => addToPendingUpdates(item.item_id, { quantity: parseInt(e.target.value) || 0 })}
                          className="w-20 text-center"
                          min="0"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Label htmlFor={`bulk-available-${item.item_id}`} className="text-sm">Available:</Label>
                        <Switch
                          id={`bulk-available-${item.item_id}`}
                          checked={displayAvailability}
                          onCheckedChange={(checked) => addToPendingUpdates(item.item_id, { is_available: checked })}
                        />
                      </div>
                      
                      {pendingUpdate && (
                        <Badge variant="outline" className="text-blue-600 bg-blue-100">
                          Modified
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}