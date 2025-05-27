import express from 'express';
import Booking from '../models/Booking.js';
import auth from '../middleware/auth.js';
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
      .populate('service', 'name price duration')
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
    const bookings = await Booking.find({ coiffeur: req.user.id })
      .populate('client', 'name photo')
      .populate('service', 'name price duration')
      .sort({ date: -1 });
    res.json(bookings);
  } catch (error) {
    console.error('Get coiffeur bookings error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des réservations' });
  }
});

// Récupérer une réservation par ID
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('client', 'name photo')
      .populate('coiffeur', 'name photo rating')
      .populate('service', 'name price duration');

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

// Créer une nouvelle réservation
router.post('/', auth, validateBooking, async (req, res) => {
  try {
    const { coiffeur, service, date, address, notes } = req.body;

    // Vérifier que l'utilisateur est bien le client
    if (req.user.role !== 'client') {
      return res.status(403).json({ message: 'Seuls les clients peuvent créer des réservations' });
    }

    const booking = new Booking({
      client: req.user.id,
      coiffeur,
      service,
      date,
      address,
      notes,
      status: 'pending',
      paymentStatus: 'pending'
    });

    const savedBooking = await booking.save();
    const populatedBooking = await Booking.findById(savedBooking._id)
      .populate('client', 'name photo')
      .populate('coiffeur', 'name photo rating')
      .populate('service', 'name price duration');

    res.status(201).json(populatedBooking);
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(400).json({ message: 'Erreur lors de la création de la réservation' });
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
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }

    // Vérifier que l'utilisateur est bien le client ou le coiffeur
    if (booking.client.toString() !== req.user.id && 
        booking.coiffeur.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Vérifier le délai d'annulation (24h avant)
    const bookingDate = new Date(booking.date);
    const now = new Date();
    const hoursUntilBooking = (bookingDate - now) / (1000 * 60 * 60);

    if (hoursUntilBooking < 24) {
      return res.status(400).json({ 
        message: 'Impossible d\'annuler une réservation moins de 24h avant' 
      });
    }

    booking.status = 'cancelled';
    const updatedBooking = await booking.save();
    res.json(updatedBooking);
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(400).json({ message: 'Erreur lors de l\'annulation de la réservation' });
  }
});

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