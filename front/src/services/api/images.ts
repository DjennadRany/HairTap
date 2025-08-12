import api from './axios';

export interface ImageUploadResponse {
  success: boolean;
  image: {
    url: string;
    filename: string;
    size: number;
  };
  message: string;
}

export interface ImageValidationResponse {
  success: boolean;
  isValid: boolean;
}

export const imageService = {
  // Upload d'image de service
  async uploadServiceImage(serviceId: string, file: File): Promise<ImageUploadResponse> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post<ImageUploadResponse>(`/images/service/${serviceId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // Upload d'image de profil
  async uploadProfileImage(userId: string, file: File): Promise<ImageUploadResponse> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post<ImageUploadResponse>(`/images/profile/${userId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // Supprimer une image de service
  async deleteServiceImage(serviceId: string, imageUrl: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/images/service/${serviceId}`, {
      data: { imageUrl }
    });
    return response.data;
  },

  // Réorganiser les images de service
  async reorderServiceImages(serviceId: string, imageOrder: string[]): Promise<{ success: boolean; message: string }> {
    const response = await api.put(`/images/service/${serviceId}/reorder`, {
      imageOrder
    });
    return response.data;
  },

  // Valider une URL d'image
  async validateImageUrl(url: string): Promise<ImageValidationResponse> {
    const response = await api.get<ImageValidationResponse>('/images/validate', {
      params: { url }
    });
    return response.data;
  }
}; 