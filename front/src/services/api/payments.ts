import api from '../../api/httpClient';

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret: string;
}

export interface OrderData {
  productId: string;
  quantity: number;
  deliveryOption: 'pickup' | 'delivery';
  deliveryAddress?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

export const paymentService = {
  // Créer une intention de paiement pour un produit
  async createPaymentIntent(orderData: OrderData): Promise<PaymentIntent> {
    const response = await api.post<PaymentIntent>('/payments/create-payment-intent', orderData);
    return response.data;
  },

  // Confirmer un paiement
  async confirmPayment(paymentIntentId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/payments/confirm', { paymentIntentId });
    return response.data;
  },

  // Récupérer l'historique des paiements
  async getPaymentHistory(): Promise<any[]> {
    const response = await api.get('/payments/history');
    return response.data;
  },

  // Récupérer les statistiques de paiement pour un coiffeur
  async getCoiffeurPaymentStats(coiffeurId: string): Promise<any> {
    const response = await api.get(`/payments/coiffeur/${coiffeurId}/stats`);
    return response.data;
  }
}; 