import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Building2,
  Computer,
  GraduationCap,
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
  Star,
  Users
} from 'lucide-react';
import { canteensAPI } from '@/services/api';
import { useSocket } from '@/hooks/useSocket';
import { useToast } from '@/hooks/use-toast';
import LiveMenuDisplay from '@/components/menu/LiveMenuDisplay';

interface CanteenInfo {
  canteen_id: number;
  name: string;
  location: string;
  description: string;
  contact: string;
  opening_hours: any;
}

export default function StudentPortal() {
  const { toast } = useToast();
  const [canteens, setCanteens] = useState<CanteenInfo[]>([]);
  const [selectedCanteen, setSelectedCanteen] = useState<CanteenInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realtimeUpdates, setRealtimeUpdates] = useState<any[]>([]);

  // Socket.IO for general updates from all canteens
  const { isConnected, connectionError } = useSocket(undefined, {
    onMenuItemUpdate: (data) => {
      // Add to recent updates
      setRealtimeUpdates(prev => [{
        type: 'quantity_update',
        canteenId: data.canteenId,
        itemName: data.name,
        newQuantity: data.availableQuantity,
        isAvailable: data.isAvailable,
        timestamp: new Date()
      }, ...prev.slice(0, 9)]); // Keep last 10 updates

      const canteen = canteens.find(c => c.canteen_id === data.canteenId);
      toast({
        title: "Menu Updated!",
        description: `${data.name} in ${canteen?.name || 'Unknown Canteen'} - Quantity: ${data.availableQuantity}`,
        duration: 3000,
      });
    },
    
    onMenuItemAvailability: (data) => {
      setRealtimeUpdates(prev => [{
        type: 'availability_change',
        canteenId: data.canteenId,
        itemName: data.itemName,
        isAvailable: data.isAvailable,
        timestamp: new Date()
      }, ...prev.slice(0, 9)]);

      const canteen = canteens.find(c => c.canteen_id === data.canteenId);
      toast({
        title: data.isAvailable ? "Item Available!" : "Item Unavailable",
        description: `${data.itemName} in ${canteen?.name || 'Unknown Canteen'}`,
        duration: 3000,
      });
    },
    
    onLowStockAlert: (data) => {
      const canteen = canteens.find(c => c.canteen_id === data.canteenId);
      toast({
        title: "Low Stock Alert!",
        description: `${data.itemName} in ${canteen?.name} - Only ${data.availableQuantity} left`,
        variant: "destructive",
        duration: 5000,
      });
    },
    
    onMenuItemAdded: (data) => {
      const canteen = canteens.find(c => c.canteen_id === data.canteenId);
      toast({
        title: "New Item Added!",
        description: `${data.menuItem.name} added to ${canteen?.name}`,
        duration: 5000,
      });
    }
  });

  useEffect(() => {
    fetchCanteens();
  }, []);

  const fetchCanteens = async () => {
    setIsLoading(true);
    try {
      const data = await canteensAPI.getCanteens();
      setCanteens(data.canteens);
      // Set the first canteen as default
      if (data.canteens.length > 0) {
        setSelectedCanteen(data.canteens[0]);
      }
      setError(null);
    } catch (error: any) {
      console.error('Failed to fetch canteens:', error);
      setError('Unable to load canteens. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const getCanteenIcon = (canteenName: string) => {
    if (canteenName.toLowerCase().includes('main')) return <Building2 className="w-5 h-5" />;
    if (canteenName.toLowerCase().includes('it')) return <Computer className="w-5 h-5" />;
    if (canteenName.toLowerCase().includes('mba')) return <GraduationCap className="w-5 h-5" />;
    return <Building2 className="w-5 h-5" />;
  };

  const getCanteenColor = (canteenName: string) => {
    if (canteenName.toLowerCase().includes('main')) return 'bg-blue-500';
    if (canteenName.toLowerCase().includes('it')) return 'bg-green-500';
    if (canteenName.toLowerCase().includes('mba')) return 'bg-purple-500';
    return 'bg-gray-500';
  };

  const RealtimeUpdatesPanel = () => (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="w-5 h-5 text-blue-500" />
          Real-time Updates
          {isConnected ? (
            <Badge className="bg-green-100 text-green-800">
              <Wifi className="w-3 h-3 mr-1" />
              Live
            </Badge>
          ) : (
            <Badge variant="destructive">
              <WifiOff className="w-3 h-3 mr-1" />
              Disconnected
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {realtimeUpdates.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent updates. Try making changes in the admin dashboard!</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {realtimeUpdates.map((update, index) => {
              const canteen = canteens.find(c => c.canteen_id === update.canteenId);
              return (
                <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded text-sm">
                  {update.type === 'quantity_update' ? (
                    <Package className="w-4 h-4 text-blue-600" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  )}
                  <span className="flex-1">
                    <strong>{update.itemName}</strong> in {canteen?.name}
                    {update.type === 'quantity_update' && (
                      <span> - Qty: {update.newQuantity} {update.isAvailable ? '✅' : '❌'}</span>
                    )}
                    {update.type === 'availability_change' && (
                      <span> - {update.isAvailable ? 'Available' : 'Unavailable'}</span>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {update.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        {realtimeUpdates.length > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2" 
            onClick={() => setRealtimeUpdates([])}
          >
            Clear Updates
          </Button>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading canteens...</p>
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
          <Button variant="outline" size="sm" className="ml-2" onClick={fetchCanteens}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🍽️ CampusEats</h1>
              <p className="text-sm text-gray-600">Live menu updates for campus canteens</p>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Student Portal</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Connection Status */}
        {connectionError && (
          <Alert variant="destructive" className="mb-6">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              Connection error: {connectionError}. Real-time updates may not work.
            </AlertDescription>
          </Alert>
        )}

        <RealtimeUpdatesPanel />

        {/* Canteen Selector */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Choose Your Canteen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {canteens.map((canteen) => (
                <Card 
                  key={canteen.canteen_id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedCanteen?.canteen_id === canteen.canteen_id 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedCanteen(canteen)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${getCanteenColor(canteen.name)} text-white`}>
                        {getCanteenIcon(canteen.name)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{canteen.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{canteen.location}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3">{canteen.description}</p>
                    <Button 
                      variant={selectedCanteen?.canteen_id === canteen.canteen_id ? "default" : "outline"}
                      size="sm"
                      className="w-full"
                    >
                      {selectedCanteen?.canteen_id === canteen.canteen_id ? 'Selected' : 'View Menu'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Live Menu Display */}
        {selectedCanteen && (
          <LiveMenuDisplay canteen={selectedCanteen} />
        )}

        {/* Demo Instructions */}
        <Card className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Zap className="w-5 h-5" />
              Real-time Demo Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700">
            <div className="space-y-2 text-sm">
              <p><strong>📋 How to test real-time updates:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Open the admin dashboard in another tab: <code>http://localhost:8080/admin/dashboard</code></li>
                <li>Login as any canteen admin (main_admin/admin123, it_admin/admin123, mba_admin/admin123)</li>
                <li>In the admin dashboard, change quantities using +/- buttons or toggle availability</li>
                <li>Watch this student portal page update instantly without refreshing!</li>
                <li>You'll see real-time notifications and the "Real-time Updates" panel will show all changes</li>
              </ol>
              <p className="mt-3 text-xs text-blue-600">
                💡 Tip: The blue "Updated" badge appears on items that just changed, and you'll get toast notifications for major updates.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}