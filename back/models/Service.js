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
    enum: ['coupe', 'coloration', 'brushing', 'lissage', 'permanente', 'barbe', 'soin', 'autre'],
    default: 'autre'
  },
  // NOUVEAU: Spécialités liées au service
  specialities: [{
    specialtyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GlobalSpecialty',
      required: true
    },
    expertiseLevel: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    }
  }],
  keywords: {
    type: [String],
    default: []
  },
  // NOUVEAU: Tags pour la recherche avancée
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  // NOUVEAU: Style et tendance
  style: {
    type: String,
    enum: ['classique', 'moderne', 'vintage', 'tendance', 'minimaliste', 'extravagant'],
    default: 'moderne'
  },
  // NOUVEAU: Public cible
  targetAudience: [{
    type: String,
    enum: ['homme', 'femme', 'enfant', 'adolescent', 'senior'],
    default: 'femme'
  }],
  examplePhotos: {
    type: [String],
    default: []
  },
  // NOUVEAU: Photos et vidéos avec métadonnées
  gallery: [{
    mediaUrl: {
      type: String,
      required: true
    },
    mediaType: {
      type: String,
      enum: ['image', 'video'],
      required: true
    },
    caption: String,
    tags: [String],
    isBeforeAfter: {
      type: Boolean,
      default: false
    },
    beforeAfterType: {
      type: String,
      enum: ['before', 'after', 'both'],
      default: 'both'
    },
    likes: {
      type: Number,
      default: 0
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  likes: {
    type: Number,
    default: 0,
    min: 0
  },
  likedBy: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    default: []
  },
  // NOUVEAU: Métriques d'engagement
  views: {
    type: Number,
    default: 0
  },
  shares: {
    type: Number,
    default: 0
  },
  // NOUVEAU: Disponibilité et créneaux
  availability: {
    type: String,
    enum: ['immédiat', 'planifié', 'sur_demande'],
    default: 'immédiat'
  },
  estimatedWaitTime: {
    type: Number, // en jours
    default: 0
  },
  coiffeur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // NOUVEAU: Statut de vérification
  isVerified: {
    type: Boolean,
    default: false
  },
  // NOUVEAU: Score de popularité calculé
  popularityScore: {
    type: Number,
    default: 0
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
serviceSchema.index({ 'keywords': 1 });
serviceSchema.index({ 'likes': -1 });
// NOUVEAUX INDEX
serviceSchema.index({ 'specialities.specialtyId': 1 });
serviceSchema.index({ 'style': 1 });
serviceSchema.index({ 'targetAudience': 1 });
serviceSchema.index({ 'popularityScore': -1 });
serviceSchema.index({ 'isVerified': 1 });
serviceSchema.index({ 'tags': 1 });
// Index de recherche textuelle
serviceSchema.index({ 
  name: 'text', 
  description: 'text', 
  keywords: 'text', 
  tags: 'text' 
});

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
  const allowedUpdates = [
    'name', 'description', 'price', 'duration', 'category', 
    'keywords', 'examplePhotos', 'specialities', 'tags', 
    'style', 'targetAudience', 'gallery', 'availability', 
    'estimatedWaitTime'
  ];
  Object.keys(details).forEach(key => {
    if (allowedUpdates.includes(key)) {
      this[key] = details[key];
    }
  });
  await this.save();
};

// NOUVELLE MÉTHODE: Ajouter une spécialité
serviceSchema.methods.addSpecialty = async function(specialtyId, expertiseLevel = 3) {
  const existingIndex = this.specialities.findIndex(s => 
    s.specialtyId.toString() === specialtyId.toString()
  );
  
  if (existingIndex >= 0) {
    this.specialities[existingIndex].expertiseLevel = expertiseLevel;
  } else {
    this.specialities.push({ specialtyId, expertiseLevel });
  }
  
  await this.save();
  return this;
};

// NOUVELLE MÉTHODE: Supprimer une spécialité
serviceSchema.methods.removeSpecialty = async function(specialtyId) {
  this.specialities = this.specialities.filter(s => 
    s.specialtyId.toString() !== specialtyId.toString()
  );
  await this.save();
  return this;
};

// NOUVELLE MÉTHODE: Ajouter une photo à la galerie
serviceSchema.methods.addGalleryPhoto = async function(photoData) {
  this.gallery.push(photoData);
  await this.save();
  return this;
};

// NOUVELLE MÉTHODE: Calculer le score de popularité
serviceSchema.methods.calculatePopularityScore = async function() {
  const baseScore = this.likes * 10 + this.views * 0.1 + this.shares * 5;
  const timeBonus = Math.max(0, (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 7)); // Bonus hebdomadaire
  const verificationBonus = this.isVerified ? 100 : 0;
  
  this.popularityScore = Math.round(baseScore + timeBonus + verificationBonus);
  // Sauvegarder sans validation stricte pour éviter les erreurs de validation sur gallery
  await this.save({ validateBeforeSave: false });
  return this.popularityScore;
};

// Méthode pour ajouter un like
serviceSchema.methods.addLike = async function(userId) {
  if (!this.likedBy.includes(userId)) {
    this.likedBy.push(userId);
    this.likes += 1;
    // Sauvegarder sans validation stricte pour éviter les erreurs de validation sur gallery
    await this.save({ validateBeforeSave: false });
    // Recalculer le score de popularité
    await this.calculatePopularityScore();
  }
  return this;
};

// Méthode pour retirer un like
serviceSchema.methods.removeLike = async function(userId) {
  const index = this.likedBy.indexOf(userId);
  if (index > -1) {
    this.likedBy.splice(index, 1);
    this.likes = Math.max(0, this.likes - 1);
    // Sauvegarder sans validation stricte pour éviter les erreurs de validation sur gallery
    await this.save({ validateBeforeSave: false });
    // Recalculer le score de popularité
    await this.calculatePopularityScore();
  }
  return this;
};

// Méthode pour vérifier si un utilisateur a liké le service
serviceSchema.methods.isLikedBy = function(userId) {
  return this.likedBy.includes(userId);
};

// NOUVELLE MÉTHODE: Incrémenter les vues
serviceSchema.methods.incrementViews = async function() {
  this.views += 1;
  await this.save();
  return this;
};

// NOUVELLE MÉTHODE: Incrémenter les partages
serviceSchema.methods.incrementShares = async function() {
  this.shares += 1;
  await this.save();
  return this;
};

// MÉTHODES STATIQUES POUR LA RECHERCHE AVANCÉE
serviceSchema.statics.searchBySpecialties = async function(specialtyIds, options = {}) {
  const { limit = 20, sortBy = 'popularityScore', category, style, targetAudience } = options;
  
  let query = {
    isActive: true,
    'specialities.specialtyId': { $in: specialtyIds }
  };
  
  if (category) query.category = category;
  if (style) query.style = style;
  if (targetAudience) query.targetAudience = { $in: [targetAudience] };
  
  let sortOptions = {};
  if (sortBy === 'popularityScore') {
    sortOptions = { popularityScore: -1, likes: -1, createdAt: -1 };
  } else if (sortBy === 'likes') {
    sortOptions = { likes: -1, popularityScore: -1 };
  } else if (sortBy === 'recent') {
    sortOptions = { createdAt: -1 };
  }
  
  return await this.find(query)
    .populate('coiffeur', 'name photo rating city')
    .populate('specialities.specialtyId', 'name category')
    .sort(sortOptions)
    .limit(limit);
};

serviceSchema.statics.getTrendingServices = async function(category = null, limit = 20) {
  let query = { isActive: true, popularityScore: { $gt: 0 } };
  if (category) query.category = category;
  
  return await this.find(query)
    .populate('coiffeur', 'name photo rating city')
    .populate('specialities.specialtyId', 'name category')
    .sort({ popularityScore: -1, createdAt: -1 })
    .limit(limit);
};

serviceSchema.statics.searchByKeywords = async function(keywords, options = {}) {
  const { limit = 20, category, style } = options;
  
  let query = {
    isActive: true,
    $or: [
      { keywords: { $in: keywords } },
      { tags: { $in: keywords } },
      { name: { $regex: keywords.join('|'), $i: true } },
      { description: { $regex: keywords.join('|'), $i: true } }
    ]
  };
  
  if (category) query.category = category;
  if (style) query.style = style;
  
  return await this.find(query)
    .populate('coiffeur', 'name photo rating city')
    .populate('specialities.specialtyId', 'name category')
    .sort({ popularityScore: -1, likes: -1 })
    .limit(limit);
};

// Validation personnalisée
serviceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Mettre à jour les mots-clés automatiquement basés sur les spécialités
  if (this.specialities && this.specialities.length > 0) {
    // Les mots-clés seront mis à jour après population des spécialités
  }
  
  next();
});

// Middleware post-save pour mettre à jour les mots-clés
serviceSchema.post('save', async function(doc) {
  if (doc.specialities && doc.specialities.length > 0) {
    try {
      // Populate les spécialités pour récupérer les noms
      await doc.populate('specialities.specialtyId', 'name aliases');
      
      // Mettre à jour les mots-clés basés sur les spécialités
      const specialtyKeywords = doc.specialities.flatMap(s => 
        [s.specialtyId.name, ...(s.specialtyId.aliases || [])]
      );
      
      // Ajouter les mots-clés existants et les nouveaux
      const allKeywords = [...new Set([...doc.keywords, ...specialtyKeywords])];
      
      if (JSON.stringify(doc.keywords) !== JSON.stringify(allKeywords)) {
        doc.keywords = allKeywords;
        await doc.save();
      }
    } catch (error) {
      console.error('Erreur mise à jour mots-clés:', error);
    }
  }
});

const Service = mongoose.model('Service', serviceSchema);
export default Service; 