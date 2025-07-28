import api from './axios';
import { User } from '../../types/models';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'coiffeur';
  phone?: string;
  address?: {
    street: string;
    city: string;
    postalCode: string;
  };
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    localStorage.setItem('token', response.data.token);
    return response.data;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    localStorage.setItem('token', response.data.token);
    return response.data;
  },

  async logout(): Promise<void> {
    localStorage.removeItem('token');
    await api.post('/auth/logout');
  }
}; 