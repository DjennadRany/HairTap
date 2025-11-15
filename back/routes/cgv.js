import express from 'express';
import CGV from '../models/CGV.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Récupérer les CGV actives
router.get('/active', async (req, res) => {
  try {
    const cgv = await CGV.getActiveCGV();
    
    if (!cgv) {
      // ✅ CORRECTION: Retourner 200 avec success: false au lieu de 404
      // Cela permet au frontend de gérer l'absence de CGV sans erreur
      return res.status(200).json({
        success: false,
        message: 'Aucune CGV active trouvée',
        data: null
      });
    }

    res.json({
      success: true,
      data: {
        version: cgv.version,
        content: cgv.content,
        effectiveDate: cgv.effectiveDate
      }
    });
  } catch (error) {
    console.error('Get active CGV error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des CGV'
    });
  }
});

// Récupérer une version spécifique des CGV
router.get('/version/:version', async (req, res) => {
  try {
    const { version } = req.params;
    const cgv = await CGV.getByVersion(version);
    
    if (!cgv) {
      return res.status(404).json({
        success: false,
        message: `CGV version ${version} non trouvée`
      });
    }

    res.json({
      success: true,
      data: {
        version: cgv.version,
        content: cgv.content,
        effectiveDate: cgv.effectiveDate
      }
    });
  } catch (error) {
    console.error('Get CGV by version error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des CGV'
    });
  }
});

// Créer ou mettre à jour les CGV (admin uniquement)
router.post('/', auth, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Seuls les administrateurs peuvent créer/modifier les CGV'
      });
    }

    const { version, content, isActive } = req.body;

    if (!version || !content) {
      return res.status(400).json({
        success: false,
        message: 'Version et contenu requis'
      });
    }

    // Désactiver les anciennes CGV si on active une nouvelle version
    if (isActive) {
      await CGV.updateMany({ isActive: true }, { isActive: false });
    }

    // Créer ou mettre à jour les CGV
    const cgv = await CGV.findOneAndUpdate(
      { version },
      {
        version,
        content,
        isActive: isActive !== undefined ? isActive : true,
        effectiveDate: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      data: cgv,
      message: 'CGV créées/mises à jour avec succès'
    });
  } catch (error) {
    console.error('Create/update CGV error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création/mise à jour des CGV'
    });
  }
});

// Enregistrer l'acceptation des CGV par un utilisateur
router.post('/accept', auth, async (req, res) => {
  try {
    const { version } = req.body;

    if (!version) {
      return res.status(400).json({
        success: false,
        message: 'Version des CGV requise'
      });
    }

    // Vérifier que la version existe
    const cgv = await CGV.getByVersion(version);
    if (!cgv) {
      return res.status(404).json({
        success: false,
        message: `CGV version ${version} non trouvée`
      });
    }

    // Enregistrer l'acceptation dans le modèle User (à ajouter si nécessaire)
    // Pour l'instant, on retourne juste un succès
    // TODO: Ajouter un champ cgvAccepted dans le modèle User

    res.json({
      success: true,
      message: 'CGV acceptées avec succès',
      data: {
        version,
        acceptedAt: new Date(),
        userId: req.user.id
      }
    });
  } catch (error) {
    console.error('Accept CGV error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'acceptation des CGV'
    });
  }
});

export default router;

