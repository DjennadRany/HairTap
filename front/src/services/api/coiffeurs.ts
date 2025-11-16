import api from '../../api/httpClient';
import { User } from '../../types/models';

const API_URL = '/coiffeurs';

export type CoiffeurSlotMode = 'salon' | 'domicile';

export interface CoiffeurSlotDTO {
  id: string;
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  supportedModes: CoiffeurSlotMode[];
  maxCapacity: number;
  remainingCapacity: number;
  isRecurring: boolean;
  status: string;
  dayOfWeek: number;
  serviceTypes: string[];
}

export interface GetCoiffeurSlotsOptions {
  startDate?: string;
  endDate?: string;
  mode?: CoiffeurSlotMode;
}

export interface SearchQuery {
  service?: string;
  specialities?: string[];
  modes?: CoiffeurSlotMode[];
  priceMin?: number;
  priceMax?: number;
  city?: string;
  date?: string;
  rating?: number;
  maxDistance?: number;
  latitude?: number;
  longitude?: number;
}

export interface SyncedGalleryItem {
  id?: string;
  origin?: 'gallery' | 'examplePhotos' | 'images';
  mediaUrl: string;
  mediaType?: 'image' | 'video';
  caption?: string;
  tags?: string[];
  likes?: number;
  createdAt?: string;
  serviceId?: string;
  serviceName?: string;
  servicePrice?: number;
  serviceDuration?: number;
  serviceCategory?: string;
  serviceDescription?: string;
}

export const coiffeurService = {
  async getCoiffeurs(): Promise<User[]> {
    const response = await api.get<User[]>('/coiffeurs');
    return response.data;
  },

  async getCoiffeur(id: string): Promise<User> {
    try {
      const response = await api.get<User>(`/coiffeurs/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur lors de la récupération du coiffeur:', error);
      
      // Si c'est une erreur 404, l'utilisateur n'existe pas
      if (error.response?.status === 404) {
        throw new Error(`Coiffeur avec l'ID ${id} non trouvé`);
      }
      
      // Si c'est une erreur 500, problème serveur
      if (error.response?.status === 500) {
        throw new Error(`Erreur serveur lors de la récupération du coiffeur ${id}`);
      }
      
      // Autres erreurs
      throw new Error(`Erreur lors de la récupération du coiffeur: ${error.message}`);
    }
  },

  async searchCoiffeurs(query: SearchQuery): Promise<User[]> {
    const params = new URLSearchParams();
    if (query.service) params.append('service', query.service);
    if (query.specialities) {
      query.specialities.forEach((speciality) => params.append('specialities', speciality));
    }
    if (query.modes) {
      query.modes.forEach((mode) => params.append('mode', mode));
    }
    if (typeof query.priceMin === 'number') {
      params.append('priceMin', query.priceMin.toString());
    }
    if (typeof query.priceMax === 'number') {
      params.append('priceMax', query.priceMax.toString());
    }
    if (query.city) params.append('city', query.city);
    if (query.date) params.append('date', query.date);
    if (typeof query.rating === 'number') {
      params.append('rating', query.rating.toString());
    }
    if (
      typeof query.maxDistance === 'number' &&
      typeof query.latitude === 'number' &&
      typeof query.longitude === 'number'
    ) {
      params.append('maxDistance', query.maxDistance.toString());
      params.append('latitude', query.latitude.toString());
      params.append('longitude', query.longitude.toString());
    }

    const queryString = params.toString();
    const response = await api.get<{ success: boolean; data: User[]; count: number }>(
      `${API_URL}${queryString ? `?${queryString}` : ''}`
    );
    
    // Extraire les données du nouveau format de réponse
    const coiffeurs = response.data.success ? response.data.data : [];
    
    // Récupérer automatiquement le statut de connexion pour chaque coiffeur
    const coiffeursWithStatus = await Promise.all(
      coiffeurs.map(async (coiffeur) => {
        if (coiffeur.role === 'coiffeur') {
          try {
            const connectionResponse = await api.get(`/connections/status/${coiffeur._id}`);
            const connectionData = connectionResponse.data;
            
            // Vérifier si le coiffeur est vraiment en ligne
            const now = new Date();
            const lastSeen = new Date(connectionData.lastSeen);
            const timeDiff = now.getTime() - lastSeen.getTime();
            const timeoutMinutes = 2; // 2 minutes de timeout
            
            // Si lastSeen est trop ancien, considérer comme hors ligne
            const isReallyOnline = connectionData.isOnline && timeDiff < (timeoutMinutes * 60 * 1000);
            
            coiffeur.connectionStatus = {
              isOnline: isReallyOnline,
              lastSeen: connectionData.lastSeen,
              status: isReallyOnline ? connectionData.status : 'offline',
              availability: {
                isAvailable: isReallyOnline && connectionData.availability.isAvailable,
                nextAvailable: connectionData.availability.nextAvailable,
                workingHours: connectionData.availability.workingHours
              }
            };
          } catch (error) {
            console.log('⚠️ Impossible de récupérer le statut de connexion pour:', coiffeur._id, error);
            // Statut par défaut si erreur
            coiffeur.connectionStatus = {
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
        }
        return coiffeur;
      })
    );
    
    return coiffeursWithStatus;
  },

  async getFavorites(coiffeurIds: string[]): Promise<User[]> {
    const response = await api.post<{ success: boolean; coiffeurs: User[] }>('/coiffeurs/favorites', { coiffeurIds });
    return response.data.coiffeurs;
  },

  async updateCoiffeur(id: string, data: Partial<User>): Promise<User> {
    const response = await api.patch<User>(`/coiffeurs/${id}`, data);
    return response.data;
  },

  async updatePhoto(id: string, photo: File): Promise<{ success: boolean; photo: { url: string; filename: string; size: number } }> {
    const formData = new FormData();
    formData.append('photo', photo);
    const response = await api.post<{ success: boolean; photo: { url: string; filename: string; size: number } }>(`/coiffeurs/${id}/photo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async updateAvailability(id: string, availability: User['workingHours']): Promise<{ success: boolean; coiffeur: User }> {
    const response = await api.patch<{ success: boolean; coiffeur: User }>(`/coiffeurs/${id}/availability`, { availability });
    return response.data;
  },

  async updateServices(id: string, services: User['services']): Promise<{ success: boolean; coiffeur: User }> {
    const response = await api.patch<{ success: boolean; coiffeur: User }>(`/coiffeurs/${id}/services`, { services });
    return response.data;
  },

  // Récupérer les services d'un coiffeur
  async getCoiffeurServices(coiffeurId: string): Promise<any[]> {
    const response = await api.get(`/coiffeurs/${coiffeurId}/services`);
    return response.data;
  },

  async syncGallery(coiffeurId: string): Promise<{
    success: boolean;
    coiffeurId: string;
    items: SyncedGalleryItem[];
    count: number;
    deduplicatedFrom: number;
  }> {
    const response = await api.get(`/coiffeurs/${coiffeurId}/gallery-sync`);
    return response.data;
  },

  async getCoiffeurSlots(coiffeurId: string, options: GetCoiffeurSlotsOptions = {}): Promise<CoiffeurSlotDTO[]> {
    const params: Record<string, string> = {};

    if (options.startDate) {
      params.startDate = options.startDate;
    }
    if (options.endDate) {
      params.endDate = options.endDate;
    }
    if (options.mode) {
      params.mode = options.mode;
    }

    const response = await api.get(`/coiffeurs/${coiffeurId}/slots`, {
      params,
    });

    const payload = response.data;

    if (payload?.success && Array.isArray(payload.data)) {
      return payload.data as CoiffeurSlotDTO[];
    }

    if (Array.isArray(payload)) {
      return payload as CoiffeurSlotDTO[];
    }

    return [];
  },

  // Ajouter un service à un coiffeur
  async addCoiffeurService(coiffeurId: string, serviceData: any): Promise<any> {
    const response = await api.post(`/coiffeurs/${coiffeurId}/services`, serviceData);
    return response.data;
  },

  // Mettre à jour un service
  async updateService(coiffeurId: string, serviceId: string, serviceData: any): Promise<any> {
    const response = await api.put(`/coiffeurs/${coiffeurId}/services/${serviceId}`, serviceData);
    return response.data;
  },

  // Supprimer un service
  async deleteService(coiffeurId: string, serviceId: string): Promise<void> {
    await api.delete(`/coiffeurs/${coiffeurId}/services/${serviceId}`);
  },

  // Upload de média (photo ou vidéo) de service
  async uploadServiceMedia(serviceId: string, media: File): Promise<{ success: boolean; media: { url: string; type: string } }> {
    const formData = new FormData();
    formData.append('media', media);
    const response = await api.post<{ success: boolean; media: { url: string; type: string } }>(`/services/${serviceId}/media`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Upload d'image de service (compatibilité)
  async uploadServicePhoto(serviceId: string, photo: File): Promise<{ success: boolean; photo: { url: string } }> {
    const result = await this.uploadServiceMedia(serviceId, photo);
    return {
      success: result.success,
      photo: { url: result.media.url }
    };
  },

  // Synchroniser la galerie avec les services
  async syncGallery(coiffeurId: string): Promise<any> {
    const response = await api.post(`/coiffeurs/${coiffeurId}/sync-gallery`);
    return response.data;
  },

  // Récupérer les statistiques de likes
  async getLikesStats(coiffeurId: string): Promise<any> {
    const response = await api.get(`/coiffeurs/${coiffeurId}/likes-stats`);
    return response.data;
  },

  // Toggle like sur un service
  async toggleServiceLike(coiffeurId: string, serviceId: string): Promise<any> {
    const response = await api.post(`/coiffeurs/${coiffeurId}/services/${serviceId}/like`);
    return response.data;
  },

  // Récupérer les services likés par l'utilisateur
  async getUserLikedServices(): Promise<any> {
    const response = await api.get('/services/user/liked');
    return response.data;
  }
}; 