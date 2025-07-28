import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchMode } from '../domain/types';
import { getSearchComponentFactory } from '../infrastructure/SearchComponentFactory';
import { LocationSearchBar } from '@/components/LocationSearchBar';
import { SearchFilters, type SearchFilters as SearchFiltersType } from '../../../components/SearchFilters';
import { CoiffeurCard } from '../../../components/CoiffeurCard';
import { point, distance as turfDistance } from '@turf/turf';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { coiffeurService, type Coiffeur } from '@/services/api/coiffeurs';
import { Map } from '../../../components/Map';
import { useGeolocation } from '../../../hooks/useGeolocation';

export const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const { location, error: locationError } = useGeolocation();
  const [showMap, setShowMap] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedResults, setSelectedResults] = useState<Coiffeur[]>([]);
  const [results, setResults] = useState<Coiffeur[]>([]);

  const [filters, setFilters] = useState<SearchFiltersType>({
    service: '',
    mode: [],
    priceRange: [0, 200],
    rating: 0,
    city: '',
    date: ''
  });

  const [center, setCenter] = useState<{ latitude: number; longitude: number }>({ latitude: 48.8566, longitude: 2.3522 });
  const [radius, setRadius] = useState<number>(10);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const searchResults = await coiffeurService.searchCoiffeurs({
        service: filters.service,
        speciality: filters.mode,
        priceRange: filters.priceRange.map(p => p.toString()),
        city: filters.city,
        date: filters.date
      });
      console.log('Résultats recherche coiffeurs:', searchResults);

      // Filtrer par distance si la géolocalisation est disponible
      let filteredResults = searchResults;
      if (location) {
        filteredResults = searchResults.filter(coiffeur => {
          if (!coiffeur.address.coordinates) return true;
          const distance = calculateDistance(
            location.latitude,
            location.longitude,
            coiffeur.address.coordinates.lat,
            coiffeur.address.coordinates.lng
          );
          return distance <= 50; // 50km max
        });
      }

      setResults(filteredResults);
      setSelectedResults(filteredResults);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleCoiffeurClick = (coiffeur: Coiffeur) => {
    navigate(`/coiffeur/${coiffeur._id}`);
  };

  useEffect(() => {
    handleSearch();
  }, [filters, location]);

  const componentFactory = getSearchComponentFactory();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <SearchFilters
            filters={filters}
            onFilterChange={setFilters}
            isLoading={loading}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="w-full mt-4 bg-accent text-white py-2 px-4 rounded-md hover:bg-accent-dark disabled:opacity-50"
          >
            {loading ? 'Recherche...' : 'Rechercher'}
          </button>
        </div>

        <div className="md:col-span-3">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">
              {results.length} coiffeurs trouvés
            </h2>
            <button
              onClick={() => setShowMap(!showMap)}
              className="text-accent hover:text-accent-dark"
            >
              {showMap ? 'Voir la liste' : 'Voir la carte'}
            </button>
          </div>

          {results.length === 0 && !loading && (
            <div className="text-center text-gray-500">Aucun coiffeur trouvé.</div>
          )}

          {showMap ? (
            <Map
              coiffeurs={selectedResults}
              userLocation={location}
              onCoiffeurClick={handleCoiffeurClick}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map(coiffeur => (
                <CoiffeurCard
                  key={coiffeur._id}
                  coiffeur={coiffeur}
                  onClick={() => handleCoiffeurClick(coiffeur)}
                  userLocation={location}
                />
              ))}
            </div>
          )}
        </div>
      </div>
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