import api from './axios';

export interface Favorite {
  id: string;
  userId: string;
  coiffeurId: string;
  createdAt: string;
  updatedAt: string;
}

export const favoriteService = {
  async getFavorites(): Promise<Favorite[]> {
    const response = await api.get('/favorites');
    return response.data;
  },

  async addFavorite(coiffeurId: string): Promise<Favorite> {
    const response = await api.post('/favorites', { coiffeurId });
    return response.data;
  },

  async removeFavorite(coiffeurId: string): Promise<void> {
    await api.delete(`/favorites/${coiffeurId}`);
  },

  async isFavorite(coiffeurId: string): Promise<boolean> {
    try {
      await api.get(`/favorites/${coiffeurId}`);
      return true;
    } catch {
      return false;
    }
  }
}; 