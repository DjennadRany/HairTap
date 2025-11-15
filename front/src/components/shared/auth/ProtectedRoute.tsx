import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store/store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'client' | 'coiffeur' | 'admin';
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const location = useLocation();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  // Si on est sur la page d'accueil, on l'affiche toujours
  if (location.pathname === '/') {
    return <>{children}</>;
  }

  if (
    !isAuthenticated ||
    !user ||
    !user._id ||
    !user.email ||
    (user.role !== 'client' && user.role !== 'coiffeur' && user.role !== 'admin')
  ) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    let redirectPath = '/';
    
    switch (user.role) {
      case 'admin':
        redirectPath = '/admin';
        break;
      case 'coiffeur':
        redirectPath = '/coiffeur/dashboard';
        break;
      case 'client':
        redirectPath = '/client/dashboard';
        break;
      default:
        redirectPath = '/';
    }
    
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}; 