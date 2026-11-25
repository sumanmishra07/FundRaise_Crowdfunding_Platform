// Run: npm run seed   -> creates demo admin, creators, supporters, campaigns and pledges
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Campaign = require('./models/Campaign');
const Pledge = require('./models/Pledge');

const day = 86400000;
const img = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=70`;

(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fundraise');
  await Promise.all([User.deleteMany(), Campaign.deleteMany(), Pledge.deleteMany()]);

  const admin = await User.create({ name: 'Admin', email: 'admin@fundraise.com', password: 'admin123', role: 'admin' });
  const creators = await User.create([
    { name: 'Aarav Sharma', email: 'creator@fundraise.com', password: 'creator123', role: 'creator' },
    { name: 'Priya Nair', email: 'priya@fundraise.com', password: 'creator123', role: 'creator' },
  ]);
  const supporters = await User.create([
    { name: 'Rohan Mehta', email: 'supporter@fundraise.com', password: 'supporter123', role: 'supporter' },
    { name: 'Sneha Kapoor', email: 'sneha@fundraise.com', password: 'supporter123', role: 'supporter' },
    { name: 'Vikram Singh', email: 'vikram@fundraise.com', password: 'supporter123', role: 'supporter' },
  ]);

  const defs = [
    ['SolarSchool: Solar Power for 20 Village Schools', 'Education', 500000, 40, 'photo-1509391366360-2e959784a276', creators[0], 'approved',
      'We will install rooftop solar panels and batteries in 20 rural schools so that classrooms stay lit and computer labs keep running even during long power cuts.'],
    ['Pocket Doctor - Offline Health App', 'Health', 300000, 25, 'photo-1576091160399-112ba8d25d1d', creators[0], 'approved',
      'An offline-first mobile app that gives community health workers diagnostic checklists, medicine guidance and emergency protocols without needing internet.'],
    ['Clean Ganga Riverfront Drive', 'Environment', 250000, 15, 'photo-1532996122724-e3c354a0b15b', creators[1], 'approved',
      'A volunteer-led river clean-up with waste segregation points, recycling partnerships and awareness workshops along 5 km of riverfront.'],
    ['Street Art Festival: Colours of Delhi', 'Art', 120000, 30, 'photo-1460661419201-fd4cecdf8a8b', creators[1], 'approved',
      'Fifty local artists will transform blank walls across the city into murals that tell stories of our neighbourhoods.'],
    ['Open-Source AI Tutor for Hindi Students', 'Technology', 800000, 55, 'photo-1677442136019-21780ecad995', creators[0], 'approved',
      'A free, open-source AI tutor that explains maths and science in simple Hindi, designed for low-bandwidth devices.'],
    ['Under-19 Girls Cricket Academy', 'Sports', 200000, 20, 'photo-1531415074968-036ba1b575da', creators[1], 'approved',
      'Coaching, kits and tournament travel for 60 young girls from small towns who dream of playing for the nation.'],
    ['Community Library on Wheels', 'Community', 150000, 35, 'photo-1507842217343-583bb7270b66', creators[0], 'pending',
      'A converted van stocked with 3,000 books visiting underserved neighbourhoods every week.'],
    ['Crypto Gold Scheme', 'Other', 900000, 10, '', creators[1], 'rejected',
      'Guaranteed returns for everyone who pledges. (Seeded as a rejected example campaign.)'],
  ];

  const campaigns = [];
  for (const [title, category, goal, days, photo, creator, status, description] of defs) {
    campaigns.push(
      await Campaign.create({
        title, category, goal, description, creator: creator._id, status,
        deadline: new Date(Date.now() + days * day),
        imageUrl: photo ? img(photo) : '',
        rejectionReason: status === 'rejected' ? 'Unrealistic promises and unclear use of funds.' : '',
      })
    );
  }

  const amounts = [500, 1000, 2500, 5000, 750, 1500, 10000, 300, 2000];
  const messages = ['Great cause!', 'All the best 🙌', 'Proud to back this.', '', 'Keep going!', ''];
  for (const c of campaigns.filter((x) => x.status === 'approved')) {
    const n = 6 + Math.floor(Math.random() * 12);
    const backers = new Set();
    let raised = 0;
    for (let i = 0; i < n; i++) {
      const s = supporters[i % supporters.length];
      const amount = amounts[Math.floor(Math.random() * amounts.length)] * (1 + Math.floor(Math.random() * 6));
      await Pledge.create({
        campaign: c._id, supporter: s._id, amount,
        message: messages[i % messages.length], anonymous: i % 5 === 0,
        payment: { method: 'mock-card', last4: '4242', transactionId: 'MOCK_SEED' + i, status: 'succeeded' },
      });
      raised += amount;
      backers.add(String(s._id));
    }
    c.raised = Math.min(raised, Math.round(c.goal * 1.15));
    c.supportersCount = backers.size;
    await c.save();
  }

  console.log('Seed complete.\n');
  console.log('Admin      admin@fundraise.com      / admin123');
  console.log('Creator    creator@fundraise.com    / creator123');
  console.log('Supporter  supporter@fundraise.com  / supporter123');
  await mongoose.disconnect();
})();
