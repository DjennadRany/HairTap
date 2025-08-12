import api from './axios';
import type { ConnectionStatus } from '../../components/ConnectionIndicator';

export interface ConnectionData {
  userId: string;
  isOnline: boolean;
  lastSeen: Date;
  status: 'online' | 'busy' | 'offline' | 'away';
  availability: {
    isAvailable: boolean;
    nextAvailable?: Date;
    workingHours: {
      [key: string]: {
        start: string;
        end: string;
        isAvailable: boolean;
      };
    };
  };
  chatSettings: {
    autoReply: boolean;
    awayMessage: string;
    notificationPreferences: {
      email: boolean;
      push: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export const connectionService = {
  // Mettre à jour le statut de connexion
  async updateStatus(status: string, isAvailable?: boolean): Promise<ConnectionData> {
    const response = await api.post<ConnectionData>('/connections/status', {
      status,
      isAvailable
    });
    return response.data;
  },

  // Récupérer le statut de connexion d'un utilisateur
  async getStatus(userId: string): Promise<ConnectionStatus> {
    try {
      const response = await api.get<ConnectionData>(`/connections/status/${userId}`);
      const data = response.data;
      
      // Vérifier si l'utilisateur est vraiment en ligne
      const now = new Date();
      const lastSeen = new Date(data.lastSeen);
      const timeDiff = now.getTime() - lastSeen.getTime();
      const timeoutMinutes = 2; // 2 minutes de timeout
      
      // Si lastSeen est trop ancien, considérer comme hors ligne
      const isReallyOnline = data.isOnline && timeDiff < (timeoutMinutes * 60 * 1000);
      
      return {
        isOnline: isReallyOnline,
        lastSeen: data.lastSeen,
        status: isReallyOnline ? data.status : 'offline',
        availability: {
          isAvailable: isReallyOnline && data.availability.isAvailable,
          nextAvailable: data.availability.nextAvailable,
          workingHours: data.availability.workingHours
        }
      };
    } catch (error) {
      console.error('Erreur lors de la récupération du statut:', error);
      // Retourner un statut hors ligne par défaut en cas d'erreur
      return {
        isOnline: false,
        lastSeen: new Date(),
        status: 'offline',
        availability: {
          isAvailable: false,
          workingHours: {
            monday: { start: '09:00', end: '18:00', isAvailable: false },
            tuesday: { start: '09:00', end: '18:00', isAvailable: false },
            wednesday: { start: '09:00', end: '18:00', isAvailable: false },
            thursday: { start: '09:00', end: '18:00', isAvailable: false },
            friday: { start: '09:00', end: '18:00', isAvailable: false },
            saturday: { start: '09:00', end: '18:00', isAvailable: false },
            sunday: { start: '09:00', end: '18:00', isAvailable: false }
          }
        }
      };
    }
  },

  // Récupérer tous les utilisateurs en ligne
  async getOnlineUsers(): Promise<ConnectionData[]> {
    const response = await api.get<ConnectionData[]>('/connections/online');
    return response.data;
  },

  // Ping de connexion
  async ping(): Promise<void> {
    await api.post('/connections/ping');
  },

  // Se déconnecter
  async logout(): Promise<void> {
    await api.post('/connections/logout');
  },

  // Mettre à jour les paramètres de chat
  async updateChatSettings(settings: {
    autoReply: boolean;
    awayMessage: string;
    notificationPreferences: {
      email: boolean;
      push: boolean;
    };
  }): Promise<ConnectionData> {
    const response = await api.put<ConnectionData>('/connections/chat-settings', settings);
    return response.data;
  }
}; 