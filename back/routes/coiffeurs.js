import express from 'express';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import auth from '../middleware/auth.js';
import { validateCoiffeur, validateFile } from '../middleware/validate.js';

const router = express.Router();

// Récupérer tous les coiffeurs avec filtres
router.get('/', async (req, res) => {
  try {
    const { city, speciality, priceRange, date } = req.query;
    const query = { role: 'coiffeur' };

    if (city) {
      query['address.city'] = new RegExp(city, 'i');
    }

    if (speciality) {
      const specialities = Array.isArray(speciality) ? speciality : [speciality];
      query.speciality = { $in: specialities };
    }

    if (priceRange) {
      const ranges = Array.isArray(priceRange) ? priceRange : [priceRange];
      query.priceRange = { $in: ranges };
    }

    // Si une date est spécifiée, vérifier les disponibilités
    if (date) {
      const searchDate = new Date(date);
      const dayOfWeek = searchDate.toLocaleLowerCase();
      query[`workingHours.${dayOfWeek}.start`] = { $exists: true, $ne: '' };
    }

    const coiffeurs = await User.find(query)
      .select('-password')
      .sort({ rating: -1 });
    res.json(coiffeurs);
  } catch (error) {
    console.error('Get all coiffeurs error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des coiffeurs' });
  }
});

// Récupérer un coiffeur par ID
router.get('/:id', async (req, res) => {
  try {
    const coiffeur = await User.findById(req.params.id)
      .select('-password')
      .populate('services');
    
    if (!coiffeur) {
      return res.status(404).json({ message: 'Coiffeur non trouvé' });
    }

    res.json(coiffeur);
  } catch (error) {
    console.error('Get coiffeur error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du coiffeur' });
  }
});

// Récupérer les coiffeurs favoris
router.post('/favorites', auth, async (req, res) => {
  try {
    const { coiffeurIds } = req.body;
    if (!Array.isArray(coiffeurIds)) {
      return res.status(400).json({ message: 'Liste de coiffeurs invalide' });
    }

    const coiffeurs = await User.find({
      _id: { $in: coiffeurIds }
    }).select('-password');

    res.json(coiffeurs);
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des coiffeurs favoris' });
  }
});

// Prochains rendez-vous (dashboard coiffeur)
router.get('/:id/bookings/upcoming', auth, async (req, res) => {
  try {
    const now = new Date();
    const bookings = await Booking.find({
      coiffeurId: req.params.id,
      date: { $gte: now },
      status: { $in: ['pending', 'confirmed'] }
    }).sort({ date: 1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Statistiques dashboard coiffeur
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const coiffeurId = req.params.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const bookings = await Booking.find({ coiffeurId });
    const revenue = bookings
      .filter(b => b.status === 'confirmed' && b.date >= startOfMonth)
      .reduce((acc, b) => acc + (b.price || 0), 0);
    
    const clients = new Set(
      bookings
        .filter(b => b.date >= startOfMonth)
        .map(b => String(b.clientId))
    ).size;
    
    const rating = 4.8; // TODO: Implémenter le calcul réel des notes
    const upcoming = bookings.filter(b => b.status === 'confirmed' && b.date >= now).length;
    
    res.json({ revenue, clients, rating, upcoming });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mettre à jour le profil d'un coiffeur
router.patch('/:id', auth, validateCoiffeur, async (req, res) => {
  try {
    const coiffeur = await User.findById(req.params.id);
    if (!coiffeur) {
      return res.status(404).json({ message: 'Coiffeur non trouvé' });
    }

    // Vérifier que le coiffeur est bien celui qui fait la requête
    if (coiffeur._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const updates = req.body;
    Object.keys(updates).forEach(key => {
      if (key !== 'password' && key !== '_id' && key !== 'role') {
        coiffeur[key] = updates[key];
      }
    });

    const updatedCoiffeur = await coiffeur.save();
    res.json(updatedCoiffeur);
  } catch (error) {
    console.error('Update coiffeur error:', error);
    res.status(400).json({ message: 'Erreur lors de la mise à jour du coiffeur' });
  }
});

// Mettre à jour la photo de profil
router.post('/:id/photo', auth, validateFile, async (req, res) => {
  try {
    const coiffeur = await User.findById(req.params.id);
    if (!coiffeur) {
      return res.status(404).json({ message: 'Coiffeur non trouvé' });
    }

    // Vérifier que le coiffeur est bien celui qui fait la requête
    if (coiffeur._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    coiffeur.photo = req.file.path;
    const updatedCoiffeur = await coiffeur.save();
    res.json(updatedCoiffeur);
  } catch (error) {
    console.error('Update photo error:', error);
    res.status(400).json({ message: 'Erreur lors de la mise à jour de la photo' });
  }
});

// Mettre à jour les disponibilités
router.patch('/:id/availability', auth, async (req, res) => {
  try {
    const coiffeur = await User.findById(req.params.id);
    if (!coiffeur) {
      return res.status(404).json({ message: 'Coiffeur non trouvé' });
    }

    // Vérifier que le coiffeur est bien celui qui fait la requête
    if (coiffeur._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const { availability } = req.body;
    if (!availability || typeof availability !== 'object') {
      return res.status(400).json({ message: 'Disponibilités invalides' });
    }

    coiffeur.availability = availability;
    const updatedCoiffeur = await coiffeur.save();
    res.json(updatedCoiffeur);
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(400).json({ message: 'Erreur lors de la mise à jour des disponibilités' });
  }
});

// Mettre à jour les services
router.patch('/:id/services', auth, validateCoiffeur, async (req, res) => {
  try {
    const coiffeur = await User.findById(req.params.id);
    if (!coiffeur) {
      return res.status(404).json({ message: 'Coiffeur non trouvé' });
    }

    // Vérifier que le coiffeur est bien celui qui fait la requête
    if (coiffeur._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const { services } = req.body;
    if (!Array.isArray(services)) {
      return res.status(400).json({ message: 'Liste de services invalide' });
    }

    coiffeur.services = services;
    const updatedCoiffeur = await coiffeur.save();
    res.json(updatedCoiffeur);
  } catch (error) {
    console.error('Update services error:', error);
    res.status(400).json({ message: 'Erreur lors de la mise à jour des services' });
  }
});

export default router; 