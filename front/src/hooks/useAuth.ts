import { useCallback, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setUser, setToken, logout } from '../store/slices/authSlice';
import { selectIsAuthenticated, selectCurrentUser } from '../store/slices/authSlice';
import { setProfile, resetProfile } from '../store/slices/profileSlice';
import { authService, LoginCredentials, RegisterData } from '../services/api/auth';

type ApiRole = 'user' | 'coiffeur';
type StoreRole = 'client' | 'coiffeur';

const convertRole = (role: ApiRole): StoreRole => {
  return role === 'user' ? 'client' : 'coiffeur';
};

export interface AuthHook {
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  user: any | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

export function useAuth(): AuthHook {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Utiliser le state Redux pour l'authentification
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectCurrentUser);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authService.login(credentials);
      const apiRole = response.user.role as ApiRole;
      const storeRole = convertRole(apiRole);
      
      // Mettre à jour le store Redux
      dispatch(setUser({
        _id: response.user._id,
        email: response.user.email,
        name: response.user.name,
        role: storeRole,
        photo: response.user.photo
      }));
      
      dispatch(setToken(response.token));
      
      // Mettre à jour le profil si c'est un client
      if (apiRole === 'user') {
        dispatch(setProfile({
          id: response.user._id,
          userId: response.user._id,
          role: 'client',
          preferences: {
            favoriteCoiffeurs: [],
            preferredServices: []
          }
        }));
      }
      
      // Redirection selon le rôle
      if (apiRole === 'coiffeur') {
        navigate('/coiffeur/dashboard');
      } else {
        navigate('/client/dashboard');
      }
    } catch (err: any) {
      // En cas d'erreur, nettoyer l'état
      dispatch(logout() as any);
      if (err?.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Erreur lors de la connexion');
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate, dispatch]);

  const register = useCallback(async (data: RegisterData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authService.register(data);
      const apiRole = response.user.role as ApiRole;
      const storeRole = convertRole(apiRole);
      
      // Mettre à jour le store Redux
      dispatch(setUser({
        _id: response.user._id,
        email: response.user.email,
        name: response.user.name,
        role: storeRole,
        photo: response.user.photo
      }));
      
      dispatch(setToken(response.token));
      
      // Mettre à jour le profil si c'est un client
      if (apiRole === 'user') {
        dispatch(setProfile({
          id: response.user._id,
          userId: response.user._id,
          role: 'client',
          preferences: {
            favoriteCoiffeurs: [],
            preferredServices: []
          }
        }));
      }
      
      // Redirection selon le rôle
      if (apiRole === 'coiffeur') {
        navigate('/coiffeur/dashboard');
      } else {
        navigate('/client/dashboard');
      }
    } catch (err: any) {
      if (err?.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Erreur lors de l\'inscription');
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate, dispatch]);

  const handleLogout = useCallback(async () => {
    try {
      setIsLoading(true);
      await authService.logout();
      
      // Nettoyer le store Redux
      dispatch(logout() as any);
      dispatch(resetProfile());
      
      // Rediriger vers la page d'accueil
      navigate('/');
    } catch (err) {
      console.error('Erreur lors de la déconnexion:', err);
      // Même en cas d'erreur, nettoyer l'état local
      dispatch(logout() as any);
      dispatch(resetProfile());
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  }, [navigate, dispatch]);

  return {
    isLoading,
    error,
    isAuthenticated,
    user,
    login,
    register,
    logout: handleLogout
  };
} 