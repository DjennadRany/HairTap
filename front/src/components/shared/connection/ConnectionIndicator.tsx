import React from 'react';

export interface ConnectionStatus {
  isOnline: boolean;
  lastSeen: Date;
  status: 'online' | 'busy' | 'offline' | 'away';
  availability: {
    isAvailable: boolean;
    nextAvailable?: Date;
    workingHours: {
      [key: string]: {
        start: string;
        end: string;
        isAvailable: boolean;
      };
    };
  };
}

interface ConnectionIndicatorProps {
  status: ConnectionStatus | undefined;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const ConnectionIndicator: React.FC<ConnectionIndicatorProps> = ({
  status,
  size = 'md',
  showLabel = false,
  className = ''
}) => {
  const getStatusColor = () => {
    if (!status) return 'bg-transparent border-2 border-gray-300';
    
    switch (status.status) {
      case 'online':
        return status.availability?.isAvailable ? 'bg-green-500' : 'bg-yellow-500';
      case 'busy':
        return 'bg-yellow-500';
      case 'away':
        return 'bg-orange-500';
      case 'offline':
      default:
        return 'bg-red-500';
    }
  };

  const getStatusLabel = () => {
    if (!status) return 'Statut inconnu';
    
    switch (status.status) {
      case 'online':
        return status.availability?.isAvailable ? 'En ligne et disponible' : 'En ligne mais occupé';
      case 'busy':
        return 'En ligne mais occupé';
      case 'away':
        return 'Absent';
      case 'offline':
        return 'Hors ligne';
      default:
        return 'Statut inconnu';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-3 h-3';
      case 'md':
        return 'w-4 h-4';
      case 'lg':
        return 'w-6 h-6';
      default:
        return 'w-4 h-4';
    }
  };

  const isUnknown = !status || !status.isOnline;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`
          ${getStatusColor()}
          ${getSizeClasses()}
          rounded-full
          ${isUnknown ? 'border-2 border-gray-300' : ''}
          shadow-lg
          transition-all duration-300
          hover:scale-110
        `}
        title={getStatusLabel()}
      />
      {showLabel && (
        <span className="text-xs font-medium text-gray-600">
          {getStatusLabel()}
        </span>
      )}
    </div>
  );
}; 