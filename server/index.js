require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const io = new Server(server, { cors: { origin: CLIENT_URL, credentials: true } });
app.set('io', io);

// Socket.IO: admins join a private room to get "new campaign pending" alerts,
// anyone can join a campaign room for live progress.
io.on('connection', (socket) => {
  const token = socket.handshake.auth && socket.handshake.auth.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.role === 'admin') socket.join('admins');
    } catch (_) {
      /* anonymous socket */
    }
  }
  socket.on('campaign:join', (id) => socket.join(`campaign:${id}`));
  socket.on('campaign:leave', (id) => socket.leave(`campaign:${id}`));
});

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/pledges', require('./routes/pledges'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/stats', require('./routes/stats'));

app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on the server.' });
});

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  server.listen(PORT, () => console.log(`FundRaise API running on http://localhost:${PORT}`));
});
