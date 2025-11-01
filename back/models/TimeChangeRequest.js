import mongoose from 'mongoose';

const timeChangeRequestSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
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
  requestedDate: {
    type: Date,
    required: true
  },
  requestedTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // Format HH:MM
  },
  reason: {
    type: String,
    trim: true,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  coiffeurResponse: {
    type: String,
    trim: true
  },
  responseDate: {
    type: Date
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
timeChangeRequestSchema.index({ 'booking': 1 });
timeChangeRequestSchema.index({ 'client': 1 });
timeChangeRequestSchema.index({ 'coiffeur': 1 });
timeChangeRequestSchema.index({ 'status': 1 });

// Méthode pour approuver une demande
timeChangeRequestSchema.methods.approve = function(response) {
  this.status = 'approved';
  this.coiffeurResponse = response || 'Demande approuvée';
  this.responseDate = new Date();
  this.updatedAt = new Date();
  return this.save();
};

// Méthode pour rejeter une demande
timeChangeRequestSchema.methods.reject = function(response) {
  this.status = 'rejected';
  this.coiffeurResponse = response || 'Demande rejetée';
  this.responseDate = new Date();
  this.updatedAt = new Date();
  return this.save();
};

// Méthode statique pour récupérer les demandes d'un coiffeur
timeChangeRequestSchema.statics.getCoiffeurRequests = function(coiffeurId) {
  return this.find({ coiffeur: coiffeurId })
    .populate('booking', 'service date duration price')
    .populate('client', 'name photo')
    .sort({ createdAt: -1 });
};

// Méthode statique pour récupérer les demandes d'un client
timeChangeRequestSchema.statics.getClientRequests = function(clientId) {
  return this.find({ client: clientId })
    .populate('booking', 'service date duration price')
    .populate('coiffeur', 'name photo')
    .sort({ createdAt: -1 });
};

const TimeChangeRequest = mongoose.model('TimeChangeRequest', timeChangeRequestSchema);

export default TimeChangeRequest;
