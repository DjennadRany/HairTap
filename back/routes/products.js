import express from 'express';
import { auth } from '../middleware/auth.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

const router = express.Router();

// Récupérer tous les produits d'un coiffeur
router.get('/:coiffeurId', async (req, res) => {
  try {
    const { coiffeurId } = req.params;
    
    const coiffeur = await User.findById(coiffeurId);
    if (!coiffeur || coiffeur.role !== 'coiffeur') {
      return res.status(404).json({ message: 'Coiffeur non trouvé' });
    }

    const products = await Product.find({ 
      coiffeur: coiffeurId, 
      isActive: true 
    }).sort({ createdAt: -1 });

    // Ajouter isLiked si l'utilisateur est connecté
    if (req.user) {
      const productsWithLikes = products.map(product => ({
        ...product.toObject(),
        isLiked: product.likedBy.includes(req.user._id)
      }));
      return res.json(productsWithLikes);
    }

    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des produits' });
  }
});

// Ajouter un produit
router.post('/:coiffeurId', auth, async (req, res) => {
  try {
    console.log('🔍 POST /api/products/:coiffeurId - Début');
    const { coiffeurId } = req.params;
    const productData = req.body;
    
    console.log('📦 Données reçues:', { coiffeurId, productData });
    
    const coiffeur = await User.findById(coiffeurId);
    if (!coiffeur || coiffeur.role !== 'coiffeur') {
      console.log('❌ Coiffeur non trouvé ou pas un coiffeur');
      return res.status(404).json({ message: 'Coiffeur non trouvé' });
    }

    console.log('👤 Utilisateur connecté:', req.user);
    if (req.user._id.toString() !== coiffeurId && req.user.role !== 'admin') {
      console.log('❌ Non autorisé');
      return res.status(403).json({ message: 'Non autorisé' });
    }

    console.log('✅ Création du produit...');
    const newProduct = new Product({
      ...productData,
      coiffeur: coiffeurId,
      isActive: true
    });

    console.log('💾 Sauvegarde du produit...');
    await newProduct.save();
    console.log('✅ Produit créé avec succès:', newProduct._id);
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('❌ Add product error:', error);
    res.status(500).json({ message: 'Erreur lors de l\'ajout du produit', error: error.message });
  }
});

// Modifier un produit
router.put('/:coiffeurId/:productId', auth, async (req, res) => {
  try {
    const { coiffeurId, productId } = req.params;
    const updateData = req.body;
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Produit introuvable' });
    }

    if (product.coiffeur.toString() !== coiffeurId) {
      return res.status(400).json({ message: 'Produit ne correspond pas au coiffeur' });
    }

    if (req.user._id.toString() !== coiffeurId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      updateData,
      { new: true }
    );

    res.json(updatedProduct);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Erreur lors de la modification du produit' });
  }
});

// Supprimer un produit
router.delete('/:coiffeurId/:productId', auth, async (req, res) => {
  try {
    const { coiffeurId, productId } = req.params;
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Produit introuvable' });
    }

    if (product.coiffeur.toString() !== coiffeurId) {
      return res.status(400).json({ message: 'Produit ne correspond pas au coiffeur' });
    }

    if (req.user._id.toString() !== coiffeurId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    await Product.findByIdAndDelete(productId);
    res.json({ message: 'Produit supprimé avec succès' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression du produit' });
  }
});

// Toggle like d'un produit
router.post('/:coiffeurId/:productId/like', auth, async (req, res) => {
  try {
    const { coiffeurId, productId } = req.params;
    const userId = req.user._id;
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Produit introuvable' });
    }

    if (product.coiffeur.toString() !== coiffeurId) {
      return res.status(400).json({ message: 'Produit ne correspond pas au coiffeur' });
    }

    const hasLiked = product.likedBy.includes(userId);
    
    if (hasLiked) {
      await product.removeLike(userId);
    } else {
      await product.addLike(userId);
    }

    res.json({ 
      likes: product.likes,
      isLiked: !hasLiked
    });
  } catch (error) {
    console.error('Toggle product like error:', error);
    res.status(500).json({ message: 'Erreur lors du like/unlike' });
  }
});

// Récupérer les statistiques de likes pour un coiffeur
router.get('/:coiffeurId/likes-stats', auth, async (req, res) => {
  try {
    const { coiffeurId } = req.params;
    
    if (req.user._id.toString() !== coiffeurId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const products = await Product.find({ coiffeur: coiffeurId });
    const totalLikes = products.reduce((sum, product) => sum + product.likes, 0);
    
    res.json({
      totalProducts: products.length,
      totalLikes: totalLikes,
      averageLikes: products.length > 0 ? (totalLikes / products.length).toFixed(1) : 0
    });
  } catch (error) {
    console.error('Get likes stats error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des statistiques' });
  }
});

export default router; 