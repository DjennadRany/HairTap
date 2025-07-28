import { useCallback, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUser } from '../store/slices/authSlice';
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
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [user, setUserState] = useState<any | null>(null);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authService.login(credentials);
      const apiRole = response.user.role as ApiRole;
      const storeRole = convertRole(apiRole);
      dispatch(setUser({
        _id: response.user._id,
        email: response.user.email,
        name: response.user.name,
        role: storeRole
      }));
      setIsAuthenticated(true);
      setUserState(response.user);
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
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      setUserState(null);
      dispatch(setUser(null));
      dispatch(resetProfile());
      if (err?.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Erreur lors de la connexion');
      }
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
      dispatch(setUser({
        _id: response.user._id,
        email: response.user.email,
        name: response.user.name,
        role: storeRole
      }));
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
      if (apiRole === 'coiffeur') {
        navigate('/coiffeur/dashboard');
      } else {
        navigate('/client/dashboard');
      }
    } catch (err) {
      setError('Erreur lors de l\'inscription');
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
      // ignore
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