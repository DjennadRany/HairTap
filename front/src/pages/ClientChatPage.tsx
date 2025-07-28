import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../store/slices/authSlice";
import { selectProfile } from "../store/slices/profileSlice";
import { ChatWindow } from "../components/ChatWindow";
import { getConversations } from "../hooks/useChat";
import { userService } from "../services/api/users";
import type { User } from "../types/models";

export const ClientChatPage: React.FC = () => {
  const user = useSelector(selectCurrentUser);
  const profile = useSelector(selectProfile);
  const [selectedCoiffeurId, setSelectedCoiffeurId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [coiffeurs, setCoiffeurs] = useState<Record<string, User>>({});

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          const convs = await getConversations();
          setConversations(convs);

          // Récupérer les informations des coiffeurs
          const coiffeurIds = convs.map(conv => conv.userId);
          const uniqueCoiffeurIds = [...new Set(coiffeurIds)];
          const coiffeursData = await Promise.all(
            uniqueCoiffeurIds.map(id => {
              let userId = typeof id === 'string' ? id : (id && typeof id === 'object' && (id._id || id.id)) ? (id._id || id.id) : null;
              return userId ? userService.getUser(userId) : Promise.resolve(null);
            })
          );
          const coiffeursMap = (coiffeursData.filter((coiffeur): coiffeur is User => !!coiffeur)).reduce((acc, coiffeur) => {
            acc[coiffeur._id] = coiffeur;
            return acc;
          }, {} as Record<string, User>);
          setCoiffeurs(coiffeursMap);
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
        <h2 className="font-bold text-lg mb-4">Mes coiffeurs</h2>
        <ul className="space-y-2">
          {conversations.length === 0 && <li className="text-gray-500">Aucun coiffeur à afficher</li>}
          {conversations.map((conv) => {
            const coiffeur = coiffeurs[conv.userId];
            if (!coiffeur) return null;
            const lastMsg = conv.lastMessage;
            const isUnread = conv.unread > 0;
            return (
              <li key={coiffeur._id} className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
                <img
                  src={coiffeur.photo || '/default-avatar.png'}
                  alt={coiffeur.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold truncate ${isUnread ? 'text-accent font-bold' : ''}`}>{coiffeur.name}</span>
                    {isUnread && <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">{conv.unread}</span>}
                  </div>
                  {lastMsg && (
                    <span className={`block text-xs truncate ${isUnread ? 'font-bold' : 'text-gray-500'}`}>
                      {lastMsg.from === user._id ? 'Moi: ' : coiffeur.name + ': '}{lastMsg.content}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="flex-1">
        {selectedCoiffeurId ? (
          <ChatWindow currentUserId={user._id} otherUserId={selectedCoiffeurId} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Sélectionnez un coiffeur pour commencer la conversation
          </div>
        )}
      </div>
    </div>
  );
}; 