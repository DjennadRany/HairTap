import type { FC } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { useState, useRef, useEffect } from 'react';
import { getUnreadCount } from '../hooks/useChat';
import { logout } from '../store/slices/authSlice';
import { FaUser, FaSignOutAlt, FaCog, FaImages, FaUserTie } from 'react-icons/fa';
import { PHOTO_URLS } from '../config/api';
import { getImageUrl, handleImageError, DEFAULT_USER_IMAGE } from '../utils/imageUtils';
import { useIsMobile } from '../hooks/useIsMobile';
import { ConnectionStatusManager } from './ConnectionStatusManager';
import { useGallery } from '../contexts/GalleryContext';

const Header: FC = () => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const { activeTab, toggleTab } = useGallery();

  const isUserValid =
    isAuthenticated &&
    user &&
    user._id &&
    user.email &&
    (user.role === 'client' || user.role === 'coiffeur');

  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (isAuthenticated) {
        try {
          const count = await getUnreadCount();
          setUnreadCount(count);
        } catch (error) {
          setUnreadCount(0);
        }
      }
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleLogout = async () => {
    dispatch(logout());
    navigate('/');
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isAuthenticated) {
      if (location.pathname !== '/search') navigate('/search');
    } else {
      if (location.pathname !== '/') navigate('/');
    }
  };

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
    <header className="bg-fashion-light-gray/95 backdrop-blur-md border-b border-fashion-gray-200 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center h-16">
          {/* Logo */}
          <a href="#" onClick={handleLogoClick} className="flex items-center mr-8">
            <span className="text-2xl font-elegant font-bold text-fashion-black tracking-wide">
              TapHair
            </span>
          </a>

          {/* Bouton toggle galerie - Mobile uniquement sur la page de recherche */}
          {isMobile && location.pathname === '/search' && (
            <div className="flex-1 flex justify-center">
              <button
                onClick={toggleTab}
                className="flex items-center space-x-2 px-4 py-2 bg-pink-100 text-pink-600 rounded-full font-medium transition-all duration-200 hover:bg-pink-200"
              >
                {activeTab === 'gallery' ? (
                  <>
                    <FaImages className="w-4 h-4" />
                    <span className="text-sm">Galerie</span>
                  </>
                ) : (
                  <>
                    <FaUserTie className="w-4 h-4" />
                    <span className="text-sm">Coiffeurs</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Menu principal */}
          {isUserValid && (
            <>
              {/* Menu desktop */}
              {!isMobile && (
                <nav className="flex items-center gap-6">
              {user.role === 'client' ? (
                <>
                  <Link 
                    to="/client/dashboard" 
                    className="text-fashion-gray-700 hover:text-fashion-black font-fashion font-medium transition-colors duration-200"
                  >
                    Tableau de bord
                  </Link>
                  <Link 
                    to="/client/bookings" 
                    className="text-fashion-gray-700 hover:text-fashion-black font-fashion font-medium transition-colors duration-200"
                  >
                    Mes réservations
                  </Link>
                  <Link 
                    to="/client/favorites" 
                    className="text-fashion-gray-700 hover:text-fashion-black font-fashion font-medium transition-colors duration-200"
                  >
                    Favoris
                  </Link>
                  <Link 
                    to="/client/chat" 
                    className="text-fashion-gray-700 hover:text-fashion-black font-fashion font-medium transition-colors duration-200 relative"
                  >
                    Messagerie
                    {unreadCount > 0 && (
                      <span className="absolute -top-2 -right-3 bg-fashion-black text-white text-xs rounded-full px-2 py-0.5 font-bold animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    to="/coiffeur/dashboard" 
                    className="text-fashion-gray-700 hover:text-fashion-black font-fashion font-medium transition-colors duration-200"
                  >
                    Tableau de bord
                  </Link>
                  <Link 
                    to="/coiffeur/reservations" 
                    className="text-fashion-gray-700 hover:text-fashion-black font-fashion font-medium transition-colors duration-200"
                  >
                    Réservations
                  </Link>
                  <Link 
                    to="/coiffeur/revenue" 
                    className="text-fashion-gray-700 hover:text-fashion-black font-fashion font-medium transition-colors duration-200"
                  >
                    Revenus
                  </Link>
                  <Link 
                    to={`/coiffeur/${user._id}?tab=services`}
                    className="text-fashion-gray-700 hover:text-fashion-black font-fashion font-medium transition-colors duration-200"
                  >
                    Mes Services & Produits
                  </Link>
                  <Link 
                    to="/coiffeur/chat" 
                    className="text-fashion-gray-700 hover:text-fashion-black font-fashion font-medium transition-colors duration-200 relative"
                  >
                    Messagerie
                    {unreadCount > 0 && (
                      <span className="absolute -top-2 -right-3 bg-fashion-black text-white text-xs rounded-full px-2 py-0.5 font-bold animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                </>
              )}
                </nav>
              )}

            </>
          )}

          <div className="flex-1" />

          {/* Gestionnaire de statut de connexion pour les coiffeurs */}
          {isUserValid && user.role === 'coiffeur' && (
            <div className="mr-4">
              <ConnectionStatusManager />
            </div>
          )}

          {/* User dropdown ou Connexion */}
          {!isUserValid ? (
            <Link
              to="/login"
              className="bg-fashion-black text-white px-6 py-2.5 rounded-full font-fashion font-medium hover:bg-fashion-gray-800 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Connexion
            </Link>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex items-center gap-3 px-4 py-2 rounded-full hover:bg-fashion-gray-100 transition-all duration-200 focus:outline-none group"
              >
                {user.photo && user.photo !== PHOTO_URLS.DEFAULT_AVATAR ? (
                  <img
                    src={getImageUrl(user.photo, DEFAULT_USER_IMAGE)}
                    alt={user.name || 'Photo de profil'}
                    className="w-8 h-8 rounded-full object-cover border-2 border-fashion-gray-200 group-hover:border-fashion-gray-300 transition-colors duration-200"
                    onError={(e) => handleImageError(e, DEFAULT_USER_IMAGE)}
                  />
                ) : null}
                <div className={`w-8 h-8 rounded-full bg-fashion-black text-white flex items-center justify-center font-fashion font-medium group-hover:bg-fashion-gray-800 transition-colors duration-200 ${user.photo && user.photo !== PHOTO_URLS.DEFAULT_AVATAR ? 'hidden' : ''}`}>
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="font-fashion font-medium text-fashion-gray-800 group-hover:text-fashion-black transition-colors duration-200">
                  {user.name || 'Mon compte'}
                </span>
                <svg 
                  className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {dropdownOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-fashion-light-gray border border-fashion-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="p-4 border-b border-fashion-gray-100">
                    <div className="font-fashion font-medium text-fashion-gray-900">{user.name}</div>
                    <div className="text-sm text-fashion-gray-500">{user.email}</div>
                  </div>
                  <ul className="py-2">
                    <li>
                      <Link
                        to={user?.role === 'client' ? '/client/profile' : '/coiffeur/profile'}
                        className="flex items-center gap-3 px-4 py-3 text-fashion-gray-700 hover:bg-fashion-gray-50 transition-colors duration-200"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <FaUser className="text-sm" />
                        <span className="font-fashion">Voir mon profil</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        to={user?.role === 'client' ? '/client/dashboard' : '/coiffeur/dashboard'}
                        className="flex items-center gap-3 px-4 py-3 text-fashion-gray-700 hover:bg-fashion-gray-50 transition-colors duration-200"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <FaCog className="text-sm" />
                        <span className="font-fashion">Paramètres</span>
                      </Link>
                    </li>
                    <li className="border-t border-fashion-gray-100 mt-2 pt-2">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 text-fashion-gray-700 hover:bg-fashion-gray-50 transition-colors duration-200 w-full text-left"
                      >
                        <FaSignOutAlt className="text-sm" />
                        <span className="font-fashion">Déconnexion</span>
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