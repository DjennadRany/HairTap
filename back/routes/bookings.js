import express from 'express';
import Booking from '../models/Booking.js';
import WorkingSlot from '../models/WorkingSlot.js';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import { validateBooking } from '../middleware/validate.js';
import { fetchServiceForBooking, getAvailabilityWithBookings } from '../services/slotService.js';
import { validatePaymentStatus } from '../utils/validators.js';
import { populateBookingForClient, populateBookingForCoiffeur, populateBookingComplete, populateBookingDocument } from '../services/bookingPopulateService.js';

const router = express.Router();

// Récupérer la disponibilité combinée (créneaux + réservations) pour un coiffeur
// NOTE: La géolocalisation est gérée dans la recherche de coiffeurs (/api/coiffeurs), pas ici
router.get('/availability', async (req, res) => {
  try {
    const { coiffeurId, startDate, endDate, mode } = req.query;

    if (!coiffeurId) {
      return res.status(400).json({ success: false, message: 'coiffeurId est requis' });
    }

    const availability = await getAvailabilityWithBookings(coiffeurId, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      mode,
    });

    res.json({ success: true, data: availability });
  } catch (error) {
    console.error('Get availability error:', error);
    const status = error.status || error.statusCode || 500;
    res.status(status).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération des disponibilités',
    });
  }
});

// Récupérer toutes les réservations d'un client
router.get('/client', auth, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      console.error('Token JWT manquant ou invalide dans /api/bookings/client');
      return res.status(401).json({ message: 'Non authentifié' });
    }
    const bookings = await populateBookingForClient(
      Booking.find({ client: req.user.id })
    )
      .sort({ date: -1 });
    res.json(bookings);
  } catch (error) {
    console.error('Get client bookings error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des réservations', error: error.message });
  }
});

// Récupérer toutes les réservations d'un coiffeur
router.get('/coiffeur', auth, async (req, res) => {
  try {
    console.log('📅 [GET /bookings/coiffeur] Requête pour coiffeur:', req.user?.id);
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Non authentifié (coiffeur)' });
    }
    
    const bookings = await populateBookingForCoiffeur(
      Booking.find({ coiffeur: req.user.id })
    )
      .sort({ date: -1 });
    
    console.log('✅ [GET /bookings/coiffeur] Réservations trouvées:', bookings.length);
    
    res.json(bookings);
  } catch (error) {
    console.error('❌ [GET /bookings/coiffeur] Erreur:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des réservations', error: error.message });
  }
});

// Récupérer toutes les réservations d'un coiffeur spécifique
// SÉCURITÉ : Restreindre l'accès au coiffeur propriétaire ou à un admin
router.get('/coiffeur/:coiffeurId', auth, async (req, res) => {
  try {
    const coiffeurId = req.params.coiffeurId;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Vérifier que l'utilisateur est le coiffeur propriétaire ou un admin
    if (coiffeurId !== userId && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé. Vous ne pouvez consulter que vos propres réservations.'
      });
    }
    
    console.log('📅 [GET /bookings/coiffeur/:coiffeurId] Requête pour coiffeurId:', coiffeurId);
    
    const bookings = await populateBookingForCoiffeur(
      Booking.find({ coiffeur: coiffeurId })
    )
      .sort({ date: -1 });
    
    console.log('✅ [GET /bookings/coiffeur/:coiffeurId] Réservations trouvées:', bookings.length);
    
    res.json(bookings);
  } catch (error) {
    console.error('❌ [GET /bookings/coiffeur/:coiffeurId] Erreur:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des réservations', error: error.message });
  }
});

// Les routes spécifiques doivent être AVANT la route générique /:id

// Confirmer une réservation
router.post('/:id/confirm', auth, async (req, res) => {
  try {
    console.log('📅 [POST /bookings/:id/confirm] Requête pour bookingId:', req.params.id);
    console.log('📅 [POST /bookings/:id/confirm] Utilisateur:', req.user?.id);
    
    // ✅ CORRECTION Bug #2 : Utiliser service helper pour unifier
    const booking = await populateBookingComplete(
      Booking.findById(req.params.id)
    );
    
    if (!booking) {
      console.error('❌ [POST /bookings/:id/confirm] Réservation introuvable:', req.params.id);
      return res.status(404).json({ message: 'Réservation introuvable' });
    }

    // Vérifier que l'utilisateur est le coiffeur
    const coiffeurId = booking.coiffeur._id ? booking.coiffeur._id.toString() : booking.coiffeur.toString();
    if (coiffeurId !== req.user.id) {
      console.error('❌ [POST /bookings/:id/confirm] Accès refusé - pas le coiffeur:', {
        bookingCoiffeur: coiffeurId,
        userId: req.user.id
      });
      return res.status(403).json({ message: 'Seuls les coiffeurs peuvent confirmer les réservations' });
    }

    // Vérifier que la réservation est en attente
    if (booking.status !== 'pending') {
      console.warn('⚠️ [POST /bookings/:id/confirm] Réservation déjà confirmée ou annulée:', booking.status);
      return res.status(400).json({ 
        message: `Cette réservation est déjà ${booking.status === 'confirmed' ? 'confirmée' : booking.status === 'cancelled' ? 'annulée' : booking.status}` 
      });
    }

    booking.status = 'confirmed';
    booking.paymentStatus = 'deposit_paid';
    booking.updatedAt = new Date();
    await booking.save();

    // Populate pour l'événement SSE
    await populateBookingDocument(booking);
    
    // Émettre événement SSE
    const { bookingEventService } = await import('../services/eventService.js');
    bookingEventService.emitBookingConfirmed(booking);

    console.log('✅ [POST /bookings/:id/confirm] Réservation confirmée avec succès');

    res.json({
      success: true,
      data: booking,
      message: 'Réservation confirmée avec succès'
    });
  } catch (error) {
    console.error('❌ [POST /bookings/:id/confirm] Erreur:', error);
    res.status(500).json({ message: 'Erreur lors de la confirmation de la réservation', error: error.message });
  }
});

// Annuler une réservation
router.post('/:id/cancel', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Réservation introuvable' });
    }

    // Vérifier que l'utilisateur peut annuler cette réservation
    if (booking.client.toString() !== req.user.id && booking.coiffeur.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Calculer les frais d'annulation
    const cancellationFee = booking.getCancellationFee();
    const hoursUntilBooking = (new Date(booking.date) - new Date()) / (1000 * 60 * 60);
    
    // Utiliser la nouvelle méthode avec calcul des frais
    await booking.cancelWithFee(req.body.reason || 'Annulé par l\'utilisateur');
    
    // Mettre à jour paymentStatus selon la politique d'annulation
    if (cancellationFee === 0) {
      // Annulation gratuite : remboursement complet
      booking.paymentStatus = 'refunded';
    } else if (cancellationFee < booking.price) {
      // Annulation partielle : remboursement partiel
      booking.paymentStatus = 'refunded';
    } else {
      // Pas de remboursement
      booking.paymentStatus = 'cancelled';
    }
    await booking.save();

    try {
      await populateBookingDocument(booking);
      await sendBookingCancellationEmail({
        email: booking.client.email,
        userName: booking.client.name,
        bookingDate: new Date(booking.date).toLocaleDateString('fr-FR'),
        bookingTime: booking.time,
        serviceName: booking.service,
        reason: req.body.reason || 'Annulation TapHair'
      });
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi de l\'email d\'annulation:', emailError);
    }

    res.json({
      ...booking.toObject(),
      cancellationFee,
      hoursUntilBooking: Math.round(hoursUntilBooking),
      message: cancellationFee > 0 
        ? `Annulation avec frais de ${cancellationFee}€ (${cancellationFee/booking.price*100}% du prix total)`
        : 'Annulation gratuite (plus de 48h avant)'
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Erreur lors de l\'annulation de la réservation', error: error.message });
  }
});

// Terminer une réservation
router.post('/:id/complete', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Réservation introuvable' });
    }

    // Vérifier que l'utilisateur est le coiffeur
    if (booking.coiffeur.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Seuls les coiffeurs peuvent terminer les réservations' });
    }

    // Vérifier que la réservation n'est pas déjà terminée
    if (booking.status === 'completed') {
      return res.status(400).json({ 
        success: false,
        message: 'Cette réservation est déjà terminée' 
      });
    }

    // Vérifier que l'heure de fin du service est passée
    const bookingEndTime = new Date(new Date(booking.date).getTime() + booking.duration * 60000);
    const now = new Date();
    
    if (now < bookingEndTime) {
      const minutesRemaining = Math.ceil((bookingEndTime - now) / (1000 * 60));
      return res.status(400).json({ 
        success: false,
        message: `Impossible de terminer la réservation. Le service se termine dans ${minutesRemaining} minute(s).` 
      });
    }

    booking.status = 'completed';
    booking.paymentStatus = 'confirmed';
    booking.updatedAt = new Date();
    await booking.save();

    // Populate pour l'événement SSE
    await populateBookingDocument(booking);
    
    // Émettre événement SSE
    const { bookingEventService } = await import('../services/eventService.js');
    bookingEventService.emitBookingCompleted(booking);

    res.json({
      success: true,
      data: booking,
      message: 'Réservation terminée avec succès'
    });
  } catch (error) {
    console.error('Complete booking error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la finalisation de la réservation' 
    });
  }
});

// Récupérer la politique d'annulation d'une réservation
router.get('/:id/cancellation-policy', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Réservation introuvable' });
    }

    // Vérifier que l'utilisateur est bien le client ou le coiffeur
    if (booking.client.toString() !== req.user.id && 
        booking.coiffeur.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const now = new Date();
    const bookingDate = new Date(booking.date);
    const hoursUntilBooking = (bookingDate - now) / (1000 * 60 * 60);
    
    const cancellationFee = booking.getCancellationFee();
    const feePercentage = booking.price > 0 ? (cancellationFee / booking.price) * 100 : 0;
    const refundAmount = booking.price - cancellationFee;

    res.json({
      success: true,
      data: {
        bookingId: booking._id.toString(),
        hoursUntilBooking: Math.round(hoursUntilBooking),
        canCancelFree: hoursUntilBooking >= 48,
        cancellationFee,
        feePercentage: Math.round(feePercentage),
        refundAmount,
        price: booking.price,
        rules: {
          freeCancellation: '≥ 48h avant',
          partialFee: '24-48h avant (25% du prix)',
          highFee: '< 24h avant (75% du prix)'
        }
      }
    });
  } catch (error) {
    console.error('Get cancellation policy error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de la politique d\'annulation' });
  }
});

// Marquer une réservation comme en retard
router.post('/:id/mark-late', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Réservation introuvable' });
    }

    // Vérifier que l'utilisateur est le coiffeur
    if (booking.coiffeur.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Seuls les coiffeurs peuvent marquer une réservation comme en retard' });
    }

    // Vérifier que la réservation est confirmée
    if (booking.status !== 'confirmed') {
      return res.status(400).json({ 
        message: `Impossible de marquer comme en retard. Statut actuel: ${booking.status}` 
      });
    }

    const now = new Date();
    const bookingDate = new Date(booking.date);
    const delayMinutes = Math.floor((now - bookingDate) / (1000 * 60));

    // Calculer pénalité selon le retard
    let penaltyPercentage = 0;
    let penaltyAmount = 0;
    
    if (delayMinutes >= 45) {
      // Retard ≥ 45 min : Annulation automatique
      booking.status = 'cancelled';
      booking.cancellationReason = `Retard de ${delayMinutes} minutes (≥45 min)`;
      booking.cancellationFee = booking.price * 0.75; // 75% de frais
    } else if (delayMinutes >= 30) {
      // Retard 30-45 min : Pénalité 25%
      booking.status = 'late';
      penaltyPercentage = 25;
      penaltyAmount = booking.price * 0.25;
    } else if (delayMinutes >= 15) {
      // Retard 15-30 min : Pénalité 10%
      booking.status = 'late';
      penaltyPercentage = 10;
      penaltyAmount = booking.price * 0.10;
    } else {
      // Retard < 15 min : Pas de pénalité, juste marquer comme late
      booking.status = 'late';
    }

    booking.updatedAt = new Date();
    await booking.save();

    // Populate et émettre événement SSE
    await populateBookingDocument(booking);
    const { bookingEventService } = await import('../services/eventService.js');
    bookingEventService.emitBookingUpdated(booking, { 
      status: 'late', 
      delayMinutes,
      penaltyAmount 
    });

    res.json({
      success: true,
      data: booking,
      delayMinutes,
      penaltyPercentage,
      penaltyAmount,
      message: delayMinutes >= 45 
        ? 'Réservation annulée automatiquement (retard ≥ 45 min)'
        : `Réservation marquée comme en retard (${delayMinutes} min)`
    });
  } catch (error) {
    console.error('Mark late error:', error);
    res.status(500).json({ message: 'Erreur lors du marquage de la réservation comme en retard' });
  }
});

// Reporter une réservation
router.post('/:id/reschedule', auth, async (req, res) => {
  try {
    const { newDate, newTime, reason } = req.body;

    if (!newDate || !newTime) {
      return res.status(400).json({ 
        message: 'newDate et newTime sont requis' 
      });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Réservation introuvable' });
    }

    // Vérifier que l'utilisateur peut reporter (client ou coiffeur)
    if (booking.client.toString() !== req.user.id && 
        booking.coiffeur.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Vérifier que la réservation peut être reportée
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return res.status(400).json({ 
        message: 'Impossible de reporter une réservation terminée ou annulée' 
      });
    }

    const newBookingDate = new Date(`${newDate}T${newTime}`);
    if (Number.isNaN(newBookingDate.getTime())) {
      return res.status(400).json({ message: 'Format de date ou d\'heure invalide' });
    }

    // Vérifier disponibilité du nouveau créneau
    const bookingEndTime = new Date(newBookingDate.getTime() + booking.duration * 60000);
    const overlappingBookings = await Booking.find({
      coiffeur: booking.coiffeur,
      _id: { $ne: booking._id },
      status: { $nin: ['cancelled', 'completed'] },
      date: { $lt: bookingEndTime },
      $expr: {
        $gt: [
          { $add: ['$date', { $multiply: ['$duration', 60000] }] },
          newBookingDate
        ]
      }
    });

    if (overlappingBookings.length > 0) {
      return res.status(409).json({
        message: 'Créneau non disponible, veuillez choisir un autre horaire'
      });
    }

    // Sauvegarder l'ancienne date pour historique
    const oldDate = booking.date;
    const oldTime = booking.time;

    // Mettre à jour la réservation
    booking.date = newBookingDate;
    booking.time = newTime;
    booking.status = 'rescheduled';
    booking.updatedAt = new Date();
    
    // Ajouter note si raison fournie
    if (reason) {
      booking.notes = booking.notes 
        ? `${booking.notes}\n[Reporté] ${reason}`
        : `[Reporté] ${reason}`;
    }

    await booking.save();

    // Populate et émettre événement SSE
    await populateBookingDocument(booking);
    const { bookingEventService } = await import('../services/eventService.js');
    bookingEventService.emitBookingUpdated(booking, { 
      status: 'rescheduled',
      oldDate,
      oldTime,
      newDate: newBookingDate,
      newTime,
      reason
    });

    res.json({
      success: true,
      data: booking,
      oldDate,
      oldTime,
      newDate: newBookingDate,
      newTime,
      message: 'Réservation reportée avec succès'
    });
  } catch (error) {
    console.error('Reschedule error:', error);
    res.status(500).json({ message: 'Erreur lors du report de la réservation' });
  }
});

// Récupérer une réservation par ID (DOIT être APRÈS les routes spécifiques)
router.get('/:id', auth, async (req, res) => {
  try {
    // ✅ CORRECTION Bug #2 : Utiliser service helper pour unifier
    const booking = await populateBookingComplete(
      Booking.findById(req.params.id)
    );

    if (!booking) {
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }

    // Vérifier que l'utilisateur est bien le client ou le coiffeur
    if (booking.client._id.toString() !== req.user.id && 
        booking.coiffeur._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    res.json(booking);
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de la réservation' });
  }
});

// Créer une nouvelle réservation - AVEC VALIDATION DISPONIBILITÉ
router.post('/', auth, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    console.log('🔧 Données reçues pour réservation:', req.body);

    const {
      serviceId,
      coiffeurId,
      slotId,
      date,
      time,
      duration,
      price,
      mode,
      address,
      notes,
      acceptedTermsAt,
      acceptedCancellationPolicyAt,
      acceptedPaymentConsentAt
    } = req.body;

    if (!serviceId || !coiffeurId || !mode) {
      return res.status(400).json({
        success: false,
        message: 'serviceId, coiffeurId et mode sont obligatoires'
      });
    }

    if (!slotId && (!date || !time)) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir un slotId ou une date et une heure'
      });
    }

    if (!date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Date et heure requises'
      });
    }

    if (!acceptedTermsAt || !acceptedCancellationPolicyAt || !acceptedPaymentConsentAt) {
      return res.status(400).json({
        success: false,
        message: 'Les consentements obligatoires doivent être acceptés'
      });
    }

    // Vérifier que time est au format HH:mm
    if (!time || !/^\d{2}:\d{2}$/.test(time)) {
      return res.status(400).json({ success: false, message: 'Format d\'heure invalide (attendu: HH:mm)' });
    }
    const bookingDate = new Date(`${date}T${time}`);
    if (Number.isNaN(bookingDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Format de date ou d\'heure invalide' });
    }
    // Vérifier que l'heure a bien été parsée
    if (bookingDate.getHours() === 0 && bookingDate.getMinutes() === 0 && time !== '00:00') {
      console.warn('⚠️ [bookings] Heure peut-être incorrecte:', { date, time, parsed: bookingDate });
    }

    const termsDate = new Date(acceptedTermsAt);
    const cancellationDate = new Date(acceptedCancellationPolicyAt);
    const paymentConsentDate = new Date(acceptedPaymentConsentAt);

    if (
      Number.isNaN(termsDate.getTime()) ||
      Number.isNaN(cancellationDate.getTime()) ||
      Number.isNaN(paymentConsentDate.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: 'Format de date invalide pour les consentements'
      });
    }

    // ✅ CORRECTION: Récupérer aussi salonAddress pour stocker l'adresse du salon
    const coiffeur = await User.findById(coiffeurId).select('role workingMode name salonAddress');
    if (!coiffeur || coiffeur.role !== 'coiffeur') {
      return res.status(404).json({ success: false, message: 'Coiffeur non trouvé' });
    }

    const allowedModes = Array.isArray(coiffeur.workingMode) && coiffeur.workingMode.length > 0
      ? coiffeur.workingMode
      : ['salon', 'domicile'];

    if (!allowedModes.includes(mode)) {
      return res.status(400).json({
        success: false,
        message: 'Ce coiffeur ne propose pas ce mode de réservation'
      });
    }

    const service = await fetchServiceForBooking(serviceId, coiffeurId);

    const resolvedDuration = typeof duration === 'number' ? duration : service.duration;
    if (!resolvedDuration || resolvedDuration <= 0) {
      return res.status(400).json({ success: false, message: 'Durée de service invalide' });
    }

    const resolvedPrice = typeof price === 'number' ? price : service.price;
    if (resolvedPrice === undefined || resolvedPrice === null) {
      return res.status(400).json({ success: false, message: 'Prix de la réservation manquant' });
    }

    let slot = null;
    if (slotId) {
      slot = await WorkingSlot.findById(slotId);
      if (!slot) {
        return res.status(404).json({ success: false, message: 'Créneau introuvable' });
      }

      if (slot.coiffeurId.toString() !== coiffeurId) {
        return res.status(400).json({ success: false, message: 'Ce créneau n\'appartient pas à ce coiffeur' });
      }

      if (slot.status === 'maintenance' || slot.status === 'unavailable') {
        return res.status(409).json({ success: false, message: 'Ce créneau n\'est pas disponible' });
      }

      const supportedModes = slot.availableAt === 'both' ? ['salon', 'domicile'] : [slot.availableAt];
      if (!supportedModes.includes(mode)) {
        return res.status(400).json({ success: false, message: 'Mode non compatible avec ce créneau' });
      }

      if (bookingDate.getDay() !== slot.dayOfWeek) {
        return res.status(400).json({ success: false, message: 'La date ne correspond pas au créneau choisi' });
      }

      const expectedSlotTime = `${String(Math.floor(slot.startTime)).padStart(2, '0')}:${String(Math.round((slot.startTime - Math.floor(slot.startTime)) * 60)).padStart(2, '0')}`;
      if (expectedSlotTime !== time) {
        return res.status(400).json({ success: false, message: 'L\'heure ne correspond pas au créneau choisi' });
      }

      const slotDurationMinutes = Math.round((slot.endTime - slot.startTime) * 60);
      if (resolvedDuration > slotDurationMinutes) {
        return res.status(400).json({ success: false, message: 'La durée du service dépasse la durée du créneau' });
      }

      const remainingCapacity = (slot.maxBookings ?? 1) - (slot.currentBookings ?? 0);
      if (remainingCapacity <= 0) {
        return res.status(409).json({ success: false, message: 'Ce créneau est complet' });
      }
    }

    const bookingEndTime = new Date(bookingDate.getTime() + resolvedDuration * 60000);

    const overlappingBookings = await Booking.find({
      coiffeur: coiffeurId,
      status: { $nin: ['cancelled', 'completed'] },
      date: { $lt: bookingEndTime },
      $expr: {
        $gt: [
          { $add: ['$date', { $multiply: ['$duration', 60000] }] },
          bookingDate
        ]
      }
    });

    if (overlappingBookings.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Créneau non disponible, veuillez choisir un autre horaire'
      });
    }

    // Stocker l'adresse selon le mode
    // - Pour 'domicile' : adresse du client (où se déroule la prestation)
    // - Pour 'salon' : adresse du salon (où se déroule la prestation)
    let normalizedAddress = undefined;
    if (mode === 'domicile' && address) {
      normalizedAddress = {
        street: address.street,
        streetNumber: address.streetNumber,
        city: address.city,
        postalCode: address.postalCode,
        floor: address.floor,
        apartment: address.apartment,
        buildingCode: address.buildingCode,
        additionalInfo: address.additionalInfo
      };
    } else if (mode === 'salon' && coiffeur.salonAddress) {
      normalizedAddress = {
        street: coiffeur.salonAddress.street,
        streetNumber: coiffeur.salonAddress.streetNumber,
        city: coiffeur.salonAddress.city,
        postalCode: coiffeur.salonAddress.postalCode,
        floor: coiffeur.salonAddress.floor,
        apartment: coiffeur.salonAddress.apartment,
        buildingCode: coiffeur.salonAddress.buildingCode,
        additionalInfo: coiffeur.salonAddress.additionalInfo
      };
    }

    const booking = new Booking({
      client: req.user.id,
      coiffeur: coiffeurId,
      service: service.name,
      serviceId,
      slotId: slot ? slot._id : undefined,
      date: bookingDate,
      time,
      duration: resolvedDuration,
      price: resolvedPrice,
      mode,
      address: normalizedAddress,
      notes,
      acceptedTermsAt: termsDate,
      acceptedCancellationPolicyAt: cancellationDate,
      acceptedPaymentConsentAt: paymentConsentDate,
      status: 'pending',
      paymentStatus: 'initiated'
    });

    let slotReserved = false;
    try {
      if (slot) {
        await slot.bookSlot();
        slotReserved = true;
      }
      await booking.save();
    } catch (error) {
      if (slot && slotReserved) {
        try {
          await slot.releaseSlot();
        } catch (releaseError) {
          console.error('Erreur lors de la libération du créneau après échec de réservation:', releaseError);
        }
      }
      throw error;
    }

    await populateBookingDocument(booking);

    // Émettre événement SSE
    const { bookingEventService } = await import('../services/eventService.js');
    bookingEventService.emitBookingCreated(booking);

    try {
      await sendBookingConfirmationEmail({
        email: booking.client.email,
        userName: booking.client.name,
        bookingDate: new Date(booking.date).toLocaleDateString('fr-FR'),
        bookingTime: booking.time,
        serviceName: booking.service
      });
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi de l\'email de confirmation:', emailError);
    }

    res.status(201).json({
      success: true,
      data: booking,
      message: 'Réservation créée avec succès'
    });
  } catch (error) {
    console.error('Create booking error:', error);
    const status = error.status || error.statusCode || 500;
    res.status(status).json({
      success: false,
      message: error.message || 'Erreur lors de la création de la réservation'
    });
  }
});

// Mettre à jour le statut d'une réservation
router.patch('/:id/status', auth, validateBooking, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }

    // Vérifier que l'utilisateur est bien le coiffeur
    if (booking.coiffeur.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const { status } = req.body;
    booking.status = status;
    const updatedBooking = await booking.save();
    res.json(updatedBooking);
  } catch (error) {
    console.error('Update status error:', error);
    res.status(400).json({ message: 'Erreur lors de la mise à jour du statut' });
  }
});

// Mettre à jour le statut de paiement d'une réservation
router.patch('/:id/payment-status', auth, async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !validatePaymentStatus(status)) {
      return res.status(400).json({ message: 'Statut de paiement invalide' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }

    // Seuls le client ou le coiffeur associés peuvent mettre à jour le statut
    if (
      booking.client.toString() !== req.user.id &&
      booking.coiffeur.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    booking.paymentStatus = status;
    booking.updatedAt = new Date();
    await booking.save();

    res.json({ success: true, data: booking });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du statut de paiement' });
  }
});

// ✅ Routes supprimées - déplacées plus haut dans le fichier pour éviter les conflits avec /:id

// Supprimer une réservation

// Mettre à jour le statut de paiement
router.patch('/:id/payment', auth, validateBooking, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }

    // Vérifier que l'utilisateur est bien le coiffeur
    if (booking.coiffeur.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const { paymentStatus } = req.body;
    booking.paymentStatus = paymentStatus;
    const updatedBooking = await booking.save();
    res.json(updatedBooking);
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(400).json({ message: 'Erreur lors de la mise à jour du statut de paiement' });
  }
});

export default router; 