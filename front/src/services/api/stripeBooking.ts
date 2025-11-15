import api from '../../api/httpClient';

export interface CreatePaymentIntentRequest {
  bookingId: string;
  amount: number;
}

export interface CreatePaymentIntentResponse {
  success: boolean;
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  platformFee: number;
  coiffeurAmount: number;
  message?: string;
}

export interface ConfirmPaymentRequest {
  paymentIntentId: string;
}

export interface ConfirmPaymentResponse {
  success: boolean;
  paymentIntent?: any;
  amount?: number;
  platformFee?: number;
  coiffeurAmount?: number;
  message?: string;
}

export interface CreateRefundRequest {
  bookingId: string;
  amount?: number;
  reason?: string;
}

export interface CreateRefundResponse {
  success: boolean;
  refundId: string;
  amount: number;
  message: string;
}

class StripeBookingService {
  /**
   * Créer un Payment Intent pour une réservation
   */
  async createPaymentIntent(
    bookingId: string,
    amount: number
  ): Promise<CreatePaymentIntentResponse> {
    try {
      const response = await api.post<CreatePaymentIntentResponse>(
        '/payments/create-payment-intent',
        { bookingId, amount }
      );
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur création Payment Intent:', error);
      return {
        success: false,
        clientSecret: '',
        paymentIntentId: '',
        amount: 0,
        platformFee: 0,
        coiffeurAmount: 0,
        message: error.response?.data?.message || 'Erreur lors de la création du paiement'
      };
    }
  }

  /**
   * Confirmer un paiement
   */
  async confirmPayment(
    paymentIntentId: string
  ): Promise<ConfirmPaymentResponse> {
    try {
      const response = await api.post<ConfirmPaymentResponse>(
        '/payments/confirm-payment',
        { paymentIntentId }
      );
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur confirmation paiement:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la confirmation du paiement'
      };
    }
  }

  /**
   * Créer un Setup Intent pour sauvegarder une méthode de paiement
   */
  async createSetupIntent(): Promise<{
    success: boolean;
    clientSecret: string;
    setupIntentId: string;
  }> {
    try {
      const response = await api.post('/payments/create-setup-intent');
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur création Setup Intent:', error);
      return {
        success: false,
        clientSecret: '',
        setupIntentId: ''
      };
    }
  }

  /**
   * Rembourser un paiement
   */
  async createRefund(
    bookingId: string,
    amount?: number,
    reason?: string
  ): Promise<CreateRefundResponse> {
    try {
      const response = await api.post<CreateRefundResponse>(
        '/payments/refund',
        { bookingId, amount, reason }
      );
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur remboursement:', error);
      return {
        success: false,
        refundId: '',
        amount: 0,
        message: error.response?.data?.message || 'Erreur lors du remboursement'
      };
    }
  }

  /**
   * Récupérer les informations d'un paiement
   */
  async getPaymentIntent(paymentIntentId: string): Promise<any> {
    try {
      const response = await api.get(`/payments/payment-intent/${paymentIntentId}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur récupération Payment Intent:', error);
      return null;
    }
  }

  /**
   * Lister les méthodes de paiement sauvegardées
   */
  async getPaymentMethods(): Promise<{
    success: boolean;
    paymentMethods: Array<{
      id: string;
      type: string;
      card: {
        brand: string;
        last4: string;
        expMonth: number;
        expYear: number;
      };
      billingDetails?: any;
      created: number;
    }>;
  }> {
    try {
      const response = await api.get('/payments/payment-methods');
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur récupération méthodes de paiement:', error);
      return {
        success: false,
        paymentMethods: []
      };
    }
  }

  /**
   * Supprimer une méthode de paiement
   */
  async deletePaymentMethod(paymentMethodId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const response = await api.delete(`/payments/payment-methods/${paymentMethodId}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur suppression méthode de paiement:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la suppression de la méthode de paiement'
      };
    }
  }
}

export const stripeBookingService = new StripeBookingService();

