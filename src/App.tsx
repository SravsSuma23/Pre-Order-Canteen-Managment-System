import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { AdminAuthProvider } from "./contexts/AdminAuthContext";
import { Layout } from "./components/Layout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Menu from "./pages/Menu";
import Cart from "./pages/Cart";
import Payment from "./pages/Payment";
import Receipt from "./pages/Receipt";
import Orders from "./pages/Orders";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import CanteenPortals from "./pages/CanteenPortals";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AdminAuthProvider>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Student Routes with Layout */}
              <Route path="/" element={<Layout />}>
                <Route index element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/menu/:canteenId" element={<Menu />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/payment" element={<Payment />} />
                <Route path="/receipt" element={<Receipt />} />
                <Route path="/orders" element={<Orders />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Route>
              
              {/* Admin Routes without Layout (standalone) */}
              <Route path="/admin/portals" element={<CanteenPortals />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              
              {/* Canteen-specific Admin Routes */}
              <Route path="/admin/canteen/1/login" element={<AdminLogin canteenId={1} />} />
              <Route path="/admin/canteen/1/dashboard" element={<AdminDashboard canteenId={1} />} />
              <Route path="/admin/canteen/2/login" element={<AdminLogin canteenId={2} />} />
              <Route path="/admin/canteen/2/dashboard" element={<AdminDashboard canteenId={2} />} />
              <Route path="/admin/canteen/3/login" element={<AdminLogin canteenId={3} />} />
              <Route path="/admin/canteen/3/dashboard" element={<AdminDashboard canteenId={3} />} />
            </Routes>
          </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </AdminAuthProvider>
  </QueryClientProvider>
);

export default App;
