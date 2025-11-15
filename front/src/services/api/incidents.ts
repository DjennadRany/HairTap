import api from '../../api/httpClient';

export type IncidentType =
  | 'retard_client'
  | 'retard_coiffeur'
  | 'client_no_show'
  | 'coiffeur_no_show'
  | 'payment_issue'
  | 'quality_issue'
  | 'other';

export interface IncidentPayload {
  bookingId: string;
  type: IncidentType;
  description: string;
  metadata?: Record<string, unknown>;
}

export interface IncidentResponse {
  success: boolean;
  message?: string;
  data?: any;
}

class IncidentService {
  async reportIncident(payload: IncidentPayload): Promise<IncidentResponse> {
    try {
      const response = await api.post('/incidents', payload);
      return response.data ?? { success: true, data: response.data };
    } catch (error: any) {
      console.error('Erreur lors du signalement d\'un incident:', error);
      return {
        success: false,
        message: error?.response?.data?.message ?? 'Impossible de signaler l\'incident'
      };
    }
  }

  async getIncidentsForBooking(bookingId: string): Promise<IncidentResponse> {
    if (!bookingId) {
      return { success: false, message: 'Identifiant de réservation manquant' };
    }

    try {
      const response = await api.get(`/incidents/booking/${bookingId}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Erreur lors de la récupération des incidents:', error);
      return {
        success: false,
        message: error?.response?.data?.message ?? 'Impossible de récupérer les incidents'
      };
    }
  }
}

export const incidentService = new IncidentService();

