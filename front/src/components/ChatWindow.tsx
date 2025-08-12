import React, { useRef, useEffect, useState } from 'react';
import { useChat } from '../hooks/useChat';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import { coiffeurService } from '../services/api/coiffeurs';
import { User } from '../types/models';
import { usePushNotification } from './PushNotification';
import { ConnectionIndicator } from './ConnectionIndicator';

interface ChatWindowProps {
  currentUserId: string;
  otherUserId: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ currentUserId, otherUserId }) => {
  const { messages, loading, error, sendMessage } = useChat(currentUserId, otherUserId);
  const [input, setInput] = useState('');
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const currentUser = useSelector(selectCurrentUser);
  const { showNotification: showPushNotification } = usePushNotification();

  useEffect(() => {
    const fetchOtherUser = async () => {
      try {
        const user = await coiffeurService.getCoiffeur(otherUserId);
        setOtherUser(user);
      } catch (err) {
        console.error('Error fetching other user:', err);
      }
    };

    fetchOtherUser();
  }, [otherUserId]);

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
      <div className="flex items-center gap-3 p-4 border-b bg-gray-50">
        <div className="relative">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
            {otherUser?.photo ? (
              <img src={otherUser.photo} alt={otherUser.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-accent text-white text-xl font-bold">
                {otherUser?.name?.[0]}
              </div>
            )}
          </div>
          {/* Indicateur de statut de connexion */}
          <div className="absolute -bottom-1 -right-1">
            <ConnectionIndicator 
              status={otherUser?.connectionStatus} 
              size="sm" 
            />
          </div>
        </div>
        <div className="flex-1">
          <span className="font-semibold">{otherUser?.name}</span>
          <div className="text-xs text-gray-500">
            {otherUser?.connectionStatus?.isOnline ? '🟢 En ligne' : '⚪ Hors ligne'}
            {isTyping && <span className="ml-2 text-blue-500">écrit...</span>}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
        {messages.map((msg, idx) => {
          const isMine = msg.from === currentUserId;
          const isLast = idx === messages.length - 1;
          return (
            <div
              key={msg.id}
              className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'}`}
            >
              {!isMine && (
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 mr-2 self-end">
                  {otherUser?.photo ? (
                    <img src={otherUser.photo} alt={otherUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-accent text-white text-sm font-bold">
                      {otherUser?.name?.[0]}
                    </div>
                  )}
                </div>
              )}
              <div
                className={`px-4 py-2 rounded-lg max-w-xs break-words shadow text-sm flex flex-col ${
                  isMine
                    ? 'bg-primary text-white items-end ml-auto'
                    : 'bg-gray-200 text-gray-900 items-start'
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
                <div className="text-xs text-gray-400 mt-1 text-right">
                  {new Date(msg.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {isMine && (
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 ml-2 self-end">
                  {currentUser?.photo ? (
                    <img src={currentUser.photo} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-accent text-white text-sm font-bold">
                      {currentUser?.name?.[0]}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={handleTyping}
            placeholder="Tapez votre message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Envoyer
          </button>
        </div>
      </form>
    </div>
  );
}; 