import api from '../../api/httpClient';

export type AvailabilityState = 'free' | 'occupied' | 'unavailable';

export interface AvailabilitySlot {
  id: string;
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
  availability: AvailabilityState;
  remainingCapacity: number;
  conflict?: boolean;
  status: string;
  overlappingBookings?: Array<{
    _id?: string;
    status?: string;
    start: string | Date;
    end: string | Date;
  }>;
}

export interface AvailabilityResponse {
  success: boolean;
  data?: AvailabilitySlot[];
  message?: string;
}

export const availabilityService = {
  async fetchAvailability(
    coiffeurId: string,
    options?: { startDate?: string; endDate?: string; mode?: 'salon' | 'domicile' | 'both' }
  ): Promise<AvailabilityResponse> {
    try {
      const response = await api.get<AvailabilityResponse>('/bookings/availability', {
        params: { coiffeurId, ...options },
      });

      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la récupération des disponibilités:', error);
      return { success: false, data: [], message: error.response?.data?.message };
    }
  },
};

export default availabilityService;
