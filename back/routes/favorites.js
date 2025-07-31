import express from 'express';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Récupérer les favoris d'un utilisateur
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('favorites');
    const favorites = user.favorites || [];
    
    res.json({
      success: true,
      favorites: favorites
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des favoris' 
    });
  }
});

// Ajouter un coiffeur aux favoris - AVEC NOTIFICATION
router.post('/:coiffeurId', auth, async (req, res) => {
  try {
    const { coiffeurId } = req.params;
    const userId = req.user.id;
    
    // Vérifier que le coiffeur existe
    const coiffeur = await User.findById(coiffeurId);
    if (!coiffeur || coiffeur.role !== 'coiffeur') {
      return res.status(404).json({ 
        success: false,
        message: 'Coiffeur introuvable' 
      });
    }
    
    const user = await User.findById(userId);
    if (!user.favorites) user.favorites = [];
    
    // Vérifier si déjà en favori
    const isAlreadyFavorite = user.favorites.includes(coiffeurId);
    
    if (!isAlreadyFavorite) {
      user.favorites.push(coiffeurId);
      await user.save();
      
      // Mettre à jour les statistiques du coiffeur
      if (!coiffeur.stats) coiffeur.stats = {};
      coiffeur.stats.totalFavorites = (coiffeur.stats.totalFavorites || 0) + 1;
      await coiffeur.save();
      
      console.log(`✅ ${user.name} a ajouté ${coiffeur.name} à ses favoris`);
    }
    
    res.json({ 
      success: true,
      data: {
        isFavorite: true,
        totalFavorites: coiffeur.stats?.totalFavorites || 0
      },
      message: isAlreadyFavorite ? 'Déjà en favori' : 'Coiffeur ajouté aux favoris'
    });
  } catch (error) {
    console.error('Add to favorites error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de l\'ajout aux favoris' 
    });
  }
});

// Retirer un coiffeur des favoris
router.delete('/:coiffeurId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.favorites) {
      user.favorites = user.favorites.filter(id => id.toString() !== req.params.coiffeurId);
      await user.save();
    }
    
    res.json({ 
      success: true,
      message: 'Coiffeur retiré des favoris' 
    });
  } catch (error) {
    console.error('Remove from favorites error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors du retrait des favoris' 
    });
  }
});

export default router; 