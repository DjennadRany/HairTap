import mongoose from 'mongoose';

const cgvSchema = new mongoose.Schema({
  version: {
    type: String,
    required: true,
    unique: true
  },
  content: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  effectiveDate: {
    type: Date,
    default: Date.now
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
cgvSchema.index({ 'isActive': 1 });
// Note: L'index sur 'version' est créé automatiquement par unique: true

// Méthode statique pour récupérer les CGV actives
cgvSchema.statics.getActiveCGV = function() {
  return this.findOne({ isActive: true }).sort({ effectiveDate: -1 });
};

// Méthode statique pour récupérer une version spécifique
cgvSchema.statics.getByVersion = function(version) {
  return this.findOne({ version });
};

const CGV = mongoose.model('CGV', cgvSchema);

export default CGV;

