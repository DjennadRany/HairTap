import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { useNavigate } from 'react-router-dom';
import { checkAuth, setUser, setToken, logout } from '../store/slices/authSlice';
import { selectIsAuthenticated, selectCurrentUser } from '../store/slices/authSlice';
import { authService } from '../services/api/auth';
import LoadingScreen from './LoadingScreen';

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectCurrentUser);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        setIsChecking(true);
        
        // Vérifier d'abord le localStorage
        dispatch(checkAuth());
        
        const token = localStorage.getItem('token');
        if (!token) {
          setIsChecking(false);
          return;
        }

        // Vérifier la validité du token avec le serveur
        try {
          const response = await authService.verifyToken();
          
          // ✅ CORRECTION : GESTION CORRECTE DU RÔLE ADMIN
          let userRole: 'client' | 'coiffeur' | 'admin';
          
          // Transformer 'user' en 'client' mais garder 'admin' et 'coiffeur'
          if (response.user.role === 'user') {
            userRole = 'client';
          } else if (response.user.role === 'admin') {
            userRole = 'admin';
          } else if (response.user.role === 'coiffeur') {
            userRole = 'coiffeur';
          } else {
            // Fallback par défaut
            userRole = 'client';
          }
          
          // Mettre à jour le store avec les données du serveur
          dispatch(setUser({
            _id: response.user._id,
            email: response.user.email,
            name: response.user.name,
            role: userRole, // ✅ RÔLE ADMIN PRÉSERVÉ
            photo: response.user.photo
          }));
          
          dispatch(setToken(response.token));
          
        } catch (error) {
          console.error('Token invalide:', error);
          // Token invalide, déconnecter l'utilisateur
          dispatch(logout());
          // Ne pas rediriger ici, laisser l'intercepteur axios gérer
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'authentification:', error);
        dispatch(logout());
      } finally {
        setIsChecking(false);
      }
    };

    verifyAuth();
  }, [dispatch]);

  // Redirection automatique selon l'état d'authentification
  useEffect(() => {
    if (isChecking) return; // Ne pas rediriger pendant la vérification
    
    const currentPath = window.location.pathname;
    
    if (isAuthenticated && user) {
      // Utilisateur connecté
      if (currentPath === '/login' || currentPath === '/register') {
        // ✅ CORRECTION : REDIRECTION SPÉCIFIQUE POUR ADMIN
        if (user.role === 'admin') {
          navigate('/admin');
        } else if (user.role === 'coiffeur') {
          navigate('/coiffeur/dashboard');
        } else if (user.role === 'client') {
          navigate('/client/dashboard');
        }
      }
      // ✅ SUPPRIMÉ : Plus de redirection automatique depuis la page d'accueil
    } else {
      // Utilisateur non connecté
      const publicRoutes = ['/login', '/register', '/', '/about', '/contact', '/terms', '/privacy', '/signin/client', '/signin/coiffeur', '/photo-setup'];
      if (!publicRoutes.includes(currentPath)) {
        navigate('/login');
      }
    }
  }, [isAuthenticated, user, navigate, isChecking]);

  // Afficher l'écran de chargement pendant la vérification
  if (isChecking) {
    return <LoadingScreen message="Vérification de l'authentification..." />;
  }

  return <>{children}</>;
};

export default AuthProvider; 