import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectProfile, updatePreferences } from '../store/slices/profileSlice';

interface FavoriteStarProps {
  coiffeurId: string | number;
  size?: number;
}

const FavoriteStar: React.FC<FavoriteStarProps> = ({ coiffeurId, size = 24 }) => {
  const dispatch = useDispatch();
  const profile = useSelector(selectProfile);
  const idStr = String(coiffeurId);
  const favoriteIds = (profile?.preferences?.favoriteCoiffeurs || []).map(String);
  const isFavorite = favoriteIds.includes(idStr);

  console.log('FavoriteStar:', { favoriteIds, idStr, isFavorite });

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    let newFavorites;
    if (isFavorite) {
      newFavorites = favoriteIds.filter((fav: string) => fav !== idStr);
    } else {
      newFavorites = [...favoriteIds, idStr];
    }
    dispatch(
      updatePreferences({
        favoriteCoiffeurs: newFavorites,
        preferredServices: profile?.preferences?.preferredServices || []
      })
    );
  };

  return (
    <button
      onClick={handleToggle}
      className={`focus:outline-none ${isFavorite ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-500 transition-colors`}
      aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      style={{ fontSize: size }}
      type="button"
    >
      {isFavorite ? '★' : '☆'}
    </button>
  );
};

export default FavoriteStar; 