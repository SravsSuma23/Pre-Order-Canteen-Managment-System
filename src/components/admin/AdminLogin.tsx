import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LogIn, 
  Building2, 
  Computer, 
  GraduationCap,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { adminAuthAPI, Admin } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface CanteenConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  adminCredentials: {
    username: string;
    displayName: string;
  }[];
}

interface Props {
  onLoginSuccess: (admin: Admin, token: string) => void;
}

export default function AdminLogin({ onLoginSuccess }: Props) {
  const { toast } = useToast();
  const [selectedCanteen, setSelectedCanteen] = useState<string>('main');
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canteens: CanteenConfig[] = [
    {
      id: 'main',
      name: 'Main Canteen',
      description: 'Main campus canteen serving both vegetarian and non-vegetarian items',
      icon: <Building2 className="w-6 h-6" />,
      color: 'bg-blue-500',
      adminCredentials: [
        { username: 'main_admin', displayName: 'Main Canteen Admin' },
        { username: 'admin_main', displayName: 'Main Canteen Manager' }
      ]
    },
    {
      id: 'it',
      name: 'IT Canteen',
      description: 'IT department canteen with variety of veg and non-veg options',
      icon: <Computer className="w-6 h-6" />,
      color: 'bg-green-500',
      adminCredentials: [
        { username: 'it_admin', displayName: 'IT Canteen Admin' },
        { username: 'admin_it', displayName: 'IT Canteen Manager' }
      ]
    },
    {
      id: 'mba',
      name: 'MBA Canteen',
      description: 'MBA block canteen serving exclusively vegetarian items',
      icon: <GraduationCap className="w-6 h-6" />,
      color: 'bg-purple-500',
      adminCredentials: [
        { username: 'mba_admin', displayName: 'MBA Canteen Admin' },
        { username: 'admin_mba', displayName: 'MBA Canteen Manager' }
      ]
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username.trim() || !formData.password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await adminAuthAPI.login({
        username: formData.username.trim(),
        password: formData.password
      });

      // Store token in localStorage
      localStorage.setItem('campusEats_admin_token', response.token);
      localStorage.setItem('campusEats_admin_data', JSON.stringify(response.admin));

      toast({
        title: "Login Successful",
        description: `Welcome back, ${response.admin.name}!`,
        duration: 3000,
      });

      onLoginSuccess(response.admin, response.token);
      
    } catch (error: any) {
      console.error('Login failed:', error);
      setError(
        error.message || 
        'Login failed. Please check your credentials and try again.'
      );
      
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (username: string) => {
    setFormData(prev => ({
      ...prev,
      username: username
    }));
  };

  const getCurrentCanteen = () => {
    return canteens.find(c => c.id === selectedCanteen) || canteens[0];
  };

  const currentCanteen = getCurrentCanteen();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            CampusEats Admin Portal
          </h1>
          <p className="text-lg text-gray-600">
            Manage your canteen's menu and inventory in real-time
          </p>
        </div>

        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">Admin Login</CardTitle>
            <CardDescription>
              Select your canteen and sign in to manage your menu
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs value={selectedCanteen} onValueChange={setSelectedCanteen} className="w-full">
              <TabsList className="grid grid-cols-3 mb-6 h-auto">
                {canteens.map((canteen) => (
                  <TabsTrigger 
                    key={canteen.id} 
                    value={canteen.id} 
                    className="flex flex-col items-center p-4 h-auto data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <div className={`p-2 rounded-full ${canteen.color} text-white mb-2`}>
                      {canteen.icon}
                    </div>
                    <span className="font-medium">{canteen.name}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {canteens.map((canteen) => (
                <TabsContent key={canteen.id} value={canteen.id} className="space-y-6">
                  {/* Canteen Info */}
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center mb-3">
                      <div className={`p-3 rounded-full ${canteen.color} text-white`}>
                        {canteen.icon}
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{canteen.name}</h3>
                    <p className="text-gray-600">{canteen.description}</p>
                  </div>

                  {/* Login Form */}
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        name="username"
                        type="text"
                        placeholder="Enter your username"
                        value={formData.username}
                        onChange={handleInputChange}
                        disabled={isLoading}
                        className="text-base"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          value={formData.password}
                          onChange={handleInputChange}
                          disabled={isLoading}
                          className="text-base pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full text-base py-6" 
                      size="lg"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        <>
                          <LogIn className="mr-2 h-4 w-4" />
                          Sign In to {canteen.name}
                        </>
                      )}
                    </Button>
                  </form>

                  {/* Quick Login Options */}
                  <div className="space-y-3">
                    <div className="text-center">
                      <Label className="text-sm text-gray-500">Quick Login (for demo)</Label>
                    </div>
                    <div className="grid gap-2">
                      {canteen.adminCredentials.map((cred) => (
                        <Button
                          key={cred.username}
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickLogin(cred.username)}
                          disabled={isLoading}
                          className="justify-start"
                        >
                          <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                          {cred.displayName} ({cred.username})
                        </Button>
                      ))}
                    </div>
                    <div className="text-center">
                      <Badge variant="secondary" className="text-xs">
                        Demo password: admin123 (for all accounts)
                      </Badge>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Features List */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center p-4">
            <div className="flex items-center justify-center mb-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="font-semibold mb-2">Real-time Updates</h3>
            <p className="text-sm text-gray-600">
              Inventory changes sync instantly across all platforms
            </p>
          </Card>

          <Card className="text-center p-4">
            <div className="flex items-center justify-center mb-3">
              <div className="p-2 bg-green-100 rounded-full">
                <Computer className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="font-semibold mb-2">Easy Management</h3>
            <p className="text-sm text-gray-600">
              Intuitive interface for managing menu items and quantities
            </p>
          </Card>

          <Card className="text-center p-4">
            <div className="flex items-center justify-center mb-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <GraduationCap className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h3 className="font-semibold mb-2">Low Stock Alerts</h3>
            <p className="text-sm text-gray-600">
              Get notified when items are running low
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}