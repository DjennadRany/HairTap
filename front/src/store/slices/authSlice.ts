import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'client' | 'coiffeur';
  photo?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  token: string | null;
}

// Fonction pour récupérer le token depuis localStorage
const getStoredToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// Fonction pour récupérer l'utilisateur depuis localStorage
const getStoredUser = (): User | null => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
  }
  return null;
};

const initialState: AuthState = {
  user: getStoredUser(),
  isAuthenticated: !!getStoredToken(),
  loading: false,
  error: null,
  token: getStoredToken(),
};

export { initialState };

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      const user = action.payload;
      const isValid = !!user && !!user._id && !!user.email && (user.role === 'client' || user.role === 'coiffeur');
      state.user = isValid ? user : null;
      state.isAuthenticated = isValid;
      state.loading = false;
      state.error = null;
      
      // Persister l'utilisateur
      if (isValid && typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(user));
      } else if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
      }
    },
    setToken: (state, action: PayloadAction<string | null>) => {
      state.token = action.payload;
      state.isAuthenticated = !!action.payload;
      
      // Persister le token
      if (action.payload && typeof window !== 'undefined') {
        localStorage.setItem('token', action.payload);
      } else if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      state.token = null;
      
      // Nettoyer localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    },
    checkAuth: (state) => {
      const token = getStoredToken();
      const user = getStoredUser();
      
      if (token && user) {
        state.token = token;
        state.user = user;
        state.isAuthenticated = true;
      } else {
        state.token = null;
        state.user = null;
        state.isAuthenticated = false;
      }
    },
  },
});

export const { setUser, setToken, setLoading, setError, logout, checkAuth } = authSlice.actions;

export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: RootState) => state.auth.loading;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectAuthToken = (state: RootState) => state.auth.token;

export default authSlice.reducer; 