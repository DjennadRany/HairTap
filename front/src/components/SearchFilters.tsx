import { type ChangeEvent, useState, useRef, useEffect } from 'react';
import { serviceService } from '../services/api/services';
import { SmartKeywordInput } from './SmartKeywordInput';
import { FaMapMarkerAlt, FaCalendarAlt, FaStar, FaEuroSign } from 'react-icons/fa';
import { API_CONFIG } from '../config/api';

export interface SearchFilters {
  service: string;
  mode: ('salon' | 'domicile')[];
  priceRange: [number, number];
  rating: number;
  specialities: string[];
  city?: string;
  date?: string;
  maxDistance?: number;
}

interface SearchFiltersProps {
  filters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
  isLoading?: boolean;
}

export const SearchFilters = ({ filters, onFilterChange, isLoading = false }: SearchFiltersProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [skipFilter, setSkipFilter] = useState(false);
  const [serviceOptions, setServiceOptions] = useState<string[]>([]);
  const [specialityOptions, setSpecialityOptions] = useState<string[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const services = await serviceService.getServices();
        const uniqueServices = [...new Set(services.map(s => s.name))];
        setServiceOptions(uniqueServices);
      } catch (err) {
        console.error('Error fetching services:', err);
      }
    };

    const fetchSpecialities = async () => {
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/global-specialties?popular=true&limit=50`);
        const data = await response.json();
        if (data.success) {
          const uniqueSpecialities = [...new Set(data.data.map((s: any) => s.name))];
          setSpecialityOptions(uniqueSpecialities);
        }
      } catch (err) {
        console.error('Error fetching specialities:', err);
      }
    };

    fetchServices();
    fetchSpecialities();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredServiceOptions = skipFilter
    ? serviceOptions
    : filters.service
      ? serviceOptions.filter(opt => opt.toLowerCase().includes(filters.service.toLowerCase()))
      : serviceOptions;

  const handleChange = (e: ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'priceRange') {
      onFilterChange({
        ...filters,
        priceRange: [0, parseInt(value)]
      });
    } else if (name === 'date') {
      onFilterChange({
        ...filters,
        date: value
      });
    } else if (name === 'city') {
      onFilterChange({
        ...filters,
        city: value
      });
    } else if (name === 'maxDistance') {
      onFilterChange({
        ...filters,
        maxDistance: parseInt(value)
      });
    } else {
      onFilterChange({
        ...filters,
        [name]: value
      });
    }
  };

  const handleModeChange = (mode: 'salon' | 'domicile') => {
    const newModes = filters.mode.includes(mode)
      ? filters.mode.filter(m => m !== mode)
      : [...filters.mode, mode];
    onFilterChange({
      ...filters,
      mode: newModes
    });
  };

  const handleSpecialitiesChange = (specialities: string[]) => {
    onFilterChange({
      ...filters,
      specialities
    });
  };

  const handleRatingChange = (rating: number) => {
    onFilterChange({
      ...filters,
      rating
    });
  };

  return (
    <div className={`space-y-6 bg-white p-6 rounded-lg shadow-lg border border-gray-200 ${isLoading ? 'opacity-50' : ''}`}>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Filtres de recherche</h2>
      
      <div ref={wrapperRef} className="relative">
        {/* Service */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Service
          </label>
          <input
            type="text"
            name="service"
            value={filters.service}
            onFocus={() => { setShowSuggestions(true); setSkipFilter(true); }}
            onChange={e => { setSkipFilter(false); handleChange(e); setShowSuggestions(true); }}
            placeholder="Choisissez un service"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          {/* Suggestions de services */}
          {showSuggestions && filteredServiceOptions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
              {filteredServiceOptions.map((service, index) => (
                <div
                  key={index}
                  className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  onClick={() => {
                    onFilterChange({ ...filters, service });
                    setShowSuggestions(false);
                  }}
                >
                  {service}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ville */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ville
          </label>
          <div className="relative">
            <FaMapMarkerAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              name="city"
              value={filters.city || ''}
              onChange={handleChange}
              placeholder="Entrez une ville"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Date */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date
          </label>
          <div className="relative">
            <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              name="date"
              value={filters.date || ''}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Mode */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mode
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.mode.includes('salon')}
                onChange={() => handleModeChange('salon')}
                className="mr-2 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              En salon
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.mode.includes('domicile')}
                onChange={() => handleModeChange('domicile')}
                className="mr-2 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              À domicile
            </label>
          </div>
        </div>

        {/* Prix maximum */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prix maximum
          </label>
          <div className="relative">
            <FaEuroSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="range"
              name="priceRange"
              min="0"
              max="200"
              value={filters.priceRange[1]}
              onChange={handleChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="text-center mt-2 text-sm text-gray-600">
              {filters.priceRange[1]}€
            </div>
          </div>
        </div>

        {/* Note minimum */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Note minimum
          </label>
          <div className="flex items-center space-x-2">
            <FaStar className="text-yellow-400" />
            <input
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={filters.rating}
              onChange={(e) => handleRatingChange(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <span className="text-sm text-gray-600 min-w-[60px]">
              {filters.rating} étoiles
            </span>
          </div>
        </div>

        {/* Distance maximum */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Distance maximum
          </label>
          <input
            type="range"
            name="maxDistance"
            min="1"
            max="50"
            value={filters.maxDistance || 10}
            onChange={handleChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="text-center mt-2 text-sm text-gray-600">
            {filters.maxDistance || 10} km
          </div>
        </div>

        {/* Spécialités */}
        <div className="mb-6">
          <SmartKeywordInput
            value={filters.specialities || []}
            onChange={handleSpecialitiesChange}
            placeholder="Rechercher des spécialités..."
            minKeywords={0}
            maxKeywords={20}
            className=""
          />
        </div>
      </div>

      {/* Bouton de recherche */}
      <button
        onClick={() => onFilterChange(filters)}
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Recherche en cours...' : 'Rechercher'}
      </button>
    </div>
  );
}; 