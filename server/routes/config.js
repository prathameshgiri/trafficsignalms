const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');

const CONFIG_PATH = path.join(__dirname, '../data/config.json');

function readConfig() {
  try { return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8')); }
  catch { return {}; }
}
function writeConfig(data) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// GET /api/config
router.get('/', (req, res) => {
  res.json({ success: true, data: readConfig() });
});

// POST /api/config/update
router.post('/update', (req, res) => {
  try {
    const config  = readConfig();
    const updates = req.body;
    Object.assign(config, updates);
    writeConfig(config);
    res.json({ success: true, message: 'Config updated', data: config });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
