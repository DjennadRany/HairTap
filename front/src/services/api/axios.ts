import axios from 'axios';
import { checkAndClearExpiredAuth } from '../../utils/clearExpiredAuth';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    // Vérifier si le token est expiré avant chaque requête
    if (checkAndClearExpiredAuth()) {
      return Promise.reject(new Error('Token expiré'));
    }
    
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
      
      // Rediriger vers la page de connexion si on n'y est pas déjà
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        window.location.href = '/login';
      }
      
      console.warn('Token invalide détecté, nettoyage en cours...');
    }
    return Promise.reject(error);
  }
);

export default api; 