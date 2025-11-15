import React from 'react';
import { FaHome, FaCalendarAlt, FaHeart, FaUser, FaDollarSign, FaCut, FaComments } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useIsMobile } from '../../../hooks/useIsMobile';
import type { RootState } from '../../../store/store';

export const BottomNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { user } = useSelector((state: RootState) => state.auth);

  // Ne pas afficher sur desktop
  if (!isMobile) {
    return null;
  }

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  // Navigation pour les coiffeurs
  if (user?.role === 'coiffeur') {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[9999] shadow-lg">
        <div className="flex items-center justify-around py-2">
          {/* Tableau de bord */}
          <button
            onClick={() => handleNavigation('/coiffeur/dashboard')}
            className={`flex flex-col items-center py-2 px-3 min-w-[60px] ${
              isActive('/coiffeur/dashboard') ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <FaHome className="text-lg mb-1" />
            <span className="text-xs">Tableau</span>
          </button>

          {/* Réservations */}
          <button
            onClick={() => handleNavigation('/coiffeur/reservations')}
            className={`flex flex-col items-center py-2 px-3 min-w-[60px] ${
              isActive('/coiffeur/reservations') ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <FaCalendarAlt className="text-lg mb-1" />
            <span className="text-xs">Réservations</span>
          </button>

          {/* Revenus */}
          <button
            onClick={() => handleNavigation('/coiffeur/revenue')}
            className={`flex flex-col items-center py-2 px-3 min-w-[60px] ${
              isActive('/coiffeur/revenue') ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <FaDollarSign className="text-lg mb-1" />
            <span className="text-xs">Revenus</span>
          </button>

          {/* Services */}
          <button
            onClick={() => handleNavigation(`/coiffeur/${user._id}?tab=services`)}
            className={`flex flex-col items-center py-2 px-3 min-w-[60px] ${
              location.pathname.includes('/coiffeur/') && location.search.includes('tab=services') ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <FaCut className="text-lg mb-1" />
            <span className="text-xs">Services</span>
          </button>

          {/* Messagerie */}
          <button
            onClick={() => handleNavigation('/coiffeur/chat')}
            className={`flex flex-col items-center py-2 px-3 min-w-[60px] ${
              isActive('/coiffeur/chat') ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <FaComments className="text-lg mb-1" />
            <span className="text-xs">Messages</span>
          </button>
        </div>
      </div>
    );
  }

  // Navigation pour les clients (par défaut)
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[9999] shadow-lg">
      <div className="flex items-center justify-around py-2">
        {/* Tableau de bord */}
        <button
          onClick={() => handleNavigation('/client/dashboard')}
          className={`flex flex-col items-center py-2 px-3 min-w-[60px] ${
            isActive('/client/dashboard') ? 'text-pink-600' : 'text-gray-500'
          }`}
        >
          <FaHome className="text-lg mb-1" />
          <span className="text-xs">Accueil</span>
        </button>

        {/* Réservations */}
        <button
          onClick={() => handleNavigation('/client/bookings')}
          className={`flex flex-col items-center py-2 px-3 min-w-[60px] ${
            isActive('/client/bookings') ? 'text-pink-600' : 'text-gray-500'
          }`}
        >
          <FaCalendarAlt className="text-lg mb-1" />
          <span className="text-xs">Réservations</span>
        </button>

        {/* Favoris */}
        <button
          onClick={() => handleNavigation('/client/favorites')}
          className={`flex flex-col items-center py-2 px-3 min-w-[60px] ${
            isActive('/client/favorites') ? 'text-pink-600' : 'text-gray-500'
          }`}
        >
          <FaHeart className="text-lg mb-1" />
          <span className="text-xs">Favoris</span>
        </button>

        {/* Profil */}
        <button
          onClick={() => handleNavigation('/client/profile')}
          className={`flex flex-col items-center py-2 px-3 min-w-[60px] ${
            isActive('/client/profile') ? 'text-pink-600' : 'text-gray-500'
          }`}
        >
          <FaUser className="text-lg mb-1" />
          <span className="text-xs">Profil</span>
        </button>
      </div>
    </div>
  );
};

export default BottomNavigation;
