const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');

const DATA_PATH = path.join(__dirname, '../data/signals.json');

function readData() {
  try { return JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8')); }
  catch { return {}; }
}

function writeData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// GET /api/signals
router.get('/', (req, res) => {
  try {
    const data = readData();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to read signals', error: err.message });
  }
});

// POST /api/signals/update
router.post('/update', (req, res) => {
  try {
    const current = readData();
    const updates = req.body;

    const allowed = ['currentSignal', 'greenDuration', 'yellowDuration', 'redDuration', 'aiControlled', 'lanes'];
    allowed.forEach(key => {
      if (updates[key] !== undefined) current[key] = updates[key];
    });
    current.lastUpdated = new Date().toISOString();

    writeData(current);
    res.json({ success: true, message: 'Signal configuration updated', data: current });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update signals', error: err.message });
  }
});

module.exports = router;
