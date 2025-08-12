import express from 'express';
import { auth } from '../middleware/auth.js';
import Connection from '../models/Connection.js';
import User from '../models/User.js';

const router = express.Router();

// Mettre à jour le statut de connexion
router.post('/status', auth, async (req, res) => {
  try {
    const { status, isAvailable } = req.body;
    
    let connection = await Connection.findOne({ userId: req.user._id });
    
    if (!connection) {
      connection = new Connection({
        userId: req.user._id,
        status: status || 'online',
        isOnline: true,
        lastSeen: new Date(),
        availability: {
          isAvailable: isAvailable !== undefined ? isAvailable : true
        }
      });
    } else {
      connection.status = status || connection.status;
      connection.isOnline = true;
      connection.lastSeen = new Date();
      if (isAvailable !== undefined) {
        connection.availability.isAvailable = isAvailable;
      }
    }
    
    await connection.save();
    
    res.json(connection);
  } catch (error) {
    console.error('Error updating connection status:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer le statut de connexion d'un utilisateur
router.get('/status/:userId', auth, async (req, res) => {
  try {
    const connection = await Connection.findOne({ userId: req.params.userId });
    
    if (!connection) {
      return res.json({
        isOnline: false,
        status: 'offline',
        lastSeen: null,
        availability: { isAvailable: false }
      });
    }
    
    // Vérifier si l'utilisateur est vraiment en ligne en vérifiant le lastSeen
    const now = new Date();
    const lastSeen = new Date(connection.lastSeen);
    const timeDiff = now.getTime() - lastSeen.getTime();
    const timeoutMinutes = 2; // 2 minutes de timeout
    
    // Si lastSeen est trop ancien, considérer comme hors ligne
    if (connection.isOnline && timeDiff > (timeoutMinutes * 60 * 1000)) {
      // Mettre à jour automatiquement le statut comme hors ligne
      connection.isOnline = false;
      connection.status = 'offline';
      await connection.save();
      
      return res.json({
        isOnline: false,
        status: 'offline',
        lastSeen: connection.lastSeen,
        availability: connection.availability
      });
    }
    
    res.json(connection);
  } catch (error) {
    console.error('Error getting connection status:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer tous les utilisateurs en ligne
router.get('/online', auth, async (req, res) => {
  try {
    const now = new Date();
    const timeoutMinutes = 2; // 2 minutes de timeout
    
    // Récupérer toutes les connexions actives
    const allConnections = await Connection.find({ 
      isOnline: true,
      'availability.isAvailable': true 
    }).populate('userId', 'name email photo role');
    
    // Filtrer pour ne garder que ceux vraiment en ligne
    const reallyOnlineUsers = allConnections.filter(connection => {
      const lastSeen = new Date(connection.lastSeen);
      const timeDiff = now.getTime() - lastSeen.getTime();
      return timeDiff < (timeoutMinutes * 60 * 1000);
    });
    
    // Mettre à jour automatiquement ceux qui sont trop anciens
    const offlineConnections = allConnections.filter(connection => {
      const lastSeen = new Date(connection.lastSeen);
      const timeDiff = now.getTime() - lastSeen.getTime();
      return timeDiff >= (timeoutMinutes * 60 * 1000);
    });
    
    // Marquer comme hors ligne ceux qui dépassent le timeout
    for (const connection of offlineConnections) {
      connection.isOnline = false;
      connection.status = 'offline';
      await connection.save();
    }
    
    res.json(reallyOnlineUsers);
  } catch (error) {
    console.error('Error getting online users:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Ping de connexion (pour maintenir le statut en ligne)
router.post('/ping', auth, async (req, res) => {
  try {
    await Connection.findOneAndUpdate(
      { userId: req.user._id },
      { 
        lastSeen: new Date(),
        isOnline: true
      },
      { upsert: true }
    );
    
    res.json({ message: 'Ping successful' });
  } catch (error) {
    console.error('Error pinging connection:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Nettoyer les connexions expirées (appelée périodiquement)
router.post('/cleanup', auth, async (req, res) => {
  try {
    const now = new Date();
    const timeoutMinutes = 2; // 2 minutes de timeout
    
    // Trouver toutes les connexions expirées
    const expiredConnections = await Connection.find({
      isOnline: true,
      lastSeen: { $lt: new Date(now.getTime() - (timeoutMinutes * 60 * 1000)) }
    });
    
    // Les marquer comme hors ligne
    for (const connection of expiredConnections) {
      connection.isOnline = false;
      connection.status = 'offline';
      await connection.save();
    }
    
    res.json({ 
      message: `Nettoyage terminé. ${expiredConnections.length} connexions expirées mises à jour.` 
    });
  } catch (error) {
    console.error('Error cleaning up expired connections:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Se déconnecter
router.post('/logout', auth, async (req, res) => {
  try {
    await Connection.findOneAndUpdate(
      { userId: req.user._id },
      { 
        isOnline: false,
        status: 'offline',
        lastSeen: new Date()
      }
    );
    
    res.json({ message: 'Déconnexion réussie' });
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Mettre à jour les paramètres de chat
router.put('/chat-settings', auth, async (req, res) => {
  try {
    const { autoReply, awayMessage, notificationPreferences } = req.body;
    
    const connection = await Connection.findOneAndUpdate(
      { userId: req.user._id },
      {
        'chatSettings.autoReply': autoReply,
        'chatSettings.awayMessage': awayMessage,
        'chatSettings.notificationPreferences': notificationPreferences
      },
      { new: true, upsert: true }
    );
    
    res.json(connection);
  } catch (error) {
    console.error('Error updating chat settings:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

export default router; 