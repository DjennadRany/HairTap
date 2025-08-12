import mongoose from 'mongoose';

const connectionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['online', 'busy', 'offline', 'away'],
    default: 'offline'
  },
  availability: {
    isAvailable: {
      type: Boolean,
      default: true
    },
    nextAvailable: {
      type: Date
    },
    workingHours: {
      monday: {
        start: String,
        end: String,
        isAvailable: { type: Boolean, default: true }
      },
      tuesday: {
        start: String,
        end: String,
        isAvailable: { type: Boolean, default: true }
      },
      wednesday: {
        start: String,
        end: String,
        isAvailable: { type: Boolean, default: true }
      },
      thursday: {
        start: String,
        end: String,
        isAvailable: { type: Boolean, default: true }
      },
      friday: {
        start: String,
        end: String,
        isAvailable: { type: Boolean, default: true }
      },
      saturday: {
        start: String,
        end: String,
        isAvailable: { type: Boolean, default: true }
      },
      sunday: {
        start: String,
        end: String,
        isAvailable: { type: Boolean, default: true }
      }
    }
  },
  chatSettings: {
    autoReply: {
      type: Boolean,
      default: false
    },
    awayMessage: {
      type: String,
      default: 'Je ne suis pas disponible pour le moment. Je vous répondrai dès que possible.'
    },
    notificationPreferences: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware pour mettre à jour updatedAt
connectionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index pour améliorer les performances
connectionSchema.index({ userId: 1 });
connectionSchema.index({ isOnline: 1, lastSeen: 1 }); // Pour le nettoyage des connexions expirées
connectionSchema.index({ lastSeen: 1 }); // Pour les requêtes de timeout

const Connection = mongoose.model('Connection', connectionSchema);
export default Connection; 