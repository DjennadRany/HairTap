/**
 * Service de notifications pour les réservations - Style Uber
 * Gestion des alertes, rappels et manquements
 */

import Booking from '../../models/Booking.js';
import BookingValidation from '../../models/BookingValidation.js';
import bookingValidationService from './BookingValidationService.js';

class BookingNotificationService {
  /**
   * Vérifier et générer les alertes pour une réservation
   * @param {string} bookingId - ID de la réservation
   * @returns {Promise<Array>} Liste des alertes
   */
  async checkAndGenerateAlerts(bookingId) {
    const booking = await Booking.findById(bookingId)
      .populate('client', 'name email')
      .populate('coiffeur', 'name email');
    
    if (!booking) {
      throw new Error('Réservation non trouvée');
    }

    const alerts = [];
    const now = new Date();
    const bookingDate = new Date(booking.date);

    // 1. Alerte : Délai de confirmation approchant
    if (booking.status === 'pending' && booking.confirmationDeadline) {
      const deadline = new Date(booking.confirmationDeadline);
      const hoursUntilDeadline = (deadline - now) / (1000 * 60 * 60);

      if (hoursUntilDeadline < 0) {
        alerts.push({
          type: 'confirmation_deadline_passed',
          severity: 'critical',
          title: 'Délai de confirmation dépassé',
          message: 'Vous devez confirmer ou refuser cette réservation immédiatement',
          action: 'confirm_or_cancel',
          bookingId: booking._id
        });
      } else if (hoursUntilDeadline < 4) {
        alerts.push({
          type: 'confirmation_deadline_approaching',
          severity: 'high',
          title: 'Délai de confirmation approchant',
          message: `Il reste ${Math.round(hoursUntilDeadline)}h pour confirmer cette réservation`,
          action: 'confirm_urgently',
          bookingId: booking._id
        });
      }
    }

    // 2. Alerte : Réservation approchant (24h avant)
    const hoursUntilBooking = (bookingDate - now) / (1000 * 60 * 60);
    if (hoursUntilBooking > 0 && hoursUntilBooking <= 24 && booking.status === 'confirmed') {
      alerts.push({
        type: 'booking_approaching',
        severity: 'medium',
        title: 'Réservation dans 24h',
        message: `Rappel : Réservation avec ${booking.client.name} le ${bookingDate.toLocaleDateString('fr-FR')} à ${bookingDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
        action: 'prepare',
        bookingId: booking._id
      });
    }

    // 3. Alerte : Réservation dans 2h
    if (hoursUntilBooking > 0 && hoursUntilBooking <= 2 && booking.status === 'confirmed') {
      alerts.push({
        type: 'booking_soon',
        severity: 'high',
        title: 'Réservation dans 2h',
        message: `Préparez-vous pour la réservation avec ${booking.client.name}`,
        action: 'final_preparation',
        bookingId: booking._id
      });
    }

    // 4. Alerte : Service non démarré après l'heure prévue
    if (now > bookingDate && booking.status === 'confirmed') {
      const validation = await BookingValidation.findOne({ booking: bookingId });
      if (!validation || !validation.duringService.serviceStarted) {
        alerts.push({
          type: 'service_not_started',
          severity: 'high',
          title: 'Service non démarré',
          message: 'Le service devrait avoir commencé. Veuillez démarrer le service ou contacter le client',
          action: 'start_service',
          bookingId: booking._id
        });
      }
    }

    // 5. Alerte : Service non terminé après la durée prévue
    if (booking.status === 'confirmed') {
      const endTime = new Date(bookingDate.getTime() + booking.duration * 60000);
      if (now > endTime) {
        const validation = await BookingValidation.findOne({ booking: bookingId });
        if (!validation || !validation.postService.serviceCompleted) {
          alerts.push({
            type: 'service_not_completed',
            severity: 'medium',
            title: 'Service non terminé',
            message: 'Le service devrait être terminé. Veuillez finaliser la prestation',
            action: 'complete_service',
            bookingId: booking._id
          });
        }
      }
    }

    // 6. Vérifier les manquements de validation
    try {
      const missingItems = await bookingValidationService.checkMissingItems(bookingId);
      missingItems.forEach(item => {
        alerts.push({
          type: item.type,
          severity: item.severity,
          title: 'Manquement détecté',
          message: item.message,
          action: item.action,
          bookingId: booking._id
        });
      });
    } catch (error) {
      // Ignorer si validation n'existe pas encore
    }

    return alerts;
  }

  /**
   * Récupérer toutes les alertes pour un coiffeur
   * @param {string} coiffeurId - ID du coiffeur
   * @returns {Promise<Array>} Liste des alertes
   */
  async getCoiffeurAlerts(coiffeurId) {
    const bookings = await Booking.find({
      coiffeur: coiffeurId,
      status: { $in: ['pending', 'confirmed'] }
    })
      .populate('client', 'name email')
      .sort({ date: 1 });

    const allAlerts = [];
    
    for (const booking of bookings) {
      try {
        const alerts = await this.checkAndGenerateAlerts(booking._id.toString());
        allAlerts.push(...alerts);
      } catch (error) {
        console.error(`Erreur lors de la vérification des alertes pour réservation ${booking._id}:`, error);
      }
    }

    // Trier par sévérité et date
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    allAlerts.sort((a, b) => {
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return new Date(a.bookingId) - new Date(b.bookingId);
    });

    return allAlerts;
  }

  /**
   * Récupérer toutes les alertes pour un client
   * @param {string} clientId - ID du client
   * @returns {Promise<Array>} Liste des alertes
   */
  async getClientAlerts(clientId) {
    const now = new Date();
    
    // ✅ CORRECTION: Inclure aussi les réservations passées qui nécessitent une régularisation
    const bookings = await Booking.find({
      client: clientId,
      status: { $in: ['pending', 'confirmed'] }
    })
      .populate('coiffeur', 'name email')
      .sort({ date: 1 });

    const allAlerts = [];
    
    for (const booking of bookings) {
      try {
        const bookingDate = new Date(booking.date);
        const isPast = bookingDate <= now;
        
        // ✅ NOUVEAU: Alerte pour les réservations passées qui nécessitent une régularisation
        if (isPast && (booking.status === 'pending' || booking.status === 'confirmed')) {
          allAlerts.push({
            type: 'past_booking_needs_regularization',
            severity: 'high',
            title: 'Réservation passée à régulariser',
            message: `La réservation du ${bookingDate.toLocaleDateString('fr-FR')} à ${bookingDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} nécessite une régularisation`,
            action: 'regularize',
            bookingId: booking._id.toString()
          });
        } else {
          // Alertes normales pour les réservations à venir
          const alerts = await this.checkAndGenerateAlerts(booking._id.toString());
          // Filtrer les alertes pertinentes pour le client
          const clientAlerts = alerts.filter(alert => 
            alert.type === 'confirmation_deadline_approaching' ||
            alert.type === 'booking_approaching' ||
            alert.type === 'booking_soon'
          );
          allAlerts.push(...clientAlerts);
        }
      } catch (error) {
        console.error(`Erreur lors de la vérification des alertes pour réservation ${booking._id}:`, error);
      }
    }

    return allAlerts;
  }
}

export default new BookingNotificationService();

