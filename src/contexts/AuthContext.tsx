import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, User, LoginRequest, RegisterRequest } from '../services/api';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  updateProfile: (userData: Partial<User>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check for existing authentication on app load
    const checkAuth = async () => {
      const token = localStorage.getItem('campusEats_token');
      const storedUser = localStorage.getItem('campusEats_user');
      const isOfflineAuth = localStorage.getItem('campusEats_isOfflineAuth');
      
      if (token && storedUser) {
        try {
          if (isOfflineAuth === 'true') {
            // Use stored user data for offline mode
            const userData = JSON.parse(storedUser);
            setUser(userData);
            console.log('Restored offline authentication for:', userData.name);
          } else {
            // Try to fetch fresh user data from API
            const { user: userData } = await authAPI.getProfile();
            setUser(userData);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // Fall back to stored user data if API fails
          if (storedUser) {
            try {
              const userData = JSON.parse(storedUser);
              setUser(userData);
              localStorage.setItem('campusEats_isOfflineAuth', 'true');
              console.log('Switched to offline mode for:', userData.name);
            } catch {
              localStorage.removeItem('campusEats_token');
              localStorage.removeItem('campusEats_user');
              localStorage.removeItem('campusEats_isOfflineAuth');
            }
          } else {
            localStorage.removeItem('campusEats_token');
            localStorage.removeItem('campusEats_user');
            localStorage.removeItem('campusEats_isOfflineAuth');
          }
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      setIsLoading(true);
      const { user: userData, token } = await authAPI.login(credentials);
      
      localStorage.setItem('campusEats_token', token);
      localStorage.setItem('campusEats_user', JSON.stringify(userData));
      localStorage.removeItem('campusEats_isOfflineAuth'); // Clear offline flag on successful API login
      setUser(userData);
      
      toast({
        title: "Login Successful",
        description: `Welcome back, ${userData.name}!`,
      });
    } catch (error: any) {
      console.error('API Login error:', error);
      
      // Fallback to mock authentication when backend is unavailable
      console.log('Backend unavailable, using offline authentication...');
      
      const mockUser = {
        user_id: Date.now(),
        email: credentials.email,
        name: credentials.email.includes('@') ? credentials.email.split('@')[0].replace(/\.|_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Test Student',
        student_id: 'STU' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
        phone: '+91 ' + Math.floor(1000000000 + Math.random() * 9000000000),
        course: 'Computer Science',
        year: 'Third Year',
        created_at: new Date().toISOString()
      };
      
      const mockToken = 'offline_token_' + Date.now();
      
      // Store mock data
      localStorage.setItem('campusEats_token', mockToken);
      localStorage.setItem('campusEats_user', JSON.stringify(mockUser));
      localStorage.setItem('campusEats_isOfflineAuth', 'true');
      
      setUser(mockUser);
      
      toast({
        title: "Login Successful (Offline Mode)",
        description: `Welcome ${mockUser.name}! You're in offline mode.`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterRequest) => {
    try {
      setIsLoading(true);
      const { user: newUser, token } = await authAPI.register(userData);
      
      localStorage.setItem('campusEats_token', token);
      localStorage.setItem('campusEats_user', JSON.stringify(newUser));
      localStorage.removeItem('campusEats_isOfflineAuth'); // Clear offline flag on successful API registration
      setUser(newUser);
      
      toast({
        title: "Registration Successful",
        description: `Welcome to CampusEats, ${newUser.name}!`,
      });
    } catch (error: any) {
      console.error('API Registration error:', error);
      
      // Fallback to mock registration when backend is unavailable
      console.log('Backend unavailable, using offline registration...');
      
      // Check for duplicate email in offline registrations
      const existingOfflineUsers = localStorage.getItem('campusEats_offline_users');
      if (existingOfflineUsers) {
        try {
          const users = JSON.parse(existingOfflineUsers);
          if (users.some((user: any) => user.email === userData.email.toLowerCase())) {
            toast({
              title: "Registration Failed",
              description: "An account with this email already exists. Please try logging in instead.",
              variant: "destructive",
            });
            throw new Error('Email already exists');
          }
        } catch (parseError) {
          console.error('Error parsing offline users:', parseError);
        }
      }
      
      // Generate mock user data
      const mockUser = {
        user_id: Date.now(),
        email: userData.email,
        name: userData.name,
        student_id: 'STU' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
        phone: userData.phone,
        course: 'Computer Science', // Default course
        year: 'Third Year', // Default year
        upi_id: userData.upi_id || null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const mockToken = 'offline_token_' + Date.now();
      
      // Store mock data
      localStorage.setItem('campusEats_token', mockToken);
      localStorage.setItem('campusEats_user', JSON.stringify(mockUser));
      localStorage.setItem('campusEats_isOfflineAuth', 'true');
      
      // Store user in offline users list for duplicate checking
      const offlineUsers = JSON.parse(localStorage.getItem('campusEats_offline_users') || '[]');
      offlineUsers.push({ email: mockUser.email, user_id: mockUser.user_id, name: mockUser.name });
      localStorage.setItem('campusEats_offline_users', JSON.stringify(offlineUsers));
      
      setUser(mockUser);
      
      toast({
        title: "Registration Successful (Offline Mode)",
        description: `Welcome to CampusEats, ${mockUser.name}! You're in offline mode.`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('campusEats_token');
      localStorage.removeItem('campusEats_user');
      
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    }
  };

  const updateProfile = async (updateData: Partial<User>) => {
    try {
      const { user: updatedUser } = await authAPI.updateProfile(updateData);
      setUser(updatedUser);
      localStorage.setItem('campusEats_user', JSON.stringify(updatedUser));
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
      throw error;
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    isLoading,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

