import { useCallback, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setUser } from '../store/slices/authSlice';
import { selectRedirectUrl, clearRedirectUrl } from '../store/slices/redirectSlice';
import type { User } from '../mocks/users';
import type { RootState } from '../store/store';

export const useAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const redirectUrl = useSelector((state: RootState) => state.redirect?.redirectUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginAsMock = useCallback(async (mockUser: User) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Simuler un délai pour montrer le chargement
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Dispatch l'utilisateur dans le store Redux
      dispatch(setUser({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
        photo: mockUser.picture
      }));

      // Gérer la redirection
      if (redirectUrl) {
        navigate(redirectUrl);
        dispatch(clearRedirectUrl());
      } else {
        // Redirection par défaut selon le rôle
        if (mockUser.role === 'coiffeur') {
          navigate('/coiffeur/dashboard');
        } else {
          // Si l'utilisateur vient de la page de recherche ou d'une page spécifique
          const from = location.state?.from;
          if (from && from !== '/login') {
            navigate(from);
          } else {
            navigate('/search');
          }
        }
      }
    } catch (err) {
      setError('Erreur lors de la connexion');
      console.error('Erreur de connexion:', err);
    } finally {
      setIsLoading(false);
    }
  }, [navigate, dispatch, redirectUrl, location.state]);

  const logout = useCallback(() => {
    dispatch({ type: 'auth/logout' });
    // Nettoyer l'URL de redirection au logout
    dispatch(clearRedirectUrl());
    navigate('/');
  }, [navigate, dispatch]);

  return {
    isLoading,
    error,
    loginAsMock,
    logout
  };
}; 