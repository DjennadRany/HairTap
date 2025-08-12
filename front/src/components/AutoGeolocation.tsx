import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaSpinner } from 'react-icons/fa';

interface AutoGeolocationProps {
  address: string;
  onCoordinatesFound: (coordinates: { lat: number; lng: number }) => void;
  onError?: (error: string) => void;
}

export const AutoGeolocation: React.FC<AutoGeolocationProps> = ({
  address,
  onCoordinatesFound,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasCoordinates, setHasCoordinates] = useState(false);

  useEffect(() => {
    if (!address || address.trim().length < 5) {
      return;
    }

    const geolocateAddress = async () => {
      setIsLoading(true);
      try {
        console.log('📍 [AutoGeolocation] Géolocalisation de:', address);
        
        // Utiliser l'API Nominatim d'OpenStreetMap
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
          {
            headers: {
              'User-Agent': 'TapHair/1.0'
            }
          }
        );

        if (!response.ok) {
          throw new Error('Erreur de géolocalisation');
        }

        const data = await response.json();
        
        if (data && data.length > 0) {
          const coordinates = {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon)
          };
          
          console.log('✅ [AutoGeolocation] Coordonnées trouvées:', coordinates);
          onCoordinatesFound(coordinates);
          setHasCoordinates(true);
        } else {
          console.log('❌ [AutoGeolocation] Aucune coordonnée trouvée');
          onError?.('Adresse non trouvée');
        }
      } catch (error) {
        console.error('❌ [AutoGeolocation] Erreur:', error);
        onError?.('Erreur de géolocalisation');
      } finally {
        setIsLoading(false);
      }
    };

    // Délai pour éviter les requêtes trop fréquentes
    const timeoutId = setTimeout(geolocateAddress, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [address, onCoordinatesFound, onError]);

  if (!address || address.trim().length < 5) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2 text-sm text-gray-600">
      {isLoading ? (
        <>
          <FaSpinner className="animate-spin" />
          <span>Géolocalisation en cours...</span>
        </>
      ) : hasCoordinates ? (
        <>
          <FaMapMarkerAlt className="text-green-500" />
          <span>Coordonnées trouvées</span>
        </>
      ) : (
        <>
          <FaMapMarkerAlt className="text-gray-400" />
          <span>Géolocalisation automatique</span>
        </>
      )}
    </div>
  );
}; 