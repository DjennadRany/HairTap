import axios from './axios';

export interface ConnectionStatus {
  isOnline: boolean;
  status: 'online' | 'busy' | 'offline' | 'away';
  lastSeen: Date;
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
}

class ConnectionService {
  private cache = new Map<string, { data: ConnectionStatus; timestamp: number }>();
  private readonly CACHE_DURATION = 30000; // 30 secondes

  // Récupérer le statut d'un utilisateur avec cache intelligent
  async getUserStatus(userId: string): Promise<ConnectionStatus> {
    const now = Date.now();
    const cached = this.cache.get(userId);
    
    // Utiliser le cache si il est encore valide
    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      // Essayer d'abord avec le service de connexion
      const response = await axios.get(`/connections/status/${userId}`);
      const status = this.normalizeStatus(response.data);
      
      // Mettre en cache
      this.cache.set(userId, { data: status, timestamp: now });
      
      return status;
    } catch (error) {
      console.warn(`Impossible de récupérer le statut de ${userId}, utilisation du cache ou statut par défaut`);
      
      // Retourner le cache expiré ou un statut par défaut
      if (cached) {
        return cached.data;
      }
      
      return {
        isOnline: false,
        status: 'offline',
        lastSeen: new Date(),
        availability: { isAvailable: false }
      };
    }
  }

  // Mettre à jour le statut de l'utilisateur connecté
  async updateMyStatus(status: string, isAvailable?: boolean): Promise<ConnectionStatus> {
    try {
      const response = await axios.post('/connections/status', { status, isAvailable });
      const updatedStatus = this.normalizeStatus(response.data);
      
      // Mettre à jour le cache
      this.cache.set(response.data.userId, { 
        data: updatedStatus, 
        timestamp: Date.now() 
      });
      
      return updatedStatus;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      throw error;
    }
  }

  // Normaliser le format des données de statut
  private normalizeStatus(data: any): ConnectionStatus {
    return {
      isOnline: data.isOnline || false,
      status: data.status || 'offline',
      lastSeen: data.lastSeen ? new Date(data.lastSeen) : new Date(),
      availability: {
        isAvailable: data.availability?.isAvailable || false,
        nextAvailable: data.availability?.nextAvailable ? new Date(data.availability.nextAvailable) : undefined,
        workingHours: data.availability?.workingHours || {
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

  // Vider le cache pour un utilisateur spécifique
  clearCache(userId: string) {
    this.cache.delete(userId);
  }

  // Vider tout le cache
  clearAllCache() {
    this.cache.clear();
  }

  // Récupérer le statut depuis le cache (sans appel API)
  getCachedStatus(userId: string): ConnectionStatus | null {
    const cached = this.cache.get(userId);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }
}

export const connectionService = new ConnectionService();
