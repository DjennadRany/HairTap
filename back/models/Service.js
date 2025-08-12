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
  keywords: {
    type: [String],
    default: []
  },
  examplePhotos: {
    type: [String],
    default: []
  },
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
  coiffeur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
serviceSchema.index({ 'keywords': 1 });
serviceSchema.index({ 'likes': -1 });

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
  const allowedUpdates = ['name', 'description', 'price', 'duration', 'category', 'keywords', 'examplePhotos'];
  Object.keys(details).forEach(key => {
    if (allowedUpdates.includes(key)) {
      this[key] = details[key];
    }
  });
  await this.save();
};

// Méthode pour ajouter un like
serviceSchema.methods.addLike = async function(userId) {
  const userIdStr = userId.toString();
  
  // Vérifier si l'utilisateur a déjà liké
  const alreadyLiked = this.likedBy.some(id => id.toString() === userIdStr);
  
  if (!alreadyLiked) {
    this.likes += 1;
    this.likedBy.push(userId);
    await this.save();
    console.log(`✅ Like ajouté pour l'utilisateur ${userIdStr} - Total: ${this.likes}`);
  } else {
    console.log(`⚠️ L'utilisateur ${userIdStr} a déjà liké ce service`);
  }
  
  return this.likes;
};

// Méthode pour retirer un like
serviceSchema.methods.removeLike = async function(userId) {
  const userIdStr = userId.toString();
  
  // Vérifier si l'utilisateur a liké
  const hasLiked = this.likedBy.some(id => id.toString() === userIdStr);
  
  if (hasLiked) {
    this.likes = Math.max(0, this.likes - 1);
    this.likedBy = this.likedBy.filter(id => id.toString() !== userIdStr);
    await this.save();
    console.log(`✅ Like retiré pour l'utilisateur ${userIdStr} - Total: ${this.likes}`);
  } else {
    console.log(`⚠️ L'utilisateur ${userIdStr} n'avait pas liké ce service`);
  }
  
  return this.likes;
};

// Méthode pour vérifier si un utilisateur a liké
serviceSchema.methods.isLikedBy = function(userId) {
  return this.likedBy.some(id => id.toString() === userId.toString());
};

// Méthode pour synchroniser les likes avec likedBy
serviceSchema.methods.syncLikes = async function() {
  this.likes = this.likedBy ? this.likedBy.length : 0;
  await this.save();
  return this.likes;
};

// Middleware pour mettre à jour le champ updatedAt
serviceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Service = mongoose.model('Service', serviceSchema);

export default Service; 