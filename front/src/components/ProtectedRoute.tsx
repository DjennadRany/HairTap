import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'client' | 'coiffeur';
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const location = useLocation();
  const user = useSelector((state: RootState) => state.auth?.user);

  if (!user) {
    // Sauvegarder le chemin actuel pour la redirection après connexion
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    // Rediriger vers la page appropriée si le rôle ne correspond pas
    return <Navigate to={user.role === 'coiffeur' ? '/coiffeur/dashboard' : '/'} replace />;
  }

  return <>{children}</>;
}; 