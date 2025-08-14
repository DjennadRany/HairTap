import mongoose from 'mongoose';

const workingSlotSchema = new mongoose.Schema({
  coiffeurId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0,
    max: 6,
    validate: {
      validator: Number.isInteger,
      message: 'Le jour de la semaine doit être un entier entre 0 (Dimanche) et 6 (Samedi)'
    }
  },
  startTime: {
    type: Number,
    required: true,
    min: 0,
    max: 23,
    validate: {
      validator: Number.isInteger,
      message: 'L\'heure de début doit être un entier entre 0 et 23'
    }
  },
  endTime: {
    type: Number,
    required: true,
    min: 0,
    max: 23,
    validate: {
      validator: Number.isInteger,
      message: 'L\'heure de fin doit être un entier entre 0 et 23'
    }
  },
  serviceTypes: [{
    type: String,
    enum: ['coupe', 'coloration', 'brushing', 'lissage', 'permanente', 'barbe', 'soin', 'extension', 'autre'],
    default: ['coupe']
  }],
  availableAt: {
    type: String,
    required: true,
    enum: ['salon', 'domicile', 'both'],
    default: 'salon'
  },
  status: {
    type: String,
    required: true,
    enum: ['available', 'booked', 'maintenance', 'unavailable'],
    default: 'available'
  },
  maxBookings: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
    default: 1
  },
  currentBookings: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  isRecurring: {
    type: Boolean,
    default: true
  },
  exceptions: [{
    date: {
      type: Date,
      required: true
    },
    reason: {
      type: String,
      enum: ['vacation', 'sick', 'training', 'other'],
      required: true
    },
    description: String
  }],
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

// Index pour performance
workingSlotSchema.index({ coiffeurId: 1, dayOfWeek: 1, status: 1 });
workingSlotSchema.index({ coiffeurId: 1, 'exceptions.date': 1 });
workingSlotSchema.index({ coiffeurId: 1, availableAt: 1 });
workingSlotSchema.index({ status: 1, dayOfWeek: 1 });

// Validation personnalisée
workingSlotSchema.pre('save', function(next) {
  // Vérifier que l'heure de fin est après l'heure de début
  if (this.endTime <= this.startTime) {
    next(new Error('L\'heure de fin doit être après l\'heure de début'));
  }
  
  // Vérifier que le créneau ne dépasse pas 12 heures
  const duration = this.endTime - this.startTime;
  if (duration > 12) {
    next(new Error('Un créneau ne peut pas dépasser 12 heures'));
  }
  
  // Vérifier que currentBookings ne dépasse pas maxBookings
  if (this.currentBookings > this.maxBookings) {
    next(new Error('Le nombre de réservations actuelles ne peut pas dépasser le maximum autorisé'));
  }
  
  next();
});

// Méthode pour vérifier la disponibilité
workingSlotSchema.methods.isAvailable = function() {
  return this.status === 'available' && this.currentBookings < this.maxBookings;
};

// Méthode pour réserver un créneau
workingSlotSchema.methods.bookSlot = async function() {
  if (!this.isAvailable()) {
    throw new Error('Ce créneau n\'est pas disponible');
  }
  
  this.currentBookings += 1;
  if (this.currentBookings >= this.maxBookings) {
    this.status = 'booked';
  }
  
  this.updatedAt = new Date();
  await this.save();
  return this;
};

// Méthode pour libérer un créneau
workingSlotSchema.methods.releaseSlot = async function() {
  if (this.currentBookings > 0) {
    this.currentBookings -= 1;
    if (this.status === 'booked' && this.currentBookings < this.maxBookings) {
      this.status = 'available';
    }
    
    this.updatedAt = new Date();
    await this.save();
  }
  return this;
};

// Méthode pour mettre en maintenance
workingSlotSchema.methods.setMaintenance = async function(reason) {
  this.status = 'maintenance';
  this.updatedAt = new Date();
  await this.save();
  return this;
};

// Méthode pour ajouter une exception
workingSlotSchema.methods.addException = async function(date, reason, description = '') {
  const exception = { date, reason, description };
  this.exceptions.push(exception);
  this.updatedAt = new Date();
  await this.save();
  return this;
};

// Méthode statique pour récupérer les créneaux disponibles d'un coiffeur
workingSlotSchema.statics.getAvailableSlots = function(coiffeurId, dayOfWeek = null, date = null) {
  let query = { coiffeurId, status: 'available' };
  
  if (dayOfWeek !== null) {
    query.dayOfWeek = dayOfWeek;
  }
  
  // Vérifier les exceptions pour une date spécifique
  if (date) {
    const dayOfWeekForDate = new Date(date).getDay();
    query.dayOfWeek = dayOfWeekForDate;
    
    // Exclure les créneaux avec des exceptions pour cette date
    query['exceptions.date'] = { $ne: new Date(date) };
  }
  
  return this.find(query).sort({ startTime: 1 });
};

// Méthode statique pour récupérer tous les créneaux d'un coiffeur
workingSlotSchema.statics.getCoiffeurSlots = function(coiffeurId, activeOnly = true) {
  const query = { coiffeurId };
  if (activeOnly) {
    query.status = { $in: ['available', 'booked'] };
  }
  return this.find(query).sort({ dayOfWeek: 1, startTime: 1 });
};

// Middleware pour mettre à jour le champ updatedAt
workingSlotSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const WorkingSlot = mongoose.model('WorkingSlot', workingSlotSchema);

export default WorkingSlot;
