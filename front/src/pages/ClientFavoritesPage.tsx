import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { favoriteService } from "../services/api/favorites";
import type { User } from "../types/models";
import { FaStar, FaMapMarkerAlt } from "react-icons/fa";

export const ClientFavoritesPage = () => {
  const [favorites, setFavorites] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setLoading(true);
        const favoritesData = await favoriteService.getFavorites();
        setFavorites(favoritesData);
      } catch (error) {
        console.error('Error fetching favorites:', error);
        setFavorites([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFavorites();
  }, []);

  const handleRemoveFavorite = async (coiffeurId: string) => {
    try {
      await favoriteService.removeFavorite(coiffeurId);
      setFavorites(favorites.filter(coiffeur => coiffeur._id !== coiffeurId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
          <p className="text-gray-600 mt-2">Chargement des favoris...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Mes Favoris</h1>
      
      {favorites.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">Vous n'avez pas encore de coiffeurs favoris</p>
          <Link 
            to="/search" 
            className="bg-accent text-white px-6 py-3 rounded-lg hover:bg-accent/90 transition-colors"
          >
            Découvrir des coiffeurs
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((coiffeur) => (
            <div key={coiffeur._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <img
                    src={coiffeur.photo || '/default-avatar.png'}
                    alt={coiffeur.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-semibold text-lg">{coiffeur.name}</h3>
                    <p className="text-gray-600 text-sm">{coiffeur.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveFavorite(coiffeur._id)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                  title="Retirer des favoris"
                >
                  <FaStar className="text-xl" />
                </button>
              </div>
              
              {coiffeur.bio && (
                <p className="text-gray-700 mb-4 line-clamp-2">{coiffeur.bio}</p>
              )}
              
              {coiffeur.address && (
                <div className="flex items-center text-gray-600 text-sm mb-4">
                  <FaMapMarkerAlt className="mr-2" />
                  <span>{coiffeur.address.city}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <FaStar className="text-yellow-400" />
                  <span className="font-semibold">{coiffeur.rating || 0}</span>
                  <span className="text-gray-500 text-sm">({coiffeur.totalRatings || 0})</span>
                </div>
                <Link
                  to={`/coiffeur/${coiffeur._id}`}
                  className="bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors text-sm"
                >
                  Voir le profil
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientFavoritesPage; 