import express from 'express';
import { auth } from '../middleware/auth.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import {
  createPaymentIntent,
  confirmPayment,
  getOrCreateCustomer,
  createSetupIntent,
  createRefund,
  getPaymentIntent,
  listPaymentMethods,
  detachPaymentMethod,
  getCustomerIdByUserId,
  handleWebhook
} from '../services/stripeService.js';
import User from '../models/User.js';

const router = express.Router();

// Webhook Stripe (doit être avant les autres routes pour recevoir les données brutes)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    const { event } = await handleWebhook(req.body, signature);

    // Traiter différents types d'événements
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      case 'payment_intent.refunded':
        await handlePaymentRefunded(event.data.object);
        break;
      default:
        console.log(`Événement non géré: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('❌ Erreur webhook:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

// Handler pour paiement réussi
const handlePaymentSuccess = async (paymentIntent) => {
  try {
    const bookingId = paymentIntent.metadata.bookingId;
    if (!bookingId) return;

    // Mettre à jour la réservation
    const booking = await Booking.findById(bookingId);
    if (booking) {
      booking.paymentStatus = 'confirmed';
      booking.stripePaymentIntentId = paymentIntent.id;
      booking.platformFee = parseFloat(paymentIntent.metadata.platformFee || 0);
      booking.coiffeurAmount = parseFloat(paymentIntent.metadata.coiffeurAmount || 0);
      await booking.save();
    }

    // Créer ou mettre à jour l'enregistrement de paiement
    await Payment.findOneAndUpdate(
      { booking: bookingId },
      {
        $set: {
          status: 'succeeded',
          stripeChargeId: paymentIntent.latest_charge,
          updatedAt: new Date()
        }
      },
      { upsert: true, new: true }
    );

    console.log(`✅ Paiement réussi pour réservation ${bookingId}`);
  } catch (error) {
    console.error('❌ Erreur traitement paiement réussi:', error);
  }
};

// Handler pour paiement échoué
const handlePaymentFailed = async (paymentIntent) => {
  try {
    const bookingId = paymentIntent.metadata.bookingId;
    if (bookingId) {
      const booking = await Booking.findById(bookingId);
      if (booking) {
        booking.paymentStatus = 'cancelled';
        await booking.save();
      }
      await Payment.findOneAndUpdate(
        { booking: bookingId },
        { $set: { status: 'failed', updatedAt: new Date() } },
        { upsert: true, new: true }
      );
    }
  } catch (error) {
    console.error('❌ Erreur traitement paiement échoué:', error);
  }
};

// Handler pour remboursement
const handlePaymentRefunded = async (paymentIntent) => {
  try {
    const bookingId = paymentIntent.metadata.bookingId;
    if (bookingId) {
      await Payment.findOneAndUpdate(
        { booking: bookingId },
        { $set: { status: 'refunded', updatedAt: new Date() } },
        { upsert: true, new: true }
      );

      const booking = await Booking.findById(bookingId);
      if (booking) {
        booking.paymentStatus = 'refunded';
        await booking.save();
      }
    }
  } catch (error) {
    console.error('❌ Erreur traitement remboursement:', error);
  }
};

// Créer un Payment Intent pour une réservation
router.post('/create-payment-intent', auth, async (req, res) => {
  try {
    const { bookingId } = req.body; // amount n'est plus requis, calculé côté serveur

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'bookingId est requis'
      });
    }

    // Vérifier que la réservation existe et appartient au client
    const booking = await Booking.findById(bookingId)
      .populate('client')
      .populate('coiffeur');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    if (booking.client._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    // Récupérer les informations du client
    const client = await User.findById(req.user.id);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }

    // Créer ou récupérer le customer Stripe
    const customerId = await getOrCreateCustomer({
      email: client.email,
      name: client.name,
      id: client._id.toString()
    });

    // SÉCURITÉ : Ignorer le montant fourni par le client et toujours utiliser booking.price
    // Cela empêche la manipulation du montant de paiement
    const paymentAmount = booking.price;
    
    // Créer le Payment Intent
    const paymentData = await createPaymentIntent({
      amount: paymentAmount, // Toujours utiliser booking.price, ignorer amount du client
      customerId: customerId,
      bookingId: bookingId,
      metadata: {
        clientId: client._id.toString(),
        coiffeurId: booking.coiffeur._id.toString(),
        service: booking.service
      }
    });

    // Mettre à jour la réservation avec les infos Stripe
    booking.stripePaymentIntentId = paymentData.paymentIntentId;
    booking.stripeCustomerId = customerId;
    booking.platformFee = paymentData.platformFee;
    booking.coiffeurAmount = paymentData.coiffeurAmount;
    await booking.save();

    // Créer l'enregistrement de paiement
    await Payment.createPayment({
      booking: bookingId,
      client: client._id,
      coiffeur: booking.coiffeur._id,
      amount: paymentData.amount,
      stripePaymentIntentId: paymentData.paymentIntentId,
      stripeCustomerId: customerId,
      status: 'pending'
    });

    res.json({
      success: true,
      clientSecret: paymentData.clientSecret,
      paymentIntentId: paymentData.paymentIntentId,
      amount: paymentData.amount,
      platformFee: paymentData.platformFee,
      coiffeurAmount: paymentData.coiffeurAmount
    });
  } catch (error) {
    console.error('❌ Erreur création Payment Intent:', error);
    
    // Message d'erreur plus explicite si Stripe n'est pas configuré
    let errorMessage = 'Erreur lors de la création du paiement';
    if (error.message && error.message.includes('Stripe n\'est pas configuré')) {
      errorMessage = 'Stripe n\'est pas configuré. Veuillez configurer STRIPE_SECRET_KEY dans le fichier back/.env';
    } else if (error.message && error.message.includes('API key')) {
      errorMessage = 'Clé API Stripe manquante. Veuillez configurer STRIPE_SECRET_KEY=sk_test_... dans le fichier back/.env';
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message
    });
  }
});

// Confirmer un paiement
router.post('/confirm-payment', auth, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'paymentIntentId est requis'
      });
    }

    const paymentData = await confirmPayment(paymentIntentId);

    if (paymentData.success) {
      // Mettre à jour la réservation et le paiement
      const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });
      if (payment) {
        const booking = await Booking.findById(payment.booking);
        if (booking) {
          booking.paymentStatus = 'confirmed';
          await booking.save();
        }
        payment.status = 'succeeded';
        await payment.save();
      }

      res.json({
        success: true,
        paymentIntent: paymentData.paymentIntent,
        amount: paymentData.amount,
        platformFee: paymentData.platformFee,
        coiffeurAmount: paymentData.coiffeurAmount
      });
    } else {
      const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });
      if (payment) {
        const booking = await Booking.findById(payment.booking);
        if (booking) {
          booking.paymentStatus = paymentData.status === 'processing' ? 'pending' : 'cancelled';
          await booking.save();
        }
        payment.status = paymentData.status || 'failed';
        await payment.save();
      }

      res.status(400).json({
        success: false,
        status: paymentData.status,
        message: 'Le paiement n\'a pas réussi'
      });
    }
  } catch (error) {
    console.error('❌ Erreur confirmation paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la confirmation du paiement',
      error: error.message
    });
  }
});

// Créer un Setup Intent pour sauvegarder une méthode de paiement
router.post('/create-setup-intent', auth, async (req, res) => {
  try {
    const client = await User.findById(req.user.id);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }

    const customerId = await getOrCreateCustomer({
      email: client.email,
      name: client.name,
      id: client._id.toString()
    });

    const setupData = await createSetupIntent(customerId);

    res.json({
      success: true,
      clientSecret: setupData.clientSecret,
      setupIntentId: setupData.setupIntentId
    });
  } catch (error) {
    console.error('❌ Erreur création Setup Intent:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du Setup Intent',
      error: error.message
    });
  }
});

// Rembourser un paiement
router.post('/refund', auth, async (req, res) => {
  try {
    const { bookingId, amount, reason } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'bookingId est requis'
      });
    }

    const booking = await Booking.findById(bookingId)
      .populate('client')
      .populate('coiffeur');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    // Vérifier les permissions (client ou coiffeur)
    if (booking.client._id.toString() !== req.user.id && 
        booking.coiffeur._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    if (!booking.stripePaymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Aucun paiement Stripe associé à cette réservation'
      });
    }

    // Calculer le montant du remboursement si non spécifié
    let refundAmount = amount;
    if (!refundAmount) {
      // Calculer selon les frais d'annulation
      const cancellationFee = booking.getCancellationFee();
      refundAmount = booking.price - cancellationFee;
    }

    const refundData = await createRefund(
      booking.stripePaymentIntentId,
      refundAmount,
      reason || 'requested_by_customer'
    );

    // Mettre à jour la réservation et le paiement
    booking.paymentStatus = 'refunded';
    await booking.save();

    const payment = await Payment.findOne({ booking: bookingId });
    if (payment) {
      payment.status = 'refunded';
      payment.refundAmount = refundData.amount;
      payment.refundReason = reason;
      payment.stripeRefundId = refundData.refundId;
      await payment.save();
    }

    res.json({
      success: true,
      refundId: refundData.refundId,
      amount: refundData.amount,
      message: `Remboursement de ${refundData.amount}€ effectué avec succès`
    });
  } catch (error) {
    console.error('❌ Erreur remboursement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du remboursement',
      error: error.message
    });
  }
});

// Récupérer les informations d'un paiement
router.get('/payment-intent/:paymentIntentId', auth, async (req, res) => {
  try {
    const { paymentIntentId } = req.params;

    const paymentIntent = await getPaymentIntent(paymentIntentId);

    res.json({
      success: true,
      paymentIntent
    });
  } catch (error) {
    console.error('❌ Erreur récupération Payment Intent:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du paiement',
      error: error.message
    });
  }
});

// Lister les méthodes de paiement sauvegardées
router.get('/payment-methods', auth, async (req, res) => {
  try {
    const client = await User.findById(req.user.id);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }

    // Récupérer ou créer le customer Stripe
    const customerId = await getOrCreateCustomer({
      email: client.email,
      name: client.name,
      id: client._id.toString()
    });

    // Lister les méthodes de paiement
    const paymentMethods = await listPaymentMethods(customerId);

    res.json({
      success: true,
      paymentMethods
    });
  } catch (error) {
    console.error('❌ Erreur récupération méthodes de paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des méthodes de paiement',
      error: error.message
    });
  }
});

// Supprimer une méthode de paiement
router.delete('/payment-methods/:paymentMethodId', auth, async (req, res) => {
  try {
    const { paymentMethodId } = req.params;

    if (!paymentMethodId) {
      return res.status(400).json({
        success: false,
        message: 'paymentMethodId est requis'
      });
    }

    // Vérifier que la méthode de paiement appartient au client
    const client = await User.findById(req.user.id);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }

    const customerId = await getOrCreateCustomer({
      email: client.email,
      name: client.name,
      id: client._id.toString()
    });

    // Vérifier que la méthode de paiement appartient au customer
    const paymentMethods = await listPaymentMethods(customerId);
    const paymentMethod = paymentMethods.find(pm => pm.id === paymentMethodId);

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Méthode de paiement non trouvée ou n\'appartient pas à ce client'
      });
    }

    // Supprimer la méthode de paiement
    const result = await detachPaymentMethod(paymentMethodId);

    res.json({
      success: true,
      message: 'Méthode de paiement supprimée avec succès',
      ...result
    });
  } catch (error) {
    console.error('❌ Erreur suppression méthode de paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la méthode de paiement',
      error: error.message
    });
  }
});

export default router;

