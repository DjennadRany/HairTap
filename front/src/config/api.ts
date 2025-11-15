export const APP_BASE_URL = import.meta.env.VITE_APP_BASE_URL || 'http://localhost:5000';

// Configuration centralisée pour les URLs de l'API
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || APP_BASE_URL,
  UPLOAD_URL: import.meta.env.VITE_UPLOAD_URL || APP_BASE_URL,
  DEFAULT_AVATAR: '/default-avatar.png'
};

// URLs pour les photos
export const PHOTO_URLS = {
  DEFAULT_AVATAR: API_CONFIG.DEFAULT_AVATAR,
  UPLOAD_PATH: '/uploads/profiles/'
}; 