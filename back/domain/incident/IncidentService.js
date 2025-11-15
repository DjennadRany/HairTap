/**
 * Service de gestion des incidents - Logique métier
 * Architecture DDD : Séparation des responsabilités
 */

import incidentRepository from './IncidentRepository.js';
import incidentFactory from './IncidentFactory.js';
import Booking from '../../models/Booking.js';
import Notification from '../../models/Notification.js';

class IncidentService {
  /**
   * Signaler un incident
   * @param {Object} incidentData - Données de l'incident
   * @returns {Promise<Object>} Incident créé
   */
  async reportIncident(incidentData) {
    const {
      bookingId,
      reportedBy,
      reportedAgainst,
      type,
      description,
      evidence = [],
      requestedAction,
      geolocation = null,
      retardInfo = null
    } = incidentData;

    // 1. Valider que le booking existe et est passé
    const booking = await Booking.findById(bookingId)
      .populate('client', 'name email')
      .populate('coiffeur', 'name email');

    if (!booking) {
      throw new Error('Réservation non trouvée');
    }

    // Vérifier que la date du booking est passée (sauf pour retards)
    if (type !== 'retard_client' && type !== 'retard_coiffeur') {
      const bookingDate = new Date(booking.date);
      const now = new Date();
      if (bookingDate > now) {
        throw new Error('Un incident ne peut être signalé que pour une réservation passée');
      }
    }

    // 2. Valider que l'utilisateur peut signaler (client ou coiffeur du booking)
    const isClient = booking.client._id.toString() === reportedBy;
    const isCoiffeur = booking.coiffeur._id.toString() === reportedBy;

    if (!isClient && !isCoiffeur) {
      throw new Error('Vous ne pouvez signaler un incident que pour vos propres réservations');
    }

    // 3. Créer l'incident selon le type
    let incident;
    const factoryData = {
      reportedBy,
      reportedAgainst,
      description,
      evidence,
      requestedAction,
      geolocation,
      retardInfo
    };

    switch (type) {
      case 'retard_client':
        incident = await incidentFactory.createRetardClient(booking, {
          delayMinutes: retardInfo?.delayMinutes || 0,
          geolocationOK: retardInfo?.geolocationOK || false,
          geolocation
        });
        break;

      case 'client_no_show':
      case 'coiffeur_no_show':
        incident = await incidentFactory.createNoShow(booking, type, factoryData);
        break;

      case 'client_dissatisfied':
        incident = await incidentFactory.createClientDissatisfied(booking, factoryData);
        break;

      case 'coiffeur_dissatisfied':
        incident = await incidentFactory.createCoiffeurDissatisfied(booking, factoryData);
        break;

      case 'paiement_black':
        incident = await incidentFactory.createPaiementBlack(booking, factoryData);
        break;

      default:
        incident = await incidentFactory.createFromBooking(booking, type, factoryData);
    }

    // 4. Envoyer notification à l'autre partie
    await this.notifyOtherParty(incident, booking);

    return incident;
  }

  /**
   * Résoudre un incident (par admin)
   * @param {string} incidentId - ID de l'incident
   * @param {Object} resolution - Résolution proposée
   * @param {string} adminId - ID de l'admin
   * @returns {Promise<Object>} Incident résolu
   */
  async resolveIncident(incidentId, resolution, adminId) {
    const incident = await incidentRepository.findById(incidentId);
    
    if (!incident) {
      throw new Error('Incident non trouvé');
    }

    if (incident.status === 'resolved' || incident.status === 'dismissed') {
      throw new Error('Cet incident a déjà été résolu');
    }

    // Mettre à jour l'incident avec la résolution
    const updateData = {
      status: 'resolved',
      resolution: {
        type: resolution.type,
        amount: resolution.amount || 0,
        reason: resolution.reason || '',
        resolvedBy: adminId,
        resolvedAt: new Date()
      }
    };

    const updatedIncident = await incidentRepository.update(incidentId, updateData);

    // Appliquer la résolution (remboursement, etc.)
    await this.applyResolution(updatedIncident, resolution);

    // Mettre à jour les réputations
    await this.updateReputation(updatedIncident);

    // Notifier les parties
    await this.notifyResolution(updatedIncident);

    return updatedIncident;
  }

  /**
   * Rejeter un incident (par admin)
   * @param {string} incidentId - ID de l'incident
   * @param {string} reason - Raison du rejet
   * @param {string} adminId - ID de l'admin
   * @returns {Promise<Object>} Incident rejeté
   */
  async dismissIncident(incidentId, reason, adminId) {
    const incident = await incidentRepository.findById(incidentId);
    
    if (!incident) {
      throw new Error('Incident non trouvé');
    }

    const updateData = {
      status: 'dismissed',
      resolution: {
        type: 'dismissed',
        reason,
        resolvedBy: adminId,
        resolvedAt: new Date()
      }
    };

    const updatedIncident = await incidentRepository.update(incidentId, updateData);

    // Notifier les parties
    await this.notifyDismissal(updatedIncident);

    return updatedIncident;
  }

  /**
   * Appliquer une résolution (remboursement, etc.)
   * @param {Object} incident - Incident résolu
   * @param {Object} resolution - Résolution à appliquer
   * @returns {Promise<void>}
   */
  async applyResolution(incident, resolution) {
    const booking = await Booking.findById(incident.booking._id);

    if (!booking) {
      throw new Error('Réservation non trouvée');
    }

    // Appliquer le remboursement si nécessaire
    if (resolution.type === 'refund_full' || resolution.type === 'refund_partial') {
      const refundAmount = resolution.amount || booking.price;
      
      // TODO: Intégrer avec Stripe pour le remboursement
      // Pour l'instant, on met juste à jour le statut
      booking.paymentStatus = 'refunded';
      await booking.save();
    }

    // Appliquer la compensation si nécessaire
    if (resolution.type === 'compensation') {
      // TODO: Logique de compensation
    }
  }

  /**
   * Mettre à jour la réputation d'un utilisateur
   * @param {Object} incident - Incident résolu
   * @returns {Promise<void>}
   */
  async updateReputation(incident) {
    // Les points sont déjà calculés dans le modèle
    // Ici, on peut ajouter d'autres logiques de réputation si nécessaire
    // Par exemple, mettre à jour la note du coiffeur, etc.
  }

  /**
   * Envoyer une notification d'incident
   * @param {Object} incident - Incident créé
   * @param {Object} booking - Booking concerné
   * @returns {Promise<void>}
   */
  async sendIncidentNotification(incident, booking) {
    // ✅ CORRECTION: Ne pas créer de notification admin si toUserId est null
    // Les notifications admin peuvent être gérées différemment (logs, etc.)
    // Pour l'instant, on ne crée pas de notification admin car toUserId est requis
    
    // Notification à l'autre partie (client ou coiffeur)
    // Cette notification sera créée dans notifyOtherParty
  }

  /**
   * Notifier l'autre partie d'un incident
   * @param {Object} incident - Incident créé
   * @param {Object} booking - Booking concerné
   * @returns {Promise<void>}
   */
  async notifyOtherParty(incident, booking) {
    const notification = new Notification({
      fromUserId: incident.reportedBy._id,
      toUserId: incident.reportedAgainst._id,
      type: 'incident_reported_against',
      title: 'Incident signalé contre vous',
      message: `Un incident a été signalé contre vous pour la réservation #${String(booking._id).slice(-6)}`,
      bookingId: booking._id,
      incidentId: incident._id,
      read: false
    });

    await notification.save();
  }

  /**
   * Notifier la résolution d'un incident
   * @param {Object} incident - Incident résolu
   * @returns {Promise<void>}
   */
  async notifyResolution(incident) {
    // Notification au client qui a signalé
    const reportedByNotification = new Notification({
      fromUserId: incident.resolution.resolvedBy,
      toUserId: incident.reportedBy._id,
      type: 'incident_resolved',
      title: 'Incident résolu',
      message: `Votre incident a été résolu : ${incident.resolution.reason}`,
      bookingId: incident.booking._id,
      incidentId: incident._id,
      read: false
    });

    await reportedByNotification.save();

    // Notification à l'autre partie
    const reportedAgainstNotification = new Notification({
      fromUserId: incident.resolution.resolvedBy,
      toUserId: incident.reportedAgainst._id,
      type: 'incident_resolved',
      title: 'Incident résolu',
      message: `L'incident signalé contre vous a été résolu : ${incident.resolution.reason}`,
      bookingId: incident.booking._id,
      incidentId: incident._id,
      read: false
    });

    await reportedAgainstNotification.save();
  }

  /**
   * Notifier le rejet d'un incident
   * @param {Object} incident - Incident rejeté
   * @returns {Promise<void>}
   */
  async notifyDismissal(incident) {
    const notification = new Notification({
      fromUserId: incident.resolution.resolvedBy,
      toUserId: incident.reportedBy._id,
      type: 'incident_dismissed',
      title: 'Incident rejeté',
      message: `Votre incident a été rejeté : ${incident.resolution.reason}`,
      bookingId: incident.booking._id,
      incidentId: incident._id,
      read: false
    });

    await notification.save();
  }

  /**
   * Récupérer les incidents en attente de validation (pour admin)
   * @returns {Promise<Array>} Liste des incidents
   */
  async getPendingIncidents() {
    return await incidentRepository.findPendingForAdmin();
  }

  /**
   * Récupérer les incidents d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {number} days - Nombre de jours (défaut: 90)
   * @returns {Promise<Array>} Liste des incidents
   */
  async getUserIncidents(userId, days = 90) {
    return await incidentRepository.findByUser(userId, days);
  }

  /**
   * Récupérer les points totaux d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {number} days - Nombre de jours (défaut: 90)
   * @returns {Promise<number>} Points totaux
   */
  async getUserTotalPoints(userId, days = 90) {
    return await incidentRepository.getUserTotalPoints(userId, days);
  }

  /**
   * Récupérer les statistiques des incidents
   * @returns {Promise<Object>} Statistiques
   */
  async getIncidentStats() {
    const statsByStatus = await incidentRepository.countByStatus();
    const statsByType = await incidentRepository.countByType();

    return {
      byStatus: statsByStatus,
      byType: statsByType
    };
  }
}

export default new IncidentService();

