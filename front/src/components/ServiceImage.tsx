import React, { useState } from 'react';
import { FaImage } from 'react-icons/fa';

interface ServiceImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
}

const ServiceImage: React.FC<ServiceImageProps> = ({ 
  src, 
  alt, 
  className = "w-full h-32 object-cover rounded-lg",
  fallbackIcon = <FaImage className="text-gray-400 text-2xl" />
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  if (hasError || !src) {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center`}>
        {fallbackIcon}
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className={`${className} bg-gray-100 flex items-center justify-center`}>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent"></div>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${isLoading ? 'hidden' : ''}`}
        onError={handleError}
        onLoad={handleLoad}
      />
    </div>
  );
};

export default ServiceImage; 