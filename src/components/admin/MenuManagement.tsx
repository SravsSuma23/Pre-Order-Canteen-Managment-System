import React, { useState, useEffect } from 'react';
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
  X
} from 'lucide-react';
import { AdminMenuItem, adminMenuAPI, AddMenuItemRequest, UpdateMenuItemRequest } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { getCanteenMenuItems, UnifiedMenuItem } from '@/data/menuData';

export default function MenuManagement() {
  const { toast } = useToast();
  const { admin } = useAdminAuth();
  const [menuItems, setMenuItems] = useState<AdminMenuItem[]>([]);
  
  // Helper function to convert UnifiedMenuItem to AdminMenuItem
  const convertToAdminMenuItem = (item: UnifiedMenuItem): AdminMenuItem => {
    return {
      item_id: item.item_id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      is_veg: item.is_veg,
      is_available: item.is_available,
      available_quantity: item.available_quantity,
      preparation_time: item.prep_time,
      image_url: item.image_url || '',
      created_at: item.created_at,
      updated_at: item.updated_at
    };
  };
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminMenuItem | null>(null);

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

  // Get unique categories
  const categories = Array.from(new Set(menuItems.map(item => item.category)));
  const allCategories = ['all', ...categories];

  useEffect(() => {
    fetchMenuItems();
  }, []);
  
  // Listen for menu data updates
  useEffect(() => {
    const handleMenuDataUpdate = () => {
      console.log('🔄 Menu management: menu data updated, refreshing...');
      fetchMenuItems(); // Refresh the admin menu items
    };
    
    window.addEventListener('menuDataUpdated', handleMenuDataUpdate);
    return () => window.removeEventListener('menuDataUpdated', handleMenuDataUpdate);
  }, []);

  const fetchMenuItems = async () => {
    setIsLoading(true);
    try {
      // First try to get data from API
      const data = await adminMenuAPI.getMenu();
      setMenuItems(data.menu_items);
      setError(null);
      console.log('✅ Loaded menu data from API');
    } catch (error: any) {
      console.log('📱 Menu API failed, using 50-item dataset for admin canteen');
      
      // Get the current admin's canteen ID
      const canteenId = admin?.canteen?.canteen_id || 1;
      console.log(`🏢 Loading 50-item data for canteen ${canteenId}: ${admin?.canteen?.name || 'Main Canteen'}`);
      
      // Load the 50-item dataset from localStorage for this specific canteen
      const storageKey = `canteen_${canteenId}_admin_menu`;
      const storedData = localStorage.getItem(storageKey);
      
      if (storedData) {
        try {
          const unifiedItems: UnifiedMenuItem[] = JSON.parse(storedData);
          const adminItems = unifiedItems.map(convertToAdminMenuItem);
          setMenuItems(adminItems);
          console.log(`✅ Loaded ${adminItems.length} items from localStorage for ${admin?.canteen?.name}`);
        } catch (parseError) {
          console.error('❌ Error parsing stored menu data:', parseError);
          // Fall back to getting fresh data from the 50-item dataset
          const unifiedItems = getCanteenMenuItems(canteenId);
          const adminItems = unifiedItems.map(convertToAdminMenuItem);
          setMenuItems(adminItems);
          
          // Save to localStorage
          localStorage.setItem(storageKey, JSON.stringify(unifiedItems));
          console.log(`✅ Loaded ${adminItems.length} fresh items from 50-item dataset`);
        }
      } else {
        // Get fresh data from the 50-item dataset
        const unifiedItems = getCanteenMenuItems(canteenId);
        const adminItems = unifiedItems.map(convertToAdminMenuItem);
        setMenuItems(adminItems);
        
        // Save to localStorage for future use
        localStorage.setItem(storageKey, JSON.stringify(unifiedItems));
        console.log(`✅ Initialized ${adminItems.length} items from 50-item dataset`);
      }
      
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter menu items
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesAvailability = !showAvailableOnly || (item.is_available && item.available_quantity > 0);
    
    return matchesSearch && matchesCategory && matchesAvailability;
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'available_quantity' || name === 'preparation_time' 
        ? parseFloat(value) || 0 
        : value
    }));

    // Clear field error
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const resetForm = () => {
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
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.category.trim()) {
      errors.category = 'Category is required';
    }

    if (formData.price <= 0) {
      errors.price = 'Price must be greater than 0';
    }

    if (formData.available_quantity < 0) {
      errors.available_quantity = 'Quantity cannot be negative';
    }

    if (formData.preparation_time <= 0) {
      errors.preparation_time = 'Preparation time must be greater than 0';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddItem = async () => {
    if (!validateForm()) return;

    try {
      const response = await adminMenuAPI.addMenuItem(formData);
      setMenuItems(prev => [...prev, response.menu_item]);
      setIsAddModalOpen(false);
      resetForm();
      
      toast({
        title: "Item Added",
        description: `${formData.name} has been added to the menu.`,
      });
    } catch (error: any) {
      console.log('Add item API failed, using offline mode');
      
      // Offline fallback
      const newItem: AdminMenuItem = {
        item_id: Date.now(), // Use timestamp as ID for offline mode
        name: formData.name,
        description: formData.description,
        price: formData.price,
        category: formData.category,
        is_veg: formData.is_veg,
        is_available: formData.available_quantity > 0,
        available_quantity: formData.available_quantity,
        preparation_time: formData.preparation_time,
        image_url: formData.image_url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const updatedItems = [...menuItems, newItem];
      setMenuItems(updatedItems);
      localStorage.setItem('mockMenuItems', JSON.stringify(updatedItems));
      
      setIsAddModalOpen(false);
      resetForm();
      
      toast({
        title: "Item Added (Offline)",
        description: `${formData.name} has been added to the menu.`,
      });
    }
  };

  const handleEditItem = async () => {
    if (!editingItem || !validateForm()) return;

    try {
      const updateData: UpdateMenuItemRequest = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        category: formData.category,
        is_veg: formData.is_veg,
        available_quantity: formData.available_quantity,
        preparation_time: formData.preparation_time,
        image_url: formData.image_url
      };

      const response = await adminMenuAPI.updateMenuItem(editingItem.item_id, updateData);
      setMenuItems(prev => 
        prev.map(item => item.item_id === editingItem.item_id ? response.menu_item : item)
      );
      setIsEditModalOpen(false);
      setEditingItem(null);
      resetForm();
      
      toast({
        title: "Item Updated",
        description: `${formData.name} has been updated.`,
      });
    } catch (error: any) {
      console.log('Update item API failed, using offline mode');
      
      // Offline fallback
      const updatedItem: AdminMenuItem = {
        ...editingItem,
        name: formData.name,
        description: formData.description,
        price: formData.price,
        category: formData.category,
        is_veg: formData.is_veg,
        is_available: formData.available_quantity > 0,
        available_quantity: formData.available_quantity,
        preparation_time: formData.preparation_time,
        image_url: formData.image_url,
        updated_at: new Date().toISOString()
      };
      
      const updatedItems = menuItems.map(item => 
        item.item_id === editingItem.item_id ? updatedItem : item
      );
      
      setMenuItems(updatedItems);
      localStorage.setItem('mockMenuItems', JSON.stringify(updatedItems));
      
      setIsEditModalOpen(false);
      setEditingItem(null);
      resetForm();
      
      toast({
        title: "Item Updated (Offline)",
        description: `${formData.name} has been updated.`,
      });
    }
  };

  const openEditModal = (item: AdminMenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price,
      category: item.category,
      is_veg: item.is_veg,
      available_quantity: item.available_quantity,
      preparation_time: item.preparation_time,
      image_url: item.image_url || ''
    });
    setIsEditModalOpen(true);
  };

  const handleQuantityUpdate = async (itemId: number, change: number) => {
    try {
      const response = await adminMenuAPI.updateQuantity(itemId, change);
      
      setMenuItems(prev => 
        prev.map(item => 
          item.item_id === itemId 
            ? { ...item, available_quantity: response.new_quantity, is_available: response.is_available }
            : item
        )
      );

      toast({
        title: "Quantity Updated",
        description: `Stock updated to ${response.new_quantity}`,
      });
    } catch (error: any) {
      console.log('Quantity update API failed, using offline mode');
      
      // Offline fallback
      const updatedItems = menuItems.map(item => {
        if (item.item_id === itemId) {
          const newQuantity = Math.max(0, item.available_quantity + change);
          return {
            ...item,
            available_quantity: newQuantity,
            is_available: newQuantity > 0,
            updated_at: new Date().toISOString()
          };
        }
        return item;
      });
      
      setMenuItems(updatedItems);
      localStorage.setItem('mockMenuItems', JSON.stringify(updatedItems));
      
      const updatedItem = updatedItems.find(item => item.item_id === itemId);
      toast({
        title: "Quantity Updated (Offline)",
        description: `Stock updated to ${updatedItem?.available_quantity || 0}`,
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
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
            onClick={fetchMenuItems}
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
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>

          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
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

          {/* Available Only Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="available-only"
              checked={showAvailableOnly}
              onCheckedChange={setShowAvailableOnly}
            />
            <Label htmlFor="available-only" className="text-sm">Available only</Label>
          </div>
        </div>

        {/* Add Button */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Menu Item</DialogTitle>
              <DialogDescription>
                Add a new item to your canteen menu
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Item name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={formErrors.name ? 'border-red-500' : ''}
                />
                {formErrors.name && <p className="text-sm text-red-500">{formErrors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  name="category"
                  placeholder="e.g., Beverages, Main Course"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={formErrors.category ? 'border-red-500' : ''}
                />
                {formErrors.category && <p className="text-sm text-red-500">{formErrors.category}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price (₹) *</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.price || ''}
                  onChange={handleInputChange}
                  className={formErrors.price ? 'border-red-500' : ''}
                />
                {formErrors.price && <p className="text-sm text-red-500">{formErrors.price}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="available_quantity">Initial Quantity</Label>
                <Input
                  id="available_quantity"
                  name="available_quantity"
                  type="number"
                  min="0"
                  placeholder="10"
                  value={formData.available_quantity || ''}
                  onChange={handleInputChange}
                  className={formErrors.available_quantity ? 'border-red-500' : ''}
                />
                {formErrors.available_quantity && <p className="text-sm text-red-500">{formErrors.available_quantity}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="preparation_time">Prep Time (min)</Label>
                <Input
                  id="preparation_time"
                  name="preparation_time"
                  type="number"
                  min="1"
                  placeholder="15"
                  value={formData.preparation_time || ''}
                  onChange={handleInputChange}
                  className={formErrors.preparation_time ? 'border-red-500' : ''}
                />
                {formErrors.preparation_time && <p className="text-sm text-red-500">{formErrors.preparation_time}</p>}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_veg"
                  checked={formData.is_veg}
                  onCheckedChange={(checked) => handleSwitchChange('is_veg', checked)}
                />
                <Label htmlFor="is_veg">Vegetarian</Label>
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe the item..."
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="image_url">Image URL (optional)</Label>
                <Input
                  id="image_url"
                  name="image_url"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={formData.image_url}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddItem}>
                Add Item
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{menuItems.length}</div>
            <div className="text-sm text-gray-600">Total Items</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {menuItems.filter(item => item.is_available).length}
            </div>
            <div className="text-sm text-gray-600">Available</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {menuItems.filter(item => item.available_quantity === 0).length}
            </div>
            <div className="text-sm text-gray-600">Out of Stock</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{categories.length}</div>
            <div className="text-sm text-gray-600">Categories</div>
          </CardContent>
        </Card>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No menu items found</p>
            {searchTerm || selectedCategory !== 'all' || showAvailableOnly ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setShowAvailableOnly(false);
                }}
                className="mt-2"
              >
                Clear filters
              </Button>
            ) : null}
          </div>
        ) : (
          filteredItems.map((item) => (
            <Card key={item.item_id} className={`${!item.is_available ? 'opacity-75' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <span>{item.name}</span>
                      {item.is_veg && <Leaf className="w-4 h-4 text-green-600" />}
                    </CardTitle>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {item.category}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(item)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {item.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <IndianRupee className="w-4 h-4 text-gray-500" />
                    <span className="text-lg font-semibold">{formatCurrency(item.price)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{item.preparation_time}m</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Package className="w-4 h-4 text-gray-500" />
                    <span className={`text-sm font-medium ${
                      item.available_quantity === 0 ? 'text-red-600' : 
                      item.available_quantity < 5 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {item.available_quantity} in stock
                    </span>
                  </div>
                  <Badge variant={item.is_available ? "default" : "secondary"}>
                    {item.is_available ? 'Available' : 'Unavailable'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityUpdate(item.item_id, -1)}
                      disabled={item.available_quantity === 0}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="font-medium min-w-[2rem] text-center">
                      {item.available_quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityUpdate(item.item_id, 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityUpdate(item.item_id, 5)}
                    >
                      +5
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityUpdate(item.item_id, 10)}
                    >
                      +10
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
            <DialogDescription>
              Update the details of this menu item
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                name="name"
                placeholder="Item name"
                value={formData.name}
                onChange={handleInputChange}
                className={formErrors.name ? 'border-red-500' : ''}
              />
              {formErrors.name && <p className="text-sm text-red-500">{formErrors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category">Category *</Label>
              <Input
                id="edit-category"
                name="category"
                placeholder="e.g., Beverages, Main Course"
                value={formData.category}
                onChange={handleInputChange}
                className={formErrors.category ? 'border-red-500' : ''}
              />
              {formErrors.category && <p className="text-sm text-red-500">{formErrors.category}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-price">Price (₹) *</Label>
              <Input
                id="edit-price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.price || ''}
                onChange={handleInputChange}
                className={formErrors.price ? 'border-red-500' : ''}
              />
              {formErrors.price && <p className="text-sm text-red-500">{formErrors.price}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-available_quantity">Quantity</Label>
              <Input
                id="edit-available_quantity"
                name="available_quantity"
                type="number"
                min="0"
                placeholder="10"
                value={formData.available_quantity || ''}
                onChange={handleInputChange}
                className={formErrors.available_quantity ? 'border-red-500' : ''}
              />
              {formErrors.available_quantity && <p className="text-sm text-red-500">{formErrors.available_quantity}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-preparation_time">Prep Time (min)</Label>
              <Input
                id="edit-preparation_time"
                name="preparation_time"
                type="number"
                min="1"
                placeholder="15"
                value={formData.preparation_time || ''}
                onChange={handleInputChange}
                className={formErrors.preparation_time ? 'border-red-500' : ''}
              />
              {formErrors.preparation_time && <p className="text-sm text-red-500">{formErrors.preparation_time}</p>}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit-is_veg"
                checked={formData.is_veg}
                onCheckedChange={(checked) => handleSwitchChange('is_veg', checked)}
              />
              <Label htmlFor="edit-is_veg">Vegetarian</Label>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                name="description"
                placeholder="Describe the item..."
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="edit-image_url">Image URL (optional)</Label>
              <Input
                id="edit-image_url"
                name="image_url"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={formData.image_url}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditModalOpen(false);
              setEditingItem(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleEditItem}>
              Update Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}