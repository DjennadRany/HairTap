import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
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
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  },
  slotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkingSlot'
  },
  service: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    trim: true
  },
  duration: {
    type: Number,
    required: true,
    min: 15,
    max: 480 // 8 heures maximum
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['initiated', 'pending', 'confirmed', 'cancelled', 'refunded'],
    default: 'initiated'
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  mode: {
    type: String,
    enum: ['salon', 'domicile'],
    required: true
  },
  address: {
    street: {
      type: String,
      trim: true
    },
    streetNumber: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    postalCode: {
      type: String,
      trim: true
    },
    floor: {
      type: String,
      trim: true
    },
    apartment: {
      type: String,
      trim: true
    },
    buildingCode: {
      type: String,
      trim: true
    },
    additionalInfo: {
      type: String,
      trim: true
    }
  },
  notes: {
    type: String,
    trim: true
  },
  acceptedTermsAt: {
    type: Date
  },
  acceptedCancellationPolicyAt: {
    type: Date
  },
  acceptedPaymentConsentAt: {
    type: Date
  },
  cancellationReason: {
    type: String,
    trim: true
  },
  cancellationFee: {
    type: Number,
    min: 0
  },
  // Informations Stripe
  stripePaymentIntentId: {
    type: String
  },
  stripeCustomerId: {
    type: String
  },
  // Commission TapHair (10%)
  platformFee: {
    type: Number,
    default: 0,
    min: 0
  },
  // Montant net pour le coiffeur (90%)
  coiffeurAmount: {
    type: Number,
    default: 0,
    min: 0
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

// Index pour améliorer les performances des recherches
bookingSchema.index({ 'client': 1 });
bookingSchema.index({ 'coiffeur': 1 });
bookingSchema.index({ 'date': 1 });
bookingSchema.index({ 'status': 1 });
bookingSchema.index({ 'paymentStatus': 1 });
bookingSchema.index({ slotId: 1 });
bookingSchema.index({ serviceId: 1 });

// Méthode pour vérifier si la réservation peut être annulée
bookingSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const bookingDate = new Date(this.date);
  const hoursUntilBooking = (bookingDate - now) / (1000 * 60 * 60);
  
  // On peut annuler jusqu'à 48h avant (au lieu de 24h)
  return hoursUntilBooking >= 48;
};

// Méthode pour calculer les frais d'annulation
bookingSchema.methods.getCancellationFee = function() {
  const now = new Date();
  const bookingDate = new Date(this.date);
  const hoursUntilBooking = (bookingDate - now) / (1000 * 60 * 60);
  
  if (hoursUntilBooking >= 48) {
    return 0; // Annulation gratuite
  } else if (hoursUntilBooking >= 24) {
    return this.price * 0.25; // 25% du prix (75% remboursé)
  } else {
    return this.price * 0.75; // 75% du prix (25% remboursé)
  }
};

// Méthode pour annuler une réservation avec calcul des frais
bookingSchema.methods.cancelWithFee = function(reason) {
  const fee = this.getCancellationFee();
  this.status = 'cancelled';
  this.cancellationReason = reason;
  this.cancellationFee = fee;
  this.updatedAt = new Date();
  return this.save();
};

// Méthode pour confirmer une réservation
bookingSchema.methods.confirm = function() {
  this.status = 'confirmed';
  this.updatedAt = new Date();
  return this.save();
};

// Méthode pour marquer comme terminée
bookingSchema.methods.complete = function() {
  this.status = 'completed';
  this.updatedAt = new Date();
  return this.save();
};

// Méthode statique pour récupérer les réservations d'un client
bookingSchema.statics.getClientBookings = function(clientId) {
  return this.find({ client: clientId })
    .populate('coiffeur', 'name email photo')
    .sort({ date: 1 });
};

// Méthode statique pour récupérer les réservations d'un coiffeur
bookingSchema.statics.getCoiffeurBookings = function(coiffeurId) {
  return this.find({ coiffeur: coiffeurId })
    .populate('client', 'name email photo')
    .sort({ date: 1 });
};

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking; 