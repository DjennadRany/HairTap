import api from './axios';

export interface AdminStats {
  totalUsers: number;
  activeCoiffeurs: number;
  totalBookings: number;
  totalRevenue: number;
  userGrowth: {
    clients: number;
    coiffeurs: number;
    engagement: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'new_coiffeur' | 'booking_confirmed' | 'payment_received';
    message: string;
    timestamp: string;
  }>;
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: 'client' | 'coiffeur' | 'admin';
  status: 'active' | 'pending' | 'blocked';
  createdAt: string;
  lastLogin?: string;
  photo?: string;
}

export interface AdminUserLocation {
  _id: string;
  name: string;
  role: 'client' | 'coiffeur' | 'admin';
  coordinates?: {
    lat: number;
    lng: number;
  };
  city?: string;
}

export interface AdminService {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  status: 'active' | 'pending' | 'rejected';
  coiffeurId: string;
  coiffeurName: string;
  createdAt: string;
  image?: string;
}

export interface AdminBooking {
  _id: string;
  clientId: string;
  clientName: string;
  coiffeurId: string;
  coiffeurName: string;
  serviceId: string;
  serviceName: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  amount: number;
  createdAt: string;
  scheduledDate: string;
}

class AdminServiceClass {
  // Récupérer les statistiques du dashboard
  async getDashboardStats(): Promise<AdminStats> {
    try {
      const response = await api.get('/admin/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des stats admin:', error);
      // Retourner des données par défaut en cas d'erreur
      return {
        totalUsers: 0,
        activeCoiffeurs: 0,
        totalBookings: 0,
        totalRevenue: 0,
        userGrowth: { clients: 0, coiffeurs: 0, engagement: 0 },
        recentActivity: []
      };
    }
  }

  // Récupérer tous les utilisateurs
  async getUsers(): Promise<AdminUser[]> {
    try {
      const response = await api.get('/admin/users');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      return [];
    }
  }

  // Récupérer tous les services
  async getServices(): Promise<AdminService[]> {
    try {
      const response = await api.get('/admin/services');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des services:', error);
      return [];
    }
  }

  // Récupérer les coordonnées géographiques des utilisateurs
  async getUsersGeographic(): Promise<AdminUserLocation[]> {
    try {
      const response = await api.get('/admin/users/geographic');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des coordonnées géographiques:', error);
      return [];
    }
  }

  // Récupérer toutes les réservations
  async getBookings(): Promise<AdminBooking[]> {
    try {
      const response = await api.get('/admin/bookings');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des réservations:', error);
      return [];
    }
  }

  // Modifier le statut d'un utilisateur
  async updateUserStatus(userId: string, status: 'active' | 'blocked'): Promise<boolean> {
    try {
      await api.patch(`/users/${userId}`, { status });
      return true;
    } catch (error) {
      console.error('Erreur lors de la modification du statut:', error);
      return false;
    }
  }

  // Modifier le statut d'un service
  async updateServiceStatus(serviceId: string, status: 'active' | 'rejected'): Promise<boolean> {
    try {
      await api.patch(`/services/${serviceId}`, { status });
      return true;
    } catch (error) {
      console.error('Erreur lors de la modification du statut du service:', error);
      return false;
    }
  }

  // Supprimer un utilisateur
  async deleteUser(userId: string): Promise<boolean> {
    try {
      await api.delete(`/users/${userId}`);
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      return false;
    }
  }

  // Supprimer un service
  async deleteService(serviceId: string): Promise<boolean> {
    try {
      await api.delete(`/services/${serviceId}`);
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du service:', error);
      return false;
    }
  }
}

export const adminService = new AdminServiceClass();
