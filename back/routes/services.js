import express from 'express';
import Service from '../models/Service.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// GET /api/services - Récupérer tous les services
router.get('/', async (req, res) => {
  try {
    const services = await Service.find({ isActive: true });
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/services/:id - Récupérer un service spécifique
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service non trouvé' });
    }
    res.json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/services - Créer un nouveau service (coiffeur uniquement)
router.post('/', auth, async (req, res) => {
  try {
    const service = new Service({
      ...req.body,
      coiffeur: req.user.id
    });
    const newService = await service.save();
    res.status(201).json(newService);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PATCH /api/services/:id - Mettre à jour un service (coiffeur uniquement)
router.patch('/:id', auth, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service non trouvé' });
    }
    if (service.coiffeur.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }
    Object.assign(service, req.body);
    const updatedService = await service.save();
    res.json(updatedService);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/services/:id - Supprimer un service (coiffeur uniquement)
router.delete('/:id', auth, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service non trouvé' });
    }
    if (service.coiffeur.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }
    await service.remove();
    res.json({ message: 'Service supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/services/category/:category - Récupérer les services par catégorie
router.get('/category/:category', async (req, res) => {
  try {
    const services = await Service.find({
      category: req.params.category,
      isActive: true
    });
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/services/coiffeur/:coiffeurId - Récupérer les services d'un coiffeur
router.get('/coiffeur/:coiffeurId', async (req, res) => {
  try {
    const services = await Service.find({
      coiffeur: req.params.coiffeurId,
      isActive: true
    });
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Toggle like sur un service
router.post('/:serviceId/like', auth, async (req, res) => {
  try {
    const service = await Service.findById(req.params.serviceId);
    
    if (!service) {
      return res.status(404).json({ message: 'Service introuvable' });
    }

    // Vérifier si l'utilisateur a déjà liké ce service
    const userLiked = service.likedBy && service.likedBy.includes(req.user.id);
    
    if (userLiked) {
      // Unlike
      service.likes = Math.max(0, service.likes - 1);
      service.likedBy = service.likedBy.filter(id => id !== req.user.id);
    } else {
      // Like
      service.likes = service.likes + 1;
      if (!service.likedBy) service.likedBy = [];
      service.likedBy.push(req.user.id);
    }

    await service.save();
    
    res.json({ 
      likes: service.likes, 
      isLiked: !userLiked 
    });
  } catch (error) {
    console.error('Toggle service like error:', error);
    res.status(500).json({ message: 'Erreur lors du like/unlike' });
  }
});

export default router; 