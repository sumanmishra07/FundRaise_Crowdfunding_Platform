const express = require('express');
const Pledge = require('../models/Pledge');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/pledges/mine  (supporter's own pledge history)
router.get('/mine', protect, authorize('supporter'), async (req, res) => {
  const items = await Pledge.find({ supporter: req.user._id })
    .populate('campaign', 'title category imageUrl raised goal deadline')
    .sort({ createdAt: -1 });
  const total = items.reduce((s, p) => s + p.amount, 0);
  res.json({ items, total });
});

module.exports = router;
