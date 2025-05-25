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
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

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

  // Gestion du responsive : split view sur desktop, navigation sur mobile
  return (
    <div className="flex h-[80vh] max-w-4xl mx-auto border rounded-lg shadow bg-white overflow-hidden">
      {/* Liste des conversations */}
      <div className={`w-full sm:w-1/3 border-r p-2 sm:p-4 overflow-y-auto ${selectedCoiffeurId && mobileView === 'chat' ? 'hidden sm:block' : ''}`}>
        <h2 className="font-bold text-lg mb-4 sm:block hidden">Mes coiffeurs</h2>
        <h2 className="font-bold text-lg mb-4 sm:hidden block text-center">Conversations</h2>
        <ul className="space-y-2">
          {coiffeurs.length === 0 && <li className="text-gray-500">Aucun coiffeur à afficher</li>}
          {coiffeurs.map((c: any) => (
            <li
              key={c.id}
              className={`flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-gray-100 ${selectedCoiffeurId === String(c.id) ? 'bg-primary/10' : ''}`}
              onClick={() => {
                setSelectedCoiffeurId(String(c.id));
                setMobileView('chat');
              }}
            >
              <img src={c.picture} alt={c.name} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover" />
              <span className="truncate">{c.name}</span>
            </li>
          ))}
        </ul>
      </div>
      {/* Fenêtre de chat */}
      <div className={`flex-1 flex flex-col ${(!selectedCoiffeurId || mobileView === 'list') ? 'hidden sm:flex' : 'flex'}`}>
        {selectedCoiffeurId ? (
          <>
            {/* Flèche retour juste sous le menu, hors du chat scrollable */}
            <div className="flex items-center h-12 px-2 border-b bg-gray-900 sticky top-0 z-20 sm:hidden">
              <button
                className="text-white font-bold text-2xl flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition"
                onClick={() => setMobileView('list')}
                aria-label="Retour à la liste"
              >
                <span className="inline-block">&#8592;</span>
              </button>
            </div>
            {/* Le chat scrollable commence ici, sous la flèche */}
            <div className="flex-1 flex flex-col min-h-0">
              <ChatWindow currentUserId={String(user.id)} otherUserId={selectedCoiffeurId} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">Sélectionnez un coiffeur pour discuter</div>
        )}
      </div>
    </div>
  );
}; 