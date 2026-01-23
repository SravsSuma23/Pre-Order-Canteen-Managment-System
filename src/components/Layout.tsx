import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "./Navbar";
import { useAuth } from "@/hooks/useAuth";

export const Layout = () => {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const isAuthPage = ['/login', '/register'].includes(location.pathname);
  const isIndexPage = location.pathname === '/';

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // For auth pages (login/register), don't show navbar
  if (isAuthPage) {
    return <Outlet />;
  }

  // For index page when not authenticated, don't show navbar
  if (isIndexPage && !isAuthenticated) {
    return <Outlet />;
  }

  // For all other pages, show navbar (Navbar will handle auth state)
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
};
