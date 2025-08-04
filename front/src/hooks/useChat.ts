import { useState, useEffect, useCallback } from 'react';
import { chatService, Message, Conversation } from '../services/api/chat';

// --- Hook UI ---
export function useChat(currentUserId: string, otherUserId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const data = await chatService.getMessages(otherUserId);
        setMessages(data);
        setError(null);
      } catch (err: any) {
        // Ne pas afficher d'erreur si c'est une erreur d'authentification
        if (err?.response?.status !== 401) {
          setError('Erreur lors du chargement des messages');
        }
        console.error('Error fetching messages:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [otherUserId]);

  // Marquer comme lu à chaque ouverture de conversation
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.to === currentUserId && !lastMsg.read) {
        chatService.markAsRead(otherUserId).catch(err => {
          console.error('Error marking messages as read:', err);
        });
      }
    }
  }, [messages, currentUserId, otherUserId]);

  const sendMessage = useCallback(async (content: string) => {
    try {
      const newMessage = await chatService.sendMessage(otherUserId, content);
      setMessages(prev => [...prev, newMessage]);
    } catch (err: any) {
      // Ne pas afficher d'erreur si c'est une erreur d'authentification
      if (err?.response?.status !== 401) {
        setError('Erreur lors de l\'envoi du message');
      }
      console.error('Error sending message:', err);
    }
  }, [otherUserId]);

  return { messages, loading, error, sendMessage };
}

// Pour le badge menu
export async function getUnreadCount(): Promise<number> {
  try {
    return await chatService.getUnreadCount();
  } catch (err: any) {
    // Ne pas logger d'erreur si c'est une erreur d'authentification
    if (err?.response?.status !== 401) {
      console.error('Error getting unread count:', err);
    }
    return 0;
  }
}

// Pour la liste des conversations (sidebar, etc.)
export async function getConversations(): Promise<Conversation[]> {
  try {
    return await chatService.getConversations();
  } catch (err: any) {
    // Ne pas logger d'erreur si c'est une erreur d'authentification
    if (err?.response?.status !== 401) {
      console.error('Error getting conversations:', err);
    }
    return [];
  }
} 