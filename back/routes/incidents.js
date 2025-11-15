import express from 'express';
import { auth } from '../middleware/auth.js';
import incidentService from '../domain/incident/IncidentService.js';

const router = express.Router();

/**
 * POST /api/incidents
 * Signaler un incident
 */
router.post('/', auth, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false,
        message: 'Non authentifié' 
      });
    }

    const {
      bookingId,
      type,
      description,
      evidence = [],
      requestedAction,
      geolocation = null,
      retardInfo = null
    } = req.body;

    // Déterminer reportedBy et reportedAgainst selon le type
    let reportedBy = req.user.id;
    let reportedAgainst = null;

    // Récupérer le booking pour déterminer reportedAgainst
    const Booking = (await import('../models/Booking.js')).default;
    const booking = await Booking.findById(bookingId)
      .populate('client', '_id')
      .populate('coiffeur', '_id');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    // Déterminer reportedAgainst selon le type
    if (type === 'retard_client' || type === 'client_no_show' || type === 'client_dissatisfied') {
      reportedBy = booking.coiffeur._id.toString();
      reportedAgainst = booking.client._id.toString();
    } else if (type === 'retard_coiffeur' || type === 'coiffeur_no_show' || type === 'coiffeur_dissatisfied') {
      reportedBy = booking.client._id.toString();
      reportedAgainst = booking.coiffeur._id.toString();
    } else {
      // Pour les autres types, déterminer selon l'utilisateur qui signale
      if (req.user.id === booking.client._id.toString()) {
        reportedBy = booking.client._id.toString();
        reportedAgainst = booking.coiffeur._id.toString();
      } else {
        reportedBy = booking.coiffeur._id.toString();
        reportedAgainst = booking.client._id.toString();
      }
    }

    const incidentData = {
      bookingId,
      reportedBy,
      reportedAgainst,
      type,
      description,
      evidence,
      requestedAction,
      geolocation,
      retardInfo
    };

    const incident = await incidentService.reportIncident(incidentData);

    res.status(201).json({
      success: true,
      message: 'Incident signalé avec succès',
      data: incident
    });
  } catch (error) {
    console.error('Report incident error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors du signalement de l\'incident',
      error: error.message
    });
  }
});

/**
 * GET /api/incidents
 * Récupérer les incidents de l'utilisateur
 */
router.get('/', auth, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    const { days = 90 } = req.query;
    const incidents = await incidentService.getUserIncidents(req.user.id, parseInt(days));

    res.json({
      success: true,
      data: incidents
    });
  } catch (error) {
    console.error('Get incidents error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des incidents',
      error: error.message
    });
  }
});

/**
 * GET /api/incidents/pending
 * Récupérer les incidents en attente de validation (admin uniquement)
 */
router.get('/pending', auth, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs'
      });
    }

    const incidents = await incidentService.getPendingIncidents();

    res.json({
      success: true,
      data: incidents
    });
  } catch (error) {
    console.error('Get pending incidents error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des incidents en attente',
      error: error.message
    });
  }
});

/**
 * GET /api/incidents/stats
 * Récupérer les statistiques des incidents (admin uniquement)
 */
router.get('/stats', auth, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs'
      });
    }

    const stats = await incidentService.getIncidentStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get incident stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
});

/**
 * GET /api/incidents/points/:userId
 * Récupérer les points totaux d'un utilisateur
 */
router.get('/points/:userId', auth, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    const { userId } = req.params;
    const { days = 90 } = req.query;

    // Vérifier que l'utilisateur peut voir ses propres points ou est admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    const totalPoints = await incidentService.getUserTotalPoints(userId, parseInt(days));

    res.json({
      success: true,
      data: {
        userId,
        totalPoints,
        days: parseInt(days)
      }
    });
  } catch (error) {
    console.error('Get user points error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des points',
      error: error.message
    });
  }
});

/**
 * GET /api/incidents/:id
 * Récupérer un incident par ID
 */
router.get('/:id', auth, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    const incidentRepository = (await import('../domain/incident/IncidentRepository.js')).default;
    const incident = await incidentRepository.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident non trouvé'
      });
    }

    // Vérifier que l'utilisateur peut voir cet incident
    const isReportedBy = incident.reportedBy._id.toString() === req.user.id;
    const isReportedAgainst = incident.reportedAgainst._id.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isReportedBy && !isReportedAgainst && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    res.json({
      success: true,
      data: incident
    });
  } catch (error) {
    console.error('Get incident error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'incident',
      error: error.message
    });
  }
});

/**
 * POST /api/incidents/:id/resolve
 * Résoudre un incident (admin uniquement)
 */
router.post('/:id/resolve', auth, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs'
      });
    }

    const { id } = req.params;
    const { type, amount, reason } = req.body;

    const resolution = {
      type,
      amount: amount || 0,
      reason: reason || ''
    };

    const incident = await incidentService.resolveIncident(id, resolution, req.user.id);

    res.json({
      success: true,
      message: 'Incident résolu avec succès',
      data: incident
    });
  } catch (error) {
    console.error('Resolve incident error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la résolution de l\'incident',
      error: error.message
    });
  }
});

/**
 * POST /api/incidents/:id/dismiss
 * Rejeter un incident (admin uniquement)
 */
router.post('/:id/dismiss', auth, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs'
      });
    }

    const { id } = req.params;
    const { reason } = req.body;

    const incident = await incidentService.dismissIncident(id, reason, req.user.id);

    res.json({
      success: true,
      message: 'Incident rejeté avec succès',
      data: incident
    });
  } catch (error) {
    console.error('Dismiss incident error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors du rejet de l\'incident',
      error: error.message
    });
  }
});

export default router;









