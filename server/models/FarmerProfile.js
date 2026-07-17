const mongoose = require('mongoose');

const farmerProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  farmName: { type: String, required: true, trim: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  address: { type: String, required: true },
  bankDetails: {
    upiId: { type: String, required: true, trim: true },
    accountNumber: { type: String, trim: true },
    ifscCode: { type: String, trim: true }
  },
  trustScore: { type: Number, default: 100, min: 0, max: 100 },
  deliveryRadius: { type: Number, default: 15 }, // In kilometers
  verificationStatus: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'], default: 'PENDING' },
  bio: { type: String, trim: true },
  fssaiNumber: { type: String, trim: true, default: '' },
  isFssaiVerified: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Set up the 2dsphere index for location search
farmerProfileSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('FarmerProfile', farmerProfileSchema);
