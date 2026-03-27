const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');

const MSG_PATH = path.join(__dirname, '../data/messages.json');

function readMsgs() {
  try { return JSON.parse(fs.readFileSync(MSG_PATH, 'utf-8')); }
  catch { return []; }
}
function writeMsgs(data) {
  fs.writeFileSync(MSG_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// POST /api/contact  (user panel)
router.post('/', (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'name, email and message are required' });
    }

    const msgs = readMsgs();
    const newMsg = {
      id: Date.now(),
      name,
      email,
      subject: subject || 'General',
      message,
      timestamp: new Date().toISOString(),
      read: false
    };
    msgs.unshift(newMsg);
    writeMsgs(msgs);

    res.json({ success: true, message: 'Message sent successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to save message', error: err.message });
  }
});

// GET /api/messages  (admin panel)
router.get('/', (req, res) => {
  try {
    const msgs = readMsgs();
    res.json({ success: true, count: msgs.length, data: msgs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to read messages', error: err.message });
  }
});

// PATCH /api/messages/:id/read
router.patch('/:id/read', (req, res) => {
  try {
    const msgs = readMsgs();
    const idx  = msgs.findIndex(m => m.id === parseInt(req.params.id));
    if (idx === -1) return res.status(404).json({ success: false, message: 'Message not found' });
    msgs[idx].read = true;
    writeMsgs(msgs);
    res.json({ success: true, message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
