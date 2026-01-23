import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Edit, 
  Package, 
  Minus,
  AlertTriangle,
  Leaf,
  Clock,
  IndianRupee,
  Filter,
  Search,
  RotateCcw,
  Check,
  X,
  Wifi,
  WifiOff,
  Activity,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff
} from 'lucide-react';
import { AdminMenuItem, adminMenuAPI, AddMenuItemRequest, UpdateMenuItemRequest } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useMenuSocket } from '@/hooks/useSocket';
import { getCanteenMenuItems, initializeCanteenData } from '@/data/menuData';

interface MenuItemWithUpdates extends AdminMenuItem {
  isUpdating?: boolean;
  lastUpdated?: Date;
}

interface CanteenInfo {
  canteen_id: number;
  name: string;
  location: string;
}

interface Props {
  canteen?: CanteenInfo;
}

export default function EnhancedMenuManagement({ canteen }: Props) {
  const { toast } = useToast();
  const [menuItems, setMenuItems] = useState<MenuItemWithUpdates[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [activeTab, setActiveTab] = useState('veg');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminMenuItem | null>(null);
  const [isQuantityModalOpen, setIsQuantityModalOpen] = useState(false);
  const [quantityUpdateItem, setQuantityUpdateItem] = useState<AdminMenuItem | null>(null);
  const [quantityChange, setQuantityChange] = useState<number>(0);

  // Form data
  const [formData, setFormData] = useState<AddMenuItemRequest>({
    name: '',
    description: '',
    price: 0,
    category: '',
    is_veg: true,
    available_quantity: 10,
    preparation_time: 15,
    image_url: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Socket.IO integration for real-time updates
  const { 
    isConnected, 
    connectionError, 
    menuUpdates, 
    lowStockAlerts, 
    lastUpdate,
    clearUpdates,
    clearAlerts 
  } = useMenuSocket(canteen?.canteen_id || 1);

  // Get unique categories
  const categories = Array.from(new Set(menuItems.map(item => item.category)));
  const allCategories = ['all', ...categories];

  useEffect(() => {
    fetchMenuItems();
  }, []);

  // Handle real-time menu updates
  useEffect(() => {
    if (lastUpdate) {
      // Refresh menu items when updates are received
      fetchMenuItems();
    }
  }, [lastUpdate]);

  // Handle Socket.IO menu updates
  useEffect(() => {
    menuUpdates.forEach(update => {
      setMenuItems(prevItems => 
        prevItems.map(item => 
          item.item_id === update.itemId 
            ? { 
                ...item, 
                available_quantity: update.availableQuantity,
                is_available: update.isAvailable,
                lastUpdated: new Date()
              }
            : item
        )
      );
    });
  }, [menuUpdates]);

  const fetchMenuItems = async () => {
    setIsLoading(true);
    try {
      const data = await adminMenuAPI.getMenu();
      setMenuItems(data.menu_items.map(item => ({ ...item, lastUpdated: new Date() })));
      setError(null);
    } catch (error: any) {
      console.log('Menu API failed, using unified fallback data');
      
      // Use unified menu data as fallback
      const canteenId = canteen?.canteen_id || 1;
      const fallbackData = getCanteenMenuItems(canteenId);
      
      if (fallbackData.length > 0) {
        // Initialize localStorage with unified data
        initializeCanteenData(canteenId);
        
        // Convert unified menu items to admin menu format
        const adminMenuItems = fallbackData.map(item => ({
          ...item,
          lastUpdated: new Date()
        }));
        
        setMenuItems(adminMenuItems);
        setError(`Using offline menu data (${fallbackData.length} items)`);
      } else {
        setError('Failed to load menu items. Please check your connection.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Separate items by type
  const vegItems = menuItems.filter(item => item.is_veg);
  const nonVegItems = menuItems.filter(item => !item.is_veg);

  // Filter items based on current tab
  const getFilteredItems = (items: MenuItemWithUpdates[]) => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesAvailability = !showAvailableOnly || (item.is_available && item.available_quantity > 0);
      
      return matchesSearch && matchesCategory && matchesAvailability;
    });
  };

  const handleQuantityUpdate = async (itemId: number, change: number) => {
    try {
      // Optimistically update the UI
      setMenuItems(prev => 
        prev.map(item => 
          item.item_id === itemId 
            ? { 
                ...item, 
                isUpdating: true,
                available_quantity: Math.max(0, item.available_quantity + change) 
              }
            : item
        )
      );

      await adminMenuAPI.updateQuantity(itemId, change);
      
      toast({
        title: "Quantity Updated",
        description: `Stock ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change)}`,
      });

      // The socket will handle the real-time update, so we don't need to fetch again
    } catch (error: any) {
      // Revert optimistic update on error
      setMenuItems(prev => 
        prev.map(item => 
          item.item_id === itemId 
            ? { ...item, isUpdating: false }
            : item
        )
      );
      
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update quantity",
        variant: "destructive"
      });
    } finally {
      // Remove updating state after a delay
      setTimeout(() => {
        setMenuItems(prev => 
          prev.map(item => 
            item.item_id === itemId 
              ? { ...item, isUpdating: false }
              : item
          )
        );
      }, 1000);
    }
  };

  const handleAvailabilityToggle = async (itemId: number, currentAvailability: boolean) => {
    try {
      const updateData: UpdateMenuItemRequest = {
        is_available: !currentAvailability
      };
      
      await adminMenuAPI.updateMenuItem(itemId, updateData);
      
      toast({
        title: "Availability Updated",
        description: `Item is now ${!currentAvailability ? 'available' : 'unavailable'}`,
      });
      
    } catch (error: any) {
      toast({
        title: "Update Failed", 
        description: error.message || "Failed to update availability",
        variant: "destructive"
      });
    }
  };

  const handleAddMenuItem = async () => {
    try {
      await adminMenuAPI.addMenuItem(formData);
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        description: '',
        price: 0,
        category: '',
        is_veg: true,
        available_quantity: 10,
        preparation_time: 15,
        image_url: ''
      });
      
      toast({
        title: "Item Added",
        description: `${formData.name} has been added to the menu`,
      });
      
    } catch (error: any) {
      toast({
        title: "Add Failed",
        description: error.message || "Failed to add menu item",
        variant: "destructive"
      });
    }
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: 'Out of Stock', color: 'destructive' };
    if (quantity <= 5) return { label: 'Low Stock', color: 'warning' };
    if (quantity <= 10) return { label: 'Medium Stock', color: 'default' };
    return { label: 'Good Stock', color: 'success' };
  };

  const renderItemCard = (item: MenuItemWithUpdates) => {
    const stockStatus = getStockStatus(item.available_quantity);
    
    return (
      <Card key={item.item_id} className={`relative transition-all duration-200 ${item.isUpdating ? 'ring-2 ring-blue-500' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                {item.name}
                {item.is_veg && <Leaf className="w-4 h-4 text-green-600" />}
                {item.lastUpdated && (
                  <Badge variant="outline" className="text-xs">
                    Updated {item.lastUpdated.toLocaleTimeString()}
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
            </div>
            <Badge variant={stockStatus.color as any} className="ml-2">
              {stockStatus.label}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-green-600" />
              <span className="font-semibold">₹{item.price}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>{item.preparation_time} min</span>
            </div>
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-orange-600" />
              <span className={item.available_quantity <= 5 ? 'text-red-600 font-semibold' : ''}>
                {item.available_quantity} left
              </span>
            </div>
            <div className="flex items-center gap-2">
              {item.is_available ? (
                <Eye className="w-4 h-4 text-green-600" />
              ) : (
                <EyeOff className="w-4 h-4 text-gray-400" />
              )}
              <span>{item.is_available ? 'Available' : 'Hidden'}</span>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <div className="flex gap-1">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleQuantityUpdate(item.item_id, -1)}
                disabled={item.available_quantity === 0 || item.isUpdating}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleQuantityUpdate(item.item_id, 1)}
                disabled={item.isUpdating}
              >
                <Plus className="w-3 h-3" />
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  setQuantityUpdateItem(item);
                  setIsQuantityModalOpen(true);
                }}
                disabled={item.isUpdating}
              >
                <Package className="w-3 h-3 mr-1" />
                Set Qty
              </Button>
            </div>
            
            <Button
              size="sm"
              variant={item.is_available ? "destructive" : "default"}
              onClick={() => handleAvailabilityToggle(item.item_id, item.is_available)}
            >
              {item.is_available ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
              {item.is_available ? 'Hide' : 'Show'}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditingItem(item);
                setIsEditModalOpen(true);
              }}
            >
              <Edit className="w-3 h-3 mr-1" />
              Edit
            </Button>
          </div>

          {item.isUpdating && (
            <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
              <Activity className="w-3 h-3 animate-pulse" />
              Updating...
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const ConnectionStatus = () => (
    <div className="flex items-center gap-2 mb-4">
      {isConnected ? (
        <>
          <Wifi className="w-4 h-4 text-green-600" />
          <span className="text-sm text-green-600">Real-time updates active</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 text-red-600" />
          <span className="text-sm text-red-600">
            {connectionError ? `Connection error: ${connectionError}` : 'Connecting...'}
          </span>
        </>
      )}
    </div>
  );

  const LowStockAlerts = () => {
    if (lowStockAlerts.length === 0) return null;
    
    return (
      <Alert className="mb-4 border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription>
          <div className="font-medium text-orange-800 mb-2">Low Stock Alerts</div>
          <div className="space-y-1">
            {lowStockAlerts.map(alert => (
              <div key={alert.itemId} className="text-sm text-orange-700">
                {alert.itemName}: Only {alert.availableQuantity} left
              </div>
            ))}
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            className="mt-2" 
            onClick={clearAlerts}
          >
            Clear Alerts
          </Button>
        </AlertDescription>
      </Alert>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Activity className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading menu items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Menu Management</h1>
          {canteen && (
            <p className="text-muted-foreground">{canteen.name} - {canteen.location}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchMenuItems} variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      <ConnectionStatus />
      <LowStockAlerts />

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search">Search Items</Label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="min-w-[150px]">
              <Label htmlFor="category">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  {allCategories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="available-only"
                checked={showAvailableOnly}
                onCheckedChange={setShowAvailableOnly}
              />
              <Label htmlFor="available-only">Available Only</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Menu Items Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="veg" className="flex items-center gap-2">
            <Leaf className="w-4 h-4" />
            Veg Items ({getFilteredItems(vegItems).length})
          </TabsTrigger>
          <TabsTrigger value="non-veg">
            Non-Veg Items ({getFilteredItems(nonVegItems).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="veg">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getFilteredItems(vegItems).map(renderItemCard)}
          </div>
          {getFilteredItems(vegItems).length === 0 && (
            <div className="text-center py-8">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No vegetarian items found matching your filters.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="non-veg">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getFilteredItems(nonVegItems).map(renderItemCard)}
          </div>
          {getFilteredItems(nonVegItems).length === 0 && (
            <div className="text-center py-8">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No non-vegetarian items found matching your filters.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Quantity Update Modal */}
      <Dialog open={isQuantityModalOpen} onOpenChange={setIsQuantityModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Quantity</DialogTitle>
            <DialogDescription>
              Set new quantity for {quantityUpdateItem?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="quantity-change">Change Quantity By</Label>
              <Input
                id="quantity-change"
                type="number"
                value={quantityChange}
                onChange={(e) => setQuantityChange(parseInt(e.target.value) || 0)}
                placeholder="Enter positive or negative number"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Current: {quantityUpdateItem?.available_quantity} → New: {Math.max(0, (quantityUpdateItem?.available_quantity || 0) + quantityChange)}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsQuantityModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (quantityUpdateItem) {
                  handleQuantityUpdate(quantityUpdateItem.item_id, quantityChange);
                  setIsQuantityModalOpen(false);
                  setQuantityChange(0);
                }
              }}
            >
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Item Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Menu Item</DialogTitle>
            <DialogDescription>
              Add a new item to your canteen menu
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Item Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter item name"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                name="category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="e.g., Main Course, Beverages"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter item description"
              />
            </div>
            <div>
              <Label htmlFor="price">Price (₹)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                placeholder="Enter price"
              />
            </div>
            <div>
              <Label htmlFor="available_quantity">Initial Quantity</Label>
              <Input
                id="available_quantity"
                name="available_quantity"
                type="number"
                value={formData.available_quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, available_quantity: parseInt(e.target.value) || 0 }))}
                placeholder="Enter quantity"
              />
            </div>
            <div>
              <Label htmlFor="preparation_time">Prep Time (minutes)</Label>
              <Input
                id="preparation_time"
                name="preparation_time"
                type="number"
                value={formData.preparation_time}
                onChange={(e) => setFormData(prev => ({ ...prev, preparation_time: parseInt(e.target.value) || 0 }))}
                placeholder="Enter prep time"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_veg"
                checked={formData.is_veg}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_veg: checked }))}
              />
              <Label htmlFor="is_veg">Vegetarian Item</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMenuItem}>
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}