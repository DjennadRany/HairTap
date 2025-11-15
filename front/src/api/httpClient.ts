import axios, { AxiosError } from 'axios';
import { checkAndClearExpiredAuth } from '../utils/clearExpiredAuth';
import { APP_BASE_URL } from '../config/api';

const sanitizeBaseUrl = (url: string) => url.replace(/\/+$/, '');

const resolveBaseUrl = () => {
  const envBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (envBaseUrl) {
    return sanitizeBaseUrl(envBaseUrl);
  }

  return sanitizeBaseUrl(APP_BASE_URL);
};

const httpClient = axios.create({
  baseURL: resolveBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  }
});

httpClient.interceptors.request.use(
  (config) => {
    if (checkAndClearExpiredAuth()) {
      return Promise.reject(new Error('Token expiré'));
    }

    if (config.url) {
      const isAbsoluteUrl = /^https?:\/\//i.test(config.url);
      if (!isAbsoluteUrl) {
        const normalizedUrl = config.url.startsWith('/') ? config.url : `/${config.url}`;
        config.url = normalizedUrl.startsWith('/api') ? normalizedUrl : `/api${normalizedUrl}`;
      }
    }

    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

httpClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default httpClient;
