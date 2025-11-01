import express from 'express';
import Comment from '../models/Comment.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/comments/service/:serviceId - Récupérer les commentaires d'un service
router.get('/service/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const comments = await Comment.find({ service: serviceId })
      .populate('author', 'name profilePicture photo')
      .populate('replies.author', 'name profilePicture photo')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    res.json({
      success: true,
      data: comments,
      count: comments.length
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des commentaires' 
    });
  }
});

// POST /api/comments - Créer un nouveau commentaire
router.post('/', auth, async (req, res) => {
  try {
    const { serviceId, coiffeurId, content } = req.body;
    const userId = req.user._id;

    if (!serviceId || !coiffeurId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Service, coiffeur et contenu requis'
      });
    }

    const comment = new Comment({
      service: serviceId,
      coiffeur: coiffeurId,
      author: userId,
      content: content.trim()
    });

    await comment.save();
    await comment.populate('author', 'name profilePicture photo');

    res.status(201).json({
      success: true,
      data: comment,
      message: 'Commentaire ajouté'
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la création du commentaire' 
    });
  }
});

// POST /api/comments/:commentId/like - Liker/unliker un commentaire
router.post('/:commentId/like', auth, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Commentaire non trouvé'
      });
    }

    const isLiked = comment.isLikedBy(userId);
    
    if (isLiked) {
      await comment.removeLike(userId);
    } else {
      await comment.addLike(userId);
    }

    res.json({
      success: true,
      data: {
        likes: comment.likes.length,
        isLiked: !isLiked
      },
      message: isLiked ? 'Like retiré' : 'Commentaire liké'
    });
  } catch (error) {
    console.error('Toggle comment like error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du like/unlike' 
    });
  }
});

// POST /api/comments/:commentId/reply - Ajouter une réponse à un commentaire
router.post('/:commentId/reply', auth, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Contenu de la réponse requis'
      });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Commentaire non trouvé'
      });
    }

    await comment.addReply(userId, content.trim());
    await comment.populate('replies.author', 'name profilePicture photo');

    res.json({
      success: true,
      data: comment.replies[comment.replies.length - 1],
      message: 'Réponse ajoutée'
    });
  } catch (error) {
    console.error('Add reply error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'ajout de la réponse' 
    });
  }
});

// POST /api/comments/:commentId/replies/:replyIndex/like - Liker une réponse
router.post('/:commentId/replies/:replyIndex/like', auth, async (req, res) => {
  try {
    const { commentId, replyIndex } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Commentaire non trouvé'
      });
    }

    const reply = comment.replies[parseInt(replyIndex)];
    if (!reply) {
      return res.status(404).json({
        success: false,
        message: 'Réponse non trouvée'
      });
    }

    const isLiked = reply.likes.some(id => id.toString() === userId.toString());
    
    if (isLiked) {
      await comment.unlikeReply(parseInt(replyIndex), userId);
    } else {
      await comment.likeReply(parseInt(replyIndex), userId);
    }

    res.json({
      success: true,
      data: {
        likes: reply.likes.length,
        isLiked: !isLiked
      },
      message: isLiked ? 'Like retiré' : 'Réponse likée'
    });
  } catch (error) {
    console.error('Toggle reply like error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du like/unlike de la réponse' 
    });
  }
});

// DELETE /api/comments/:commentId - Supprimer un commentaire
router.delete('/:commentId', auth, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Commentaire non trouvé'
      });
    }

    // Vérifier que l'utilisateur est l'auteur du commentaire
    if (comment.author.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à supprimer ce commentaire'
      });
    }

    await Comment.findByIdAndDelete(commentId);

    res.json({
      success: true,
      message: 'Commentaire supprimé'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la suppression du commentaire' 
    });
  }
});

export default router;

