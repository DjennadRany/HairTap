import express from 'express';
import Specialty from '../models/Specialty.js';
import { auth as authenticateToken, isCoiffeur } from '../middleware/auth.js';

const router = express.Router();

// Middleware pour vérifier que l'utilisateur est le propriétaire de la spécialité
const isSpecialtyOwner = async (req, res, next) => {
  try {
    const specialty = await Specialty.findById(req.params.id);
    if (!specialty) {
      return res.status(404).json({ message: 'Spécialité non trouvée' });
    }
    
    if (specialty.coiffeurId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
    
    req.specialty = specialty;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// GET /api/specialties/coiffeur/:id - Récupérer les spécialités d'un coiffeur
router.get('/coiffeur/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { activeOnly = 'true' } = req.query;
    
    const specialties = await Specialty.getCoiffeurSpecialties(
      id, 
      activeOnly === 'true'
    );
    
    res.json({
      success: true,
      data: specialties,
      count: specialties.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des spécialités',
      error: error.message 
    });
  }
});

// GET /api/specialties/category/:category - Récupérer les spécialités par catégorie
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { activeOnly = 'true' } = req.query;
    
    const specialties = await Specialty.getSpecialtiesByCategory(
      category, 
      activeOnly === 'true'
    );
    
    res.json({
      success: true,
      data: specialties,
      count: specialties.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des spécialités',
      error: error.message 
    });
  }
});

// POST /api/specialties - Créer une nouvelle spécialité (coiffeur uniquement)
router.post('/', authenticateToken, isCoiffeur, async (req, res) => {
  try {
    const { name, expertiseLevel, yearsExperience, category, description, certifications } = req.body;
    
    // Validation des données
    if (!name || !expertiseLevel || !yearsExperience || !category) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs obligatoires doivent être remplis'
      });
    }
    
    // Vérifier que le coiffeur n'a pas déjà cette spécialité
    const existingSpecialty = await Specialty.findOne({
      coiffeurId: req.user.id,
      name: { $regex: new RegExp(name, 'i') }
    });
    
    if (existingSpecialty) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà une spécialité avec ce nom'
      });
    }
    
    const specialty = new Specialty({
      coiffeurId: req.user.id,
      name,
      expertiseLevel,
      yearsExperience,
      category,
      description,
      certifications: certifications || []
    });
    
    await specialty.save();
    
    res.status(201).json({
      success: true,
      message: 'Spécialité créée avec succès',
      data: specialty
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la spécialité',
      error: error.message
    });
  }
});

// GET /api/specialties/:id - Récupérer une spécialité spécifique
router.get('/:id', async (req, res) => {
  try {
    const specialty = await Specialty.findById(req.params.id)
      .populate('coiffeurId', 'name rating photo');
    
    if (!specialty) {
      return res.status(404).json({
        success: false,
        message: 'Spécialité non trouvée'
      });
    }
    
    res.json({
      success: true,
      data: specialty
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la spécialité',
      error: error.message
    });
  }
});

// PUT /api/specialties/:id - Mettre à jour une spécialité
router.put('/:id', authenticateToken, isCoiffeur, isSpecialtyOwner, async (req, res) => {
  try {
    const { name, expertiseLevel, yearsExperience, category, description, certifications } = req.body;
    
    const updates = {};
    if (name) updates.name = name;
    if (expertiseLevel !== undefined) updates.expertiseLevel = expertiseLevel;
    if (yearsExperience !== undefined) updates.yearsExperience = yearsExperience;
    if (category) updates.category = category;
    if (description !== undefined) updates.description = description;
    if (certifications !== undefined) updates.certifications = certifications;
    
    const updatedSpecialty = await Specialty.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      message: 'Spécialité mise à jour avec succès',
      data: updatedSpecialty
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la spécialité',
      error: error.message
    });
  }
});

// PATCH /api/specialties/:id/activate - Activer une spécialité
router.patch('/:id/activate', authenticateToken, isCoiffeur, isSpecialtyOwner, async (req, res) => {
  try {
    const specialty = await Specialty.findById(req.params.id);
    await specialty.activate();
    
    res.json({
      success: true,
      message: 'Spécialité activée avec succès',
      data: specialty
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'activation de la spécialité',
      error: error.message
    });
  }
});

// PATCH /api/specialties/:id/deactivate - Désactiver une spécialité
router.patch('/:id/deactivate', authenticateToken, isCoiffeur, isSpecialtyOwner, async (req, res) => {
  try {
    const specialty = await Specialty.findById(req.params.id);
    await specialty.deactivate();
    
    res.json({
      success: true,
      message: 'Spécialité désactivée avec succès',
      data: specialty
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la désactivation de la spécialité',
      error: error.message
    });
  }
});

// DELETE /api/specialties/:id - Supprimer une spécialité
router.delete('/:id', authenticateToken, isCoiffeur, isSpecialtyOwner, async (req, res) => {
  try {
    await Specialty.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Spécialité supprimée avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la spécialité',
      error: error.message
    });
  }
});

export default router;
