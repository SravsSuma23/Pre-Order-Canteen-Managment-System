import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User, LogOut, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const cartItemsCount = 3; // Mock data

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  // If user is not authenticated, show minimal navbar with login/register options
  if (!isAuthenticated) {
    return (
      <header className="bg-card border-b border-border shadow-soft sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">CE</span>
              </div>
              <span className="text-xl font-bold text-primary">CampusEats</span>
            </Link>

            {/* Auth Actions */}
            <div className="flex items-center space-x-2">
              <Button 
                onClick={() => navigate("/login")}
                variant="ghost"
                size="sm"
              >
                Login
              </Button>
              <Button 
                onClick={() => navigate("/register")}
                size="sm"
              >
                Sign Up
              </Button>
            </div>
          </nav>
        </div>
      </header>
    );
  }

  // If user is authenticated, show full navigation
  return (
    <header className="bg-card border-b border-border shadow-soft sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">CE</span>
            </div>
            <span className="text-xl font-bold text-primary">CampusEats</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              to="/dashboard" 
              className={`font-medium transition-colors hover:text-primary ${
                isActive('/dashboard') ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Canteens
            </Link>
            <Link 
              to="/orders" 
              className={`font-medium transition-colors hover:text-primary ${
                isActive('/orders') ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              My Orders
            </Link>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* Cart Button */}
            <Button variant="ghost" size="sm" onClick={() => navigate("/cart")} className="relative">
              <ShoppingCart className="h-5 w-5" />
              {cartItemsCount > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {cartItemsCount}
                </Badge>
              )}
            </Button>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <Button variant="ghost" size="sm">
                <User className="h-5 w-5" />
              </Button>
            </div>

            {/* Desktop User Menu */}
            <div className="hidden md:flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Welcome, {user?.name}</span>
              <Button variant="ghost" size="sm" onClick={() => navigate("/orders")}>
                <History className="h-4 w-4 mr-2" />
                Orders
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
};
