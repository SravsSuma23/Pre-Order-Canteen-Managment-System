import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface MenuItemUpdate {
  canteenId: number;
  itemId: number;
  name: string;
  availableQuantity: number;
  isAvailable: boolean;
  updatedAt: string;
  category: string;
  isVeg: boolean;
}

interface MenuItemAvailability {
  canteenId: number;
  itemId: number;
  itemName: string;
  isAvailable: boolean;
  updatedAt: string;
  type: 'availability';
}

interface LowStockAlert {
  canteenId: number;
  itemId: number;
  itemName: string;
  availableQuantity: number;
  threshold: number;
  alertType: 'low-stock';
  updatedAt: string;
}

interface MenuItemAdded {
  canteenId: number;
  menuItem: {
    item_id: number;
    name: string;
    description: string;
    price: number;
    category: string;
    is_veg: boolean;
    available_quantity: number;
    is_available: boolean;
    created_at: string;
  };
  action: 'added';
  updatedAt: string;
}

interface SocketEvents {
  onMenuItemUpdate?: (data: MenuItemUpdate) => void;
  onMenuItemAvailability?: (data: MenuItemAvailability) => void;
  onLowStockAlert?: (data: LowStockAlert) => void;
  onMenuItemAdded?: (data: MenuItemAdded) => void;
  onMenuItemRemoved?: (data: { canteenId: number; itemId: number; itemName: string; action: 'removed'; updatedAt: string }) => void;
}

export const useSocket = (canteenId?: number, events?: SocketEvents) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    // Get API base URL from environment or default
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    const socketUrl = API_BASE_URL.replace('/api', ''); // Remove /api suffix for socket connection

    // Initialize socket connection
    socketRef.current = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 5000,
      forceNew: true
    });

    const socket = socketRef.current;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket.id);
      setIsConnected(true);
      setConnectionError(null);
      
      // Join canteen room if canteenId is provided
      if (canteenId) {
        socket.emit('join-canteen', canteenId);
        console.log(`🏢 Joined canteen room: ${canteenId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    // Menu update event handlers
    if (events?.onMenuItemUpdate) {
      socket.on('menu-item-updated', events.onMenuItemUpdate);
    }

    if (events?.onMenuItemAvailability) {
      socket.on('menu-availability-changed', events.onMenuItemAvailability);
    }

    if (events?.onLowStockAlert) {
      socket.on('low-stock-alert', events.onLowStockAlert);
    }

    if (events?.onMenuItemAdded) {
      socket.on('menu-item-added', events.onMenuItemAdded);
    }

    if (events?.onMenuItemRemoved) {
      socket.on('menu-item-removed', events.onMenuItemRemoved);
    }

    // General menu updates (for menu pages)
    socket.on('menu-update', (data: MenuItemUpdate) => {
      console.log('📋 Menu update received:', data);
    });

    socket.on('availability-update', (data: MenuItemAvailability) => {
      console.log(`${data.isAvailable ? '🟢' : '🔴'} Availability update:`, data.itemName);
    });

    return () => {
      if (canteenId) {
        socket.emit('leave-canteen', canteenId);
      }
      socket.disconnect();
    };
  }, [canteenId, events]);

  // Method to join a different canteen room
  const joinCanteen = (newCanteenId: number) => {
    if (socketRef.current && isConnected) {
      if (canteenId) {
        socketRef.current.emit('leave-canteen', canteenId);
      }
      socketRef.current.emit('join-canteen', newCanteenId);
    }
  };

  // Method to leave current canteen room
  const leaveCanteen = (canteenIdToLeave: number) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leave-canteen', canteenIdToLeave);
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    connectionError,
    joinCanteen,
    leaveCanteen
  };
};

// Hook specifically for menu updates with automatic state management
export const useMenuSocket = (canteenId: number) => {
  const [menuUpdates, setMenuUpdates] = useState<MenuItemUpdate[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const socketEvents: SocketEvents = {
    onMenuItemUpdate: (data) => {
      setMenuUpdates(prev => [data, ...prev.slice(0, 49)]); // Keep last 50 updates
      setLastUpdate(new Date());
    },
    onMenuItemAvailability: (data) => {
      console.log(`Availability changed: ${data.itemName} is now ${data.isAvailable ? 'available' : 'unavailable'}`);
      setLastUpdate(new Date());
    },
    onLowStockAlert: (data) => {
      setLowStockAlerts(prev => {
        // Remove old alert for same item and add new one
        const filtered = prev.filter(alert => alert.itemId !== data.itemId);
        return [data, ...filtered.slice(0, 9)]; // Keep last 10 alerts
      });
    },
    onMenuItemAdded: (data) => {
      console.log(`New menu item added: ${data.menuItem.name}`);
      setLastUpdate(new Date());
    },
    onMenuItemRemoved: (data) => {
      console.log(`Menu item removed: ${data.itemName}`);
      setLastUpdate(new Date());
    }
  };

  const { isConnected, connectionError } = useSocket(canteenId, socketEvents);

  return {
    isConnected,
    connectionError,
    menuUpdates,
    lowStockAlerts,
    lastUpdate,
    clearUpdates: () => setMenuUpdates([]),
    clearAlerts: () => setLowStockAlerts([])
  };
};