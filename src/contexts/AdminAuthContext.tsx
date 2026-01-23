import React, { createContext, useContext, useEffect, useState } from 'react';
import { Admin, adminAuthAPI, AdminLoginRequest } from '@/services/api';

interface AdminAuthContextType {
  admin: Admin | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: AdminLoginRequest) => Promise<void>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!admin;
  
  // Debug logging
  console.log('AdminAuth state - admin:', admin, 'isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);

  // Load admin from localStorage on mount
  useEffect(() => {
    const loadAdmin = async () => {
      const token = localStorage.getItem('campusEats_admin_token');
      const storedAdmin = localStorage.getItem('campusEats_admin_data');
      const isOfflineAdmin = localStorage.getItem('campusEats_admin_isOffline');

      if (token && storedAdmin) {
        try {
          const adminData = JSON.parse(storedAdmin);
          
          if (isOfflineAdmin === 'true') {
            // Use stored admin data for offline mode
            setAdmin(adminData);
            console.log('Restored offline admin authentication for:', adminData.name);
          } else {
            // Try to verify token with API
            setAdmin(adminData);
            await adminAuthAPI.getProfile();
            console.log('Admin token verified with API');
          }
        } catch (error) {
          console.error('Admin token verification failed:', error);
          // Fall back to stored admin data if API fails
          if (storedAdmin) {
            try {
              const adminData = JSON.parse(storedAdmin);
              setAdmin(adminData);
              localStorage.setItem('campusEats_admin_isOffline', 'true');
              console.log('Switched admin to offline mode for:', adminData.name);
            } catch {
              // Clear invalid data
              localStorage.removeItem('campusEats_admin_token');
              localStorage.removeItem('campusEats_admin_data');
              localStorage.removeItem('campusEats_admin_isOffline');
              setAdmin(null);
            }
          } else {
            // Token is invalid, clear storage
            localStorage.removeItem('campusEats_admin_token');
            localStorage.removeItem('campusEats_admin_data');
            localStorage.removeItem('campusEats_admin_isOffline');
            setAdmin(null);
          }
        }
      }
      setIsLoading(false);
    };

    loadAdmin();
  }, []);

  const login = async (credentials: AdminLoginRequest) => {
    setIsLoading(true);
    setError(null);

    // Mock admin credentials validation (prioritize offline mode for reliability)
    const mockAdmins = {
      'admin_main': {
        admin_id: 1,
        username: 'admin_main',
        name: 'Main Canteen Admin',
        email: 'admin.main@university.edu',
        role: 'admin',
        permissions: ['manage_menu', 'view_orders', 'manage_orders'],
        canteen: {
          canteen_id: 1,
          name: 'Main Canteen',
          location: 'Main Building, Ground Floor'
        },
        created_at: new Date().toISOString()
      },
      'admin_it': {
        admin_id: 2,
        username: 'admin_it',
        name: 'IT Canteen Admin',
        email: 'admin.it@university.edu',
        role: 'admin',
        permissions: ['manage_menu', 'view_orders', 'manage_orders'],
        canteen: {
          canteen_id: 2,
          name: 'IT Canteen',
          location: 'IT Building, 2nd Floor'
        },
        created_at: new Date().toISOString()
      },
      'admin_mba': {
        admin_id: 3,
        username: 'admin_mba',
        name: 'MBA Canteen Admin',
        email: 'admin.mba@university.edu',
        role: 'admin',
        permissions: ['manage_menu', 'view_orders', 'manage_orders'],
        canteen: {
          canteen_id: 3,
          name: 'MBA Canteen',
          location: 'MBA Block, 1st Floor'
        },
        created_at: new Date().toISOString()
      }
    };
    
    const mockAdmin = mockAdmins[credentials.username as keyof typeof mockAdmins];
    
    try {
      // Validate mock credentials first
      if (mockAdmin && credentials.password === 'admin123') {
        const mockToken = 'offline_admin_token_' + Date.now();
        
        // Store mock data
        localStorage.setItem('campusEats_admin_token', mockToken);
        localStorage.setItem('campusEats_admin_data', JSON.stringify(mockAdmin));
        localStorage.setItem('campusEats_admin_isOffline', 'true');
        
        setAdmin(mockAdmin);
        console.log('✅ Offline admin authentication successful for:', mockAdmin.name);
        
        // Try to sync with API in background (non-blocking)
        setTimeout(async () => {
          try {
            const response = await adminAuthAPI.login(credentials);
            console.log('📡 Successfully synced with backend API');
            
            // Update with real data if API is available
            localStorage.setItem('campusEats_admin_token', response.token);
            localStorage.setItem('campusEats_admin_data', JSON.stringify(response.admin));
            localStorage.removeItem('campusEats_admin_isOffline');
            setAdmin(response.admin);
          } catch (apiError) {
            console.log('🔄 Using offline mode - backend not available');
            // Continue using mock data
          }
        }, 100);
        
      } else {
        setError('Invalid username or password. Please use demo credentials.');
        throw new Error('Invalid credentials');
      }
    } catch (error: any) {
      if (!mockAdmin || credentials.password !== 'admin123') {
        setError('Invalid username or password. Use demo credentials:\n• Main Canteen: admin_main / admin123\n• IT Canteen: admin_it / admin123\n• MBA Canteen: admin_mba / admin123');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Call logout API (optional - fire and forget)
    adminAuthAPI.logout().catch(() => {
      // Ignore errors on logout
    });

    // Clear local storage
    localStorage.removeItem('campusEats_admin_token');
    localStorage.removeItem('campusEats_admin_data');
    
    setAdmin(null);
    setError(null);
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    admin,
    isLoading,
    isAuthenticated,
    login,
    logout,
    error,
    clearError,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};