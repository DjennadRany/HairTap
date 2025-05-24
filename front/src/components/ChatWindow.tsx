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
    <div className="flex flex-col h-full border rounded-lg bg-white shadow-md max-w-lg mx-auto">
      <div className="flex items-center gap-3 p-4 border-b bg-gray-50">
        <img src={otherUser?.picture} alt={otherUser?.name} className="w-10 h-10 rounded-full" />
        <span className="font-semibold">{otherUser?.name}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
        {messages.map((msg, idx) => {
          const sender = mockUsers.find(u => String(u.id) === msg.from);
          const isMine = msg.from === currentUserId;
          const isUnread = !lastReadDate || new Date(msg.date) > new Date(lastReadDate);
          const isLast = idx === messages.length - 1;
          return (
            <div
              key={msg.id}
              className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'}`}
            >
              {!isMine && (
                <img src={sender?.picture} alt={sender?.name} className="w-8 h-8 rounded-full mr-2 self-end" />
              )}
              <div
                className={`px-4 py-2 rounded-lg max-w-xs break-words shadow text-sm flex flex-col ${
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
                <img src={currentUser?.picture} alt={currentUser?.name} className="w-8 h-8 rounded-full ml-2 self-end" />
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