const express = require('express');
const cors = require('cors');
const path = require('path');

const trafficRoutes = require('./routes/traffic');
const signalRoutes = require('./routes/signals');
const contactRoutes = require('./routes/contact');
const authRoutes = require('./routes/auth');
const configRoutes = require('./routes/config');

// ─── User Panel Server (port 3000) ───────────────────────────────────────────
const userApp = express();
userApp.use(cors());
userApp.use(express.json());
userApp.use(express.static(path.join(__dirname, '../user')));

userApp.use('/api/traffic',  trafficRoutes);
userApp.use('/api/signals',  signalRoutes);
userApp.use('/api/contact',  contactRoutes);

userApp.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../user/index.html'));
});

// ─── Admin Panel Server (port 3001) ──────────────────────────────────────────
const adminApp = express();
adminApp.use(cors());
adminApp.use(express.json());
adminApp.use(express.static(path.join(__dirname, '../admin')));

adminApp.use('/api/traffic',  trafficRoutes);
adminApp.use('/api/signals',  signalRoutes);
adminApp.use('/api/messages', contactRoutes);
adminApp.use('/api/login',    authRoutes);
adminApp.use('/api/config',   configRoutes);

adminApp.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin/index.html'));
});

// ─── Start Both Servers ───────────────────────────────────────────────────────
const USER_PORT  = 3000;
const ADMIN_PORT = 3001;

userApp.listen(USER_PORT, () => {
  console.log(`\x1b[32m✅ User  Panel running → http://localhost:${USER_PORT}\x1b[0m`);
});

adminApp.listen(ADMIN_PORT, () => {
  console.log(`\x1b[36m✅ Admin Panel running → http://localhost:${ADMIN_PORT}\x1b[0m`);
});
