import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coiffeur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  // Commission de TapHair (10%)
  platformFee: {
    type: Number,
    required: true,
    default: 0
  },
  // Montant net pour le coiffeur (90%)
  coiffeurAmount: {
    type: Number,
    required: true,
    default: 0
  },
  // Informations Stripe
  stripePaymentIntentId: {
    type: String,
    required: true
  },
  stripeCustomerId: {
    type: String
  },
  stripeChargeId: {
    type: String
  },
  // Méthode de paiement
  paymentMethod: {
    type: String,
    enum: ['card', 'sepa_debit', 'bancontact', 'ideal', 'other'],
    default: 'card'
  },
  // Statut du paiement
  status: {
    type: String,
    enum: ['pending', 'succeeded', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  // Informations de remboursement
  refundAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  refundReason: {
    type: String
  },
  stripeRefundId: {
    type: String
  },
  // Métadonnées
  metadata: {
    type: Map,
    of: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index pour améliorer les performances
paymentSchema.index({ 'booking': 1 });
paymentSchema.index({ 'client': 1 });
paymentSchema.index({ 'coiffeur': 1 });
paymentSchema.index({ 'stripePaymentIntentId': 1 });
paymentSchema.index({ 'status': 1 });

// Méthode pour calculer les montants (10% commission)
paymentSchema.methods.calculateAmounts = function(amount) {
  this.amount = amount;
  this.platformFee = Math.round(amount * 0.10 * 100) / 100; // 10% arrondi à 2 décimales
  this.coiffeurAmount = Math.round(amount * 0.90 * 100) / 100; // 90% arrondi à 2 décimales
};

// Méthode pour calculer le remboursement
paymentSchema.methods.calculateRefund = function(refundPercentage) {
  const refundAmount = Math.round(this.amount * refundPercentage * 100) / 100;
  const refundPlatformFee = Math.round(this.platformFee * refundPercentage * 100) / 100;
  const refundCoiffeurAmount = Math.round(this.coiffeurAmount * refundPercentage * 100) / 100;
  
  return {
    totalRefund: refundAmount,
    platformFeeRefund: refundPlatformFee,
    coiffeurAmountRefund: refundCoiffeurAmount
  };
};

// Méthode statique pour créer un paiement
paymentSchema.statics.createPayment = async function(data) {
  const payment = new this(data);
  payment.calculateAmounts(data.amount);
  return payment.save();
};

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;

