import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectProfile, updatePreferences } from '../store/slices/profileSlice';
import { mockUsers, User } from '../mocks/users';
import ListCardToggle from '../components/ListCardToggle';

const ClientFavoritesPage = () => {
  const dispatch = useDispatch();
  const profile = useSelector(selectProfile);
  const favoriteIds = profile?.preferences?.favoriteCoiffeurs || [];
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const favorites = favoriteIds
    .map((id) => mockUsers.find((u) => u.id === id))
    .filter((u): u is User => !!u);

  const handleRemove = (id: string) => {
    const newFavorites = favoriteIds.filter((fav) => fav !== id);
    dispatch(
      updatePreferences({
        favoriteCoiffeurs: newFavorites,
        preferredServices: profile?.preferences?.preferredServices || []
      })
    );
  };

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
            <div key={user.id} className="bg-white rounded-lg shadow p-4">
              <img
                src={user.picture}
                alt={user.name}
                className="w-full h-40 object-cover rounded-md mb-4"
              />
              <h3 className="text-lg font-semibold">{user.name}</h3>
              <button
                onClick={() => handleRemove(user.id)}
                className="mt-2 text-red-600 hover:text-red-800"
              >
                Retirer des favoris
              </button>
            </div>
          ))}
        </div>
      ) : (
        <ul className="space-y-4">
          {favorites.map((user) => (
            <li
              key={user.id}
              className="bg-white rounded-lg shadow p-4 flex items-center justify-between"
            >
              <div className="flex items-center space-x-4">
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-16 h-16 object-cover rounded-full"
                />
                <h3 className="text-lg font-semibold">{user.name}</h3>
              </div>
              <button
                onClick={() => handleRemove(user.id)}
                className="text-red-600 hover:text-red-800"
              >
                Retirer
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ClientFavoritesPage; 