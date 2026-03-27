const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');
const crypto  = require('crypto');

const USERS_PATH    = path.join(__dirname, '../data/users.json');
const SESSIONS_PATH = path.join(__dirname, '../data/sessions.json');

function readUsers() {
  try { return JSON.parse(fs.readFileSync(USERS_PATH, 'utf-8')); }
  catch { return []; }
}

function readSessions() {
  try { return JSON.parse(fs.readFileSync(SESSIONS_PATH, 'utf-8')); }
  catch { return {}; }
}

function writeSessions(data) {
  fs.writeFileSync(SESSIONS_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// POST /api/login
router.post('/', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password required' });
    }

    const users = readUsers();
    const user  = users.find(u => u.username === username && u.password === password);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Create simple token
    const token = crypto.randomBytes(32).toString('hex');
    const sessions = readSessions();
    sessions[token] = {
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      createdAt: new Date().toISOString()
    };
    writeSessions(sessions);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, name: user.name, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Login failed', error: err.message });
  }
});

// POST /api/login/logout
router.post('/logout', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const sessions = readSessions();
      delete sessions[token];
      writeSessions(sessions);
    }
    res.json({ success: true, message: 'Logged out' });
  } catch {
    res.json({ success: true, message: 'Logged out' });
  }
});

// GET /api/login/verify
router.get('/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token' });

    const sessions = readSessions();
    const session  = sessions[token];
    if (!session) return res.status(401).json({ success: false, message: 'Invalid session' });

    res.json({ success: true, user: session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
