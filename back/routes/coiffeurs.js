import express from 'express';
import User from '../models/User.js';
import Service from '../models/Service.js';
import { auth } from '../middleware/auth.js';
import mongoose from 'mongoose';
import multer from 'multer';
// photoService removed - simplified photo system

const router = express.Router();

// Configuration multer pour l'upload de fichiers
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    // Vérification du type MIME
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers image sont autorisés'), false);
    }
  }
});

// Middleware de gestion d'erreur pour multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false, 
        message: 'Fichier trop volumineux. Taille maximum : 5MB.' 
      });
    }
  }
  if (error.message.includes('Seuls les fichiers image')) {
    return res.status(400).json({ 
      success: false, 
      message: 'Type de fichier non autorisé. Utilisez JPEG, PNG ou WebP.' 
    });
  }
  next(error);
};

// Récupérer les coiffeurs favoris d'un utilisateur
router.post('/favorites', auth, async (req, res) => {
  try {
    const { coiffeurIds } = req.body;
    
    if (!coiffeurIds || !Array.isArray(coiffeurIds)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Liste des IDs de coiffeurs requise' 
      });
    }

    const coiffeurs = await User.find({
      _id: { $in: coiffeurIds },
      role: 'coiffeur'
    }).select('-password');

    res.json({
      success: true,
      coiffeurs
    });
  } catch (error) {
    console.error('Get favorites coiffeurs error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des coiffeurs favoris' 
    });
  }
});

// Upload de photo de profil pour un coiffeur
router.post('/:id/photo', auth, upload.single('photo'), handleUploadError, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier que le coiffeur existe
    const coiffeur = await User.findById(id);
    if (!coiffeur) {
      return res.status(404).json({ 
        success: false, 
        message: 'Coiffeur non trouvé' 
      });
    }

    // Vérifier que l'utilisateur est autorisé à modifier ce profil
    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Non autorisé' 
      });
    }

    // Vérifier qu'un fichier a été fourni
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Aucun fichier fourni' 
      });
    }

    // Upload de la nouvelle photo - SIMPLIFIÉ
    const fileName = `coiffeur-${id}-${Date.now()}-${Math.random().toString(36).substring(2)}.${req.file.originalname.split('.').pop()}`;
    const filePath = `uploads/profiles/${fileName}`;

    // Sauvegarder le fichier
    const fs = await import('fs');
    const path = await import('path');
    
    const uploadDir = path.join(process.cwd(), 'uploads', 'profiles');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    fs.writeFileSync(path.join(uploadDir, fileName), req.file.buffer);

    // Mettre à jour le coiffeur
    await User.findByIdAndUpdate(id, { 
      photo: `/${filePath}` 
    });

    res.json({
      success: true,
      message: 'Photo mise à jour',
      photo: `/${filePath}`
    });
  } catch (error) {
    console.error('Upload coiffeur photo error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Erreur lors de l\'upload' 
    });
  }
});

// Récupérer tous les coiffeurs
router.get('/', async (req, res) => {
  try {
    const { service, speciality, priceRange, city, date } = req.query;
    let query = { role: 'coiffeur' };

    // Filtres de recherche
    if (service) {
      // Rechercher dans les services des coiffeurs
      const servicesWithName = await Service.find({
        name: { $regex: service, $options: 'i' },
        isActive: true
      }).distinct('coiffeur');
      
      if (servicesWithName.length > 0) {
        query._id = { $in: servicesWithName };
      } else {
        // Si aucun service trouvé, retourner un tableau vide
        return res.json({
          success: true,
          data: [],
          count: 0
        });
      }
    }
    
    if (speciality) {
      query.specialities = { $in: Array.isArray(speciality) ? speciality : [speciality] };
    }
    
    if (city) {
      query['address.city'] = { $regex: city, $options: 'i' };
    }

    const coiffeurs = await User.find(query)
      .select('-password')
      .sort({ rating: -1, totalRatings: -1 }); // Trier par note et nombre d'avis

    // Format de réponse cohérent
    res.json({
      success: true,
      data: coiffeurs,
      count: coiffeurs.length
    });
  } catch (error) {
    console.error('Get coiffeurs error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la récupération des coiffeurs' 
    });
  }
});

// Récupérer un coiffeur par ID
router.get('/:id', async (req, res) => {
  try {
    const coiffeur = await User.findById(req.params.id)
      .select('-password');

    if (!coiffeur || coiffeur.role !== 'coiffeur') {
      return res.status(404).json({ message: 'Coiffeur non trouvé' });
    }

    res.json(coiffeur);
  } catch (error) {
    console.error('Get coiffeur error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du coiffeur' });
  }
});

// Mettre à jour un coiffeur
router.patch('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const coiffeur = await User.findById(id);
    if (!coiffeur || coiffeur.role !== 'coiffeur') {
      return res.status(404).json({ message: 'Coiffeur non trouvé' });
    }

    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Protection des champs sensibles
    delete updateData.password;
    delete updateData.role;
    delete updateData.googleId;

    const updatedCoiffeur = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    res.json(updatedCoiffeur);
  } catch (error) {
    console.error('Update coiffeur error:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du coiffeur' });
  }
});

// Récupérer les services d'un coiffeur
router.get('/:id/services', async (req, res) => {
  try {
    const { id } = req.params;
    
    const coiffeur = await User.findById(id);
    if (!coiffeur || coiffeur.role !== 'coiffeur') {
      return res.status(404).json({ message: 'Coiffeur non trouvé' });
    }

    const services = await Service.find({ 
      coiffeur: id, 
      isActive: true 
    });

    res.json(services);
  } catch (error) {
    console.error('Get coiffeur services error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des services' });
  }
});

// Ajouter un service à un coiffeur
router.post('/:coiffeurId/services', auth, async (req, res) => {
  try {
    const { coiffeurId } = req.params;
    const serviceData = req.body;
    
    // Vérifier que le coiffeur existe
    const coiffeur = await User.findById(coiffeurId);
    if (!coiffeur || coiffeur.role !== 'coiffeur') {
      return res.status(404).json({ message: 'Coiffeur non trouvé' });
    }

    // Vérifier que l'utilisateur est autorisé
    if (req.user._id.toString() !== coiffeurId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Créer le nouveau service
    const newService = new Service({
      ...serviceData,
      coiffeur: coiffeurId,
      isActive: true
    });

    await newService.save();

    res.status(201).json(newService);
  } catch (error) {
    console.error('Add service error:', error);
    res.status(500).json({ message: 'Erreur lors de l\'ajout du service' });
  }
});

// Mettre à jour un service d'un coiffeur
router.put('/:coiffeurId/services/:serviceId', auth, async (req, res) => {
  try {
    const { coiffeurId, serviceId } = req.params;
    const updateData = req.body;
    
    // Vérifier que le service existe et appartient au coiffeur
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service introuvable' });
    }

    if (service.coiffeur.toString() !== coiffeurId) {
      return res.status(400).json({ message: 'Service ne correspond pas au coiffeur' });
    }

    // Vérifier que l'utilisateur est autorisé
    if (req.user._id.toString() !== coiffeurId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Mettre à jour le service
    const updatedService = await Service.findByIdAndUpdate(
      serviceId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json(updatedService);
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du service' });
  }
});

// Supprimer un service d'un coiffeur
router.delete('/:coiffeurId/services/:serviceId', auth, async (req, res) => {
  try {
    const { coiffeurId, serviceId } = req.params;
    
    // Vérifier que le service existe et appartient au coiffeur
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service introuvable' });
    }

    if (service.coiffeur.toString() !== coiffeurId) {
      return res.status(400).json({ message: 'Service ne correspond pas au coiffeur' });
    }

    // Vérifier que l'utilisateur est autorisé
    if (req.user._id.toString() !== coiffeurId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Supprimer le service
    await Service.findByIdAndDelete(serviceId);

    res.json({ message: 'Service supprimé avec succès' });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression du service' });
  }
});

// Toggle like sur un service - UTILISE LES MÉTHODES DU MODÈLE
router.post('/:coiffeurId/services/:serviceId/like', auth, async (req, res) => {
  try {
    const { coiffeurId, serviceId } = req.params;
    const userId = req.user._id;
    
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service introuvable' });
    }

    if (service.coiffeur.toString() !== coiffeurId) {
      return res.status(400).json({ message: 'Service ne correspond pas au coiffeur' });
    }

    // Utiliser les méthodes du modèle
    const userLiked = service.isLikedBy(userId);
    
    if (userLiked) {
      // Unlike - Utilise la méthode du modèle
      await service.removeLike(userId);
    } else {
      // Like - Utilise la méthode du modèle
      await service.addLike(userId);
    }

    // Réponse standardisée
    res.json({
      success: true,
      data: {
        likes: service.likes,
        isLiked: !userLiked
      },
      message: userLiked ? 'Like retiré' : 'Service liké'
    });
  } catch (error) {
    console.error('Toggle service like error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors du like/unlike' 
    });
  }
});

// Récupérer les statistiques de likes d'un coiffeur
router.get('/:id/likes-stats', async (req, res) => {
  try {
    const { id } = req.params;
    
    const coiffeur = await User.findById(id);
    if (!coiffeur || coiffeur.role !== 'coiffeur') {
      return res.status(404).json({ message: 'Coiffeur non trouvé' });
    }

    // Récupérer tous les services du coiffeur
    const services = await Service.find({ 
      coiffeur: id, 
      isActive: true 
    });

    // Calculer les statistiques de likes
    const totalLikes = services.reduce((sum, service) => sum + (service.likes || 0), 0);
    const totalServices = services.length;
    const averageLikes = totalServices > 0 ? (totalLikes / totalServices).toFixed(1) : 0;

    res.json({
      totalLikes,
      totalServices,
      averageLikes,
      services: services.map(service => ({
        _id: service._id,
        name: service.name,
        likes: service.likes || 0
      }))
    });
  } catch (error) {
    console.error('Get likes stats error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des statistiques de likes' });
  }
});

export default router; 