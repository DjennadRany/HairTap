import api from './axios';
import type { User } from '../../types/models';

// Type pour les services coiffeur avec nouvelles propriétés
interface CoiffeurService {
  _id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
  keywords: string[];
  examplePhotos: string[];
  likes: number;
  isLiked?: boolean;
  coiffeur: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const userService = {
  getUser: async (_id: string): Promise<User> => {
    const response = await api.get(`/coiffeurs/${_id}`);
    return response.data;
  },
  
  getCoiffeurServices: async (coiffeurId: string): Promise<CoiffeurService[]> => {
    const response = await api.get(`/coiffeurs/${coiffeurId}/services`);
    return response.data;
  },
  
  addCoiffeurService: async (coiffeurId: string, serviceData: {
    name: string;
    description: string;
    duration: number;
    price: number;
    category: string;
    keywords?: string[];
    examplePhotos?: string[];
  }): Promise<CoiffeurService> => {
    const response = await api.post(`/coiffeurs/${coiffeurId}/services`, serviceData);
    return response.data;
  },

  updateService: async (coiffeurId: string, serviceId: string, serviceData: {
    name: string;
    description: string;
    duration: number;
    price: number;
    category: string;
    keywords?: string[];
    examplePhotos?: string[];
  }): Promise<CoiffeurService> => {
    const response = await api.put(`/coiffeurs/${coiffeurId}/services/${serviceId}`, serviceData);
    return response.data;
  },

  // Supprimer un service
  deleteService: async (coiffeurId: string, serviceId: string) => {
    const response = await api.delete(`/coiffeurs/${coiffeurId}/services/${serviceId}`);
    return response.data;
  },

  // Synchroniser la galerie avec les images des services
  syncGallery: async (coiffeurId: string) => {
    const response = await api.post(`/coiffeurs/${coiffeurId}/sync-gallery`);
    return response.data;
  },

  // Toggle like sur un service
  toggleServiceLike: async (coiffeurId: string, serviceId: string) => {
    const response = await api.post(`/coiffeurs/${coiffeurId}/services/${serviceId}/like`);
    return response.data;
  },

  getAllCoiffeurs: async (): Promise<User[]> => {
    const response = await api.get('/coiffeurs');
    return response.data;
  },

  updateUser: async (userId: string, userData: Partial<User>): Promise<User> => {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  },

  // Récupérer un service par ID
  getService: async (serviceId: string): Promise<any> => {
    const response = await api.get(`/services/${serviceId}`);
    return response.data;
  },

  // Récupérer les favoris d'un utilisateur
  getFavorites: async (): Promise<any[]> => {
    const response = await api.get('/favorites');
    return response.data;
  },

  addToFavorites: async (coiffeurId: string): Promise<void> => {
    await api.post(`/users/favorites/${coiffeurId}`);
  },

  removeFromFavorites: async (coiffeurId: string): Promise<void> => {
    await api.delete(`/users/favorites/${coiffeurId}`);
  },

  getBlockedUsers: async (): Promise<User[]> => {
    const response = await api.get('/users/blocked');
    return response.data;
  },

  blockUser: async (userId: string, blockedUserId: string): Promise<void> => {
    await api.post(`/users/${userId}/block/${blockedUserId}`);
  },

  unblockUser: async (userId: string, blockedUserId: string): Promise<void> => {
    await api.delete(`/users/${userId}/block/${blockedUserId}`);
  }
}; 