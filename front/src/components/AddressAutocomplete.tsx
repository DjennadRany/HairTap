import React, { useState, useEffect, useRef } from 'react';
import { FaMapMarkerAlt, FaSearch } from 'react-icons/fa';

interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    house_number?: string;
    road?: string;
    postcode?: string;
    city?: string;
    country?: string;
  };
}

interface AddressAutocompleteProps {
  onAddressSelect: (address: {
    streetNumber: string;
    street: string;
    postalCode: string;
    city: string;
    country: string;
    coordinates: { lat: number; lng: number };
  }) => void;
  placeholder?: string;
  className?: string;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  onAddressSelect,
  placeholder = "Rechercher une adresse...",
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchAddress = async () => {
      if (query.length < 3) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5&countrycodes=fr`
        );
        const data = await response.json();
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Erreur recherche adresse:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(searchAddress, 500);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        selectAddress(suggestions[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const selectAddress = (suggestion: AddressSuggestion) => {
    const address = {
      streetNumber: suggestion.address.house_number || '',
      street: suggestion.address.road || '',
      postalCode: suggestion.address.postcode || '',
      city: suggestion.address.city || '',
      country: suggestion.address.country || '',
      coordinates: {
        lat: parseFloat(suggestion.lat),
        lng: parseFloat(suggestion.lon)
      }
    };

    onAddressSelect(address);
    setQuery(suggestion.display_name);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const formatSuggestion = (suggestion: AddressSuggestion) => {
    const parts = [];
    if (suggestion.address.house_number) parts.push(suggestion.address.house_number);
    if (suggestion.address.road) parts.push(suggestion.address.road);
    if (suggestion.address.postcode) parts.push(suggestion.address.postcode);
    if (suggestion.address.city) parts.push(suggestion.address.city);
    
    return parts.join(', ');
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 3 && setShowSuggestions(suggestions.length > 0)}
          placeholder={placeholder}
          className="w-full px-4 py-3 pl-12 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all"
        />
        <FaMapMarkerAlt className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
        {isLoading && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                index === selectedIndex ? 'bg-gray-100' : ''
              }`}
              onClick={() => selectAddress(suggestion)}
            >
              <div className="flex items-center gap-3">
                <FaSearch className="text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {formatSuggestion(suggestion)}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {suggestion.display_name}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;
