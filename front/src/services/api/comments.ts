import api from '../../api/httpClient';

export interface Comment {
  _id: string;
  service: string;
  coiffeur: string;
  author: {
    _id: string;
    name: string;
    profilePicture?: string;
    photo?: string;
  };
  content: string;
  likes: string[];
  replies: Array<{
    _id?: string;
    author: {
      _id: string;
      name: string;
      profilePicture?: string;
      photo?: string;
    };
    content: string;
    likes: string[];
    createdAt: string;
  }>;
  isEdited: boolean;
  editedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentData {
  serviceId: string;
  coiffeurId: string;
  content: string;
}

export interface CreateReplyData {
  content: string;
}

export const commentService = {
  // Récupérer les commentaires d'un service
  async getServiceComments(serviceId: string, limit = 20, offset = 0): Promise<{ success: boolean; data: Comment[]; count: number }> {
    const response = await api.get(`/comments/service/${serviceId}?limit=${limit}&offset=${offset}`);
    return response.data;
  },

  // Créer un nouveau commentaire
  async createComment(data: CreateCommentData): Promise<{ success: boolean; data: Comment; message: string }> {
    const response = await api.post('/comments', data);
    return response.data;
  },

  // Liker/unliker un commentaire
  async toggleCommentLike(commentId: string): Promise<{ success: boolean; data: { likes: number; isLiked: boolean }; message: string }> {
    const response = await api.post(`/comments/${commentId}/like`);
    return response.data;
  },

  // Ajouter une réponse à un commentaire
  async addReply(commentId: string, data: CreateReplyData): Promise<{ success: boolean; data: any; message: string }> {
    const response = await api.post(`/comments/${commentId}/reply`, data);
    return response.data;
  },

  // Liker/unliker une réponse
  async toggleReplyLike(commentId: string, replyIndex: number): Promise<{ success: boolean; data: { likes: number; isLiked: boolean }; message: string }> {
    const response = await api.post(`/comments/${commentId}/replies/${replyIndex}/like`);
    return response.data;
  },

  // Supprimer un commentaire
  async deleteComment(commentId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/comments/${commentId}`);
    return response.data;
  }
};

export default commentService;

