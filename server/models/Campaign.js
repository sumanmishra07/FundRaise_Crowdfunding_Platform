const mongoose = require('mongoose');

const CATEGORIES = ['Technology', 'Education', 'Health', 'Art', 'Environment', 'Community', 'Sports', 'Other'];

const campaignSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 5, maxlength: 100 },
    description: { type: String, required: true, trim: true, minlength: 20, maxlength: 4000 },
    goal: { type: Number, required: true, min: [100, 'Goal must be at least 100'] },
    deadline: { type: Date, required: true },
    category: { type: String, enum: CATEGORIES, default: 'Other', required: true },
    imageUrl: { type: String, trim: true, default: '' },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    rejectionReason: { type: String, default: '' },
    // denormalised counters, updated atomically on each pledge
    raised: { type: Number, default: 0 },
    supportersCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

campaignSchema.virtual('percent').get(function () {
  return this.goal ? Math.min(100, Math.round((this.raised / this.goal) * 100)) : 0;
});
campaignSchema.virtual('isExpired').get(function () {
  return this.deadline < new Date();
});
campaignSchema.set('toJSON', { virtuals: true });
campaignSchema.set('toObject', { virtuals: true });

campaignSchema.statics.CATEGORIES = CATEGORIES;

module.exports = mongoose.model('Campaign', campaignSchema);
