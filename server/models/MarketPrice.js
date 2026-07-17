const mongoose = require('mongoose');

const marketPriceSchema = new mongoose.Schema({
  commodity: { type: String, required: true },
  state: { type: String, required: true },
  district: { type: String, required: true },
  averagePrice: { type: Number, required: true }, // price in INR per kg/unit
  minPrice: { type: Number },
  maxPrice: { type: Number },
  date: { type: Date, required: true, default: Date.now },
  source: { type: String, default: 'eNAM Mandi API' }
});

// Compound index to search daily prices efficiently
marketPriceSchema.index({ commodity: 1, state: 1, district: 1, date: -1 });

module.exports = mongoose.model('MarketPrice', marketPriceSchema);
