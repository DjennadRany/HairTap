import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coiffeur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coiffeur',
    required: true
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  date: {
    type: Date,
    required: true
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
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
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
    city: {
      type: String,
      trim: true
    },
    postalCode: {
      type: String,
      trim: true
    }
  },
  notes: {
    type: String,
    trim: true
  },
  cancellationReason: {
    type: String,
    trim: true
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

// Méthode pour vérifier si la réservation peut être annulée
bookingSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const bookingDate = new Date(this.date);
  const hoursUntilBooking = (bookingDate - now) / (1000 * 60 * 60);
  
  // On peut annuler jusqu'à 24h avant
  return hoursUntilBooking >= 24;
};

// Méthode pour annuler une réservation
bookingSchema.methods.cancel = async function(reason) {
  if (!this.canBeCancelled()) {
    throw new Error('La réservation ne peut plus être annulée');
  }
  
  this.status = 'cancelled';
  this.cancellationReason = reason;
  await this.save();
};

// Méthode pour confirmer une réservation
bookingSchema.methods.confirm = async function() {
  if (this.status !== 'pending') {
    throw new Error('La réservation ne peut pas être confirmée');
  }
  
  this.status = 'confirmed';
  await this.save();
};

// Méthode pour compléter une réservation
bookingSchema.methods.complete = async function() {
  if (this.status !== 'confirmed') {
    throw new Error('La réservation ne peut pas être complétée');
  }
  
  this.status = 'completed';
  await this.save();
};

// Méthode pour mettre à jour le statut de paiement
bookingSchema.methods.updatePaymentStatus = async function(status) {
  if (!['pending', 'paid', 'refunded'].includes(status)) {
    throw new Error('Statut de paiement invalide');
  }
  
  this.paymentStatus = status;
  await this.save();
};

// Middleware pour mettre à jour le champ updatedAt
bookingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking; 