import { useState, useEffect, useCallback } from 'react';
import { mockMessages, MockMessage } from '../mocks/mockMessages';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'chat_messages';
const READ_KEY = 'chat_read';

// --- DDD: ChatRepository ---
export class ChatRepository {
  static getAllMessages(): MockMessage[] {
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) {
      try {
        return JSON.parse(local);
      } catch {}
    }
    return mockMessages;
  }

  static saveAllMessages(messages: MockMessage[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }

  static getReadMap(): Record<string, string> {
    const local = localStorage.getItem(READ_KEY);
    if (local) {
      try {
        return JSON.parse(local);
      } catch {}
    }
    return {};
  }

  static setRead(conversationKey: string, date: string) {
    const map = ChatRepository.getReadMap();
    map[conversationKey] = date;
    localStorage.setItem(READ_KEY, JSON.stringify(map));
  }
}

// --- DDD: ChatAggregate ---
export class ChatAggregate {
  static getConversationKey(userA: string, userB: string) {
    return [userA, userB].sort().join('-');
  }

  static getMessages(currentUserId: string, otherUserId: string): MockMessage[] {
    const all = ChatRepository.getAllMessages();
    return all.filter(
      m => (m.from === currentUserId && m.to === otherUserId) || (m.from === otherUserId && m.to === currentUserId)
    );
  }

  static getUnreadCount(currentUserId: string): number {
    const all = ChatRepository.getAllMessages();
    const readMap = ChatRepository.getReadMap();
    const conversations = new Set<string>();
    all.forEach(m => {
      if (m.to === currentUserId) {
        conversations.add(ChatAggregate.getConversationKey(m.from, m.to));
      }
    });
    let total = 0;
    conversations.forEach(key => {
      const [userA, userB] = key.split('-');
      const otherUserId = userA === currentUserId ? userB : userA;
      const lastRead = readMap[key];
      const msgs = all.filter(m => ChatAggregate.getConversationKey(m.from, m.to) === key && m.to === currentUserId);
      total += msgs.filter(m => !lastRead || new Date(m.date) > new Date(lastRead)).length;
    });
    return total;
  }

  static getConversations(currentUserId: string): { userId: string; lastMessage: MockMessage | null; unread: number }[] {
    const all = ChatRepository.getAllMessages();
    const readMap = ChatRepository.getReadMap();
    const map = new Map<string, MockMessage[]>();
    all.forEach(m => {
      if (m.from === currentUserId || m.to === currentUserId) {
        const otherId = m.from === currentUserId ? m.to : m.from;
        const key = ChatAggregate.getConversationKey(currentUserId, otherId);
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(m);
      }
    });
    return Array.from(map.entries()).map(([key, msgs]) => {
      const sorted = msgs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const last = sorted[sorted.length - 1] || null;
      const [userA, userB] = key.split('-');
      const otherUserId = userA === currentUserId ? userB : userA;
      const lastRead = readMap[key];
      const unread = msgs.filter(m => m.to === currentUserId && (!lastRead || new Date(m.date) > new Date(lastRead))).length;
      return { userId: otherUserId, lastMessage: last, unread };
    });
  }

  static markAsRead(currentUserId: string, otherUserId: string, date: string) {
    const key = ChatAggregate.getConversationKey(currentUserId, otherUserId);
    ChatRepository.setRead(key, date);
  }

  static sendMessage(currentUserId: string, otherUserId: string, content: string) {
    const all = ChatRepository.getAllMessages();
    const newMsg: MockMessage = {
      id: uuidv4(),
      from: currentUserId,
      to: otherUserId,
      content,
      date: new Date().toISOString()
    };
    ChatRepository.saveAllMessages([...all, newMsg]);
    // Déclenche l'événement storage pour tous les onglets
    localStorage.setItem('chat_messages_update', Date.now().toString());
  }
}

// --- Hook UI ---
export function useChat(currentUserId: string, otherUserId: string) {
  const [messages, setMessages] = useState<MockMessage[]>(() => ChatAggregate.getMessages(currentUserId, otherUserId));

  // Recharge les messages à chaque changement de conversation ou update storage
  useEffect(() => {
    setMessages(ChatAggregate.getMessages(currentUserId, otherUserId));
    function handleStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY || e.key === 'chat_messages_update') {
        setMessages(ChatAggregate.getMessages(currentUserId, otherUserId));
      }
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [currentUserId, otherUserId]);

  // Polling pour single tab (badge et chat instantané même sans storage event)
  useEffect(() => {
    const interval = setInterval(() => {
      setMessages(ChatAggregate.getMessages(currentUserId, otherUserId));
    }, 1000);
    return () => clearInterval(interval);
  }, [currentUserId, otherUserId]);

  // Marquer comme lu à chaque ouverture de conversation
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.to === currentUserId) {
        ChatAggregate.markAsRead(currentUserId, otherUserId, lastMsg.date);
      }
    }
  }, [messages, currentUserId, otherUserId]);

  const sendMessage = useCallback((content: string) => {
    ChatAggregate.sendMessage(currentUserId, otherUserId, content);
    setMessages(ChatAggregate.getMessages(currentUserId, otherUserId));
  }, [currentUserId, otherUserId]);

  return { messages, sendMessage };
}

// Pour le badge menu
export function getUnreadCount(currentUserId: string): number {
  return ChatAggregate.getUnreadCount(currentUserId);
}

// Pour la liste des conversations (sidebar, etc.)
export function getConversations(currentUserId: string) {
  return ChatAggregate.getConversations(currentUserId);
} 