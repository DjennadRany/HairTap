import mongoose from 'mongoose';

const specialtySchema = new mongoose.Schema({
  coiffeurId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  expertiseLevel: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    default: 3,
    validate: {
      validator: Number.isInteger,
      message: 'Le niveau d\'expertise doit être un entier entre 1 et 5'
    }
  },
  yearsExperience: {
    type: Number,
    required: true,
    min: 0,
    max: 50,
    default: 0,
    validate: {
      validator: Number.isInteger,
      message: 'Les années d\'expérience doivent être un entier entre 0 et 50'
    }
  },
  category: {
    type: String,
    required: true,
    enum: ['coupe', 'coloration', 'brushing', 'lissage', 'permanente', 'barbe', 'soin', 'extension', 'autre'],
    default: 'coupe'
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  certifications: [{
    type: String,
    trim: true,
    maxlength: 100
  }],
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

// Index pour performance
specialtySchema.index({ coiffeurId: 1, category: 1 });
specialtySchema.index({ coiffeurId: 1, isActive: 1 });
specialtySchema.index({ name: 'text', category: 1 });
specialtySchema.index({ expertiseLevel: -1, yearsExperience: -1 });

// Méthode pour désactiver une spécialité
specialtySchema.methods.deactivate = async function() {
  this.isActive = false;
  this.updatedAt = new Date();
  await this.save();
  return this;
};

// Méthode pour réactiver une spécialité
specialtySchema.methods.activate = async function() {
  this.isActive = true;
  this.updatedAt = new Date();
  await this.save();
  return this;
};

// Méthode pour mettre à jour les détails
specialtySchema.methods.updateDetails = async function(details) {
  const allowedUpdates = ['name', 'expertiseLevel', 'yearsExperience', 'category', 'description', 'certifications'];
  Object.keys(details).forEach(key => {
    if (allowedUpdates.includes(key)) {
      this[key] = details[key];
    }
  });
  this.updatedAt = new Date();
  await this.save();
  return this;
};

// Méthode statique pour récupérer les spécialités d'un coiffeur
specialtySchema.statics.getCoiffeurSpecialties = function(coiffeurId, activeOnly = true) {
  const query = { coiffeurId };
  if (activeOnly) {
    query.isActive = true;
  }
  return this.find(query).sort({ expertiseLevel: -1, yearsExperience: -1 });
};

// Méthode statique pour récupérer les spécialités par catégorie
specialtySchema.statics.getSpecialtiesByCategory = function(category, activeOnly = true) {
  const query = { category };
  if (activeOnly) {
    query.isActive = true;
  }
  return this.find(query).populate('coiffeurId', 'name rating photo').sort({ expertiseLevel: -1 });
};

// Middleware pour mettre à jour le champ updatedAt
specialtySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Validation personnalisée
specialtySchema.pre('save', function(next) {
  // Vérifier que le niveau d'expertise est cohérent avec l'expérience
  if (this.expertiseLevel === 5 && this.yearsExperience < 10) {
    next(new Error('Le niveau 5 nécessite au moins 10 ans d\'expérience'));
  } else if (this.expertiseLevel === 4 && this.yearsExperience < 5) {
    next(new Error('Le niveau 4 nécessite au moins 5 ans d\'expérience'));
  } else {
    next();
  }
});

const Specialty = mongoose.model('Specialty', specialtySchema);

export default Specialty;
