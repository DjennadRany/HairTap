import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import { mockUsers } from '../mocks/users';
import { ChatWindow } from '../components/ChatWindow';
import { getConversations } from '../hooks/useChat';

export const CoiffeurChatPage: React.FC = () => {
  const user = useSelector(selectCurrentUser);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  useEffect(() => {
    if (user) {
      setConversations(getConversations(String(user.id)));
    }
    const interval = setInterval(() => {
      if (user) setConversations(getConversations(String(user.id)));
    }, 1000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user) return <div>Veuillez vous connecter.</div>;

  return (
    <div className="flex h-[80vh] max-w-4xl mx-auto mt-8 border rounded-lg shadow bg-white overflow-hidden">
      {/* Liste des clients */}
      <div className={`w-full sm:w-1/3 border-r p-2 sm:p-4 overflow-y-auto ${selectedClientId && mobileView === 'chat' ? 'hidden sm:block' : ''}`}>
        <h2 className="font-bold text-lg mb-4 sm:block hidden">Mes clients</h2>
        <h2 className="font-bold text-lg mb-4 sm:hidden block text-center">Conversations</h2>
        <ul className="space-y-2">
          {conversations.length === 0 && <li className="text-gray-500">Aucun client à afficher</li>}
          {conversations.map((conv) => {
            const client = mockUsers.find(u => String(u.id) === conv.userId && u.role === 'client');
            if (!client) return null;
            const lastMsg = conv.lastMessage;
            const isUnread = conv.unread > 0;
            return (
              <li
                key={client.id}
                className={`flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-gray-100 ${selectedClientId === String(client.id) ? 'bg-primary/10' : ''}`}
                onClick={() => {
                  setSelectedClientId(String(client.id));
                  setMobileView('chat');
                }}
              >
                <img src={client.picture} alt={client.name} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold truncate ${isUnread ? 'text-accent font-bold' : ''}`}>{client.name}</span>
                    {isUnread && <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">{conv.unread}</span>}
                  </div>
                  {lastMsg && (
                    <span className={`block text-xs truncate ${isUnread ? 'font-bold' : 'text-gray-500'}`}>{lastMsg.from === user.id ? 'Moi: ' : client.name + ': '}{lastMsg.content}</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      {/* Fenêtre de chat */}
      <div className={`flex-1 flex flex-col ${(!selectedClientId || mobileView === 'list') ? 'hidden sm:flex' : 'flex'}`}>
        {selectedClientId ? (
          <>
            {/* Bouton retour toujours visible */}
            <div className="flex items-center p-2 border-b bg-gray-50">
              <button
                className="mr-2 text-primary font-bold text-2xl flex items-center justify-center w-10 h-10 rounded-full hover:bg-primary/10 transition"
                onClick={() => setMobileView('list')}
                aria-label="Retour à la liste"
              >
                <span className="inline-block">&#8592;</span>
              </button>
              <span className="font-semibold truncate">{(() => {
                const client = mockUsers.find(u => String(u.id) === selectedClientId && u.role === 'client');
                return client ? client.name : '';
              })()}</span>
            </div>
            <div className="flex-1 flex flex-col">
              <ChatWindow currentUserId={String(user.id)} otherUserId={selectedClientId} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">Sélectionnez un client pour discuter</div>
        )}
      </div>
    </div>
  );
}; 