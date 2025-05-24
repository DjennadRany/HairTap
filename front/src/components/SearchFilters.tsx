import React, { type ChangeEvent, useState, useRef, useEffect } from 'react';

export interface SearchFilters {
  service: string;
  mode: ('salon' | 'domicile')[];
  priceRange: [number, number];
  rating: number;
}

interface SearchFiltersProps {
  filters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
  isLoading?: boolean;
  serviceOptions: string[];
}

export const SearchFilters = ({ filters, onFilterChange, isLoading = false, serviceOptions }: SearchFiltersProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [skipFilter, setSkipFilter] = useState(false);
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

  return (
    <div className={`space-y-6 bg-white p-6 rounded-lg shadow ${isLoading ? 'opacity-50' : ''}`}>
      <div ref={wrapperRef} className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">Service</label>
        <input
          type="text"
          name="service"
          value={filters.service}
          onFocus={() => { setShowSuggestions(true); setSkipFilter(true); }}
          onChange={e => { setSkipFilter(false); handleChange(e); setShowSuggestions(true); }}
          placeholder="Choisissez un service"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent appearance-none"
          disabled={isLoading}
        />
        {showSuggestions && filteredServiceOptions.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-b-md shadow-lg max-h-60 overflow-auto">
            {filteredServiceOptions.map(opt => (
              <li
                key={opt}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  onFilterChange({ ...filters, service: opt });
                  setShowSuggestions(false);
                  setSkipFilter(true);
                }}
              >
                {opt}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mode
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.mode.includes('salon')}
              onChange={() => handleModeChange('salon')}
              className="rounded border-gray-300 text-accent focus:ring-accent"
              disabled={isLoading}
            />
            <span className="ml-2">En salon</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.mode.includes('domicile')}
              onChange={() => handleModeChange('domicile')}
              className="rounded border-gray-300 text-accent focus:ring-accent"
              disabled={isLoading}
            />
            <span className="ml-2">À domicile</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Prix maximum
        </label>
        <input
          type="range"
          name="priceRange"
          min="0"
          max="200"
          step="10"
          value={filters.priceRange[1]}
          onChange={handleChange}
          className="w-full"
          disabled={isLoading}
        />
        <div className="text-sm text-gray-500 mt-1">
          {filters.priceRange[1]}€
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Note minimum
        </label>
        <input
          type="range"
          name="rating"
          min="0"
          max="5"
          step="0.5"
          value={filters.rating}
          onChange={handleChange}
          className="w-full"
          disabled={isLoading}
        />
        <div className="text-sm text-gray-500 mt-1">
          {filters.rating} étoiles
        </div>
      </div>

      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      )}
    </div>
  );
}; 