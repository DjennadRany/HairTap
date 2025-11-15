import api from '../../api/httpClient';

export const reviewService = {
  // Créer un avis
  createReview: async (reviewData: {
    coiffeurId: string;
    bookingId: string;
    rating: number;
    comment: string;
  }) => {
    const response = await api.post('/reviews', reviewData);
    return response.data;
  },

  // Récupérer les avis d'un coiffeur
  getCoiffeurReviews: async (coiffeurId: string) => {
    const response = await api.get(`/reviews/coiffeur/${coiffeurId}`);
    return response.data;
  },

  // Récupérer les avis d'un client
  getClientReviews: async () => {
    const response = await api.get('/reviews/client');
    return response.data;
  },

  // Vérifier si un avis existe pour une réservation
  checkReviewExists: async (bookingId: string) => {
    const response = await api.get(`/reviews/booking/${bookingId}`);
    return response.data;
  },

  // Supprimer un avis
  deleteReview: async (reviewId: string) => {
    const response = await api.delete(`/reviews/${reviewId}`);
    return response.data;
  }
}; 