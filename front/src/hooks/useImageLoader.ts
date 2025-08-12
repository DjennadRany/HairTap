import { useState, useEffect } from 'react';
import { validateAndFixImageUrl, getDefaultImage } from '../utils/imageUtils';

interface UseImageLoaderProps {
  src: string | null | undefined;
  fallbackType?: 'coiffeur' | 'service' | 'user';
}

interface UseImageLoaderReturn {
  imageSrc: string;
  isLoading: boolean;
  hasError: boolean;
  retry: () => void;
}

export const useImageLoader = ({ 
  src, 
  fallbackType = 'service' 
}: UseImageLoaderProps): UseImageLoaderReturn => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  const loadImage = (imageUrl: string) => {
    setIsLoading(true);
    setHasError(false);

    // Valider et corriger l'URL
    const validatedUrl = validateAndFixImageUrl(imageUrl);
    setImageSrc(validatedUrl);

    // Créer une image pour tester le chargement
    const img = new Image();
    
    img.onload = () => {
      setIsLoading(false);
      setHasError(false);
    };

    img.onerror = () => {
      setIsLoading(false);
      setHasError(true);
      setImageSrc(getDefaultImage(fallbackType));
    };

    img.src = validatedUrl;
  };

  const retry = () => {
    if (src) {
      loadImage(src);
    }
  };

  useEffect(() => {
    if (src) {
      loadImage(src);
    } else {
      setImageSrc(getDefaultImage(fallbackType));
      setIsLoading(false);
    }
  }, [src, fallbackType]);

  return {
    imageSrc,
    isLoading,
    hasError,
    retry
  };
}; 