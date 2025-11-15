import api from '../../api/httpClient';
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

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
  },

  async verifyToken(): Promise<AuthResponse> {
    const response = await api.get<AuthResponse>('/auth/verify');
    // Mettre à jour le token si un nouveau est fourni
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  async changePassword(payload: ChangePasswordPayload): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/change-password', payload);
    return response.data;
  },

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/forgot-password', { email });
    return response.data;
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/reset-password', payload);
    return response.data;
  }
};