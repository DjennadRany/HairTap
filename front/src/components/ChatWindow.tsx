import React, { useRef, useEffect, useState } from 'react';
import { useChat } from '../hooks/useChat';
import { mockUsers } from '../mocks/users';

interface ChatWindowProps {
  currentUserId: string;
  otherUserId: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ currentUserId, otherUserId }) => {
  const { messages, sendMessage } = useChat(currentUserId, otherUserId);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const currentUser = mockUsers.find(u => String(u.id) === String(currentUserId));
  const otherUser = mockUsers.find(u => String(u.id) === String(otherUserId));

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

  // Pour affichage du nom et pastille 'nouveau'
  const lastReadDate = (() => {
    const local = localStorage.getItem('chat_read');
    if (!local) return null;
    try {
      const map = JSON.parse(local);
      const key = [currentUserId, otherUserId].sort().join('-');
      return map[key] || null;
    } catch { return null; }
  })();

  return (
    <div className="flex flex-col h-full w-full max-w-full border rounded-lg bg-white shadow-md md:h-[80vh] md:max-w-2xl lg:max-w-3xl mx-auto overflow-hidden">
      {/* Header sticky sur mobile */}
      <div className="flex items-center gap-3 p-4 border-b bg-gray-50 sticky top-0 z-10">
        <img src={otherUser?.picture} alt={otherUser?.name} className="w-10 h-10 rounded-full object-cover" />
        <span className="font-semibold truncate max-w-[60vw] md:max-w-none">{otherUser?.name}</span>
      </div>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-2 bg-gray-50 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {messages.map((msg, idx) => {
          const sender = mockUsers.find(u => String(u.id) === msg.from);
          const isMine = msg.from === currentUserId;
          const isUnread = !lastReadDate || new Date(msg.date) > new Date(lastReadDate);
          const isLast = idx === messages.length - 1;
          return (
            <div
              key={msg.id + '-' + idx}
              className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'}`}
            >
              {!isMine && (
                <img src={sender?.picture} alt={sender?.name} className="w-8 h-8 rounded-full mr-2 self-end object-cover" />
              )}
              <div
                className={`px-3 py-2 rounded-2xl max-w-[85vw] md:max-w-md break-words shadow text-sm flex flex-col ${
                  isMine
                    ? 'bg-primary text-white items-end ml-auto'
                    : 'bg-gray-200 text-gray-900 items-start'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-semibold ${!isMine && (isUnread || isLast) ? 'text-accent font-bold' : ''}`}>{isMine ? 'Moi' : sender?.name}</span>
                  {!isMine && isUnread && (
                    <span className="ml-1 bg-red-500 text-white text-[10px] rounded-full px-2 py-0.5 font-bold">Nouveau</span>
                  )}
                </div>
                {msg.content}
                <div className="text-xs text-gray-400 mt-1 text-right">
                  {new Date(msg.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {isMine && (
                <img src={currentUser?.picture} alt={currentUser?.name} className="w-8 h-8 rounded-full ml-2 self-end object-cover" />
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      {/* Input et boutons */}
      <form onSubmit={handleSend} className="flex flex-col sm:flex-row gap-2 p-2 border-t bg-white">
        <div className="flex-1 flex">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            className="flex-1 border rounded-lg px-3 py-2 focus:outline-none text-sm md:text-base"
            placeholder="Écrire un message..."
            autoComplete="off"
          />
        </div>
        <div className="flex gap-2 mt-2 sm:mt-0">
          <button
            type="submit"
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 w-full sm:w-auto text-sm md:text-base"
          >
            Envoyer
          </button>
          <button
            type="button"
            className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 w-full sm:w-auto text-sm md:text-base"
            onClick={() => setInput('Je souhaite proposer un rendez-vous à cette date : ')}
          >
            Proposer un RDV
          </button>
        </div>
      </form>
    </div>
  );
}; 