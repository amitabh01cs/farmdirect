const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true }
  }],
  totalPrice: { type: Number, required: true },
  deliveryAddress: { type: String, required: true },
  deliveryCoordinates: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  paymentMethod: { type: String, enum: ['CARD', 'UPI', 'COD'], required: true },
  paymentStatus: { type: String, enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'], default: 'PENDING' },
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REJECTED'],
    default: 'PENDING'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
