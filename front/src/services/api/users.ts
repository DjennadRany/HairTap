import api from '../../api/httpClient';
import type { User } from '../../types/models';

const API_URL = '/users';

export const userService = {
  async getUser(id: string, includeConnectionStatus: boolean = false): Promise<User> {
    const response = await api.get<User>(`${API_URL}/${id}`);
    
    // ✅ OPTIMISATION: Récupérer le statut de connexion uniquement si demandé explicitement
    // Cela évite des appels API inutiles au chargement
    if (includeConnectionStatus && response.data.role === 'coiffeur') {
      try {
        const connectionResponse = await api.get(`/connections/status/${id}`);
        const connectionData = connectionResponse.data;
        
        // Vérifier si le coiffeur est vraiment en ligne
        const now = new Date();
        const lastSeen = new Date(connectionData.lastSeen);
        const timeDiff = now.getTime() - lastSeen.getTime();
        const timeoutMinutes = 2; // 2 minutes de timeout
        
        // Si lastSeen est trop ancien, considérer comme hors ligne
        const isReallyOnline = connectionData.isOnline && timeDiff < (timeoutMinutes * 60 * 1000);
        
        response.data.connectionStatus = {
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
        console.log('⚠️ Impossible de récupérer le statut de connexion:', error);
        // Statut par défaut si erreur
        response.data.connectionStatus = {
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
  async uploadProfilePhoto(id: string, file: File): Promise<{ success: boolean; photo: string; message: string }> {
    const formData = new FormData();
    formData.append('photo', file); // CORRIGÉ : 'photo' au lieu de 'image'

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
  },

  // Récupérer l'adresse de salon
  async getSalonAddress(coiffeurId: string): Promise<{ salonAddress: any; coiffeurName: string }> {
    const response = await api.get(`/users/salon-address/${coiffeurId}`);
    return response.data;
  },

  // Mettre à jour l'adresse de salon
  async updateSalonAddress(salonAddress: any): Promise<{ message: string; salonAddress: any }> {
    const response = await api.put('/users/salon-address', { salonAddress });
    return response.data;
  },

  // Supprimer un compte utilisateur
  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  }
}; 