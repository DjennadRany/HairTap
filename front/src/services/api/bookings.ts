import api from './axios';

export interface Booking {
  _id: string;
  client: string | any; // Peut être ObjectId ou objet User
  coiffeur: string | any; // Peut être ObjectId ou objet User
  service: string;
  serviceId?: string;
  coiffeurId?: string;
  clientId?: string;
  date: string;
  time?: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus?: 'pending' | 'paid' | 'refunded';
  price: number;
  mode: 'salon' | 'domicile';
  notes?: string;
  address?: {
    street: string;
    streetNumber?: string;
    city: string;
    postalCode: string;
    country?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  // Informations Stripe
  stripePaymentIntentId?: string;
  stripeCustomerId?: string;
  platformFee?: number;
  coiffeurAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingData {
  serviceId: string;
  coiffeurId: string;
  date: string;
  time: string;
  notes?: string;
  address?: {
    street: string;
    streetNumber?: string;
    city: string;
    postalCode: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
}

export interface BookingResponse {
  success: boolean;
  data?: Booking;
  message?: string;
}

class BookingService {
  // Créer une réservation
  async createBooking(bookingData: CreateBookingData): Promise<BookingResponse> {
    try {
      const response = await api.post('/bookings', bookingData);
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la création de la réservation:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la création de la réservation'
      };
    }
  }

  // Récupérer les réservations d'un utilisateur
  async getUserBookings(userId: string): Promise<Booking[]> {
    try {
      const response = await api.get(`/bookings/user/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la récupération des réservations:', error);
      return [];
    }
  }

  // Récupérer les réservations du client connecté
  async getClientBookings(): Promise<Booking[]> {
    try {
      const response = await api.get('/bookings/client');
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la récupération des réservations du client:', error);
      return [];
    }
  }

  // Récupérer les réservations d'un coiffeur
  async getCoiffeurBookings(coiffeurId: string): Promise<Booking[]> {
    try {
      const response = await api.get(`/bookings/coiffeur/${coiffeurId}`);
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la récupération des réservations du coiffeur:', error);
      return [];
    }
  }

  // Annuler une réservation
  async cancelBooking(bookingId: string, reason?: string): Promise<BookingResponse> {
    try {
      const response = await api.post(`/bookings/${bookingId}/cancel`, { reason });
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de l\'annulation de la réservation:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de l\'annulation de la réservation'
      };
    }
  }

  // Confirmer une réservation
  async confirmBooking(bookingId: string): Promise<BookingResponse> {
    try {
      const response = await api.put(`/bookings/${bookingId}/confirm`);
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la confirmation de la réservation:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la confirmation de la réservation'
      };
    }
  }

  // Marquer une réservation comme terminée
  async completeBooking(bookingId: string): Promise<BookingResponse> {
    try {
      const response = await api.put(`/bookings/${bookingId}/complete`);
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la finalisation de la réservation:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la finalisation de la réservation'
      };
    }
  }

  // Récupérer une réservation par ID
  async getBookingById(bookingId: string): Promise<Booking | null> {
    try {
      const response = await api.get(`/bookings/${bookingId}`);
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la récupération de la réservation:', error);
      return null;
    }
  }

  // Mettre à jour une réservation
  async updateBooking(bookingId: string, updateData: Partial<CreateBookingData> & { status?: Booking['status'] }): Promise<BookingResponse> {
    try {
      const response = await api.put(`/bookings/${bookingId}`, updateData);
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour de la réservation:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la mise à jour de la réservation'
      };
    }
  }
}

export const bookingService = new BookingService();
