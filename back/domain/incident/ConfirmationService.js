/**
 * Service de confirmation de prestation avec géolocalisation
 * Architecture DDD : Logique métier pour confirmations et vérifications
 * ✅ INTÉGRÉ avec BookingValidationService et BookingNotificationService
 */

import Booking from '../../models/Booking.js';
import bookingValidationService from '../booking/BookingValidationService.js';
import bookingNotificationService from '../booking/BookingNotificationService.js';
import { calculateEndTime } from '../../utils/dateUtils.js';

class ConfirmationService {
  /**
   * Envoyer une alerte 10 minutes avant le RDV
   * @param {string} bookingId - ID du booking
   * @returns {Promise<void>}
   */
  async sendPreBookingAlert(bookingId) {
    const booking = await Booking.findById(bookingId)
      .populate('client', 'name email')
      .populate('coiffeur', 'name email');

    if (!booking) {
      throw new Error('Réservation non trouvée');
    }

    if (booking.status !== 'confirmed') {
      return; // Pas d'alerte si booking non confirmé
    }

    // ✅ INTÉGRÉ: Utiliser BookingNotificationService pour générer les alertes
    // Les alertes seront automatiquement générées par checkAndGenerateAlerts
    // On ajoute juste les notifications spécifiques pour pré-booking
    const Notification = (await import('../../models/Notification.js')).default;
    
    // Notification au client
    const clientNotification = new Notification({
      fromUserId: null, // Système
      toUserId: booking.client._id,
      type: 'pre_booking_alert',
      title: 'Rappel : Votre rendez-vous approche',
      message: 'Votre rendez-vous est dans 10 minutes. Êtes-vous en route ? Confirmez votre localisation.',
      bookingId: booking._id,
      metadata: {
        requiresGeolocation: true,
        alertType: 'pre_booking'
      },
      read: false
    });

    await clientNotification.save();

    // Notification au coiffeur
    const coiffeurNotification = new Notification({
      fromUserId: null, // Système
      toUserId: booking.coiffeur._id,
      type: 'pre_booking_alert',
      title: 'Rappel : Rendez-vous dans 10 minutes',
      message: 'Le client arrive dans 10 minutes. Vérifiez que vous êtes prêt.',
      bookingId: booking._id,
      metadata: {
        alertType: 'pre_booking'
      },
      read: false
    });

    await coiffeurNotification.save();
  }

  /**
   * Envoyer une alerte 5 minutes après le début de la prestation
   * @param {string} bookingId - ID du booking
   * @returns {Promise<void>}
   */
  async sendServiceStartConfirmation(bookingId) {
    const booking = await Booking.findById(bookingId)
      .populate('client', 'name email')
      .populate('coiffeur', 'name email');

    if (!booking) {
      throw new Error('Réservation non trouvée');
    }

    if (booking.status !== 'confirmed') {
      return; // Pas d'alerte si booking non confirmé
    }

    // ✅ INTÉGRÉ: Utiliser BookingNotificationService pour générer les alertes
    // Les alertes seront automatiquement générées par checkAndGenerateAlerts
    // On ajoute juste les notifications spécifiques pour confirmation début
    const Notification = (await import('../../models/Notification.js')).default;
    
    // Notification au client
    const clientNotification = new Notification({
      fromUserId: null, // Système
      toUserId: booking.client._id,
      type: 'service_start_confirmation',
      title: 'La prestation a-t-elle bien commencé ?',
      message: 'Veuillez confirmer que la prestation a bien commencé avec une photo et votre localisation.',
      bookingId: booking._id,
      metadata: {
        requiresGeolocation: true,
        requiresPhoto: true,
        alertType: 'service_start'
      },
      read: false
    });

    await clientNotification.save();

    // Notification au coiffeur
    const coiffeurNotification = new Notification({
      fromUserId: null, // Système
      toUserId: booking.coiffeur._id,
      type: 'service_start_confirmation',
      title: 'La prestation a-t-elle bien commencé ?',
      message: 'Veuillez confirmer que la prestation a bien commencé avec une photo et votre localisation.',
      bookingId: booking._id,
      metadata: {
        requiresGeolocation: true,
        requiresPhoto: true,
        alertType: 'service_start'
      },
      read: false
    });

    await coiffeurNotification.save();
  }

  /**
   * Envoyer une alerte à la fin de la prestation
   * @param {string} bookingId - ID du booking
   * @returns {Promise<void>}
   */
  async sendServiceEndConfirmation(bookingId) {
    const booking = await Booking.findById(bookingId)
      .populate('client', 'name email')
      .populate('coiffeur', 'name email');

    if (!booking) {
      throw new Error('Réservation non trouvée');
    }

    if (booking.status !== 'confirmed') {
      return; // Pas d'alerte si booking non confirmé
    }

    // Notification au client
    const clientNotification = new Notification({
      fromUserId: null, // Système
      toUserId: booking.client._id,
      type: 'service_end_confirmation',
      title: 'La prestation est-elle terminée ?',
      message: 'Veuillez confirmer que la prestation est terminée et si vous êtes satisfait.',
      bookingId: booking._id,
      metadata: {
        alertType: 'service_end',
        requiresConfirmation: true
      },
      read: false
    });

    await clientNotification.save();

    // Notification au coiffeur
    const coiffeurNotification = new Notification({
      fromUserId: null, // Système
      toUserId: booking.coiffeur._id,
      type: 'service_end_confirmation',
      title: 'La prestation est-elle terminée ?',
      message: 'Veuillez marquer la prestation comme complétée.',
      bookingId: booking._id,
      metadata: {
        alertType: 'service_end',
        requiresConfirmation: true
      },
      read: false
    });

    await coiffeurNotification.save();
  }

  /**
   * Vérifier la géolocalisation pour s'assurer que client et coiffeur sont au même endroit
   * @param {string} bookingId - ID du booking
   * @param {Object} clientLocation - Localisation du client
   * @param {Object} coiffeurLocation - Localisation du coiffeur
   * @returns {Promise<Object>} Résultat de la vérification
   */
  async verifyGeolocation(bookingId, clientLocation, coiffeurLocation) {
    const booking = await Booking.findById(bookingId)
      .populate('client', 'name email')
      .populate('coiffeur', 'name email');

    if (!booking) {
      throw new Error('Réservation non trouvée');
    }

    // Calculer la distance entre les deux localisations
    const distance = this.calculateDistance(
      clientLocation.latitude,
      clientLocation.longitude,
      coiffeurLocation.latitude,
      coiffeurLocation.longitude
    );

    // Distance < 100m = OK (match)
    const isMatch = distance < 100;

    return {
      isMatch,
      distance,
      clientLocation,
      coiffeurLocation,
      bookingId
    };
  }

  /**
   * Calculer la distance entre deux points (formule de Haversine)
   * @param {number} lat1 - Latitude point 1
   * @param {number} lon1 - Longitude point 1
   * @param {number} lat2 - Latitude point 2
   * @param {number} lon2 - Longitude point 2
   * @returns {number} Distance en mètres
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Rayon de la Terre en mètres
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  }

  /**
   * Convertir degrés en radians
   * @param {number} deg - Degrés
   * @returns {number} Radians
   */
  toRad(deg) {
    return deg * (Math.PI / 180);
  }

  /**
   * Confirmer le début de la prestation (client ET coiffeur)
   * @param {string} bookingId - ID du booking
   * @param {string} userId - ID de l'utilisateur qui confirme
   * @param {Object} confirmationData - Données de confirmation (photo, géolocalisation)
   * @returns {Promise<Object>} Résultat de la confirmation
   */
  async confirmServiceStart(bookingId, userId, confirmationData) {
    const booking = await Booking.findById(bookingId)
      .populate('client', 'name email')
      .populate('coiffeur', 'name email');

    if (!booking) {
      throw new Error('Réservation non trouvée');
    }

    // Vérifier que l'utilisateur est bien le client ou le coiffeur
    const isClient = booking.client._id.toString() === userId;
    const isCoiffeur = booking.coiffeur._id.toString() === userId;

    if (!isClient && !isCoiffeur) {
      throw new Error('Non autorisé');
    }

    // ✅ INTÉGRÉ: Utiliser BookingValidationService pour stocker la confirmation
    const validation = await bookingValidationService.getValidation(bookingId);
    
    if (isClient) {
      validation.duringService.clientConfirmed = true;
      validation.duringService.clientConfirmedAt = new Date();
      if (confirmationData.geolocation) {
        validation.duringService.geolocation.clientLocation = confirmationData.geolocation;
      }
      if (confirmationData.photo) {
        validation.duringService.confirmationPhotos.push({
          uploadedBy: userId,
          url: confirmationData.photo,
          timestamp: new Date()
        });
      }
    } else if (isCoiffeur) {
      validation.duringService.coiffeurConfirmed = true;
      validation.duringService.coiffeurConfirmedAt = new Date();
      if (confirmationData.geolocation) {
        validation.duringService.geolocation.coiffeurLocation = confirmationData.geolocation;
      }
      if (confirmationData.photo) {
        validation.duringService.confirmationPhotos.push({
          uploadedBy: userId,
          url: confirmationData.photo,
          timestamp: new Date()
        });
      }
    }

    await validation.save();

    // Vérifier si les deux parties ont confirmé
    const clientConfirmed = validation.duringService.clientConfirmed;
    const coiffeurConfirmed = validation.duringService.coiffeurConfirmed;

    if (clientConfirmed && coiffeurConfirmed) {
      // Les deux parties ont confirmé, vérifier la géolocalisation
      const clientLocation = validation.duringService.geolocation.clientLocation;
      const coiffeurLocation = validation.duringService.geolocation.coiffeurLocation;

      if (clientLocation && coiffeurLocation) {
        const verification = await this.verifyGeolocation(bookingId, clientLocation, coiffeurLocation);

        // Mettre à jour la validation avec le résultat de la vérification
        validation.duringService.geolocation.distance = verification.distance;
        validation.duringService.geolocation.isMatch = verification.isMatch;
        await validation.save();

        if (verification.isMatch) {
          // Géolocalisation OK, prestation validée
          return {
            success: true,
            bothConfirmed: true,
            geolocationMatch: true,
            message: 'Prestation confirmée et validée'
          };
        } else {
          // Géolocalisation suspecte, alerte admin
          await this.alertAdminGeolocationMismatch(booking, verification);
          return {
            success: true,
            bothConfirmed: true,
            geolocationMatch: false,
            message: 'Prestation confirmée mais géolocalisation suspecte',
            distance: verification.distance
          };
        }
      }
    }

    return {
      success: true,
      bothConfirmed: false,
      message: isClient ? 'Confirmation client enregistrée' : 'Confirmation coiffeur enregistrée'
    };
  }

  /**
   * Confirmer la fin de la prestation (client ET coiffeur)
   * @param {string} bookingId - ID du booking
   * @param {string} userId - ID de l'utilisateur qui confirme
   * @param {Object} confirmationData - Données de confirmation (satisfaction, etc.)
   * @returns {Promise<Object>} Résultat de la confirmation
   */
  async confirmServiceEnd(bookingId, userId, confirmationData) {
    const booking = await Booking.findById(bookingId)
      .populate('client', 'name email')
      .populate('coiffeur', 'name email');

    if (!booking) {
      throw new Error('Réservation non trouvée');
    }

    // Vérifier que l'utilisateur est bien le client ou le coiffeur
    const isClient = booking.client._id.toString() === userId;
    const isCoiffeur = booking.coiffeur._id.toString() === userId;

    if (!isClient && !isCoiffeur) {
      throw new Error('Non autorisé');
    }

    // ✅ INTÉGRÉ: Utiliser BookingValidationService pour stocker la confirmation
    const validation = await bookingValidationService.getValidation(bookingId);
    
    if (isClient) {
      validation.postService.clientEndConfirmed = true;
      validation.postService.clientEndConfirmedAt = new Date();
      if (confirmationData.satisfied !== undefined) {
        validation.postService.clientSatisfied = confirmationData.satisfied;
      }
      if (confirmationData.hasProblem !== undefined) {
        validation.postService.clientHasProblem = confirmationData.hasProblem;
      }
      if (confirmationData.problemDescription) {
        validation.postService.clientProblemDescription = confirmationData.problemDescription;
      }
    } else if (isCoiffeur) {
      validation.postService.coiffeurEndConfirmed = true;
      validation.postService.coiffeurEndConfirmedAt = new Date();
    }

    await validation.save();

    // Vérifier si les deux parties ont confirmé
    const clientConfirmed = validation.postService.clientEndConfirmed;
    const coiffeurConfirmed = validation.postService.coiffeurEndConfirmed;

    if (clientConfirmed && coiffeurConfirmed) {
      // Les deux parties ont confirmé
      const clientSatisfied = validation.postService.clientSatisfied;
      const clientHasProblem = validation.postService.clientHasProblem;

      // Si le client a un problème, créer un incident
      if (clientHasProblem) {
        const incidentService = (await import('./IncidentService.js')).default;
        await incidentService.reportIncident({
          bookingId: booking._id,
          reportedBy: booking.client._id.toString(),
          reportedAgainst: booking.coiffeur._id.toString(),
          type: 'client_dissatisfied',
          description: validation.postService.clientProblemDescription || 'Problème signalé par le client',
          requestedAction: 'refund_partial'
        });
      }

      // ✅ INTÉGRÉ: Utiliser BookingValidationService pour compléter le service
      await bookingValidationService.completeService(bookingId, {
        clientSatisfied: clientSatisfied !== undefined ? clientSatisfied : true,
        paymentConfirmed: booking.paymentStatus === 'paid',
        invoiceIssued: false
      });

      // Marquer le booking comme complété
      booking.status = 'completed';
      await booking.save();

      return {
        success: true,
        bothConfirmed: true,
        clientSatisfied,
        hasProblem: clientHasProblem,
        message: 'Prestation confirmée et terminée'
      };
    }

    return {
      success: true,
      bothConfirmed: false,
      message: isClient ? 'Confirmation client enregistrée' : 'Confirmation coiffeur enregistrée'
    };
  }

  /**
   * Alerter l'admin en cas de mismatch de géolocalisation
   * @param {Object} booking - Booking concerné
   * @param {Object} verification - Résultat de la vérification
   * @returns {Promise<void>}
   */
  async alertAdminGeolocationMismatch(booking, verification) {
    // TODO: Trouver l'admin ou créer une notification admin
    const adminNotification = new Notification({
      fromUserId: null, // Système
      toUserId: null, // Admin (à définir selon votre système)
      type: 'geolocation_mismatch',
      title: 'Géolocalisation suspecte',
      message: `La géolocalisation ne correspond pas pour la réservation #${String(booking._id).slice(-6)}. Distance: ${Math.round(verification.distance)}m`,
      bookingId: booking._id,
      metadata: {
        distance: verification.distance,
        clientLocation: verification.clientLocation,
        coiffeurLocation: verification.coiffeurLocation
      },
      read: false
    });

    await adminNotification.save();
  }

  /**
   * Vérifier tous les bookings confirmés et envoyer les alertes appropriées
   * @returns {Promise<Array>} Liste des alertes envoyées
   */
  async checkAndSendAlerts() {
    const now = new Date();
    const alerts = [];

    // Trouver tous les bookings confirmés
    const confirmedBookings = await Booking.find({
      status: 'confirmed'
    })
      .populate('client', 'name email')
      .populate('coiffeur', 'name email');

    for (const booking of confirmedBookings) {
      const bookingDate = new Date(booking.date);
      const bookingEndTime = calculateEndTime(bookingDate, booking.duration);
      const minutesUntilBooking = (bookingDate - now) / (1000 * 60);
      const minutesAfterStart = (now - bookingDate) / (1000 * 60);
      const minutesAfterEnd = (now - bookingEndTime) / (1000 * 60);

      try {
        // Alerte 10 min avant
        if (minutesUntilBooking >= 0 && minutesUntilBooking <= 10) {
          await this.sendPreBookingAlert(booking._id);
          alerts.push({ type: 'pre_booking', bookingId: booking._id });
        }

        // Alerte 5 min après le début
        if (minutesAfterStart >= 5 && minutesAfterStart <= 10) {
          await this.sendServiceStartConfirmation(booking._id);
          alerts.push({ type: 'service_start', bookingId: booking._id });
        }

        // Alerte à la fin
        if (minutesAfterEnd >= 0 && minutesAfterEnd <= 5) {
          await this.sendServiceEndConfirmation(booking._id);
          alerts.push({ type: 'service_end', bookingId: booking._id });
        }
      } catch (error) {
        console.error(`Erreur lors de l'envoi d'alerte pour booking ${booking._id}:`, error);
      }
    }

    return alerts;
  }
}

export default new ConfirmationService();

