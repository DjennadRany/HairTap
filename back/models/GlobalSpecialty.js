import mongoose from 'mongoose';

const globalSpecialtySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
    index: true
  },
  category: {
    type: String,
    required: true,
    enum: ['coupe', 'coloration', 'brushing', 'lissage', 'permanente', 'barbe', 'soin', 'extension', 'autre'],
    default: 'coupe'
  },
  aliases: [{
    type: String,
    trim: true,
    maxlength: 100
  }],
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

// Index pour performance et recherche
globalSpecialtySchema.index({ name: 'text', aliases: 'text', description: 'text' });
globalSpecialtySchema.index({ category: 1, usageCount: -1 });
globalSpecialtySchema.index({ isActive: 1, isVerified: 1 });
globalSpecialtySchema.index({ usageCount: -1, category: 1 });

// Méthodes du modèle
globalSpecialtySchema.methods.incrementUsage = async function() {
  this.usageCount += 1;
  await this.save();
  return this;
};

globalSpecialtySchema.methods.decrementUsage = async function() {
  this.usageCount = Math.max(0, this.usageCount - 1);
  await this.save();
  return this;
};

// Méthodes statiques
globalSpecialtySchema.statics.searchSpecialties = async function(query, limit = 10) {
  if (!query || query.trim().length < 2) {
    return { exact: null, suggestions: [] };
  }

  const searchQuery = query.trim();
  
  // 1. Recherche exacte
  const exact = await this.findOne({
    $or: [
      { name: { $regex: `^${searchQuery}$`, $i: true } },
      { aliases: { $regex: `^${searchQuery}$`, $i: true } }
    ],
    isActive: true
  });

  if (exact) {
    return { exact, suggestions: [] };
  }

  // 2. Recherche par alias
  const byAlias = await this.find({
    aliases: { $regex: searchQuery, $i: true },
    isActive: true
  });

  // 3. Recherche floue
  const fuzzy = await this.find({
    $or: [
      { name: { $regex: searchQuery, $i: true } },
      { aliases: { $regex: searchQuery, $i: true } },
      { description: { $regex: searchQuery, $i: true } }
    ],
    isActive: true
  }).sort({ usageCount: -1, isVerified: -1 }).limit(limit);

  // Éviter les doublons
  const allResults = [...byAlias, ...fuzzy];
  const uniqueResults = allResults.filter((item, index, self) => 
    index === self.findIndex(t => t._id.toString() === item._id.toString())
  );

  return { 
    exact: null, 
    suggestions: uniqueResults.slice(0, limit) 
  };
};

globalSpecialtySchema.statics.getPopularSpecialties = async function(category = null, limit = 20) {
  let query = { isActive: true, usageCount: { $gt: 0 } };
  
  if (category) {
    query.category = category;
  }

  return await this.find(query)
    .sort({ usageCount: -1, isVerified: -1 })
    .limit(limit);
};

globalSpecialtySchema.statics.getSpecialtiesByCategory = async function(category, limit = 50) {
  return await this.find({ 
    category, 
    isActive: true 
  })
  .sort({ usageCount: -1, name: 1 })
  .limit(limit);
};

// Validation personnalisée
globalSpecialtySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Normaliser le nom (première lettre en majuscule)
  if (this.name) {
    this.name = this.name.charAt(0).toUpperCase() + this.name.slice(1).toLowerCase();
  }
  
  next();
});

const GlobalSpecialty = mongoose.model('GlobalSpecialty', globalSpecialtySchema);
export default GlobalSpecialty;
