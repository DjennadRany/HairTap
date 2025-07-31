import api from './axios';
import { User } from '../../types/models';

export const userService = {
  // Récupérer un utilisateur par ID
  async getUser(id: string): Promise<User> {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  // Mettre à jour un utilisateur
  async updateUser(id: string, data: Partial<User>): Promise<User> {
    console.log('🚀 [userService] Envoi de la mise à jour pour l\'utilisateur:', id);
    console.log('📦 [userService] Données envoyées:', JSON.stringify(data, null, 2));
    
    const response = await api.patch<User>(`/users/${id}`, data);
    
    console.log('✅ [userService] Réponse reçue:', JSON.stringify(response.data, null, 2));
    return response.data;
  },

  // Upload de photo de profil - CORRIGÉ
  async uploadProfilePhoto(id: string, file: File): Promise<{ success: boolean; photo: { url: string }; message: string }> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post(`/users/${id}/photo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // Supprimer la photo de profil
  async deleteProfilePhoto(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/users/${id}/photo`);
    return response.data;
  },

  // Récupérer les adresses de réservation
  async getBookingAddresses(id: string): Promise<any[]> {
    const response = await api.get(`/users/${id}/booking-addresses`);
    return response.data;
  },

  // Ajouter une adresse de réservation
  async addBookingAddress(id: string, addressData: any): Promise<any> {
    const response = await api.post(`/users/${id}/booking-addresses`, addressData);
    return response.data;
  },

  // Supprimer une adresse de réservation
  async removeBookingAddress(id: string, addressId: string): Promise<{ message: string }> {
    const response = await api.delete(`/users/${id}/booking-addresses/${addressId}`);
    return response.data;
  }
}; 