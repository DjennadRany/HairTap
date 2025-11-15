import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchFilters, type SearchFilters as SearchFiltersType } from '../../../components/SearchFilters';
import CoiffeurCard from '../../../components/CoiffeurCard';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { coiffeurService } from '@/services/api/coiffeurs';
import { favoriteService } from '@/services/api/favorites';
import type { User } from '../../../types/models';
import { useGeolocation } from '../../../hooks/useGeolocation';
import { GalleryHub } from '../../../components/GalleryHub';
import { FaImages, FaUserTie } from 'react-icons/fa';
import ListCardToggle from '../../../components/ListCardToggle';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { useGallery } from '../../../contexts/GalleryContext';

export const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const { location } = useGeolocation();
  const isMobile = useIsMobile();
  const { activeTab, setActiveTab } = useGallery();
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [results, setResults] = useState<User[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  const [filters, setFilters] = useState<SearchFiltersType>({
    service: '',
    mode: [],
    priceRange: [0, 200],
    rating: 0,
    city: '',
    date: '',
    specialities: [],
    maxDistance: 25
  });

  const stableLocation = useMemo(() => {
    if (!location) {
      return null;
    }

    const { latitude, longitude } = location;
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return null;
    }

    return {
      latitude,
      longitude,
      key: `${latitude.toFixed(3)}-${longitude.toFixed(3)}`
    };
  }, [location]);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      const hasLocation = Boolean(stableLocation);
      const searchResults = await coiffeurService.searchCoiffeurs({
        service: filters.service || undefined,
        city: filters.city || undefined,
        date: filters.date || undefined,
        specialities: filters.specialities.length ? filters.specialities : undefined,
        modes: filters.mode.length ? filters.mode : undefined,
        rating: filters.rating > 0 ? filters.rating : undefined,
        priceMin: filters.priceRange[0],
        priceMax: filters.priceRange[1],
        ...(hasLocation
          ? {
              maxDistance: filters.maxDistance,
              latitude: stableLocation?.latitude,
              longitude: stableLocation?.longitude
            }
          : {})
      });

      setResults(searchResults);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [filters, stableLocation]);

  const handleCoiffeurClick = (coiffeur: User) => {
    navigate(`/coiffeur/${coiffeur._id}`);
  };

  // Charger les favoris de l'utilisateur
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const userFavorites = await favoriteService.getFavorites();
        setFavorites(userFavorites.map(fav => fav._id));
      } catch (error) {
        console.error('Erreur lors du chargement des favoris:', error);
        setFavorites([]);
      }
    };

    loadFavorites();
  }, []);

  // Fonction pour gérer les changements de favoris
  const handleFavoriteToggle = async (coiffeurId: string) => {
    try {
      if (favorites.includes(coiffeurId)) {
        // Retirer des favoris
        await favoriteService.removeFavorite(coiffeurId);
        setFavorites(prev => prev.filter(id => id !== coiffeurId));
      } else {
        // Ajouter aux favoris
        await favoriteService.addFavorite(coiffeurId);
        setFavorites(prev => [...prev, coiffeurId]);
      }
    } catch (error) {
      console.error('Erreur lors de la gestion des favoris:', error);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void handleSearch();
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [handleSearch]);

  return (
    <div className={`container mx-auto py-8 ${activeTab === 'gallery' && isMobile ? 'px-0' : 'px-4'}`}>
      {/* Onglets de navigation - Desktop uniquement */}
      {!isMobile && (
        <div className="flex justify-center mb-8">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('gallery')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'gallery'
                  ? 'bg-white text-pink-600 shadow-md'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <FaImages className="w-5 h-5" />
              <span>Galerie des Services</span>
            </button>
            <button
              onClick={() => setActiveTab('coiffeurs')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'coiffeurs'
                  ? 'bg-white text-pink-600 shadow-md'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <FaUserTie className="w-5 h-5" />
              <span>Rechercher des Coiffeurs</span>
            </button>
          </div>
        </div>
      )}

      {/* Contenu basé sur l'onglet actif */}
      {activeTab === 'gallery' ? (
        <GalleryHub />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <SearchFilters
              filters={filters}
              onFilterChange={setFilters}
              isLoading={loading}
            />
            <button
              onClick={() => {
                void handleSearch();
              }}
              disabled={loading}
              className="w-full mt-4 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-black disabled:opacity-50"
            >
              {loading ? 'Recherche...' : 'Rechercher'}
            </button>
          </div>

          <div className="md:col-span-3">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">
                {results.length} coiffeurs trouvés
              </h2>
              <ListCardToggle 
                view={viewMode} 
                onChange={setViewMode}
                className="ml-4"
              />
            </div>

            {results.length === 0 && !loading && (
              <div className="text-center text-gray-500">Aucun coiffeur trouvé.</div>
            )}

            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
              : "space-y-4"
            }>
              {results.map(coiffeur => (
                <CoiffeurCard
                  key={coiffeur._id}
                  coiffeur={coiffeur}
                  onClick={() => handleCoiffeurClick(coiffeur)}
                  userLocation={location || undefined}
                  onFavoriteToggle={handleFavoriteToggle}
                  isFavorite={favorites.includes(coiffeur._id)}
                  viewMode={viewMode}
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
