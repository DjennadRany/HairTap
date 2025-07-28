import express from 'express';
import User from '../models/User.js';
import Service from '../models/Service.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Récupérer tous les coiffeurs
router.get('/', async (req, res) => {
  try {
    const coiffeurs = await User.find({ role: 'coiffeur' }).select('-password');
    res.json(coiffeurs);
  } catch (error) {
    console.error('Get coiffeurs error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des coiffeurs' });
  }
});

// Récupérer un coiffeur par ID
router.get('/:id', async (req, res) => {
  try {
    const coiffeur = await User.findById(req.params.id).select('-password');
    if (!coiffeur) {
      return res.status(404).json({ message: 'Coiffeur introuvable' });
    }
    res.json(coiffeur);
  } catch (error) {
    console.error('Get coiffeur error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du coiffeur' });
  }
});

// Récupérer les services d'un coiffeur
router.get('/:id/services', async (req, res) => {
  try {
    const services = await Service.find({
      coiffeur: req.params.id,
      isActive: true
    }).sort({ createdAt: -1 });

    res.json(services);
  } catch (error) {
    console.error('Get coiffeur services error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des services' });
  }
});

// Ajouter un service pour un coiffeur
router.post('/:id/services', auth, async (req, res) => {
  try {
    const { name, description, duration, price, category, keywords, examplePhotos } = req.body;

    if (!name || !description || !duration || !price || !category) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }

    const newService = new Service({
      name,
      description,
      duration: parseInt(duration),
      price: parseFloat(price),
      category,
      keywords: keywords || [],
      examplePhotos: examplePhotos || [],
      coiffeur: req.params.id,
      isActive: true,
      likes: 0
    });

    const savedService = await newService.save();
    res.status(201).json(savedService);
  } catch (error) {
    console.error('Add service error:', error);
    res.status(500).json({ message: 'Erreur lors de l\'ajout du service' });
  }
});

// Modifier un service
router.put('/:id/services/:serviceId', auth, async (req, res) => {
  try {
    const { name, description, duration, price, category, keywords, examplePhotos } = req.body;

    if (!name || !description || !duration || !price || !category) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }

    const service = await Service.findOne({
      _id: req.params.serviceId,
      coiffeur: req.params.id
    });

    if (!service) {
      return res.status(404).json({ message: 'Service introuvable' });
    }

    service.name = name;
    service.description = description;
    service.duration = parseInt(duration);
    service.price = parseFloat(price);
    service.category = category;
    service.keywords = keywords || [];
    service.examplePhotos = examplePhotos || [];

    const updatedService = await service.save();
    res.json(updatedService);
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ message: 'Erreur lors de la modification du service' });
  }
});

// Supprimer un service
router.delete('/:id/services/:serviceId', auth, async (req, res) => {
  try {
    const service = await Service.findOne({
      _id: req.params.serviceId,
      coiffeur: req.params.id
    });

    if (!service) {
      return res.status(404).json({ message: 'Service introuvable' });
    }

    await Service.findByIdAndDelete(req.params.serviceId);
    res.json({ message: 'Service supprimé avec succès' });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression du service' });
  }
});

// Toggle like sur un service
router.post('/:id/services/:serviceId/like', auth, async (req, res) => {
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

// Synchroniser les images des services avec la galerie
router.post('/:id/sync-gallery', auth, async (req, res) => {
  try {
    const coiffeur = await User.findById(req.params.id);
    if (!coiffeur) {
      return res.status(404).json({ message: 'Coiffeur introuvable' });
    }

    // Vérifier que l'utilisateur est le coiffeur
    if (coiffeur._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Récupérer tous les services du coiffeur
    const services = await Service.find({ coiffeur: req.params.id, isActive: true });
    
    // Extraire toutes les images des services
    const serviceImages = [];
    services.forEach(service => {
      if (service.examplePhotos && service.examplePhotos.length > 0) {
        service.examplePhotos.forEach(photo => {
          serviceImages.push({
            url: photo,
            description: `Photo d'exemple - ${service.name}`,
            isVerified: true,
            source: 'service',
            serviceId: service._id
          });
        });
      }
    });

    // Mettre à jour la galerie du coiffeur
    coiffeur.gallery = serviceImages;
    await coiffeur.save();

    res.json({ 
      message: 'Galerie synchronisée', 
      galleryCount: serviceImages.length 
    });
  } catch (error) {
    console.error('Sync gallery error:', error);
    res.status(500).json({ message: 'Erreur lors de la synchronisation de la galerie' });
  }
});

export default router; 