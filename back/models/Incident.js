import mongoose from 'mongoose';

const incidentSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true // Client ou Coiffeur qui signale
  },
  reportedAgainst: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true // Client ou Coiffeur contre qui on signale
  },
  type: {
    type: String,
    enum: [
      'client_no_show',
      'coiffeur_no_show',
      'client_dissatisfied',
      'coiffeur_dissatisfied',
      'payment_issue',
      'behavior_issue',
      'service_quality_issue',
      'retard_client',
      'retard_coiffeur',
      'paiement_black'
    ],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  points: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  status: {
    type: String,
    enum: ['reported', 'under_review', 'mediation', 'resolved', 'escalated', 'dismissed'],
    default: 'reported'
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  evidence: [{
    type: {
      type: String, // 'photo', 'video', 'document', 'message'
      enum: ['photo', 'video', 'document', 'message']
    },
    url: String,
    description: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  requestedAction: {
    type: String,
    enum: ['refund_full', 'refund_partial', 'reschedule', 'compensation', 'warning', 'ban'],
    required: true
  },
  resolution: {
    type: {
      type: String,
      enum: ['refund_full', 'refund_partial', 'reschedule', 'compensation', 'warning', 'ban', 'dismissed']
    },
    amount: Number, // Montant remboursé/compensé
    reason: String,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User' // Admin ou système
    },
    resolvedAt: Date
  },
  mediationHistory: [{
    action: String,
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    message: String
  }],
  // Géolocalisation pour vérification
  geolocation: {
    reportedByLocation: {
      latitude: Number,
      longitude: Number,
      accuracy: Number,
      timestamp: Date
    },
    reportedAgainstLocation: {
      latitude: Number,
      longitude: Number,
      accuracy: Number,
      timestamp: Date
    },
    distance: Number // Distance en mètres entre les deux localisations
  },
  // Informations sur le retard (si applicable)
  retardInfo: {
    delayMinutes: Number,
    geolocationOK: Boolean,
    penaltyApplied: Boolean,
    penaltyAmount: Number,
    penaltyPercentage: Number
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

// Index pour améliorer les performances des recherches
incidentSchema.index({ 'booking': 1 });
incidentSchema.index({ 'reportedBy': 1 });
incidentSchema.index({ 'reportedAgainst': 1 });
incidentSchema.index({ 'status': 1 });
incidentSchema.index({ 'type': 1 });
incidentSchema.index({ 'severity': 1 });
incidentSchema.index({ 'points': 1 });
incidentSchema.index({ 'createdAt': -1 });

// Méthode pour calculer les points selon le type et la gravité
incidentSchema.methods.calculatePoints = function() {
  let basePoints = 0;
  
  // Points de base selon le type
  switch (this.type) {
    case 'retard_client':
      if (this.retardInfo && this.retardInfo.delayMinutes < 10) {
        basePoints = 0; // Pas de pénalité pour retard < 10 min
      } else if (this.retardInfo && this.retardInfo.delayMinutes >= 10 && this.retardInfo.delayMinutes < 30) {
        basePoints = this.retardInfo.geolocationOK ? 0 : 1; // 1 point si géolocalisation suspecte
      } else if (this.retardInfo && this.retardInfo.delayMinutes >= 30 && this.retardInfo.delayMinutes < 45) {
        basePoints = 2; // 2 points si accepté, 4 si annulé
      } else if (this.retardInfo && this.retardInfo.delayMinutes >= 45) {
        basePoints = 4; // 4 points si annulation automatique
      }
      break;
    case 'client_no_show':
    case 'coiffeur_no_show':
      basePoints = 7; // 7 points pour no-show
      break;
    case 'service_quality_issue':
      basePoints = 7; // 7 points pour erreur technique grave
      break;
    case 'behavior_issue':
      basePoints = this.severity === 'critical' ? 10 : 8; // 8-10 points selon gravité
      break;
    case 'paiement_black':
      basePoints = 9; // 9 points pour fraude
      break;
    case 'client_dissatisfied':
    case 'coiffeur_dissatisfied':
      basePoints = this.severity === 'high' ? 7 : 5; // 5-7 points selon gravité
      break;
    default:
      basePoints = 3; // 3 points par défaut
  }
  
  // Ajustement selon la gravité
  if (this.severity === 'critical') {
    basePoints = Math.max(basePoints, 10); // Minimum 10 points pour critique
  } else if (this.severity === 'high') {
    basePoints = Math.max(basePoints, 7); // Minimum 7 points pour grave
  } else if (this.severity === 'medium') {
    basePoints = Math.max(basePoints, 4); // Minimum 4 points pour moyen
  } else if (this.severity === 'low') {
    basePoints = Math.min(basePoints, 3); // Maximum 3 points pour léger
  }
  
  this.points = Math.min(basePoints, 10); // Maximum 10 points
  return this.points;
};

// Méthode pour déterminer le niveau de bannissement selon les points
incidentSchema.methods.getBanLevel = function() {
  if (this.points >= 10) {
    return 'permanent'; // Bannissement total
  } else if (this.points === 9) {
    return 'temporary_30'; // Bannissement temporaire 30 jours
  } else if (this.points >= 7) {
    return 'provisional_7'; // Bannissement provisoire 7 jours
  } else if (this.points >= 4) {
    return 'alert'; // Alerte
  } else {
    return 'warning'; // Avertissement
  }
};

// Méthode statique pour récupérer les incidents d'un utilisateur
incidentSchema.statics.getUserIncidents = function(userId, days = 90) {
  const dateLimit = new Date();
  dateLimit.setDate(dateLimit.getDate() - days);
  
  return this.find({
    $or: [
      { reportedBy: userId },
      { reportedAgainst: userId }
    ],
    createdAt: { $gte: dateLimit }
  })
    .populate('booking', 'date service price')
    .populate('reportedBy', 'name email photo')
    .populate('reportedAgainst', 'name email photo')
    .sort({ createdAt: -1 });
};

// Méthode statique pour calculer les points totaux d'un utilisateur
incidentSchema.statics.getUserTotalPoints = async function(userId, days = 90) {
  const dateLimit = new Date();
  dateLimit.setDate(dateLimit.getDate() - days);
  
  const incidents = await this.find({
    reportedAgainst: userId,
    status: { $in: ['resolved', 'escalated'] },
    createdAt: { $gte: dateLimit }
  });
  
  // Calcul avec décroissance temporelle
  const now = new Date();
  let totalPoints = 0;
  
  incidents.forEach(incident => {
    const daysElapsed = (now - incident.createdAt) / (1000 * 60 * 60 * 24);
    const decay = Math.max(0, 1 - (daysElapsed / 90)); // Décroissance sur 90 jours
    totalPoints += incident.points * decay;
  });
  
  return Math.round(totalPoints * 100) / 100; // Arrondi à 2 décimales
};

const Incident = mongoose.model('Incident', incidentSchema);

export default Incident;









