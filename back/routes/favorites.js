import express from 'express';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Récupérer les favoris d'un utilisateur
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('favorites');
    res.json(user.favorites || []);
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des favoris' });
  }
});

// Ajouter un coiffeur aux favoris
router.post('/:coiffeurId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.favorites) user.favorites = [];
    
    if (!user.favorites.includes(req.params.coiffeurId)) {
      user.favorites.push(req.params.coiffeurId);
      await user.save();
    }
    
    res.json({ message: 'Coiffeur ajouté aux favoris' });
  } catch (error) {
    console.error('Add to favorites error:', error);
    res.status(500).json({ message: 'Erreur lors de l\'ajout aux favoris' });
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
    
    res.json({ message: 'Coiffeur retiré des favoris' });
  } catch (error) {
    console.error('Remove from favorites error:', error);
    res.status(500).json({ message: 'Erreur lors du retrait des favoris' });
  }
});

export default router; 