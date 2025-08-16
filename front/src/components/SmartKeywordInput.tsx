import React, { useState, useEffect, useRef } from 'react';
import { FaPlus, FaTimes, FaSearch, FaInfoCircle } from 'react-icons/fa';
import { API_CONFIG } from '../config/api';

interface GlobalSpecialty {
  _id: string;
  name: string;
  category: string;
  description?: string;
  usageCount: number;
  isVerified: boolean;
}

interface SmartKeywordInputProps {
  value: string[];
  onChange: (keywords: string[]) => void;
  placeholder?: string;
  minKeywords?: number;
  maxKeywords?: number;
  category?: string;
  className?: string;
}

export const SmartKeywordInput: React.FC<SmartKeywordInputProps> = ({
  value = [],
  onChange,
  placeholder = "Tapez pour rechercher des spécialités...",
  minKeywords = 5,
  maxKeywords = 49,
  category,
  className = ""
}) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<GlobalSpecialty[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const remainingKeywords = maxKeywords - value.length;
  const isValid = value.length >= minKeywords && value.length <= maxKeywords;

  // Charger les suggestions populaires au montage
  useEffect(() => {
    loadPopularSuggestions();
  }, [category]);

  // Gérer le clic en dehors des suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadPopularSuggestions = async () => {
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      params.append('popular', 'true');
      params.append('limit', '20');

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/global-specialties?${params}`);
      const data = await response.json();
      
      if (data.success) {
        // Filtrer les spécialités déjà sélectionnées
        const filteredSuggestions = data.data.filter((spec: GlobalSpecialty) => 
          !value.includes(spec.name)
        );
        setSuggestions(filteredSuggestions);
      }
    } catch (error) {
      console.error('Erreur chargement suggestions populaires:', error);
    }
  };

  const searchSpecialties = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/global-specialties/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit: 15, category })
      });

      const data = await response.json();
      
      if (data.success) {
        // Filtrer les spécialités déjà sélectionnées
        const allSuggestions = [
          ...(data.data.exact ? [data.data.exact] : []),
          ...data.data.suggestions
        ];
        
        const filteredSuggestions = allSuggestions.filter((spec: GlobalSpecialty) => 
          !value.includes(spec.name)
        );
        
        setSuggestions(filteredSuggestions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Erreur recherche spécialités:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setError('');

    if (newValue.trim()) {
      searchSpecialties(newValue);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const addKeyword = (keyword: string) => {
    if (value.length >= maxKeywords) {
      setError(`Maximum de ${maxKeywords} mots-clés atteint`);
      return;
    }

    if (value.includes(keyword)) {
      setError('Ce mot-clé est déjà ajouté');
      return;
    }

    const newKeywords = [...value, keyword];
    onChange(newKeywords);
    setInputValue('');
    setShowSuggestions(false);
    setError('');
    
    // Incrémenter l'usage de la spécialité
    incrementSpecialtyUsage(keyword);
  };

  const removeKeyword = (index: number) => {
    const newKeywords = value.filter((_, i) => i !== index);
    onChange(newKeywords);
    setError('');
  };

  const incrementSpecialtyUsage = async (keyword: string) => {
    try {
      const specialty = suggestions.find(s => s.name === keyword);
      if (specialty) {
        await fetch(`${API_CONFIG.BASE_URL}/api/global-specialties/${specialty._id}/increment`, {
          method: 'PATCH'
        });
      }
    } catch (error) {
      console.error('Erreur incrément usage:', error);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addKeyword(inputValue.trim());
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeKeyword(value.length - 1);
    }
  };

  const addAllSuggestions = () => {
    const availableSuggestions = suggestions.slice(0, remainingKeywords);
    const newKeywords = [...value, ...availableSuggestions.map(s => s.name)];
    onChange(newKeywords);
    setShowSuggestions(false);
    setError('');
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* En-tête avec informations */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900">MOTS-CLÉS</h3>
          <FaInfoCircle className="text-gray-400" title="Spécialités et compétences" />
          <span className="text-sm text-gray-500">(min: {minKeywords} - max: {maxKeywords})</span>
        </div>
        <div className="text-sm text-gray-500">
          Mots-clés restants: {remainingKeywords}
        </div>
      </div>

      {/* Zone de saisie et affichage */}
      <div className="relative">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              placeholder={placeholder}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                error ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={value.length >= maxKeywords}
            />
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}

        {/* Indicateur de validation */}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isValid && (
              <div className="flex items-center text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm">Valide</span>
              </div>
            )}
            <span className="text-sm text-gray-500">
              {value.length}/{maxKeywords} mots-clés
            </span>
          </div>
        </div>

        {/* Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            <div className="p-3 border-b border-gray-200 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Suggestions de mots-clés:</span>
              {remainingKeywords > 0 && (
                <button
                  onClick={addAllSuggestions}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Ajouter tout
                </button>
              )}
            </div>
            
            <div className="p-2">
              {suggestions.map((specialty) => (
                <div
                  key={specialty._id}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                  onClick={() => addKeyword(specialty.name)}
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-medium text-gray-900">{specialty.name}</span>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      {specialty.category}
                    </span>
                    {specialty.isVerified && (
                      <span className="text-green-600 text-xs">✓ Vérifié</span>
                    )}
                  </div>
                  <button className="text-green-600 hover:text-green-800">
                    <FaPlus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mots-clés sélectionnés */}
      <div className="space-y-2">
        {value.map((keyword, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <span className="font-medium text-gray-900">{keyword}</span>
              <span className="text-sm text-gray-500">#{index + 1}</span>
            </div>
            <button
              onClick={() => removeKeyword(index)}
              className="text-red-600 hover:text-red-800 transition-colors"
              title="Supprimer ce mot-clé"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Message si aucun mot-clé */}
      {value.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Aucun mot-clé configuré. Ajoutez vos premières spécialités !
        </div>
      )}

      {/* Indicateur de chargement */}
      {loading && (
        <div className="text-center py-2">
          <span className="text-gray-500">Recherche en cours...</span>
        </div>
      )}
    </div>
  );
};
