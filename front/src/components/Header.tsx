import type { FC } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useState, useRef, useEffect } from 'react';
import { getUnreadCount } from '../hooks/useChat';
import { logout } from '../store/slices/authSlice';
import type { RootState } from '../store/store';

const Header: FC = () => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (isAuthenticated) {
        try {
          const count = await getUnreadCount();
          setUnreadCount(count);
        } catch (error) {
          console.error('Error fetching unread count:', error);
        }
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Rafraîchir toutes les 30 secondes

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleLogout = async () => {
    try {
      dispatch(logout());
      navigate('/');
    } catch (error) {
      console.error('Error during logout:', error);
    }
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

  // Fermer le dropdown si clic en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center h-16">
          {/* Logo */}
          <a href="#" onClick={handleLogoClick} className="flex items-center mr-6">
            <span className="text-2xl font-bold text-accent">TapHair</span>
          </a>

          {/* Menu principal */}
          {isAuthenticated && user && (
            <nav className="flex items-center gap-3">
              {user.role === 'client' ? (
                <>
                  <Link to="/client/dashboard" className="text-gray-700 hover:text-accent font-medium">Tableau de bord</Link>
                  <Link to="/client/bookings" className="text-gray-700 hover:text-accent font-medium">Mes réservations</Link>
                  <Link to="/client/favorites" className="text-gray-700 hover:text-accent font-medium">Favoris</Link>
                  <Link to="/client/chat" className="text-gray-700 hover:text-accent font-medium relative">
                    Messagerie
                    {unreadCount > 0 && (
                      <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/coiffeur/dashboard" className="text-gray-700 hover:text-accent font-medium">Tableau de bord</Link>
                  <Link to="/coiffeur/reservations" className="text-gray-700 hover:text-accent font-medium">Réservations</Link>
                  <Link to="/coiffeur/revenue" className="text-gray-700 hover:text-accent font-medium">Revenus</Link>
                  <Link to="/coiffeur/chat" className="text-gray-700 hover:text-accent font-medium relative">
                    Messagerie
                    {unreadCount > 0 && (
                      <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                </>
              )}
            </nav>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* User dropdown ou Connexion */}
          {!isAuthenticated ? (
            <Link
              to="/login"
              className="bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors"
            >
              Connexion
            </Link>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex items-center gap-2 px-3 py-1 rounded hover:bg-gray-100 transition-colors focus:outline-none"
              >
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <span className="text-accent font-medium">U</span>
                </div>
                <span className="font-medium text-gray-800">Mon compte</span>
                <svg className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-50">
                  <ul className="py-1">
                    <li>
                      <Link
                        to={user?.role === 'client' ? '/client/profile' : '/coiffeur/profile'}
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Voir mon profil
                      </Link>
                    </li>
                    <li>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                      >
                        Déconnexion
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 