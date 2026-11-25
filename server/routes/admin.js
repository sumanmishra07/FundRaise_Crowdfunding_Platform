const express = require('express');
const mongoose = require('mongoose');
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect, authorize('admin'));

// GET /api/admin/campaigns?status=pending|approved|rejected|all
router.get('/campaigns', async (req, res) => {
  const { status = 'pending' } = req.query;
  const q = status === 'all' ? {} : { status };
  const items = await Campaign.find(q).populate('creator', 'name email').sort({ createdAt: -1 });
  const counts = await Campaign.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]);
  const summary = { pending: 0, approved: 0, rejected: 0 };
  counts.forEach((c) => (summary[c._id] = c.n));
  res.json({ items, summary });
});

// PATCH /api/admin/campaigns/:id/status  { status: 'approved' | 'rejected', reason }
router.patch('/campaigns/:id/status', async (req, res) => {
  try {
    const { status, reason = '' } = req.body;
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ message: 'Campaign not found.' });

    const c = await Campaign.findByIdAndUpdate(
      req.params.id,
      { status, rejectionReason: status === 'rejected' ? reason : '' },
      { new: true }
    ).populate('creator', 'name email');
    if (!c) return res.status(404).json({ message: 'Campaign not found.' });

    const io = req.app.get('io');
    io && io.emit('campaign:status', { campaignId: String(c._id), status: c.status });

    res.json({ campaign: c });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 }).limit(200);
  res.json({ items: users });
});

module.exports = router;
