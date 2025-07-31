import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Nettoyer le token invalide
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Ne pas rediriger automatiquement, laisser AuthProvider gérer
      console.warn('Token invalide détecté, nettoyage en cours...');
    }
    return Promise.reject(error);
  }
);

export default api; 