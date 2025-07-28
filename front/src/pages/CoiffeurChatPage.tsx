import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import { ChatWindow } from '../components/ChatWindow';
import { getConversations } from '../hooks/useChat';
import { userService } from '../services/api/users';
import { User } from '../types/user';

export const CoiffeurChatPage: React.FC = () => {
  const user = useSelector(selectCurrentUser);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [clients, setClients] = useState<Record<string, User>>({});

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          const convs = await getConversations();
          setConversations(convs);

          // Récupérer les informations des clients
          const clientIds = convs.map(conv => conv.userId);
          const uniqueClientIds = [...new Set(clientIds)];
          const clientsData = await Promise.all(
            uniqueClientIds.map(id => {
              let userId = typeof id === 'string' ? id : (id && typeof id === 'object' && (id._id || id.id)) ? (id._id || id.id) : null;
              return userId ? userService.getUser(userId) : Promise.resolve(null);
            })
          );
          const clientsMap = (clientsData.filter((client): client is User => !!client)).reduce((acc, client) => {
            acc[client._id] = client;
            return acc;
          }, {} as Record<string, User>);
          setClients(clientsMap);
        } catch (error) {
          console.error('Error fetching chat data:', error);
        }
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Rafraîchir toutes les 30 secondes
    return () => clearInterval(interval);
  }, [user]);

  if (!user) return <div>Veuillez vous connecter.</div>;

  return (
    <div className="flex h-[80vh] max-w-4xl mx-auto mt-8 border rounded-lg shadow bg-white">
      <div className="w-1/3 border-r p-4 overflow-y-auto">
        <h2 className="font-bold text-lg mb-4">Mes clients</h2>
        <ul className="space-y-2">
          {conversations.length === 0 && <li className="text-gray-500">Aucun client à afficher</li>}
          {conversations.map((conv) => {
            const client = clients[conv.userId];
            if (!client) return null;
            const lastMsg = conv.lastMessage;
            const isUnread = conv.unread > 0;
            return (
              <li
                key={client._id}
                className={`flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-gray-100 ${selectedClientId === client._id ? 'bg-primary/10' : ''}`}
                onClick={() => setSelectedClientId(client._id)}
              >
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                  {client.photos && client.photos.length > 0 ? (
                    <img src={client.photos[0]} alt={client.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-accent text-white text-xl font-bold">
                      {client.name[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold truncate ${isUnread ? 'text-accent font-bold' : ''}`}>{client.name}</span>
                    {isUnread && <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">{conv.unread}</span>}
                  </div>
                  {lastMsg && (
                    <span className={`block text-xs truncate ${isUnread ? 'font-bold' : 'text-gray-500'}`}>
                      {lastMsg.from === user._id ? 'Moi: ' : client.name + ': '}{lastMsg.content}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="flex-1">
        {selectedClientId ? (
          <ChatWindow currentUserId={user._id} otherUserId={selectedClientId} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Sélectionnez un client pour commencer la conversation
          </div>
        )}
      </div>
    </div>
  );
}; 