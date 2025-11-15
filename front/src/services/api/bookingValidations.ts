import api from '../../api/httpClient';

export type BookingAlertAction =
  | 'regularize'
  | 'confirm_service'
  | 'report_incident'
  | 'view_details';

export interface BookingAlert {
  id: string;
  bookingId: string;
  type:
    | 'past_booking_needs_regularization'
    | 'awaiting_confirmation'
    | 'incident_report_required'
    | 'payment_issue'
    | 'custom';
  title: string;
  message: string;
  action?: BookingAlertAction;
  status?: 'pending' | 'resolved' | 'acknowledged';
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface BookingAlertResponse {
  success: boolean;
  data?: BookingAlert[];
  message?: string;
}

class BookingValidationService {
  private normaliseAlertPayload(payload: any): BookingAlert[] {
    if (!payload) {
      return [];
    }

    if (Array.isArray(payload)) {
      return payload.map(this.transformAlert);
    }

    if (Array.isArray(payload.alerts)) {
      return payload.alerts.map(this.transformAlert);
    }

    return [];
  }

  private transformAlert = (alert: any): BookingAlert => ({
    id: alert?.id ?? alert?._id ?? alert?.alertId ?? '',
    bookingId: alert?.bookingId ?? alert?.booking?.id ?? alert?.booking?._id ?? '',
    type: alert?.type ?? 'custom',
    title: alert?.title ?? alert?.message ?? 'Notification',
    message: alert?.message ?? alert?.description ?? '',
    action: alert?.action ?? undefined,
    status: alert?.status ?? 'pending',
    createdAt: alert?.createdAt ?? alert?.timestamp ?? new Date().toISOString(),
    metadata: alert?.metadata ?? {}
  });

  async getClientAlerts(clientId: string): Promise<BookingAlertResponse> {
    if (!clientId) {
      return { success: false, data: [], message: 'Client ID manquant' };
    }

    try {
      const response = await api.get(`/booking-validations/clients/${clientId}/alerts`);
      const alerts = this.normaliseAlertPayload(response.data);
      return { success: true, data: alerts };
    } catch (error: any) {
      console.error('Erreur lors de la récupération des alertes client:', error);
      return {
        success: false,
        data: [],
        message: error?.response?.data?.message ?? 'Impossible de récupérer les alertes client'
      };
    }
  }

  async getCoiffeurAlerts(coiffeurId: string): Promise<BookingAlertResponse> {
    if (!coiffeurId) {
      return { success: false, data: [], message: 'Identifiant coiffeur manquant' };
    }

    try {
      const response = await api.get(`/booking-validations/coiffeurs/${coiffeurId}/alerts`);
      const alerts = this.normaliseAlertPayload(response.data);
      return { success: true, data: alerts };
    } catch (error: any) {
      console.error('Erreur lors de la récupération des alertes coiffeur:', error);
      return {
        success: false,
        data: [],
        message: error?.response?.data?.message ?? 'Impossible de récupérer les alertes coiffeur'
      };
    }
  }

  async acknowledgeAlert(alertId: string): Promise<{ success: boolean; message?: string }> {
    if (!alertId) {
      return { success: false, message: 'Identifiant d\'alerte manquant' };
    }

    try {
      await api.post(`/booking-validations/alerts/${alertId}/acknowledge`);
      return { success: true };
    } catch (error: any) {
      console.error('Erreur lors de l\'accusé de réception de l\'alerte:', error);
      return {
        success: false,
        message: error?.response?.data?.message ?? 'Impossible de mettre à jour l\'alerte'
      };
    }
  }

  async resolveAlert(
    alertId: string,
    payload?: { notes?: string; metadata?: Record<string, unknown> }
  ): Promise<{ success: boolean; message?: string }> {
    if (!alertId) {
      return { success: false, message: 'Identifiant d\'alerte manquant' };
    }

    try {
      await api.post(`/booking-validations/alerts/${alertId}/resolve`, payload ?? {});
      return { success: true };
    } catch (error: any) {
      console.error('Erreur lors de la résolution de l\'alerte:', error);
      return {
        success: false,
        message: error?.response?.data?.message ?? 'Impossible de résoudre l\'alerte'
      };
    }
  }
}

const bookingValidationService = new BookingValidationService();

export default bookingValidationService;

