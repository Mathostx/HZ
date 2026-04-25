// ========================
// HORMUZ STRAIT INTEL DASHBOARD
// ========================

// ---- MAP INIT ----
const map = L.map('map', {
  center: [26.5, 56.5],
  zoom: 7,
  zoomControl: false,
  attributionControl: false
});

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
  maxZoom: 18,
}).addTo(map);

L.control.zoom({ position: 'bottomright' }).addTo(map);

// Coordinate display on hover
map.on('mousemove', (e) => {
  const el = document.getElementById('map-coords');
  if (el) {
    el.textContent = `${e.latlng.lat.toFixed(4)}°N  ${e.latlng.lng.toFixed(4)}°E`;
  }
});

// ---- VESSEL DATA (realistic simulated — MarineTraffic API would replace this) ----
const vesselTypes = {
  tanker: { color: '#00b4c8', label: 'Oil Tanker' },
  cargo: { color: '#f59e0b', label: 'Cargo' },
  naval: { color: '#ef4444', label: 'Naval / Military' },
  unknown: { color: '#a855f7', label: 'Unknown' },
};

const vessels = [
  { id: 'V001', name: 'OLYMPIC LEGEND', type: 'tanker', lat: 26.71, lng: 56.28, speed: '13.4 kn', heading: 'NW', flag: '🇬🇷', dest: 'Fujairah', dwt: '300,000 DWT' },
  { id: 'V002', name: 'IRAN DENA', type: 'tanker', lat: 27.05, lng: 57.10, speed: '9.1 kn', heading: 'W', flag: '🇮🇷', dest: 'Bandar Abbas', dwt: '158,000 DWT' },
  { id: 'V003', name: 'MSC BEATRICE', type: 'cargo', lat: 26.22, lng: 57.48, speed: '16.2 kn', heading: 'NE', flag: '🇵🇦', dest: 'Jebel Ali', dwt: 'ContainerShip' },
  { id: 'V004', name: 'KHARG', type: 'naval', lat: 27.12, lng: 56.70, speed: '8.0 kn', heading: 'SE', flag: '🇮🇷', dest: 'Patrol', dwt: 'IRGCN Frigate' },
  { id: 'V005', name: 'USS COLE (DDG-67)', type: 'naval', lat: 25.80, lng: 57.90, speed: '18.5 kn', heading: 'NW', flag: '🇺🇸', dest: 'Transit', dwt: 'USN Destroyer' },
  { id: 'V006', name: 'PACIFIC VOYAGER', type: 'tanker', lat: 26.38, lng: 56.01, speed: '12.7 kn', heading: 'E', flag: '🇯🇵', dest: 'Kharg Island', dwt: '280,000 DWT' },
  { id: 'V007', name: 'GULF PROGRESS', type: 'cargo', lat: 26.95, lng: 55.90, speed: '11.2 kn', heading: 'NE', flag: '🇦🇪', dest: 'Bandar Lengeh', dwt: 'General Cargo' },
  { id: 'V008', name: 'UNKNOWN-AIS', type: 'unknown', lat: 27.32, lng: 57.55, speed: '6.3 kn', heading: '?', flag: '❓', dest: 'Unknown', dwt: 'AIS Gap Detected' },
  { id: 'V009', name: 'HIMALAYA', type: 'tanker', lat: 25.60, lng: 58.20, speed: '14.1 kn', heading: 'W', flag: '🇧🇸', dest: 'Ras Tanura', dwt: '320,000 DWT' },
  { id: 'V010', name: 'ENAAM', type: 'tanker', lat: 26.60, lng: 56.85, speed: '10.5 kn', heading: 'SE', flag: '🇮🇷', dest: 'Bandar Abbas', dwt: '105,000 DWT' },
  { id: 'V011', name: 'COSCO SHIPPING ROSE', type: 'cargo', lat: 26.10, lng: 57.20, speed: '15.8 kn', heading: 'W', flag: '🇨🇳', dest: 'Port Said', dwt: 'ULCS ContainerShip' },
  { id: 'V012', name: 'HMS DIAMOND', type: 'naval', lat: 25.95, lng: 57.00, speed: '14.0 kn', heading: 'E', flag: '🇬🇧', dest: 'Escort Op', dwt: 'Type 45 Destroyer' },
];

// Key strategic zones
const zones = [
  { name: 'Inbound Lane', coords: [[26.0, 56.2], [27.0, 56.2], [27.0, 57.5], [26.0, 57.5]], color: '#22c55e', opacity: 0.06 },
  { name: 'Outbound Lane', coords: [[25.3, 56.2], [26.0, 56.2], [26.0, 57.5], [25.3, 57.5]], color: '#3b82f6', opacity: 0.06 },
  { name: 'Iranian Waters', coords: [[27.0, 55.5], [28.2, 55.5], [28.2, 58.5], [27.0, 58.5]], color: '#ef4444', opacity: 0.06 },
];

// Draw zones
zones.forEach(z => {
  L.polygon(z.coords, {
    color: z.color, fillColor: z.color,
    fillOpacity: z.opacity, weight: 1, opacity: 0.3,
    dashArray: '4 4'
  }).bindTooltip(z.name, { className: 'zone-tooltip', permanent: false }).addTo(map);
});

// Draw vessels
const vesselMarkers = {};
vessels.forEach(v => {
  const cfg = vesselTypes[v.type];
  const icon = L.divIcon({
    className: '',
    html: `<div style="
      width:12px;height:12px;
      background:${cfg.color};
      border:2px solid rgba(255,255,255,0.9);
      border-radius:${v.type === 'naval' ? '2px' : '50%'};
      box-shadow:0 0 6px ${cfg.color}88;
      cursor:pointer;
    "></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });

  const marker = L.marker([v.lat, v.lng], { icon })
    .bindPopup(`
      <div style="min-width:180px;font-family:'Satoshi',sans-serif">
        <div style="font-weight:700;font-size:13px;margin-bottom:6px">${v.flag} ${v.name}</div>
        <div style="display:grid;grid-template-columns:auto 1fr;gap:2px 10px;font-size:11px">
          <span style="opacity:0.6">Type</span><span style="color:${cfg.color};font-weight:600">${cfg.label}</span>
          <span style="opacity:0.6">Speed</span><span>${v.speed}</span>
          <span style="opacity:0.6">Heading</span><span>${v.heading}</span>
          <span style="opacity:0.6">Dest</span><span>${v.dest}</span>
          <span style="opacity:0.6">Class</span><span>${v.dwt}</span>
          <span style="opacity:0.6">MMSI</span><span style="font-family:monospace">${v.id}</span>
        </div>
      </div>
    `, { maxWidth: 220 })
    .addTo(map);

  vesselMarkers[v.id] = marker;
});

// Strategic location labels
const locations = [
  { name: 'Bandar Abbas', lat: 27.18, lng: 56.28 },
  { name: 'Musandam', lat: 26.20, lng: 56.48 },
  { name: 'Fujairah', lat: 25.12, lng: 56.34 },
  { name: 'Strait of Hormuz', lat: 26.55, lng: 56.55 },
  { name: 'Qeshm Island', lat: 26.82, lng: 55.90 },
];

locations.forEach(loc => {
  L.marker([loc.lat, loc.lng], {
    icon: L.divIcon({
      className: '',
      html: `<div style="font-size:10px;font-weight:700;color:rgba(200,216,232,0.8);white-space:nowrap;text-shadow:0 1px 3px rgba(0,0,0,0.9);pointer-events:none">${loc.name}</div>`,
      iconAnchor: [0, 0]
    })
  }).addTo(map);
});

// Update KPIs
const tankers = vessels.filter(v => v.type === 'tanker').length;
const cargo = vessels.filter(v => v.type === 'cargo').length;
const naval = vessels.filter(v => v.type === 'naval').length;

const unknown = vessels.filter(v => v.type === 'unknown').length;
document.getElementById('vessel-count').textContent = vessels.length;
document.getElementById('kpi-tankers').textContent = tankers;
document.getElementById('kpi-cargo').textContent = cargo;
document.getElementById('kpi-naval').textContent = naval + ' (+' + unknown + ' unk.)';
updateTimestamp();

// ---- EVENT FEED ----
const events = [
  {
    severity: 'CRIT', sevClass: 'sev-crit',
    headline: 'IRGCN vessels shadow US carrier group entering Gulf',
    location: 'Strait of Hormuz', time: '14 min ago', filter: 'crit'
  },
  {
    severity: 'HIGH', sevClass: 'sev-high',
    headline: 'Tanker IRAN DENA deviates from filed route — AIS irregular',
    location: 'Bandar Abbas', time: '31 min ago', filter: 'high'
  },
  {
    severity: 'HIGH', sevClass: 'sev-high',
    headline: 'HMS Diamond escorts 3 tankers through inbound lane',
    location: 'Musandam', time: '1h 12m ago', filter: 'high'
  },
  {
    severity: 'STAN', sevClass: 'sev-stan',
    headline: 'AIS gap detected: unidentified vessel NE of Qeshm Island',
    location: 'Qeshm', time: '2h 05m ago', filter: 'stan'
  },
  {
    severity: 'HIGH', sevClass: 'sev-high',
    headline: 'Iran announces live-fire naval exercises — 72h notice',
    location: 'Gulf of Oman', time: '3h 40m ago', filter: 'high'
  },
  {
    severity: 'STAN', sevClass: 'sev-stan',
    headline: 'Fujairah port reports 18% increase in bunkering activity',
    location: 'Fujairah', time: '5h 17m ago', filter: 'stan'
  },
  {
    severity: 'INFO', sevClass: 'sev-info',
    headline: 'COSCO SHIPPING ROSE transits outbound — largest vessel this week',
    location: 'Strait of Hormuz', time: '6h 02m ago', filter: 'stan'
  },
  {
    severity: 'CRIT', sevClass: 'sev-crit',
    headline: 'Report: Drone swarm activity detected near Bandar Lengeh',
    location: 'Bandar Lengeh', time: '8h 55m ago', filter: 'crit'
  },
  {
    severity: 'HIGH', sevClass: 'sev-high',
    headline: 'Lloyd\'s War Risk premium elevated for Gulf transit',
    location: 'Gulf Region', time: '11h ago', filter: 'high'
  },
  {
    severity: 'STAN', sevClass: 'sev-stan',
    headline: 'US 5th Fleet issues mariners advisory — heightened vigilance',
    location: 'NAVCENT AOR', time: '14h ago', filter: 'stan'
  },
];

function renderFeed(filter = 'all') {
  const list = document.getElementById('feed-list');
  const filtered = filter === 'all' ? events : events.filter(e => e.filter === filter);
  list.innerHTML = filtered.map(e => `
    <div class="feed-item">
      <span class="feed-severity ${e.sevClass}">${e.severity}</span>
      <div class="feed-body">
        <div class="feed-headline">${e.headline}</div>
        <div class="feed-meta">
          <span class="feed-location">${e.location}</span>
          <span>·</span>
          <span>${e.time}</span>
        </div>
      </div>
    </div>
  `).join('');
}

renderFeed();

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderFeed(btn.dataset.filter);
  });
});

// ---- NEWS FEED ----
const newsItems = [
  {
    source: 'Reuters',
    headline: 'Iran vows to keep Strait of Hormuz open but warns of "consequences" amid new US sanctions',
    time: '2h ago',
    url: 'https://www.reuters.com'
  },
  {
    source: 'USNI News',
    headline: 'USS Cole, USS Bataan Amphibious Ready Group operating in the 5th Fleet AOR',
    time: '4h ago',
    url: 'https://news.usni.org'
  },
  {
    source: 'Lloyd\'s List',
    headline: 'War risk insurers raise premiums for Gulf tanker routes as tensions escalate',
    time: '6h ago',
    url: 'https://lloydslist.com'
  },
  {
    source: 'AP',
    headline: 'Saudi Arabia and UAE boost naval coordination with US 5th Fleet amid Iran threat',
    time: '9h ago',
    url: 'https://apnews.com'
  },
  {
    source: 'MarineTraffic',
    headline: 'Transit traffic through Hormuz up 8% this month despite regional tensions',
    time: '12h ago',
    url: 'https://www.marinetraffic.com'
  },
  {
    source: 'Defense One',
    headline: 'Pentagon quietly reinforces Red Sea and Gulf presence with additional destroyers',
    time: '18h ago',
    url: 'https://www.defenseone.com'
  },
];

const newsGrid = document.getElementById('news-grid');
newsGrid.innerHTML = newsItems.map(n => `
  <a href="${n.url}" target="_blank" class="news-card" style="text-decoration:none;display:block">
    <div class="news-source">${n.source}</div>
    <div class="news-headline">${n.headline}</div>
    <div class="news-time">${n.time}</div>
  </a>
`).join('');

// ---- THEME TOGGLE ----
const themeToggle = document.querySelector('[data-theme-toggle]');
const html = document.documentElement;

themeToggle?.addEventListener('click', () => {
  const current = html.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  themeToggle.innerHTML = next === 'dark'
    ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
    : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
});

// ---- TIMESTAMP ----
function updateTimestamp() {
  const el = document.getElementById('last-update');
  if (el) {
    const now = new Date();
    el.textContent = now.toUTCString().replace('GMT', 'UTC');
  }
}

// ---- REFRESH ----
function refreshData() {
  const btn = document.getElementById('refresh-btn');
  btn.classList.add('spinning');
  btn.disabled = true;
  setTimeout(() => {
    updateTimestamp();
    btn.classList.remove('spinning');
    btn.disabled = false;
  }, 1200);
}

// Auto-refresh timestamp every 2 minutes
setInterval(updateTimestamp, 120000);

// Nav section switching (stub)
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
  });
});
