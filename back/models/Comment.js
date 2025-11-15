import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  coiffeur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  replies: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index pour améliorer les performances
commentSchema.index({ service: 1, createdAt: -1 });
commentSchema.index({ coiffeur: 1, createdAt: -1 });
commentSchema.index({ author: 1 });

// Méthode pour ajouter un like
commentSchema.methods.addLike = async function(userId) {
  if (!this.likes.includes(userId)) {
    this.likes.push(userId);
    await this.save();
  }
  return this;
};

// Méthode pour retirer un like
commentSchema.methods.removeLike = async function(userId) {
  this.likes = this.likes.filter(id => id.toString() !== userId.toString());
  await this.save();
  return this;
};

// Méthode pour vérifier si un utilisateur a liké
commentSchema.methods.isLikedBy = function(userId) {
  return this.likes.some(id => id.toString() === userId.toString());
};

// Méthode pour ajouter une réponse
commentSchema.methods.addReply = async function(authorId, content) {
  this.replies.push({
    author: authorId,
    content: content
  });
  await this.save();
  return this;
};

// Méthode pour liker une réponse
commentSchema.methods.likeReply = async function(replyIndex, userId) {
  if (this.replies[replyIndex] && !this.replies[replyIndex].likes.includes(userId)) {
    this.replies[replyIndex].likes.push(userId);
    await this.save();
  }
  return this;
};

// Méthode pour retirer un like d'une réponse
commentSchema.methods.unlikeReply = async function(replyIndex, userId) {
  if (this.replies[replyIndex]) {
    this.replies[replyIndex].likes = this.replies[replyIndex].likes.filter(
      id => id.toString() !== userId.toString()
    );
    await this.save();
  }
  return this;
};

const Comment = mongoose.model('Comment', commentSchema);
export default Comment;


