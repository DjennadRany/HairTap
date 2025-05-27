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
    return response.data;
  },

  async getFavorites(coiffeurIds: string[]): Promise<User[]> {
    const response = await api.post<User[]>('/coiffeurs/favorites', { coiffeurIds });
    return response.data;
  },

  async updateCoiffeur(id: string, data: Partial<User>): Promise<User> {
    const response = await api.patch<User>(`/coiffeurs/${id}`, data);
    return response.data;
  },

  async updatePhoto(id: string, photo: File): Promise<User> {
    const formData = new FormData();
    formData.append('photo', photo);
    const response = await api.post<User>(`/coiffeurs/${id}/photo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async updateAvailability(id: string, availability: User['workingHours']): Promise<User> {
    const response = await api.patch<User>(`/coiffeurs/${id}/availability`, { availability });
    return response.data;
  },

  async updateServices(id: string, services: User['services']): Promise<User> {
    const response = await api.patch<User>(`/coiffeurs/${id}/services`, { services });
    return response.data;
  }
}; 