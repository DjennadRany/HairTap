import api from './axios';
import { User } from '../../types/models';

export interface Favorite {
  _id: string;
  userId: string;
  coiffeurId: string;
  createdAt: string;
  updatedAt: string;
}

export const favoriteService = {
  async getFavorites(): Promise<User[]> {
    const response = await api.get<{ favorites: User[] }>('/favorites');
    return response.data.favorites || [];
  },

  async addFavorite(coiffeurId: string): Promise<{ success: boolean; data: { isFavorite: boolean; totalFavorites: number }; message: string }> {
    const response = await api.post(`/favorites/${coiffeurId}`);
    return response.data;
  },

  async removeFavorite(coiffeurId: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/favorites/${coiffeurId}`);
    return response.data;
  },

  async isFavorite(coiffeurId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      return favorites.some((coiffeur: User) => coiffeur._id === coiffeurId);
    } catch {
      return false;
    }
  }
}; 