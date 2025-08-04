import express from 'express';
import multer from 'multer';
import Service from '../models/Service.js';
import { auth } from '../middleware/auth.js';
// photoService removed - simplified photo system

const router = express.Router();

// Configuration multer simple
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers image sont autorisés'), false);
    }
  }
});

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

// Upload de photo de service - SIMPLIFIÉ
router.post('/:id/photo', auth, upload.single('photo'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service non trouvé' });
    }

    if (service.coiffeur.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Aucun fichier fourni' });
    }

    // Upload de la nouvelle photo - SIMPLIFIÉ
    const fileName = `service-${id}-${Date.now()}-${Math.random().toString(36).substring(2)}.${req.file.originalname.split('.').pop()}`;
    const filePath = `uploads/services/${fileName}`;

    // Sauvegarder le fichier
    const fs = await import('fs');
    const path = await import('path');
    
    const uploadDir = path.join(process.cwd(), 'uploads', 'services');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    fs.writeFileSync(path.join(uploadDir, fileName), req.file.buffer);

    // Ajouter la photo au service
    if (!service.examplePhotos) {
      service.examplePhotos = [];
    }
    service.examplePhotos.push(`/${filePath}`);
    await service.save();

    res.json({
      success: true,
      message: 'Photo ajoutée au service',
      photo: { url: uploadResult.url }
    });
  } catch (error) {
    console.error('Upload service photo error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Erreur lors de l\'upload' 
    });
  }
});

// Supprimer une photo de service
router.delete('/:id/photo/:photoUrl', auth, async (req, res) => {
  try {
    const { id, photoUrl } = req.params;
    
    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service non trouvé' });
    }

    if (service.coiffeur.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    // Supprimer la photo du serveur - SIMPLIFIÉ
    // Note: Pour l'instant, on ne supprime pas physiquement le fichier
    // pour éviter les erreurs. On peut l'implémenter plus tard si nécessaire.

    // Retirer la photo du service
    service.examplePhotos = service.examplePhotos.filter(
      photo => photo !== decodeURIComponent(photoUrl)
    );
    await service.save();

    res.json({
      success: true,
      message: 'Photo supprimée du service'
    });
  } catch (error) {
    console.error('Delete service photo error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Erreur lors de la suppression' 
    });
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

// Toggle like sur un service - UTILISE LES MÉTHODES DU MODÈLE
router.post('/:serviceId/like', auth, async (req, res) => {
  try {
    const { serviceId } = req.params;
    const userId = req.user.id;
    
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service introuvable' });
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

export default router; 