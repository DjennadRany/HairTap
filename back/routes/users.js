import express from 'express';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import { validateUser, validateFile } from '../middleware/validate.js';

const router = express.Router();

// Récupérer tous les utilisateurs (admin seulement)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
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

    // Vérifier que l'utilisateur est bien celui qui fait la requête ou un admin
    if (user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'utilisateur' });
  }
});

// Mettre à jour un utilisateur
router.patch('/:id', auth, validateUser, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier que l'utilisateur est bien celui qui fait la requête ou un admin
    if (user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const updates = req.body;

    // Mise à jour des champs autorisés
    Object.keys(updates).forEach(key => {
      if (key !== 'password' && key !== '_id' && key !== 'role') {
        user[key] = updates[key];
      }
    });

    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(400).json({ message: 'Erreur lors de la mise à jour de l\'utilisateur' });
  }
});

// Supprimer un utilisateur
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier que l'utilisateur est bien celui qui fait la requête ou un admin
    if (user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    await user.remove();
    res.json({ message: 'Utilisateur supprimé' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'utilisateur' });
  }
});

// Mettre à jour la photo de profil
router.post('/:id/photo', auth, validateFile, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier que l'utilisateur est bien celui qui fait la requête ou un admin
    if (user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    user.photo = req.file.path;
    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (error) {
    console.error('Update photo error:', error);
    res.status(400).json({ message: 'Erreur lors de la mise à jour de la photo' });
  }
});

// Mettre à jour les préférences
router.patch('/:id/preferences', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier que l'utilisateur est bien celui qui fait la requête
    if (user._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const { preferences } = req.body;
    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({ message: 'Préférences invalides' });
    }

    user.preferences = preferences;
    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(400).json({ message: 'Erreur lors de la mise à jour des préférences' });
  }
});

export default router; 