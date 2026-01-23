import React, { useState, useEffect } from 'react';
import AdminLogin from '@/components/admin/AdminLogin';
import SimpleAdminDashboard from '@/components/admin/SimpleAdminDashboard';
import { Admin } from '@/services/api';

interface AdminInfo {
  admin_id: string;
  name: string;
  username: string;
  canteen: {
    canteen_id: number;
    name: string;
    location: string;
  };
}

export default function AdminApp() {
  const [currentAdmin, setCurrentAdmin] = useState<AdminInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if admin is already logged in
    const savedToken = localStorage.getItem('campusEats_admin_token');
    const savedAdminData = localStorage.getItem('campusEats_admin_data');
    
    if (savedToken && savedAdminData) {
      try {
        const adminData = JSON.parse(savedAdminData);
        setCurrentAdmin(adminData);
      } catch (error) {
        console.error('Error parsing saved admin data:', error);
        localStorage.removeItem('campusEats_admin_token');
        localStorage.removeItem('campusEats_admin_data');
      }
    }
    
    setIsLoading(false);
  }, []);

  const handleLoginSuccess = (admin: Admin, token: string) => {
    const adminInfo: AdminInfo = {
      admin_id: admin.admin_id,
      name: admin.name,
      username: admin.username,
      canteen: admin.canteen
    };
    
    setCurrentAdmin(adminInfo);
  };

  const handleLogout = () => {
    localStorage.removeItem('campusEats_admin_token');
    localStorage.removeItem('campusEats_admin_data');
    setCurrentAdmin(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {currentAdmin ? (
        <SimpleAdminDashboard admin={currentAdmin} onLogout={handleLogout} />
      ) : (
        <AdminLogin onLoginSuccess={handleLoginSuccess} />
      )}
    </>
  );
}