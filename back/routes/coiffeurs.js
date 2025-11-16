import express from 'express';
import User from '../models/User.js';
import Service from '../models/Service.js';
import { auth } from '../middleware/auth.js';
import multer from 'multer';
import { getAvailabilityWithBookings, getCoiffeurAvailableSlots } from '../services/slotService.js';
// photoService removed - simplified photo system

const router = express.Router();

const toArrayParam = (value) => {
  if (value === undefined) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
};

const toNumberOrUndefined = (value) => {
  if (value === undefined) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const calculateDistanceInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

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
    const {
      service,
      speciality,
      specialities,
      city,
      priceMin,
      priceMax,
      rating,
      mode,
      modes,
      maxDistance,
      latitude,
      longitude
    } = req.query;

    const query = { role: 'coiffeur' };
    let allowedCoiffeurIds = null;

    const registerAllowedIds = (ids) => {
      const normalizedIds = ids.map((id) => id.toString());
      if (!allowedCoiffeurIds) {
        allowedCoiffeurIds = new Set(normalizedIds);
      } else {
        allowedCoiffeurIds = new Set(normalizedIds.filter((id) => allowedCoiffeurIds.has(id)));
      }
      return allowedCoiffeurIds;
    };

    const minimumPrice = toNumberOrUndefined(priceMin);
    const maximumPrice = toNumberOrUndefined(priceMax);

    if (service || minimumPrice !== undefined || maximumPrice !== undefined) {
      const serviceFilter = { isActive: true };

      if (service) {
        serviceFilter.name = { $regex: service, $options: 'i' };
      }

      if (minimumPrice !== undefined || maximumPrice !== undefined) {
        serviceFilter.price = {};
        if (minimumPrice !== undefined) {
          serviceFilter.price.$gte = minimumPrice;
        }
        if (maximumPrice !== undefined) {
          serviceFilter.price.$lte = maximumPrice;
        }
      }

      const servicesWithFilters = await Service.find(serviceFilter).distinct('coiffeur');
      const mergedIds = registerAllowedIds(servicesWithFilters);

      if (mergedIds && mergedIds.size === 0) {
        return res.json({ success: true, data: [], count: 0 });
      }
    }

    const specialityFilters = [
      ...toArrayParam(speciality),
      ...toArrayParam(specialities)
    ];

    if (specialityFilters.length > 0) {
      query.specialities = { $in: specialityFilters };
    }

    const modeFilters = [...new Set(toArrayParam(mode).concat(toArrayParam(modes)))];
    if (modeFilters.length > 0) {
      query.$or = [
        { workingMode: { $in: modeFilters } },
        { workingMode: 'both' }
      ];
    }

    if (allowedCoiffeurIds && allowedCoiffeurIds.size > 0) {
      query._id = { $in: Array.from(allowedCoiffeurIds) };
    }

    if (city) {
      query['address.city'] = { $regex: city, $options: 'i' };
    }

    let coiffeurs = await User.find(query)
      .select('-password')
      .sort({ rating: -1, totalRatings: -1 });

    const minimumRating = toNumberOrUndefined(rating);
    if (minimumRating !== undefined) {
      coiffeurs = coiffeurs.filter((coiffeur) => (coiffeur.rating ?? 0) >= minimumRating);
    }

    const distanceLimit = toNumberOrUndefined(maxDistance);
    const latitudeValue = toNumberOrUndefined(latitude);
    const longitudeValue = toNumberOrUndefined(longitude);

    if (
      distanceLimit !== undefined &&
      latitudeValue !== undefined &&
      longitudeValue !== undefined
    ) {
      coiffeurs = coiffeurs.filter((coiffeur) => {
        const coordinates =
          coiffeur?.address?.coordinates &&
          typeof coiffeur.address.coordinates.lat === 'number' &&
          typeof coiffeur.address.coordinates.lng === 'number'
            ? coiffeur.address.coordinates
            : coiffeur?.salonAddress?.coordinates;

        if (!coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
          return false;
        }

        const distance = calculateDistanceInKm(
          latitudeValue,
          longitudeValue,
          coordinates.lat,
          coordinates.lng
        );

        return distance <= distanceLimit;
      });
    }

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

// Récupérer les disponibilités (créneaux + réservations) d'un coiffeur
router.get('/:id/availability', async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, mode } = req.query;

    const availability = await getAvailabilityWithBookings(id, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      mode,
    });

    res.json({ success: true, data: availability });
  } catch (error) {
    console.error('Get coiffeur availability error:', error);
    const status = error.status || error.statusCode || 500;
    res.status(status).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération des disponibilités',
    });
  }
});

// Synchroniser la galerie d'un coiffeur à partir de ses services (gallery + examplePhotos)
router.get('/:id/gallery-sync', async (req, res) => {
  try {
    const { id } = req.params;

    const services = await Service.find({ coiffeur: id, isActive: true }).select(
      'name price duration category description gallery examplePhotos'
    );

    if (!services.length) {
      return res.json({
        success: true,
        coiffeurId: id,
        count: 0,
        deduplicatedFrom: 0,
        items: []
      });
    }

    const aggregatedItems = services.flatMap((service) => {
      const baseInfo = {
        serviceId: service._id,
        serviceName: service.name,
        servicePrice: service.price,
        serviceDuration: service.duration,
        serviceCategory: service.category,
        serviceDescription: service.description
      };

      const galleryItems = (service.gallery || []).map((media, index) => ({
        id: `${service._id}-gallery-${index}`,
        origin: 'gallery',
        mediaUrl: media.mediaUrl,
        mediaType: media.mediaType,
        caption: media.caption,
        tags: media.tags,
        likes: media.likes,
        createdAt: media.createdAt,
        ...baseInfo
      }));

      const examplePhotoItems = (service.examplePhotos || []).map((photoUrl, index) => ({
        id: `${service._id}-example-${index}`,
        origin: 'examplePhotos',
        mediaUrl: photoUrl,
        mediaType: 'image',
        caption: baseInfo.serviceDescription,
        tags: [],
        likes: 0,
        createdAt: service.createdAt,
        ...baseInfo
      }));

      return [...galleryItems, ...examplePhotoItems];
    });

    const seen = new Set();
    const dedupedItems = aggregatedItems.filter((item) => {
      if (!item.mediaUrl) {
        return false;
      }

      const key = `${item.mediaUrl}`;
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });

    return res.json({
      success: true,
      coiffeurId: id,
      count: dedupedItems.length,
      deduplicatedFrom: aggregatedItems.length,
      items: dedupedItems
    });
  } catch (error) {
    console.error('Erreur lors de la synchronisation de la galerie coiffeur :', error);
    res.status(500).json({
      success: false,
      message: "Impossible de synchroniser la galerie pour ce coiffeur pour le moment"
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

// Récupérer les créneaux disponibles d'un coiffeur
router.get('/:id/slots', async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, mode } = req.query;

    const parsedStart = startDate ? new Date(startDate) : undefined;
    if (parsedStart && Number.isNaN(parsedStart.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Format de date de début invalide'
      });
    }

    const parsedEnd = endDate ? new Date(endDate) : undefined;
    if (parsedEnd && Number.isNaN(parsedEnd.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Format de date de fin invalide'
      });
    }

    if (mode && !['salon', 'domicile'].includes(mode)) {
      return res.status(400).json({
        success: false,
        message: 'Mode invalide. Utilisez "salon" ou "domicile".'
      });
    }

    const slots = await getCoiffeurAvailableSlots(id, {
      startDate: parsedStart,
      endDate: parsedEnd,
      mode,
    });

    res.json({
      success: true,
      data: slots,
      count: slots.length,
    });
  } catch (error) {
    console.error('Get coiffeur slots error:', error);
    const status = error.status || 500;
    res.status(status).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération des créneaux'
    });
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
    console.log('🔍 [Coiffeurs API] Like request:', {
      coiffeurId: req.params.coiffeurId,
      serviceId: req.params.serviceId,
      userId: req.user?.id,
      user: req.user
    });

    const { coiffeurId, serviceId } = req.params;
    const userId = req.user.id;
    
    if (!userId) {
      console.error('❌ User ID not found in request');
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }
    
    const service = await Service.findById(serviceId);
    if (!service) {
      console.error('❌ Service not found:', serviceId);
      return res.status(404).json({ message: 'Service introuvable' });
    }

    if (service.coiffeur.toString() !== coiffeurId) {
      console.error('❌ Service coiffeur mismatch:', {
        serviceCoiffeur: service.coiffeur.toString(),
        requestedCoiffeur: coiffeurId
      });
      return res.status(400).json({ message: 'Service ne correspond pas au coiffeur' });
    }

    // Utiliser les méthodes du modèle
    const userLiked = service.isLikedBy(userId);
    console.log('💖 [Coiffeurs API] User liked status:', userLiked);
    
    if (userLiked) {
      // Unlike - Utilise la méthode du modèle
      console.log('👎 [Coiffeurs API] Removing like...');
      await service.removeLike(userId);
    } else {
      // Like - Utilise la méthode du modèle
      console.log('👍 [Coiffeurs API] Adding like...');
      await service.addLike(userId);
    }

    console.log('✅ [Coiffeurs API] Like operation completed:', {
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
    console.error('❌ [Coiffeurs API] Toggle service like error:', error);
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