import { useSelector } from 'react-redux';
import { useState } from 'react';
import { selectProfile } from '../store/slices/profileSlice';
import { mockUsers, User } from '../mocks/users';
import ListCardToggle from '../components/ListCardToggle';
import { Link } from 'react-router-dom';
import FavoriteStar from '../components/FavoriteStar';

const ClientFavoritesPage = () => {
  const profile = useSelector(selectProfile);
  const favoriteIds = (profile?.preferences?.favoriteCoiffeurs || []).map(String);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  // Mapping ids en string pour cohérence
  const favorites = favoriteIds
    .map((id) => mockUsers.find((u) => String(u.id) === id))
    .filter((u): u is User => !!u);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mes favoris</h1>
        <ListCardToggle view={view} onChange={setView} />
      </div>
      {favorites.length === 0 ? (
        <p className="text-gray-600">Vous n'avez pas encore de favoris.</p>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {favorites.map((user) => (
            <div key={user.id} className="bg-white rounded-lg shadow p-4 relative">
              <Link to={`/coiffeur/${user.id}`} className="block">
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-full h-40 object-cover rounded-md mb-4"
                />
                <h3 className="text-lg font-semibold">{user.name}</h3>
              </Link>
              <div className="absolute bottom-3 right-3 z-10">
                <div className="rounded-full bg-white shadow-lg p-1 flex items-center justify-center">
                  <FavoriteStar coiffeurId={String(user.id)} size={28} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ul className="space-y-4">
          {favorites.map((user) => (
            <li
              key={user.id}
              className="bg-white rounded-lg shadow p-4 flex items-center justify-between relative"
            >
              <Link to={`/coiffeur/${user.id}`} className="flex items-center space-x-4">
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-16 h-16 object-cover rounded-full"
                />
                <h3 className="text-lg font-semibold">{user.name}</h3>
              </Link>
              <div className="ml-4">
                <FavoriteStar coiffeurId={String(user.id)} size={28} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ClientFavoritesPage; 