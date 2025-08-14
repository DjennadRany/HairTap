import mongoose from 'mongoose';

const pricingSchema = new mongoose.Schema({
  coiffeurId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true,
    index: true
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function(v) {
        return v >= 0;
      },
      message: 'Le prix de base ne peut pas être négatif'
    }
  },
  timeSlotMultiplier: {
    morning: {
      type: Number,
      default: 1.0,
      min: 0.5,
      max: 2.0,
      validate: {
        validator: function(v) {
          return v >= 0.5 && v <= 2.0;
        },
        message: 'Le multiplicateur matin doit être entre 0.5 et 2.0'
      }
    },
    afternoon: {
      type: Number,
      default: 1.0,
      min: 0.5,
      max: 2.0,
      validate: {
        validator: function(v) {
          return v >= 0.5 && v <= 2.0;
        },
        message: 'Le multiplicateur après-midi doit être entre 0.5 et 2.0'
      }
    },
    evening: {
      type: Number,
      default: 1.2,
      min: 0.5,
      max: 2.0,
      validate: {
        validator: function(v) {
          return v >= 0.5 && v <= 2.0;
        },
        message: 'Le multiplicateur soir doit être entre 0.5 et 2.0'
      }
    },
    weekend: {
      type: Number,
      default: 1.3,
      min: 0.5,
      max: 2.0,
      validate: {
        validator: function(v) {
          return v >= 0.5 && v <= 2.0;
        },
        message: 'Le multiplicateur weekend doit être entre 0.5 et 2.0'
      }
    }
  },
  locationMultiplier: {
    salon: {
      type: Number,
      default: 1.0,
      min: 0.5,
      max: 2.0,
      validate: {
        validator: function(v) {
          return v >= 0.5 && v <= 2.0;
        },
        message: 'Le multiplicateur salon doit être entre 0.5 et 2.0'
      }
    },
    domicile: {
      type: Number,
      default: 1.5,
      min: 0.5,
      max: 3.0,
      validate: {
        validator: function(v) {
          return v >= 0.5 && v <= 3.0;
        },
        message: 'Le multiplicateur domicile doit être entre 0.5 et 3.0'
      }
    }
  },
  specialOffers: [{
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    discount: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      validate: {
        validator: function(v) {
          return v >= 0 && v <= 100;
        },
        message: 'La remise doit être entre 0% et 100%'
      }
    },
    validFrom: {
      type: Date,
      required: true
    },
    validTo: {
      type: Date,
      required: true
    },
    conditions: [{
      type: String,
      trim: true,
      maxlength: 200
    }],
    isActive: {
      type: Boolean,
      default: true
    }
  }],
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

// Index pour performance
pricingSchema.index({ coiffeurId: 1, serviceId: 1 });
pricingSchema.index({ coiffeurId: 1, isActive: 1 });
pricingSchema.index({ 'specialOffers.validFrom': 1, 'specialOffers.validTo': 1 });
pricingSchema.index({ basePrice: 1 });

// Méthode pour calculer le prix final
pricingSchema.methods.calculateFinalPrice = function(timeSlot, location, date = new Date()) {
  let finalPrice = this.basePrice;
  
  // Appliquer le multiplicateur de créneau
  const hour = date.getHours();
  const dayOfWeek = date.getDay();
  
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    // Weekend
    finalPrice *= this.timeSlotMultiplier.weekend;
  } else if (hour >= 6 && hour < 12) {
    // Matin (6h-12h)
    finalPrice *= this.timeSlotMultiplier.morning;
  } else if (hour >= 12 && hour < 18) {
    // Après-midi (12h-18h)
    finalPrice *= this.timeSlotMultiplier.afternoon;
  } else if (hour >= 18 && hour < 22) {
    // Soir (18h-22h)
    finalPrice *= this.timeSlotMultiplier.evening;
  }
  
  // Appliquer le multiplicateur de lieu
  if (location === 'domicile') {
    finalPrice *= this.locationMultiplier.domicile;
  } else {
    finalPrice *= this.locationMultiplier.salon;
  }
  
  // Appliquer les offres spéciales actives
  const activeOffers = this.specialOffers.filter(offer => 
    offer.isActive && 
    offer.validFrom <= date && 
    offer.validTo >= date
  );
  
  if (activeOffers.length > 0) {
    // Prendre la plus grande remise
    const maxDiscount = Math.max(...activeOffers.map(offer => offer.discount));
    finalPrice *= (1 - maxDiscount / 100);
  }
  
  return Math.round(finalPrice * 100) / 100; // Arrondir à 2 décimales
};

// Méthode pour ajouter une offre spéciale
pricingSchema.methods.addSpecialOffer = async function(offerData) {
  const offer = {
    name: offerData.name,
    discount: offerData.discount,
    validFrom: offerData.validFrom,
    validTo: offerData.validTo,
    conditions: offerData.conditions || [],
    isActive: true
  };
  
  this.specialOffers.push(offer);
  this.updatedAt = new Date();
  await this.save();
  return this;
};

// Méthode pour désactiver une offre spéciale
pricingSchema.methods.deactivateOffer = async function(offerName) {
  const offer = this.specialOffers.find(o => o.name === offerName);
  if (offer) {
    offer.isActive = false;
    this.updatedAt = new Date();
    await this.save();
  }
  return this;
};

// Méthode pour mettre à jour les multiplicateurs
pricingSchema.methods.updateMultipliers = async function(multipliers) {
  const allowedUpdates = ['timeSlotMultiplier', 'locationMultiplier'];
  Object.keys(multipliers).forEach(key => {
    if (allowedUpdates.includes(key)) {
      this[key] = { ...this[key], ...multipliers[key] };
    }
  });
  
  this.updatedAt = new Date();
  await this.save();
  return this;
};

// Méthode statique pour récupérer les prix d'un coiffeur
pricingSchema.statics.getCoiffeurPricing = function(coiffeurId, activeOnly = true) {
  const query = { coiffeurId };
  if (activeOnly) {
    query.isActive = true;
  }
  return this.find(query).populate('serviceId', 'name category duration').sort({ 'serviceId.name': 1 });
};

// Méthode statique pour récupérer le prix d'un service spécifique
pricingSchema.statics.getServicePricing = function(coiffeurId, serviceId) {
  return this.findOne({ coiffeurId, serviceId, isActive: true });
};

// Validation personnalisée
pricingSchema.pre('save', function(next) {
  // Vérifier que validTo est après validFrom pour les offres spéciales
  for (const offer of this.specialOffers) {
    if (offer.validTo <= offer.validFrom) {
      next(new Error('La date de fin doit être après la date de début pour les offres spéciales'));
      return;
    }
  }
  
  // Vérifier que le prix de base est raisonnable
  if (this.basePrice > 1000) {
    next(new Error('Le prix de base ne peut pas dépasser 1000€'));
    return;
  }
  
  next();
});

// Middleware pour mettre à jour le champ updatedAt
pricingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Pricing = mongoose.model('Pricing', pricingSchema);

export default Pricing;
