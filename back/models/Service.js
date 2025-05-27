import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  duration: {
    type: Number,
    required: true,
    min: 15,
    max: 480 // 8 heures maximum
  },
  category: {
    type: String,
    enum: ['coupe', 'coloration', 'coiffure', 'soin', 'barbe', 'autre'],
    default: 'autre'
  },
  coiffeur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coiffeur',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
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
serviceSchema.index({ 'coiffeur': 1 });
serviceSchema.index({ 'category': 1 });
serviceSchema.index({ 'isActive': 1 });

// Méthode pour désactiver un service
serviceSchema.methods.deactivate = async function() {
  this.isActive = false;
  await this.save();
};

// Méthode pour réactiver un service
serviceSchema.methods.activate = async function() {
  this.isActive = true;
  await this.save();
};

// Méthode pour mettre à jour les détails d'un service
serviceSchema.methods.updateDetails = async function(details) {
  const allowedUpdates = ['name', 'description', 'price', 'duration', 'category'];
  Object.keys(details).forEach(key => {
    if (allowedUpdates.includes(key)) {
      this[key] = details[key];
    }
  });
  await this.save();
};

// Middleware pour mettre à jour le champ updatedAt
serviceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Service = mongoose.model('Service', serviceSchema);

export default Service; 