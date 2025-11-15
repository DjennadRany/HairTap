/**
 * Service de réservation - Logique métier
 * Architecture DDD : Séparation des responsabilités
 */

import Booking from '../../models/Booking.js';
import Service from '../../models/Service.js';
import {
  parseBookingDateTime,
  calculateEndTime,
  areSlotsOverlapping,
  isFutureDate,
  isValidDate
} from '../../utils/dateUtils.js';

class BookingService {
  /**
   * Créer une réservation
   * @param {Object} bookingData - Données de la réservation
   * @returns {Promise<Object>} Réservation créée
   */
  async createBooking(bookingData) {
    const {
      clientId,
      coiffeurId,
      serviceId,
      date,
      time,
      duration,
      price,
      mode,
      address,
      notes
    } = bookingData;

    // Récupérer le service si serviceId fourni
    let serviceData = null;
    let finalPrice = price;
    let finalDuration = duration;
    let finalServiceName = 'Service personnalisé';

    if (serviceId) {
      try {
        serviceData = await Service.findById(serviceId);
        if (!serviceData) {
          throw new Error('Service non trouvé');
        }
        if (!serviceData.isActive) {
          throw new Error('Service non actif');
        }
        if (serviceData.coiffeur.toString() !== coiffeurId) {
          throw new Error('Service ne correspond pas au coiffeur');
        }
        finalPrice = serviceData.price;
        finalDuration = serviceData.duration;
        finalServiceName = serviceData.name;
      } catch (error) {
        // Fallback : utiliser les valeurs fournies
        if (!duration || !price) {
          throw new Error('Durée et prix requis si service non trouvé');
        }
        finalPrice = price;
        finalDuration = duration;
      }
    } else {
      if (!duration || !price) {
        throw new Error('Durée et prix requis');
      }
      finalPrice = price;
      finalDuration = duration;
    }

    // Parser la date
    const bookingDate = parseBookingDateTime(date, time);
    if (!isValidDate(bookingDate)) {
      throw new Error('Date invalide');
    }
    if (!isFutureDate(bookingDate)) {
      throw new Error('La date de réservation doit être dans le futur');
    }

    // Vérifier les conflits
    await this.checkAvailability(coiffeurId, bookingDate, finalDuration);

    // Créer la réservation
    const confirmationDeadline = new Date();
    confirmationDeadline.setHours(confirmationDeadline.getHours() + 24);

    const booking = new Booking({
      client: clientId,
      coiffeur: coiffeurId,
      service: finalServiceName,
      serviceId: serviceId || null,
      date: bookingDate,
      duration: finalDuration,
      price: finalPrice,
      mode,
      address,
      notes,
      status: 'pending',
      paymentStatus: 'pending',
      confirmationDeadline
    });

    await booking.save();

    // Populate les références
    await booking.populate('client', 'name email');
    await booking.populate('coiffeur', 'name email photo rating');
    if (booking.serviceId) {
      await booking.populate('serviceId', 'name price duration description');
    }

    return booking;
  }

  /**
   * Mettre à jour une réservation
   * @param {string} bookingId - ID de la réservation
   * @param {Object} updateData - Données à mettre à jour
   * @returns {Promise<Object>} Réservation mise à jour
   */
  async updateBooking(bookingId, updateData) {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new Error('Réservation non trouvée');
    }

    // Vérifier que la réservation peut être modifiée
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      throw new Error('Une réservation terminée ou annulée ne peut pas être modifiée');
    }

    const { date, time, notes, address, status } = updateData;
    
    // ✅ NOUVEAU: Gérer le changement de statut avec notification
    if (status && status !== booking.status) {
      const oldStatus = booking.status;
      booking.status = status;
      
      // Si le statut passe à 'completed' sans validation, envoyer une notification au client
      if (status === 'completed' && oldStatus === 'confirmed') {
        try {
          await booking.populate('client coiffeur');
          const Notification = (await import('../../models/Notification.js')).default;
          const notification = new Notification({
            fromUserId: booking.coiffeur._id,
            toUserId: booking.client._id,
            type: 'booking_update',
            title: 'Réservation terminée',
            message: `Votre réservation avec ${booking.coiffeur.name} a été marquée comme terminée.`,
            bookingId: booking._id,
            read: false,
            metadata: {
              bookingId: booking._id.toString(),
              service: booking.service,
              date: booking.date,
              status: 'completed'
            }
          });
          await notification.save();
          console.log(`✅ Notification envoyée au client ${booking.client._id} : réservation terminée sans validation`);
        } catch (error) {
          console.error('❌ Erreur lors de l\'envoi de la notification au client:', error);
          // Ne pas bloquer la mise à jour si la notification échoue
        }
      }
    }

    // Mettre à jour la date si fournie
    if (date || time) {
      const existingDate = new Date(booking.date);
      const existingDateStr = existingDate.toISOString().split('T')[0];
      const existingTimeStr = existingDate.toTimeString().slice(0, 5);

      const newDate = date || existingDateStr;
      const newTime = time || existingTimeStr;

      const bookingDate = parseBookingDateTime(newDate, newTime);
      if (!isValidDate(bookingDate)) {
        throw new Error('Date invalide');
      }
      if (!isFutureDate(bookingDate)) {
        throw new Error('La date de réservation doit être dans le futur');
      }

      // Vérifier les conflits (exclure la réservation actuelle)
      await this.checkAvailability(
        booking.coiffeur.toString(),
        bookingDate,
        booking.duration,
        bookingId
      );

      booking.date = bookingDate;
    }

    // Mettre à jour les notes si fournies
    if (notes !== undefined) {
      booking.notes = notes;
    }

    // Mettre à jour l'adresse si fournie
    if (address !== undefined) {
      booking.address = address;
    }

    booking.updatedAt = new Date();
    await booking.save();

    // Populate les références
    await booking.populate('client', 'name email');
    await booking.populate('coiffeur', 'name email photo rating');
    if (booking.serviceId) {
      await booking.populate('serviceId', 'name price duration description');
    }

    return booking;
  }

  /**
   * Vérifier la disponibilité d'un créneau
   * @param {string} coiffeurId - ID du coiffeur
   * @param {Date} bookingDate - Date de la réservation
   * @param {number} duration - Durée en minutes
   * @param {string} excludeBookingId - ID de réservation à exclure (pour mise à jour)
   * @throws {Error} Si le créneau n'est pas disponible
   */
  async checkAvailability(coiffeurId, bookingDate, duration, excludeBookingId = null) {
    const endTime = calculateEndTime(bookingDate, duration);

    // Récupérer les réservations confirmées
    const query = {
      coiffeur: coiffeurId,
      status: 'confirmed'
    };

    if (excludeBookingId) {
      query._id = { $ne: excludeBookingId };
    }

    const activeBookings = await Booking.find(query);

    // Vérifier les chevauchements
    const conflictingBookings = activeBookings.filter(existingBooking => {
      const existingStart = new Date(existingBooking.date);
      const existingEnd = calculateEndTime(existingStart, existingBooking.duration);
      return areSlotsOverlapping(bookingDate, endTime, existingStart, existingEnd);
    });

    if (conflictingBookings.length > 0) {
      throw new Error('Créneau non disponible, veuillez choisir un autre horaire');
    }
  }

  /**
   * Annuler une réservation
   * @param {string} bookingId - ID de la réservation
   * @param {string} reason - Raison de l'annulation
   * @returns {Promise<Object>} Réservation annulée
   */
  async cancelBooking(bookingId, reason) {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new Error('Réservation non trouvée');
    }

    const fee = booking.getCancellationFee();
    await booking.cancelWithFee(reason);

    // ✅ NOUVEAU: Remboursement automatique si paiement effectué
    if (booking.paymentStatus === 'paid' && booking.stripePaymentIntentId) {
      try {
        const { createRefund } = await import('../../services/stripeService.js');
        const refundAmount = booking.price - fee; // Montant à rembourser (prix - frais)
        
        if (refundAmount > 0) {
          const refundData = await createRefund(
            booking.stripePaymentIntentId,
            refundAmount,
            reason || 'requested_by_customer'
          );
          
          // Mettre à jour le statut de paiement
          booking.paymentStatus = 'refunded';
          await booking.save();
          
          // Mettre à jour le paiement si existe
          const Payment = (await import('../../models/Payment.js')).default;
          const payment = await Payment.findOne({ booking: bookingId });
          if (payment) {
            payment.status = 'refunded';
            payment.refundAmount = refundData.amount;
            payment.refundReason = reason;
            payment.stripeRefundId = refundData.refundId;
            await payment.save();
          }
          
          console.log(`✅ Remboursement automatique effectué pour réservation ${bookingId}: ${refundData.amount}€`);
        }
      } catch (error) {
        console.error('❌ Erreur lors du remboursement automatique:', error);
        // Ne pas bloquer l'annulation si le remboursement échoue
        // L'utilisateur pourra le faire manuellement plus tard
      }
    }

    // Populate les références
    await booking.populate('client', 'name email');
    await booking.populate('coiffeur', 'name email photo rating');
    if (booking.serviceId) {
      await booking.populate('serviceId', 'name price duration description');
    }

    return {
      booking,
      cancellationFee: fee
    };
  }

  /**
   * Confirmer une réservation
   * @param {string} bookingId - ID de la réservation
   * @param {string} confirmedBy - Qui a confirmé ('client' | 'coiffeur' | 'system')
   * @returns {Promise<Object>} Réservation confirmée
   */
  async confirmBooking(bookingId, confirmedBy = 'coiffeur') {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new Error('Réservation non trouvée');
    }

    await booking.confirm(confirmedBy);

    // Populate les références
    await booking.populate('client', 'name email');
    await booking.populate('coiffeur', 'name email photo rating');
    if (booking.serviceId) {
      await booking.populate('serviceId', 'name price duration description');
    }

    return booking;
  }

  /**
   * Récupérer les réservations d'un client
   * @param {string} clientId - ID du client
   * @returns {Promise<Array>} Liste des réservations
   */
  async getClientBookings(clientId) {
    return await Booking.find({ client: clientId })
      .populate('coiffeur', 'name photo rating')
      .populate('serviceId', 'name price duration description')
      .sort({ date: -1 });
  }

  /**
   * Récupérer les réservations d'un coiffeur
   * @param {string} coiffeurId - ID du coiffeur
   * @returns {Promise<Array>} Liste des réservations
   */
  async getCoiffeurBookings(coiffeurId) {
    // ✅ Ne pas trier côté backend, laisser le frontend gérer le tri selon les préférences utilisateur
    return await Booking.find({ coiffeur: coiffeurId })
      .populate('client', 'name photo')
      .populate('serviceId', 'name price duration description')
      .sort({ date: 1 }); // Tri par défaut croissant (les plus proches en premier)
  }

  /**
   * Récupérer une réservation par ID
   * @param {string} bookingId - ID de la réservation
   * @returns {Promise<Object>} Réservation
   */
  async getBookingById(bookingId) {
    const booking = await Booking.findById(bookingId)
      .populate('client', 'name email photo')
      .populate('coiffeur', 'name email photo rating')
      .populate('serviceId', 'name price duration description');

    if (!booking) {
      throw new Error('Réservation non trouvée');
    }

    return booking;
  }
}

export default new BookingService();

