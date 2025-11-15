import httpClient from '../../api/httpClient';

export interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  bookingId: string;
  fromUserId: string | any;
  toUserId: string | any;
  status: 'pending' | 'approved' | 'rejected' | 'read';
  read: boolean;
  metadata?: {
    reason?: string;
    regularizationDate?: string;
    confirmationDate?: string;
    rejectionReason?: string;
    rejectionDate?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  success: boolean;
  data?: Notification[];
  message?: string;
}

class NotificationService {
  // Récupérer les notifications de régularisation en attente pour le coiffeur
  async getRegularizationNotifications(coiffeurId: string): Promise<NotificationResponse> {
    try {
      const response = await httpClient.get(`/notifications/regularization/${coiffeurId}`);
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la récupération des notifications de régularisation:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la récupération des notifications'
      };
    }
  }

  // Récupérer toutes les notifications du coiffeur
  async getCoiffeurNotifications(coiffeurId: string): Promise<NotificationResponse> {
    try {
      const response = await httpClient.get(`/notifications/coiffeur/${coiffeurId}`);
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la récupération des notifications:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la récupération des notifications'
      };
    }
  }

  // Marquer une notification comme lue
  async markAsRead(notificationId: string): Promise<NotificationResponse> {
    try {
      const response = await httpClient.put(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors du marquage de la notification comme lue:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors du marquage de la notification'
      };
    }
  }
}

export const notificationService = new NotificationService();

