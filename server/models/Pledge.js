const mongoose = require('mongoose');

const pledgeSchema = new mongoose.Schema(
  {
    campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
    supporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: [1, 'Minimum pledge is 1'] },
    message: { type: String, trim: true, maxlength: 200, default: '' },
    anonymous: { type: Boolean, default: false },
    // mock payment details (no real payment is processed)
    payment: {
      method: { type: String, default: 'mock-card' },
      last4: { type: String, default: '4242' },
      transactionId: { type: String },
      status: { type: String, enum: ['succeeded', 'failed'], default: 'succeeded' },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Pledge', pledgeSchema);
