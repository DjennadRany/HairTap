import api from '../../api/httpClient';

// Interface pour les réponses de like
interface LikeResponse {
  success: boolean;
  data: {
    likes: number;
    isLiked: boolean;
  };
  message: string;
}

// Interface pour les options de like
interface LikeOptions {
  optimistic?: boolean; // Mise à jour optimiste
  onSuccess?: (response: LikeResponse) => void;
  onError?: (error: any) => void;
}

class LikeService {
  private static instance: LikeService;
  
  public static getInstance(): LikeService {
    if (!LikeService.instance) {
      LikeService.instance = new LikeService();
    }
    return LikeService.instance;
  }

  /**
   * Toggle like sur un service
   */
  async toggleServiceLike(serviceId: string, options: LikeOptions = {}): Promise<LikeResponse> {
    try {
      const token = localStorage.getItem('token');
      console.log('🔍 [LikeService] Toggle like request:', {
        serviceId,
        endpoint: `/services/${serviceId}/like`,
        token: token ? 'Present' : 'Missing',
        tokenValue: token ? `${token.substring(0, 20)}...` : 'None'
      });

      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await api.post(`/services/${serviceId}/like`, {});

      console.log('✅ [LikeService] Response:', response.data);

      const result: LikeResponse = {
        success: true,
        data: {
          likes: response.data.data?.likes || response.data.likes || 0,
          isLiked: response.data.data?.isLiked || response.data.isLiked || false
        },
        message: response.data.message || 'Like toggled'
      };

      if (options.onSuccess) {
        options.onSuccess(result);
      }

      return result;
    } catch (error) {
      console.error('❌ Like service error:', error);
      
      if (options.onError) {
        options.onError(error);
      }
      
      throw error;
    }
  }

  /**
   * Toggle like sur un produit
   */
  async toggleProductLike(coiffeurId: string, productId: string, options: LikeOptions = {}): Promise<LikeResponse> {
    try {
      const response = await api.post(`/products/${coiffeurId}/${productId}/like`, {});

      const result: LikeResponse = {
        success: true,
        data: {
          likes: response.data.likes || 0,
          isLiked: response.data.isLiked || false
        },
        message: 'Product like toggled'
      };

      if (options.onSuccess) {
        options.onSuccess(result);
      }

      return result;
    } catch (error) {
      console.error('❌ Product like error:', error);
      
      if (options.onError) {
        options.onError(error);
      }
      
      throw error;
    }
  }

  /**
   * Toggle like sur un commentaire
   */
  async toggleCommentLike(commentId: string, options: LikeOptions = {}): Promise<LikeResponse> {
    try {
      const response = await api.post(`/comments/${commentId}/like`, {});

      const result: LikeResponse = {
        success: true,
        data: {
          likes: response.data.data?.likes || response.data.likes || 0,
          isLiked: response.data.data?.isLiked || response.data.isLiked || false
        },
        message: 'Comment like toggled'
      };

      if (options.onSuccess) {
        options.onSuccess(result);
      }

      return result;
    } catch (error) {
      console.error('❌ Comment like error:', error);
      
      if (options.onError) {
        options.onError(error);
      }
      
      throw error;
    }
  }

  /**
   * Toggle like sur une réponse de commentaire
   */
  async toggleReplyLike(commentId: string, replyIndex: number, options: LikeOptions = {}): Promise<LikeResponse> {
    try {
      const response = await api.post(`/comments/${commentId}/replies/${replyIndex}/like`, {});

      const result: LikeResponse = {
        success: true,
        data: {
          likes: response.data.data?.likes || response.data.likes || 0,
          isLiked: response.data.data?.isLiked || response.data.isLiked || false
        },
        message: 'Reply like toggled'
      };

      if (options.onSuccess) {
        options.onSuccess(result);
      }

      return result;
    } catch (error) {
      console.error('❌ Reply like error:', error);
      
      if (options.onError) {
        options.onError(error);
      }
      
      throw error;
    }
  }
}

// Export de l'instance singleton
export const likeService = LikeService.getInstance();
export default likeService;
