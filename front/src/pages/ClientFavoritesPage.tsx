import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { favoriteService } from "../services/api/favorites";
import { useNotification } from "../components/ui/NotificationManager";
import type { User } from "../types/models";
import { FaStar, FaMapMarkerAlt, FaHeart, FaClock, FaImages, FaEuroSign } from "react-icons/fa";
import { MdVerified } from "react-icons/md";
import { getImageUrl, handleImageError, DEFAULT_COIFFEUR_IMAGE, DEFAULT_SERVICE_IMAGE } from "../utils/imageUtils";

export const ClientFavoritesPage = () => {
  const [favorites, setFavorites] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setLoading(true);
        const favoritesData = await favoriteService.getFavorites();
        setFavorites(favoritesData);
      } catch (error) {
        console.error('Error fetching favorites:', error);
        setFavorites([]);
        showNotification({
          type: 'error',
          title: 'Erreur',
          message: 'Impossible de charger vos favoris'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchFavorites();
  }, [showNotification]);

  const handleRemoveFavorite = async (e: React.MouseEvent, coiffeurId: string) => {
    e.stopPropagation(); // Empêcher la navigation
    try {
      await favoriteService.removeFavorite(coiffeurId);
      setFavorites(favorites.filter(coiffeur => coiffeur._id !== coiffeurId));
      showNotification({
        type: 'success',
        title: 'Favori retiré',
        message: 'Coiffeur retiré de vos favoris'
      });
    } catch (error) {
      console.error('Error removing favorite:', error);
      showNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de retirer ce favori'
      });
    }
  };

  const handleCardClick = (coiffeurId: string) => {
    navigate(`/coiffeur/${coiffeurId}`);
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
          <button
            onClick={() => navigate('/search')}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-black transition-colors"
          >
            Découvrir des coiffeurs
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((coiffeur) => (
            <div 
              key={coiffeur._id} 
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer"
              onClick={() => handleCardClick(coiffeur._id)}
            >
              {/* En-tête avec photo et infos principales */}
              <div className="relative">
                {/* Photo de profil avec fallback */}
                <div className="h-48 bg-gradient-to-br from-accent/10 to-accent/20 relative">
                  {coiffeur.photo ? (
                    <img
                      src={getImageUrl(coiffeur.photo, DEFAULT_COIFFEUR_IMAGE)}
                      alt={coiffeur.name}
                      className="w-full h-full object-cover"
                      onError={(e) => handleImageError(e, DEFAULT_COIFFEUR_IMAGE)}
                    />
                  ) : (
                    <div className="w-full h-full bg-accent text-white flex items-center justify-center text-6xl font-bold">
                      {coiffeur.name ? coiffeur.name.charAt(0).toUpperCase() : 'C'}
                    </div>
                  )}
                  
                  {/* Badge vérifié */}
                  {coiffeur.sirenStatus === 'verified' && (
                    <div className="absolute top-3 right-3 bg-blue-500 text-white rounded-full p-1">
                      <MdVerified className="text-lg" />
                    </div>
                  )}

                  {/* Bouton favori - Cœur rouge */}
                  <button
                    onClick={(e) => handleRemoveFavorite(e, coiffeur._id)}
                    className="absolute top-3 left-3 p-2 rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 transition-colors"
                    title="Retirer des favoris"
                  >
                    <FaHeart className="text-lg fill-current" />
                  </button>
                </div>

                {/* Infos principales */}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 mb-1">
                        {coiffeur.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-2">{coiffeur.email}</p>
                      
                      {/* Note et avis */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center gap-1">
                          <FaStar className="text-yellow-400" />
                          <span className="font-semibold">{coiffeur.rating || 0}</span>
                          <span className="text-gray-500 text-sm">({coiffeur.totalRatings || 0} avis)</span>
                        </div>
                      </div>

                      {/* Spécialités */}
                      {coiffeur.specialities && coiffeur.specialities.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {coiffeur.specialities.slice(0, 3).map((speciality, index) => (
                            <span
                              key={index}
                              className="bg-accent/10 text-accent px-2 py-1 rounded-full text-xs font-medium"
                            >
                              {speciality}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Localisation */}
                      {coiffeur.address && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
                          <FaMapMarkerAlt className="text-accent" />
                          <span>{coiffeur.address.city}</span>
                        </div>
                      )}

                      {/* Mode de travail */}
                      {coiffeur.workingMode && coiffeur.workingMode.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {coiffeur.workingMode.map((mode, index) => (
                            <span
                              key={index}
                              className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium"
                            >
                              {mode === 'salon' ? 'En salon' : mode === 'domicile' ? 'À domicile' : mode}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Bio */}
                      {coiffeur.bio && (
                        <p className="text-gray-700 text-sm mb-3 line-clamp-2">{coiffeur.bio}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCardClick(coiffeur._id)}
                      className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg text-center font-medium hover:bg-black transition-colors"
                    >
                      Voir le profil
                    </button>
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

export default ClientFavoritesPage; 