import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  coiffeur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  deliveryOption: {
    type: String,
    required: true,
    enum: ['pickup', 'delivery', 'coiffeur'],
    default: 'pickup'
  },
  deliveryAddress: {
    type: String,
    required: function() {
      return this.deliveryOption !== 'pickup';
    }
  },
  deliveryFee: {
    type: Number,
    default: 0
  },
  customerInfo: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    }
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'paypal', 'manual', 'pending'],
    default: 'pending'
  },
  paymentIntentId: {
    type: String
  },
  notes: {
    type: String
  },
  estimatedDelivery: {
    type: Date
  },
  deliveredAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Méthodes pour gérer les statuts
orderSchema.methods.markAsPaid = function() {
  this.status = 'paid';
  this.paymentMethod = 'manual'; // ou 'stripe' selon le cas
  return this.save();
};

orderSchema.methods.markAsShipped = function() {
  this.status = 'shipped';
  return this.save();
};

orderSchema.methods.markAsDelivered = function() {
  this.status = 'delivered';
  this.deliveredAt = new Date();
  return this.save();
};

orderSchema.methods.cancel = function() {
  this.status = 'cancelled';
  return this.save();
};

// Calcul automatique du prix total
orderSchema.pre('save', function(next) {
  if (this.isModified('quantity') || this.isModified('unitPrice') || this.isModified('deliveryFee')) {
    this.totalPrice = (this.unitPrice * this.quantity) + (this.deliveryFee || 0);
  }
  next();
});

// Index pour les performances
orderSchema.index({ coiffeur: 1, status: 1 });
orderSchema.index({ customer: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);

export default Order; 