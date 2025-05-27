import { useState, useEffect } from 'react';

interface GeolocationState {
  latitude: number;
  longitude: number;
}

export const useGeolocation = () => {
  const [location, setLocation] = useState<GeolocationState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('La géolocalisation n\'est pas supportée par votre navigateur');
      return;
    }

    const successHandler = (position: GeolocationPosition) => {
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
      setError(null);
    };

    const errorHandler = (error: GeolocationPositionError) => {
      switch (error.code) {
        case error.PERMISSION_DENIED:
          setError('Vous devez autoriser la géolocalisation pour utiliser cette fonctionnalité');
          break;
        case error.POSITION_UNAVAILABLE:
          setError('Les informations de localisation ne sont pas disponibles');
          break;
        case error.TIMEOUT:
          setError('La demande de géolocalisation a expiré');
          break;
        default:
          setError('Une erreur inconnue est survenue');
      }
    };

    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    };

    const watchId = navigator.geolocation.watchPosition(
      successHandler,
      errorHandler,
      options
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return { location, error };
}; 