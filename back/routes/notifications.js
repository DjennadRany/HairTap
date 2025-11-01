import express from 'express';
import { auth } from '../middleware/auth.js';
import Notification from '../models/Notification.js';
import { chatService } from '../services/chat.js';

const router = express.Router();

// POST /api/notifications/time-change-request - Créer une demande de modification
router.post('/time-change-request', auth, async (req, res) => {
  try {
    const { bookingId, coiffeurId, newDate, newTime, reason } = req.body;
    const clientId = req.user._id;

    // Créer la notification
    const notification = new Notification({
      type: 'time_change_request',
      bookingId,
      fromUserId: clientId,
      toUserId: coiffeurId,
      content: `Demande de modification d'horaire pour la réservation #${bookingId.slice(-6)}`,
      metadata: {
        newDate,
        newTime,
        reason
      }
    });

    await notification.save();

    // Envoyer le message via le chat
    const messageContent = `🕐 Demande de modification d'horaire\n` +
      `Réservation #${bookingId.slice(-6)}\n` +
      `Nouvelle date : ${newDate}\n` +
      `Nouvel horaire : ${newTime}\n` +
      `Raison : ${reason}`;

    // TODO: Intégrer avec le service de chat existant
    // await chatService.sendMessage(coiffeurId, messageContent);

    res.status(201).json({
      success: true,
      message: 'Demande de modification envoyée',
      notification: notification
    });
  } catch (error) {
    console.error('❌ Erreur lors de la création de la demande:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la création de la demande',
      error: error.message 
    });
  }
});

// PATCH /api/notifications/time-change-request/:id/respond - Répondre à une demande
router.patch('/time-change-request/:id/respond', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { response, approved } = req.body;
    const coiffeurId = req.user._id;

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        message: 'Demande non trouvée' 
      });
    }

    // Vérifier que le coiffeur est bien le destinataire
    if (notification.toUserId.toString() !== coiffeurId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Non autorisé' 
      });
    }

    // Mettre à jour le statut
    await notification.respond(response, approved);

    // Envoyer la réponse via le chat
    const messageContent = `🕐 Réponse à votre demande de modification d'horaire\n` +
      `Réservation #${notification.bookingId.toString().slice(-6)}\n` +
      `Statut: ${approved ? 'APPROUVÉE' : 'REJETÉE'}\n` +
      `Message: ${response}`;

    // TODO: Intégrer avec le service de chat existant
    // await chatService.sendMessage(notification.fromUserId, messageContent);

    res.json({
      success: true,
      message: 'Réponse envoyée avec succès',
      notification: notification
    });
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de la réponse:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'envoi de la réponse',
      error: error.message 
    });
  }
});

// GET /api/notifications/time-change-requests/coiffeur/:coiffeurId - Récupérer les demandes d'un coiffeur
router.get('/time-change-requests/coiffeur/:coiffeurId', auth, async (req, res) => {
  try {
    const { coiffeurId } = req.params;
    
    // Vérifier que l'utilisateur connecté est bien le coiffeur
    if (req.user._id.toString() !== coiffeurId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Non autorisé' 
      });
    }

    const notifications = await Notification.getCoiffeurTimeChangeRequests(coiffeurId);
    
    res.json({
      success: true,
      notifications: notifications
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des demandes:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des demandes',
      error: error.message 
    });
  }
});

// GET /api/notifications/time-change-requests/client/:clientId - Récupérer les demandes d'un client
router.get('/time-change-requests/client/:clientId', auth, async (req, res) => {
  try {
    const { clientId } = req.params;
    
    // Vérifier que l'utilisateur connecté est bien le client
    if (req.user._id.toString() !== clientId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Non autorisé' 
      });
    }

    const notifications = await Notification.getClientTimeChangeRequests(clientId);
    
    res.json({
      success: true,
      notifications: notifications
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des demandes:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des demandes',
      error: error.message 
    });
  }
});

// PATCH /api/notifications/:id/read - Marquer une notification comme lue
router.patch('/:id/read', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        message: 'Notification non trouvée' 
      });
    }

    // Vérifier que l'utilisateur est bien le destinataire
    if (notification.toUserId.toString() !== userId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Non autorisé' 
      });
    }

    await notification.markAsRead();
    
    res.json({
      success: true,
      message: 'Notification marquée comme lue',
      notification: notification
    });
  } catch (error) {
    console.error('❌ Erreur lors du marquage de la notification:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du marquage de la notification',
      error: error.message 
    });
  }
});

export default router;
