import React, { useState, useEffect } from 'react';
import { selectCurrentUser } from '../store/slices/authSlice';
import ChatWindow from '../components/ChatWindow';
import { getConversations } from '../hooks/useChat';
import { userService } from '../services/api/users';
import { User } from '../types/models';
import { getImageUrl, handleImageError, DEFAULT_USER_IMAGE } from '../utils/imageUtils';
import { useAppSelector } from '../store/hooks';

export const CoiffeurChatPage: React.FC = () => {
  const user = useAppSelector(selectCurrentUser);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<any[]>([]);
  const [clients, setClients] = useState<Record<string, User>>({});

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
                 try {
           const convs = await getConversations();
           setConversations(convs);
           
           // Filtrer les conversations (exclure celles avec soi-même)
           const filteredConvs = convs.filter(conv => conv.userId !== user._id);
           setFilteredConversations(filteredConvs);

           // Récupérer les informations des clients (exclure l'utilisateur connecté)
           const clientIds = filteredConvs.map(conv => conv.userId);
           const uniqueClientIds = [...new Set(clientIds)];
          const clientsData = await Promise.all(
            uniqueClientIds.map(id => {
              let userId: string | null = null;
              if (typeof id === 'string') {
                userId = id;
              } else if (id && typeof id === 'object') {
                userId = (id as any)._id || (id as any).id || null;
              }
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
    <div className="flex h-[80vh] max-w-4xl mx-auto mt-8 border rounded-lg shadow bg-fashion-light-gray">
      <div className="w-1/3 border-r p-4 overflow-y-auto">
        <h2 className="font-bold text-lg mb-4">Mes clients</h2>
                 <ul className="space-y-2">
           {filteredConversations.length === 0 && <li className="text-gray-500">Aucun client à afficher</li>}
           {filteredConversations.map((conv) => {
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
                                     {client.photo ? (
                    <img 
                      src={getImageUrl(client.photo, DEFAULT_USER_IMAGE)} 
                      alt={client.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => handleImageError(e, DEFAULT_USER_IMAGE)}
                    />
                  ) : null}
                   <div className={`w-full h-full flex items-center justify-center bg-black text-white text-xl font-bold ${client.photo ? 'hidden' : ''}`}>
                     {client.name[0]}
                   </div>
                 </div>
                <div className="flex-1 min-w-0">
                                     <div className="flex items-center gap-2">
                     <span className={`font-semibold truncate ${isUnread ? 'text-accent font-bold' : ''}`}>{client.name}</span>
                     {isUnread && <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">{conv.unread}</span>}
                   </div>
                   {/* Indicateur de statut de connexion */}
                   <div className="flex items-center gap-1 mt-1">
                     {client.connectionStatus?.isOnline ? (
                       <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                     ) : (
                       <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                     )}
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