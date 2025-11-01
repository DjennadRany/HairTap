import React from 'react';
import { FaHome, FaCalendarAlt, FaHeart, FaUser } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { useIsMobile } from '../hooks/useIsMobile';

export const BottomNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  // Ne pas afficher sur desktop
  if (!isMobile) {
    return null;
  }

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[9999] shadow-lg">
      <div className="flex items-center justify-around py-2">
        {/* Tableau de bord */}
        <button
          onClick={() => handleNavigation('/client/dashboard')}
          className={`flex flex-col items-center py-2 px-3 ${
            isActive('/client/dashboard') ? 'text-pink-600' : 'text-gray-500'
          }`}
        >
          <FaHome className="text-lg mb-1" />
          <span className="text-xs">Accueil</span>
        </button>

        {/* Réservations */}
        <button
          onClick={() => handleNavigation('/client/bookings')}
          className={`flex flex-col items-center py-2 px-3 ${
            isActive('/client/bookings') ? 'text-pink-600' : 'text-gray-500'
          }`}
        >
          <FaCalendarAlt className="text-lg mb-1" />
          <span className="text-xs">Réservations</span>
        </button>

        {/* Favoris */}
        <button
          onClick={() => handleNavigation('/client/favorites')}
          className={`flex flex-col items-center py-2 px-3 ${
            isActive('/client/favorites') ? 'text-pink-600' : 'text-gray-500'
          }`}
        >
          <FaHeart className="text-lg mb-1" />
          <span className="text-xs">Favoris</span>
        </button>


        {/* Profil */}
        <button
          onClick={() => handleNavigation('/client/profile')}
          className={`flex flex-col items-center py-2 px-3 ${
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
