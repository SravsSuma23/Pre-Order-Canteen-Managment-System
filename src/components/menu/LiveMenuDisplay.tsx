import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Leaf,
  Clock,
  IndianRupee,
  Wifi,
  WifiOff,
  Activity,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Zap,
  Package,
  ChefHat,
  Heart,
  Star
} from 'lucide-react';
import { MenuItem, canteensAPI } from '@/services/api';
import { useSocket } from '@/hooks/useSocket';
import { useToast } from '@/hooks/use-toast';

interface CanteenInfo {
  canteen_id: number;
  name: string;
  location: string;
  description: string;
}

interface LiveMenuItem extends MenuItem {
  lastUpdated?: Date;
  isJustUpdated?: boolean;
}

interface Props {
  canteen: CanteenInfo;
}

export default function LiveMenuDisplay({ canteen }: Props) {
  const { toast } = useToast();
  const [menuItems, setMenuItems] = useState<LiveMenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('veg');
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  // Socket.IO for real-time updates
  const { isConnected, connectionError } = useSocket(canteen.canteen_id, {
    onMenuItemUpdate: (data) => {
      setMenuItems(prevItems => 
        prevItems.map(item => 
          item.item_id === data.itemId
            ? {
                ...item,
                available_quantity: data.availableQuantity,
                is_available: data.isAvailable,
                lastUpdated: new Date(),
                isJustUpdated: true
              }
            : item
        )
      );
      
      setLastUpdateTime(new Date());
      
      // Clear the "just updated" flag after 3 seconds
      setTimeout(() => {
        setMenuItems(prevItems => 
          prevItems.map(item => 
            item.item_id === data.itemId
              ? { ...item, isJustUpdated: false }
              : item
          )
        );
      }, 3000);
    },
    
    onMenuItemAvailability: (data) => {
      toast({
        title: data.isAvailable ? "Item Available" : "Item Unavailable",
        description: `${data.itemName} is now ${data.isAvailable ? 'available' : 'unavailable'}`,
        duration: 3000,
      });
    },
    
    onMenuItemAdded: (data) => {
      toast({
        title: "New Item Added!",
        description: `${data.menuItem.name} has been added to the menu`,
        duration: 5000,
      });
      fetchMenu(); // Refresh to get the new item
    }
  });

  useEffect(() => {
    fetchMenu();
  }, [canteen.canteen_id]);

  const fetchMenu = async () => {
    setIsLoading(true);
    try {
      const data = await canteensAPI.getCanteenMenu(canteen.canteen_id, {
        available_only: false // Show all items, including unavailable ones
      });
      
      setMenuItems(data.menu_items.map(item => ({ 
        ...item, 
        lastUpdated: new Date(),
        isJustUpdated: false 
      })));
      setError(null);
    } catch (error: any) {
      console.error('Failed to fetch menu:', error);
      setError('Unable to load menu. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Separate items by type
  const vegItems = menuItems.filter(item => item.is_veg);
  const nonVegItems = menuItems.filter(item => !item.is_veg);
  
  // Count available items
  const availableVegCount = vegItems.filter(item => item.is_available && item.available_quantity > 0).length;
  const availableNonVegCount = nonVegItems.filter(item => item.is_available && item.available_quantity > 0).length;

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: 'Out of Stock', color: 'destructive', icon: XCircle };
    if (quantity <= 5) return { label: 'Low Stock', color: 'warning', icon: AlertCircle };
    return { label: 'In Stock', color: 'success', icon: CheckCircle2 };
  };

  const renderMenuItem = (item: LiveMenuItem) => {
    const stockStatus = getStockStatus(item.available_quantity);
    const StatusIcon = stockStatus.icon;
    
    return (
      <Card 
        key={item.item_id} 
        className={`relative transition-all duration-300 hover:shadow-md ${
          item.isJustUpdated ? 'ring-2 ring-blue-500 bg-blue-50' : ''
        } ${!item.is_available ? 'opacity-60' : ''}`}
      >
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2 mb-1">
                {item.name}
                {item.is_veg && <Leaf className="w-4 h-4 text-green-600" />}
                {item.isJustUpdated && (
                  <Badge variant="default" className="bg-blue-500 text-xs animate-pulse">
                    <Zap className="w-3 h-3 mr-1" />
                    Updated
                  </Badge>
                )}
              </CardTitle>
              {item.description && (
                <p className="text-sm text-muted-foreground">{item.description}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge 
                variant={stockStatus.color as any}
                className="flex items-center gap-1"
              >
                <StatusIcon className="w-3 h-3" />
                {stockStatus.label}
              </Badge>
              {item.rating > 0 && (
                <div className="flex items-center gap-1 text-xs text-yellow-600">
                  <Star className="w-3 h-3 fill-current" />
                  {item.rating.toFixed(1)}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-green-600" />
              <span className="font-bold text-lg">₹{item.price}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm">{item.preparation_time || 15} min</span>
            </div>
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-orange-600" />
              <span 
                className={`text-sm font-medium ${
                  item.available_quantity <= 5 ? 'text-red-600' : 'text-gray-700'
                }`}
              >
                {item.available_quantity} left
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ChefHat className="w-4 h-4 text-purple-600" />
              <span className="text-sm capitalize">{item.category}</span>
            </div>
          </div>

          {/* Availability Status */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {item.lastUpdated && (
                <>Updated {item.lastUpdated.toLocaleTimeString()}</>
              )}
            </div>
            
            {item.is_available && item.available_quantity > 0 ? (
              <Badge variant="success" className="bg-green-100 text-green-800">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Available
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                <XCircle className="w-3 h-3 mr-1" />
                Unavailable
              </Badge>
            )}
          </div>

          {/* Low stock warning */}
          {item.is_available && item.available_quantity > 0 && item.available_quantity <= 5 && (
            <Alert className="mt-3 border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800 text-xs">
                Only {item.available_quantity} left - Order quickly!
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  };

  const ConnectionStatus = () => (
    <Alert className={`mb-4 ${isConnected ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
      <div className="flex items-center gap-2">
        {isConnected ? (
          <>
            <Wifi className="w-4 h-4 text-green-600" />
            <span className="text-green-800 font-medium">Live updates active</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4 text-red-600" />
            <span className="text-red-800 font-medium">
              {connectionError ? `Connection error: ${connectionError}` : 'Connecting...'}
            </span>
          </>
        )}
      </div>
      {lastUpdateTime && (
        <div className="text-xs text-muted-foreground mt-1">
          Last updated: {lastUpdateTime.toLocaleString()}
        </div>
      )}
    </Alert>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Activity className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-2" 
            onClick={fetchMenu}
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-2">{canteen.name}</h1>
        <p className="text-muted-foreground mb-1">{canteen.location}</p>
        <p className="text-sm text-muted-foreground">{canteen.description}</p>
        <div className="flex items-center justify-center gap-4 mt-3">
          <Badge variant="outline" className="flex items-center gap-1">
            <Leaf className="w-3 h-3 text-green-600" />
            {availableVegCount} Veg Available
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Heart className="w-3 h-3 text-red-600" />
            {availableNonVegCount} Non-Veg Available
          </Badge>
        </div>
      </div>

      <ConnectionStatus />

      {/* Menu Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="veg" className="flex items-center gap-2">
            <Leaf className="w-4 h-4" />
            Vegetarian ({vegItems.length})
          </TabsTrigger>
          <TabsTrigger value="non-veg" className="flex items-center gap-2">
            <ChefHat className="w-4 h-4" />
            Non-Vegetarian ({nonVegItems.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="veg" className="space-y-4">
          <div className="text-center mb-4">
            <h2 className="text-xl font-semibold text-green-700 mb-2">🥬 Vegetarian Items</h2>
            <p className="text-sm text-muted-foreground">
              Fresh and healthy vegetarian options
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vegItems.map(renderMenuItem)}
          </div>
          
          {vegItems.length === 0 && (
            <div className="text-center py-8">
              <Leaf className="w-12 h-12 mx-auto text-green-400 mb-4" />
              <p className="text-muted-foreground">No vegetarian items available at the moment.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="non-veg" className="space-y-4">
          <div className="text-center mb-4">
            <h2 className="text-xl font-semibold text-orange-700 mb-2">🍗 Non-Vegetarian Items</h2>
            <p className="text-sm text-muted-foreground">
              Delicious non-vegetarian specialties
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nonVegItems.map(renderMenuItem)}
          </div>
          
          {nonVegItems.length === 0 && (
            <div className="text-center py-8">
              <ChefHat className="w-12 h-12 mx-auto text-orange-400 mb-4" />
              <p className="text-muted-foreground">No non-vegetarian items available at the moment.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="text-center mt-8 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          Menu updates in real-time • Quantities and availability are live
        </p>
        <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-green-600" />
            Available
          </div>
          <div className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-orange-600" />
            Low Stock
          </div>
          <div className="flex items-center gap-1">
            <XCircle className="w-3 h-3 text-red-600" />
            Out of Stock
          </div>
        </div>
      </div>
    </div>
  );
}