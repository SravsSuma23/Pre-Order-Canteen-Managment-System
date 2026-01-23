import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, MapPin, Star, Users } from "lucide-react";
import { canteensAPI, Canteen } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import canteenMainImg from "@/assets/canteen-main.jpg";
import canteenFastfoodImg from "@/assets/canteen-fastfood.jpg";
import canteenHealthyImg from "@/assets/canteen-healthy.jpg";

// Default images for canteens
const canteenImages = {
  1: canteenMainImg,
  2: canteenFastfoodImg,
  3: canteenHealthyImg,
};

export default function Dashboard() {
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchCanteens = async () => {
      try {
        setIsLoading(true);
        const response = await canteensAPI.getCanteens();
        setCanteens(response.canteens);
      } catch (error: any) {
        toast({
          title: "Error Loading Canteens",
          description: error.message || "Failed to load canteen data",
          variant: "destructive",
        });
        // Set mock data as fallback
        setCanteens([
          {
            canteen_id: 1,
            name: "Main Canteen",
            description: "Traditional meals, regional cuisine, and daily specials",
            location: "Ground Floor, Academic Block A",
            contact: "080-12345678",
            opening_hours: { monday: "07:00-22:00", tuesday: "07:00-22:00" },
            created_at: new Date().toISOString(),
          },
          {
            canteen_id: 2,
            name: "IT Canteen",
            description: "Quick bites, pizzas, burgers, and street food",
            location: "Second Floor, IT Block",
            contact: "080-12345679",
            opening_hours: { monday: "08:00-20:00", tuesday: "08:00-20:00" },
            created_at: new Date().toISOString(),
          },
          {
            canteen_id: 3,
            name: "MBA Canteen",
            description: "Fresh salads, juices, and organic food options",
            location: "Ground Floor, MBA Block",
            contact: "080-12345680",
            opening_hours: { monday: "09:00-18:00", tuesday: "09:00-18:00" },
            created_at: new Date().toISOString(),
          },
        ] as Canteen[]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCanteens();
  }, [toast]);

  const handleViewMenu = (canteenId: number) => {
    navigate(`/menu/${canteenId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Choose Your Canteen
        </h1>
        <p className="text-muted-foreground">
          Select from our campus dining options and browse their menus
        </p>
      </div>

      {/* Canteen Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          canteens.map((canteen) => (
            <Card key={canteen.canteen_id} className="overflow-hidden hover:shadow-medium transition-all duration-300 group">
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={canteenImages[canteen.canteen_id] || canteenMainImg}
                  alt={canteen.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-4 left-4">
                  <Badge 
                    variant="default"
                    className="bg-green-500 text-white"
                  >
                    Open
                  </Badge>
                </div>
                <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center space-x-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">4.5</span>
                </div>
              </div>

              {/* Content */}
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {canteen.name}
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>12</span>
                  </div>
                </CardTitle>
                <CardDescription>{canteen.description}</CardDescription>
              </CardHeader>

              <CardContent>
                {/* Info Grid */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Est. delivery:</span>
                    <span className="font-medium">15-20 mins</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium">{canteen.location}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-muted-foreground">Contact:</span>
                    <span className="font-medium">{canteen.contact}</span>
                  </div>
                </div>

                {/* Specialties - using sample data since not in API */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {canteen.canteen_id === 1 && ['Indian', 'Continental', 'Thali'].map((specialty, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                  {canteen.canteen_id === 2 && ['Pizza', 'Burgers', 'Fast Food'].map((specialty, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                  {canteen.canteen_id === 3 && ['Salads', 'Healthy', 'Organic'].map((specialty, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                </div>

                {/* Action Button */}
                <Button 
                  onClick={() => handleViewMenu(canteen.canteen_id)}
                  className="w-full bg-gradient-primary hover:opacity-90"
                >
                  View Menu
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Quick Stats */}
      <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-primary">{canteens.length}</div>
          <div className="text-sm text-muted-foreground">Canteens Available</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-primary">{user ? '0' : '-'}</div>
          <div className="text-sm text-muted-foreground">Your Orders</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-primary">4.5</div>
          <div className="text-sm text-muted-foreground">Avg Rating</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-primary">15m</div>
          <div className="text-sm text-muted-foreground">Avg Wait Time</div>
        </Card>
      </div>
    </div>
  );
}