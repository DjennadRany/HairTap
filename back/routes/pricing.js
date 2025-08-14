import express from 'express';
import Pricing from '../models/Pricing.js';
import { auth as authenticateToken, isCoiffeur } from '../middleware/auth.js';

const router = express.Router();

// Middleware pour vérifier que l'utilisateur est le propriétaire du prix
const isPricingOwner = async (req, res, next) => {
  try {
    const pricing = await Pricing.findById(req.params.id);
    if (!pricing) {
      return res.status(404).json({ message: 'Prix non trouvé' });
    }
    
    if (pricing.coiffeurId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
    
    req.pricing = pricing;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// GET /api/pricing/coiffeur/:id - Récupérer tous les prix d'un coiffeur
router.get('/coiffeur/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { activeOnly = 'true' } = req.query;
    
    const pricing = await Pricing.getCoiffeurPricing(
      id, 
      activeOnly === 'true'
    );
    
    res.json({
      success: true,
      data: pricing,
      count: pricing.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des prix',
      error: error.message 
    });
  }
});

// GET /api/pricing/service/:coiffeurId/:serviceId - Récupérer le prix d'un service spécifique
router.get('/service/:coiffeurId/:serviceId', async (req, res) => {
  try {
    const { coiffeurId, serviceId } = req.params;
    
    const pricing = await Pricing.getServicePricing(coiffeurId, serviceId);
    
    if (!pricing) {
      return res.status(404).json({
        success: false,
        message: 'Prix non trouvé pour ce service'
      });
    }
    
    res.json({
      success: true,
      data: pricing
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération du prix',
      error: error.message 
    });
  }
});

// POST /api/pricing/calculate - Calculer le prix final d'un service
router.post('/calculate', async (req, res) => {
  try {
    const { coiffeurId, serviceId, timeSlot, location, date } = req.body;
    
    if (!coiffeurId || !serviceId) {
      return res.status(400).json({
        success: false,
        message: 'ID du coiffeur et ID du service sont obligatoires'
      });
    }
    
    const pricing = await Pricing.getServicePricing(coiffeurId, serviceId);
    
    if (!pricing) {
      return res.status(404).json({
        success: false,
        message: 'Prix non trouvé pour ce service'
      });
    }
    
    const finalPrice = pricing.calculateFinalPrice(
      timeSlot || 'afternoon',
      location || 'salon',
      date ? new Date(date) : new Date()
    );
    
    res.json({
      success: true,
      data: {
        basePrice: pricing.basePrice,
        finalPrice,
        timeSlotMultipliers: pricing.timeSlotMultiplier,
        locationMultipliers: pricing.locationMultiplier,
        activeOffers: pricing.specialOffers.filter(offer => 
          offer.isActive && 
          offer.validFrom <= new Date() && 
          offer.validTo >= new Date()
        )
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors du calcul du prix',
      error: error.message
    });
  }
});

// POST /api/pricing - Créer un nouveau prix (coiffeur uniquement)
router.post('/', authenticateToken, isCoiffeur, async (req, res) => {
  try {
    const {
      serviceId,
      basePrice,
      timeSlotMultiplier,
      locationMultiplier
    } = req.body;
    
    // Validation des données
    if (!serviceId || basePrice === undefined) {
      return res.status(400).json({
        success: false,
        message: 'ID du service et prix de base sont obligatoires'
      });
    }
    
    // Vérifier que le coiffeur n'a pas déjà un prix pour ce service
    const existingPricing = await Pricing.findOne({
      coiffeurId: req.user.id,
      serviceId
    });
    
    if (existingPricing) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà un prix pour ce service'
      });
    }
    
    const pricing = new Pricing({
      coiffeurId: req.user.id,
      serviceId,
      basePrice,
      timeSlotMultiplier: timeSlotMultiplier || {
        morning: 1.0,
        afternoon: 1.0,
        evening: 1.2,
        weekend: 1.3
      },
      locationMultiplier: locationMultiplier || {
        salon: 1.0,
        domicile: 1.5
      },
      specialOffers: []
    });
    
    await pricing.save();
    
    res.status(201).json({
      success: true,
      message: 'Prix créé avec succès',
      data: pricing
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du prix',
      error: error.message
    });
  }
});

// GET /api/pricing/:id - Récupérer un prix spécifique
router.get('/:id', async (req, res) => {
  try {
    const pricing = await Pricing.findById(req.params.id)
      .populate('coiffeurId', 'name rating photo')
      .populate('serviceId', 'name category duration');
    
    if (!pricing) {
      return res.status(404).json({
        success: false,
        message: 'Prix non trouvé'
      });
    }
    
    res.json({
      success: true,
      data: pricing
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du prix',
      error: error.message
    });
  }
});

// PUT /api/pricing/:id - Mettre à jour un prix
router.put('/:id', authenticateToken, isCoiffeur, isPricingOwner, async (req, res) => {
  try {
    const {
      basePrice,
      timeSlotMultiplier,
      locationMultiplier
    } = req.body;
    
    const updates = {};
    if (basePrice !== undefined) updates.basePrice = basePrice;
    if (timeSlotMultiplier) updates.timeSlotMultiplier = timeSlotMultiplier;
    if (locationMultiplier) updates.locationMultiplier = locationMultiplier;
    
    const updatedPricing = await Pricing.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      message: 'Prix mis à jour avec succès',
      data: updatedPricing
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du prix',
      error: error.message
    });
  }
});

// PATCH /api/pricing/:id/multipliers - Mettre à jour les multiplicateurs
router.patch('/:id/multipliers', authenticateToken, isCoiffeur, isPricingOwner, async (req, res) => {
  try {
    const { timeSlotMultiplier, locationMultiplier } = req.body;
    
    const pricing = await Pricing.findById(req.params.id);
    await pricing.updateMultipliers({
      timeSlotMultiplier,
      locationMultiplier
    });
    
    res.json({
      success: true,
      message: 'Multiplicateurs mis à jour avec succès',
      data: pricing
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des multiplicateurs',
      error: error.message
    });
  }
});

// POST /api/pricing/:id/offers - Ajouter une offre spéciale
router.post('/:id/offers', authenticateToken, isCoiffeur, isPricingOwner, async (req, res) => {
  try {
    const { name, discount, validFrom, validTo, conditions } = req.body;
    
    if (!name || discount === undefined || !validFrom || !validTo) {
      return res.status(400).json({
        success: false,
        message: 'Nom, remise, date de début et date de fin sont obligatoires'
      });
    }
    
    const pricing = await Pricing.findById(req.params.id);
    await pricing.addSpecialOffer({
      name,
      discount,
      validFrom: new Date(validFrom),
      validTo: new Date(validTo),
      conditions: conditions || []
    });
    
    res.json({
      success: true,
      message: 'Offre spéciale ajoutée avec succès',
      data: pricing
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout de l\'offre spéciale',
      error: error.message
    });
  }
});

// PATCH /api/pricing/:id/offers/:offerName/deactivate - Désactiver une offre spéciale
router.patch('/:id/offers/:offerName/deactivate', authenticateToken, isCoiffeur, isPricingOwner, async (req, res) => {
  try {
    const { offerName } = req.params;
    
    const pricing = await Pricing.findById(req.params.id);
    await pricing.deactivateOffer(offerName);
    
    res.json({
      success: true,
      message: 'Offre spéciale désactivée avec succès',
      data: pricing
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la désactivation de l\'offre spéciale',
      error: error.message
    });
  }
});

// PATCH /api/pricing/:id/activate - Activer un prix
router.patch('/:id/activate', authenticateToken, isCoiffeur, isPricingOwner, async (req, res) => {
  try {
    const pricing = await Pricing.findById(req.params.id);
    pricing.isActive = true;
    await pricing.save();
    
    res.json({
      success: true,
      message: 'Prix activé avec succès',
      data: pricing
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'activation du prix',
      error: error.message
    });
  }
});

// PATCH /api/pricing/:id/deactivate - Désactiver un prix
router.patch('/:id/deactivate', authenticateToken, isCoiffeur, isPricingOwner, async (req, res) => {
  try {
    const pricing = await Pricing.findById(req.params.id);
    pricing.isActive = false;
    await pricing.save();
    
    res.json({
      success: true,
      message: 'Prix désactivé avec succès',
      data: pricing
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la désactivation du prix',
      error: error.message
    });
  }
});

// DELETE /api/pricing/:id - Supprimer un prix
router.delete('/:id', authenticateToken, isCoiffeur, isPricingOwner, async (req, res) => {
  try {
    await Pricing.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Prix supprimé avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du prix',
      error: error.message
    });
  }
});

// POST /api/pricing/bulk - Créer plusieurs prix en lot
router.post('/bulk', authenticateToken, isCoiffeur, async (req, res) => {
  try {
    const { pricingList } = req.body;
    
    if (!Array.isArray(pricingList) || pricingList.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Le tableau de prix est requis et ne peut pas être vide'
      });
    }
    
    const createdPricing = [];
    const errors = [];
    
    for (const pricingData of pricingList) {
      try {
        // Vérifier qu'il n'y a pas déjà un prix pour ce service
        const existingPricing = await Pricing.findOne({
          coiffeurId: req.user.id,
          serviceId: pricingData.serviceId
        });
        
        if (existingPricing) {
          errors.push({
            pricing: pricingData,
            error: 'Prix déjà existant pour ce service'
          });
          continue;
        }
        
        const pricing = new Pricing({
          coiffeurId: req.user.id,
          ...pricingData
        });
        
        await pricing.save();
        createdPricing.push(pricing);
      } catch (error) {
        errors.push({
          pricing: pricingData,
          error: error.message
        });
      }
    }
    
    res.status(201).json({
      success: true,
      message: `${createdPricing.length} prix créés avec succès`,
      data: createdPricing,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création des prix en lot',
      error: error.message
    });
  }
});

export default router;
