import express from 'express';
import { auth } from '../middleware/auth.js';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';

const router = express.Router();

// Récupérer les messages non lus
router.get('/unread', auth, async (req, res) => {
  try {
    console.log('🔍 [CHAT] GET /unread - User ID:', req.user._id);
    
    const count = await Message.countDocuments({
      to: req.user._id,
      read: false
    });
    
    console.log('✅ [CHAT] Unread count:', count);
    res.json({ count });
  } catch (error) {
    console.error('❌ [CHAT] Error getting unread count:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer les conversations
router.get('/conversations', auth, async (req, res) => {
  try {
    console.log('🔍 [CHAT] GET /conversations - User ID:', req.user._id);
    
    const messages = await Message.find({
      $or: [
        { from: req.user._id },
        { to: req.user._id }
      ]
    }).sort({ date: -1 });
    
    console.log('✅ [CHAT] Found messages:', messages.length);

    // Grouper les messages par conversation (UNIQUE par userId)
    const conversations = messages.reduce((acc, msg) => {
      const otherUserId = msg.from === req.user._id ? msg.to : msg.from;
      
      if (!acc[otherUserId]) {
        // Première conversation pour cet utilisateur
        acc[otherUserId] = {
          userId: otherUserId,
          lastMessage: msg,
          unread: 0
        };
      } else {
        // Conversation existe déjà, vérifier si ce message est plus récent
        const existingDate = new Date(acc[otherUserId].lastMessage.date);
        const newDate = new Date(msg.date);
        
        if (newDate > existingDate) {
          // Ce message est plus récent, le mettre à jour
          acc[otherUserId].lastMessage = msg;
        }
      }
      
      // Compter les messages non lus
      if (msg.to === req.user._id && !msg.read) {
        acc[otherUserId].unread++;
      }
      
      return acc;
    }, {});

    // GARANTIR L'UNICITÉ : Convertir en array et dédupliquer
    const uniqueConversations = Object.values(conversations);
    const seen = new Set();
    const finalConversations = uniqueConversations.filter(conv => {
      if (seen.has(conv.userId)) {
        return false;
      }
      seen.add(conv.userId);
      return true;
    });

    res.json(finalConversations);
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer les messages avec un utilisateur
router.get('/messages/:userId', auth, async (req, res) => {
  try {
    console.log('🔍 [CHAT] GET /messages/:userId - User ID:', req.user._id, 'Other User ID:', req.params.userId);
    
    const messages = await Message.find({
      $or: [
        { from: req.user._id, to: req.params.userId },
        { from: req.params.userId, to: req.user._id }
      ]
    }).sort({ date: 1 });
    
    console.log('✅ [CHAT] Found messages:', messages.length);
    res.json(messages);
  } catch (error) {
    console.error('❌ [CHAT] Error getting messages:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Envoyer un message
router.post('/messages', auth, async (req, res) => {
  try {
    const { to, content } = req.body;
    const message = new Message({
      from: req.user._id,
      to,
      content,
      date: new Date(),
      read: false
    });
    await message.save();
    res.json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Marquer les messages comme lus
router.post('/messages/:userId/read', auth, async (req, res) => {
  try {
    await Message.updateMany(
      {
        from: req.params.userId,
        to: req.user._id,
        read: false
      },
      { read: true }
    );
    res.json({ message: 'Messages marqués comme lus' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

export default router; 