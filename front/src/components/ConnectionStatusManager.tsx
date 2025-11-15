import React, { useState, useEffect } from 'react';
import { useConnectionStatus } from '../hooks/useConnectionStatus';
import { selectCurrentUser } from '../store/slices/authSlice';
import { ConnectionIndicator } from './ConnectionIndicator';
import { FaCircle, FaTimes, FaCheck, FaClock, FaUserSlash } from 'react-icons/fa';
import { useAppSelector } from '../store/hooks';

export const ConnectionStatusManager: React.FC = () => {
  const user = useAppSelector(selectCurrentUser);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  
  const {
    status,
    loading,
    error,
    setAvailable,
    setBusy,
    setAway,
    setOffline,
    refreshStatus
  } = useConnectionStatus(user?._id || null);

  // Forcer la mise à jour du statut quand l'utilisateur change
  useEffect(() => {
    if (user?._id) {
      refreshStatus();
    }
  }, [user?._id, refreshStatus]);

  if (!user || user.role !== 'coiffeur') {
    return null; // Seuls les coiffeurs peuvent gérer leur statut
  }

  const handleStatusChange = async (newStatus: string, isAvailable?: boolean) => {
    try {
      switch (newStatus) {
        case 'online':
          await setAvailable();
          break;
        case 'busy':
          await setBusy();
          break;
        case 'away':
          await setAway();
          break;
        case 'offline':
          await setOffline();
          break;
      }
      setShowStatusMenu(false);
    } catch (error) {
      console.error('Error changing status:', error);
    }
  };

  const getStatusIcon = () => {
    if (!status) return <FaCircle className="text-gray-400" />;
    
    switch (status.status) {
      case 'online':
        return status.availability?.isAvailable ? 
          <FaCheck className="text-green-500" /> : 
          <FaClock className="text-yellow-500" />;
      case 'busy':
        return <FaClock className="text-yellow-500" />;
      case 'away':
        return <FaUserSlash className="text-orange-500" />;
      case 'offline':
      default:
        return <FaTimes className="text-red-500" />;
    }
  };

  const getStatusText = () => {
    if (!status) return 'Statut inconnu';
    
    switch (status.status) {
      case 'online':
        return status.availability?.isAvailable ? 'Disponible' : 'Occupé';
      case 'busy':
        return 'Occupé';
      case 'away':
        return 'Absent';
      case 'offline':
        return 'Hors ligne';
      default:
        return 'Statut inconnu';
    }
  };

  return (
    <div className="relative">
      {/* Bouton de statut */}
      <button
        onClick={() => setShowStatusMenu(!showStatusMenu)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        title="Gérer le statut de connexion"
      >
        <ConnectionIndicator status={status || undefined} size="sm" />
        <span className="text-sm font-medium text-gray-700">{getStatusText()}</span>
        <svg 
          className={`w-4 h-4 transition-transform ${showStatusMenu ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Menu de statut */}
      {showStatusMenu && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 mb-2 px-2">Changer le statut</div>
            
            <button
              onClick={() => handleStatusChange('online', true)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                status?.status === 'online' && status?.availability?.isAvailable
                  ? 'bg-green-100 text-green-700'
                  : 'hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <FaCheck className="text-green-500" />
                <span>Disponible</span>
              </div>
            </button>

            <button
              onClick={() => handleStatusChange('online', false)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                status?.status === 'online' && !status?.availability?.isAvailable
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <FaClock className="text-yellow-500" />
                <span>Occupé</span>
              </div>
            </button>

            <button
              onClick={() => handleStatusChange('away')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                status?.status === 'away'
                  ? 'bg-orange-100 text-orange-700'
                  : 'hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <FaUserSlash className="text-orange-500" />
                <span>Absent</span>
              </div>
            </button>

            <button
              onClick={() => handleStatusChange('offline')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                status?.status === 'offline'
                  ? 'bg-red-100 text-red-700'
                  : 'hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <FaTimes className="text-red-500" />
                <span>Hors ligne</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Overlay pour fermer le menu */}
      {showStatusMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowStatusMenu(false)}
        />
      )}
    </div>
  );
}; 