import React, { useRef, useEffect, useState } from 'react';
import { useChat } from '../hooks/useChat';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import { coiffeurService } from '../services/api/coiffeurs';
import { Coiffeur } from '../services/api/coiffeurs';

interface ChatWindowProps {
  currentUserId: string;
  otherUserId: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ currentUserId, otherUserId }) => {
  const { messages, loading, error, sendMessage } = useChat(currentUserId, otherUserId);
  const [input, setInput] = useState('');
  const [otherUser, setOtherUser] = useState<Coiffeur | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const currentUser = useSelector(selectCurrentUser);

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

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input.trim());
      setInput('');
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
    <div className="flex flex-col h-full border rounded-lg bg-white shadow-md max-w-lg mx-auto">
      <div className="flex items-center gap-3 p-4 border-b bg-gray-50">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
          {otherUser?.photos && otherUser.photos.length > 0 ? (
            <img src={otherUser.photos[0]} alt={otherUser.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-accent text-white text-xl font-bold">
              {otherUser?.name?.[0]}
            </div>
          )}
        </div>
        <span className="font-semibold">{otherUser?.name}</span>
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
                  {otherUser?.photos && otherUser.photos.length > 0 ? (
                    <img src={otherUser.photos[0]} alt={otherUser.name} className="w-full h-full object-cover" />
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
      <form onSubmit={handleSend} className="flex gap-2 p-4 border-t bg-white">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          className="flex-1 border rounded-lg px-3 py-2 focus:outline-none"
          placeholder="Écrire un message..."
        />
        <button
          type="submit"
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
        >
          Envoyer
        </button>
        <button
          type="button"
          className="ml-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700"
          onClick={() => setInput('Je souhaite proposer un rendez-vous à cette date : ')}
        >
          Proposer un RDV
        </button>
      </form>
    </div>
  );
}; 