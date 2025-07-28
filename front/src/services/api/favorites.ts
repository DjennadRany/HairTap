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
    const response = await api.post(`/favorites/${coiffeurId}`);
    return response.data;
  },

  async removeFavorite(coiffeurId: string): Promise<void> {
    await api.delete(`/favorites/${coiffeurId}`);
  },

  async isFavorite(coiffeurId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      return favorites.some((fav: any) => fav._id === coiffeurId || fav.coiffeurId === coiffeurId);
    } catch {
      return false;
    }
  }
}; 