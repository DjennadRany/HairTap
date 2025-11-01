import api from './axios';
import { Service } from '../../types/models';

export const serviceService = {
  // Récupérer tous les services
  async getServices(): Promise<Service[]> {
    const response = await api.get<Service[]>('/services');
    return response.data;
  },

  // Récupérer un service par ID
  async getService(id: string): Promise<Service> {
    const response = await api.get<Service>(`/services/${id}`);
    return response.data;
  },

  // Créer un nouveau service
  async createService(data: Partial<Service>): Promise<Service> {
    const response = await api.post<Service>('/services', data);
    return response.data;
  },

  // Mettre à jour un service
  async updateService(id: string, data: Partial<Service>): Promise<Service> {
    const response = await api.patch<Service>(`/services/${id}`, data);
    return response.data;
  },

  // Supprimer un service
  async deleteService(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/services/${id}`);
    return response.data;
  },

  // Récupérer les services par catégorie
  async getServicesByCategory(category: string): Promise<Service[]> {
    const response = await api.get<Service[]>(`/services/category/${category}`);
    return response.data;
  },

  // Récupérer les services d'un coiffeur
  async getServicesByCoiffeur(coiffeurId: string): Promise<Service[]> {
    const response = await api.get<Service[]>(`/services/coiffeur/${coiffeurId}`);
    return response.data;
  },

  // Upload de photo de service
  async uploadServicePhoto(serviceId: string, file: File): Promise<{ success: boolean; photo: { url: string } }> {
    const formData = new FormData();
    formData.append('photo', file);

    const response = await api.post(`/services/${serviceId}/photo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // Supprimer une photo de service
  async deleteServicePhoto(serviceId: string, photoUrl: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/services/${serviceId}/photo/${encodeURIComponent(photoUrl)}`);
    return response.data;
  },

  // Toggle like supprimé - Utiliser likeService.toggleServiceLike() à la place
}; 