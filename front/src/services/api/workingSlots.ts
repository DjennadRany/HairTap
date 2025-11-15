import httpClient from '../../api/httpClient';

export interface WorkingSlot {
  _id: string;
  coiffeurId: string;
  dayOfWeek: number; // 0-6 (Dimanche-Samedi)
  startTime: number; // 0-23
  endTime: number; // 0-23
  serviceTypes: string[];
  availableAt: 'salon' | 'domicile' | 'both';
  status: 'available' | 'booked' | 'maintenance' | 'unavailable';
  maxBookings: number;
  currentBookings: number;
  isRecurring: boolean;
  exceptions: Array<{
    date: string;
    reason: string;
    description?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface OpeningHours {
  monday?: { open: string; close: string; closed?: boolean };
  tuesday?: { open: string; close: string; closed?: boolean };
  wednesday?: { open: string; close: string; closed?: boolean };
  thursday?: { open: string; close: string; closed?: boolean };
  friday?: { open: string; close: string; closed?: boolean };
  saturday?: { open: string; close: string; closed?: boolean };
  sunday?: { open: string; close: string; closed?: boolean };
}

class WorkingSlotsService {
  /**
   * Récupérer les créneaux de travail d'un coiffeur
   */
  async getCoiffeurSlots(coiffeurId: string, activeOnly: boolean = true): Promise<WorkingSlot[]> {
    try {
      const response = await httpClient.get<{ success: boolean; data: WorkingSlot[] }>(
        `/working-slots/coiffeur/${coiffeurId}?activeOnly=${activeOnly}`
      );
      return response.data.data || [];
    } catch (error: any) {
      console.error('Erreur lors de la récupération des créneaux:', error);
      return [];
    }
  }

  /**
   * Récupérer les créneaux disponibles d'un coiffeur pour une date
   */
  async getAvailableSlots(
    coiffeurId: string,
    dayOfWeek?: number,
    date?: string
  ): Promise<WorkingSlot[]> {
    try {
      const params = new URLSearchParams();
      if (dayOfWeek !== undefined) params.append('dayOfWeek', dayOfWeek.toString());
      if (date) params.append('date', date);

      const response = await httpClient.get<{ success: boolean; data: WorkingSlot[] }>(
        `/working-slots/coiffeur/${coiffeurId}/available?${params.toString()}`
      );
      return response.data.data || [];
    } catch (error: any) {
      console.error('Erreur lors de la récupération des créneaux disponibles:', error);
      return [];
    }
  }
}

export const workingSlotsService = new WorkingSlotsService();








