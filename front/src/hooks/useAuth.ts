import { useCallback, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUser } from '../store/slices/authSlice';
import { setProfile } from '../store/slices/profileSlice';
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
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUserState] = useState<any | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const user = await authService.getCurrentUser();
          setIsAuthenticated(!!user);
          setUserState(user);
        } else {
          setUserState(null);
        }
      } catch (err) {
        setIsAuthenticated(false);
        setUserState(null);
        localStorage.removeItem('token');
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authService.login(credentials);
      const apiRole = response.user.role as ApiRole;
      const storeRole = convertRole(apiRole);
      
      // Dispatch l'utilisateur dans le store Redux
      dispatch(setUser({
        id: response.user._id,
        email: response.user.email,
        name: response.user.name,
        role: storeRole
      }));

      // Mettre à jour l'état d'authentification
      setIsAuthenticated(true);
      setUserState(response.user);

      // Initialiser le profil client dans le store Redux
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

      // Redirection par défaut selon le rôle
      if (apiRole === 'coiffeur') {
        navigate('/coiffeur/dashboard');
      } else {
        // Si l'utilisateur vient de la page de recherche ou d'une page spécifique
        const from = location.state?.from?.pathname;
        if (from && from !== '/login') {
          navigate(from);
        } else {
          navigate('/search');
        }
      }
    } catch (err) {
      setError('Erreur lors de la connexion');
      console.error('Erreur de connexion:', err);
      setIsAuthenticated(false);
      setUserState(null);
    } finally {
      setIsLoading(false);
    }
  }, [navigate, dispatch, location.state]);

  const register = useCallback(async (data: RegisterData) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authService.register(data);
      const apiRole = response.user.role as ApiRole;
      const storeRole = convertRole(apiRole);
      
      // Dispatch l'utilisateur dans le store Redux
      dispatch(setUser({
        id: response.user._id,
        email: response.user.email,
        name: response.user.name,
        role: storeRole
      }));

      // Initialiser le profil client dans le store Redux
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

      // Redirection par défaut selon le rôle
      if (apiRole === 'coiffeur') {
        navigate('/coiffeur/dashboard');
      } else {
        navigate('/search');
      }
    } catch (err) {
      setError('Erreur lors de l\'inscription');
      console.error('Erreur d\'inscription:', err);
    } finally {
      setIsLoading(false);
    }
  }, [navigate, dispatch]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
      dispatch({ type: 'auth/logout' });
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      setUserState(null);
      navigate('/');
    } catch (err) {
      console.error('Erreur lors de la déconnexion:', err);
    }
  }, [navigate, dispatch]);

  return {
    isLoading,
    error,
    isAuthenticated,
    user,
    login,
    register,
    logout
  };
} 