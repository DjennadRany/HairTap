import api from '../../api/httpClient';

export interface WorkingSlot {
  _id: string;
  dayOfWeek: number;
  startTime: number;
  endTime: number;
  availableAt?: 'salon' | 'domicile' | 'both';
  status: 'available' | 'booked' | 'maintenance' | 'unavailable';
  maxBookings?: number;
  currentBookings?: number;
}

interface WorkingSlotResponse {
  success: boolean;
  data?: WorkingSlot[];
  message?: string;
}

class WorkingSlotsService {
  async getCoiffeurSlots(coiffeurId: string, activeOnly = true): Promise<WorkingSlotResponse> {
    if (!coiffeurId) {
      return { success: false, data: [], message: 'Identifiant coiffeur manquant' };
    }

    try {
      const response = await api.get<WorkingSlotResponse>(`/working-slots/coiffeur/${coiffeurId}`, {
        params: { activeOnly }
      });

      const payload = response.data;
      const slots = Array.isArray(payload)
        ? payload
        : Array.isArray(payload.data)
          ? payload.data
          : [];

      return {
        success: (payload as WorkingSlotResponse).success ?? true,
        data: slots
      };
    } catch (error: any) {
      console.error('Erreur lors de la récupération des créneaux du coiffeur:', error);
      return {
        success: false,
        data: [],
        message: error?.response?.data?.message ?? 'Impossible de récupérer les créneaux'
      };
    }
  }
}

const workingSlotsService = new WorkingSlotsService();

export default workingSlotsService;
export type { WorkingSlotResponse };
