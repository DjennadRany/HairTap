import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchMode } from '../domain/types';
import { getSearchComponentFactory } from '../infrastructure/SearchComponentFactory';
import { LocationSearchBar } from '@/components/LocationSearchBar';
import { SearchFilters, type SearchFilters as SearchFiltersType } from '../../../components/SearchFilters';
import { CoiffeurCard } from '../../../components/CoiffeurCard';
import { point, distance as turfDistance } from '@turf/turf';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { coiffeurService } from '@/services/api/coiffeurs';
import { Map } from '../../../components/Map';
import { useGeolocation } from '../../../hooks/useGeolocation';
import { useCoiffeursWithServices } from '@/hooks/useCoiffeursWithServices';
import { User, Service } from '@/types/models';

export const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const { location, error: locationError } = useGeolocation();
  const [showMap, setShowMap] = useState(false);
  const { coiffeurs, loading, error } = useCoiffeursWithServices();
  const [selectedResults, setSelectedResults] = useState<(User & { services: Service[] })[]>([]);
  const [results, setResults] = useState<(User & { services: Service[] })[]>([]);

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

  // Filtrage local selon les filtres et la géolocalisation
  useEffect(() => {
    let filtered = coiffeurs;
    // Filtres simples
    if (filters.service) {
      filtered = filtered.filter(c => c.services.some(s => s.name === filters.service));
    }
    if (filters.mode && filters.mode.length > 0) {
      filtered = filtered.filter(c => Array.isArray(c.speciality) && filters.mode.every(m => c.speciality?.includes(m)));
    }
    if (filters.priceRange) {
      filtered = filtered.filter(c => c.services.some(s => s.price >= filters.priceRange[0] && s.price <= filters.priceRange[1]));
    }
    if (filters.city) {
      const cityFilter = typeof filters.city === 'string' ? filters.city : '';
      filtered = filtered.filter(c => c.address?.city && c.address.city.toLowerCase().includes(cityFilter.toLowerCase()));
    }
    // Filtres avancés (note, date, etc. à ajouter si besoin)
    // Filtre géolocalisation
    if (location) {
      filtered = filtered.filter(coiffeur => {
        if (!coiffeur.address?.coordinates) return true;
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          coiffeur.address.coordinates.lat,
          coiffeur.address.coordinates.lng
        );
        return distance <= 50; // 50km max
      });
    }
    setResults(filtered);
    setSelectedResults(filtered);
  }, [coiffeurs, filters, location]);

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

  const handleCoiffeurClick = (coiffeur: User & { services: Service[] }) => {
    navigate(`/coiffeur/${coiffeur._id}`);
  };

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
            onClick={() => {}}
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

          {error && <div className="text-red-500">{error}</div>}

          {showMap ? (
            <Map
              coiffeurs={selectedResults}
              userLocation={location || undefined}
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