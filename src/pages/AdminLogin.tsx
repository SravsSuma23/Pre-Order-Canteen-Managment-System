import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Shield, ArrowLeft, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

interface AdminLoginProps {
  canteenId?: number;
}

export default function AdminLogin({ canteenId }: AdminLoginProps = {}) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, isLoading, isAuthenticated, error, clearError } = useAdminAuth();
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Data reset function
  const handleDataReset = () => {
    // Clear all authentication and menu data
    [
      'campusEats_admin_token',
      'campusEats_admin_data', 
      'campusEats_admin_isOffline',
      'campusEats_token',
      'campusEats_user_data',
      'mockMenuItems',
      'canteen_1_menu', 'canteen_2_menu', 'canteen_3_menu',
      'canteen_1_admin_menu', 'canteen_2_admin_menu', 'canteen_3_admin_menu',
      'canteen_general_admin_menu'
    ].forEach(key => localStorage.removeItem(key));
    
    toast({
      title: "Data Reset Complete",
      description: "All stored data cleared. Please try login again.",
      variant: "default",
    });
    
    // Clear form and error state
    setFormData({ username: '', password: '' });
    setFormErrors({});
    clearError();
  };

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      const redirectUrl = canteenId ? `/admin/canteen/${canteenId}/dashboard` : '/admin/dashboard';
      navigate(redirectUrl);
    }
  }, [isAuthenticated, navigate, canteenId]);

  // Clear errors when form changes
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field error when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await login(formData);
      
      toast({
        title: "Login Successful",
        description: "Welcome to the admin dashboard!",
      });

      const redirectUrl = canteenId ? `/admin/canteen/${canteenId}/dashboard` : '/admin/dashboard';
      navigate(redirectUrl);
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {canteenId ? `${['Main Canteen', 'IT Canteen', 'MBA Canteen'][canteenId - 1]} Admin` : 'Admin Portal'}
          </h1>
          <p className="text-blue-100">Canteen Management System</p>
        </div>

        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-semibold text-gray-800">
              Admin Login
            </CardTitle>
            <CardDescription className="text-gray-600">
              Access your canteen management dashboard
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Enter your admin username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={formErrors.username ? 'border-red-500' : ''}
                  disabled={isLoading}
                />
                {formErrors.username && (
                  <p className="text-sm text-red-500">{formErrors.username}</p>
                )}
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
                    className={formErrors.password ? 'border-red-500 pr-10' : 'pr-10'}
                    disabled={isLoading}
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
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
                {formErrors.password && (
                  <p className="text-sm text-red-500">{formErrors.password}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
              
              {error && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-2 text-red-600 border-red-300 hover:bg-red-50"
                  onClick={handleDataReset}
                  disabled={isLoading}
                >
                  🧹 Clear Data & Reset
                </Button>
              )}
            </form>

            {/* Demo credentials info */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Demo Credentials:</p>
              <div className="space-y-1 text-xs text-gray-600">
                <div><strong>Main Canteen:</strong> admin_main / admin123</div>
                <div><strong>IT Canteen:</strong> admin_it / admin123</div>
                <div><strong>MBA Canteen:</strong> admin_mba / admin123</div>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="mt-6 flex items-center justify-between text-sm">
              <Link
                to="/"
                className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Home
              </Link>
              <Link
                to="/login"
                className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
              >
                <Users className="w-4 h-4 mr-1" />
                Student Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}