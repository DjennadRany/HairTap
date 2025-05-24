import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import { selectProfile } from '../store/slices/profileSlice';
import { mockUsers } from '../mocks/users';
import { useClientBookings } from '../hooks/useClientBookings';
import { ChatWindow } from '../components/ChatWindow';

export const ClientChatPage: React.FC = () => {
  const user = useSelector(selectCurrentUser);
  const profile = useSelector(selectProfile);
  const { bookings } = useClientBookings();
  const [selectedCoiffeurId, setSelectedCoiffeurId] = useState<string | null>(null);

  if (!user) return <div>Veuillez vous connecter.</div>;

  // Coiffeurs avec qui le client a un booking (passé ou à venir)
  const coiffeurIdsFromBookings = Array.from(
    new Set(bookings.map(b => String(b.coiffeurId)))
  );
  // Coiffeurs favoris
  const favoriteIds = (profile?.preferences?.favoriteCoiffeurs || []).map(String);
  // Union unique
  const allCoiffeurIds = Array.from(new Set([...coiffeurIdsFromBookings, ...favoriteIds]));
  const coiffeurs = allCoiffeurIds
    .map(id => mockUsers.find(u => String(u.id) === id && u.role === 'coiffeur'))
    .filter(Boolean);

  return (
    <div className="flex h-[80vh] max-w-4xl mx-auto mt-8 border rounded-lg shadow bg-white">
      <div className="w-1/3 border-r p-4 overflow-y-auto">
        <h2 className="font-bold text-lg mb-4">Mes coiffeurs</h2>
        <ul className="space-y-2">
          {coiffeurs.length === 0 && <li className="text-gray-500">Aucun coiffeur à afficher</li>}
          {coiffeurs.map((c: any) => (
            <li
              key={c.id}
              className={`flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-gray-100 ${selectedCoiffeurId === String(c.id) ? 'bg-primary/10' : ''}`}
              onClick={() => setSelectedCoiffeurId(String(c.id))}
            >
              <img src={c.picture} alt={c.name} className="w-10 h-10 rounded-full" />
              <span>{c.name}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex-1 flex flex-col">
        {selectedCoiffeurId ? (
          <ChatWindow currentUserId={String(user.id)} otherUserId={selectedCoiffeurId} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">Sélectionnez un coiffeur pour discuter</div>
        )}
      </div>
    </div>
  );
}; 