import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['time_change_request', 'time_change_response', 'booking_update', 'chat_message'],
    required: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'read'],
    default: 'pending'
  },
  metadata: {
    newDate: String,
    newTime: String,
    reason: String,
    response: String
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index pour améliorer les performances
notificationSchema.index({ toUserId: 1, type: 1, status: 1 });
notificationSchema.index({ bookingId: 1, type: 1 });

// Méthodes statiques
notificationSchema.statics.getCoiffeurTimeChangeRequests = function(coiffeurId) {
  return this.find({
    toUserId: coiffeurId,
    type: 'time_change_request'
  }).populate('fromUserId', 'name photo').populate('bookingId', 'service date price');
};

notificationSchema.statics.getClientTimeChangeRequests = function(clientId) {
  return this.find({
    fromUserId: clientId,
    type: 'time_change_request'
  }).populate('toUserId', 'name photo').populate('bookingId', 'service date price');
};

// Méthodes d'instance
notificationSchema.methods.markAsRead = function() {
  this.read = true;
  this.status = 'read';
  return this.save();
};

notificationSchema.methods.respond = function(response, approved) {
  this.status = approved ? 'approved' : 'rejected';
  this.metadata.response = response;
  this.updatedAt = new Date();
  return this.save();
};

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
