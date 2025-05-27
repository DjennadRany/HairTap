import api from './axios';
import { User } from '../../types/models';

export const userService = {
  async getUser(userId: string): Promise<User> {
    const response = await api.get<User>(`/users/${userId}`);
    return response.data;
  },
  async getAllCoiffeurs(): Promise<User[]> {
    const response = await api.get<User[]>(`/users?role=coiffeur`);
    return response.data;
  }
}; 