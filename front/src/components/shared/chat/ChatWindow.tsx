import React, { useRef, useEffect, useState } from 'react';
import { useChat } from '../../../hooks/useChat';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../store/slices/authSlice';
import { coiffeurService } from '../../../services/api/coiffeurs';
import { User } from '../../../types/models';
import { usePushNotification } from '../notifications/PushNotification';
import { toast } from 'react-toastify';

import { getImageUrl, handleImageError, DEFAULT_USER_IMAGE } from '../../../utils/imageUtils';

interface ChatWindowProps {
  currentUserId: string;
  otherUserId: string;
  otherUser?: User | null;
  otherUserStatus?: any; // Statut de connexion réel
}

const ChatWindow: React.FC<ChatWindowProps> = ({ currentUserId, otherUserId, otherUser: propOtherUser, otherUserStatus }) => {
  const { messages, loading, error, sendMessage } = useChat(currentUserId, otherUserId);
  const [input, setInput] = useState('');
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const currentUser = useSelector(selectCurrentUser);
  const { showNotification: showPushNotification } = usePushNotification();

  useEffect(() => {
    // Si on a déjà l'utilisateur via les props, l'utiliser directement
    if (propOtherUser && propOtherUser._id === otherUserId) {
      setOtherUser(propOtherUser);
      return;
    }

    // Éviter les appels multiples si l'utilisateur est déjà récupéré
    if (otherUser && otherUser._id === otherUserId) {
      return;
    }

    const fetchOtherUser = async () => {
      try {
        // Essayer d'abord avec le service coiffeur, puis avec le service utilisateur
        let user;
        try {
          user = await coiffeurService.getCoiffeur(otherUserId);
        } catch (err) {
          // Si ça échoue, essayer avec le service utilisateur
          try {
            const { userService } = await import('../../../services/api/users');
            user = await userService.getUser(otherUserId);
          } catch (userErr) {
            console.error('❌ Échec avec userService aussi:', userErr);
            throw userErr;
          }
        }
        
        if (user) {
          setOtherUser(user);
        }
      } catch (err) {
        console.error('❌ Erreur finale lors de la récupération:', err);
        // Créer un utilisateur par défaut pour éviter les erreurs
        const defaultUser = {
          _id: otherUserId,
          name: 'Coiffeur',
          photo: null,
          connectionStatus: { isOnline: false, lastSeen: new Date() },
          sirenStatus: 'unknown'
        };
        setOtherUser(defaultUser as any);
      }
    };

    fetchOtherUser();
  }, [otherUserId, otherUser?._id, propOtherUser]);



  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Notifications push pour les nouveaux messages
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.to === currentUserId && !lastMessage.read) {
        // Notification push pour les nouveaux messages
        showPushNotification(
          `Nouveau message de ${otherUser?.name || 'Quelqu\'un'}`,
          {
            body: lastMessage.content,
            tag: `message-${lastMessage.id}`,
            requireInteraction: false
          }
        );
      }
    }
  }, [messages, currentUserId, otherUser, showPushNotification]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input.trim());
      setInput('');
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    // Ici on pourrait envoyer un signal "typing" au serveur
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as any);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border rounded-lg bg-fashion-light-gray shadow-md max-w-lg mx-auto">
      <div className="flex items-center gap-3 p-4 border-b bg-gradient-to-r from-gray-50 to-white">
        <div className="relative">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 ring-2 ring-accent/20">
            {otherUser?.photo ? (
              <img 
                src={getImageUrl(otherUser.photo, DEFAULT_USER_IMAGE)} 
                alt={otherUser.name} 
                className="w-full h-full object-cover"
                onError={(e) => handleImageError(e, DEFAULT_USER_IMAGE)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-black text-white text-xl font-bold">
                {otherUser?.name?.[0]}
              </div>
            )}
          </div>
          {/* Indicateur de statut de connexion - Même système qu'à gauche */}
          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
            otherUserStatus?.isOnline ? 'bg-green-500' : 'bg-gray-400'
          }`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg">{otherUser?.name}</span>
            {otherUser?.sirenStatus === 'verified' && (
              <span className="text-blue-500 text-sm" title="Coiffeur vérifié">✓</span>
            )}
          </div>
          <div className="text-xs text-gray-500">
            {/* Statut simple - Même logique qu'à gauche */}
            <span className={otherUserStatus?.isOnline ? 'text-green-600 font-medium' : 'text-gray-500'}>
              {otherUserStatus?.isOnline ? 'En ligne' : 'Hors ligne'}
            </span>
            {isTyping && (
              <span className="text-blue-500 animate-pulse ml-2">
                <span className="inline-block animate-bounce">•</span>
                <span className="inline-block animate-bounce" style={{animationDelay: '0.1s'}}>•</span>
                <span className="inline-block animate-bounce" style={{animationDelay: '0.2s'}}>•</span>
              </span>
            )}
          </div>
        </div>
      </div>
      

      
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
        {messages.map((msg, idx) => {
          const isMine = msg.from === currentUserId;
          const isLast = idx === messages.length - 1;
          return (
            <div
              key={msg.id || `msg-${idx}-${msg.date || Date.now()}`}
              className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'}`}
            >
              {!isMine && (
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 mr-2 self-end">
                  {otherUser?.photo ? (
                    <img 
                      src={getImageUrl(otherUser.photo, DEFAULT_USER_IMAGE)} 
                      alt={otherUser.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => handleImageError(e, DEFAULT_USER_IMAGE)}
                    />
                  ) : null}
                  <div className={`w-full h-full flex items-center justify-center bg-black text-white text-sm font-bold ${otherUser?.photo ? 'hidden' : ''}`}>
                    {otherUser?.name?.[0] || 'C'}
                  </div>
                </div>
              )}
              <div
                className={`px-4 py-2 rounded-lg max-w-xs break-words shadow text-sm flex flex-col ${
                  isMine
                    ? 'bg-black text-white items-end ml-auto'
                    : 'bg-gray-100 text-black items-start'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-semibold ${!isMine && (msg.read === false || isLast) ? 'text-accent font-bold' : ''}`}>
                    {isMine ? 'Moi' : otherUser?.name}
                  </span>
                  {!isMine && !msg.read && (
                    <span className="ml-1 bg-red-500 text-white text-[10px] rounded-full px-2 py-0.5 font-bold">Nouveau</span>
                  )}
                </div>
                {msg.content}
                {/* ✅ NOUVEAU: Bouton de confirmation si le message demande une confirmation */}
                {!isMine && msg.content && (
                  msg.content.toLowerCase().includes('confirmer') || 
                  msg.content.toLowerCase().includes('confirmation') ||
                  msg.content.toLowerCase().includes('pouvez-vous confirmer')
                ) ? (
                  <div className="mt-2">
                    <button
                      onClick={async () => {
                        try {
                          // Extraire l'ID de réservation du message si possible
                          // Pour l'instant, on envoie juste un message de confirmation
                          const confirmMessage = "✅ Oui, je confirme ma présence !";
                          await sendMessage(confirmMessage);
                          toast.success('Confirmation envoyée');
                        } catch (error) {
                          console.error('Erreur lors de l\'envoi de la confirmation:', error);
                          toast.error('Erreur lors de l\'envoi de la confirmation');
                        }
                      }}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                    >
                      ✓ Confirmer ma présence
                    </button>
                  </div>
                ) : null}
                <div className="text-xs text-gray-400 mt-1 text-right">
                  {new Date(msg.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {isMine && (
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 ml-2 self-end">
                  {currentUser?.photo ? (
                    <img 
                      src={getImageUrl(currentUser.photo, DEFAULT_USER_IMAGE)} 
                      alt={currentUser.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => handleImageError(e, DEFAULT_USER_IMAGE)}
                    />
                  ) : null}
                  <div className={`w-full h-full flex items-center justify-center bg-black text-white text-sm font-bold ${currentUser?.photo ? 'hidden' : ''}`}>
                    {currentUser?.name?.[0] || 'U'}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="p-4 border-t bg-white">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={handleTyping}
              onKeyPress={handleKeyPress}
              placeholder="Tapez votre message... (Entrée pour envoyer)"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200 resize-none"
              style={{ minHeight: '48px' }}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
              {input.length > 0 && `${input.length}/500`}
            </div>
          </div>
          <button
            type="submit"
            disabled={!input.trim()}
            className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
          >
            <span className="hidden sm:inline">Envoyer</span>
            <span className="sm:hidden">→</span>
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-400 text-center">
          💡 Appuyez sur Entrée pour envoyer rapidement
        </div>
      </form>
    </div>
  );
};

export default ChatWindow; 