import { useState, useEffect, useRef } from 'react';
import { GeolocationService, GeolocationError } from '../domain/location/services/GeolocationService';
import { Coordinates, SearchRadius } from '../domain/location/types';
import { useDebounce } from '../hooks/useDebounce';

interface LocationSearchBarProps {
  onLocationSelect: (coordinates: Coordinates) => void;
  onRadiusChange: (radius: SearchRadius) => void;
  defaultRadius?: number;
}

interface AddressSuggestion {
  label: string;
  coordinates: Coordinates;
}

export const LocationSearchBar = ({
  onLocationSelect,
  onRadiusChange,
  defaultRadius = 10
}: LocationSearchBarProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [radius, setRadius] = useState<SearchRadius>({
    value: defaultRadius,
    unit: 'km'
  });
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchAddressSuggestions = async () => {
      if (!debouncedSearchQuery) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(debouncedSearchQuery)}&limit=5`
        );
        const data = await response.json();

        if (data.features) {
          const newSuggestions = data.features.map((feature: any) => ({
            label: feature.properties.label,
            coordinates: {
              latitude: feature.geometry.coordinates[1],
              longitude: feature.geometry.coordinates[0]
            }
          }));
          setSuggestions(newSuggestions);
        }
      } catch (err) {
        setError('Erreur lors de la recherche d\'adresse');
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAddressSuggestions();
  }, [debouncedSearchQuery]);

  const handleGeolocationClick = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const geolocationService = GeolocationService.getInstance();
      const coordinates = await geolocationService.getCurrentPosition();
      onLocationSelect(coordinates);
      setSearchQuery('');
      setSuggestions([]);
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

  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    onLocationSelect(suggestion.coordinates);
    setSearchQuery(suggestion.label);
    setShowSuggestions(false);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4" ref={wrapperRef}>
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
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

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-fashion-light-gray border border-gray-300 rounded-lg shadow-lg">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                >
                  {suggestion.label}
                </button>
              ))}
            </div>
          )}
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