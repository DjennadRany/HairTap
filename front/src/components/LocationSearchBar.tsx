import { useState } from 'react';
import { GeolocationService, GeolocationError } from '../domain/location/services/GeolocationService';
import { Coordinates, SearchRadius } from '../domain/location/types';

interface LocationSearchBarProps {
  onLocationSelect: (coordinates: Coordinates) => void;
  onRadiusChange: (radius: SearchRadius) => void;
  defaultRadius?: number;
}

export const LocationSearchBar = ({
  onLocationSelect,
  onRadiusChange,
  defaultRadius = 10
}: LocationSearchBarProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [radius, setRadius] = useState<SearchRadius>({
    value: defaultRadius,
    unit: 'km'
  });

  const handleGeolocationClick = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const geolocationService = GeolocationService.getInstance();
      const coordinates = await geolocationService.getCurrentPosition();
      onLocationSelect(coordinates);
    } catch (error) {
      if (error instanceof GeolocationError) {
        setError(error.message);
      } else {
        setError('Une erreur est survenue lors de la géolocalisation');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRadiusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newRadius = {
      value: parseInt(event.target.value),
      unit: 'km' as const
    };
    setRadius(newRadius);
    onRadiusChange(newRadius);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Entrez une adresse..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={handleGeolocationClick}
            disabled={isLoading}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full 
              ${isLoading ? 'bg-gray-100' : 'bg-accent hover:bg-accent/90'} 
              transition-colors duration-200`}
            title="Utiliser ma position actuelle"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-white"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        </div>

        <select
          value={radius.value}
          onChange={handleRadiusChange}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
          disabled={isLoading}
        >
          <option value="5">5 km</option>
          <option value="10">10 km</option>
          <option value="20">20 km</option>
          <option value="50">50 km</option>
        </select>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
    </div>
  );
}; 