import express from 'express';
import { auth } from '../middleware/auth.js';
import Message from '../models/Message.js';

const router = express.Router();

// Récupérer les messages non lus
router.get('/unread', auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      to: req.user._id,
      read: false
    });
    res.json({ count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer les conversations
router.get('/conversations', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { from: req.user._id },
        { to: req.user._id }
      ]
    }).sort({ date: -1 });

    // Grouper les messages par conversation
    const conversations = messages.reduce((acc, msg) => {
      const otherUserId = msg.from === req.user._id ? msg.to : msg.from;
      if (!acc[otherUserId]) {
        acc[otherUserId] = {
          userId: otherUserId,
          lastMessage: msg,
          unread: 0
        };
      }
      if (msg.to === req.user._id && !msg.read) {
        acc[otherUserId].unread++;
      }
      return acc;
    }, {});

    res.json(Object.values(conversations));
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer les messages avec un utilisateur
router.get('/messages/:userId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { from: req.user._id, to: req.params.userId },
        { from: req.params.userId, to: req.user._id }
      ]
    }).sort({ date: 1 });
    res.json(messages);
  } catch (error) {
    console.error('Error getting messages:', error);
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