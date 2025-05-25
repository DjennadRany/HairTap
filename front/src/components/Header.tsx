import type { FC } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, selectIsAuthenticated, logout } from '../store/slices/authSlice';
import { useState, useRef, useEffect } from 'react';
import { getUnreadCount } from '../hooks/useChat';

interface HeaderProps {
  showBackArrow?: boolean;
  onBackArrowClick?: () => void;
}

const Header: FC<HeaderProps> = ({ showBackArrow = false, onBackArrowClick }) => {
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [unreadCount, setUnreadCount] = useState(isAuthenticated && user ? getUnreadCount(String(user.id)) : 0);

  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (user && e.key === 'chat_messages') {
        setUnreadCount(getUnreadCount(String(user.id)));
      }
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [user]);

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

  // Fermer le menu mobile si on change de page
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="bg-black shadow-sm w-full">
      <div className="max-w-screen-md mx-auto px-4">
        <div className="flex items-center h-16 relative">
          {/* Flèche retour à gauche du logo si showBackArrow */}
          {showBackArrow && (
            <button
              onClick={onBackArrowClick}
              className="mr-3 flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition"
              aria-label="Retour"
              style={{ position: 'relative', zIndex: 30 }}
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {/* Logo */}
          <a href="#" onClick={handleLogoClick} className="flex items-center mr-6 z-20">
            <span className="text-2xl font-bold text-[#DE6C5C]">TapHair</span>
          </a>

          {/* Menu principal - Desktop */}
          {isAuthenticated && user && (
            <nav className="hidden md:flex items-center gap-3">
              <Link to={user.role === 'client' ? "/client/dashboard" : "/coiffeur/dashboard"} className="text-gray-700 hover:text-primary font-medium">Tableau de bord</Link>
              <Link to={user.role === 'client' ? "/client/bookings" : "/coiffeur/reservations"} className="text-gray-700 hover:text-primary font-medium">Mes réservations</Link>
              {user.role === 'client' && (
                <Link to="/client/favorites" className="text-gray-700 hover:text-primary font-medium">Favoris</Link>
              )}
              {user.role === 'client' && (
                <Link to="/client/chat" className="text-gray-700 hover:text-primary font-medium relative">
                  Messagerie
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              )}
              {user.role === 'coiffeur' && (
                <Link to="/coiffeur/chat" className="text-gray-700 hover:text-primary font-medium relative">
                  Messagerie
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              )}
            </nav>
          )}

          {/* Burger menu - Mobile */}
          {isAuthenticated && user && (
            <button
              className="md:hidden flex items-center ml-2 z-20"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label="Ouvrir le menu"
            >
              <svg className="w-8 h-8 text-[#DE6C5C]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* User dropdown ou Connexion */}
          {!isAuthenticated ? (
            <Link
              to="/login"
              className="bg-[#DE6C5C] text-white px-4 py-2 rounded-lg hover:bg-[#DE6C5C]/90"
            >
              Connexion
            </Link>
          ) : user && (
            <div className="relative z-20" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex items-center gap-2 px-3 py-1 rounded hover:bg-gray-100 transition-colors focus:outline-none"
              >
                {user.photo && (
                  <img src={user.photo} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                )}
                <span className="font-medium text-gray-800">{user.name}</span>
                <svg className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-50">
                  <ul className="py-1">
                    <li>
                      <Link
                        to={user.role === 'client' ? "/client/profile" : `/coiffeur/${user.id}`}
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

          {/* Menu mobile drawer */}
          {isAuthenticated && user && (
            <div
              className={`fixed inset-0 z-10 bg-black bg-opacity-40 transition-opacity duration-200 ${mobileMenuOpen ? 'block' : 'hidden'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <nav
                className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg p-6 transform transition-transform duration-200 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
                onClick={e => e.stopPropagation()}
              >
                <button
                  className="absolute top-4 right-4 text-gray-700"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Fermer le menu"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <ul className="flex flex-col gap-4 mt-8">
                  <li>
                    <Link to={user.role === 'client' ? "/client/dashboard" : "/coiffeur/dashboard"} className="text-gray-700 font-medium" onClick={() => setMobileMenuOpen(false)}>Tableau de bord</Link>
                  </li>
                  <li>
                    <Link to={user.role === 'client' ? "/client/bookings" : "/coiffeur/reservations"} className="text-gray-700 font-medium" onClick={() => setMobileMenuOpen(false)}>Mes réservations</Link>
                  </li>
                  {user.role === 'client' && (
                    <li>
                      <Link to="/client/favorites" className="text-gray-700 font-medium" onClick={() => setMobileMenuOpen(false)}>Favoris</Link>
                    </li>
                  )}
                  <li>
                    <Link to={user.role === 'client' ? "/client/chat" : "/coiffeur/chat"} className="text-gray-700 font-medium relative" onClick={() => setMobileMenuOpen(false)}>
                      Messagerie
                      {unreadCount > 0 && (
                        <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold animate-pulse">
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 