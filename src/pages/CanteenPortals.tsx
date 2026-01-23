import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { syncMenuData, debugMenuData } from '@/utils/dataSync';
import { useToast } from '@/hooks/use-toast';
import { 
  Store, 
  Users, 
  UtensilsCrossed, 
  ArrowRight, 
  Shield,
  Building2,
  GraduationCap,
  Code,
  RefreshCw
} from 'lucide-react';

const canteens = [
  {
    id: 1,
    name: 'Main Canteen',
    description: 'Primary dining facility serving all campus departments',
    location: 'Central Campus',
    icon: <Building2 className="w-8 h-8" />,
    color: 'bg-blue-500',
    students: 1200,
    menuItems: 45
  },
  {
    id: 2,
    name: 'IT Canteen',
    description: 'Specialized canteen for IT department and tech students',
    location: 'IT Block',
    icon: <Code className="w-8 h-8" />,
    color: 'bg-green-500',
    students: 800,
    menuItems: 32
  },
  {
    id: 3,
    name: 'MBA Canteen',
    description: 'Executive dining facility for MBA and management students',
    location: 'Management Block',
    icon: <GraduationCap className="w-8 h-8" />,
    color: 'bg-purple-500',
    students: 600,
    menuItems: 38
  }
];

export default function CanteenPortals() {
  const { toast } = useToast();

  const handleSyncData = () => {
    try {
      const results = syncMenuData();
      toast({
        title: "Data Synchronized! 🚀",
        description: `Updated menu data for all ${results.length} canteens`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to synchronize menu data",
        variant: "destructive",
      });
    }
  };

  const handleDebugData = () => {
    debugMenuData();
    toast({
      title: "Debug Info",
      description: "Check console for detailed menu data info",
      variant: "default",
    });
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Portals</h1>
          <p className="text-gray-600 text-lg">Choose your canteen to access the management dashboard</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Store className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">3</p>
              <p className="text-gray-600">Active Canteens</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">2,600+</p>
              <p className="text-gray-600">Total Students</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <UtensilsCrossed className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">115</p>
              <p className="text-gray-600">Menu Items</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Canteen Cards */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {canteens.map((canteen) => (
            <Card key={canteen.id} className="hover:shadow-xl transition-shadow duration-300 border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-12 h-12 ${canteen.color} rounded-lg flex items-center justify-center text-white`}>
                    {canteen.icon}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Canteen {canteen.id}
                  </Badge>
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  {canteen.name}
                </CardTitle>
                <p className="text-gray-600 text-sm">{canteen.description}</p>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">{canteen.location}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Students:</span>
                    <span className="font-medium text-blue-600">{canteen.students.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Menu Items:</span>
                    <span className="font-medium text-green-600">{canteen.menuItems}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Link to={`/admin/canteen/${canteen.id}/login`}>
                    <Button className={`w-full ${canteen.color} hover:opacity-90 text-white`}>
                      <Shield className="w-4 h-4 mr-2" />
                      Access Admin Portal
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  
                  <Link to={`/menu/${canteen.id}`}>
                    <Button variant="outline" className="w-full">
                      <UtensilsCrossed className="w-4 h-4 mr-2" />
                      View Student Menu
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Options */}
        <div className="mt-12 text-center space-y-6">
          <Card className="inline-block p-6 bg-white border-0 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Access</h3>
            <div className="flex items-center justify-center space-x-4">
              <Link to="/admin/login">
                <Button variant="outline">
                  <Shield className="w-4 h-4 mr-2" />
                  General Admin
                </Button>
              </Link>
              <Link to="/">
                <Button variant="outline">
                  <Store className="w-4 h-4 mr-2" />
                  Student Portal
                </Button>
              </Link>
            </div>
          </Card>
          
          {/* Data Management */}
          <Card className="inline-block p-6 bg-blue-50 border-0 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h3>
            <div className="flex items-center justify-center space-x-4">
              <Button onClick={handleSyncData} className="bg-blue-600 hover:bg-blue-700">
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync Menu Data
              </Button>
              <Button onClick={handleDebugData} variant="outline">
                <Code className="w-4 h-4 mr-2" />
                Debug Data
              </Button>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Use "Sync Menu Data" if admin and student menus don't match
            </p>
          </Card>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>© 2024 Canteen Management System. Built for efficient food service management.</p>
        </footer>
      </div>
    </div>
  );
}