import Message from '../models/Message.js';

export const chatService = {
  // Envoyer un message
  async sendMessage(fromUserId, toUserId, content) {
    try {
      const message = new Message({
        from: fromUserId,
        to: toUserId,
        content,
        date: new Date(),
        read: false
      });
      
      await message.save();
      return message;
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi du message:', error);
      throw error;
    }
  },

  // Marquer les messages comme lus
  async markMessagesAsRead(fromUserId, toUserId) {
    try {
      await Message.updateMany(
        { from: fromUserId, to: toUserId, read: false },
        { read: true }
      );
    } catch (error) {
      console.error('❌ Erreur lors du marquage des messages:', error);
      throw error;
    }
  },

  // Récupérer les messages non lus
  async getUnreadCount(userId) {
    try {
      const count = await Message.countDocuments({
        to: userId,
        read: false
      });
      return count;
    } catch (error) {
      console.error('❌ Erreur lors du comptage des messages non lus:', error);
      throw error;
    }
  }
};
