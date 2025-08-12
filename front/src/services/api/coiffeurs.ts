import api from './axios';
import { User } from '../../types/models';

const API_URL = '/coiffeurs';

export interface SearchQuery {
  service?: string;
  speciality?: string[];
  priceRange?: string[];
  city?: string;
  date?: string;
}

export const coiffeurService = {
  async getCoiffeurs(): Promise<User[]> {
    const response = await api.get<User[]>('/coiffeurs');
    return response.data;
  },

  async getCoiffeur(id: string): Promise<User> {
    const response = await api.get<User>(`/coiffeurs/${id}`);
    return response.data;
  },

  async searchCoiffeurs(query: SearchQuery): Promise<User[]> {
    const params = new URLSearchParams();
    if (query.service) params.append('service', query.service);
    if (query.speciality) query.speciality.forEach(s => params.append('speciality', s));
    if (query.priceRange) query.priceRange.forEach(p => params.append('priceRange', p));
    if (query.city) params.append('city', query.city);
    if (query.date) params.append('date', query.date);

    const response = await api.get<User[]>(`/coiffeurs?${params.toString()}`);
    
    // Récupérer automatiquement le statut de connexion pour chaque coiffeur
    const coiffeursWithStatus = await Promise.all(
      response.data.map(async (coiffeur) => {
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

  // Upload d'image de service
  async uploadServicePhoto(serviceId: string, photo: File): Promise<{ success: boolean; photo: { url: string } }> {
    const formData = new FormData();
    formData.append('photo', photo);
    const response = await api.post<{ success: boolean; photo: { url: string } }>(`/services/${serviceId}/photo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
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
  }
}; 