import api from './axios';

export interface Booking {
  _id: string;
  client: string;
  coiffeur: string;
  service: string;
  date: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  price: number;
  mode: 'salon' | 'domicile';
  address?: {
    street: string;
    city: string;
    postalCode: string;
  };
  notes?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingData {
  coiffeur: string;
  service: string;
  date: string;
  mode: 'salon' | 'domicile';
  address?: {
    street: string;
    city: string;
    postalCode: string;
  };
  notes?: string;
}

export interface UpdateBookingData {
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  paymentStatus?: 'pending' | 'paid' | 'refunded';
  notes?: string;
  cancellationReason?: string;
}

export const bookingService = {
  // Récupérer les réservations du client connecté
  getClientBookings: async () => {
    const response = await api.get('/bookings/client');
    return response.data;
  },

  // Récupérer les réservations d'un coiffeur
  getCoiffeurBookings: async (coiffeurId: string) => {
    const response = await api.get(`/bookings/coiffeur/${coiffeurId}`);
    return response.data;
  },

  // Créer une nouvelle réservation - AVEC VALIDATION
  createBooking: async (bookingData: any): Promise<{ success: boolean; data: any; message: string }> => {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  },

  // Mettre à jour une réservation
  updateBooking: async (bookingId: string, bookingData: any) => {
    const response = await api.put(`/bookings/${bookingId}`, bookingData);
    return response.data;
  },

  // Annuler une réservation
  cancelBooking: async (bookingId: string, reason: string) => {
    const response = await api.post(`/bookings/${bookingId}/cancel`, { reason });
    return response.data;
  },

  // Confirmer une réservation
  confirmBooking: async (bookingId: string) => {
    const response = await api.post(`/bookings/${bookingId}/confirm`);
    return response.data;
  },

  // Terminer une réservation
  completeBooking: async (bookingId: string) => {
    const response = await api.post(`/bookings/${bookingId}/complete`);
    return response.data;
  },

  // Supprimer une réservation
  deleteBooking: async (bookingId: string) => {
    const response = await api.delete(`/bookings/${bookingId}`);
    return response.data;
  }
}; 