import mongoose from 'mongoose';

const ConversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastMessage: {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    read: {
      type: Boolean,
      default: false
    }
  },
  unread: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index pour optimiser les requêtes
ConversationSchema.index({ userId: 1 });
ConversationSchema.index({ 'lastMessage.from': 1, 'lastMessage.to': 1 });
ConversationSchema.index({ 'lastMessage.date': -1 });

// Méthode statique pour créer ou mettre à jour une conversation
ConversationSchema.statics.createOrUpdateConversation = async function(fromUserId, toUserId, messageContent) {
  try {
    // Chercher une conversation existante entre ces deux utilisateurs
    let conversation = await this.findOne({
      $or: [
        { userId: fromUserId },
        { userId: toUserId }
      ]
    });

    if (conversation) {
      // Mettre à jour la conversation existante
      conversation.lastMessage = {
        from: fromUserId,
        to: toUserId,
        content: messageContent,
        date: new Date(),
        read: false
      };
      
      // Incrémenter le compteur de messages non lus pour le destinataire
      if (conversation.userId.toString() === toUserId) {
        conversation.unread += 1;
      } else {
        conversation.unread = 0; // Remettre à 0 pour l'expéditeur
      }
    } else {
      // Créer une nouvelle conversation
      conversation = new this({
        userId: toUserId, // La conversation appartient au destinataire
        lastMessage: {
          from: fromUserId,
          to: toUserId,
          content: messageContent,
          date: new Date(),
          read: false
        },
        unread: 1
      });
    }

    await conversation.save();
    return conversation;
  } catch (error) {
    console.error('Error in createOrUpdateConversation:', error);
    throw error;
  }
};

export default mongoose.model('Conversation', ConversationSchema);
