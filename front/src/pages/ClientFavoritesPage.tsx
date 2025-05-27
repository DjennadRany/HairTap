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
      if (profile?.preferences?.favoriteCoiffeurs?.length) {
        try {
          const users = await Promise.all(
            profile.preferences.favoriteCoiffeurs.map((id: string) => userService.getUser(id))
          );
          setFavorites(users);
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
                src={coiffeur.photos?.[0] || '/default-avatar.png'}
                alt={coiffeur.name}
                className="w-16 h-16 object-cover rounded-full"
              />
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{coiffeur.name}</h3>
                <p className="text-gray-500">{coiffeur.speciality?.join(', ')}</p>
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