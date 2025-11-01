import express from 'express';
import { auth } from '../middleware/auth.js';
import TimeChangeRequest from '../models/TimeChangeRequest.js';
import Booking from '../models/Booking.js';

const router = express.Router();

// Créer une demande de modification d'horaire
router.post('/', auth, async (req, res) => {
  try {
    const { bookingId, requestedDate, requestedTime, reason } = req.body;
    
    // Validation des données
    if (!bookingId || !requestedDate || !requestedTime || !reason) {
      return res.status(400).json({ 
        success: false, 
        message: 'Toutes les informations sont requises' 
      });
    }

    // Vérifier que la réservation existe et appartient au client
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'Réservation introuvable' 
      });
    }

    if (booking.client.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Non autorisé' 
      });
    }

    // Vérifier que la réservation n'est pas déjà annulée ou terminée
    if (booking.status === 'cancelled' || booking.status === 'completed') {
      return res.status(400).json({ 
        success: false, 
        message: 'Impossible de modifier une réservation annulée ou terminée' 
      });
    }

    // Créer la demande
    const timeChangeRequest = new TimeChangeRequest({
      booking: bookingId,
      client: req.user.id,
      coiffeur: booking.coiffeur,
      requestedDate: new Date(requestedDate),
      requestedTime,
      reason
    });

    await timeChangeRequest.save();

    // Populate pour la réponse
    await timeChangeRequest.populate('booking', 'service date duration price');
    await timeChangeRequest.populate('coiffeur', 'name photo');

    res.status(201).json({
      success: true,
      message: 'Demande de modification envoyée au coiffeur',
      data: timeChangeRequest
    });

  } catch (error) {
    console.error('Create time change request error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la création de la demande',
      error: error.message 
    });
  }
});

// Récupérer les demandes d'un coiffeur
router.get('/coiffeur', auth, async (req, res) => {
  try {
    const requests = await TimeChangeRequest.getCoiffeurRequests(req.user.id);
    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Get coiffeur requests error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des demandes',
      error: error.message 
    });
  }
});

// Récupérer les demandes d'un client
router.get('/client', auth, async (req, res) => {
  try {
    const requests = await TimeChangeRequest.getClientRequests(req.user.id);
    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Get client requests error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des demandes',
      error: error.message 
    });
  }
});

// Répondre à une demande (approuver/rejeter) - Coiffeur uniquement
router.patch('/:id/respond', auth, async (req, res) => {
  try {
    const { status, response } = req.body;
    
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Statut invalide' 
      });
    }

    const timeChangeRequest = await TimeChangeRequest.findById(req.params.id);
    if (!timeChangeRequest) {
      return res.status(404).json({ 
        success: false, 
        message: 'Demande introuvable' 
      });
    }

    // Vérifier que l'utilisateur est le coiffeur
    if (timeChangeRequest.coiffeur.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Non autorisé' 
      });
    }

    // Mettre à jour le statut
    if (status === 'approved') {
      await timeChangeRequest.approve(response);
      
      // Si approuvé, mettre à jour la réservation
      const booking = await Booking.findById(timeChangeRequest.booking);
      if (booking) {
        booking.date = timeChangeRequest.requestedDate;
        await booking.save();
      }
    } else {
      await timeChangeRequest.reject(response);
    }

    // Populate pour la réponse
    await timeChangeRequest.populate('booking', 'service date duration price');
    await timeChangeRequest.populate('client', 'name photo');

    res.json({
      success: true,
      message: `Demande ${status === 'approved' ? 'approuvée' : 'rejetée'}`,
      data: timeChangeRequest
    });

  } catch (error) {
    console.error('Respond to request error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la réponse à la demande',
      error: error.message 
    });
  }
});

// Récupérer une demande spécifique
router.get('/:id', auth, async (req, res) => {
  try {
    const timeChangeRequest = await TimeChangeRequest.findById(req.params.id)
      .populate('booking', 'service date duration price')
      .populate('client', 'name photo')
      .populate('coiffeur', 'name photo');

    if (!timeChangeRequest) {
      return res.status(404).json({ 
        success: false, 
        message: 'Demande introuvable' 
      });
    }

    // Vérifier que l'utilisateur peut voir cette demande
    if (timeChangeRequest.client.toString() !== req.user.id && 
        timeChangeRequest.coiffeur.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Non autorisé' 
      });
    }

    res.json({
      success: true,
      data: timeChangeRequest
    });

  } catch (error) {
    console.error('Get request error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération de la demande',
      error: error.message 
    });
  }
});

export default router;
