
require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
const User = require('./models/User');
const Campaign = require('./models/Campaign');
const Pledge = require('./models/Pledge');

const day = 86400000;

const img = (id) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=70`;

async function findOrCreateUser(data) {
  let user = await User.findOne({ email: data.email });

  if (!user) {
    user = await User.create(data);
    console.log('Created user:', data.email);
  } else {
    console.log('User already exists:', data.email);
  }

  return user;
}

async function seed() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI missing. Configure your server/.env first.');
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Create demo users without deleting existing accounts.
  await findOrCreateUser({
    name: 'Admin',
    email: 'admin@fundraise.com',
    password: 'admin123',
    role: 'admin',
  });

  const creator1 = await findOrCreateUser({
    name: 'Aarav Sharma',
    email: 'creator@fundraise.com',
    password: 'creator123',
    role: 'creator',
  });

  const creator2 = await findOrCreateUser({
    name: 'Priya Nair',
    email: 'priya@fundraise.com',
    password: 'creator123',
    role: 'creator',
  });

  const supporters = [];

  const supporterData = [
    ['Rohan Mehta', 'supporter@fundraise.com'],
    ['Sneha Kapoor', 'sneha@fundraise.com'],
    ['Vikram Singh', 'vikram@fundraise.com'],
  ];

  for (const [name, email] of supporterData) {
    supporters.push(
      await findOrCreateUser({
        name,
        email,
        password: 'supporter123',
        role: 'supporter',
      })
    );
  }

  const defs = [
    ['SolarSchool: Solar Power for 20 Village Schools', 'Education', 500000, 40, 'photo-1509391366360-2e959784a276', creator1, 'approved',
      'We will install rooftop solar panels and batteries in 20 rural schools so classrooms stay lit and computer labs keep running.'],

    ['Pocket Doctor - Offline Health App', 'Health', 300000, 25, 'photo-1576091160399-112ba8d25d1d', creator1, 'approved',
      'An offline-first mobile app for community health workers.'],

    ['Clean Ganga Riverfront Drive', 'Environment', 250000, 15, 'photo-1532996122724-e3c354a0b15b', creator2, 'approved',
      'A volunteer-led river clean-up with waste segregation and awareness workshops.'],

    ['Street Art Festival: Colours of Delhi', 'Art', 120000, 30, 'photo-1460661419201-fd4cecdf8a8b', creator2, 'approved',
      'Fifty local artists will transform blank walls into neighbourhood murals.'],

    ['Open-Source AI Tutor for Hindi Students', 'Technology', 800000, 55, 'photo-1677442136019-21780ecad995', creator1, 'approved',
      'A free open-source AI tutor explaining maths and science in simple Hindi.'],

    ['Under-19 Girls Cricket Academy', 'Sports', 200000, 20, 'photo-1531415074968-036ba1b575da', creator2, 'approved',
      'Coaching, kits and tournament travel for 60 young girls from small towns.'],

    ['Community Library on Wheels', 'Community', 150000, 35, 'photo-1507842217343-583bb7270b66', creator1, 'pending',
      'A converted van stocked with books visiting underserved neighbourhoods.'],

    ['Crypto Gold Scheme', 'Other', 900000, 10, '', creator2, 'rejected',
      'Seeded as a rejected example campaign.'],
  ];

  const campaigns = [];

  for (const [title, category, goal, days, photo, creator, status, description] of defs) {
    let campaign = await Campaign.findOne({
      title,
      creator: creator._id,
    });

    if (!campaign) {
      campaign = await Campaign.create({
        title,
        category,
        goal,
        description,
        creator: creator._id,
        status,
        deadline: new Date(Date.now() + days * day),
        imageUrl: photo ? img(photo) : '',
        rejectionReason:
          status === 'rejected'
            ? 'Unrealistic promises and unclear use of funds.'
            : '',
      });

      console.log('Created campaign:', title);
    } else {
      console.log('Campaign already exists:', title);
    }

    campaigns.push(campaign);
  }

  // Create demo pledges only for campaigns that have none.
  const amounts = [500, 1000, 2500, 5000, 750, 1500, 10000, 300, 2000];
  const messages = ['Great cause!', 'All the best 🙌', 'Proud to back this.', '', 'Keep going!', ''];

  for (const campaign of campaigns.filter((c) => c.status === 'approved')) {
    const existingPledges = await Pledge.countDocuments({
      campaign: campaign._id,
    });

    if (existingPledges > 0) {
      console.log('Pledges already exist:', campaign.title);
      continue;
    }

    const n = 6 + Math.floor(Math.random() * 12);
    const backers = new Set();
    let raised = 0;

    for (let i = 0; i < n; i++) {
      const supporter = supporters[i % supporters.length];

      const amount =
        amounts[Math.floor(Math.random() * amounts.length)] *
        (1 + Math.floor(Math.random() * 6));

      await Pledge.create({
        campaign: campaign._id,
        supporter: supporter._id,
        amount,
        message: messages[i % messages.length],
        anonymous: i % 5 === 0,
        payment: {
          method: 'mock-card',
          last4: '4242',
          transactionId: `MOCK_SEED_${campaign._id}_${i}`,
          status: 'succeeded',
        },
      });

      raised += amount;
      backers.add(String(supporter._id));
    }

    campaign.raised = Math.min(raised, Math.round(campaign.goal * 1.15));
    campaign.supportersCount = backers.size;
    await campaign.save();

    console.log('Created pledges:', campaign.title);
  }

  console.log('\nDemo data seeding completed safely.');
  console.log('Admin: admin@fundraise.com / admin123');
  console.log('Creator: creator@fundraise.com / creator123');
  console.log('Supporter: supporter@fundraise.com / supporter123');
}

seed()
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
