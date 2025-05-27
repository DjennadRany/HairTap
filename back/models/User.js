import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const ServiceSchema = new mongoose.Schema({
  name: String,
  priceHT: Number,
  duration: String,
  description: String
});

const userSchema = new mongoose.Schema({
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
    minlength: 6,
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
  photo: {
    type: String,
    default: 'default-avatar.png'
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
  speciality: [String],
  rating: {
    type: Number,
    default: 0
  },
  priceRange: {
    type: String,
    enum: ['€', '€€', '€€€']
  },
  workingHours: {
    monday: { start: String, end: String },
    tuesday: { start: String, end: String },
    wednesday: { start: String, end: String },
    thursday: { start: String, end: String },
    friday: { start: String, end: String },
    saturday: { start: String, end: String },
    sunday: { start: String, end: String }
  },
  description: String,
  photos: [String],
  mode: [{ type: String, enum: ['salon', 'domicile'] }],
  availability: [
    {
      date: String,
      slots: [String]
    }
  ],
  cancellationPolicy: { type: String, default: "Annulation gratuite jusqu'à 24h avant le rendez-vous." },
  bio: String,
  experience: String,
  diplomas: String,
  tarifs: String,
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coiffeur'
  }],
  preferences: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
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
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  services: [ServiceSchema],
  gallery: [String]
}, {
  timestamps: true
});

// Index pour améliorer les performances des recherches
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ role: 1 });

// Hash password before saving (ACTIVÉ)
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method (PROD)
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

// Méthode pour ajouter un coiffeur aux favoris
userSchema.methods.addFavorite = async function(coiffeurId) {
  if (!this.favorites.includes(coiffeurId)) {
    this.favorites.push(coiffeurId);
    await this.save();
  }
};

// Méthode pour retirer un coiffeur des favoris
userSchema.methods.removeFavorite = async function(coiffeurId) {
  this.favorites = this.favorites.filter(id => id.toString() !== coiffeurId.toString());
  await this.save();
};

// Méthode pour vérifier si un coiffeur est dans les favoris
userSchema.methods.hasFavorite = function(coiffeurId) {
  return this.favorites.some(id => id.toString() === coiffeurId.toString());
};

// Middleware pour mettre à jour le champ updatedAt
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const User = mongoose.model('User', userSchema);

export default User; 