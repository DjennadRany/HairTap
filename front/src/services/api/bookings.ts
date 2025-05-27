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
  async getBookings(): Promise<Booking[]> {
    const response = await api.get<Booking[]>('/bookings');
    return response.data;
  },

  async getBooking(id: string): Promise<Booking> {
    const response = await api.get<Booking>(`/bookings/${id}`);
    return response.data;
  },

  async createBooking(data: CreateBookingData): Promise<Booking> {
    const response = await api.post<Booking>('/bookings', data);
    return response.data;
  },

  async updateBooking(id: string, data: UpdateBookingData): Promise<Booking> {
    const response = await api.patch<Booking>(`/bookings/${id}`, data);
    return response.data;
  },

  async cancelBooking(id: string, reason: string): Promise<Booking> {
    const response = await api.post<Booking>(`/bookings/${id}/cancel`, { reason });
    return response.data;
  },

  async getClientBookings(): Promise<Booking[]> {
    const response = await api.get<Booking[]>('/bookings/client');
    return response.data;
  },

  async getCoiffeurBookings(): Promise<Booking[]> {
    const response = await api.get<Booking[]>('/bookings/coiffeur');
    return response.data;
  }
}; 