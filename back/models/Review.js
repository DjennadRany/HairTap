import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
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
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  isVerified: {
    type: Boolean,
    default: false
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
reviewSchema.index({ 'coiffeur': 1 });
reviewSchema.index({ 'client': 1 });
reviewSchema.index({ 'booking': 1 });
reviewSchema.index({ 'rating': -1 });
reviewSchema.index({ 'createdAt': -1 });

// Méthode pour vérifier un avis
reviewSchema.methods.verify = async function() {
  this.isVerified = true;
  await this.save();
};

// Méthode statique pour calculer la note moyenne d'un coiffeur
reviewSchema.statics.getAverageRating = async function(coiffeurId) {
  const result = await this.aggregate([
    { $match: { coiffeur: coiffeurId } },
    { $group: { _id: null, averageRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } }
  ]);
  
  return result.length > 0 ? {
    averageRating: Math.round(result[0].averageRating * 10) / 10,
    totalReviews: result[0].totalReviews
  } : { averageRating: 0, totalReviews: 0 };
};

// Middleware pour mettre à jour la note moyenne du coiffeur
reviewSchema.post('save', async function() {
  const Review = this.constructor;
  const stats = await Review.getAverageRating(this.coiffeur);
  
  // Mettre à jour la note moyenne du coiffeur
  await mongoose.model('User').findByIdAndUpdate(this.coiffeur, {
    rating: stats.averageRating,
    totalRatings: stats.totalReviews
  });
});

const Review = mongoose.model('Review', reviewSchema);

export default Review; 