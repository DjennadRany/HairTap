import api from './axios';

export interface Service {
  _id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: 'coupe' | 'coloration' | 'coiffure' | 'soin' | 'barbe' | 'autre';
  coiffeur: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceData {
  name: string;
  description: string;
  price: number;
  duration: number;
  category: 'coupe' | 'coloration' | 'coiffure' | 'soin' | 'barbe' | 'autre';
}

export interface UpdateServiceData {
  name?: string;
  description?: string;
  price?: number;
  duration?: number;
  category?: 'coupe' | 'coloration' | 'coiffure' | 'soin' | 'barbe' | 'autre';
  isActive?: boolean;
}

export const serviceService = {
  async getServices(): Promise<Service[]> {
    const response = await api.get<Service[]>('/services');
    return response.data;
  },

  async getService(id: string): Promise<Service> {
    const response = await api.get<Service>(`/services/${id}`);
    return response.data;
  },

  async createService(data: CreateServiceData): Promise<Service> {
    const response = await api.post<Service>('/services', data);
    return response.data;
  },

  async updateService(id: string, data: UpdateServiceData): Promise<Service> {
    const response = await api.patch<Service>(`/services/${id}`, data);
    return response.data;
  },

  async deleteService(id: string): Promise<void> {
    await api.delete(`/services/${id}`);
  },

  async getServicesByCategory(category: string): Promise<Service[]> {
    const response = await api.get<Service[]>(`/services/category/${category}`);
    return response.data;
  },

  async getServicesByCoiffeur(coiffeurId: string): Promise<Service[]> {
    const response = await api.get<Service[]>(`/services/coiffeur/${coiffeurId}`);
    return response.data;
  }
}; 