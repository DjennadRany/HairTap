/**
 * Routes pour la validation de prestation - Style Uber
 */

import express from 'express';
import { auth } from '../middleware/auth.js';
import bookingValidationService from '../domain/booking/BookingValidationService.js';
import bookingNotificationService from '../domain/booking/BookingNotificationService.js';
import bookingService from '../domain/booking/BookingService.js';

const router = express.Router();

// Récupérer la validation d'une réservation
router.get('/:bookingId', auth, async (req, res) => {
  try {
    const booking = await bookingService.getBookingById(req.params.bookingId);
    
    // Vérifier que l'utilisateur est le client ou le coiffeur
    if (booking.client._id.toString() !== req.user.id && 
        booking.coiffeur._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    const validation = await bookingValidationService.getValidation(req.params.bookingId);
    
    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error('Get validation error:', error);
    
    if (error.message === 'Réservation non trouvée') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération de la validation'
    });
  }
});

// Valider l'étape pré-service
router.post('/:bookingId/pre-service', auth, async (req, res) => {
  try {
    const booking = await bookingService.getBookingById(req.params.bookingId);
    
    // Vérifier que l'utilisateur est le coiffeur
    if (booking.coiffeur._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Seuls les coiffeurs peuvent valider la préparation'
      });
    }

    const validation = await bookingValidationService.validatePreService(
      req.params.bookingId,
      req.body
    );

    res.json({
      success: true,
      data: validation,
      message: 'Validation pré-service mise à jour'
    });
  } catch (error) {
    console.error('Validate pre-service error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la validation pré-service'
    });
  }
});

// Démarrer le service
router.post('/:bookingId/start', auth, async (req, res) => {
  try {
    const booking = await bookingService.getBookingById(req.params.bookingId);
    
    // Vérifier que l'utilisateur est le coiffeur
    if (booking.coiffeur._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Seuls les coiffeurs peuvent démarrer le service'
      });
    }

    const validation = await bookingValidationService.startService(
      req.params.bookingId,
      req.body.clientPresent !== false
    );

    res.json({
      success: true,
      data: validation,
      message: 'Service démarré'
    });
  } catch (error) {
    console.error('Start service error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors du démarrage du service'
    });
  }
});

// Valider la qualité
router.post('/:bookingId/quality', auth, async (req, res) => {
  try {
    const booking = await bookingService.getBookingById(req.params.bookingId);
    
    // Vérifier que l'utilisateur est le coiffeur
    if (booking.coiffeur._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Seuls les coiffeurs peuvent valider la qualité'
      });
    }

    const validation = await bookingValidationService.validateQuality(
      req.params.bookingId,
      req.body.qualityChecked !== false
    );

    res.json({
      success: true,
      data: validation,
      message: 'Qualité validée'
    });
  } catch (error) {
    console.error('Validate quality error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la validation de la qualité'
    });
  }
});

// Finaliser la validation
router.post('/:bookingId/finalize', auth, async (req, res) => {
  try {
    const booking = await bookingService.getBookingById(req.params.bookingId);
    
    // Vérifier que l'utilisateur est le coiffeur
    if (booking.coiffeur._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Seuls les coiffeurs peuvent finaliser la validation'
      });
    }

    const validation = await bookingValidationService.finalizeValidation(
      req.params.bookingId,
      req.user.id
    );

    res.json({
      success: true,
      data: validation,
      message: 'Validation finalisée avec succès'
    });
  } catch (error) {
    console.error('Finalize validation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la finalisation de la validation'
    });
  }
});

// Ajouter un problème
router.post('/:bookingId/issues', auth, async (req, res) => {
  try {
    const booking = await bookingService.getBookingById(req.params.bookingId);
    
    // Vérifier que l'utilisateur est le client ou le coiffeur
    if (booking.client._id.toString() !== req.user.id && 
        booking.coiffeur._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    const { type, description, severity } = req.body;
    const validation = await bookingValidationService.addIssue(
      req.params.bookingId,
      type,
      description,
      severity
    );

    res.json({
      success: true,
      data: validation,
      message: 'Problème ajouté'
    });
  } catch (error) {
    console.error('Add issue error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de l\'ajout du problème'
    });
  }
});

// Résoudre un problème
router.patch('/:bookingId/issues/:issueId', auth, async (req, res) => {
  try {
    const booking = await bookingService.getBookingById(req.params.bookingId);
    
    // Vérifier que l'utilisateur est le client ou le coiffeur
    if (booking.client._id.toString() !== req.user.id && 
        booking.coiffeur._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    const validation = await bookingValidationService.resolveIssue(
      req.params.bookingId,
      req.params.issueId
    );

    res.json({
      success: true,
      data: validation,
      message: 'Problème résolu'
    });
  } catch (error) {
    console.error('Resolve issue error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la résolution du problème'
    });
  }
});

// Récupérer les alertes pour un coiffeur
router.get('/alerts/coiffeur/:coiffeurId', auth, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est le coiffeur
    if (req.params.coiffeurId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    const alerts = await bookingNotificationService.getCoiffeurAlerts(req.params.coiffeurId);

    res.json({
      success: true,
      data: alerts,
      count: alerts.length
    });
  } catch (error) {
    console.error('Get coiffeur alerts error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération des alertes'
    });
  }
});

// Récupérer les alertes pour un client
router.get('/alerts/client/:clientId', auth, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est le client
    if (req.params.clientId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    const alerts = await bookingNotificationService.getClientAlerts(req.params.clientId);

    res.json({
      success: true,
      data: alerts,
      count: alerts.length
    });
  } catch (error) {
    console.error('Get client alerts error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération des alertes'
    });
  }
});

export default router;

