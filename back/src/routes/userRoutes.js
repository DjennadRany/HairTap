import express from 'express';
import { userController } from '../controllers/userController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Routes publiques
router.get('/coiffeurs', userController.getAllCoiffeurs);
router.get('/:id', userController.getUser);

// Routes protégées
router.use(authMiddleware);

// Routes de gestion du profil
router.put('/:id', userController.updateUser);

// Routes de gestion des services
router.post('/:id/services', userController.addService);
router.put('/:id/services/:serviceId', userController.updateService);
router.delete('/:id/services/:serviceId', userController.deleteService);

// Routes de gestion des posts sociaux
router.post('/:id/posts', userController.addSocialPost);
router.put('/:id/posts/:postId', userController.updateSocialPost);
router.delete('/:id/posts/:postId', userController.deleteSocialPost);

// Routes de gestion des utilisateurs bloqués
router.post('/:id/block', userController.blockUser);
router.post('/:id/unblock', userController.unblockUser);

export default router; 