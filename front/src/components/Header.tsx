import type { FC } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, selectIsAuthenticated, logout } from '../store/slices/authSlice';

const Header: FC = () => {
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  // Logo TapHair : /search si connecté, / sinon
  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isAuthenticated) {
      if (location.pathname !== '/search') navigate('/search');
    } else {
      if (location.pathname !== '/') navigate('/');
    }
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center h-16">
          {/* Logo + menu group */}
          <a href="#" onClick={handleLogoClick} className="flex items-center mr-6">
            <span className="text-2xl font-bold text-[#DE6C5C]">TapHair</span>
          </a>

          {/* Menu group (photo, nom, liens) */}
          {isAuthenticated && (
            <div className="flex items-center gap-3">
              {user?.photo && (
                <img src={user.photo} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
              )}
              <span className="font-medium text-gray-800">{user?.name}</span>
              <Link to="/client/dashboard" className="text-gray-700 hover:text-primary font-medium">Tableau de bord</Link>
              <Link to="/client/bookings" className="text-gray-700 hover:text-primary font-medium">Mes réservations</Link>
              <Link to="/client/favorites" className="text-gray-700 hover:text-primary font-medium">Favoris</Link>
              <Link to="/client/profile" className="text-gray-700 hover:text-primary font-medium">Profil</Link>
            </div>
          )}

          {/* Spacer pour pousser Déconnexion à droite */}
          <div className="flex-1" />

          {/* Auth / Déconnexion */}
          <nav className="flex items-center">
            {!isAuthenticated ? (
              <Link
                to="/login"
                className="bg-[#DE6C5C] text-white px-4 py-2 rounded-lg hover:bg-[#DE6C5C]/90"
              >
                Connexion
              </Link>
            ) : (
              <button
                onClick={handleLogout}
                className="bg-gray-200 text-gray-800 px-3 py-1 rounded hover:bg-gray-300 transition-colors ml-4"
              >
                Déconnexion
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header; 