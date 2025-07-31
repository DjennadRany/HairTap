import express from 'express';
import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Créer un avis
router.post('/', auth, async (req, res) => {
  try {
    const { coiffeurId, bookingId, rating, comment } = req.body;

    // Vérifier que la réservation existe et appartient au client
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Réservation introuvable' });
    }

    if (booking.client.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({ message: 'Seules les prestations terminées peuvent être évaluées' });
    }

    // Vérifier qu'un avis n'existe pas déjà pour cette réservation
    const existingReview = await Review.findOne({ booking: bookingId });
    if (existingReview) {
      return res.status(400).json({ message: 'Un avis existe déjà pour cette réservation' });
    }

    const review = new Review({
      client: req.user.id,
      coiffeur: coiffeurId,
      booking: bookingId,
      rating,
      comment
    });

    await review.save();
    
    // Populate les références pour la réponse
    await review.populate('client', 'name');
    await review.populate('coiffeur', 'name');

    res.status(201).json(review);
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Erreur lors de la création de l\'avis' });
  }
});

// Récupérer les avis d'un coiffeur
router.get('/coiffeur/:coiffeurId', async (req, res) => {
  try {
    const reviews = await Review.find({ coiffeur: req.params.coiffeurId })
      .populate('client', 'name photo')
      .populate('booking', 'service date')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    console.error('Get coiffeur reviews error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des avis' });
  }
});

// Récupérer les avis d'un client
router.get('/client', auth, async (req, res) => {
  try {
    const reviews = await Review.find({ client: req.user.id })
      .populate('coiffeur', 'name photo')
      .populate('booking', 'service date')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    console.error('Get client reviews error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des avis' });
  }
});

// Vérifier si un avis existe pour une réservation
router.get('/booking/:bookingId', auth, async (req, res) => {
  try {
    const review = await Review.findOne({ 
      booking: req.params.bookingId,
      client: req.user.id
    });

    res.json({ exists: !!review, review });
  } catch (error) {
    console.error('Check review exists error:', error);
    res.status(500).json({ message: 'Erreur lors de la vérification' });
  }
});

// Supprimer un avis (seulement par le client qui l'a créé)
router.delete('/:reviewId', auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Avis introuvable' });
    }

    if (review.client.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    await review.deleteOne();
    res.json({ message: 'Avis supprimé' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'avis' });
  }
});

export default router; 