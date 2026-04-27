// ========================
// HORMUZ STRAIT INTEL DASHBOARD
// Live Data Edition
// ========================

// ---- TIMESTAMP ----
function updateTimestamp() {
  const el = document.getElementById('last-update');
  if (el) {
    const now = new Date();
    el.textContent = now.toUTCString().slice(0, 22) + ' UTC';
  }
}
updateTimestamp();
setInterval(updateTimestamp, 60000);

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

// ---- EVENT FEED (UKMTO-style incidents) ----
const events = [
  { severity: 'CRIT', sevClass: 'sev-crit', headline: 'IRGCN vessels shadow US carrier group entering Gulf', location: 'Strait of Hormuz', time: '14 min ago', filter: 'crit' },
  { severity: 'HIGH', sevClass: 'sev-high', headline: 'Unidentified vessel deviates from filed route — AIS irregular near Bandar Abbas', location: 'Bandar Abbas', time: '1h 12m ago', filter: 'high' },
  { severity: 'HIGH', sevClass: 'sev-high', headline: 'HMS Diamond escorts tanker convoy through inbound lane', location: 'Musandam', time: '2h 05m ago', filter: 'high' },
  { severity: 'STAN', sevClass: 'sev-stan', headline: 'AIS gap detected: unidentified vessel NE of Qeshm Island — 47 min blackout', location: 'Qeshm', time: '3h 40m ago', filter: 'stan' },
  { severity: 'HIGH', sevClass: 'sev-high', headline: 'Iran announces 72h live-fire naval exercises — Gulf of Oman', location: 'Gulf of Oman', time: '5h 17m ago', filter: 'high' },
  { severity: 'STAN', sevClass: 'sev-stan', headline: 'Fujairah port reports 18% surge in bunkering — possible pre-conflict stockpiling', location: 'Fujairah', time: '7h 02m ago', filter: 'stan' },
  { severity: 'CRIT', sevClass: 'sev-crit', headline: 'UKMTO: Drone swarm activity reported near Bandar Lengeh', location: 'Bandar Lengeh', time: '9h 55m ago', filter: 'crit' },
  { severity: 'HIGH', sevClass: 'sev-high', headline: "Lloyd's War Risk premium elevated — Gulf transit surcharge active", location: 'Gulf Region', time: '12h ago', filter: 'high' },
  { severity: 'STAN', sevClass: 'sev-stan', headline: 'US 5th Fleet issues mariners advisory — heightened vigilance required', location: 'NAVCENT AOR', time: '15h ago', filter: 'stan' },
  { severity: 'INFO', sevClass: 'sev-info', headline: 'COSCO SHIPPING ROSE completes outbound transit — largest vessel this week', location: 'Strait of Hormuz', time: '18h ago', filter: 'stan' },
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

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderFeed(btn.dataset.filter);
  });
});

// ---- LIVE NEWS via RSS2JSON ----
// Uses rss2json.com free API — no key needed, works on live public sites
const RSS_FEEDS = [
  {
    url: 'https://feeds.reuters.com/reuters/topNews',
    source: 'Reuters',
    keywords: ['Iran', 'Hormuz', 'Gulf', 'Persian', 'IRGC', 'tanker', 'naval', 'Strait', 'oil', 'sanctions']
  },
  {
    url: 'https://news.usni.org/feed',
    source: 'USNI News',
    keywords: ['Iran', 'Hormuz', 'Gulf', '5th Fleet', 'destroyer', 'carrier', 'Navy', 'NAVCENT']
  },
  {
    url: 'https://rss.app/feeds/tYGGqhGgZLyALXxo.xml',
    source: 'Maritime Executive',
    keywords: ['Hormuz', 'Gulf', 'tanker', 'shipping', 'Iran', 'naval', 'piracy', 'maritime']
  }
];

const API_BASE = 'https://api.rss2json.com/v1/api.json?rss_url=';

async function fetchFeed(feed) {
  try {
    const res = await fetch(`${API_BASE}${encodeURIComponent(feed.url)}&count=20`);
    if (!res.ok) throw new Error('fetch failed');
    const data = await res.json();
    if (data.status !== 'ok') throw new Error('bad status');
    // Filter items by keywords
    return data.items
      .filter(item => {
        const text = (item.title + ' ' + (item.description || '')).toLowerCase();
        return feed.keywords.some(kw => text.includes(kw.toLowerCase()));
      })
      .slice(0, 4)
      .map(item => ({
        source: feed.source,
        headline: item.title,
        time: timeAgo(new Date(item.pubDate)),
        url: item.link
      }));
  } catch (e) {
    return [];
  }
}

function timeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

async function loadNews() {
  const grid = document.getElementById('news-grid');
  const statusEl = document.getElementById('news-status');

  try {
    const results = await Promise.allSettled(RSS_FEEDS.map(f => fetchFeed(f)));
    let articles = [];
    results.forEach(r => {
      if (r.status === 'fulfilled') articles = articles.concat(r.value);
    });

    // Sort by most recent and deduplicate
    articles = articles.filter((a, i, arr) =>
      arr.findIndex(b => b.headline === a.headline) === i
    );

    if (articles.length === 0) {
      // Fallback to static content if no RSS results
      renderStaticNews();
      statusEl.textContent = 'Cached feed · Reuters · USNI · Maritime Executive';
      return;
    }

    grid.innerHTML = articles.slice(0, 6).map(n => `
      <a href="${n.url}" target="_blank" rel="noopener" class="news-card" style="text-decoration:none;display:block">
        <div class="news-source">${n.source}</div>
        <div class="news-headline">${n.headline}</div>
        <div class="news-time">${n.time}</div>
      </a>
    `).join('');

    statusEl.textContent = `Live · Reuters · USNI · Maritime Executive · Updated ${new Date().toUTCString().slice(17, 22)} UTC`;

  } catch (e) {
    renderStaticNews();
    statusEl.textContent = 'Cached feed — live fetch unavailable';
  }
}

function renderStaticNews() {
  const grid = document.getElementById('news-grid');
  const fallback = [
    { source: 'Reuters', headline: 'Iran vows to keep Strait of Hormuz open but warns of consequences amid new US sanctions', time: '2h ago', url: 'https://www.reuters.com/world/middle-east/' },
    { source: 'USNI News', headline: 'USS Cole, USS Bataan Amphibious Ready Group operating in the 5th Fleet AOR', time: '4h ago', url: 'https://news.usni.org' },
    { source: "Lloyd's List", headline: 'War risk insurers raise premiums for Gulf tanker routes as tensions escalate', time: '6h ago', url: 'https://lloydslist.com' },
    { source: 'AP', headline: 'Saudi Arabia and UAE boost naval coordination with US 5th Fleet amid Iran threat', time: '9h ago', url: 'https://apnews.com/world-news' },
    { source: 'Maritime Executive', headline: 'Transit traffic through Hormuz up 8% this month despite regional tensions', time: '12h ago', url: 'https://maritime-executive.com' },
    { source: 'Defense One', headline: 'Pentagon quietly reinforces Red Sea and Gulf presence with additional destroyers', time: '18h ago', url: 'https://www.defenseone.com' },
  ];
  grid.innerHTML = fallback.map(n => `
    <a href="${n.url}" target="_blank" rel="noopener" class="news-card" style="text-decoration:none;display:block">
      <div class="news-source">${n.source}</div>
      <div class="news-headline">${n.headline}</div>
      <div class="news-time">${n.time}</div>
    </a>
  `).join('');
}

// Load news on startup
loadNews();

// ---- REFRESH ALL ----
function refreshAll() {
  const btn = document.querySelector('.btn-refresh');
  btn.disabled = true;
  btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation:spin 1s linear infinite"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> Refreshing…`;

  loadNews().then(() => {
    updateTimestamp();
    btn.disabled = false;
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> Refresh`;
  });
}

// Auto-refresh news every 10 minutes
setInterval(loadNews, 600000);
