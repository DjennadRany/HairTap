import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
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
  category: {
    type: String,
    required: true,
    enum: ['shampooing', 'après-shampooing', 'masque', 'sérum', 'lisseur', 'sèche-cheveux', 'accessoires', 'autre'],
    default: 'autre'
  },
  keywords: [{
    type: String,
    trim: true
  }],
  images: [{
    type: String
  }],
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  deliveryOptions: [{
    type: String,
    enum: ['pickup', 'delivery', 'coiffeur'],
    default: ['pickup']
  }],
  likes: {
    type: Number,
    default: 0
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  coiffeur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Méthodes pour gérer les likes
productSchema.methods.addLike = function(userId) {
  if (!this.likedBy.includes(userId)) {
    this.likedBy.push(userId);
    this.likes = this.likedBy.length;
    return this.save();
  }
  return Promise.resolve(this);
};

productSchema.methods.removeLike = function(userId) {
  const index = this.likedBy.indexOf(userId);
  if (index > -1) {
    this.likedBy.splice(index, 1);
    this.likes = this.likedBy.length;
    return this.save();
  }
  return Promise.resolve(this);
};

productSchema.methods.isLikedBy = function(userId) {
  return this.likedBy.includes(userId);
};

// Index pour les performances
productSchema.index({ coiffeur: 1, isActive: 1 });
productSchema.index({ category: 1 });
productSchema.index({ likes: -1 });

const Product = mongoose.model('Product', productSchema);

export default Product; 