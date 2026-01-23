const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Types
export interface User {
  user_id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  upi_id?: string;
  created_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  upi_id?: string;
}

export interface Canteen {
  canteen_id: number;
  name: string;
  location: string;
  contact: string;
  description: string;
  opening_hours: Record<string, string>;
  created_at: string;
}

export interface MenuItem {
  item_id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  is_veg: boolean;
  vegetarian: boolean;
  image_url?: string;
  available_quantity: number;
  available: number;
  is_available: boolean;
  rating: number;
  total_ratings: number;
  canteen_id: number;
  canteen_name?: string;
  canteen_location?: string;
  created_at: string;
}

export interface CartItem {
  cart_id: number;
  quantity: number;
  item_id: number;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  vegetarian: boolean;
  available_quantity: number;
  canteen_id: number;
  canteen_name: string;
  item_total: number;
  created_at: string;
}

export interface CartSummary {
  total_items: number;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
}

export interface CartResponse {
  cart_items: CartItem[];
  summary: CartSummary;
}

export interface Order {
  order_id: string;
  pickup_time: string;
  total_amount: number;
  payment_status: string;
  order_status: string;
  created_at: string;
  canteen_name: string;
  canteen_location: string;
  total_items: number;
  special_instructions?: string;
  payment_method?: string;
}

export interface OrderDetails extends Order {
  user_id: string;
  canteen_id: number;
  subtotal_amount: number;
  tax_amount: number;
  transaction_id?: string;
  user_name: string;
  user_phone: string;
  user_email: string;
  items: OrderItem[];
  payment?: Payment;
}

export interface OrderItem {
  id: number;
  order_id: string;
  item_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  item_name: string;
  item_description: string;
  vegetarian: boolean;
  created_at: string;
}

export interface Payment {
  payment_id: string;
  amount: number;
  payment_mode: string;
  transaction_ref?: string;
  payment_status: string;
  upi_link?: string;
  qr_code_url?: string;
  merchant_upi?: string;
  expires_at?: string;
}

export interface CreateOrderRequest {
  pickup_time: string;
  special_instructions?: string;
  payment_method: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    message: string;
    statusCode: number;
  };
  count?: number;
}

// API Helper Functions
class APIError extends Error {
  constructor(public statusCode: number, message: string, public response?: any) {
    super(message);
    this.name = 'APIError';
  }
}

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('campusEats_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  const data = await response.json() as ApiResponse<T>;
  
  if (!response.ok) {
    throw new APIError(
      response.status, 
      data.error?.message || data.message || 'Request failed',
      data
    );
  }

  if (!data.success) {
    throw new APIError(
      data.error?.statusCode || 400,
      data.error?.message || data.message || 'Request failed',
      data
    );
  }

  return data.data as T;
};

const apiRequest = async <T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    headers: getAuthHeaders(),
    ...options,
  };

  try {
    const response = await fetch(url, config);
    return await handleResponse<T>(response);
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(0, 'Network error or server unavailable');
  }
};

// Authentication API
export const authAPI = {
  register: async (userData: RegisterRequest): Promise<{ user: User; token: string; sessionId: string }> => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  login: async (credentials: LoginRequest): Promise<{ user: User; token: string; sessionId: string }> => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  getProfile: async (): Promise<{ user: User }> => {
    return apiRequest('/auth/profile');
  },

  updateProfile: async (userData: Partial<User>): Promise<{ user: User }> => {
    return apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  changePassword: async (passwordData: { currentPassword: string; newPassword: string }): Promise<void> => {
    return apiRequest('/auth/password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  },

  logout: async (): Promise<void> => {
    return apiRequest('/auth/logout', {
      method: 'POST',
    });
  },
};

// Canteens API
export const canteensAPI = {
  getCanteens: async (): Promise<{ canteens: Canteen[] }> => {
    return apiRequest('/canteens');
  },

  getCanteen: async (id: number): Promise<{ canteen: Canteen }> => {
    return apiRequest(`/canteens/${id}`);
  },

  getCanteenMenu: async (
    id: number, 
    filters?: { category?: string; is_veg?: boolean; available_only?: boolean }
  ): Promise<{ canteen_id: number; menu_items: MenuItem[]; menu_by_category: Record<string, MenuItem[]> }> => {
    const queryParams = new URLSearchParams();
    if (filters?.category) queryParams.append('category', filters.category);
    if (filters?.is_veg !== undefined) queryParams.append('is_veg', filters.is_veg.toString());
    if (filters?.available_only) queryParams.append('available_only', 'true');
    
    const queryString = queryParams.toString();
    return apiRequest(`/canteens/${id}/menu${queryString ? `?${queryString}` : ''}`);
  },

  searchMenuItems: async (
    query: string,
    filters?: { 
      category?: string; 
      is_veg?: boolean; 
      min_price?: number; 
      max_price?: number; 
      canteen_id?: number 
    }
  ): Promise<{ search_query: string; menu_items: MenuItem[] }> => {
    const queryParams = new URLSearchParams({ q: query });
    if (filters?.category) queryParams.append('category', filters.category);
    if (filters?.is_veg !== undefined) queryParams.append('is_veg', filters.is_veg.toString());
    if (filters?.min_price !== undefined) queryParams.append('min_price', filters.min_price.toString());
    if (filters?.max_price !== undefined) queryParams.append('max_price', filters.max_price.toString());
    if (filters?.canteen_id) queryParams.append('canteen_id', filters.canteen_id.toString());
    
    return apiRequest(`/canteens/search?${queryParams.toString()}`);
  },
};

// Cart API
export const cartAPI = {
  getCart: async (): Promise<CartResponse> => {
    return apiRequest('/cart');
  },

  addToCart: async (itemData: { item_id: number; quantity: number }): Promise<{ item: { item_id: number; name: string; price: number; canteen_name: string }; quantity: number }> => {
    return apiRequest('/cart', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  },

  updateCartItem: async (cartId: number, quantity: number): Promise<void> => {
    return apiRequest(`/cart/${cartId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  },

  removeFromCart: async (cartId: number): Promise<void> => {
    return apiRequest(`/cart/${cartId}`, {
      method: 'DELETE',
    });
  },

  clearCart: async (): Promise<void> => {
    return apiRequest('/cart', {
      method: 'DELETE',
    });
  },

  getCartSummary: async (): Promise<{ canteen: { canteen_id: number; name: string }; items: any[]; summary: CartSummary }> => {
    return apiRequest('/cart/summary');
  },
};

// Orders API
export const ordersAPI = {
  getUserOrders: async (filters?: { status?: string; limit?: number; offset?: number }): Promise<{ orders: Order[] }> => {
    const queryParams = new URLSearchParams();
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());
    if (filters?.offset) queryParams.append('offset', filters.offset.toString());
    
    const queryString = queryParams.toString();
    return apiRequest(`/orders${queryString ? `?${queryString}` : ''}`);
  },

  createOrder: async (orderData: CreateOrderRequest): Promise<{ order_id: string; canteen: { canteen_id: number; name: string }; pickup_time: string; total_amount: number; payment_method: string; payment_status: string }> => {
    return apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  getOrderDetails: async (orderId: string): Promise<{ order: OrderDetails }> => {
    return apiRequest(`/orders/${orderId}`);
  },

  cancelOrder: async (orderId: string): Promise<void> => {
    return apiRequest(`/orders/${orderId}/cancel`, {
      method: 'PATCH',
    });
  },

  getOrderStats: async (): Promise<{ statistics: { total_orders: number; completed_orders: number; cancelled_orders: number; paid_orders: number; total_spent: number; average_order_value: number } }> => {
    return apiRequest('/orders/stats');
  },
};

// Payments API
export const paymentsAPI = {
  initiatePayment: async (paymentData: { order_id: string; amount: number; upi_id?: string }): Promise<Payment & { instructions: { scan_qr: string; manual_payment: string; reference: string } }> => {
    return apiRequest('/payments/initiate', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },

  verifyPayment: async (verificationData: { order_id: string; transaction_ref: string; upi_ref_id: string; amount: number }): Promise<{ payment_id: string; order_id: string; transaction_ref: string; amount: number; status: string; verified_at: string }> => {
    return apiRequest('/payments/verify', {
      method: 'POST',
      body: JSON.stringify(verificationData),
    });
  },

  getPaymentStatus: async (paymentId: string): Promise<Payment> => {
    return apiRequest(`/payments/${paymentId}/status`);
  },

  getPaymentHistory: async (filters?: { limit?: number; offset?: number; status?: string }): Promise<{ payments: Payment[] }> => {
    const queryParams = new URLSearchParams();
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());
    if (filters?.offset) queryParams.append('offset', filters.offset.toString());
    if (filters?.status) queryParams.append('status', filters.status);
    
    const queryString = queryParams.toString();
    return apiRequest(`/payments${queryString ? `?${queryString}` : ''}`);
  },
};

// Receipts API
export const receiptsAPI = {
  getReceiptData: async (orderId: string): Promise<any> => {
    return apiRequest(`/receipts/${orderId}`);
  },

  getReceiptHTML: async (orderId: string): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/receipts/${orderId}/html`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new APIError(response.status, 'Failed to fetch receipt HTML');
    }
    
    return response.text();
  },

  downloadReceiptPDF: async (orderId: string): Promise<Blob> => {
    const response = await fetch(`${API_BASE_URL}/receipts/${orderId}/pdf`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new APIError(response.status, 'Failed to download receipt PDF');
    }
    
    return response.blob();
  },
};

// Admin Types
export interface Admin {
  admin_id: string;
  name: string;
  username: string;
  role: string;
  canteen: {
    canteen_id: number;
    name: string;
    location: string;
  };
}

export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface AdminOrder extends Order {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_role: string;
  total_items: number;
  items?: AdminOrderItem[];
}

export interface AdminOrderItem {
  quantity: number;
  unit_price: number;
  total_price: number;
  item_name: string;
  is_veg?: boolean;
  category?: string;
}

export interface AdminMenuItem extends MenuItem {
  preparation_time: number;
  updated_at: string;
}

export interface AddMenuItemRequest {
  name: string;
  description?: string;
  price: number;
  category: string;
  is_veg?: boolean;
  available_quantity?: number;
  preparation_time?: number;
  image_url?: string;
}

export interface UpdateMenuItemRequest {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  is_veg?: boolean;
  is_available?: boolean;
  available_quantity?: number;
  preparation_time?: number;
  image_url?: string;
}

export interface DashboardStats {
  today_stats: {
    orders: Array<{ order_status: string; count: number; revenue: number }>;
    date: string;
  };
  revenue_trend: Array<{ date: string; orders: number; revenue: number }>;
  menu_stats: {
    total_items: number;
    available_items: number;
    out_of_stock: number;
  };
  recent_orders: Array<{
    order_id: string;
    order_status: string;
    total_amount: number;
    created_at: string;
    customer_name: string;
  }>;
}

// Admin API helper functions
const getAdminAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('campusEats_admin_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

const adminApiRequest = async <T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    headers: getAdminAuthHeaders(),
    ...options,
  };

  try {
    const response = await fetch(url, config);
    return await handleResponse<T>(response);
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(0, 'Network error or server unavailable');
  }
};

// Admin Authentication API
export const adminAuthAPI = {
  login: async (credentials: AdminLoginRequest): Promise<{ admin: Admin; token: string }> => {
    const response = await fetch(`${API_BASE_URL}/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return await handleResponse<{ admin: Admin; token: string }>(response);
  },

  getProfile: async (): Promise<{ admin: Admin }> => {
    return adminApiRequest('/admin/auth/profile');
  },

  logout: async (): Promise<void> => {
    return adminApiRequest('/admin/auth/logout', {
      method: 'POST',
    });
  },
};

// Admin Menu Management API
export const adminMenuAPI = {
  getMenu: async (filters?: { category?: string; available_only?: boolean }): Promise<{ menu_items: AdminMenuItem[]; menu_by_category: Record<string, AdminMenuItem[]> }> => {
    const queryParams = new URLSearchParams();
    if (filters?.category) queryParams.append('category', filters.category);
    if (filters?.available_only) queryParams.append('available_only', 'true');
    
    const queryString = queryParams.toString();
    return adminApiRequest(`/admin/menu${queryString ? `?${queryString}` : ''}`);
  },

  addMenuItem: async (itemData: AddMenuItemRequest): Promise<{ menu_item: AdminMenuItem }> => {
    return adminApiRequest('/admin/menu', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  },

  updateMenuItem: async (itemId: number, itemData: UpdateMenuItemRequest): Promise<{ menu_item: AdminMenuItem }> => {
    return adminApiRequest(`/admin/menu/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(itemData),
    });
  },

  updateQuantity: async (itemId: number, quantityChange: number): Promise<{ item_id: number; old_quantity: number; quantity_change: number; new_quantity: number; is_available: boolean }> => {
    return adminApiRequest(`/admin/menu/${itemId}/quantity`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity_change: quantityChange }),
    });
  },
};

// Admin Order Management API
export const adminOrderAPI = {
  getOrders: async (filters?: { status?: string; date?: string; limit?: number; offset?: number }): Promise<{ orders: AdminOrder[] }> => {
    const queryParams = new URLSearchParams();
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.date) queryParams.append('date', filters.date);
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());
    if (filters?.offset) queryParams.append('offset', filters.offset.toString());
    
    const queryString = queryParams.toString();
    return adminApiRequest(`/admin/orders${queryString ? `?${queryString}` : ''}`);
  },

  updateOrderStatus: async (orderId: string, orderStatus: string): Promise<{ order_id: string; old_status: string; new_status: string }> => {
    return adminApiRequest(`/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ order_status: orderStatus }),
    });
  },
};

// Admin Dashboard API
export const adminDashboardAPI = {
  getStats: async (): Promise<DashboardStats> => {
    return adminApiRequest('/admin/dashboard/stats');
  },
};
