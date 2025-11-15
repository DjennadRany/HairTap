/**
 * Factory pour créer les incidents - Création d'objets
 * Architecture DDD : Centralisation de la logique de création
 */

import Incident from '../../models/Incident.js';
import incidentRepository from './IncidentRepository.js';

class IncidentFactory {
  /**
   * Créer un incident depuis un booking
   * @param {Object} booking - Booking concerné
   * @param {string} type - Type d'incident
   * @param {Object} data - Données supplémentaires
   * @returns {Promise<Object>} Incident créé
   */
  async createFromBooking(booking, type, data) {
    const {
      reportedBy,
      reportedAgainst,
      description,
      evidence = [],
      requestedAction,
      geolocation = null,
      retardInfo = null
    } = data;

    // Déterminer la gravité selon le type
    const severity = this.determineSeverity(type, data);

    // Créer l'incident
    const incidentData = {
      booking: booking._id,
      reportedBy,
      reportedAgainst,
      type,
      severity,
      description,
      evidence,
      requestedAction,
      geolocation,
      retardInfo,
      status: 'reported'
    };

    const incident = await incidentRepository.save(incidentData);
    
    // Calculer les points automatiquement
    incident.calculatePoints();
    await incident.save();

    return incident;
  }

  /**
   * Créer un incident de retard client
   * @param {Object} booking - Booking concerné
   * @param {Object} retardData - Données du retard
   * @returns {Promise<Object>} Incident créé
   */
  async createRetardClient(booking, retardData) {
    const {
      delayMinutes,
      geolocationOK,
      geolocation = null
    } = retardData;

    // Déterminer la pénalité selon les règles
    let penaltyPercentage = 0;
    let penaltyAmount = 0;

    if (delayMinutes >= 10 && delayMinutes < 30) {
      // Retard 10-30 min : Pénalité 10% si géolocalisation suspecte
      if (!geolocationOK) {
        penaltyPercentage = 10;
        penaltyAmount = booking.price * 0.10;
      }
    } else if (delayMinutes >= 30 && delayMinutes < 45) {
      // Retard 30-45 min : Pénalité 15% OU annulation (choix coiffeur)
      penaltyPercentage = 15;
      penaltyAmount = booking.price * 0.15;
    } else if (delayMinutes >= 45) {
      // Retard ≥ 45 min : Annulation automatique + Paiement total
      penaltyPercentage = 100;
      penaltyAmount = booking.price;
    }

    const incidentData = {
      reportedBy: booking.coiffeur,
      reportedAgainst: booking.client,
      description: `Client en retard de ${delayMinutes} minutes`,
      requestedAction: delayMinutes >= 45 ? 'refund_full' : 'compensation',
      geolocation,
      retardInfo: {
        delayMinutes,
        geolocationOK,
        penaltyApplied: penaltyAmount > 0,
        penaltyAmount,
        penaltyPercentage
      }
    };

    return await this.createFromBooking(booking, 'retard_client', incidentData);
  }

  /**
   * Créer un incident de no-show
   * @param {Object} booking - Booking concerné
   * @param {string} noShowType - 'client_no_show' ou 'coiffeur_no_show'
   * @param {Object} data - Données supplémentaires
   * @returns {Promise<Object>} Incident créé
   */
  async createNoShow(booking, noShowType, data = {}) {
    const {
      description = `${noShowType === 'client_no_show' ? 'Client' : 'Coiffeur'} n'est pas venu au rendez-vous`,
      geolocation = null
    } = data;

    const incidentData = {
      reportedBy: noShowType === 'client_no_show' ? booking.coiffeur : booking.client,
      reportedAgainst: noShowType === 'client_no_show' ? booking.client : booking.coiffeur,
      description,
      requestedAction: 'refund_full',
      geolocation
    };

    return await this.createFromBooking(booking, noShowType, incidentData);
  }

  /**
   * Créer un incident de satisfaction client
   * @param {Object} booking - Booking concerné
   * @param {Object} data - Données de l'incident
   * @returns {Promise<Object>} Incident créé
   */
  async createClientDissatisfied(booking, data) {
    const {
      description,
      evidence = [],
      requestedAction = 'refund_partial',
      geolocation = null
    } = data;

    const incidentData = {
      reportedBy: booking.client,
      reportedAgainst: booking.coiffeur,
      description,
      evidence,
      requestedAction,
      geolocation
    };

    return await this.createFromBooking(booking, 'client_dissatisfied', incidentData);
  }

  /**
   * Créer un incident de satisfaction coiffeur
   * @param {Object} booking - Booking concerné
   * @param {Object} data - Données de l'incident
   * @returns {Promise<Object>} Incident créé
   */
  async createCoiffeurDissatisfied(booking, data) {
    const {
      description,
      evidence = [],
      requestedAction = 'compensation',
      geolocation = null
    } = data;

    const incidentData = {
      reportedBy: booking.coiffeur,
      reportedAgainst: booking.client,
      description,
      evidence,
      requestedAction,
      geolocation
    };

    return await this.createFromBooking(booking, 'coiffeur_dissatisfied', incidentData);
  }

  /**
   * Créer un incident de paiement au black
   * @param {Object} booking - Booking concerné
   * @param {Object} data - Données de l'incident
   * @returns {Promise<Object>} Incident créé
   */
  async createPaiementBlack(booking, data) {
    const {
      description,
      evidence = [],
      geolocation = null
    } = data;

    const incidentData = {
      reportedBy: booking.client, // Généralement signalé par le client
      reportedAgainst: booking.coiffeur,
      description: description || 'Paiement au black détecté',
      evidence,
      requestedAction: 'ban',
      geolocation
    };

    return await this.createFromBooking(booking, 'paiement_black', incidentData);
  }

  /**
   * Créer une alerte automatique pour no-show
   * @param {Object} booking - Booking concerné
   * @returns {Promise<Object>} Alerte créée
   */
  async createNoShowAlert(booking) {
    // Déterminer qui n'est pas venu (client ou coiffeur)
    // Pour l'instant, on suppose que c'est le client qui n'est pas venu
    // Cette logique peut être améliorée avec des vérifications de géolocalisation
    
    return await this.createNoShow(booking, 'client_no_show', {
      description: 'Alerte automatique : Client n\'est pas venu au rendez-vous'
    });
  }

  /**
   * Déterminer la gravité selon le type d'incident
   * @param {string} type - Type d'incident
   * @param {Object} data - Données supplémentaires
   * @returns {string} Gravité ('low', 'medium', 'high', 'critical')
   */
  determineSeverity(type, data) {
    switch (type) {
      case 'retard_client':
        if (data.retardInfo && data.retardInfo.delayMinutes >= 45) {
          return 'medium'; // Retard ≥ 45 min = moyen
        } else if (data.retardInfo && data.retardInfo.delayMinutes >= 30) {
          return 'low'; // Retard 30-45 min = léger
        }
        return 'low'; // Retard < 30 min = léger

      case 'client_no_show':
      case 'coiffeur_no_show':
        return 'high'; // No-show = grave

      case 'service_quality_issue':
        return 'high'; // Erreur technique grave = grave

      case 'behavior_issue':
        // Si comportement grave (agression, harcèlement)
        if (data.severity === 'critical') {
          return 'critical';
        }
        return 'high'; // Comportement inapproprié = grave

      case 'paiement_black':
        return 'critical'; // Fraude = critique

      case 'client_dissatisfied':
      case 'coiffeur_dissatisfied':
        // Gravité selon la description ou les preuves
        if (data.severity) {
          return data.severity;
        }
        return 'medium'; // Par défaut = moyen

      default:
        return 'medium';
    }
  }
}

export default new IncidentFactory();









