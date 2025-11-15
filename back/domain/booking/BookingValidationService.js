/**
 * Service de validation de prestation - Style Uber
 * Gestion de la validation avant/pendant/après prestation
 */

import Booking from '../../models/Booking.js';
import BookingValidation from '../../models/BookingValidation.js';

class BookingValidationService {
  /**
   * Créer une validation pour une réservation
   * @param {string} bookingId - ID de la réservation
   * @returns {Promise<Object>} Validation créée
   */
  async createValidation(bookingId) {
    // Vérifier que la réservation existe
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new Error('Réservation non trouvée');
    }

    // Vérifier qu'une validation n'existe pas déjà
    const existing = await BookingValidation.findOne({ booking: bookingId });
    if (existing) {
      return existing;
    }

    // Créer la validation
    const validation = new BookingValidation({
      booking: bookingId,
      validationStatus: 'not_started'
    });

    await validation.save();
    return validation;
  }

  /**
   * Récupérer la validation d'une réservation
   * @param {string} bookingId - ID de la réservation
   * @returns {Promise<Object>} Validation
   */
  async getValidation(bookingId) {
    let validation = await BookingValidation.findOne({ booking: bookingId })
      .populate('booking')
      .populate('validatedBy', 'name email');

    if (!validation) {
      // Créer automatiquement si n'existe pas
      validation = await this.createValidation(bookingId);
    }

    return validation;
  }

  /**
   * Valider l'étape pré-service
   * @param {string} bookingId - ID de la réservation
   * @param {Object} checklist - Checklist pré-service
   * @returns {Promise<Object>} Validation mise à jour
   */
  async validatePreService(bookingId, checklist) {
    const validation = await this.getValidation(bookingId);
    const booking = await Booking.findById(bookingId).populate('client coiffeur');
    
    // ✅ NOUVEAU: Vérifier si le matériel vient d'être préparé
    const materialJustPrepared = checklist.materialPrepared === true && !validation.preService.materialPrepared;
    
    // Mettre à jour la checklist
    if (checklist.materialPrepared !== undefined) {
      validation.preService.materialPrepared = checklist.materialPrepared;
    }
    if (checklist.clientContacted !== undefined) {
      validation.preService.clientContacted = checklist.clientContacted;
    }
    if (checklist.addressVerified !== undefined) {
      validation.preService.addressVerified = checklist.addressVerified;
    }
    if (checklist.timeConfirmed !== undefined) {
      validation.preService.timeConfirmed = checklist.timeConfirmed;
    }

    // Vérifier si tout est complété
    const allComplete = validation.preService.materialPrepared &&
                        validation.preService.clientContacted &&
                        validation.preService.addressVerified &&
                        validation.preService.timeConfirmed;

    if (allComplete) {
      await validation.completePreService();
    } else {
      await validation.save();
    }

    // ✅ NOUVEAU: Envoyer une notification au client si le matériel vient d'être préparé
    if (materialJustPrepared && booking.client) {
      try {
        const Notification = (await import('../../models/Notification.js')).default;
        const notification = new Notification({
          fromUserId: booking.coiffeur._id,
          toUserId: booking.client._id,
          type: 'material_prepared',
          title: 'Votre coiffeur est prêt ! ✂️',
          message: `${booking.coiffeur.name} a préparé tout le matériel pour votre réservation.`,
          bookingId: booking._id,
          read: false,
          metadata: {
            bookingId: booking._id.toString(),
            service: booking.service,
            date: booking.date
          }
        });
        await notification.save();
        console.log(`✅ Notification envoyée au client ${booking.client._id} : matériel préparé`);
      } catch (error) {
        console.error('❌ Erreur lors de l\'envoi de la notification au client:', error);
        // Ne pas bloquer la validation si la notification échoue
      }
    }

    return validation;
  }

  /**
   * Démarrer le service
   * @param {string} bookingId - ID de la réservation
   * @param {boolean} clientPresent - Client présent
   * @returns {Promise<Object>} Validation mise à jour
   */
  async startService(bookingId, clientPresent = true) {
    const validation = await this.getValidation(bookingId);
    
    validation.duringService.clientPresent = clientPresent;
    
    if (!clientPresent) {
      // Ajouter un problème si client absent
      await validation.addIssue(
        'client_absent',
        'Client absent au début du service',
        'high'
      );
    } else {
      await validation.startService();
    }

    return validation;
  }

  /**
   * Valider la qualité du service
   * @param {string} bookingId - ID de la réservation
   * @param {boolean} qualityChecked - Qualité vérifiée
   * @returns {Promise<Object>} Validation mise à jour
   */
  async validateQuality(bookingId, qualityChecked = true) {
    const validation = await this.getValidation(bookingId);
    
    validation.duringService.qualityChecked = qualityChecked;
    
    if (!qualityChecked) {
      await validation.addIssue(
        'quality_issue',
        'Problème de qualité détecté',
        'medium'
      );
    } else {
      await validation.save();
    }

    return validation;
  }

  /**
   * Terminer le service
   * @param {string} bookingId - ID de la réservation
   * @param {Object} postServiceData - Données post-service
   * @returns {Promise<Object>} Validation mise à jour
   */
  async completeService(bookingId, postServiceData) {
    const validation = await this.getValidation(bookingId);
    
    validation.postService.serviceCompleted = true;
    validation.postService.serviceCompletedAt = new Date();
    
    if (postServiceData.clientSatisfied !== undefined) {
      validation.postService.clientSatisfied = postServiceData.clientSatisfied;
    }
    if (postServiceData.paymentConfirmed !== undefined) {
      validation.postService.paymentConfirmed = postServiceData.paymentConfirmed;
    }
    if (postServiceData.invoiceIssued !== undefined) {
      validation.postService.invoiceIssued = postServiceData.invoiceIssued;
    }
    if (postServiceData.notes) {
      validation.notes = postServiceData.notes;
    }

    await validation.completeService();
    return validation;
  }

  /**
   * Finaliser la validation
   * @param {string} bookingId - ID de la réservation
   * @param {string} validatedBy - ID de l'utilisateur qui valide
   * @returns {Promise<Object>} Validation finalisée
   */
  async finalizeValidation(bookingId, validatedBy) {
    const validation = await this.getValidation(bookingId);
    
    // Vérifier qu'il n'y a pas de problèmes non résolus
    const unresolvedIssues = validation.issues.filter(issue => !issue.resolved);
    if (unresolvedIssues.length > 0) {
      throw new Error(`Il y a ${unresolvedIssues.length} problème(s) non résolu(s)`);
    }

    validation.validatedBy = validatedBy;
    await validation.finalizeValidation();
    
    return validation;
  }

  /**
   * Ajouter un problème
   * @param {string} bookingId - ID de la réservation
   * @param {string} type - Type de problème
   * @param {string} description - Description
   * @param {string} severity - Gravité
   * @returns {Promise<Object>} Validation mise à jour
   */
  async addIssue(bookingId, type, description, severity = 'medium') {
    const validation = await this.getValidation(bookingId);
    await validation.addIssue(type, description, severity);
    return validation;
  }

  /**
   * Résoudre un problème
   * @param {string} bookingId - ID de la réservation
   * @param {string} issueId - ID du problème
   * @returns {Promise<Object>} Validation mise à jour
   */
  async resolveIssue(bookingId, issueId) {
    const validation = await this.getValidation(bookingId);
    await validation.resolveIssue(issueId);
    return validation;
  }

  /**
   * Vérifier les manquements (délai de confirmation, etc.)
   * @param {string} bookingId - ID de la réservation
   * @returns {Promise<Array>} Liste des manquements détectés
   */
  async checkMissingItems(bookingId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new Error('Réservation non trouvée');
    }

    const validation = await this.getValidation(bookingId);
    const missingItems = [];

    // Vérifier délai de confirmation
    if (booking.status === 'pending' && booking.confirmationDeadline) {
      const now = new Date();
      const deadline = new Date(booking.confirmationDeadline);
      const hoursUntilDeadline = (deadline - now) / (1000 * 60 * 60);

      if (hoursUntilDeadline < 0) {
        missingItems.push({
          type: 'confirmation_deadline_passed',
          severity: 'high',
          message: 'Délai de confirmation dépassé',
          action: 'confirm_or_cancel'
        });
      } else if (hoursUntilDeadline < 4) {
        missingItems.push({
          type: 'confirmation_deadline_approaching',
          severity: 'medium',
          message: `Délai de confirmation approchant (${Math.round(hoursUntilDeadline)}h restantes)`,
          action: 'confirm_urgently'
        });
      }
    }

    // Vérifier checklist pré-service
    if (validation.validationStatus === 'not_started' || validation.validationStatus === 'pre_service') {
      if (!validation.preService.materialPrepared) {
        missingItems.push({
          type: 'material_not_prepared',
          severity: 'medium',
          message: 'Matériel non préparé',
          action: 'prepare_material'
        });
      }
      if (!validation.preService.clientContacted) {
        missingItems.push({
          type: 'client_not_contacted',
          severity: 'low',
          message: 'Client non contacté',
          action: 'contact_client'
        });
      }
    }

    return missingItems;
  }
}

export default new BookingValidationService();

