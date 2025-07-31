import express from 'express';
import multer from 'multer';
import { auth } from '../middleware/auth.js';
import User from '../models/User.js';
import photoService from '../services/photoService.js';
import geolocationService from '../services/geolocationService.js';

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

// Upload de photo de profil - CORRIGÉ
router.post('/:id/photo', auth, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Aucun fichier fourni' });
    }

    // Supprimer l'ancienne photo
    if (user.photo && user.photo !== 'default-avatar.png') {
      await photoService.deletePhoto(user.photo);
    }

    // Upload de la nouvelle photo
    const uploadResult = await photoService.uploadProfilePhoto(req.file, id);

    // Mettre à jour l'utilisateur
    await User.findByIdAndUpdate(id, { 
      photo: uploadResult.url 
    });

    res.json({
      success: true,
      message: 'Photo mise à jour',
      photo: { url: uploadResult.url }
    });
  } catch (error) {
    console.error('Upload photo error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Erreur lors de l\'upload' 
    });
  }
});

// Supprimer la photo de profil
router.delete('/:id/photo', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    // Supprimer la photo du serveur
    if (user.photo && user.photo !== 'default-avatar.png') {
      await photoService.deletePhoto(user.photo);
    }

    // Remettre la photo par défaut
    await User.findByIdAndUpdate(id, { photo: 'default-avatar.png' });

    res.json({
      success: true,
      message: 'Photo supprimée'
    });
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Erreur lors de la suppression' 
    });
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

export default router; 