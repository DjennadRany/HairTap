import express from 'express';
import multer from 'multer';
import path from 'path';
import { promises as fsPromises } from 'fs';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { randomUUID } from 'crypto';
import { auth } from '../middleware/auth.js';
import User from '../models/User.js';
import Service from '../models/Service.js';
import geolocationService from '../services/geolocationService.js';

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
    .toLowerCase() || 'fichier';
};

const getExtension = (filename) => path.extname(filename || '').toLowerCase();

const buildFileName = (originalName) => {
  const extension = getExtension(originalName);
  const baseName = path.basename(originalName, extension);
  const slug = slugify(baseName);
  return `${slug}-${randomUUID()}${extension}`;
};

const ALLOWED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
]);

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
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const extension = getExtension(file.originalname);

    if (!ALLOWED_IMAGE_EXTENSIONS.has(extension) || !ALLOWED_IMAGE_MIMES.has(file.mimetype)) {
      return cb(new Error('Seules les images JPG, PNG ou WEBP sont autorisées'));
    }

    cb(null, true);
  }
});

// Récupérer tous les utilisateurs (admin seulement)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
    
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs' });
  }
});



// Récupérer un utilisateur par ID
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'utilisateur' });
  }
});

// Mettre à jour un utilisateur
router.patch('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    console.log('🔧 [PATCH /users/:id] Début de la mise à jour');
    console.log('📝 ID utilisateur:', id);
    console.log('📦 Données reçues:', JSON.stringify(updateData, null, 2));

    const user = await User.findById(id);
    if (!user) {
      console.log('❌ Utilisateur non trouvé:', id);
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    console.log('✅ Utilisateur trouvé:', user.name);

    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      console.log('❌ Non autorisé - User ID:', req.user._id, 'vs', id);
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Protection des champs sensibles
    delete updateData.password;
    delete updateData.role;
    delete updateData.googleId;

    console.log('🔒 Données après protection:', JSON.stringify(updateData, null, 2));

    // Vérifier spécifiquement les adresses et ajouter la géolocalisation
    if (updateData.addresses) {
      console.log('📍 Adresses à sauvegarder:', JSON.stringify(updateData.addresses, null, 2));
      
      // Géolocaliser automatiquement les adresses sans coordonnées
      if (updateData.addresses.home && !updateData.addresses.home.coordinates) {
        console.log('🏠 Géolocalisation de l\'adresse home...');
        updateData.addresses.home = await geolocationService.addCoordinatesToAddress(updateData.addresses.home);
      }
      
      if (updateData.addresses.office && !updateData.addresses.office.coordinates) {
        console.log('🏢 Géolocalisation de l\'adresse office...');
        updateData.addresses.office = await geolocationService.addCoordinatesToAddress(updateData.addresses.office);
      }
      
      // Valider les coordonnées si présentes
      if (updateData.addresses.home?.coordinates) {
        console.log('🏠 Coordonnées home:', updateData.addresses.home.coordinates);
      }
      if (updateData.addresses.office?.coordinates) {
        console.log('🏢 Coordonnées office:', updateData.addresses.office.coordinates);
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    console.log('✅ Utilisateur mis à jour avec succès');
    console.log('📊 Adresses sauvegardées:', JSON.stringify(updatedUser.addresses, null, 2));

    res.json(updatedUser);
  } catch (error) {
    console.error('❌ Update user error:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'utilisateur' });
  }
});

// Route pour upload de photo de profil
router.post('/:id/photo', auth, upload.single('photo'), async (req, res) => {
  let tempFilePath;
  let finalFilePath;

  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'Aucune photo fournie' });
    }

    tempFilePath = file.path;

    const extension = getExtension(file.originalname);
    if (!ALLOWED_IMAGE_EXTENSIONS.has(extension)) {
      return res.status(400).json({ message: 'Extension de fichier non autorisée' });
    }

    if (!ALLOWED_IMAGE_MIMES.has(file.mimetype)) {
      return res.status(400).json({ message: 'Type de fichier non autorisé' });
    }

    if (file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ message: 'Fichier trop volumineux (max 5MB)' });
    }

    const uploadDir = path.join(process.cwd(), 'uploads', 'profiles');
    await ensureDirExists(uploadDir);

    const fileName = buildFileName(file.originalname);
    finalFilePath = path.join(uploadDir, fileName);

    await pipeline(createReadStream(tempFilePath), createWriteStream(finalFilePath));

    const relativePath = `/uploads/profiles/${fileName}`;

    const user = await User.findByIdAndUpdate(
      id,
      { photo: relativePath },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    console.log('✅ [POST /users/:id/photo] Photo uploadée avec succès');
    console.log('📁 Fichier sauvegardé:', finalFilePath);
    console.log('🌐 URL retournée:', relativePath);

    res.json({
      success: true,
      message: 'Photo mise à jour avec succès',
      photo: relativePath
    });
  } catch (error) {
    console.error('Erreur upload photo:', error);

    if (finalFilePath) {
      await unlink(finalFilePath).catch(() => {});
    }

    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Fichier trop volumineux (max 5MB)' });
    }

    res.status(500).json({ message: "Erreur lors de l'upload de la photo" });
  } finally {
    if (tempFilePath) {
      await unlink(tempFilePath).catch(() => {});
    }
  }
});

// Route pour supprimer la photo de profil
router.delete('/:id/photo', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByIdAndUpdate(
      id,
      { photo: '/default-avatar.png' },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json({ 
      success: true, 
      message: 'Photo supprimée avec succès',
      photo: '/default-avatar.png' 
    });

  } catch (error) {
    console.error('Erreur suppression photo:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de la photo' });
  }
});

// Récupérer les adresses de réservation d'un utilisateur
router.get('/:id/booking-addresses', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('📍 [GET /users/:id/booking-addresses] Récupération des adresses de réservation');
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const bookingAddresses = user.getBookingAddresses();
    console.log('✅ [GET /users/:id/booking-addresses] Adresses trouvées:', bookingAddresses.length);
    
    res.json(bookingAddresses);
  } catch (error) {
    console.error('❌ [GET /users/:id/booking-addresses] Erreur:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des adresses de réservation' });
  }
});

// Ajouter une adresse de réservation
router.post('/:id/booking-addresses', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const addressData = req.body;
    
    console.log('📍 [POST /users/:id/booking-addresses] Ajout d\'une adresse de réservation');
    console.log('📦 Données reçues:', JSON.stringify(addressData, null, 2));
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Géolocaliser l'adresse si pas de coordonnées
    if (!addressData.coordinates) {
      addressData.coordinates = await geolocationService.geocodeAddressComponents(addressData);
    }

    const newAddress = await user.addBookingAddress(addressData);
    console.log('✅ [POST /users/:id/booking-addresses] Adresse ajoutée:', newAddress);
    
    res.status(201).json(newAddress);
  } catch (error) {
    console.error('❌ [POST /users/:id/booking-addresses] Erreur:', error);
    res.status(500).json({ message: 'Erreur lors de l\'ajout de l\'adresse de réservation' });
  }
});

// Supprimer une adresse de réservation
router.delete('/:id/booking-addresses/:addressId', auth, async (req, res) => {
  try {
    const { id, addressId } = req.params;
    
    console.log('🗑️ [DELETE /users/:id/booking-addresses/:addressId] Suppression d\'une adresse');
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    await user.removeBookingAddress(addressId);
    console.log('✅ [DELETE /users/:id/booking-addresses/:addressId] Adresse supprimée');
    
    res.json({ message: 'Adresse de réservation supprimée' });
  } catch (error) {
    console.error('❌ [DELETE /users/:id/booking-addresses/:addressId] Erreur:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'adresse de réservation' });
  }
});

// Route pour supprimer un compte utilisateur
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🗑️ [DELETE /users/:id] Suppression du compte utilisateur:', id);
    
    // Vérifier que l'utilisateur existe
    const userToDelete = await User.findById(id);
    if (!userToDelete) {
      console.log('❌ [DELETE /users/:id] Utilisateur non trouvé:', id);
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Vérifier les permissions : l'utilisateur peut supprimer son propre compte OU admin
    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      console.log('❌ [DELETE /users/:id] Non autorisé - User ID:', req.user._id, 'vs', id);
      return res.status(403).json({ message: 'Non autorisé à supprimer ce compte' });
    }
    
    // Empêcher la suppression d'un compte admin par un non-admin
    if (userToDelete.role === 'admin' && req.user.role !== 'admin') {
      console.log('❌ [DELETE /users/:id] Tentative de suppression d\'un compte admin par un non-admin');
      return res.status(403).json({ message: 'Impossible de supprimer un compte administrateur' });
    }
    
    // Supprimer l'utilisateur
    await User.findByIdAndDelete(id);
    
    console.log('✅ [DELETE /users/:id] Compte supprimé avec succès:', id);
    
    res.json({ 
      success: true, 
      message: 'Compte supprimé avec succès' 
    });
    
  } catch (error) {
    console.error('❌ [DELETE /users/:id] Erreur:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression du compte' });
  }
});

// Route pour mettre à jour l'adresse de salon (coiffeurs uniquement)
router.put('/salon-address', auth, async (req, res) => {
  try {
    const { salonAddress } = req.body;
    
    // Vérifier que l'utilisateur est un coiffeur
    if (req.user.role !== 'coiffeur') {
      return res.status(403).json({ message: 'Accès réservé aux coiffeurs' });
    }
    
    // Validation des données
    if (!salonAddress || !salonAddress.street || !salonAddress.city || !salonAddress.postalCode) {
      return res.status(400).json({ message: 'Adresse de salon incomplète' });
    }
    
    // Mettre à jour l'adresse de salon
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { salonAddress },
      { new: true, runValidators: true }
    );
    
    res.json({
      message: 'Adresse de salon mise à jour avec succès',
      salonAddress: updatedUser.salonAddress
    });
    
  } catch (error) {
    console.error('Erreur mise à jour adresse salon:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour récupérer l'adresse de salon
router.get('/salon-address/:coiffeurId', async (req, res) => {
  try {
    const { coiffeurId } = req.params;
    
    const coiffeur = await User.findById(coiffeurId).select('salonAddress name');
    
    if (!coiffeur) {
      return res.status(404).json({ message: 'Coiffeur non trouvé' });
    }
    
    if (coiffeur.role !== 'coiffeur') {
      return res.status(400).json({ message: 'Utilisateur non coiffeur' });
    }
    
    res.json({
      salonAddress: coiffeur.salonAddress,
      coiffeurName: coiffeur.name
    });
    
  } catch (error) {
    console.error('Erreur récupération adresse salon:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer les services d'un utilisateur (pour la galerie)
router.get('/services', async (req, res) => {
  try {
    // Cette route peut être utilisée pour récupérer des services liés à un utilisateur
    // Pour l'instant, on retourne un tableau vide pour éviter l'erreur 500
    res.json([]);
  } catch (error) {
    console.error('Get user services error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des services' });
  }
});

export default router; 