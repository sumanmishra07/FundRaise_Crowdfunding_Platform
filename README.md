# FundRaise – Crowdfunding Platform 

A full-stack crowdfunding platform built using the MERN stack and Socket.IO. FundRaise allows creators to launch fundraising campaigns, supporters to contribute through a simulated payment system, and administrators to manage and approve campaigns.

The platform provides real-time funding updates, campaign management, role-based authentication, and analytics through a modern and responsive interface.

## 🚀 Features

### 👤 User Authentication & Roles
- User registration and login
- Secure password hashing using bcrypt
- JWT-based authentication
- Role-based access control
- Three user roles: Creator, Supporter, and Admin

### 🎯 Campaign Management
- Create fundraising campaigns
- View campaign details
- Update and delete campaigns
- Set funding goals and deadlines
- Organize campaigns by category
- Search, filter, sort, and paginate campaigns
- Track campaign approval status

### 💳 Mock Payment & Pledges
- Simulated payment and pledge system
- Custom pledge amounts
- Payment validation
- Simulated payment decline functionality
- Anonymous pledges
- Pledge history

### ⚡ Real-Time Updates
- Socket.IO integration
- Live campaign funding progress
- Real-time pledge notifications
- Dynamic progress bar updates

### 🛡️ Admin Dashboard
- View and manage campaigns
- Approve or reject campaigns
- Provide rejection reasons
- Manage users
- Monitor platform activities

### 📊 Analytics & Statistics
- Total funds raised
- Total supporters
- Category-wise funding statistics
- Top campaigns
- Recent pledges
- Creator-specific statistics

## 🛠️ Tech Stack

**Frontend**
- React.js
- React Router DOM
- Vite
- Context API
- Socket.IO Client
- CSS

**Backend**
- Node.js
- Express.js
- REST API
- JWT Authentication
- bcrypt

**Database**
- MongoDB
- Mongoose

**Real-Time Communication**
- Socket.IO

## 📁 Project Structure

```text
FundRaise/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── .env.example
│
├── server/
│   ├── config/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── seed.js
│   ├── index.js
│   ├── package.json
│   └── .env.example
│
└── README.md
```

## ⚙️ Installation & Setup

### Prerequisites

Make sure you have installed:

- Node.js (18 or above)
- MongoDB (Local MongoDB or MongoDB Atlas)
- npm

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

```bash
cd FundRaise
```

### 2. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file inside the server folder:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/fundraise
JWT_SECRET=your_secure_random_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

Start the backend:

```bash
npm run dev
```

Backend runs at:

`http://localhost:5000`

Health check:

`http://localhost:5000/api/health`

### 3. Frontend Setup

Open another terminal:

```bash
cd client
npm install
```

Create a `.env` file inside the client folder:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

Frontend runs at:

`http://localhost:5173`

## 🧪 Demo Accounts

After running the backend seed script:

```bash
npm run seed
```

| Role | Email | Password |
|---|---|---|
| Admin | admin@fundraise.com | admin123 |
| Creator | creator@fundraise.com | creator123 |
| Supporter | supporter@fundraise.com | supporter123 |

**Note:** The seed script clears existing users, campaigns, and pledges before inserting demo data. Use it only with a database where existing data can be safely deleted.

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Campaigns
- `GET /api/campaigns`
- `GET /api/campaigns/:id`
- `POST /api/campaigns`
- `PUT /api/campaigns/:id`
- `DELETE /api/campaigns/:id`
- `GET /api/campaigns/mine`
- `POST /api/campaigns/:id/pledge`
- `GET /api/campaigns/:id/pledges`

### Pledges
- `GET /api/pledges/mine`

### Admin
- `GET /api/admin/campaigns`
- `PATCH /api/admin/campaigns/:id/status`
- `GET /api/admin/users`

### Analytics
- `GET /api/stats/overview`
- `GET /api/stats/top`
- `GET /api/stats/recent`
- `GET /api/stats/creator`

## 💡 Mock Payment Information

FundRaise uses a simulated payment system for demonstration purposes.

- No real money is transferred.
- Any card number can be used for the mock payment.
- A card number ending in `0000` simulates a declined payment.

## 🔐 Security

- Password hashing with bcrypt
- JWT-based authentication
- Protected API routes
- Role-based authorization
- Environment variables for sensitive configuration

## 🎯 Project Objective

The objective of FundRaise is to provide a centralized crowdfunding platform where individuals can create fundraising campaigns, receive support from contributors, monitor fundraising progress, and manage campaigns through an administrative system.

## 👩‍💻 Developed With

Built as a full-stack web development project using modern JavaScript technologies, REST APIs, MongoDB, and real-time communication.

---

⭐ If you find this project interesting, feel free to explore the repository!