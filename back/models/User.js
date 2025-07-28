import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const ServiceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  duration: {
    type: Number, // en minutes
    required: true
  },
  priceHT: {
    type: Number,
    required: true
  },
  image: String,
  tags: [String],
  isTemporary: {
    type: Boolean,
    default: false
  },
  startDate: Date,
  endDate: Date
});

const userSchema = new mongoose.Schema({
  // Informations de base
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'coiffeur'],
    default: 'user'
  },
  
  // Profil public
  photo: {
    type: String,
    default: 'default-avatar.png'
  },
  bio: {
    type: String,
    maxlength: 400
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    postalCode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  
  // Champs spécifiques aux coiffeurs
  siren: {
    type: String,
    sparse: true
  },
  sirenStatus: {
    type: String,
    enum: ['pending', 'verified', 'none'],
    default: 'none'
  },
  sirenVerificationDate: Date,
  specialities: [String],
  rating: {
    type: Number,
    default: 0
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  workingMode: [{
    type: String,
    enum: ['salon', 'domicile', 'both']
  }],
  workingHours: {
    monday: { start: String, end: String, isAvailable: Boolean },
    tuesday: { start: String, end: String, isAvailable: Boolean },
    wednesday: { start: String, end: String, isAvailable: Boolean },
    thursday: { start: String, end: String, isAvailable: Boolean },
    friday: { start: String, end: String, isAvailable: Boolean },
    saturday: { start: String, end: String, isAvailable: Boolean },
    sunday: { start: String, end: String, isAvailable: Boolean }
  },
  travelRadius: {
    type: Number, // en km
    default: 10
  },
  services: [ServiceSchema],
  gallery: [{
    url: String,
    description: String,
    isVerified: {
      type: Boolean,
      default: false
    }
  }],
  
  // Social & Engagement
  likes: {
    type: Number,
    default: 0
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  socialPosts: [{
    content: String,
    images: [String],
    hashtags: [String],
    createdAt: {
      type: Date,
      default: Date.now
    },
    likes: {
      type: Number,
      default: 0
    },
    comments: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      content: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  
  // Préférences & Paramètres
  preferences: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      },
      push: {
        type: Boolean,
        default: true
      }
    },
    language: {
      type: String,
      enum: ['fr', 'en'],
      default: 'fr'
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    privacy: {
      showPhone: {
        type: Boolean,
        default: false
      },
      showAddress: {
        type: Boolean,
        default: true
      }
    }
  },
  
  // Statistiques & Performance
  stats: {
    totalBookings: {
      type: Number,
      default: 0
    },
    completedBookings: {
      type: Number,
      default: 0
    },
    cancelledBookings: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0
    },
    profileViews: {
      type: Number,
      default: 0
    }
  },
  
  // Sécurité & Conformité
  lastLogin: Date,
  loginHistory: [{
    date: Date,
    ip: String,
    device: String
  }],
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Timestamps
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
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'address.coordinates': '2dsphere' });
userSchema.index({ siren: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Méthode pour vérifier si l'utilisateur est un coiffeur
userSchema.methods.isCoiffeur = function() {
  return this.role === 'coiffeur';
};

// Méthode pour vérifier si l'utilisateur est un admin
userSchema.methods.isAdmin = function() {
  return this.role === 'admin';
};

// Méthode pour bloquer un utilisateur
userSchema.methods.blockUser = async function(userId) {
  if (!this.blockedUsers.includes(userId)) {
    this.blockedUsers.push(userId);
    await this.save();
  }
};

// Méthode pour débloquer un utilisateur
userSchema.methods.unblockUser = async function(userId) {
  this.blockedUsers = this.blockedUsers.filter(id => id.toString() !== userId.toString());
  await this.save();
};

// Méthode pour vérifier si un utilisateur est bloqué
userSchema.methods.isUserBlocked = function(userId) {
  return this.blockedUsers.some(id => id.toString() === userId.toString());
};

// Middleware pour mettre à jour le champ updatedAt
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const User = mongoose.model('User', userSchema);

export default User; 