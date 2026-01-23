import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Minus, ShoppingCart, Star, Search, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { canteensAPI, MenuItem, Canteen } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useMenuSocket } from "@/hooks/useSocket";
import { CANTEEN_MENU_DATA } from "@/data/menuData";

export default function Menu() {
  const { canteenId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const { addToCart, getCartItemCount, isOfflineMode } = useCart();
  
  const [canteen, setCanteen] = useState<Canteen | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isVegOnly, setIsVegOnly] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  // Initialize socket for real-time updates
  const { isConnected, lastUpdate } = useMenuSocket(parseInt(canteenId || '0'));
  
  // Listen for menu data updates
  useEffect(() => {
    const handleMenuDataUpdate = () => {
      console.log('🔄 Menu data updated, refreshing component...');
      if (canteenId) {
        // Force reload menu data
        const storedMenuData = localStorage.getItem(`canteen_${canteenId}_menu`);
        if (storedMenuData) {
          try {
            const menuItems = JSON.parse(storedMenuData);
            const studentMenuItems = menuItems.map((item: any) => ({
              ...item,
              vegetarian: item.is_veg !== undefined ? item.is_veg : item.vegetarian,
              rating: item.rating || 4.5,
              total_ratings: item.total_ratings || 50
            }));
            
            setMenuItems(studentMenuItems);
            setFilteredItems(studentMenuItems);
            
            const uniqueCategories = [...new Set(studentMenuItems.map(item => item.category))];
            setCategories(uniqueCategories);
            
            toast({
              title: "Menu Updated",
              description: `Loaded ${studentMenuItems.length} items`,
              variant: "default",
            });
          } catch (error) {
            console.error('Error parsing updated menu data:', error);
          }
        }
      }
    };
    
    window.addEventListener('menuDataUpdated', handleMenuDataUpdate);
    return () => window.removeEventListener('menuDataUpdated', handleMenuDataUpdate);
  }, [canteenId, toast]);

  // Listen for localStorage changes to sync with admin updates
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'mockMenuItems' && e.newValue) {
        console.log('Admin menu updated, refreshing student view...');
        try {
          const adminMenuItems = JSON.parse(e.newValue);
          // Convert admin menu format to student menu format
          const studentMenuItems = adminMenuItems.map((item: any) => ({
            item_id: item.item_id,
            name: item.name,
            description: item.description,
            price: item.price,
            category: item.category,
            vegetarian: item.is_veg,
            is_available: item.is_available,
            available_quantity: item.available_quantity,
            rating: 4.5,
            total_ratings: 50,
            image_url: item.image_url || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300&h=200&fit=crop'
          }));
          
          setMenuItems(studentMenuItems);
          setFilteredItems(studentMenuItems);
          
          const uniqueCategories = [...new Set(studentMenuItems.map(item => item.category))];
          setCategories(uniqueCategories);
          
          toast({
            title: "Menu Updated",
            description: "Menu has been updated with latest changes",
            variant: "default",
          });
        } catch (error) {
          console.error('Error parsing updated admin menu data:', error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [toast]);

  // Reload menu data when socket updates are received
  useEffect(() => {
    if (lastUpdate && canteenId) {
      console.log('🔄 Reloading menu data due to real-time update');
      // Trigger a data refresh from localStorage since that's our current data source
      const handleStorageRefresh = () => {
        const storedMenuData = localStorage.getItem(`canteen_${canteenId}_menu`);
        if (storedMenuData) {
          try {
            const menuItems = JSON.parse(storedMenuData);
            const studentMenuItems = menuItems.map((item: any) => ({
              ...item,
              vegetarian: item.is_veg !== undefined ? item.is_veg : item.vegetarian,
              rating: item.rating || 4.5,
              total_ratings: item.total_ratings || 50
            }));
            
            setMenuItems(studentMenuItems);
            setFilteredItems(studentMenuItems);
            
            const uniqueCategories = [...new Set(studentMenuItems.map(item => item.category))];
            setCategories(uniqueCategories);
          } catch (error) {
            console.error('Error parsing stored menu data on socket update:', error);
          }
        }
      };
      
      handleStorageRefresh();
    }
  }, [lastUpdate, canteenId]);

  useEffect(() => {
    const fetchCanteenData = async () => {
      if (!canteenId) return;
      
      try {
        setIsLoading(true);
        
        // Try to get data from API first
        const canteenResponse = await canteensAPI.getCanteen(parseInt(canteenId));
        setCanteen(canteenResponse.canteen);
        
        const menuResponse = await canteensAPI.getCanteenMenu(parseInt(canteenId));
        setMenuItems(menuResponse.menu_items);
        setFilteredItems(menuResponse.menu_items);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(menuResponse.menu_items.map(item => item.category))];
        setCategories(uniqueCategories);
        
      } catch (error: any) {
        console.log('API failed, loading from localStorage...');
        
        // Check for stored canteen-specific menu data first
        const storedMenuData = localStorage.getItem(`canteen_${canteenId}_menu`);
        if (storedMenuData) {
          try {
            const menuItems = JSON.parse(storedMenuData);
            const studentMenuItems = menuItems.map((item: any) => ({
              ...item,
              vegetarian: item.is_veg !== undefined ? item.is_veg : item.vegetarian,
              rating: item.rating || 4.5,
              total_ratings: item.total_ratings || 50
            }));
            
            setMenuItems(studentMenuItems);
            setFilteredItems(studentMenuItems);
            
            const uniqueCategories = [...new Set(studentMenuItems.map(item => item.category))];
            setCategories(uniqueCategories);
            
            // Set canteen info
            const canteenNames = {
              '1': 'Main Canteen',
              '2': 'IT Canteen',
              '3': 'MBA Canteen'
            };
            
            setCanteen({
              canteen_id: parseInt(canteenId),
              name: canteenNames[canteenId] || `Canteen ${canteenId}`,
              description: "Great food, great taste!",
              location: "Campus Location",
              contact: "080-12345678",
              opening_hours: {},
              created_at: new Date().toISOString(),
            });
            
            toast({
              title: "Menu Loaded",
              description: `Loaded ${studentMenuItems.length} items from ${canteenNames[canteenId]}`,
            });
            
            setIsLoading(false);
            return;
          } catch (parseError) {
            console.error('Error parsing stored menu data:', parseError);
          }
        }
        
        // Use the 50-item menu data from menuData.ts
         try {
           // Get menu data for the current canteen directly from our 50-item data source
           const canteenItems = await getMenuItems(parseInt(canteenId || '1'));
           
           // If we have items, use them
           if (canteenItems && canteenItems.length > 0) {
             
             const studentMenuItems = canteenItems.map((item: any) => ({
               ...item,
               vegetarian: item.is_veg !== undefined ? item.is_veg : item.vegetarian,
               rating: item.rating || 4.5,
               total_ratings: item.total_ratings || 50
             }));
             
             setMenuItems(studentMenuItems);
             setFilteredItems(studentMenuItems);
             
             const uniqueCategories = [...new Set(studentMenuItems.map(item => item.category))];
             setCategories(uniqueCategories);
             
             // Set canteen info
             const canteenNames = {
               '1': 'Main Canteen',
               '2': 'IT Canteen', 
               '3': 'MBA Canteen'
             };
             
             setCanteen({
               canteen_id: parseInt(canteenId),
               name: canteenNames[canteenId] || `Canteen ${canteenId}`,
               description: "Great food, great taste!",
               location: "Campus Location",
               contact: "080-12345678",
               opening_hours: {},
               created_at: new Date().toISOString(),
             });
             
             toast({
               title: "Menu Loaded",
               description: `Showing all ${studentMenuItems.length} items`,
             });
           }
           setIsLoading(false);
         } catch (error) {
           console.error('Error loading menu data:', error);
           setIsLoading(false);
         }
        
        // If no data found anywhere, show error
        toast({
          title: "No Menu Data Found",
          description: "Please use the recovery tool to restore menu data",
          variant: "destructive",
        });
        
        // Set basic canteen info
        const canteenNames = {
          '1': 'Main Canteen',
          '2': 'IT Canteen', 
          '3': 'MBA Canteen'
        };
        
        setCanteen({
          canteen_id: parseInt(canteenId),
          name: canteenNames[canteenId] || `Canteen ${canteenId}`,
          description: "Please restore menu data using the recovery tool",
          location: "Campus Location",
          contact: "080-12345678",
          opening_hours: {},
          created_at: new Date().toISOString(),
        });
        
        // Empty menu items - user should use recovery tool
        setMenuItems([]);
        setFilteredItems([]);
        setCategories([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCanteenData();
  }, [canteenId, toast]);

  // Filter menu items based on search query, category, and veg filter
  useEffect(() => {
    let filtered = menuItems;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Apply vegetarian filter
    if (isVegOnly) {
      filtered = filtered.filter(item => item.vegetarian);
    }

    setFilteredItems(filtered);
  }, [menuItems, searchQuery, selectedCategory, isVegOnly]);

  const handleAddToCart = async (itemId: number) => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to add items to your cart",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    try {
      await addToCart(itemId);
      
      // Find the item name for the success message
      const item = menuItems.find(item => item.item_id === itemId);
      toast({
        title: "Added to Cart",
        description: `${item?.name || 'Item'} has been added to your cart`,
        variant: "default",
      });
    } catch (error: any) {
      console.error('Add to cart error:', error);
      toast({
        title: "Failed to Add Item",
        description: error.message || "Could not add item to cart. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!canteenId) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold">Invalid canteen</h1>
        <Button onClick={() => navigate("/dashboard")} className="mt-4">
          Back to Dashboard
        </Button>
      </div>
    );
  }

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
          <span>Back to Canteens</span>
        </Button>
      </div>

      {isLoading ? (
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96 mb-8" />
        </div>
      ) : (
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {canteen?.name}
              </h1>
              <p className="text-muted-foreground">
                {canteen?.description || "Browse our menu and add items to your cart"}
              </p>
            </div>
            {/* Real-time connection indicator */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <Badge variant={isConnected ? "secondary" : "outline"} className="text-xs">
                {isConnected ? '🟢 Live Updates' : '⚫ Offline'}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {!isLoading && (
        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Veg Filter */}
          <Button
            variant={isVegOnly ? "default" : "outline"}
            onClick={() => setIsVegOnly(!isVegOnly)}
            className="justify-start"
          >
            <span className={`w-3 h-3 rounded-full mr-2 ${isVegOnly ? 'bg-green-500' : 'bg-green-200'}`} />
            Veg Only
          </Button>

          {/* Results Count */}
          <div className="flex items-center text-sm text-muted-foreground">
            {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} found
          </div>
        </div>
      )}

      {/* Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))
        ) : filteredItems.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground">No menu items found matching your criteria.</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <Card key={item.item_id} className="overflow-hidden hover:shadow-medium transition-all duration-300">
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={item.image_url || "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-4.0.3&w=300&h=200&fit=crop&q=80"}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <Badge variant={item.vegetarian ? "secondary" : "destructive"}>
                    {item.vegetarian ? "Veg" : "Non-Veg"}
                  </Badge>
                </div>
                <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center space-x-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{item.rating}</span>
                </div>
                {!item.is_available && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Badge variant="destructive">Out of Stock</Badge>
                  </div>
                )}
              </div>

              {/* Content */}
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">{item.name}</span>
                  <span className="text-primary font-bold">₹{item.price}</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground">{item.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <Badge variant="outline">{item.category}</Badge>
                  <div className="flex items-center space-x-2">
                    {!item.is_available || item.available_quantity === 0 ? (
                      <Badge variant="destructive" className="text-xs">
                        Not Available
                      </Badge>
                    ) : item.available_quantity <= 5 ? (
                      <Badge className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300">
                        Low Stock ({item.available_quantity})
                      </Badge>
                    ) : item.available_quantity <= 10 ? (
                      <Badge className="text-xs bg-blue-100 text-blue-800 border-blue-300">
                        {item.available_quantity} left
                      </Badge>
                    ) : (
                      <Badge className="text-xs bg-green-100 text-green-800 border-green-300">
                        {item.available_quantity} available
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {/* Add to Cart Controls */}
                <Button 
                  onClick={() => handleAddToCart(item.item_id)}
                  className="w-full bg-gradient-secondary hover:opacity-90"
                  disabled={!item.is_available || item.available_quantity === 0}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {item.is_available ? "Add to Cart" : "Out of Stock"}
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Floating Cart Button */}
      {isAuthenticated && getCartItemCount() > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <Button
            onClick={() => navigate("/cart")}
            className="bg-gradient-accent hover:opacity-90 shadow-strong px-8 py-3 rounded-full"
            size="lg"
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            View Cart ({getCartItemCount()})
          </Button>
        </div>
      )}
    </div>
  );
}