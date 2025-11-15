import express from 'express';
import Booking from '../models/Booking.js';
import WorkingSlot from '../models/WorkingSlot.js';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import { validateBooking } from '../middleware/validate.js';
import { fetchServiceForBooking } from '../services/slotService.js';

const router = express.Router();

// Récupérer toutes les réservations d'un client
router.get('/client', auth, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      console.error('Token JWT manquant ou invalide dans /api/bookings/client');
      return res.status(401).json({ message: 'Non authentifié' });
    }
    const bookings = await Booking.find({ client: req.user.id })
      .populate('coiffeur', 'name photo rating')
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
    console.log('DEBUG /api/bookings/coiffeur req.user:', req.user);
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Non authentifié (coiffeur)' });
    }
    const bookings = await Booking.find({ coiffeur: req.user.id })
      .populate('client', 'name photo')
      .sort({ date: -1 });
    res.json(bookings);
  } catch (error) {
    console.error('Get coiffeur bookings error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des réservations', error: error.message });
  }
});

// Récupérer toutes les réservations d'un coiffeur spécifique
router.get('/coiffeur/:coiffeurId', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ coiffeur: req.params.coiffeurId })
      .populate('client', 'name photo')
      .sort({ date: -1 });
    res.json(bookings);
  } catch (error) {
    console.error('Get coiffeur bookings error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des réservations', error: error.message });
  }
});

// Récupérer une réservation par ID
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('client', 'name photo')
      .populate('coiffeur', 'name photo rating');

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
      notes
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

    const bookingDate = new Date(`${date}T${time}`);
    if (Number.isNaN(bookingDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Format de date ou d\'heure invalide' });
    }

    const coiffeur = await User.findById(coiffeurId).select('role workingMode name');
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

    const normalizedAddress = mode === 'domicile' && address ? {
      street: address.street,
      streetNumber: address.streetNumber,
      city: address.city,
      postalCode: address.postalCode,
      floor: address.floor,
      apartment: address.apartment,
      buildingCode: address.buildingCode,
      additionalInfo: address.additionalInfo
    } : undefined;

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
      status: 'pending',
      paymentStatus: 'pending'
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

    await booking.populate('client', 'name email');
    await booking.populate('coiffeur', 'name email');

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

// Confirmer une réservation
router.post('/:id/confirm', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Réservation introuvable' });
    }

    // Vérifier que l'utilisateur est le coiffeur
    if (booking.coiffeur.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Seuls les coiffeurs peuvent confirmer les réservations' });
    }

    booking.status = 'confirmed';
    booking.updatedAt = new Date();
    await booking.save();

    res.json(booking);
  } catch (error) {
    console.error('Confirm booking error:', error);
    res.status(500).json({ message: 'Erreur lors de la confirmation de la réservation' });
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

    booking.status = 'completed';
    booking.updatedAt = new Date();
    await booking.save();

    res.json(booking);
  } catch (error) {
    console.error('Complete booking error:', error);
    res.status(500).json({ message: 'Erreur lors de la finalisation de la réservation' });
  }
});

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