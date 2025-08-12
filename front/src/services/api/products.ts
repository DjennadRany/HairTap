import api from './axios';

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  keywords?: string[];
  images?: string[];
  stock?: number;
  deliveryOptions?: string[];
  likes?: number;
  isLiked?: boolean;
  coiffeur: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductData {
  name: string;
  description: string;
  price: number;
  category: string;
  keywords?: string[];
  images?: string[];
  stock?: number;
  deliveryOptions?: string[];
}

export const productService = {
  // Récupérer tous les produits d'un coiffeur
  async getCoiffeurProducts(coiffeurId: string): Promise<Product[]> {
    const response = await api.get<Product[]>(`/products/${coiffeurId}`);
    return response.data;
  },

  // Ajouter un produit
  async addCoiffeurProduct(coiffeurId: string, productData: CreateProductData): Promise<Product> {
    const response = await api.post<Product>(`/products/${coiffeurId}`, productData);
    return response.data;
  },

  // Modifier un produit
  async updateProduct(coiffeurId: string, productId: string, productData: Partial<CreateProductData>): Promise<Product> {
    const response = await api.put<Product>(`/products/${coiffeurId}/${productId}`, productData);
    return response.data;
  },

  // Supprimer un produit
  async deleteProduct(coiffeurId: string, productId: string): Promise<{ message: string }> {
    const response = await api.delete(`/products/${coiffeurId}/${productId}`);
    return response.data;
  },

  // Toggle like d'un produit
  async toggleProductLike(coiffeurId: string, productId: string): Promise<{ likes: number; isLiked: boolean }> {
    const response = await api.post(`/products/${coiffeurId}/${productId}/like`);
    return response.data;
  },

  // Récupérer les statistiques de likes pour un coiffeur
  async getProductLikesStats(coiffeurId: string): Promise<{
    totalProducts: number;
    totalLikes: number;
    averageLikes: string;
  }> {
    const response = await api.get(`/products/${coiffeurId}/likes-stats`);
    return response.data;
  }
}; 