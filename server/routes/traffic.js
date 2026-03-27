const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');

const DATA_PATH = path.join(__dirname, '../data/trafficData.json');

function readData() {
  try { return JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8')); }
  catch { return []; }
}
function writeData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// GET /api/traffic
router.get('/', (req, res) => {
  try {
    const data = readData();
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to read traffic data', error: err.message });
  }
});

// POST /api/traffic/update  — add new record
router.post('/update', (req, res) => {
  try {
    const records = readData();
    const { intersection, density, vehicleCount, avgSpeed, zone } = req.body;
    if (!intersection || !density)
      return res.status(400).json({ success: false, message: 'intersection and density are required' });

    const newRecord = {
      id: Date.now(),
      intersection,
      density,
      vehicleCount: Number(vehicleCount) || 0,
      avgSpeed:     Number(avgSpeed)     || 0,
      timestamp: new Date().toISOString(),
      zone: zone || 'Zone A'
    };
    records.unshift(newRecord);
    if (records.length > 100) records.splice(100);
    writeData(records);
    res.json({ success: true, message: 'Record added', data: newRecord });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add record', error: err.message });
  }
});

// PUT /api/traffic/:id  — edit existing record
router.put('/:id', (req, res) => {
  try {
    const records = readData();
    const id  = parseInt(req.params.id) || req.params.id;
    const idx = records.findIndex(r => r.id == id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Record not found' });

    const { intersection, density, vehicleCount, avgSpeed, zone } = req.body;
    if (intersection)            records[idx].intersection = intersection;
    if (density)                 records[idx].density      = density;
    if (vehicleCount !== undefined) records[idx].vehicleCount = Number(vehicleCount);
    if (avgSpeed !== undefined)     records[idx].avgSpeed     = Number(avgSpeed);
    if (zone)                    records[idx].zone         = zone;
    records[idx].lastEdited = new Date().toISOString();

    writeData(records);
    res.json({ success: true, message: 'Record updated', data: records[idx] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update record', error: err.message });
  }
});

// DELETE /api/traffic/:id
router.delete('/:id', (req, res) => {
  try {
    let records = readData();
    const id  = parseInt(req.params.id) || req.params.id;
    const idx = records.findIndex(r => r.id == id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Record not found' });
    records.splice(idx, 1);
    writeData(records);
    res.json({ success: true, message: 'Record deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete record', error: err.message });
  }
});

module.exports = router;

