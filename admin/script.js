/* ═══════════════════════════════════════════════════════════
   SMART TRAFFIC SYSTEM — ADMIN PANEL SCRIPT  v2
═══════════════════════════════════════════════════════════ */

const API  = 'http://localhost:3001/api';
const AI   = 'http://localhost:5000';
let token  = localStorage.getItem('adminToken') || '';
let laneData     = [];
let trafficCache = [];       // latest fetched records
let editingId    = null;     // id of record being edited

// ─── Utilities ───────────────────────────────────────────────────────────────

const $ = id => document.getElementById(id);
const fmtTime = ts => { try { return new Date(ts).toLocaleString('en-IN'); } catch { return '—'; } };

function showToast(msg, type = 'info') {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  $('toast-container').appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

// ─── Loader ──────────────────────────────────────────────────────────────────

window.addEventListener('load', async () => {
  await new Promise(r => setTimeout(r, 1200));
  $('loader').classList.add('hide');
  if (token) await verifyToken(); else showLogin();
});

// ─── Auth ─────────────────────────────────────────────────────────────────────

function showLogin() {
  $('loginScreen').style.display = 'flex';
  $('adminApp').style.display    = 'none';
}

function showApp(user) {
  $('loginScreen').style.display = 'none';
  $('adminApp').style.display    = 'grid';
  $('adminName').textContent     = user.name || user.username;
  initAdmin();
}

async function verifyToken() {
  try {
    const res  = await fetch(`${API}/login/verify`, { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    if (json.success) showApp(json.user);
    else { localStorage.removeItem('adminToken'); token = ''; showLogin(); }
  } catch { showLogin(); }
}

$('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = $('loginBtn');
  btn.disabled = true; btn.textContent = 'Authenticating…';
  try {
    const res  = await fetch(`${API}/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: $('username').value.trim(), password: $('password').value.trim() })
    });
    const json = await res.json();
    if (json.success) {
      token = json.token;
      localStorage.setItem('adminToken', token);
      showToast(`Welcome, ${json.user.name}! 👋`, 'success');
      showApp(json.user);
    } else { showToast(json.message || 'Invalid credentials', 'error'); }
  } catch { showToast('Server error. Is Node.js running?', 'error'); }
  finally { btn.disabled = false; btn.textContent = '🔐 Login'; }
});

$('logoutBtn').addEventListener('click', async () => {
  try { await fetch(`${API}/login/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }); } catch {}
  token = ''; localStorage.removeItem('adminToken'); showLogin(); showToast('Logged out', 'info');
});

// ─── Dark Mode ────────────────────────────────────────────────────────────────

const darkToggle = $('darkToggle');
if (localStorage.getItem('darkMode') === 'true') { document.body.classList.add('dark-mode'); darkToggle.textContent = '☀️'; }
darkToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  const d = document.body.classList.contains('dark-mode');
  darkToggle.textContent = d ? '☀️' : '🌙';
  localStorage.setItem('darkMode', d);
  // Re-render charts in new theme
  if (trafficCache.length) renderAdminCharts(trafficCache);
});

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function toggleSidebar() { $('sidebar').classList.toggle('open'); }

function switchSection(id, btn) {
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  $(`sec-${id}`).classList.add('active');
  btn.classList.add('active');
  $('topbarTitle').textContent = id.charAt(0).toUpperCase() + id.slice(1);
  if (id === 'messages') fetchMessages();
  if (id === 'settings') fetchSettings();
  if (id === 'monitor')  fetchAndRenderTraffic();
  if (id === 'ai')       fetchAIStatus();
  if (id === 'signals')  fetchAndInitSignalControl();
}

// ─── Init ─────────────────────────────────────────────────────────────────────

function initAdmin() {
  fetchDashboard();
  setInterval(() => {
    fetchDashboard();
    const activeId = document.querySelector('.admin-section.active')?.id;
    if (activeId === 'sec-monitor') fetchAndRenderTraffic();
  }, 6000);
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

async function fetchDashboard() {
  try {
    const [tRes, sRes, mRes, cRes] = await Promise.all([
      fetch(`${API}/traffic`), fetch(`${API}/signals`),
      fetch(`${API}/messages`), fetch(`${API}/config`)
    ]);
    const [tJson, sJson, mJson, cJson] = await Promise.all([
      tRes.json(), sRes.json(), mRes.json(), cRes.json()
    ]);

    if (tJson.success) {
      trafficCache = tJson.data;
      const high   = tJson.data.filter(d => d.density === 'high').length;
      const avgSpd = tJson.data.length
        ? Math.round(tJson.data.reduce((s, d) => s + (d.avgSpeed || 0), 0) / tJson.data.length)
        : 0;
      const totalV = tJson.data.reduce((s, d) => s + (d.vehicleCount || 0), 0);
      $('kpi-records').textContent = tJson.count;
      $('kpi-high').textContent    = high;
      $('kpi-vehicles').textContent = totalV.toLocaleString('en-IN');
      $('kpi-avgspd').textContent   = `${avgSpd} km/h`;
      // Render charts after a frame so canvas has layout
      requestAnimationFrame(() => renderAdminCharts(tJson.data));
    }

    if (mJson.success) {
      const unread = mJson.data.filter(m => !m.read).length;
      $('kpi-msgs').textContent    = mJson.count;
      $('unreadBadge').textContent = unread > 0 ? unread : '';
    }

    if (cJson.success) {
      $('kpi-ai').textContent = cJson.data.aiEnabled ? 'ON ✅' : 'OFF ❌';
    }

    if (sJson.success) {
      const d = sJson.data;
      $('dashSignal').textContent = d.currentSignal?.toUpperCase() || '—';
      $('dashSignal').className   = `badge badge-${d.currentSignal}`;
      $('dashGreen').textContent  = `${d.greenDuration}s`;
      $('dashYellow').textContent = `${d.yellowDuration}s`;
      $('dashRed').textContent    = `${d.redDuration}s`;
      updateAdminTL(d.currentSignal);
    }
  } catch (err) { console.warn('Dashboard fetch error:', err); }
}

// ─── Charts (fixed-size canvas, no clientWidth) ───────────────────────────────

function getTextColor() {
  return document.body.classList.contains('dark-mode') ? '#e6edf3' : '#0f172a';
}
function getMutedColor() {
  return document.body.classList.contains('dark-mode') ? '#8b949e' : '#94a3b8';
}

function renderAdminCharts(data) {
  drawPie(data);
  drawBar(data);
}

/* ── Pie Chart ─────────────────────────────────────────── */
function drawPie(data) {
  const canvas = $('adminPieChart');
  if (!canvas) return;
  const W = 340, H = 240;
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  const counts = {
    high:   data.filter(d => d.density === 'high').length,
    medium: data.filter(d => d.density === 'medium').length,
    low:    data.filter(d => d.density === 'low').length
  };
  const total  = Math.max(Object.values(counts).reduce((a, b) => a + b, 0), 1);
  const colors = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };
  const cx = W / 2 - 30, cy = H / 2 - 10, r = Math.min(cx, cy) - 10;

  let start = -Math.PI / 2;
  Object.entries(counts).forEach(([k, v]) => {
    if (v === 0) return;
    const angle = (v / total) * Math.PI * 2;
    ctx.fillStyle = colors[k];
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, start + angle);
    ctx.closePath();
    ctx.fill();

    // Stroke between slices
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth   = 2;
    ctx.stroke();

    // Percent label inside slice
    const mid = start + angle / 2;
    const tx  = cx + Math.cos(mid) * r * 0.65;
    const ty  = cy + Math.sin(mid) * r * 0.65;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round((v / total) * 100)}%`, tx, ty + 5);
    start += angle;
  });

  // Legend — right side
  const legX = W - 90, legStartY = H / 2 - 30;
  Object.entries(colors).forEach(([k, c], i) => {
    const ly = legStartY + i * 28;
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.roundRect(legX, ly, 14, 14, 3); ctx.fill();
    ctx.fillStyle = getTextColor();
    ctx.font      = '11px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${k.charAt(0).toUpperCase() + k.slice(1)} (${counts[k]})`, legX + 18, ly + 11);
  });

  // Center label
  ctx.fillStyle = getMutedColor();
  ctx.font      = '11px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${total} zones`, cx, H - 8);
}

/* ── Bar Chart ─────────────────────────────────────────── */
function drawBar(data) {
  const canvas = $('adminBarChart');
  if (!canvas) return;
  const W = 460, H = 240;
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  // Aggregate by zone: sum vehicleCount
  const zoneMap = {};
  data.forEach(d => {
    if (!zoneMap[d.zone]) zoneMap[d.zone] = { count: 0, density: d.density };
    zoneMap[d.zone].count += d.vehicleCount || 0;
  });
  const zones  = Object.keys(zoneMap).sort();
  const values = zones.map(z => zoneMap[z].count);
  const dens   = zones.map(z => zoneMap[z].density);
  const maxV   = Math.max(...values, 1);

  const colorOf = d =>
    d === 'high' ? '#ef4444' : d === 'medium' ? '#f59e0b' : '#22c55e';

  const pad = { top: 24, right: 16, bottom: 50, left: 52 };
  const pW  = W - pad.left - pad.right;
  const pH  = H - pad.top  - pad.bottom;
  const bW  = Math.min((pW / zones.length) * 0.55, 40);
  const gap  = pW / zones.length;

  // Y gridlines
  [0, 0.25, 0.5, 0.75, 1].forEach(f => {
    const y = pad.top + pH * (1 - f);
    ctx.strokeStyle = 'rgba(148,163,184,.15)';
    ctx.lineWidth   = 1;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
    ctx.fillStyle   = getMutedColor();
    ctx.font        = '10px Inter, sans-serif';
    ctx.textAlign   = 'right';
    ctx.fillText(Math.round(maxV * f), pad.left - 6, y + 4);
  });

  // Bars
  zones.forEach((zone, i) => {
    const x   = pad.left + i * gap + (gap - bW) / 2;
    const bH  = (values[i] / maxV) * pH;
    const y   = pad.top + pH - bH;
    const col = colorOf(dens[i]);

    const grad = ctx.createLinearGradient(0, y, 0, pad.top + pH);
    grad.addColorStop(0, col);
    grad.addColorStop(1, col + '55');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, bW, bH, [5, 5, 0, 0]);
    ctx.fill();

    // Value on top
    ctx.fillStyle = col;
    ctx.font      = 'bold 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(values[i].toLocaleString('en-IN'), x + bW / 2, y - 5);

    // Zone label below
    ctx.fillStyle = getMutedColor();
    ctx.font      = '10px Inter, sans-serif';
    ctx.fillText(zone, x + bW / 2, H - 4);
  });
}

// ─── Signal Control ───────────────────────────────────────────────────────────

function updateAdminTL(color) {
  ['red', 'yellow', 'green'].forEach(c => {
    $(`adm-${c}`)?.classList.toggle('active', c === color);
  });
}
function previewSignal(val) { updateAdminTL(val); }

async function fetchAndInitSignalControl() {
  try {
    const res  = await fetch(`${API}/signals`);
    const json = await res.json();
    if (!json.success) return;
    const d = json.data;
    $('signalColorSel').value = d.currentSignal;
    $('ctrl-green').value     = d.greenDuration;
    $('ctrl-yellow').value    = d.yellowDuration;
    $('ctrl-red').value       = d.redDuration;
    updateAdminTL(d.currentSignal);
    laneData = d.lanes || [];
    renderLaneControls(laneData);
  } catch { showToast('Failed to fetch signal data', 'error'); }
}

function renderLaneControls(lanes) {
  const c = $('laneControls');
  if (!c || !lanes.length) return;
  c.innerHTML = lanes.map((lane, i) => `
    <div class="lane-row">
      <span class="lane-row-label">${lane.label} Lane</span>
      <span class="lane-row-info">${lane.vehicles} vehicles</span>
      <label class="toggle-switch">
        <input type="checkbox" id="lane-toggle-${i}" ${lane.active ? 'checked' : ''} />
        <span class="slider"></span>
      </label>
    </div>
  `).join('');
}

async function updateSignal() {
  try {
    const body = {
      currentSignal:  $('signalColorSel').value,
      greenDuration:  parseInt($('ctrl-green').value),
      yellowDuration: parseInt($('ctrl-yellow').value),
      redDuration:    parseInt($('ctrl-red').value)
    };
    const res  = await fetch(`${API}/signals/update`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const json = await res.json();
    if (json.success) { showToast('Signal config saved ✅', 'success'); updateAdminTL(body.currentSignal); fetchDashboard(); }
    else showToast(json.message || 'Update failed', 'error');
  } catch { showToast('Server error', 'error'); }
}

async function updateLanes() {
  const updated = laneData.map((lane, i) => ({
    ...lane, active: !!$(`lane-toggle-${i}`)?.checked
  }));
  try {
    const res  = await fetch(`${API}/signals/update`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lanes: updated })
    });
    const json = await res.json();
    if (json.success) { showToast('Lanes updated ✅', 'success'); laneData = updated; }
    else showToast('Update failed', 'error');
  } catch { showToast('Server error', 'error'); }
}

// ─── LIVE MONITOR — Full CRUD ─────────────────────────────────────────────────

let filterDensity  = 'all';
let filterZone     = 'all';
let searchKeyword  = '';

async function fetchAndRenderTraffic() {
  try {
    const res  = await fetch(`${API}/traffic`);
    const json = await res.json();
    if (!json.success) return;
    trafficCache = json.data;
    renderMonitorStats(json.data);
    renderMonitorTable(json.data);
  } catch { console.warn('Monitor fetch error'); }
}

function renderMonitorStats(data) {
  const totalV = data.reduce((s, d) => s + (d.vehicleCount || 0), 0);
  const avgSpd = data.length ? Math.round(data.reduce((s, d) => s + (d.avgSpeed || 0), 0) / data.length) : 0;
  const high   = data.filter(d => d.density === 'high').length;
  const low    = data.filter(d => d.density === 'low').length;

  const statsEl = $('monitorStats');
  if (statsEl) {
    statsEl.innerHTML = `
      <div class="mini-stat">📊 <strong>${data.length}</strong> Records</div>
      <div class="mini-stat">🚗 <strong>${totalV.toLocaleString('en-IN')}</strong> Total Vehicles</div>
      <div class="mini-stat">⚡ <strong>${avgSpd} km/h</strong> Avg Speed</div>
      <div class="mini-stat">🔴 <strong>${high}</strong> High Traffic</div>
      <div class="mini-stat">🟢 <strong>${low}</strong> Low Traffic</div>
    `;
  }
}

function applyFilters(data) {
  return data.filter(d => {
    const matchDensity = filterDensity === 'all' || d.density === filterDensity;
    const matchZone    = filterZone    === 'all' || d.zone    === filterZone;
    const kw           = searchKeyword.toLowerCase();
    const matchSearch  = !kw || d.intersection?.toLowerCase().includes(kw) || d.zone?.toLowerCase().includes(kw);
    return matchDensity && matchZone && matchSearch;
  });
}

function renderMonitorTable(data) {
  const filtered = applyFilters(data);
  const tbody    = $('monitorBody');
  if (!tbody) return;

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="loading-row">No records match the filter.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(d => `
    <tr id="row-${d.id}">
      <td style="font-family:monospace;font-size:.75rem;color:var(--text-3)">#${String(d.id).slice(-5)}</td>
      <td><strong>${d.intersection}</strong></td>
      <td>${d.zone}</td>
      <td><span class="badge badge-${d.density}">${d.density.toUpperCase()}</span></td>
      <td>🚗 ${(d.vehicleCount || 0).toLocaleString('en-IN')}</td>
      <td>${d.avgSpeed} km/h</td>
      <td style="font-size:.76rem;color:var(--text-3)">${fmtTime(d.timestamp)}</td>
      <td>
        <div class="action-btns">
          <button class="action-btn edit-btn"   onclick="openEditModal(${JSON.stringify(d).replace(/"/g, '&quot;')})">✏️ Edit</button>
          <button class="action-btn delete-btn" onclick="deleteRecord('${d.id}')">🗑️ Del</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ── Filter controls ───────────────────────────────────────

function setFilter(type, value) {
  if (type === 'density') filterDensity = value;
  if (type === 'zone')    filterZone    = value;
  renderMonitorTable(trafficCache);
}

function setSearch(kw) {
  searchKeyword = kw;
  renderMonitorTable(trafficCache);
}

// ── Add Record Modal ──────────────────────────────────────

function openAddModal() {
  editingId = null;
  $('modalTitle').textContent = '➕ Add Traffic Record';
  $('m-intersection').value = '';
  $('m-zone').value         = 'Zone A';
  $('m-density').value      = 'medium';
  $('m-vehicles').value     = '';
  $('m-speed').value        = '';
  $('crudModal').classList.add('open');
}

function openEditModal(record) {
  editingId = record.id;
  $('modalTitle').textContent   = '✏️ Edit Traffic Record';
  $('m-intersection').value     = record.intersection;
  $('m-zone').value             = record.zone;
  $('m-density').value          = record.density;
  $('m-vehicles').value         = record.vehicleCount;
  $('m-speed').value            = record.avgSpeed;
  $('crudModal').classList.add('open');
}

function closeModal() { $('crudModal').classList.remove('open'); }

async function saveRecord() {
  const body = {
    intersection: $('m-intersection').value.trim(),
    zone:         $('m-zone').value,
    density:      $('m-density').value,
    vehicleCount: parseInt($('m-vehicles').value) || 0,
    avgSpeed:     parseInt($('m-speed').value)    || 0
  };
  if (!body.intersection) { showToast('Intersection name required', 'error'); return; }

  const saveBtn = $('modalSaveBtn');
  saveBtn.disabled = true; saveBtn.textContent = 'Saving…';

  try {
    let res, json;
    if (editingId) {
      res  = await fetch(`${API}/traffic/${editingId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
    } else {
      res  = await fetch(`${API}/traffic/update`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
    }
    json = await res.json();
    if (json.success) {
      showToast(editingId ? 'Record updated ✅' : 'Record added ✅', 'success');
      closeModal();
      await fetchAndRenderTraffic();
      fetchDashboard();
    } else {
      showToast(json.message || 'Save failed', 'error');
    }
  } catch { showToast('Server error', 'error'); }
  finally { saveBtn.disabled = false; saveBtn.textContent = '💾 Save'; }
}

async function deleteRecord(id) {
  if (!confirm('Delete this traffic record?')) return;
  try {
    const res  = await fetch(`${API}/traffic/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      showToast('Record deleted 🗑️', 'info');
      await fetchAndRenderTraffic();
      fetchDashboard();
    } else { showToast(json.message || 'Delete failed', 'error'); }
  } catch { showToast('Server error', 'error'); }
}

async function addRandomRecord() {
  const densities     = ['high', 'medium', 'low'];
  const intersections = [
    'MG Road Junction', 'Silk Board Junction', 'Outer Ring Road',
    'Whitefield Main', 'Hebbal Flyover', 'Marathahalli Bridge',
    'Electronic City Flyover', 'Bannerghatta Road'
  ];
  const zones = ['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E'];

  const body = {
    intersection: intersections[Math.floor(Math.random() * intersections.length)],
    density:      densities[Math.floor(Math.random() * densities.length)],
    vehicleCount: Math.floor(Math.random() * 400) + 20,
    avgSpeed:     Math.floor(Math.random() * 60) + 5,
    zone:         zones[Math.floor(Math.random() * zones.length)]
  };
  try {
    const res  = await fetch(`${API}/traffic/update`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const json = await res.json();
    if (json.success) {
      showToast('Random record added ✅', 'success');
      await fetchAndRenderTraffic();
      fetchDashboard();
    }
  } catch { showToast('Failed to add record', 'error'); }
}

function exportCSV() {
  const filtered = applyFilters(trafficCache);
  if (!filtered.length) { showToast('No data to export', 'warning'); return; }
  const headers = ['ID', 'Intersection', 'Zone', 'Density', 'Vehicles', 'Avg Speed (km/h)', 'Timestamp'];
  const rows    = filtered.map(d => [
    d.id, `"${d.intersection}"`, d.zone, d.density, d.vehicleCount, d.avgSpeed, d.timestamp
  ]);
  const csv  = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `traffic_data_${Date.now()}.csv`; a.click();
  URL.revokeObjectURL(url);
  showToast('CSV exported 📥', 'success');
}

// ─── AI Control ───────────────────────────────────────────────────────────────

async function fetchAIStatus() {
  try {
    const res  = await fetch(`${API}/config`);
    const json = await res.json();
    if (json.success) {
      $('aiToggle').checked = !!json.data.aiEnabled;
      updateAIStatusDisplay(json.data.aiEnabled);
    }
  } catch {}
}

function updateAIStatusDisplay(enabled) {
  const el = $('aiStatusDisplay');
  if (!el) return;
  el.innerHTML = enabled
    ? `<span style="color:var(--success);font-size:1.2rem">✅</span> AI system is <strong>enabled</strong> — optimizing signal timings automatically`
    : `<span style="color:var(--danger);font-size:1.2rem">❌</span> AI system is <strong>disabled</strong> — signals on manual timings`;
}

async function toggleAI(enabled) {
  try {
    const res  = await fetch(`${API}/config/update`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aiEnabled: enabled })
    });
    const json = await res.json();
    if (json.success) { showToast(`AI ${enabled ? 'enabled ✅' : 'disabled ❌'}`, 'info'); updateAIStatusDisplay(enabled); }
  } catch { showToast('Failed to toggle AI', 'error'); }
}

async function adminPredict() {
  const density = $('adminDensity').value;
  const card    = $('adminAiResult');
  card.innerHTML = `<h3>AI Prediction Result</h3>
    <div style="display:flex;align-items:center;gap:12px;padding:24px">
      <div class="spinner small"></div><span>Querying AI module…</span>
    </div>`;
  try {
    const res  = await fetch(`${AI}/predict`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ traffic_density: density })
    });
    const json = await res.json();
    if (json.success) {
      const conf = Math.round((json.confidence || .9) * 100);
      const col  = density === 'high' ? '#ef4444' : density === 'medium' ? '#f59e0b' : '#22c55e';
      card.innerHTML = `
        <h3>AI Prediction Result</h3>
        <div style="padding:8px 0">
          <p style="font-size:.75rem;color:var(--text-2);margin-bottom:8px;text-transform:uppercase;letter-spacing:.05em">
            Density: <strong style="color:${col}">${density}</strong>
          </p>
          <p style="font-size:1.3rem;font-weight:800;margin-bottom:8px">⚡ ${(json.action || '').replace(/_/g, ' ')}</p>
          <p style="font-size:2.6rem;font-weight:900;color:var(--primary);line-height:1">${json.duration}
            <span style="font-size:.9rem;color:var(--text-2);font-weight:400"> sec</span>
          </p>
          <p style="color:var(--text-2);font-size:.875rem;margin:12px 0;padding:10px;border-radius:8px;background:rgba(79,70,229,.06)">
            💬 ${json.message || ''}
          </p>
          <div style="height:8px;border-radius:99px;background:var(--border);overflow:hidden">
            <div style="height:100%;width:${conf}%;border-radius:99px;background:linear-gradient(90deg,var(--primary),#22d3ee)"></div>
          </div>
          <p style="font-size:.76rem;color:var(--text-3);margin-top:4px">Confidence: ${conf}%</p>
        </div>
      `;
      showToast(`AI: ${json.duration}s recommended for ${density} traffic`, 'success');
    }
  } catch {
    card.innerHTML = `<h3>AI Prediction Result</h3>
      <p style="color:var(--danger);padding:24px">⚠️ Could not reach AI module on port 5000. Run: <code>python main.py</code></p>`;
    showToast('AI module offline', 'error');
  }
}

// ─── Messages ─────────────────────────────────────────────────────────────────

async function fetchMessages() {
  const container = $('messagesContainer');
  try {
    const res  = await fetch(`${API}/messages`);
    const json = await res.json();
    if (!json.success) return;
    const unread = json.data.filter(m => !m.read).length;
    $('unreadBadge').textContent = unread > 0 ? unread : '';
    container.innerHTML = json.data.length
      ? json.data.map(m => `
        <div class="msg-card glass ${m.read ? '' : 'unread'}">
          <div class="msg-header">
            <span class="msg-name">👤 ${m.name}</span>
            <span class="msg-email">${m.email}</span>
            <span class="msg-time">${fmtTime(m.timestamp)}</span>
          </div>
          <div class="msg-subject">📌 ${m.subject || 'General'}</div>
          <div class="msg-body">${m.message}</div>
          ${!m.read
            ? `<div class="msg-actions"><button class="btn-outline-sm" onclick="markRead(${m.id})">✅ Mark as Read</button></div>`
            : '<span style="font-size:.74rem;color:var(--text-3)">✅ Read</span>'}
        </div>`).join('')
      : '<p class="loading-row">No messages yet.</p>';
  } catch { container.innerHTML = '<p class="loading-row">Failed to load messages.</p>'; }
}

async function markRead(id) {
  try {
    await fetch(`${API}/messages/${id}/read`, { method: 'PATCH' });
    fetchMessages(); showToast('Marked as read ✅', 'info');
  } catch { showToast('Failed', 'error'); }
}

// ─── Settings ─────────────────────────────────────────────────────────────────

async function fetchSettings() {
  try {
    const res  = await fetch(`${API}/config`);
    const json = await res.json();
    if (!json.success) return;
    const d = json.data;
    $('s-high').value        = d.alertThresholds?.high   || 250;
    $('s-medium').value      = d.alertThresholds?.medium || 150;
    $('s-maxVehicle').value  = d.maxVehicleThreshold     || 300;
    $('s-refresh').value     = d.autoRefreshInterval     || 5000;
    $('s-green').value       = d.defaultGreenTime        || 45;
    $('s-maintenance').checked = !!d.maintenanceMode;
  } catch { showToast('Failed to load settings', 'error'); }
}

async function saveSettings() {
  try {
    const body = {
      maxVehicleThreshold: parseInt($('s-maxVehicle').value),
      autoRefreshInterval: parseInt($('s-refresh').value),
      defaultGreenTime:    parseInt($('s-green').value),
      maintenanceMode:     $('s-maintenance').checked,
      alertThresholds: {
        high:   parseInt($('s-high').value),
        medium: parseInt($('s-medium').value),
        low:    0
      }
    };
    const res  = await fetch(`${API}/config/update`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const json = await res.json();
    if (json.success) showToast('Settings saved ✅', 'success');
    else showToast('Failed to save', 'error');
  } catch { showToast('Server error', 'error'); }
}
