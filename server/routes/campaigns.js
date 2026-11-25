const express = require('express');
const mongoose = require('mongoose');
const Campaign = require('../models/Campaign');
const Pledge = require('../models/Pledge');
const { protect, optionalAuth, authorize } = require('../middleware/auth');

const router = express.Router();

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

/* ---------- READ ---------- */

// GET /api/campaigns?category=&search=&sort=&status=active|ended|funded&page=&limit=
router.get('/', async (req, res) => {
  try {
    const { category, search, sort = 'newest', status, page = 1, limit = 12 } = req.query;
    const q = { status: 'approved' };
    if (category && category !== 'All') q.category = category;
    if (search) q.title = { $regex: search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };

    const now = new Date();
    if (status === 'active') q.deadline = { $gte: now };
    if (status === 'ended') q.deadline = { $lt: now };

    const sortMap = {
      newest: { createdAt: -1 },
      ending: { deadline: 1 },
      raised: { raised: -1 },
      popular: { supportersCount: -1 },
    };

    const p = Math.max(1, parseInt(page));
    const l = Math.min(50, Math.max(1, parseInt(limit)));

    let [items, total] = await Promise.all([
      Campaign.find(q)
        .populate('creator', 'name')
        .sort(sortMap[sort] || sortMap.newest)
        .skip((p - 1) * l)
        .limit(l),
      Campaign.countDocuments(q),
    ]);

    if (status === 'funded') items = items.filter((c) => c.raised >= c.goal);

    res.json({ items, total, page: p, pages: Math.ceil(total / l) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/campaigns/mine  (creator dashboard)
router.get('/mine', protect, authorize('creator'), async (req, res) => {
  const items = await Campaign.find({ creator: req.user._id }).sort({ createdAt: -1 });
  res.json({ items });
});

// GET /api/campaigns/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(404).json({ message: 'Campaign not found.' });
    const c = await Campaign.findById(req.params.id).populate('creator', 'name');
    if (!c) return res.status(404).json({ message: 'Campaign not found.' });

    const isOwner = req.user && String(c.creator._id) === String(req.user._id);
    const isAdmin = req.user && req.user.role === 'admin';
    if (c.status !== 'approved' && !isOwner && !isAdmin) {
      return res.status(404).json({ message: 'Campaign not found.' });
    }
    res.json({ campaign: c });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/campaigns/:id/pledges  (recent supporters)
router.get('/:id/pledges', async (req, res) => {
  if (!isValidId(req.params.id)) return res.json({ items: [] });
  const pledges = await Pledge.find({ campaign: req.params.id })
    .populate('supporter', 'name')
    .sort({ createdAt: -1 })
    .limit(15);
  const items = pledges.map((p) => ({
    _id: p._id,
    amount: p.amount,
    message: p.message,
    createdAt: p.createdAt,
    name: p.anonymous ? 'Anonymous' : p.supporter?.name || 'Supporter',
  }));
  res.json({ items });
});

/* ---------- CREATE / UPDATE / DELETE ---------- */

const validateCampaignBody = (b, { partial = false } = {}) => {
  const errors = [];
  if (!partial || b.goal !== undefined) {
    if (!Number.isFinite(Number(b.goal)) || Number(b.goal) < 100) errors.push('Goal must be a number of at least 100.');
  }
  if (!partial || b.deadline !== undefined) {
    const d = new Date(b.deadline);
    if (isNaN(d.getTime())) errors.push('A valid deadline is required.');
    else if (d <= new Date()) errors.push('Deadline must be in the future.');
  }
  return errors;
};

// POST /api/campaigns  (creator)
router.post('/', protect, authorize('creator'), async (req, res) => {
  try {
    const { title, description, goal, deadline, category, imageUrl } = req.body;
    const errors = validateCampaignBody(req.body);
    if (errors.length) return res.status(400).json({ message: errors.join(' ') });

    const campaign = await Campaign.create({
      title,
      description,
      goal: Number(goal),
      deadline,
      category,
      imageUrl,
      creator: req.user._id,
      status: 'pending',
    });

    const io = req.app.get('io');
    io && io.to('admins').emit('campaign:pending', { _id: campaign._id, title: campaign.title });

    res.status(201).json({ campaign });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/campaigns/:id  (owner creator or admin)
router.put('/:id', protect, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(404).json({ message: 'Campaign not found.' });
    const c = await Campaign.findById(req.params.id);
    if (!c) return res.status(404).json({ message: 'Campaign not found.' });

    const isOwner = String(c.creator) === String(req.user._id);
    if (!isOwner && req.user.role !== 'admin') return res.status(403).json({ message: 'Not allowed.' });

    const body = req.body;
    if (body.goal !== undefined && Number(body.goal) < c.raised) {
      return res.status(400).json({ message: 'Goal cannot be lower than the amount already raised.' });
    }
    const errors = validateCampaignBody(body, { partial: true });
    if (errors.length) return res.status(400).json({ message: errors.join(' ') });

    ['title', 'description', 'goal', 'deadline', 'category', 'imageUrl'].forEach((f) => {
      if (body[f] !== undefined) c[f] = f === 'goal' ? Number(body[f]) : body[f];
    });
    // a rejected campaign goes back to review after the creator edits it
    if (isOwner && c.status === 'rejected') {
      c.status = 'pending';
      c.rejectionReason = '';
    }
    await c.save();
    res.json({ campaign: c });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/campaigns/:id  (owner if no pledges, or admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(404).json({ message: 'Campaign not found.' });
    const c = await Campaign.findById(req.params.id);
    if (!c) return res.status(404).json({ message: 'Campaign not found.' });

    const isOwner = String(c.creator) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Not allowed.' });
    if (isOwner && !isAdmin && c.raised > 0) {
      return res.status(400).json({ message: 'Campaigns that already received pledges cannot be deleted.' });
    }

    await Pledge.deleteMany({ campaign: c._id });
    await c.deleteOne();
    res.json({ message: 'Campaign deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ---------- MOCK PLEDGE FLOW ---------- */

// POST /api/campaigns/:id/pledge  (supporter)
router.post('/:id/pledge', protect, authorize('supporter'), async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(404).json({ message: 'Campaign not found.' });

    const amount = Number(req.body.amount);
    const { message = '', anonymous = false, card = {} } = req.body;

    // --- validation of amount ---
    if (!Number.isFinite(amount) || !Number.isInteger(amount)) {
      return res.status(400).json({ message: 'Pledge amount must be a whole number.' });
    }
    if (amount < 1) return res.status(400).json({ message: 'Minimum pledge is 1.' });
    if (amount > 1000000) return res.status(400).json({ message: 'Maximum pledge is 10,00,000.' });

    // --- validation of campaign status ---
    const existing = await Campaign.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Campaign not found.' });
    if (existing.status !== 'approved') {
      return res.status(400).json({ message: 'This campaign is not approved for pledges yet.' });
    }
    if (existing.deadline < new Date()) {
      return res.status(400).json({ message: 'This campaign has ended. Pledges are closed.' });
    }
    if (String(existing.creator) === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot pledge to your own campaign.' });
    }

    // --- mock payment (always succeeds unless the card number ends with 0000) ---
    const digits = String(card.number || '4242424242424242').replace(/\D/g, '');
    if (digits.endsWith('0000')) {
      return res.status(402).json({ message: 'Mock payment declined (card ending 0000 always fails).' });
    }
    const transactionId = 'MOCK_' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 7).toUpperCase();

    const alreadyBacked = await Pledge.exists({ campaign: existing._id, supporter: req.user._id });

    const pledge = await Pledge.create({
      campaign: existing._id,
      supporter: req.user._id,
      amount,
      message: String(message).slice(0, 200),
      anonymous: !!anonymous,
      payment: { method: 'mock-card', last4: digits.slice(-4), transactionId, status: 'succeeded' },
    });

    // atomic counter update
    const updated = await Campaign.findByIdAndUpdate(
      existing._id,
      { $inc: { raised: amount, supportersCount: alreadyBacked ? 0 : 1 } },
      { new: true }
    );

    // --- live update via Socket.IO ---
    const io = req.app.get('io');
    const payload = {
      campaignId: String(updated._id),
      title: updated.title,
      raised: updated.raised,
      goal: updated.goal,
      supportersCount: updated.supportersCount,
      percent: updated.percent,
      pledge: {
        amount,
        name: anonymous ? 'Anonymous' : req.user.name,
        message: pledge.message,
        createdAt: pledge.createdAt,
      },
    };
    io && io.to(`campaign:${updated._id}`).emit('pledge:new', payload);

    res.status(201).json({ pledge, campaign: updated, transactionId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
