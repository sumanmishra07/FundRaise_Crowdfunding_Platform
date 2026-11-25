const express = require('express');
const Campaign = require('../models/Campaign');
const Pledge = require('../models/Pledge');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/stats/overview  (public) -> total raised, supporters count, category-wise funding
router.get('/overview', async (req, res) => {
  try {
    const [totals, supporters, byCategory, campaignCounts] = await Promise.all([
      Pledge.aggregate([{ $group: { _id: null, totalRaised: { $sum: '$amount' }, pledges: { $sum: 1 } } }]),
      Pledge.aggregate([{ $group: { _id: '$supporter' } }, { $count: 'n' }]),
      Pledge.aggregate([
        { $lookup: { from: 'campaigns', localField: 'campaign', foreignField: '_id', as: 'c' } },
        { $unwind: '$c' },
        {
          $group: {
            _id: '$c.category',
            raised: { $sum: '$amount' },
            pledges: { $sum: 1 },
            campaigns: { $addToSet: '$c._id' },
          },
        },
        { $project: { _id: 0, category: '$_id', raised: 1, pledges: 1, campaigns: { $size: '$campaigns' } } },
        { $sort: { raised: -1 } },
      ]),
      Campaign.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
    ]);

    const cc = { pending: 0, approved: 0, rejected: 0 };
    campaignCounts.forEach((c) => (cc[c._id] = c.n));

    res.json({
      totalRaised: totals[0]?.totalRaised || 0,
      totalPledges: totals[0]?.pledges || 0,
      supportersCount: supporters[0]?.n || 0,
      campaigns: cc,
      byCategory,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/stats/top  (public) -> top campaigns by funds raised
router.get('/top', async (req, res) => {
  const items = await Campaign.find({ status: 'approved' }).sort({ raised: -1 }).limit(5).populate('creator', 'name');
  res.json({ items });
});

// GET /api/stats/recent  (public) -> latest pledges across the platform (for the live feed)
router.get('/recent', async (req, res) => {
  const pledges = await Pledge.find()
    .sort({ createdAt: -1 })
    .limit(8)
    .populate('supporter', 'name')
    .populate('campaign', 'title');
  res.json({
    items: pledges.map((p) => ({
      _id: p._id,
      amount: p.amount,
      name: p.anonymous ? 'Anonymous' : p.supporter?.name || 'Supporter',
      campaignId: p.campaign?._id,
      title: p.campaign?.title || 'a campaign',
      createdAt: p.createdAt,
    })),
  });
});

// GET /api/stats/creator  (creator) -> per-creator aggregation
router.get('/creator', protect, authorize('creator'), async (req, res) => {
  const [agg] = await Campaign.aggregate([
    { $match: { creator: req.user._id } },
    {
      $group: {
        _id: null,
        campaigns: { $sum: 1 },
        raised: { $sum: '$raised' },
        supporters: { $sum: '$supportersCount' },
        goal: { $sum: '$goal' },
      },
    },
  ]);
  res.json({ stats: agg || { campaigns: 0, raised: 0, supporters: 0, goal: 0 } });
});

module.exports = router;
