import React from 'react';
import { SearchMode, SortOption, SearchResult } from '../domain/types';
import { ResultCard } from '../presentation/components/ResultCard';
import { Map } from '../presentation/components/Map';
import { IoSearch } from 'react-icons/io5';

// Types de composants disponibles
export type SearchComponentType = 
  | 'searchBar'
  | 'filterPanel'
  | 'resultList'
  | 'resultMap'
  | 'sortBar';

// Props des composants
interface SearchBarProps {
  onSearch: (address: string) => void;
  placeholder?: string;
}

interface FilterPanelProps {
  mode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
  maxPrice: number;
  onMaxPriceChange: (price: number) => void;
  minRating: number;
  onMinRatingChange: (rating: number) => void;
}

interface ResultListProps {
  results: SearchResult[];
  onResultClick: (id: number) => void;
  isLoading?: boolean;
}

interface ResultMapProps {
  results: SearchResult[];
  center: { lat: number; lng: number };
  onMarkerClick: (id: number) => void;
  onMapClick?: () => void;
}

interface SortBarProps {
  sortBy: SortOption;
  onSortChange: (option: SortOption) => void;
}

// Factory abstraite
abstract class SearchComponentFactory {
  abstract createSearchBar(props: SearchBarProps): React.ReactNode;
  abstract createFilterPanel(props: FilterPanelProps): React.ReactNode;
  abstract createResultList(props: ResultListProps): React.ReactNode;
  abstract createResultMap(props: ResultMapProps): React.ReactNode;
  abstract createSortBar(props: SortBarProps): React.ReactNode;
}

// Factory pour mobile
class MobileSearchComponentFactory extends SearchComponentFactory {
  createSearchBar({ onSearch, placeholder }: SearchBarProps) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-fashion-light-gray shadow-md p-4">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder={placeholder}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                onSearch((e.target as HTMLInputElement).value);
              }
            }}
          />
          <button
            onClick={() => onSearch((document.querySelector('input') as HTMLInputElement).value)}
            className="p-2 bg-gray-600 text-white rounded-lg hover:bg-black transition-colors"
          >
            <IoSearch className="w-6 h-6" />
          </button>
        </div>
      </div>
    );
  }

  createFilterPanel({ mode, onModeChange, maxPrice, onMaxPriceChange, minRating, onMinRatingChange }: FilterPanelProps) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-fashion-light-gray shadow-lg p-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select
              value={mode}
              onChange={(e) => onModeChange(e.target.value as SearchMode)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
            >
              <option value="both">Tous</option>
              <option value="salon">Salon</option>
              <option value="domicile">À domicile</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Prix maximum</label>
            <input
              type="range"
              min="0"
              max="200"
              value={maxPrice}
              onChange={(e) => onMaxPriceChange(Number(e.target.value))}
              className="mt-1 block w-full"
            />
            <span className="text-sm text-gray-500">{maxPrice}€</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Note minimum</label>
            <input
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={minRating}
              onChange={(e) => onMinRatingChange(Number(e.target.value))}
              className="mt-1 block w-full"
            />
            <span className="text-sm text-gray-500">{minRating}★</span>
          </div>
        </div>
      </div>
    );
  }

  createResultList({ results, onResultClick, isLoading }: ResultListProps) {
    return (
      <div className="mt-16 pb-20 space-y-3 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          </div>
        ) : (
          results.map((result) => (
            <ResultCard
              key={result.id}
              result={result}
              onClick={() => onResultClick(result.id)}
              variant="full"
            />
          ))
        )}
      </div>
    );
  }

  createResultMap({ results, center, onMarkerClick, onMapClick }: ResultMapProps) {
    return (
      <div className="fixed inset-0 z-40">
        <Map
          center={{ latitude: center.lat, longitude: center.lng }}
          markers={results}
          onMarkerClick={onMarkerClick}
          onMapClick={onMapClick}
          className="w-full h-full"
        />
      </div>
    );
  }

  createSortBar({ sortBy, onSortChange }: SortBarProps) {
    return (
      <div className="fixed top-16 left-0 right-0 z-40 bg-fashion-light-gray shadow-sm p-2">
        <div className="flex space-x-2 overflow-x-auto">
          <button
            onClick={() => onSortChange('distance')}
            className={`px-3 py-1 rounded-full text-sm ${
              sortBy === 'distance' ? 'bg-fashion-dark-gray text-white' : 'bg-gray-100'
            }`}
          >
            Distance
          </button>
          <button
            onClick={() => onSortChange('rating')}
            className={`px-3 py-1 rounded-full text-sm ${
              sortBy === 'rating' ? 'bg-fashion-dark-gray text-white' : 'bg-gray-100'
            }`}
          >
            Note
          </button>
          <button
            onClick={() => onSortChange('price')}
            className={`px-3 py-1 rounded-full text-sm ${
              sortBy === 'price' ? 'bg-fashion-dark-gray text-white' : 'bg-gray-100'
            }`}
          >
            Prix
          </button>
        </div>
      </div>
    );
  }
}

// Factory pour desktop
class DesktopSearchComponentFactory extends SearchComponentFactory {
  createSearchBar({ onSearch, placeholder }: SearchBarProps) {
    return (
      <div className="bg-fashion-light-gray shadow-md p-4">
        <div className="max-w-7xl mx-auto flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder={placeholder}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  onSearch((e.target as HTMLInputElement).value);
                }
              }}
            />
          </div>
          <button
            onClick={() => onSearch((document.querySelector('input') as HTMLInputElement).value)}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-black transition-colors"
          >
            Rechercher
          </button>
        </div>
      </div>
    );
  }

  createFilterPanel({ mode, onModeChange, maxPrice, onMaxPriceChange, minRating, onMinRatingChange }: FilterPanelProps) {
    return (
      <div className="w-64 p-4 bg-fashion-light-gray shadow-lg">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Filtres</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  value={mode}
                  onChange={(e) => onModeChange(e.target.value as SearchMode)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                >
                  <option value="both">Tous</option>
                  <option value="salon">Salon</option>
                  <option value="domicile">À domicile</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Prix maximum</label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={maxPrice}
                  onChange={(e) => onMaxPriceChange(Number(e.target.value))}
                  className="mt-1 block w-full"
                />
                <span className="text-sm text-gray-500">{maxPrice}€</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Note minimum</label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={minRating}
                  onChange={(e) => onMinRatingChange(Number(e.target.value))}
                  className="mt-1 block w-full"
                />
                <span className="text-sm text-gray-500">{minRating}★</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  createResultList({ results, onResultClick, isLoading }: ResultListProps) {
    return (
      <div className="p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          </div>
        ) : (
          results.map((result) => (
            <ResultCard
              key={result.id}
              result={result}
              onClick={() => onResultClick(result.id)}
              variant="full"
            />
          ))
        )}
      </div>
    );
  }

  createResultMap({ results, center, onMarkerClick, onMapClick }: ResultMapProps) {
    return (
      <div className="w-full h-[80vh] rounded-lg overflow-hidden">
        <Map
          center={{ latitude: center.lat, longitude: center.lng }}
          markers={results}
          onMarkerClick={onMarkerClick}
          onMapClick={onMapClick}
          className="w-full h-full"
        />
      </div>
    );
  }

  createSortBar({ sortBy, onSortChange }: SortBarProps) {
    return (
      <div className="bg-fashion-light-gray shadow-sm p-2">
        <div className="max-w-7xl mx-auto flex space-x-4">
          <button
            onClick={() => onSortChange('distance')}
            className={`px-4 py-2 rounded-lg text-sm ${
              sortBy === 'distance' ? 'bg-fashion-dark-gray text-white' : 'bg-gray-100'
            }`}
          >
            Distance
          </button>
          <button
            onClick={() => onSortChange('rating')}
            className={`px-4 py-2 rounded-lg text-sm ${
              sortBy === 'rating' ? 'bg-fashion-dark-gray text-white' : 'bg-gray-100'
            }`}
          >
            Note
          </button>
          <button
            onClick={() => onSortChange('price')}
            className={`px-4 py-2 rounded-lg text-sm ${
              sortBy === 'price' ? 'bg-fashion-dark-gray text-white' : 'bg-gray-100'
            }`}
          >
            Prix
          </button>
        </div>
      </div>
    );
  }
}

// Fonction pour obtenir la factory appropriée
export const getSearchComponentFactory = (): SearchComponentFactory => {
  if (window.innerWidth <= 768) {
    return new MobileSearchComponentFactory();
  }
  return new DesktopSearchComponentFactory();
}; 