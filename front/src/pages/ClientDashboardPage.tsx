import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import { selectProfile } from '../store/slices/profileSlice';
import { useClientBookings } from '../hooks/useClientBookings';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { userService } from '../services/api/users';
import type { User } from '../types/models';

const ClientDashboardPage = () => {
  const user = useSelector(selectCurrentUser);
  const profile = useSelector(selectProfile);
  const { getUpcomingBookings } = useClientBookings();
  const upcoming = getUpcomingBookings();
  const favoriteIds = (profile?.preferences?.favoriteCoiffeurs || []).map(String);
  const [favorites, setFavorites] = useState<User[]>([]);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (favoriteIds.length) {
        try {
          const users = await Promise.all(
            favoriteIds.map((id: string) => userService.getUser(id))
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
  }, [favoriteIds]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Tableau de bord</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Bienvenue {user?.name}</h2>
          <p className="text-gray-600">
            Gérez vos rendez-vous et vos préférences depuis votre tableau de bord.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-secondary p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Prochains rendez-vous</h3>
            {upcoming.length === 0 ? (
              <p className="text-gray-600">Aucun rendez-vous prévu. <Link to="/client/bookings" className="text-accent underline">Voir mes réservations</Link></p>
            ) : (
              <ul className="space-y-2">
                {upcoming.slice(0, 3).map((b) => (
                  <li key={b._id} className="flex flex-col border-b pb-2 last:border-b-0 last:pb-0">
                    <span className="font-medium">{b.service} avec {b.coiffeur}</span>
                    <span className="text-sm text-gray-500">{new Date(b.date).toLocaleString()}</span>
                    <span className="text-xs text-gray-400">Statut : {b.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-secondary p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Coiffeurs favoris</h3>
            {favorites.length === 0 ? (
              <p className="text-gray-600">Aucun coiffeur favori. <Link to="/client/favorites" className="text-accent underline">Voir mes favoris</Link></p>
            ) : (
              <ul className="flex flex-col gap-2">
                {favorites.slice(0, 3).map((fav) => (
                  <li key={fav._id} className="flex items-center gap-2">
                    <img src={fav.photos?.[0] || '/default-avatar.png'} alt={fav.name} className="w-8 h-8 rounded-full object-cover" />
                    <span>{fav.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboardPage; 