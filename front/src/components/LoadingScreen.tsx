import React from 'react';
import { FaSpinner } from 'react-icons/fa';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Chargement en cours...' 
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <FaSpinner className="text-4xl text-accent animate-spin mx-auto mb-4" />
        <p className="text-gray-600 text-lg">{message}</p>
        <div className="mt-4 space-y-2">
          <div className="w-2 h-2 bg-accent rounded-full animate-bounce mx-auto"></div>
          <div className="w-2 h-2 bg-accent rounded-full animate-bounce mx-auto" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-accent rounded-full animate-bounce mx-auto" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen; 