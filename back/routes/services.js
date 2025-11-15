import express from 'express';
import multer from 'multer';
import path from 'path';
import { promises as fsPromises } from 'fs';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { randomUUID } from 'crypto';
import Service from '../models/Service.js';
import { auth } from '../middleware/auth.js';
// photoService removed - simplified photo system

const router = express.Router();

const { mkdir, access, unlink } = fsPromises;

const ensureDirExists = async (dirPath) => {
  try {
    await access(dirPath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await mkdir(dirPath, { recursive: true });
    } else {
      throw error;
    }
  }
};

const slugify = (value) => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'media';
};

const getExtension = (filename) => path.extname(filename || '').toLowerCase();

const buildFileName = (originalName) => {
  const extension = getExtension(originalName);
  const baseName = path.basename(originalName, extension);
  const slug = slugify(baseName);
  return `${slug}-${randomUUID()}${extension}`;
};

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const VIDEO_EXTENSIONS = new Set(['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v']);
const ALLOWED_MEDIA_EXTENSIONS = new Set([...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS]);

const TEMP_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'tmp');

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await ensureDirExists(TEMP_UPLOAD_DIR);
      cb(null, TEMP_UPLOAD_DIR);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const extension = getExtension(file.originalname);
    cb(null, `${randomUUID()}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const extension = getExtension(file.originalname);
    const mimetype = file.mimetype;

    if (!ALLOWED_MEDIA_EXTENSIONS.has(extension)) {
      return cb(new Error("Extension de fichier non autorisée"));
    }

    if (IMAGE_EXTENSIONS.has(extension) && !mimetype.startsWith('image/')) {
      return cb(new Error("Type MIME invalide pour une image"));
    }

    if (VIDEO_EXTENSIONS.has(extension) && !mimetype.startsWith('video/')) {
      return cb(new Error("Type MIME invalide pour une vidéo"));
    }

    cb(null, true);
  }
});

// GET /api/services - Récupérer tous les services
router.get('/', async (req, res) => {
  try {
    const { populate } = req.query;
    
    let query = Service.find({ isActive: true });
    
    // Gérer la population des relations si demandée
    if (populate) {
      const populateFields = populate.split(',');
      populateFields.forEach(field => {
        if (field === 'coiffeur') {
          query = query.populate('coiffeur', 'name rating address photo bio');
        } else if (field === 'specialities.specialtyId') {
          query = query.populate({
            path: 'specialities.specialtyId',
            select: 'name category'
          });
        }
      });
    }
    
    const services = await query.exec();
    
    // Format de réponse cohérent avec le frontend
    res.json({
      success: true,
      data: services,
      count: services.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des services:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
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

// Upload de média (photo ou vidéo) de service
router.post('/:id/media', auth, upload.single('media'), async (req, res) => {
  let tempFilePath;
  let finalFilePath;

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

    tempFilePath = req.file.path;

    const extension = getExtension(req.file.originalname);
    if (!ALLOWED_MEDIA_EXTENSIONS.has(extension)) {
      return res.status(400).json({ success: false, message: 'Extension de fichier non autorisée' });
    }

    const isImage = IMAGE_EXTENSIONS.has(extension);
    const isVideo = VIDEO_EXTENSIONS.has(extension);

    if (isImage && !req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ success: false, message: 'Type MIME invalide pour une image' });
    }

    if (isVideo && !req.file.mimetype.startsWith('video/')) {
      return res.status(400).json({ success: false, message: 'Type MIME invalide pour une vidéo' });
    }

    if (req.file.size > 50 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: 'Fichier trop volumineux (max 50MB)' });
    }

    const uploadDir = path.join(process.cwd(), 'uploads', 'services');
    await ensureDirExists(uploadDir);

    const fileName = buildFileName(req.file.originalname);
    finalFilePath = path.join(uploadDir, fileName);

    await pipeline(createReadStream(tempFilePath), createWriteStream(finalFilePath));

    const relativePath = `/uploads/services/${fileName}`;

    const mediaType = isVideo ? 'video' : 'image';

    const mediaData = {
      mediaUrl: relativePath,
      mediaType,
      caption: '',
      tags: [],
      likes: 0,
      createdAt: new Date()
    };

    if (!service.gallery) {
      service.gallery = [];
    }
    service.gallery.push(mediaData);

    if (!service.examplePhotos) {
      service.examplePhotos = [];
    }
    service.examplePhotos.push(relativePath);

    await service.save();

    res.json({
      success: true,
      message: `${mediaType === 'video' ? 'Vidéo' : 'Photo'} ajoutée au service`,
      media: {
        url: relativePath,
        type: mediaType
      }
    });
  } catch (error) {
    console.error('Upload service media error:', error);

    if (finalFilePath) {
      await unlink(finalFilePath).catch(() => {});
    }

    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'Fichier trop volumineux (max 50MB)' });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Erreur lors de l'upload"
    });
  } finally {
    if (tempFilePath) {
      await unlink(tempFilePath).catch(() => {});
    }
  }
});


// Route de compatibilité pour les photos (ancienne route)
router.post('/:id/photo', auth, upload.single('photo'), async (req, res) => {
  // Rediriger vers la nouvelle route media
  req.file = req.file; // Le fichier est déjà dans req.file
  return router.handle({ ...req, url: `/${req.params.id}/media` }, res);
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

// Récupérer les services likés par l'utilisateur
router.get('/user/liked', auth, async (req, res) => {
  try {
    console.log('🔍 [Services API] Get user liked services:', {
      userId: req.user?.id,
      user: req.user
    });

    const userId = req.user.id;
    
    if (!userId) {
      console.error('❌ User ID not found in request');
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }

    // Trouver tous les services likés par l'utilisateur
    const likedServices = await Service.find({
      likedBy: userId,
      isActive: true
    }).populate('coiffeur', 'name rating address photo bio');

    console.log('✅ [Services API] User liked services found:', likedServices.length);

    res.json({
      success: true,
      data: likedServices,
      message: 'Services likés récupérés'
    });
  } catch (error) {
    console.error('❌ [Services API] Get user liked services error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la récupération des likes',
      error: error.message
    });
  }
});

// Toggle like sur un service - UTILISE LES MÉTHODES DU MODÈLE
router.post('/:serviceId/like', auth, async (req, res) => {
  console.log('🚀 [Services API] Route hit - POST /:serviceId/like');
  try {
    console.log('🔍 [Services API] Like request:', {
      serviceId: req.params.serviceId,
      userId: req.user?.id,
      user: req.user
    });

    const { serviceId } = req.params;
    const userId = req.user.id;
    
    if (!userId) {
      console.error('❌ User ID not found in request');
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }
    
    console.log('🔍 [Services API] Finding service:', serviceId);
    const service = await Service.findById(serviceId);
    if (!service) {
      console.error('❌ Service not found:', serviceId);
      return res.status(404).json({ message: 'Service introuvable' });
    }

    console.log('🔍 [Services API] Service found:', {
      id: service._id,
      name: service.name,
      currentLikes: service.likes,
      likedBy: service.likedBy?.length || 0
    });

    // Utiliser les méthodes du modèle
    const userLiked = service.isLikedBy(userId);
    console.log('💖 [Services API] User liked status:', userLiked);
    
    if (userLiked) {
      // Unlike - Utilise la méthode du modèle
      console.log('👎 [Services API] Removing like...');
      await service.removeLike(userId);
    } else {
      // Like - Utilise la méthode du modèle
      console.log('👍 [Services API] Adding like...');
      await service.addLike(userId);
    }

    console.log('✅ [Services API] Like operation completed:', {
      newLikes: service.likes,
      newIsLiked: !userLiked
    });

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
    console.error('❌ [Services API] Toggle service like error:', error);
    console.error('❌ [Services API] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors du like/unlike',
      error: error.message
    });
  }
});

export default router; 