import React, { useState, useEffect } from 'react';
import { favoriteService } from '../../../services/api/favorites';
import { useAuth } from '../../../hooks/useAuth';

interface FavoriteStarProps {
  coiffeurId: string;
  size?: number;
  onToggle?: (isFavorite: boolean) => void;
}

const FavoriteStar: React.FC<FavoriteStarProps> = ({ coiffeurId, size = 24, onToggle }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const checkFavorite = async () => {
      if (isAuthenticated) {
        try {
          const isFav = await favoriteService.isFavorite(coiffeurId);
          setIsFavorite(isFav);
        } catch (error) {
          console.error('Error checking favorite status:', error);
        }
      }
    };

    checkFavorite();
  }, [coiffeurId, isAuthenticated]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      // Rediriger vers la page de connexion ou afficher une notification
      return;
    }

    setIsLoading(true);
    try {
      if (isFavorite) {
        await favoriteService.removeFavorite(coiffeurId);
        setIsFavorite(false);
      } else {
        await favoriteService.addFavorite(coiffeurId);
        setIsFavorite(true);
      }
      onToggle?.(!isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading || !isAuthenticated}
      className={`focus:outline-none transition-colors ${
        isFavorite 
          ? 'text-yellow-400 hover:text-yellow-500' 
          : 'text-gray-300 hover:text-gray-400'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      title={!isAuthenticated ? 'Connectez-vous pour ajouter aux favoris' : isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      style={{ fontSize: size }}
      type="button"
    >
      {isFavorite ? '★' : '☆'}
    </button>
  );
};

export default FavoriteStar; 