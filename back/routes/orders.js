import express from 'express';
import { auth } from '../middleware/auth.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

const router = express.Router();

// Créer une nouvelle commande
router.post('/create', auth, async (req, res) => {
  try {
    const {
      productId,
      coiffeurId,
      quantity,
      deliveryOption,
      deliveryAddress,
      customerInfo
    } = req.body;

    // Vérifier que le produit existe
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Produit introuvable' });
    }

    // Vérifier que le coiffeur existe
    const coiffeur = await User.findById(coiffeurId);
    if (!coiffeur || coiffeur.role !== 'coiffeur') {
      return res.status(404).json({ message: 'Coiffeur non trouvé' });
    }

    // Vérifier que le produit appartient au coiffeur
    if (product.coiffeur.toString() !== coiffeurId) {
      return res.status(400).json({ message: 'Produit ne correspond pas au coiffeur' });
    }

    // Calculer les frais de livraison
    let deliveryFee = 0;
    if (deliveryOption === 'delivery') {
      deliveryFee = 5; // Frais de livraison standard
    } else if (deliveryOption === 'coiffeur') {
      deliveryFee = 8; // Frais de livraison coiffeur
    }

    // Créer la commande
    const newOrder = new Order({
      product: productId,
      coiffeur: coiffeurId,
      customer: req.user._id,
      quantity: quantity,
      unitPrice: product.price,
      deliveryOption: deliveryOption,
      deliveryAddress: deliveryOption !== 'pickup' ? deliveryAddress : undefined,
      deliveryFee: deliveryFee,
      customerInfo: customerInfo,
      status: 'pending',
      paymentMethod: 'pending'
    });

    await newOrder.save();

    // Populate les références pour la réponse
    await newOrder.populate(['product', 'coiffeur', 'customer']);

    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Erreur lors de la création de la commande' });
  }
});

// Récupérer les commandes d'un coiffeur
router.get('/coiffeur/:coiffeurId', auth, async (req, res) => {
  try {
    const { coiffeurId } = req.params;
    const { status } = req.query;

    // Vérifier les autorisations
    if (req.user._id.toString() !== coiffeurId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    let query = { coiffeur: coiffeurId };
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('product')
      .populate('customer', 'name email')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Get coiffeur orders error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des commandes' });
  }
});

// Récupérer les commandes d'un client
router.get('/customer/:customerId', auth, async (req, res) => {
  try {
    const { customerId } = req.params;

    // Vérifier les autorisations
    if (req.user._id.toString() !== customerId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const orders = await Order.find({ customer: customerId })
      .populate('product')
      .populate('coiffeur', 'name')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Get customer orders error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des commandes' });
  }
});

// Mettre à jour le statut d'une commande
router.put('/:orderId/status', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Commande introuvable' });
    }

    // Vérifier les autorisations (coiffeur ou admin)
    if (req.user._id.toString() !== order.coiffeur.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Mettre à jour le statut selon la méthode appropriée
    switch (status) {
      case 'paid':
        await order.markAsPaid();
        break;
      case 'shipped':
        await order.markAsShipped();
        break;
      case 'delivered':
        await order.markAsDelivered();
        break;
      case 'cancelled':
        await order.cancel();
        break;
      default:
        order.status = status;
        await order.save();
    }

    await order.populate(['product', 'customer']);
    res.json(order);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du statut' });
  }
});

// Récupérer les statistiques de ventes pour un coiffeur
router.get('/coiffeur/:coiffeurId/stats', auth, async (req, res) => {
  try {
    const { coiffeurId } = req.params;

    // Vérifier les autorisations
    if (req.user._id.toString() !== coiffeurId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const orders = await Order.find({ coiffeur: coiffeurId });
    
    const stats = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + order.totalPrice, 0),
      pendingOrders: orders.filter(order => order.status === 'pending').length,
      paidOrders: orders.filter(order => order.status === 'paid').length,
      shippedOrders: orders.filter(order => order.status === 'shipped').length,
      deliveredOrders: orders.filter(order => order.status === 'delivered').length,
      cancelledOrders: orders.filter(order => order.status === 'cancelled').length
    };

    res.json(stats);
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des statistiques' });
  }
});

export default router; 