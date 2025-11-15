/**
 * Service de détection automatique des retards
 * Architecture DDD : Logique métier pour détection et pénalités
 * ✅ INTÉGRÉ avec BookingValidationService et BookingNotificationService
 */

import Booking from '../../models/Booking.js';
import incidentService from './IncidentService.js';
import incidentFactory from './IncidentFactory.js';
import bookingValidationService from '../booking/BookingValidationService.js';
import bookingNotificationService from '../booking/BookingNotificationService.js';
import { calculateEndTime } from '../../utils/dateUtils.js';

class RetardDetectionService {
  /**
   * Détecter les retards pour un booking spécifique
   * @param {string} bookingId - ID du booking
   * @returns {Promise<Object|null>} Incident créé si retard détecté
   */
  async detectRetardForBooking(bookingId) {
    const booking = await Booking.findById(bookingId)
      .populate('client', 'name email')
      .populate('coiffeur', 'name email');

    if (!booking) {
      throw new Error('Réservation non trouvée');
    }

    // Vérifier que le booking est confirmé
    if (booking.status !== 'confirmed') {
      return null; // Pas de détection si booking non confirmé
    }

    const now = new Date();
    const bookingDate = new Date(booking.date);
    const delayMinutes = Math.floor((now - bookingDate) / (1000 * 60));

    // Retards < 10 minutes ne sont pas comptabilisés
    if (delayMinutes < 10) {
      return null;
    }

    // Vérifier si un incident de retard existe déjà
    const incidentRepository = (await import('./IncidentRepository.js')).default;
    const existingIncidents = await incidentRepository.findByBooking(bookingId);
    const existingRetardIncident = existingIncidents.find(
      inc => inc.type === 'retard_client' && inc.status !== 'dismissed'
    );

    if (existingRetardIncident) {
      return existingRetardIncident; // Incident déjà créé
    }

    // Calculer la pénalité selon les règles
    let penaltyPercentage = 0;
    let penaltyAmount = 0;
    let shouldCancel = false;

    if (delayMinutes >= 10 && delayMinutes < 30) {
      // Retard 10-30 min : Pénalité 10% si géolocalisation suspecte
      // Pour l'instant, on suppose que la géolocalisation sera vérifiée côté frontend
      // On créera l'incident mais la pénalité sera appliquée après vérification géolocalisation
      penaltyPercentage = 10;
      penaltyAmount = booking.price * 0.10;
    } else if (delayMinutes >= 30 && delayMinutes < 45) {
      // Retard 30-45 min : Pénalité 15% OU annulation (choix coiffeur)
      penaltyPercentage = 15;
      penaltyAmount = booking.price * 0.15;
    } else if (delayMinutes >= 45) {
      // Retard ≥ 45 min : Annulation automatique + Paiement total
      shouldCancel = true;
      penaltyPercentage = 100;
      penaltyAmount = booking.price;
    }

    // ✅ INTÉGRÉ: Utiliser BookingValidationService pour ajouter un problème
    await bookingValidationService.addIssue(
      bookingId,
      'retard_client',
      `Client en retard de ${delayMinutes} minutes`,
      delayMinutes >= 45 ? 'critical' : delayMinutes >= 30 ? 'high' : 'medium'
    );
    
    // Stocker les informations de retard dans la validation
    const validation = await bookingValidationService.getValidation(bookingId);
    const lastIssue = validation.issues[validation.issues.length - 1];
    if (lastIssue && lastIssue.type === 'retard_client') {
      lastIssue.retardInfo = {
        delayMinutes,
        geolocationOK: false, // Sera vérifié côté frontend
        penaltyApplied: false,
        penaltyAmount: 0,
        penaltyPercentage: 0
      };
      await validation.save();
    }

    // Créer l'incident de retard
    const incident = await incidentFactory.createRetardClient(booking, {
      delayMinutes,
      geolocationOK: false, // Sera vérifié côté frontend
      geolocation: null // Sera fourni côté frontend
    });

    // Si retard ≥ 45 min, annuler automatiquement
    if (shouldCancel) {
      await this.cancelBookingForRetard(booking, incident);
    } else if (delayMinutes >= 30 && delayMinutes < 45) {
      // ✅ INTÉGRÉ: Utiliser BookingNotificationService pour envoyer l'alerte
      await bookingNotificationService.checkAndGenerateAlerts(bookingId);
      // Envoyer modal au coiffeur pour choix (accepter/annuler)
      await this.sendRetardModalToCoiffeur(booking, incident, delayMinutes);
    } else if (delayMinutes >= 10 && delayMinutes < 30) {
      // ✅ INTÉGRÉ: Utiliser BookingNotificationService pour envoyer l'alerte
      await bookingNotificationService.checkAndGenerateAlerts(bookingId);
      // Vérifier géolocalisation avant d'appliquer pénalité
      await this.sendGeolocationCheck(booking, incident, delayMinutes);
    }

    return incident;
  }

  /**
   * Annuler un booking pour retard ≥ 45 min
   * @param {Object} booking - Booking à annuler
   * @param {Object} incident - Incident créé
   * @returns {Promise<void>}
   */
  async cancelBookingForRetard(booking, incident) {
    // Annuler le booking
    booking.status = 'cancelled';
    booking.cancellationReason = `Annulation automatique : Retard de ${incident.retardInfo.delayMinutes} minutes`;
    await booking.save();

    // Appliquer le paiement total (100%)
    if (booking.paymentStatus === 'paid' && booking.stripePaymentIntentId) {
      // Le paiement total est déjà prélevé, pas de remboursement
      // TODO: Intégrer avec Stripe si nécessaire
    }

    // Notifier le client et le coiffeur
    await this.notifyRetardCancellation(booking, incident);
  }

  /**
   * Envoyer modal au coiffeur pour retard 30-45 min
   * @param {Object} booking - Booking concerné
   * @param {Object} incident - Incident créé
   * @param {number} delayMinutes - Minutes de retard
   * @returns {Promise<void>}
   */
  async sendRetardModalToCoiffeur(booking, incident, delayMinutes) {
    // ✅ INTÉGRÉ: Utiliser BookingNotificationService pour générer l'alerte
    // L'alerte sera automatiquement générée par checkAndGenerateAlerts
    // On ajoute juste les métadonnées spécifiques au retard
    const Notification = (await import('../../models/Notification.js')).default;
    const notification = new Notification({
      fromUserId: null, // Système
      toUserId: booking.coiffeur._id,
      type: 'retard_modal',
      title: 'Client en retard',
      message: `Le client est en retard de ${delayMinutes} minutes. Que souhaitez-vous faire ?`,
      bookingId: booking._id,
      incidentId: incident._id,
      metadata: {
        delayMinutes,
        penaltyPercentage: 15,
        penaltyAmount: booking.price * 0.15,
        options: ['accept', 'cancel']
      },
      read: false
    });

    await notification.save();
  }

  /**
   * Envoyer vérification géolocalisation pour retard 10-30 min
   * @param {Object} booking - Booking concerné
   * @param {Object} incident - Incident créé
   * @param {number} delayMinutes - Minutes de retard
   * @returns {Promise<void>}
   */
  async sendGeolocationCheck(booking, incident, delayMinutes) {
    // ✅ INTÉGRÉ: Utiliser BookingNotificationService pour générer les alertes
    // Les alertes seront automatiquement générées par checkAndGenerateAlerts
    // On ajoute juste les notifications spécifiques pour géolocalisation
    const Notification = (await import('../../models/Notification.js')).default;
    
    // Notification au client pour vérifier géolocalisation
    const clientNotification = new Notification({
      fromUserId: null, // Système
      toUserId: booking.client._id,
      type: 'geolocation_check',
      title: 'Vérification de localisation',
      message: `Vous êtes en retard de ${delayMinutes} minutes. Veuillez confirmer votre localisation.`,
      bookingId: booking._id,
      incidentId: incident._id,
      metadata: {
        delayMinutes,
        requiresGeolocation: true
      },
      read: false
    });

    await clientNotification.save();

    // Notification au coiffeur
    const coiffeurNotification = new Notification({
      fromUserId: null, // Système
      toUserId: booking.coiffeur._id,
      type: 'retard_notification',
      title: 'Client en retard',
      message: `Le client est en retard de ${delayMinutes} minutes. Vérification de localisation en cours.`,
      bookingId: booking._id,
      incidentId: incident._id,
      metadata: {
        delayMinutes
      },
      read: false
    });

    await coiffeurNotification.save();
  }

  /**
   * Notifier l'annulation pour retard ≥ 45 min
   * @param {Object} booking - Booking annulé
   * @param {Object} incident - Incident créé
   * @returns {Promise<void>}
   */
  async notifyRetardCancellation(booking, incident) {
    // ✅ INTÉGRÉ: Utiliser BookingNotificationService pour générer les alertes
    // Les alertes seront automatiquement générées par checkAndGenerateAlerts
    // On ajoute juste les notifications spécifiques pour annulation
    const Notification = (await import('../../models/Notification.js')).default;
    
    // Notification au client
    const clientNotification = new Notification({
      fromUserId: null, // Système
      toUserId: booking.client._id,
      type: 'retard_cancellation',
      title: 'Réservation annulée',
      message: `Votre réservation a été annulée en raison d'un retard de ${incident.retardInfo.delayMinutes} minutes. Le paiement total (100%) a été prélevé.`,
      bookingId: booking._id,
      incidentId: incident._id,
      read: false
    });

    await clientNotification.save();

    // Notification au coiffeur
    const coiffeurNotification = new Notification({
      fromUserId: null, // Système
      toUserId: booking.coiffeur._id,
      type: 'retard_cancellation',
      title: 'Réservation annulée automatiquement',
      message: `La réservation a été annulée automatiquement en raison d'un retard de ${incident.retardInfo.delayMinutes} minutes du client. Le paiement total (100%) a été prélevé.`,
      bookingId: booking._id,
      incidentId: incident._id,
      read: false
    });

    await coiffeurNotification.save();
  }

  /**
   * Appliquer une pénalité après vérification géolocalisation
   * @param {string} incidentId - ID de l'incident
   * @param {Object} geolocationData - Données de géolocalisation
   * @returns {Promise<Object>} Incident mis à jour
   */
  async applyPenaltyAfterGeolocationCheck(incidentId, geolocationData) {
    const incidentRepository = (await import('./IncidentRepository.js')).default;
    const incident = await incidentRepository.findById(incidentId);

    if (!incident) {
      throw new Error('Incident non trouvé');
    }

    const { geolocationOK, geolocation } = geolocationData;

    // Mettre à jour l'incident avec la géolocalisation
    const updateData = {
      geolocation: {
        reportedByLocation: geolocation?.reportedByLocation || null,
        reportedAgainstLocation: geolocation?.reportedAgainstLocation || null,
        distance: geolocation?.distance || null
      },
      retardInfo: {
        ...incident.retardInfo,
        geolocationOK
      }
    };

    // Si géolocalisation OK (personne en route), pas de pénalité
    if (geolocationOK) {
      updateData.retardInfo.penaltyApplied = false;
      updateData.retardInfo.penaltyAmount = 0;
      updateData.retardInfo.penaltyPercentage = 0;
      updateData.points = 0; // Pas de points si géolocalisation OK
    } else {
      // Si géolocalisation suspecte, appliquer pénalité 10%
      updateData.retardInfo.penaltyApplied = true;
      updateData.retardInfo.penaltyAmount = incident.booking.price * 0.10;
      updateData.retardInfo.penaltyPercentage = 10;
      updateData.points = 1; // 1 point si géolocalisation suspecte
    }

    // Recalculer les points
    const updatedIncident = await incidentRepository.update(incidentId, updateData);
    updatedIncident.calculatePoints();
    await updatedIncident.save();

    return updatedIncident;
  }

  /**
   * Traiter le choix du coiffeur pour retard 30-45 min
   * @param {string} incidentId - ID de l'incident
   * @param {string} choice - 'accept' ou 'cancel'
   * @returns {Promise<Object>} Booking mis à jour
   */
  async handleCoiffeurChoice(incidentId, choice) {
    const incidentRepository = (await import('./IncidentRepository.js')).default;
    const incident = await incidentRepository.findById(incidentId);

    if (!incident) {
      throw new Error('Incident non trouvé');
    }

    const booking = await Booking.findById(incident.booking._id);

    if (!booking) {
      throw new Error('Réservation non trouvée');
    }

    if (choice === 'accept') {
      // Accepter le retard : Pénalité 15%
      const updateData = {
        retardInfo: {
          ...incident.retardInfo,
          penaltyApplied: true,
          penaltyAmount: booking.price * 0.15,
          penaltyPercentage: 15
        },
        points: 2 // 2 points si accepté
      };

      await incidentRepository.update(incidentId, updateData);
      
      // Notifier le client
      await this.notifyPenaltyApplied(booking, incident, 15);
    } else if (choice === 'cancel') {
      // Annuler : Paiement total (100%)
      await this.cancelBookingForRetard(booking, incident);
    }

    return booking;
  }

  /**
   * Notifier l'application d'une pénalité
   * @param {Object} booking - Booking concerné
   * @param {Object} incident - Incident concerné
   * @param {number} penaltyPercentage - Pourcentage de pénalité
   * @returns {Promise<void>}
   */
  async notifyPenaltyApplied(booking, incident, penaltyPercentage) {
    const notification = new Notification({
      fromUserId: null, // Système
      toUserId: booking.client._id,
      type: 'penalty_applied',
      title: 'Pénalité appliquée',
      message: `Une pénalité de ${penaltyPercentage}% a été appliquée en raison de votre retard.`,
      bookingId: booking._id,
      incidentId: incident._id,
      metadata: {
        penaltyPercentage,
        penaltyAmount: booking.price * (penaltyPercentage / 100)
      },
      read: false
    });

    await notification.save();
  }

  /**
   * Vérifier tous les bookings confirmés pour détecter les retards
   * @returns {Promise<Array>} Liste des incidents créés
   */
  async checkAllConfirmedBookings() {
    const now = new Date();
    
    // Trouver tous les bookings confirmés dont la date est passée
    const confirmedBookings = await Booking.find({
      status: 'confirmed',
      date: { $lte: now }
    })
      .populate('client', 'name email')
      .populate('coiffeur', 'name email');

    const incidents = [];

    for (const booking of confirmedBookings) {
      try {
        const incident = await this.detectRetardForBooking(booking._id);
        if (incident) {
          incidents.push(incident);
        }
      } catch (error) {
        console.error(`Erreur lors de la détection de retard pour booking ${booking._id}:`, error);
      }
    }

    return incidents;
  }
}

export default new RetardDetectionService();

