import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchMode, SortOption, SearchResult } from '../domain/types';
import { getSearchComponentFactory } from '../infrastructure/SearchComponentFactory';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { LocationSearchBar } from '@/components/LocationSearchBar';
import { SearchFilters } from '@/components/SearchFilters';
import type { SearchFilters as FiltersType } from '@/components/SearchFilters';
import { CoiffeurCard } from '@/components/CoiffeurCard';
import { idfCoiffeurs } from '../domain/mockData';
import { point, distance as turfDistance } from '@turf/turf';
import type { SearchResult as SR } from '../domain/types';
import { ProtectedRoute } from '../../../components/ProtectedRoute';

export const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [showMap, setShowMap] = useState(false); // Par défaut, vue liste
  const [isLoading, setIsLoading] = useState(false);
  // Selected hairdresser on map
  const [selectedResult, setSelectedResult] = useState<SR | null>(null);

  const [filters, setFilters] = useState<FiltersType>({
    service: '',
    mode: ['salon', 'domicile'],
    priceRange: [0, 200],
    rating: 0
  });
  const [center, setCenter] = useState<{ latitude: number; longitude: number }>({ latitude: 48.8566, longitude: 2.3522 });
  const [radius, setRadius] = useState<number>(10);
  // Générer dynamiquement les options de service
  const serviceOptions = React.useMemo(
    () => Array.from(new Set(idfCoiffeurs.flatMap(r => r.services))),
    []
  );
  const mobileMode: SearchMode = filters.mode.length === 2 ? 'both' : (filters.mode[0] as SearchMode);
  // Helper to translate SearchMode to CoiffeurCard mode array
  const getCardModes = (type: SearchMode): ('salon' | 'domicile')[] => {
    if (type === 'both') {
      return ['salon', 'domicile'];
    }
    return [type];
  };
  // États locaux pour la synchronisation UI
  const [results, setResults] = useState<SearchResult[]>([]);

  // Gestionnaires d'événements
  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const mockResults = idfCoiffeurs;
      // Reset selected on new search
      setSelectedResult(null);
      const filteredResults = mockResults.filter(result => {
        // Distance filter
        const from = point([center.longitude, center.latitude]);
        const to = point([result.location.longitude, result.location.latitude]);
        const distKm = turfDistance(from, to, { units: 'kilometers' });
        if (distKm > radius) return false;
        // Service filter
        if (filters.service) {
          const base = filters.service.split('-')[0].toLowerCase();
          if (!result.services.some(s => s.toLowerCase().includes(base))) return false;
        }
        // Mode filter
        if (result.type !== 'both' && !filters.mode.includes(result.type as 'salon' | 'domicile')) return false;
        // Price filter
        if (result.price > filters.priceRange[1]) return false;
        // Rating filter
        if (result.rating < filters.rating) return false;
        return true;
      });

      const sortedResults = [...filteredResults];

      setResults(sortedResults);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultClick = (id: number) => {
    navigate(`/coiffeur/${id}`);
  };

  // Marker click on map
  const handleMarkerClick = (id: number) => {
    const found = results.find(r => r.id === id) || null;
    setSelectedResult(found);
  };

  // Initialiser la recherche au chargement ou changement de filtres, centre ou rayon
  useEffect(() => {
    handleSearch();
  }, [filters, center, radius]);

  const componentFactory = getSearchComponentFactory();

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Toggle Liste / Carte */}
      <div className="p-4 flex justify-end">
        <div
          onClick={() => setShowMap(prev => !prev)}
          className="relative inline-block w-32 h-10 bg-accent/10 rounded-full p-1 cursor-pointer"
        >
          {/* Sliding indicator */}
          <div
            className={`bg-accent w-1/2 h-full rounded-full transition-transform transform ${
              showMap ? 'translate-x-full' : 'translate-x-0'
            }`}
          />
          {/* Labels */}
          <div className="absolute inset-0 flex justify-between items-center px-2 text-sm font-medium">
            <span className={`${!showMap ? 'text-accent' : 'text-gray-500'}`}>Liste</span>
            <span className={`${showMap ? 'text-accent' : 'text-gray-500'}`}>Carte</span>
          </div>
        </div>
      </div>
      {/* Barre de recherche et géolocalisation */}
      <LocationSearchBar
        onLocationSelect={(coords) => { setCenter(coords); setShowMap(false); }}
        onRadiusChange={(sr) => setRadius(sr.value)}
        defaultRadius={radius}
      />

      {/* Main Content */}
      {showMap ? (
        <div className="max-w-6xl mx-auto relative">
          {/* Map centered */}
          <div className="w-full h-[80vh] rounded-lg overflow-hidden">
            {componentFactory.createResultMap({
              results,
              center: { lat: center.latitude, lng: center.longitude },
              onMarkerClick: handleMarkerClick,
              onMapClick: () => setSelectedResult(null)
            })}
          </div>
          {/* Overlay Filters */}
          <div className="absolute top-8 left-8 z-[1000] w-80 bg-white bg-opacity-90 rounded-lg shadow p-4">
            <SearchFilters
              filters={filters}
              onFilterChange={(newFilters: FiltersType) => setFilters(newFilters)}
              serviceOptions={serviceOptions}
              isLoading={isLoading}
            />
          </div>
          {/* Overlay summary on marker select */}
          {selectedResult && (
            <div className="absolute bottom-8 left-8 z-[1000] w-80 bg-white rounded-lg shadow-lg p-4">
              <CoiffeurCard
                key={selectedResult.id}
                id={selectedResult.id}
                name={selectedResult.name}
                rating={selectedResult.rating}
                services={selectedResult.services}
                priceRange={`À partir de ${selectedResult.price}€`}
                city={selectedResult.address}
                mode={getCardModes(selectedResult.type)}
                photo={selectedResult.image}
                onSelect={() => navigate(`/coiffeur/${selectedResult.id}`)}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 flex flex-col lg:flex-row lg:space-x-6">
          {/* Sidebar Filters */}
          <div className="mb-6 lg:mb-0 lg:w-1/4">
            <SearchFilters
              filters={filters}
              onFilterChange={(newFilters: FiltersType) => setFilters(newFilters)}
              serviceOptions={serviceOptions}
              isLoading={isLoading}
            />
          </div>
          {/* Results Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {results.map(result => (
                <CoiffeurCard
                  key={result.id}
                  id={result.id}
                  name={result.name}
                  rating={result.rating}
                  services={result.services}
                  priceRange={`À partir de ${result.price}€`}
                  city={result.address}
                  mode={getCardModes(result.type)}
                  photo={result.image}
                  onSelect={() => handleResultClick(result.id)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function ProtectedSearchPageWrapper() {
  return (
    <ProtectedRoute>
      <SearchPage />
    </ProtectedRoute>
  );
} 