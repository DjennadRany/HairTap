/**
 * Modèle de validation de prestation - Style Uber
 * Checklist avant/pendant/après prestation
 */

import mongoose from 'mongoose';

const bookingValidationSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true
  },
  
  // ✅ Checklist AVANT prestation
  preService: {
    materialPrepared: {
      type: Boolean,
      default: false
    },
    clientContacted: {
      type: Boolean,
      default: false
    },
    addressVerified: {
      type: Boolean,
      default: false
    },
    timeConfirmed: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date
    }
  },
  
  // ✅ Checklist PENDANT prestation
  duringService: {
    clientPresent: {
      type: Boolean,
      default: false
    },
    serviceStarted: {
      type: Boolean,
      default: false
    },
    serviceStartedAt: {
      type: Date
    },
    qualityChecked: {
      type: Boolean,
      default: false
    },
    // ✅ NOUVEAU: Double confirmation (client + coiffeur)
    clientConfirmed: {
      type: Boolean,
      default: false
    },
    clientConfirmedAt: {
      type: Date
    },
    coiffeurConfirmed: {
      type: Boolean,
      default: false
    },
    coiffeurConfirmedAt: {
      type: Date
    },
    // ✅ NOUVEAU: Géolocalisation pour vérification
    geolocation: {
      clientLocation: {
        latitude: Number,
        longitude: Number,
        accuracy: Number,
        timestamp: Date
      },
      coiffeurLocation: {
        latitude: Number,
        longitude: Number,
        accuracy: Number,
        timestamp: Date
      },
      distance: Number, // Distance en mètres
      isMatch: {
        type: Boolean,
        default: false
      }
    },
    // ✅ NOUVEAU: Photos de confirmation
    confirmationPhotos: [{
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      url: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  },
  
  // ✅ Checklist APRÈS prestation
  postService: {
    serviceCompleted: {
      type: Boolean,
      default: false
    },
    serviceCompletedAt: {
      type: Date
    },
    clientSatisfied: {
      type: Boolean,
      default: false
    },
    paymentConfirmed: {
      type: Boolean,
      default: false
    },
    invoiceIssued: {
      type: Boolean,
      default: false
    },
    // ✅ NOUVEAU: Double confirmation fin de prestation (client + coiffeur)
    clientEndConfirmed: {
      type: Boolean,
      default: false
    },
    clientEndConfirmedAt: {
      type: Date
    },
    coiffeurEndConfirmed: {
      type: Boolean,
      default: false
    },
    coiffeurEndConfirmedAt: {
      type: Date
    },
    // ✅ NOUVEAU: Problème signalé par le client
    clientHasProblem: {
      type: Boolean,
      default: false
    },
    clientProblemDescription: {
      type: String,
      trim: true
    },
    // ✅ NOUVEAU: Régularisation par le client (en attente de confirmation coiffeur)
    clientRegularization: {
      type: Boolean,
      default: false
    },
    clientRegularizationAt: {
      type: Date
    },
    clientRegularizationNotes: {
      type: String,
      trim: true
    },
    // ✅ NOUVEAU: Confirmation de la régularisation par le coiffeur
    coiffeurRegularizationConfirmed: {
      type: Boolean,
      default: false
    },
    coiffeurRegularizationConfirmedAt: {
      type: Date
    },
    coiffeurRegularizationRejected: {
      type: Boolean,
      default: false
    },
    coiffeurRegularizationRejectedAt: {
      type: Date
    },
    coiffeurRegularizationRejectionReason: {
      type: String,
      trim: true
    }
  },
  
  // ✅ Statut global de validation
  validationStatus: {
    type: String,
    enum: ['not_started', 'pre_service', 'during_service', 'post_service', 'completed', 'issues'],
    default: 'not_started'
  },
  
  // ✅ Problèmes détectés
  issues: [{
    type: {
      type: String,
      enum: ['missing_material', 'client_absent', 'coiffeur_absent', 'quality_issue', 'payment_issue', 'retard_client', 'retard_coiffeur', 'no_show', 'other']
    },
    description: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    detectedAt: {
      type: Date,
      default: Date.now
    },
    resolved: {
      type: Boolean,
      default: false
    },
    resolvedAt: Date,
    // ✅ NOUVEAU: Informations sur le retard
    retardInfo: {
      delayMinutes: Number,
      geolocationOK: Boolean,
      penaltyApplied: Boolean,
      penaltyAmount: Number,
      penaltyPercentage: Number
    }
  }],
  
  // ✅ Notes de validation
  notes: {
    type: String,
    trim: true
  },
  
  // ✅ Validation par le coiffeur
  validatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  validatedAt: {
    type: Date
  },
  
  // ✅ Validation par le client (optionnel)
  clientValidated: {
    type: Boolean,
    default: false
  },
  clientValidatedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index pour performance
bookingValidationSchema.index({ booking: 1 });
bookingValidationSchema.index({ validationStatus: 1 });
bookingValidationSchema.index({ 'issues.resolved': 1 });

// Méthodes du modèle
bookingValidationSchema.methods.completePreService = function() {
  this.preService.completedAt = new Date();
  this.validationStatus = 'during_service';
  return this.save();
};

bookingValidationSchema.methods.startService = function() {
  this.duringService.serviceStarted = true;
  this.duringService.serviceStartedAt = new Date();
  this.validationStatus = 'during_service';
  return this.save();
};

bookingValidationSchema.methods.completeService = function() {
  this.postService.serviceCompleted = true;
  this.postService.serviceCompletedAt = new Date();
  this.validationStatus = 'post_service';
  return this.save();
};

bookingValidationSchema.methods.finalizeValidation = function() {
  // Vérifier que tout est complété
  const preServiceComplete = this.preService.materialPrepared &&
                              this.preService.clientContacted &&
                              this.preService.addressVerified &&
                              this.preService.timeConfirmed;
  
  const duringServiceComplete = this.duringService.clientPresent &&
                                this.duringService.serviceStarted &&
                                this.duringService.qualityChecked;
  
  const postServiceComplete = this.postService.serviceCompleted &&
                              this.postService.clientSatisfied &&
                              this.postService.paymentConfirmed;
  
  if (preServiceComplete && duringServiceComplete && postServiceComplete) {
    this.validationStatus = 'completed';
    this.validatedAt = new Date();
    return this.save();
  }
  
  throw new Error('Toutes les étapes de validation doivent être complétées');
};

bookingValidationSchema.methods.addIssue = function(type, description, severity = 'medium') {
  this.issues.push({
    type,
    description,
    severity,
    detectedAt: new Date(),
    resolved: false
  });
  this.validationStatus = 'issues';
  return this.save();
};

bookingValidationSchema.methods.resolveIssue = function(issueId) {
  const issue = this.issues.id(issueId);
  if (issue) {
    issue.resolved = true;
    issue.resolvedAt = new Date();
    return this.save();
  }
  throw new Error('Problème non trouvé');
};

const BookingValidation = mongoose.model('BookingValidation', bookingValidationSchema);

export default BookingValidation;

