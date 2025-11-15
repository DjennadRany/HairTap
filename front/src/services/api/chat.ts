import api from '../../api/httpClient';

export interface Message {
  id: string;
  from: string;
  to: string;
  content: string;
  date: string;
  read: boolean;
}

export interface Conversation {
  userId: string;
  lastMessage: Message | null;
  unread: number;
}

export const chatService = {
  async getMessages(otherUserId: string): Promise<Message[]> {
    const response = await api.get<Message[]>(`/chat/messages/${otherUserId}`);
    return response.data;
  },

  async sendMessage(otherUserId: string, content: string): Promise<Message> {
    const response = await api.post<Message>('/chat/messages', {
      to: otherUserId,
      content
    });
    return response.data;
  },

  async markAsRead(otherUserId: string): Promise<void> {
    await api.post(`/chat/messages/${otherUserId}/read`);
  },

  async getUnreadCount(): Promise<number> {
    const response = await api.get<{ count: number }>('/chat/unread');
    return response.data.count;
  },

  async getConversations(): Promise<Conversation[]> {
    const response = await api.get<Conversation[]>('/chat/conversations');
    return response.data;
  }
}; 