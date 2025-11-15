import api from '../../api/httpClient';

export interface Order {
  _id: string;
  product: {
    _id: string;
    name: string;
    price: number;
    images?: string[];
  };
  coiffeur: {
    _id: string;
    name: string;
  };
  customer: {
    _id: string;
    name: string;
    email: string;
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  deliveryOption: 'pickup' | 'delivery' | 'coiffeur';
  deliveryAddress?: string;
  deliveryFee: number;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: 'stripe' | 'paypal' | 'manual' | 'pending';
  paymentIntentId?: string;
  notes?: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderData {
  productId: string;
  coiffeurId: string;
  quantity: number;
  deliveryOption: 'pickup' | 'delivery' | 'coiffeur';
  deliveryAddress?: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  paidOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
}

export const orderService = {
  // Créer une nouvelle commande
  async createOrder(orderData: CreateOrderData): Promise<Order> {
    const response = await api.post<Order>('/orders/create', orderData);
    return response.data;
  },

  // Récupérer les commandes d'un coiffeur
  async getCoiffeurOrders(coiffeurId: string, status?: string): Promise<Order[]> {
    const params = status ? { status } : {};
    const response = await api.get<Order[]>(`/orders/coiffeur/${coiffeurId}`, { params });
    return response.data;
  },

  // Récupérer les commandes d'un client
  async getCustomerOrders(customerId: string): Promise<Order[]> {
    const response = await api.get<Order[]>(`/orders/customer/${customerId}`);
    return response.data;
  },

  // Mettre à jour le statut d'une commande
  async updateOrderStatus(orderId: string, status: Order['status']): Promise<Order> {
    const response = await api.put<Order>(`/orders/${orderId}/status`, { status });
    return response.data;
  },

  // Récupérer les statistiques de ventes pour un coiffeur
  async getCoiffeurOrderStats(coiffeurId: string): Promise<OrderStats> {
    const response = await api.get<OrderStats>(`/orders/coiffeur/${coiffeurId}/stats`);
    return response.data;
  }
}; 