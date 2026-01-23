import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import campusBackground from "@/assets/campus-background.png";

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${campusBackground})` }}
    >
      <div className="absolute inset-0 bg-black/40"></div>
      <div className="relative z-10 text-center max-w-2xl mx-auto">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-24 h-24 bg-card rounded-3xl shadow-strong mb-8">
          <span className="text-4xl font-bold text-primary">CE</span>
        </div>
        
        {/* Hero Content */}
        <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
          Welcome to <br />
          <span className="text-white/90">CampusEats</span>
        </h1>
        
        <p className="text-xl text-white/80 mb-8 leading-relaxed">
          Your favorite campus canteens, all in one place. <br />
          Order delicious meals and get them delivered fresh to your location.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => navigate("/login")}
            className="bg-white text-primary hover:bg-white/90 shadow-medium"
            size="lg"
          >
            Login
          </Button>
          <Button 
            onClick={() => navigate("/register")}
            className="bg-white text-primary hover:bg-white/90 shadow-medium"
            size="lg"
          >
            Sign Up
          </Button>
        </div>
        
        {/* Admin Portal Link */}
        <div className="mt-8">
          <Button 
            onClick={() => navigate("/admin/login")}
            variant="outline"
            className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white"
            size="sm"
          >
            🛡️ Admin Portal
          </Button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="text-center">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🍽️</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Multiple Canteens</h3>
            <p className="text-white/70">Choose from 3 different campus dining options</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Fast Delivery</h3>
            <p className="text-white/70">Quick pickup and delivery to your location</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💳</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Easy Payment</h3>
            <p className="text-white/70">Secure UPI payments and order tracking</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
