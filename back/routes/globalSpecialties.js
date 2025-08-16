import express from 'express';
import GlobalSpecialty from '../models/GlobalSpecialty.js';
import { auth as authenticateToken, isCoiffeur } from '../middleware/auth.js';

const router = express.Router();

// GET /api/global-specialties - Récupérer toutes les spécialités populaires
router.get('/', async (req, res) => {
  try {
    const { category, limit = 50, popular = 'false' } = req.query;
    
    let specialties;
    if (popular === 'true') {
      specialties = await GlobalSpecialty.getPopularSpecialties(category, parseInt(limit));
    } else if (category) {
      specialties = await GlobalSpecialty.getSpecialtiesByCategory(category, parseInt(limit));
    } else {
      specialties = await GlobalSpecialty.find({ isActive: true })
        .sort({ usageCount: -1, name: 1 })
        .limit(parseInt(limit));
    }

    res.json({
      success: true,
      data: specialties,
      count: specialties.length
    });
  } catch (error) {
    console.error('Erreur récupération spécialités globales:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur',
      error: error.message 
    });
  }
});

// POST /api/global-specialties/search - Recherche intelligente des spécialités
router.post('/search', async (req, res) => {
  try {
    const { query, limit = 10, category } = req.body;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'La requête doit contenir au moins 2 caractères'
      });
    }

    let searchResults;
    if (category) {
      // Recherche dans une catégorie spécifique
      const allResults = await GlobalSpecialty.searchSpecialties(query, limit * 2);
      searchResults = {
        exact: allResults.exact,
        suggestions: allResults.suggestions.filter(s => s.category === category).slice(0, limit)
      };
    } else {
      // Recherche globale
      searchResults = await GlobalSpecialty.searchSpecialties(query, limit);
    }

    res.json({
      success: true,
      data: searchResults,
      query: query.trim()
    });

  } catch (error) {
    console.error('Erreur recherche spécialités:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur',
      error: error.message 
    });
  }
});

// POST /api/global-specialties - Créer une nouvelle spécialité globale
router.post('/', authenticateToken, isCoiffeur, async (req, res) => {
  try {
    const { name, category, aliases, description } = req.body;
    
    if (!name || !category) {
      return res.status(400).json({
        success: false,
        message: 'Le nom et la catégorie sont obligatoires'
      });
    }

    // Vérifier si la spécialité existe déjà
    const existingSpecialty = await GlobalSpecialty.findOne({
      $or: [
        { name: { $regex: `^${name.trim()}$`, $i: true } },
        { aliases: { $regex: `^${name.trim()}$`, $i: true } }
      ]
    });

    if (existingSpecialty) {
      return res.status(400).json({
        success: false,
        message: 'Cette spécialité existe déjà',
        existingSpecialty: {
          _id: existingSpecialty._id,
          name: existingSpecialty.name,
          category: existingSpecialty.category
        }
      });
    }

    // Créer la nouvelle spécialité
    const newSpecialty = new GlobalSpecialty({
      name: name.trim(),
      category,
      aliases: aliases || [],
      description,
      createdBy: req.user.id
    });

    await newSpecialty.save();

    res.status(201).json({
      success: true,
      message: 'Spécialité créée avec succès',
      data: newSpecialty
    });

  } catch (error) {
    console.error('Erreur création spécialité globale:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur',
      error: error.message 
    });
  }
});

// GET /api/global-specialties/categories - Récupérer toutes les catégories
router.get('/categories', async (req, res) => {
  try {
    const categories = await GlobalSpecialty.distinct('category', { isActive: true });
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Erreur récupération catégories:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur',
      error: error.message 
    });
  }
});

// GET /api/global-specialties/popular - Récupérer les spécialités populaires
router.get('/popular', async (req, res) => {
  try {
    const { category, limit = 20 } = req.query;
    
    const specialties = await GlobalSpecialty.getPopularSpecialties(category, parseInt(limit));
    
    res.json({
      success: true,
      data: specialties,
      count: specialties.length
    });
  } catch (error) {
    console.error('Erreur récupération spécialités populaires:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur',
      error: error.message 
    });
  }
});

// PATCH /api/global-specialties/:id/increment - Incrémenter l'usage
router.patch('/:id/increment', async (req, res) => {
  try {
    const specialty = await GlobalSpecialty.findById(req.params.id);
    
    if (!specialty) {
      return res.status(404).json({
        success: false,
        message: 'Spécialité non trouvée'
      });
    }

    await specialty.incrementUsage();
    
    res.json({
      success: true,
      message: 'Usage incrémenté',
      data: specialty
    });

  } catch (error) {
    console.error('Erreur incrément usage:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur',
      error: error.message 
    });
  }
});

export default router;
