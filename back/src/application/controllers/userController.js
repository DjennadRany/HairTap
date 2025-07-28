import User from '../../models/User.js';
import { validateSiren } from '../../utils/sirenValidator.js';
import { uploadImage } from '../../utils/imageUploader.js';

export const userController = {
  // Récupérer un utilisateur par ID
  getUser: async (req, res) => {
    try {
      const user = await User.findById(req.params.id).select('-password');
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  },

  // Récupérer tous les coiffeurs
  getAllCoiffeurs: async (req, res) => {
    try {
      const coiffeurs = await User.find({ role: 'coiffeur' })
        .select('-password')
        .sort({ rating: -1 });
      res.json(coiffeurs);
    } catch (error) {
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  },

  // Mettre à jour un utilisateur
  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Vérifier si l'utilisateur existe
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      // Vérifier si l'utilisateur est autorisé à modifier ce profil
      if (req.user._id.toString() !== id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Non autorisé' });
      }

      // Si c'est un coiffeur et qu'il met à jour son SIREN
      if (user.role === 'coiffeur' && updateData.siren) {
        const isValidSiren = await validateSiren(updateData.siren);
        if (!isValidSiren) {
          return res.status(400).json({ message: 'Numéro SIREN invalide' });
        }
        updateData.sirenStatus = 'verified';
        updateData.sirenVerificationDate = new Date();
      }

      // Gérer l'upload d'images pour la galerie
      if (updateData.gallery && Array.isArray(updateData.gallery)) {
        const uploadedImages = await Promise.all(
          updateData.gallery.map(async (image) => {
            if (image.url.startsWith('data:')) {
              const uploadedUrl = await uploadImage(image.url);
              return {
                ...image,
                url: uploadedUrl,
                isVerified: false
              };
            }
            return image;
          })
        );
        updateData.gallery = uploadedImages;
      }

      // Mettre à jour l'utilisateur
      const updatedUser = await User.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select('-password');

      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  },

  // Ajouter un service
  addService: async (req, res) => {
    try {
      const { id } = req.params;
      const serviceData = req.body;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      if (user.role !== 'coiffeur') {
        return res.status(400).json({ message: 'Seuls les coiffeurs peuvent ajouter des services' });
      }

      // Gérer l'upload d'image pour le service
      if (serviceData.image && serviceData.image.startsWith('data:')) {
        serviceData.image = await uploadImage(serviceData.image);
      }

      user.services.push(serviceData);
      await user.save();

      res.json(user.services);
    } catch (error) {
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  },

  // Mettre à jour un service
  updateService: async (req, res) => {
    try {
      const { id, serviceId } = req.params;
      const serviceData = req.body;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      const serviceIndex = user.services.findIndex(s => s._id.toString() === serviceId);
      if (serviceIndex === -1) {
        return res.status(404).json({ message: 'Service non trouvé' });
      }

      // Gérer l'upload d'image pour le service
      if (serviceData.image && serviceData.image.startsWith('data:')) {
        serviceData.image = await uploadImage(serviceData.image);
      }

      user.services[serviceIndex] = {
        ...user.services[serviceIndex],
        ...serviceData
      };

      await user.save();
      res.json(user.services[serviceIndex]);
    } catch (error) {
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  },

  // Supprimer un service
  deleteService: async (req, res) => {
    try {
      const { id, serviceId } = req.params;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      user.services = user.services.filter(s => s._id.toString() !== serviceId);
      await user.save();

      res.json({ message: 'Service supprimé avec succès' });
    } catch (error) {
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  },

  // Ajouter un post social
  addSocialPost: async (req, res) => {
    try {
      const { id } = req.params;
      const postData = req.body;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      if (user.role !== 'coiffeur') {
        return res.status(400).json({ message: 'Seuls les coiffeurs peuvent publier' });
      }

      // Gérer l'upload des images
      if (postData.images && Array.isArray(postData.images)) {
        const uploadedImages = await Promise.all(
          postData.images.map(async (image) => {
            if (image.startsWith('data:')) {
              return await uploadImage(image);
            }
            return image;
          })
        );
        postData.images = uploadedImages;
      }

      const newPost = {
        ...postData,
        createdAt: new Date(),
        likes: 0,
        comments: []
      };

      user.socialPosts.push(newPost);
      await user.save();

      res.json(newPost);
    } catch (error) {
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  },

  // Mettre à jour un post social
  updateSocialPost: async (req, res) => {
    try {
      const { id, postId } = req.params;
      const postData = req.body;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      const postIndex = user.socialPosts.findIndex(p => p._id.toString() === postId);
      if (postIndex === -1) {
        return res.status(404).json({ message: 'Publication non trouvée' });
      }

      // Gérer l'upload des nouvelles images
      if (postData.images && Array.isArray(postData.images)) {
        const uploadedImages = await Promise.all(
          postData.images.map(async (image) => {
            if (image.startsWith('data:')) {
              return await uploadImage(image);
            }
            return image;
          })
        );
        postData.images = uploadedImages;
      }

      user.socialPosts[postIndex] = {
        ...user.socialPosts[postIndex],
        ...postData
      };

      await user.save();
      res.json(user.socialPosts[postIndex]);
    } catch (error) {
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  },

  // Supprimer un post social
  deleteSocialPost: async (req, res) => {
    try {
      const { id, postId } = req.params;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      user.socialPosts = user.socialPosts.filter(p => p._id.toString() !== postId);
      await user.save();

      res.json({ message: 'Publication supprimée avec succès' });
    } catch (error) {
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  },

  // Bloquer un utilisateur
  blockUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { blockedUserId } = req.body;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      if (!user.blockedUsers.includes(blockedUserId)) {
        user.blockedUsers.push(blockedUserId);
        await user.save();
      }

      res.json({ message: 'Utilisateur bloqué avec succès' });
    } catch (error) {
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  },

  // Débloquer un utilisateur
  unblockUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { blockedUserId } = req.body;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== blockedUserId);
      await user.save();

      res.json({ message: 'Utilisateur débloqué avec succès' });
    } catch (error) {
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  }
}; 