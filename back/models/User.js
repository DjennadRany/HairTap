import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

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
    default: '/default-avatar.png'
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
    streetNumber: String,
    city: String,
    postalCode: String,
    floor: String,
    apartment: String,
    buildingCode: String,
    additionalInfo: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  // Adresses multiples pour UX-Pro
  addresses: {
    home: {
      street: String,
      streetNumber: String,
      city: String,
      postalCode: String,
      floor: String,
      apartment: String,
      buildingCode: String,
      additionalInfo: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    },
    office: {
      street: String,
      streetNumber: String,
      city: String,
      postalCode: String,
      floor: String,
      apartment: String,
      buildingCode: String,
      additionalInfo: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    }
  },
  
  // Adresses de réservation (ajoutées automatiquement)
  bookingAddresses: [{
    type: {
      type: String,
      enum: ['bureau', 'domicile', 'autre'],
      required: true
    },
    street: String,
    streetNumber: String,
    city: String,
    postalCode: String,
    floor: String,
    apartment: String,
    buildingCode: String,
    additionalInfo: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  }],
  
  // Adresse de salon (pour les coiffeurs)
  salonAddress: {
    street: String,
    streetNumber: String,
    city: String,
    postalCode: String,
    floor: String,
    apartment: String,
    buildingCode: String,
    additionalInfo: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    phone: String,
    openingHours: {
      monday: { open: String, close: String, closed: { type: Boolean, default: false } },
      tuesday: { open: String, close: String, closed: { type: Boolean, default: false } },
      wednesday: { open: String, close: String, closed: { type: Boolean, default: false } },
      thursday: { open: String, close: String, closed: { type: Boolean, default: false } },
      friday: { open: String, close: String, closed: { type: Boolean, default: false } },
      saturday: { open: String, close: String, closed: { type: Boolean, default: false } },
      sunday: { open: String, close: String, closed: { type: Boolean, default: false } }
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
  experience: {
    type: Number,
    min: 0,
    max: 50
  },
  formation: {
    type: String,
    maxlength: 200
  },
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
  travelRadius: {
    type: Number,
    default: 10
  },
  rib: {
    type: String,
    trim: true,
    sparse: true
  },
  
  // Galerie simple
  gallery: [{
    url: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
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
  
  // Préférences utilisateur
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true }
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
    }
  },
  
  // Statistiques
  stats: {
    totalBookings: { type: Number, default: 0 },
    completedBookings: { type: Number, default: 0 },
    cancelledBookings: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    profileViews: { type: Number, default: 0 }
  },
  
  // Sécurité
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Middleware pour mettre à jour le timestamp
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
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

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 heure
  return resetToken;
};

// Méthode pour ajouter une image à la galerie
userSchema.methods.addGalleryImage = async function(imageUrl, description = '') {
  this.gallery.push({
    url: imageUrl,
    description,
    isVerified: false
  });
  await this.save();
  return this.gallery[this.gallery.length - 1];
};

// Méthode pour supprimer une image de la galerie
userSchema.methods.removeGalleryImage = async function(imageUrl) {
  this.gallery = this.gallery.filter(img => img.url !== imageUrl);
  await this.save();
  return this;
};

// Méthode pour ajouter une adresse de réservation
userSchema.methods.addBookingAddress = async function(addressData) {
  // Vérifier si l'adresse existe déjà
  const existingAddress = this.bookingAddresses.find(addr => 
    addr.street === addressData.street &&
    addr.streetNumber === addressData.streetNumber &&
    addr.city === addressData.city &&
    addr.postalCode === addressData.postalCode
  );
  
  if (!existingAddress) {
    this.bookingAddresses.push(addressData);
    await this.save();
    console.log('✅ [User] Adresse de réservation ajoutée:', addressData);
  } else {
    console.log('⚠️ [User] Adresse de réservation déjà existante');
  }
  
  return this.bookingAddresses[this.bookingAddresses.length - 1];
};

// Méthode pour récupérer les adresses de réservation
userSchema.methods.getBookingAddresses = function() {
  return this.bookingAddresses.sort((a, b) => b.createdAt - a.createdAt);
};

// Méthode pour supprimer une adresse de réservation
userSchema.methods.removeBookingAddress = async function(addressId) {
  this.bookingAddresses = this.bookingAddresses.filter(addr => 
    addr._id.toString() !== addressId.toString()
  );
  await this.save();
  return this;
};

const User = mongoose.model('User', userSchema);

export default User; 