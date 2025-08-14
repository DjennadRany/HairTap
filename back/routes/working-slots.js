import express from 'express';
import WorkingSlot from '../models/WorkingSlot.js';
import { auth as authenticateToken, isCoiffeur } from '../middleware/auth.js';

const router = express.Router();

// Middleware pour vérifier que l'utilisateur est le propriétaire du créneau
const isSlotOwner = async (req, res, next) => {
  try {
    const slot = await WorkingSlot.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({ message: 'Créneau non trouvé' });
    }
    
    if (slot.coiffeurId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
    
    req.slot = slot;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// GET /api/working-slots/coiffeur/:id - Récupérer les créneaux d'un coiffeur
router.get('/coiffeur/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { activeOnly = 'true' } = req.query;
    
    const slots = await WorkingSlot.getCoiffeurSlots(
      id, 
      activeOnly === 'true'
    );
    
    res.json({
      success: true,
      data: slots,
      count: slots.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des créneaux',
      error: error.message 
    });
  }
});

// GET /api/working-slots/coiffeur/:id/available - Récupérer les créneaux disponibles d'un coiffeur
router.get('/coiffeur/:id/available', async (req, res) => {
  try {
    const { id } = req.params;
    const { dayOfWeek, date } = req.query;
    
    const slots = await WorkingSlot.getAvailableSlots(
      id, 
      dayOfWeek ? parseInt(dayOfWeek) : null,
      date ? new Date(date) : null
    );
    
    res.json({
      success: true,
      data: slots,
      count: slots.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des créneaux disponibles',
      error: error.message 
    });
  }
});

// POST /api/working-slots - Créer un nouveau créneau (coiffeur uniquement)
router.post('/', authenticateToken, isCoiffeur, async (req, res) => {
  try {
    const {
      dayOfWeek,
      startTime,
      endTime,
      serviceTypes,
      availableAt,
      maxBookings,
      isRecurring
    } = req.body;
    
    // Validation des données
    if (dayOfWeek === undefined || startTime === undefined || endTime === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Jour, heure de début et heure de fin sont obligatoires'
      });
    }
    
    // Vérifier qu'il n'y a pas de conflit avec un créneau existant
    const conflictingSlot = await WorkingSlot.findOne({
      coiffeurId: req.user.id,
      dayOfWeek,
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ]
    });
    
    if (conflictingSlot) {
      return res.status(400).json({
        success: false,
        message: 'Ce créneau chevauche un créneau existant'
      });
    }
    
    const slot = new WorkingSlot({
      coiffeurId: req.user.id,
      dayOfWeek,
      startTime,
      endTime,
      serviceTypes: serviceTypes || ['coupe'],
      availableAt: availableAt || 'salon',
      maxBookings: maxBookings || 1,
      isRecurring: isRecurring !== undefined ? isRecurring : true
    });
    
    await slot.save();
    
    res.status(201).json({
      success: true,
      message: 'Créneau créé avec succès',
      data: slot
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du créneau',
      error: error.message
    });
  }
});

// GET /api/working-slots/:id - Récupérer un créneau spécifique
router.get('/:id', async (req, res) => {
  try {
    const slot = await WorkingSlot.findById(req.params.id)
      .populate('coiffeurId', 'name rating photo');
    
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Créneau non trouvé'
      });
    }
    
    res.json({
      success: true,
      data: slot
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du créneau',
      error: error.message
    });
  }
});

// PUT /api/working-slots/:id - Mettre à jour un créneau
router.put('/:id', authenticateToken, isCoiffeur, isSlotOwner, async (req, res) => {
  try {
    const {
      dayOfWeek,
      startTime,
      endTime,
      serviceTypes,
      availableAt,
      maxBookings,
      isRecurring
    } = req.body;
    
    const updates = {};
    if (dayOfWeek !== undefined) updates.dayOfWeek = dayOfWeek;
    if (startTime !== undefined) updates.startTime = startTime;
    if (endTime !== undefined) updates.endTime = endTime;
    if (serviceTypes !== undefined) updates.serviceTypes = serviceTypes;
    if (availableAt !== undefined) updates.availableAt = availableAt;
    if (maxBookings !== undefined) updates.maxBookings = maxBookings;
    if (isRecurring !== undefined) updates.isRecurring = isRecurring;
    
    const updatedSlot = await WorkingSlot.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      message: 'Créneau mis à jour avec succès',
      data: updatedSlot
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du créneau',
      error: error.message
    });
  }
});

// PATCH /api/working-slots/:id/book - Réserver un créneau
router.patch('/:id/book', async (req, res) => {
  try {
    const slot = await WorkingSlot.findById(req.params.id);
    
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Créneau non trouvé'
      });
    }
    
    await slot.bookSlot();
    
    res.json({
      success: true,
      message: 'Créneau réservé avec succès',
      data: slot
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// PATCH /api/working-slots/:id/release - Libérer un créneau
router.patch('/:id/release', async (req, res) => {
  try {
    const slot = await WorkingSlot.findById(req.params.id);
    
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Créneau non trouvé'
      });
    }
    
    await slot.releaseSlot();
    
    res.json({
      success: true,
      message: 'Créneau libéré avec succès',
      data: slot
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la libération du créneau',
      error: error.message
    });
  }
});

// PATCH /api/working-slots/:id/maintenance - Mettre un créneau en maintenance
router.patch('/:id/maintenance', authenticateToken, isCoiffeur, isSlotOwner, async (req, res) => {
  try {
    const { reason } = req.body;
    const slot = await WorkingSlot.findById(req.params.id);
    
    await slot.setMaintenance(reason || 'Maintenance programmée');
    
    res.json({
      success: true,
      message: 'Créneau mis en maintenance avec succès',
      data: slot
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise en maintenance du créneau',
      error: error.message
    });
  }
});

// POST /api/working-slots/:id/exceptions - Ajouter une exception
router.post('/:id/exceptions', authenticateToken, isCoiffeur, isSlotOwner, async (req, res) => {
  try {
    const { date, reason, description } = req.body;
    
    if (!date || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Date et raison sont obligatoires'
      });
    }
    
    const slot = await WorkingSlot.findById(req.params.id);
    await slot.addException(new Date(date), reason, description);
    
    res.json({
      success: true,
      message: 'Exception ajoutée avec succès',
      data: slot
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout de l\'exception',
      error: error.message
    });
  }
});

// DELETE /api/working-slots/:id - Supprimer un créneau
router.delete('/:id', authenticateToken, isCoiffeur, isSlotOwner, async (req, res) => {
  try {
    await WorkingSlot.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Créneau supprimé avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du créneau',
      error: error.message
    });
  }
});

// POST /api/working-slots/bulk - Créer plusieurs créneaux en lot
router.post('/bulk', authenticateToken, isCoiffeur, async (req, res) => {
  try {
    const { slots } = req.body;
    
    if (!Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Le tableau de créneaux est requis et ne peut pas être vide'
      });
    }
    
    const createdSlots = [];
    const errors = [];
    
    for (const slotData of slots) {
      try {
        const slot = new WorkingSlot({
          coiffeurId: req.user.id,
          ...slotData
        });
        
        await slot.save();
        createdSlots.push(slot);
      } catch (error) {
        errors.push({
          slot: slotData,
          error: error.message
        });
      }
    }
    
    res.status(201).json({
      success: true,
      message: `${createdSlots.length} créneaux créés avec succès`,
      data: createdSlots,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création des créneaux en lot',
      error: error.message
    });
  }
});

export default router;
