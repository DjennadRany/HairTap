import express from 'express';
import Booking from '../models/Booking.js';
import { auth } from '../middleware/auth.js';
import { validateBooking } from '../middleware/validate.js';

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
    console.log('🔧 Données reçues pour réservation:', req.body);
    
    const {
      coiffeur,
      service,
      date,
      duration,
      price,
      mode,
      address,
      notes
    } = req.body;

    // Validation des données requises
    if (!coiffeur || !service || !date || !duration || !price || !mode) {
      console.log('❌ Données manquantes:', { coiffeur, service, date, duration, price, mode });
      return res.status(400).json({ 
        success: false,
        message: 'Données manquantes pour créer la réservation' 
      });
    }

    // VALIDATION DISPONIBILITÉ - CORRIGÉE
    const bookingDate = new Date(date);
    const endTime = new Date(bookingDate.getTime() + duration * 60000);
    
    console.log('🔍 Vérification disponibilité:', {
      coiffeur,
      bookingDate: bookingDate.toISOString(),
      endTime: endTime.toISOString(),
      duration
    });
    
    // Vérifier les conflits de réservation (version ultra-simple)
    const conflictingBookings = await Booking.find({
      coiffeur,
      status: { $nin: ['cancelled', 'completed'] },
      date: bookingDate
    });

    // Afficher toutes les réservations existantes pour ce coiffeur
    const allBookings = await Booking.find({
      coiffeur,
      status: { $nin: ['cancelled', 'completed'] }
    }).sort({ date: 1 });
    
    console.log('📊 Toutes les réservations existantes pour ce coiffeur:', allBookings.map(b => ({
      date: b.date.toISOString(),
      service: b.service,
      duration: b.duration,
      status: b.status
    })));
    
    console.log('🔍 Réservations conflictuelles trouvées:', conflictingBookings.length);
    if (conflictingBookings.length > 0) {
      console.log('📅 Créneaux conflictuels:', conflictingBookings.map(b => ({
        date: b.date.toISOString(),
        service: b.service,
        duration: b.duration
      })));
    }

    if (conflictingBookings.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Créneau non disponible, veuillez choisir un autre horaire'
      });
    }

    // Créer la réservation
    console.log('🔧 Création de la réservation avec:', {
      client: req.user.id,
      coiffeur,
      service,
      date: bookingDate,
      duration,
      price,
      mode,
      address,
      notes
    });
    
    const booking = new Booking({
      client: req.user.id,
      coiffeur,
      service,
      date: bookingDate,
      duration,
      price,
      mode,
      address,
      notes,
      status: 'pending',
      paymentStatus: 'pending'
    });

    console.log('✅ Réservation créée, sauvegarde...');
    await booking.save();
    console.log('✅ Réservation sauvegardée avec succès');
    
    // Populate les références pour la réponse
    await booking.populate('client', 'name email');
    await booking.populate('coiffeur', 'name email');

    // Réponse standardisée
    res.status(201).json({
      success: true,
      data: booking,
      message: 'Réservation créée avec succès'
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la création de la réservation'
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