const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  category: { type: String, enum: ['Vegetables', 'Fruits', 'Grains', 'Dairy', 'Other'], required: true },
  subcategory: { type: String, default: 'Other' },
  variety: { type: String, trim: true, default: '' },
  price: { type: Number, required: true, min: 0 },
  unit: { type: String, enum: ['kg', 'g', 'litre', 'piece', 'bundle'], default: 'kg' },
  quantityAvailable: { type: Number, required: true, min: 0 },
  imageUrl: { type: String, default: '' },
  harvestDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['ACTIVE', 'SOLD_OUT', 'INACTIVE', 'PENDING_REVIEW', 'REJECTED'], 
    default: 'ACTIVE' 
  },
  flaggedReason: { type: String, default: '' },
  priceDeviationPercent: { type: Number, default: 0 },
  priceJustificationTags: [{ type: String }],
  lastPriceCheckStatus: {
    type: String,
    enum: ['NORMAL', 'LOW_WARNING', 'HIGH_FLAG'],
    default: 'NORMAL'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
