import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement depuis le répertoire racine du backend
const envPath = path.join(__dirname, '..', '.env');
const envExists = dotenv.config({ path: envPath });

// Afficher un avertissement si .env n'existe pas
if (envExists.error) {
  console.warn('⚠️ Fichier .env non trouvé dans back/');
  console.warn('⚠️ Créez le fichier back/.env avec STRIPE_SECRET_KEY=sk_test_...');
  console.warn('⚠️ Chemin cherché:', envPath);
} else {
  console.log('✅ Fichier .env chargé depuis:', envPath);
  // Vérifier si la clé est présente (sans afficher sa valeur)
  if (process.env.STRIPE_SECRET_KEY) {
    console.log('✅ STRIPE_SECRET_KEY trouvée (longueur:', process.env.STRIPE_SECRET_KEY.length, 'caractères)');
  } else {
    console.warn('⚠️ STRIPE_SECRET_KEY non trouvée dans process.env');
  }
}

// Commission TapHair : 10%
const PLATFORM_FEE_PERCENTAGE = 0.10;

// Vérifier que la clé Stripe est configurée
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY non configurée dans .env');
  console.error('❌ Ajoutez STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx dans votre fichier back/.env');
  console.error('❌ Chemin actuel:', envPath);
  console.error('❌ Fichier existe:', fs.existsSync(envPath));
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const hasStripeKey = envContent.includes('STRIPE_SECRET_KEY');
    console.error('❌ STRIPE_SECRET_KEY présent dans fichier:', hasStripeKey);
    if (hasStripeKey) {
      const match = envContent.match(/STRIPE_SECRET_KEY=(.+)/);
      if (match) {
        console.error('❌ Valeur trouvée (longueur):', match[1].trim().length, 'caractères');
      }
    }
  }
} else {
  console.log('✅ STRIPE_SECRET_KEY configurée correctement (longueur:', process.env.STRIPE_SECRET_KEY.length, 'caractères)');
}

// Initialiser Stripe avec la clé secrète
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
    })
  : null;

/**
 * Créer un Payment Intent pour une réservation
 * @param {Object} params - Paramètres du paiement
 * @param {Number} params.amount - Montant en euros
 * @param {String} params.customerId - ID Stripe du client
 * @param {String} params.bookingId - ID de la réservation
 * @param {String} params.metadata - Métadonnées additionnelles
 * @returns {Promise<Object>} Payment Intent créé
 */
export const createPaymentIntent = async ({
  amount,
  customerId,
  bookingId,
  metadata = {}
}) => {
  try {
    // Vérifier que Stripe est initialisé
    if (!stripe) {
      throw new Error('Stripe n\'est pas configuré. Veuillez configurer STRIPE_SECRET_KEY dans votre fichier .env');
    }

    // Convertir en centimes (Stripe utilise les centimes)
    const amountInCents = Math.round(amount * 100);
    
    // Calculer la commission (10%)
    const platformFee = Math.round(amountInCents * PLATFORM_FEE_PERCENTAGE);
    const coiffeurAmount = amountInCents - platformFee;

    // Créer le Payment Intent avec possibilité de réutiliser les méthodes sauvegardées
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'eur',
      customer: customerId,
      automatic_payment_methods: {
        enabled: true,
      },
      // Permettre la sauvegarde de la méthode de paiement pour réutilisation future
      setup_future_usage: 'off_session',
      metadata: {
        bookingId: bookingId,
        platformFee: (platformFee / 100).toFixed(2),
        coiffeurAmount: (coiffeurAmount / 100).toFixed(2),
        ...metadata
      },
      description: `Paiement réservation TapHair - Booking #${bookingId}`,
    });

    return {
      success: true,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: amount,
      platformFee: platformFee / 100,
      coiffeurAmount: coiffeurAmount / 100,
      paymentIntent
    };
  } catch (error) {
    console.error('❌ Erreur création Payment Intent:', error);
    throw new Error(`Erreur Stripe: ${error.message}`);
  }
};

/**
 * Confirmer un paiement
 * @param {String} paymentIntentId - ID du Payment Intent
 * @returns {Promise<Object>} Payment Intent confirmé
 */
export const confirmPayment = async (paymentIntentId) => {
  try {
    // Vérifier que Stripe est initialisé
    if (!stripe) {
      throw new Error('Stripe n\'est pas configuré. Veuillez configurer STRIPE_SECRET_KEY dans votre fichier .env');
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      return {
        success: true,
        paymentIntent,
        amount: paymentIntent.amount / 100,
        platformFee: parseFloat(paymentIntent.metadata.platformFee || 0),
        coiffeurAmount: parseFloat(paymentIntent.metadata.coiffeurAmount || 0),
      };
    }

    return {
      success: false,
      status: paymentIntent.status,
      paymentIntent
    };
  } catch (error) {
    console.error('❌ Erreur confirmation paiement:', error);
    throw new Error(`Erreur Stripe: ${error.message}`);
  }
};

/**
 * Créer ou récupérer un customer Stripe
 * @param {Object} userData - Données de l'utilisateur
 * @param {String} userData.email - Email du client
 * @param {String} userData.name - Nom du client
 * @param {String} userData.id - ID utilisateur TapHair
 * @returns {Promise<String>} Customer ID Stripe
 */
export const getOrCreateCustomer = async ({ email, name, id }) => {
  try {
    // Vérifier que Stripe est initialisé
    if (!stripe) {
      throw new Error('Stripe n\'est pas configuré. Veuillez configurer STRIPE_SECRET_KEY dans votre fichier .env');
    }

    // Rechercher un customer existant par email
    const customers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (customers.data.length > 0) {
      return customers.data[0].id;
    }

    // Créer un nouveau customer
    const customer = await stripe.customers.create({
      email: email,
      name: name,
      metadata: {
        taphairUserId: id,
      },
    });

    return customer.id;
  } catch (error) {
    console.error('❌ Erreur création customer:', error);
    throw new Error(`Erreur Stripe: ${error.message}`);
  }
};

/**
 * Créer un Setup Intent pour sauvegarder une méthode de paiement
 * @param {String} customerId - ID Stripe du client
 * @returns {Promise<Object>} Setup Intent créé
 */
export const createSetupIntent = async (customerId) => {
  try {
    // Vérifier que Stripe est initialisé
    if (!stripe) {
      throw new Error('Stripe n\'est pas configuré. Veuillez configurer STRIPE_SECRET_KEY dans votre fichier .env');
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card', 'sepa_debit'],
    });

    return {
      success: true,
      setupIntentId: setupIntent.id,
      clientSecret: setupIntent.client_secret,
      setupIntent
    };
  } catch (error) {
    console.error('❌ Erreur création Setup Intent:', error);
    throw new Error(`Erreur Stripe: ${error.message}`);
  }
};

/**
 * Rembourser un paiement
 * @param {String} paymentIntentId - ID du Payment Intent
 * @param {Number} amount - Montant à rembourser (en euros, null = remboursement total)
 * @param {String} reason - Raison du remboursement
 * @returns {Promise<Object>} Remboursement créé
 */
export const createRefund = async (paymentIntentId, amount = null, reason = 'requested_by_customer') => {
  try {
    // Vérifier que Stripe est initialisé
    if (!stripe) {
      throw new Error('Stripe n\'est pas configuré. Veuillez configurer STRIPE_SECRET_KEY dans votre fichier .env');
    }

    const refundParams = {
      payment_intent: paymentIntentId,
      reason: reason,
    };

    // Si un montant partiel est spécifié, le convertir en centimes
    if (amount !== null) {
      refundParams.amount = Math.round(amount * 100);
    }

    const refund = await stripe.refunds.create(refundParams);

    return {
      success: true,
      refundId: refund.id,
      amount: refund.amount / 100,
      refund
    };
  } catch (error) {
    console.error('❌ Erreur remboursement:', error);
    throw new Error(`Erreur Stripe: ${error.message}`);
  }
};

/**
 * Récupérer les informations d'un paiement
 * @param {String} paymentIntentId - ID du Payment Intent
 * @returns {Promise<Object>} Informations du paiement
 */
export const getPaymentIntent = async (paymentIntentId) => {
  try {
    // Vérifier que Stripe est initialisé
    if (!stripe) {
      throw new Error('Stripe n\'est pas configuré. Veuillez configurer STRIPE_SECRET_KEY dans votre fichier .env');
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    console.error('❌ Erreur récupération Payment Intent:', error);
    throw new Error(`Erreur Stripe: ${error.message}`);
  }
};

/**
 * Lister les méthodes de paiement sauvegardées d'un client
 * @param {String} customerId - ID Stripe du client
 * @returns {Promise<Array>} Liste des méthodes de paiement
 */
export const listPaymentMethods = async (customerId) => {
  try {
    // Vérifier que Stripe est initialisé
    if (!stripe) {
      throw new Error('Stripe n\'est pas configuré. Veuillez configurer STRIPE_SECRET_KEY dans votre fichier .env');
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    // Formater les méthodes de paiement pour l'affichage
    return paymentMethods.data.map(pm => ({
      id: pm.id,
      type: pm.type,
      card: {
        brand: pm.card?.brand,
        last4: pm.card?.last4,
        expMonth: pm.card?.exp_month,
        expYear: pm.card?.exp_year,
      },
      billingDetails: pm.billing_details,
      created: pm.created,
    }));
  } catch (error) {
    console.error('❌ Erreur récupération méthodes de paiement:', error);
    throw new Error(`Erreur Stripe: ${error.message}`);
  }
};

/**
 * Supprimer une méthode de paiement
 * @param {String} paymentMethodId - ID de la méthode de paiement
 * @returns {Promise<Object>} Méthode de paiement supprimée
 */
export const detachPaymentMethod = async (paymentMethodId) => {
  try {
    // Vérifier que Stripe est initialisé
    if (!stripe) {
      throw new Error('Stripe n\'est pas configuré. Veuillez configurer STRIPE_SECRET_KEY dans votre fichier .env');
    }

    const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId);
    
    return {
      success: true,
      paymentMethod: {
        id: paymentMethod.id,
        detached: paymentMethod.customer === null,
      },
    };
  } catch (error) {
    console.error('❌ Erreur suppression méthode de paiement:', error);
    throw new Error(`Erreur Stripe: ${error.message}`);
  }
};

/**
 * Récupérer le customer ID d'un utilisateur
 * @param {String} userId - ID utilisateur TapHair
 * @returns {Promise<String|null>} Customer ID Stripe ou null
 */
export const getCustomerIdByUserId = async (userId) => {
  try {
    // Vérifier que Stripe est initialisé
    if (!stripe) {
      throw new Error('Stripe n\'est pas configuré. Veuillez configurer STRIPE_SECRET_KEY dans votre fichier .env');
    }

    // Rechercher le customer par metadata
    const customers = await stripe.customers.list({
      limit: 100,
    });

    const customer = customers.data.find(c => c.metadata?.taphairUserId === userId);
    
    return customer ? customer.id : null;
  } catch (error) {
    console.error('❌ Erreur récupération customer ID:', error);
    throw new Error(`Erreur Stripe: ${error.message}`);
  }
};

/**
 * Webhook handler pour traiter les événements Stripe
 * @param {String} payload - Payload brut du webhook
 * @param {String} signature - Signature du webhook
 * @returns {Promise<Object>} Événement vérifié
 */
export const handleWebhook = async (payload, signature) => {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET non configuré');
    }

    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );

    return {
      success: true,
      event
    };
  } catch (error) {
    console.error('❌ Erreur webhook Stripe:', error);
    throw new Error(`Erreur webhook: ${error.message}`);
  }
};

export default stripe;

