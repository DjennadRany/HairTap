/**
 * Repository pour les incidents - Accès aux données
 * Architecture DDD : Séparation des responsabilités
 */

import Incident from '../../models/Incident.js';

class IncidentRepository {
  /**
   * Trouver un incident par ID
   * @param {string} incidentId - ID de l'incident
   * @returns {Promise<Object>} Incident
   */
  async findById(incidentId) {
    return await Incident.findById(incidentId)
      .populate('booking', 'date service price status client coiffeur')
      .populate('reportedBy', 'name email photo')
      .populate('reportedAgainst', 'name email photo')
      .populate('resolution.resolvedBy', 'name email');
  }

  /**
   * Trouver un incident par booking
   * @param {string} bookingId - ID du booking
   * @returns {Promise<Array>} Liste des incidents
   */
  async findByBooking(bookingId) {
    return await Incident.find({ booking: bookingId })
      .populate('reportedBy', 'name email photo')
      .populate('reportedAgainst', 'name email photo')
      .sort({ createdAt: -1 });
  }

  /**
   * Trouver les incidents d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {number} days - Nombre de jours (défaut: 90)
   * @returns {Promise<Array>} Liste des incidents
   */
  async findByUser(userId, days = 90) {
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);

    return await Incident.find({
      $or: [
        { reportedBy: userId },
        { reportedAgainst: userId }
      ],
      createdAt: { $gte: dateLimit }
    })
      .populate('booking', 'date service price status')
      .populate('reportedBy', 'name email photo')
      .populate('reportedAgainst', 'name email photo')
      .sort({ createdAt: -1 });
  }

  /**
   * Trouver les incidents signalés contre un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {number} days - Nombre de jours (défaut: 90)
   * @returns {Promise<Array>} Liste des incidents
   */
  async findByReportedAgainst(userId, days = 90) {
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);

    return await Incident.find({
      reportedAgainst: userId,
      createdAt: { $gte: dateLimit }
    })
      .populate('booking', 'date service price status')
      .populate('reportedBy', 'name email photo')
      .sort({ createdAt: -1 });
  }

  /**
   * Trouver les incidents par statut
   * @param {string} status - Statut de l'incident
   * @returns {Promise<Array>} Liste des incidents
   */
  async findByStatus(status) {
    return await Incident.find({ status })
      .populate('booking', 'date service price status client coiffeur')
      .populate('reportedBy', 'name email photo')
      .populate('reportedAgainst', 'name email photo')
      .sort({ createdAt: -1 });
  }

  /**
   * Trouver les incidents en attente de validation (pour admin)
   * @returns {Promise<Array>} Liste des incidents
   */
  async findPendingForAdmin() {
    return await Incident.find({
      status: { $in: ['reported', 'under_review'] }
    })
      .populate('booking', 'date service price status client coiffeur')
      .populate('reportedBy', 'name email photo')
      .populate('reportedAgainst', 'name email photo')
      .sort({ createdAt: -1 });
  }

  /**
   * Trouver les incidents par type
   * @param {string} type - Type d'incident
   * @param {number} days - Nombre de jours (défaut: 90)
   * @returns {Promise<Array>} Liste des incidents
   */
  async findByType(type, days = 90) {
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);

    return await Incident.find({
      type,
      createdAt: { $gte: dateLimit }
    })
      .populate('booking', 'date service price status')
      .populate('reportedBy', 'name email photo')
      .populate('reportedAgainst', 'name email photo')
      .sort({ createdAt: -1 });
  }

  /**
   * Sauvegarder un incident
   * @param {Object} incidentData - Données de l'incident
   * @returns {Promise<Object>} Incident sauvegardé
   */
  async save(incidentData) {
    const incident = new Incident(incidentData);
    await incident.save();
    
    // Populate les références
    await incident.populate('booking', 'date service price status');
    await incident.populate('reportedBy', 'name email photo');
    await incident.populate('reportedAgainst', 'name email photo');
    
    return incident;
  }

  /**
   * Mettre à jour un incident
   * @param {string} incidentId - ID de l'incident
   * @param {Object} updateData - Données à mettre à jour
   * @returns {Promise<Object>} Incident mis à jour
   */
  async update(incidentId, updateData) {
    updateData.updatedAt = new Date();
    const incident = await Incident.findByIdAndUpdate(
      incidentId,
      updateData,
      { new: true }
    )
      .populate('booking', 'date service price status')
      .populate('reportedBy', 'name email photo')
      .populate('reportedAgainst', 'name email photo');

    if (!incident) {
      throw new Error('Incident non trouvé');
    }

    return incident;
  }

  /**
   * Supprimer un incident
   * @param {string} incidentId - ID de l'incident
   * @returns {Promise<boolean>} True si supprimé
   */
  async delete(incidentId) {
    const result = await Incident.findByIdAndDelete(incidentId);
    return !!result;
  }

  /**
   * Calculer les points totaux d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {number} days - Nombre de jours (défaut: 90)
   * @returns {Promise<number>} Points totaux
   */
  async getUserTotalPoints(userId, days = 90) {
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);

    const incidents = await Incident.find({
      reportedAgainst: userId,
      status: { $in: ['resolved', 'escalated'] },
      createdAt: { $gte: dateLimit }
    });

    // Calcul avec décroissance temporelle
    const now = new Date();
    let totalPoints = 0;

    incidents.forEach(incident => {
      const daysElapsed = (now - incident.createdAt) / (1000 * 60 * 60 * 24);
      const decay = Math.max(0, 1 - (daysElapsed / 90)); // Décroissance sur 90 jours
      totalPoints += incident.points * decay;
    });

    return Math.round(totalPoints * 100) / 100; // Arrondi à 2 décimales
  }

  /**
   * Compter les incidents par statut
   * @returns {Promise<Object>} Statistiques
   */
  async countByStatus() {
    const stats = await Incident.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      reported: 0,
      under_review: 0,
      mediation: 0,
      resolved: 0,
      escalated: 0,
      dismissed: 0
    };

    stats.forEach(stat => {
      result[stat._id] = stat.count;
    });

    return result;
  }

  /**
   * Compter les incidents par type
   * @param {number} days - Nombre de jours (défaut: 90)
   * @returns {Promise<Object>} Statistiques
   */
  async countByType(days = 90) {
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);

    const stats = await Incident.aggregate([
      {
        $match: {
          createdAt: { $gte: dateLimit }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    return stats;
  }
}

export default new IncidentRepository();









