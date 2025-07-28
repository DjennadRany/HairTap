import { useState, useEffect } from "react";
import { selectProfile } from "../store/slices/profileSlice";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { userService } from "../services/api/users";
import type { User } from "../types/models";

export const ClientFavoritesPage = () => {
  const profile = useSelector(selectProfile);
  const [favorites, setFavorites] = useState<User[]>([]);

  useEffect(() => {
    const fetchFavorites = async () => {
      const favoriteIds: string[] = Array.isArray(profile?.preferences?.favoriteCoiffeurs)
        ? profile.preferences.favoriteCoiffeurs.map(String)
        : [];
      if (favoriteIds.length) {
        try {
          const users = await Promise.all(
            favoriteIds.map((userId) =>
              userService.getUser(userId).catch((e) => { console.error('Erreur getUser', userId, e); return null; })
            )
          );
          setFavorites(users.filter((u): u is User => !!u));
        } catch (error) {
          setFavorites([]);
        }
      } else {
        setFavorites([]);
      }
    };
    fetchFavorites();
  }, [profile]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Mes coiffeurs favoris</h1>
      {favorites.length === 0 ? (
        <div className="text-gray-500">Aucun favori pour le moment.</div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((coiffeur) => (
            <li key={coiffeur._id} className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
              <img
                src={coiffeur.photo || '/default-avatar.png'}
                alt={coiffeur.name}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="font-semibold text-lg">{coiffeur.name}</div>
                <div className="text-gray-500">{coiffeur.email}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-8">
        <Link to="/search" className="text-accent hover:underline">Trouver un nouveau coiffeur</Link>
      </div>
    </div>
  );
};

export default ClientFavoritesPage; 