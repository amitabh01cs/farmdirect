const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  type: { type: String, enum: ['ORDER_STATUS', 'NEW_ORDER', 'NEW_REVIEW', 'GENERAL'], default: 'GENERAL' },
  read: { type: Boolean, default: false }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
