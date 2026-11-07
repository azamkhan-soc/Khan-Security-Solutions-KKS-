/**
 * KHAN SECURITY SOLUTIONS ENTERPRISE
 * Threat Intelligence Platform — Module v0.6.0
 *
 * Offline threat intelligence workbench: IOC feed, threat actor profiles,
 * campaign tracking, local IOC lookup, and MITRE ATT&CK technique mapping.
 *
 * [EDUCATIONAL SIMULATION — All actors, campaigns, and IOCs are synthetic.
 *  MITRE ATT&CK technique IDs/names are the real public framework taxonomy,
 *  used here for realistic mapping only. No live feeds or external lookups
 *  are performed; everything runs against the bundled offline dataset.]
 *
 * Integrates with:
 *   window.Router              — route: 'threat-intel'
 *   window.SearchEngine        — searchable content
 *   window.NotificationManager — alerts and feedback
 *   window.StorageManager      — watchlist persistence (iocs store)
 *   window.SampleThreatIntel   — bundled sample dataset
 */

const ThreatIntel = (() => {

  // ── State ──────────────────────────────────────────────────────────────
  let mounted        = false;
  let activeTab       = 'overview';
  let feedSearch       = '';
  let feedTypeFilter    = 'all';
  let feedLevelFilter   = 'all';
  let feedSort          = 'lastSeen-desc';
  let selectedActorId   = null;
  let selectedCampaignId = null;
  let watchlist          = new Set();  // IOC ids bookmarked by the analyst

  // ── Icon paths (heroicons-style outline) ──────────────────────────────────
  const I = {
    shield:   `<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>`,
    search:   `<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z"/>`,
    close:    `<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>`,
    users:    `<path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/>`,
    target:   `<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m0 13.5V21m9-9h-2.25m-13.5 0H3m14.485-6.364l-1.591 1.591M6.227 17.773l-1.591 1.591m0-12.728l1.591 1.591m11.546 11.546l1.591 1.591M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"/>`,
    globe:    `<path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"/>`,
    mail:     `<path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>`,
    filter:   `<path stroke-linecap="round" stroke-linejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"/>`,
    chevron:  `<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>`,
    external: `<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/>`,
    database: `<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 3.75c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"/>`,
    clock:    `<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>`,
    warn:     `<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>`,
    hash:     `<path stroke-linecap="round" stroke-linejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5"/>`,
    bookmark: `<path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"/>`,
    report:   `<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"/>`,
    copy:     `<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"/>`,
    down:     `<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>`,
    check:    `<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>`,
    map:      `<path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"/>`,
  };

  function svg(name, cls = '') {
    return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">${I[name] || I.shield}</svg>`;
  }
  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }

  // ── Data shortcuts ─────────────────────────────────────────────────────
  const DATA = () => window.SampleThreatIntel || { actors: [], campaigns: [], iocs: [], mitreTechniques: [], TACTIC_ORDER: [] };

  const TYPE_ICON  = { ip: 'globe', domain: 'globe', url: 'external', hash: 'hash', email: 'mail' };
  const TYPE_LABEL = { ip: 'IP Address', domain: 'Domain', url: 'URL', hash: 'File Hash', email: 'Email' };
  const LEVEL_ORDER = { critical: 4, high: 3, medium: 2, low: 1 };

  // ══════════════════════════════════════════════════════════════════════
  // ROUTE REGISTRATION
  // ══════════════════════════════════════════════════════════════════════
  function register() {
    window.Router.register('threat-intel', {
      title: 'Threat Intelligence',
      init,
      render,
    });
  }

  function init() {
    _loadWatchlist();
    _registerSearch();
  }

  function render() {
    const el = document.getElementById('page-threat-intel');
    if (!el) return;
    if (!mounted) {
      el.innerHTML = _buildShell();
      mounted = true;
      _wireAll();
    }
    _switchTab(activeTab);
  }

  // ══════════════════════════════════════════════════════════════════════
  // SHELL
  // ══════════════════════════════════════════════════════════════════════
  function _buildShell() {
    const d = DATA();
    return `
    <div class="ti-shell">

      <div class="ti-header">
        <div class="ti-header-left">
          <div class="ti-header-icon">${svg('shield')}</div>
          <div>
            <div class="ti-header-title">Threat Intelligence Platform</div>
            <div class="ti-header-sub">${d.iocs.length} indicators &middot; ${d.actors.length} tracked actors &middot; ${d.campaigns.filter(c => c.status === 'Active').length} active campaigns</div>
          </div>
        </div>
        <div class="ti-header-right">
          <span class="badge badge-warning" style="font-family:var(--font-mono);font-size:10px;">⚠ EDUCATIONAL SIMULATION — OFFLINE DATA</span>
        </div>
      </div>

      <div class="ti-tabs" role="tablist">
        <div class="ti-tab active" data-tab="overview"  role="tab">${svg('shield')}   Overview</div>
        <div class="ti-tab"        data-tab="feed"      role="tab">${svg('database')} IOC Feed</div>
        <div class="ti-tab"        data-tab="actors"    role="tab">${svg('users')}    Threat Actors</div>
        <div class="ti-tab"        data-tab="campaigns" role="tab">${svg('target')}   Campaigns</div>
        <div class="ti-tab"        data-tab="lookup"    role="tab">${svg('search')}   IOC Lookup</div>
        <div class="ti-tab"        data-tab="mitre"     role="tab">${svg('map')}      MITRE ATT&amp;CK Map</div>
        <div class="ti-tab"        data-tab="report"    role="tab">${svg('report')}   Reports</div>
      </div>

      <div class="ti-body">
        <div class="ti-view active" id="ti-view-overview">${_buildOverview()}</div>
        <div class="ti-view" id="ti-view-feed">${_buildFeedView()}</div>
        <div class="ti-view" id="ti-view-actors">${_buildActorsView()}</div>
        <div class="ti-view" id="ti-view-campaigns">${_buildCampaignsView()}</div>
        <div class="ti-view" id="ti-view-lookup">${_buildLookupView()}</div>
        <div class="ti-view" id="ti-view-mitre">${_buildMitreView()}</div>
        <div class="ti-view" id="ti-view-report">${_buildReportView()}</div>
      </div>
    </div>

    <!-- ── DETAIL PANEL (IOC / Actor / Campaign) ── -->
    <div class="ti-detail-overlay" id="ti-detail-overlay">
      <div class="ti-detail-panel" id="ti-detail-panel">
        <div class="ti-detail-header">
          <div class="ti-detail-title" id="ti-detail-title">Detail</div>
          <div class="ti-detail-close" id="ti-detail-close">${svg('close')}</div>
        </div>
        <div id="ti-detail-body"></div>
      </div>
    </div>`;
  }

  function _wireAll() {
    document.querySelectorAll('#page-threat-intel .ti-tab').forEach(tab => {
      tab.addEventListener('click', () => _switchTab(tab.dataset.tab));
    });
    document.getElementById('ti-detail-close')?.addEventListener('click', _closeDetail);
    document.getElementById('ti-detail-overlay')?.addEventListener('click', e => {
      if (e.target.id === 'ti-detail-overlay') _closeDetail();
    });
    _wireFeed();
    _wireActors();
    _wireCampaigns();
    _wireLookup();
    _wireReport();
  }

  function _switchTab(tabId) {
    activeTab = tabId;
    document.querySelectorAll('#page-threat-intel .ti-tab').forEach(t =>
      t.classList.toggle('active', t.dataset.tab === tabId));
    document.querySelectorAll('#page-threat-intel .ti-view').forEach(v =>
      v.classList.toggle('active', v.id === `ti-view-${tabId}`));
    if (tabId === 'mitre') _renderMitreMatrix();
  }

  // ══════════════════════════════════════════════════════════════════════
  // OVERVIEW
  // ══════════════════════════════════════════════════════════════════════
  function _buildOverview() {
    const d = DATA();
    const critical = d.iocs.filter(i => i.threatLevel === 'critical').length;
    const active   = d.campaigns.filter(c => c.status === 'Active').length;
    const recent   = [...d.iocs].sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen)).slice(0, 8);
    const topActors = [...d.actors].sort((a, b) => b.confidence - a.confidence).slice(0, 4);

    return `
      <div class="grid grid-stats">
        ${_statCard('Total IOCs', d.iocs.length, `${critical} critical`, 'var(--color-danger)')}
        ${_statCard('Tracked Actors', d.actors.length, 'Synthetic profiles', 'var(--color-info)')}
        ${_statCard('Active Campaigns', active, `${d.campaigns.length} total tracked`, 'var(--color-warning)')}
        ${_statCard('Watchlist', watchlist.size, 'Bookmarked IOCs', 'var(--color-success)')}
      </div>

      <div class="ti-overview-grid">
        <div class="card">
          <div class="card-header"><div class="card-title">Recent IOC Activity</div></div>
          <div class="card-body" style="padding:0;">
            <table class="data-table">
              <thead><tr><th>Type</th><th>Indicator</th><th>Level</th><th>Last Seen</th></tr></thead>
              <tbody>
                ${recent.map(i => `
                  <tr class="ti-row" data-ioc="${i.id}">
                    <td>${svg(TYPE_ICON[i.type], 'ti-inline-icon')} ${TYPE_LABEL[i.type]}</td>
                    <td class="mono">${esc(_truncate(i.value, 34))}</td>
                    <td>${_levelBadge(i.threatLevel)}</td>
                    <td>${esc(i.lastSeen)}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><div class="card-title">Top Tracked Actors</div></div>
          <div class="card-body">
            ${topActors.map(a => `
              <div class="ti-actor-mini" data-actor="${a.id}">
                <div class="ti-actor-mini-icon">${svg('users')}</div>
                <div style="flex:1;min-width:0;">
                  <div class="ti-actor-mini-name">${esc(a.name)}</div>
                  <div class="ti-actor-mini-meta">${esc(a.type)} &middot; ${a.targetSectors.slice(0, 2).map(esc).join(', ')}</div>
                </div>
                <span class="badge badge-neutral">${a.confidence}%</span>
              </div>`).join('')}
          </div>
        </div>
      </div>

      <div class="empty-state" style="margin-top:var(--space-5);padding:var(--space-4);border:1px dashed var(--border-default);border-radius:var(--radius-lg);">
        <div style="display:flex;gap:var(--space-3);align-items:flex-start;">
          <div style="color:var(--color-warning);flex-shrink:0;">${svg('warn', 'ti-inline-icon')}</div>
          <div style="font-size:var(--text-sm);color:var(--text-secondary);text-align:left;">
            This platform ships with a bundled, fully synthetic dataset for offline demonstration. No live threat
            feeds, VirusTotal, or WHOIS lookups are performed — all actor names, IOCs, and campaigns are fictional.
          </div>
        </div>
      </div>`;
  }

  function _statCard(label, value, change, color) {
    return `
      <div class="stat-card">
        <div class="stat-card-icon" style="background:${color}22;color:${color};">${svg('shield')}</div>
        <div class="stat-card-info">
          <div class="stat-card-value">${value}</div>
          <div class="stat-card-label">${esc(label)}</div>
          <div class="stat-card-change" style="color:var(--text-tertiary);">${esc(change)}</div>
        </div>
      </div>`;
  }

  function _levelBadge(level) {
    const cls = { critical: 'badge-critical', high: 'badge-high', medium: 'badge-medium', low: 'badge-low' }[level] || 'badge-neutral';
    return `<span class="badge ${cls}">${esc(level)}</span>`;
  }

  function _truncate(s, n) { return s.length > n ? s.slice(0, n - 1) + '…' : s; }

  // ══════════════════════════════════════════════════════════════════════
  // IOC FEED
  // ══════════════════════════════════════════════════════════════════════
  function _buildFeedView() {
    return `
      <div class="ti-toolbar">
        <div class="ti-search-box">
          ${svg('search', 'ti-inline-icon')}
          <input type="text" id="ti-feed-search" placeholder="Search IOC value, tag, or source…" />
        </div>
        <select class="input" id="ti-feed-type" style="max-width:160px;">
          <option value="all">All Types</option>
          <option value="ip">IP Address</option>
          <option value="domain">Domain</option>
          <option value="url">URL</option>
          <option value="hash">File Hash</option>
          <option value="email">Email</option>
        </select>
        <select class="input" id="ti-feed-level" style="max-width:160px;">
          <option value="all">All Levels</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select class="input" id="ti-feed-sort" style="max-width:180px;">
          <option value="lastSeen-desc">Last Seen (newest)</option>
          <option value="lastSeen-asc">Last Seen (oldest)</option>
          <option value="level-desc">Threat Level (high→low)</option>
          <option value="confidence-desc">Confidence (high→low)</option>
        </select>
      </div>
      <div id="ti-feed-count" class="ti-result-count"></div>
      <div class="card" style="margin-top:var(--space-3);">
        <div class="card-body" style="padding:0;overflow-x:auto;">
          <table class="data-table">
            <thead>
              <tr><th>Type</th><th>Indicator</th><th>Level</th><th>Confidence</th><th>Source</th><th>Actor</th><th>Last Seen</th><th></th></tr>
            </thead>
            <tbody id="ti-feed-tbody"></tbody>
          </table>
        </div>
      </div>`;
  }

  function _wireFeed() {
    document.getElementById('ti-feed-search')?.addEventListener('input', e => { feedSearch = e.target.value; _renderFeed(); });
    document.getElementById('ti-feed-type')?.addEventListener('change', e => { feedTypeFilter = e.target.value; _renderFeed(); });
    document.getElementById('ti-feed-level')?.addEventListener('change', e => { feedLevelFilter = e.target.value; _renderFeed(); });
    document.getElementById('ti-feed-sort')?.addEventListener('change', e => { feedSort = e.target.value; _renderFeed(); });
    _renderFeed();
  }

  function _filteredFeed() {
    const d = DATA();
    const q = feedSearch.trim().toLowerCase();
    let rows = d.iocs.filter(i => {
      if (feedTypeFilter !== 'all' && i.type !== feedTypeFilter) return false;
      if (feedLevelFilter !== 'all' && i.threatLevel !== feedLevelFilter) return false;
      if (q && !(i.value.toLowerCase().includes(q) || (i.tags || []).some(t => t.toLowerCase().includes(q)) || i.source.toLowerCase().includes(q))) return false;
      return true;
    });
    const [key, dir] = feedSort.split('-');
    rows.sort((a, b) => {
      let av, bv;
      if (key === 'lastSeen')       { av = new Date(a.lastSeen); bv = new Date(b.lastSeen); }
      else if (key === 'level')     { av = LEVEL_ORDER[a.threatLevel]; bv = LEVEL_ORDER[b.threatLevel]; }
      else                          { av = a.confidence; bv = b.confidence; }
      return dir === 'asc' ? av - bv : bv - av;
    });
    return rows;
  }

  function _renderFeed() {
    const d = DATA();
    const rows = _filteredFeed();
    const tbody = document.getElementById('ti-feed-tbody');
    const count = document.getElementById('ti-feed-count');
    if (count) count.textContent = `${rows.length} of ${d.iocs.length} indicators`;
    if (!tbody) return;

    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="empty-state-title">No indicators match</div><div class="empty-state-desc">Try clearing your filters or search term.</div></div></td></tr>`;
      return;
    }

    tbody.innerHTML = rows.map(i => {
      const actor = i.actorId ? d.getActor(i.actorId) : null;
      const watched = watchlist.has(i.id);
      return `
      <tr class="ti-row" data-ioc="${i.id}">
        <td>${svg(TYPE_ICON[i.type], 'ti-inline-icon')} ${TYPE_LABEL[i.type]}</td>
        <td class="mono">${esc(_truncate(i.value, 30))}</td>
        <td>${_levelBadge(i.threatLevel)}</td>
        <td>${i.confidence}%</td>
        <td>${esc(i.source)}</td>
        <td>${actor ? esc(actor.name) : '<span style="color:var(--text-tertiary)">Unattributed</span>'}</td>
        <td>${esc(i.lastSeen)}</td>
        <td><button class="btn-icon ti-watch-btn ${watched ? 'active' : ''}" data-ioc="${i.id}" title="${watched ? 'Remove from watchlist' : 'Add to watchlist'}">${svg('bookmark')}</button></td>
      </tr>`;
    }).join('');

    tbody.querySelectorAll('.ti-row').forEach(tr => {
      tr.addEventListener('click', e => {
        if (e.target.closest('.ti-watch-btn')) return;
        _openIOCDetail(tr.dataset.ioc);
      });
    });
    tbody.querySelectorAll('.ti-watch-btn').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); _toggleWatch(btn.dataset.ioc); });
    });
  }

  // ══════════════════════════════════════════════════════════════════════
  // THREAT ACTORS
  // ══════════════════════════════════════════════════════════════════════
  function _buildActorsView() {
    const d = DATA();
    return `
      <div class="ti-actor-grid">
        ${d.actors.map(a => `
          <div class="card ti-actor-card" data-actor="${a.id}">
            <div class="ti-actor-card-header">
              <div class="ti-actor-mini-icon lg">${svg('users')}</div>
              <div style="flex:1;min-width:0;">
                <div class="ti-actor-mini-name">${esc(a.name)}</div>
                <div class="ti-actor-mini-meta">${esc(a.aliases.join(' · '))}</div>
              </div>
              <span class="badge badge-neutral">${a.confidence}% conf.</span>
            </div>
            <div class="card-body">
              <div class="ti-tag-row">
                <span class="badge badge-info">${esc(a.type)}</span>
                <span class="badge badge-neutral">${esc(a.motivation)}</span>
              </div>
              <div class="ti-actor-desc">${esc(a.summary)}</div>
              <div class="ti-actor-sectors">
                <strong>Targets:</strong> ${a.targetSectors.map(esc).join(', ')}
              </div>
            </div>
          </div>`).join('')}
      </div>`;
  }

  function _wireActors() {
    document.querySelectorAll('#page-threat-intel .ti-actor-card, #page-threat-intel .ti-actor-mini').forEach(card => {
      card.addEventListener('click', () => _openActorDetail(card.dataset.actor));
    });
  }

  // ══════════════════════════════════════════════════════════════════════
  // CAMPAIGNS
  // ══════════════════════════════════════════════════════════════════════
  function _buildCampaignsView() {
    const d = DATA();
    return `
      <div class="ti-campaign-list">
        ${d.campaigns.map(c => {
          const actor = d.getActor(c.actorId);
          return `
          <div class="card ti-campaign-card" data-campaign="${c.id}">
            <div class="ti-campaign-card-header">
              <div>
                <div class="ti-campaign-name">${esc(c.name)}</div>
                <div class="ti-actor-mini-meta">Attributed to ${actor ? esc(actor.name) : 'Unknown actor'}</div>
              </div>
              <div class="ti-tag-row">
                <span class="badge ${c.status === 'Active' ? 'badge-danger' : c.status === 'Dormant' ? 'badge-warning' : 'badge-neutral'}">${esc(c.status)}</span>
                ${_levelBadge(c.severity.toLowerCase())}
              </div>
            </div>
            <div class="card-body">
              <div class="ti-actor-desc">${esc(c.summary)}</div>
              <div class="ti-campaign-meta-row">
                <span>${svg('clock', 'ti-inline-icon')} Started ${esc(c.startDate)}${c.endDate ? ' · Ended ' + esc(c.endDate) : ''}</span>
                <span>${svg('database', 'ti-inline-icon')} ${c.iocCount} IOCs</span>
                <span>${svg('target', 'ti-inline-icon')} ${c.targetSectors.map(esc).join(', ')}</span>
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>`;
  }

  function _wireCampaigns() {
    document.querySelectorAll('#page-threat-intel .ti-campaign-card').forEach(card => {
      card.addEventListener('click', () => _openCampaignDetail(card.dataset.campaign));
    });
  }

  // ══════════════════════════════════════════════════════════════════════
  // IOC LOOKUP
  // ══════════════════════════════════════════════════════════════════════
  function _buildLookupView() {
    return `
      <div class="ti-lookup-shell">
        <div class="card">
          <div class="card-header"><div class="card-title">Local IOC Lookup</div></div>
          <div class="card-body">
            <p style="color:var(--text-secondary);font-size:var(--text-sm);margin-bottom:var(--space-4);">
              Check a hash, IP address, domain, URL, or email against the bundled offline threat intelligence dataset.
              This performs a local match only — no external services are contacted.
            </p>
            <div class="ti-lookup-input-row">
              <input type="text" class="input" id="ti-lookup-input" placeholder="Paste an indicator, e.g. 198.51.100.14" />
              <button class="btn btn-primary" id="ti-lookup-btn">${svg('search')} Lookup</button>
            </div>
            <div id="ti-lookup-result" class="ti-lookup-result"></div>
          </div>
        </div>
      </div>`;
  }

  function _wireLookup() {
    const btn   = document.getElementById('ti-lookup-btn');
    const input = document.getElementById('ti-lookup-input');
    const run = () => _runLookup(input.value);
    btn?.addEventListener('click', run);
    input?.addEventListener('keydown', e => { if (e.key === 'Enter') run(); });
  }

  function _runLookup(raw) {
    const d = DATA();
    const box = document.getElementById('ti-lookup-result');
    const q = (raw || '').trim();
    if (!q) { box.innerHTML = ''; return; }

    const match = d.iocs.find(i => i.value.toLowerCase() === q.toLowerCase());

    if (!match) {
      box.innerHTML = `
        <div class="ti-lookup-clean">
          ${svg('check', 'ti-inline-icon')}
          <div>
            <div class="ti-lookup-clean-title">No match in local dataset</div>
            <div class="ti-lookup-clean-desc">This indicator was not found in the offline threat intelligence feed. This does not confirm the indicator is safe — only that it is not present in this simulated dataset.</div>
          </div>
        </div>
        <div class="ti-lookup-external">
          <span>Check against live sources:</span>
          <a class="btn btn-secondary btn-sm" href="https://www.virustotal.com" target="_blank" rel="noopener">${svg('external', 'ti-inline-icon')} VirusTotal</a>
          <a class="btn btn-secondary btn-sm" href="https://www.abuseipdb.com" target="_blank" rel="noopener">${svg('external', 'ti-inline-icon')} AbuseIPDB</a>
        </div>`;
      window.NotificationManager?.info('No Match', 'Indicator not found in local dataset.');
      return;
    }

    const actor = match.actorId ? d.getActor(match.actorId) : null;
    box.innerHTML = `
      <div class="ti-lookup-hit">
        ${svg('warn', 'ti-inline-icon')}
        <div style="flex:1;">
          <div class="ti-lookup-hit-title">Match found — ${_levelBadge(match.threatLevel)}</div>
          <div class="ti-lookup-hit-desc">This indicator matches a known entry in the offline dataset (confidence ${match.confidence}%), sourced from ${esc(match.source)}${actor ? `, attributed to <strong>${esc(actor.name)}</strong>` : ''}.</div>
          <button class="btn btn-secondary btn-sm" id="ti-lookup-view-btn" style="margin-top:var(--space-3);">View Full IOC Record</button>
        </div>
      </div>`;
    document.getElementById('ti-lookup-view-btn')?.addEventListener('click', () => _openIOCDetail(match.id));
    window.NotificationManager?.warning('Match Found', `${match.value} matched a ${match.threatLevel} severity indicator.`);
  }

  // ══════════════════════════════════════════════════════════════════════
  // MITRE ATT&CK MAP
  // ══════════════════════════════════════════════════════════════════════
  function _buildMitreView() {
    return `
      <div class="ti-mitre-legend">
        <span><span class="ti-mitre-dot" style="background:var(--bg-elevated);"></span> Not observed</span>
        <span><span class="ti-mitre-dot" style="background:rgba(37,99,235,0.35);"></span> 1 actor</span>
        <span><span class="ti-mitre-dot" style="background:rgba(37,99,235,0.65);"></span> 2 actors</span>
        <span><span class="ti-mitre-dot" style="background:rgba(37,99,235,1);"></span> 3+ actors</span>
      </div>
      <div id="ti-mitre-matrix" class="ti-mitre-matrix"></div>`;
  }

  function _renderMitreMatrix() {
    const d = DATA();
    const box = document.getElementById('ti-mitre-matrix');
    if (!box || box.dataset.rendered) return;
    box.dataset.rendered = '1';

    const byTactic = {};
    d.TACTIC_ORDER.forEach(t => byTactic[t] = []);
    d.mitreTechniques.forEach(t => {
      const usedBy = d.actors.filter(a => a.techniques.includes(t.id));
      (byTactic[t.tactic] || (byTactic[t.tactic] = [])).push({ ...t, usedBy });
    });

    box.innerHTML = d.TACTIC_ORDER.filter(t => (byTactic[t] || []).length).map(tactic => `
      <div class="ti-mitre-col">
        <div class="ti-mitre-col-header">${esc(tactic)}</div>
        ${byTactic[tactic].map(t => {
          const n = t.usedBy.length;
          const alpha = n >= 3 ? 1 : n === 2 ? 0.65 : n === 1 ? 0.35 : 0;
          return `
          <div class="ti-mitre-cell" style="background:rgba(37,99,235,${alpha});" data-tid="${t.id}" title="${esc(t.name)} — used by ${n} tracked actor(s)">
            <div class="ti-mitre-cell-id">${esc(t.id)}</div>
            <div class="ti-mitre-cell-name">${esc(t.name)}</div>
          </div>`;
        }).join('')}
      </div>`).join('');

    box.querySelectorAll('.ti-mitre-cell').forEach(cell => {
      cell.addEventListener('click', () => _openMitreDetail(cell.dataset.tid));
    });
  }

  // ══════════════════════════════════════════════════════════════════════
  // REPORTS
  // ══════════════════════════════════════════════════════════════════════
  function _buildReportView() {
    return `
      <div class="card" style="max-width:640px;">
        <div class="card-header"><div class="card-title">Export Threat Intelligence Data</div></div>
        <div class="card-body">
          <p style="color:var(--text-secondary);font-size:var(--text-sm);margin-bottom:var(--space-4);">
            Export the current IOC feed, actor profiles, and campaign data for offline reporting. All exports are
            generated locally in your browser — nothing is transmitted anywhere.
          </p>
          <div class="ti-export-row">
            <button class="btn btn-secondary" id="ti-export-json">${svg('down')} Export IOCs (JSON)</button>
            <button class="btn btn-secondary" id="ti-export-csv">${svg('down')} Export IOCs (CSV)</button>
            <button class="btn btn-secondary" id="ti-export-html">${svg('down')} Full HTML Report</button>
          </div>
        </div>
      </div>`;
  }

  function _wireReport() {
    document.getElementById('ti-export-json')?.addEventListener('click', _exportJSON);
    document.getElementById('ti-export-csv')?.addEventListener('click', _exportCSV);
    document.getElementById('ti-export-html')?.addEventListener('click', _exportHTML);
  }

  function _download(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function _exportJSON() {
    const d = DATA();
    _download('threat-intel-iocs.json', JSON.stringify(d.iocs, null, 2), 'application/json');
    window.NotificationManager?.success('Exported', 'IOC feed exported as JSON.');
  }

  function _exportCSV() {
    const d = DATA();
    const header = ['id', 'type', 'value', 'threatLevel', 'confidence', 'source', 'firstSeen', 'lastSeen', 'tags'];
    const rows = d.iocs.map(i => header.map(k => {
      const v = k === 'tags' ? (i.tags || []).join('|') : i[k];
      return `"${String(v ?? '').replace(/"/g, '""')}"`;
    }).join(','));
    _download('threat-intel-iocs.csv', [header.join(','), ...rows].join('\n'), 'text/csv');
    window.NotificationManager?.success('Exported', 'IOC feed exported as CSV.');
  }

  function _exportHTML() {
    const d = DATA();
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Threat Intelligence Report</title>
      <style>body{font-family:-apple-system,sans-serif;max-width:960px;margin:40px auto;color:#0f172a;}
      table{width:100%;border-collapse:collapse;margin:16px 0;} th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:13px;}
      th{background:#f1f5f9;} h1{font-size:22px;} h2{font-size:16px;margin-top:32px;} .warn{background:#fef3c7;padding:10px;border-radius:6px;font-size:12px;}</style>
      </head><body>
      <h1>Khan Security Solutions — Threat Intelligence Report</h1>
      <div class="warn">⚠ Educational simulation — all data below is synthetic and generated for demonstration purposes only.</div>
      <h2>Tracked Threat Actors (${d.actors.length})</h2>
      <table><tr><th>Name</th><th>Type</th><th>Motivation</th><th>Confidence</th><th>Target Sectors</th></tr>
      ${d.actors.map(a => `<tr><td>${esc(a.name)}</td><td>${esc(a.type)}</td><td>${esc(a.motivation)}</td><td>${a.confidence}%</td><td>${a.targetSectors.map(esc).join(', ')}</td></tr>`).join('')}
      </table>
      <h2>Active Campaigns</h2>
      <table><tr><th>Name</th><th>Status</th><th>Severity</th><th>Started</th><th>IOC Count</th></tr>
      ${d.campaigns.map(c => `<tr><td>${esc(c.name)}</td><td>${esc(c.status)}</td><td>${esc(c.severity)}</td><td>${esc(c.startDate)}</td><td>${c.iocCount}</td></tr>`).join('')}
      </table>
      <h2>IOC Feed (${d.iocs.length})</h2>
      <table><tr><th>Type</th><th>Value</th><th>Level</th><th>Confidence</th><th>Source</th><th>Last Seen</th></tr>
      ${d.iocs.map(i => `<tr><td>${esc(TYPE_LABEL[i.type])}</td><td>${esc(i.value)}</td><td>${esc(i.threatLevel)}</td><td>${i.confidence}%</td><td>${esc(i.source)}</td><td>${esc(i.lastSeen)}</td></tr>`).join('')}
      </table>
      <p style="color:#64748b;font-size:11px;margin-top:24px;">Generated by Khan Security Solutions Enterprise · ${new Date().toLocaleString()}</p>
      </body></html>`;
    _download('threat-intel-report.html', html, 'text/html');
    window.NotificationManager?.success('Report Exported', 'Full HTML report downloaded.');
  }

  // ══════════════════════════════════════════════════════════════════════
  // DETAIL PANEL
  // ══════════════════════════════════════════════════════════════════════
  function _openDetail(title, bodyHtml) {
    document.getElementById('ti-detail-title').textContent = title;
    document.getElementById('ti-detail-body').innerHTML = bodyHtml;
    document.getElementById('ti-detail-overlay').classList.add('open');
  }
  function _closeDetail() {
    document.getElementById('ti-detail-overlay').classList.remove('open');
  }

  function _openIOCDetail(iocId) {
    const d = DATA();
    const i = d.iocs.find(x => x.id === iocId);
    if (!i) return;
    const actor = i.actorId ? d.getActor(i.actorId) : null;
    const campaign = i.campaignId ? d.getCampaign(i.campaignId) : null;
    const watched = watchlist.has(i.id);
    _openDetail('IOC Detail', `
      <div class="ti-detail-grid">
        <div class="ti-detail-field"><div class="ti-detail-field-label">Type</div><div class="ti-detail-field-value">${TYPE_LABEL[i.type]}</div></div>
        <div class="ti-detail-field"><div class="ti-detail-field-label">Threat Level</div><div class="ti-detail-field-value">${_levelBadge(i.threatLevel)}</div></div>
        <div class="ti-detail-field"><div class="ti-detail-field-label">Confidence</div><div class="ti-detail-field-value">${i.confidence}%</div></div>
        <div class="ti-detail-field"><div class="ti-detail-field-label">Source</div><div class="ti-detail-field-value">${esc(i.source)}</div></div>
        <div class="ti-detail-field"><div class="ti-detail-field-label">First Seen</div><div class="ti-detail-field-value">${esc(i.firstSeen)}</div></div>
        <div class="ti-detail-field"><div class="ti-detail-field-label">Last Seen</div><div class="ti-detail-field-value">${esc(i.lastSeen)}</div></div>
      </div>
      <div class="ti-detail-value-box mono">${esc(i.value)}</div>
      <div class="ti-tag-row" style="margin:var(--space-3) 0;">${(i.tags || []).map(t => `<span class="badge badge-neutral">${esc(t)}</span>`).join('')}</div>
      ${actor ? `<div class="ti-detail-link" data-actor="${actor.id}">${svg('users', 'ti-inline-icon')} Attributed to <strong>${esc(actor.name)}</strong></div>` : ''}
      ${campaign ? `<div class="ti-detail-link" data-campaign="${campaign.id}">${svg('target', 'ti-inline-icon')} Part of <strong>${esc(campaign.name)}</strong></div>` : ''}
      <div style="display:flex;gap:var(--space-2);margin-top:var(--space-4);">
        <button class="btn btn-secondary btn-sm" id="ti-detail-copy">${svg('copy')} Copy Value</button>
        <button class="btn ${watched ? 'btn-danger' : 'btn-primary'} btn-sm" id="ti-detail-watch">${svg('bookmark')} ${watched ? 'Remove from Watchlist' : 'Add to Watchlist'}</button>
      </div>
    `);
    document.getElementById('ti-detail-copy')?.addEventListener('click', () => _copyText(i.value, 'IOC value copied'));
    document.getElementById('ti-detail-watch')?.addEventListener('click', () => { _toggleWatch(i.id); _openIOCDetail(i.id); });
    document.querySelector('.ti-detail-link[data-actor]')?.addEventListener('click', () => _openActorDetail(actor.id));
    document.querySelector('.ti-detail-link[data-campaign]')?.addEventListener('click', () => _openCampaignDetail(campaign.id));
  }

  function _openActorDetail(actorId) {
    const d = DATA();
    const a = d.getActor(actorId);
    if (!a) return;
    const relatedIOCs = d.iocs.filter(i => i.actorId === a.id);
    const relatedCampaigns = d.campaigns.filter(c => c.actorId === a.id);
    const techniques = a.techniques.map(tid => d.mitreTechniques.find(t => t.id === tid)).filter(Boolean);

    _openDetail(a.name, `
      <div class="ti-tag-row" style="margin-bottom:var(--space-3);">
        <span class="badge badge-info">${esc(a.type)}</span>
        <span class="badge badge-neutral">${esc(a.motivation)}</span>
        <span class="badge badge-neutral">${a.confidence}% confidence</span>
      </div>
      <div class="ti-actor-desc" style="margin-bottom:var(--space-3);">${esc(a.summary)}</div>
      <div class="ti-detail-grid">
        <div class="ti-detail-field"><div class="ti-detail-field-label">Aliases</div><div class="ti-detail-field-value">${esc(a.aliases.join(', '))}</div></div>
        <div class="ti-detail-field"><div class="ti-detail-field-label">First Observed</div><div class="ti-detail-field-value">${esc(a.firstObserved)}</div></div>
        <div class="ti-detail-field"><div class="ti-detail-field-label">Sophistication</div><div class="ti-detail-field-value">${esc(a.sophistication)}</div></div>
      </div>
      <div class="ti-detail-sub-title">Target Sectors</div>
      <div class="ti-tag-row">${a.targetSectors.map(s => `<span class="badge badge-neutral">${esc(s)}</span>`).join('')}</div>
      <div class="ti-detail-sub-title">MITRE ATT&amp;CK Techniques (${techniques.length})</div>
      <div class="ti-tag-row">${techniques.map(t => `<span class="badge badge-primary mono" style="cursor:pointer;" data-tid="${t.id}">${t.id}</span>`).join('')}</div>
      <div class="ti-detail-sub-title">Associated Campaigns (${relatedCampaigns.length})</div>
      ${relatedCampaigns.map(c => `<div class="ti-detail-link" data-campaign="${c.id}">${svg('target', 'ti-inline-icon')} ${esc(c.name)} <span style="color:var(--text-tertiary);">— ${esc(c.status)}</span></div>`).join('') || '<div style="color:var(--text-tertiary);font-size:var(--text-sm);">None recorded.</div>'}
      <div class="ti-detail-sub-title">Related IOCs (${relatedIOCs.length})</div>
      ${relatedIOCs.slice(0, 6).map(i => `<div class="ti-detail-link" data-ioc="${i.id}">${svg(TYPE_ICON[i.type], 'ti-inline-icon')} ${esc(_truncate(i.value, 40))}</div>`).join('') || '<div style="color:var(--text-tertiary);font-size:var(--text-sm);">None recorded.</div>'}
    `);
    document.querySelectorAll('#ti-detail-body .ti-detail-link[data-campaign]').forEach(el => el.addEventListener('click', () => _openCampaignDetail(el.dataset.campaign)));
    document.querySelectorAll('#ti-detail-body .ti-detail-link[data-ioc]').forEach(el => el.addEventListener('click', () => _openIOCDetail(el.dataset.ioc)));
    document.querySelectorAll('#ti-detail-body [data-tid]').forEach(el => el.addEventListener('click', () => _openMitreDetail(el.dataset.tid)));
  }

  function _openCampaignDetail(campaignId) {
    const d = DATA();
    const c = d.getCampaign(campaignId);
    if (!c) return;
    const actor = d.getActor(c.actorId);
    const relatedIOCs = d.iocs.filter(i => i.campaignId === c.id);

    _openDetail(c.name, `
      <div class="ti-tag-row" style="margin-bottom:var(--space-3);">
        <span class="badge ${c.status === 'Active' ? 'badge-danger' : c.status === 'Dormant' ? 'badge-warning' : 'badge-neutral'}">${esc(c.status)}</span>
        ${_levelBadge(c.severity.toLowerCase())}
      </div>
      <div class="ti-actor-desc" style="margin-bottom:var(--space-3);">${esc(c.summary)}</div>
      <div class="ti-detail-grid">
        <div class="ti-detail-field"><div class="ti-detail-field-label">Started</div><div class="ti-detail-field-value">${esc(c.startDate)}</div></div>
        <div class="ti-detail-field"><div class="ti-detail-field-label">Ended</div><div class="ti-detail-field-value">${c.endDate ? esc(c.endDate) : 'Ongoing'}</div></div>
        <div class="ti-detail-field"><div class="ti-detail-field-label">IOC Count</div><div class="ti-detail-field-value">${c.iocCount}</div></div>
      </div>
      <div class="ti-detail-sub-title">Target Sectors</div>
      <div class="ti-tag-row">${c.targetSectors.map(s => `<span class="badge badge-neutral">${esc(s)}</span>`).join('')}</div>
      ${actor ? `<div class="ti-detail-sub-title">Attributed Actor</div><div class="ti-detail-link" data-actor="${actor.id}">${svg('users', 'ti-inline-icon')} ${esc(actor.name)}</div>` : ''}
      <div class="ti-detail-sub-title">Associated IOCs (${relatedIOCs.length})</div>
      ${relatedIOCs.map(i => `<div class="ti-detail-link" data-ioc="${i.id}">${svg(TYPE_ICON[i.type], 'ti-inline-icon')} ${esc(_truncate(i.value, 40))} ${_levelBadge(i.threatLevel)}</div>`).join('') || '<div style="color:var(--text-tertiary);font-size:var(--text-sm);">None recorded.</div>'}
    `);
    document.querySelector('#ti-detail-body .ti-detail-link[data-actor]')?.addEventListener('click', () => _openActorDetail(actor.id));
    document.querySelectorAll('#ti-detail-body .ti-detail-link[data-ioc]').forEach(el => el.addEventListener('click', () => _openIOCDetail(el.dataset.ioc)));
  }

  function _openMitreDetail(techniqueId) {
    const d = DATA();
    const t = d.mitreTechniques.find(x => x.id === techniqueId);
    if (!t) return;
    const usedBy = d.actors.filter(a => a.techniques.includes(t.id));
    _openDetail(`${t.id} — ${t.name}`, `
      <div class="ti-tag-row" style="margin-bottom:var(--space-3);"><span class="badge badge-info">${esc(t.tactic)}</span></div>
      <div class="ti-detail-sub-title">Observed In</div>
      ${usedBy.map(a => `<div class="ti-detail-link" data-actor="${a.id}">${svg('users', 'ti-inline-icon')} ${esc(a.name)}</div>`).join('') || '<div style="color:var(--text-tertiary);font-size:var(--text-sm);">Not observed among tracked actors.</div>'}
      <div style="margin-top:var(--space-4);">
        <a class="btn btn-secondary btn-sm" href="https://attack.mitre.org/techniques/${t.id.replace('.', '/')}/" target="_blank" rel="noopener">${svg('external', 'ti-inline-icon')} View on attack.mitre.org</a>
      </div>
    `);
    document.querySelectorAll('#ti-detail-body .ti-detail-link[data-actor]').forEach(el => el.addEventListener('click', () => _openActorDetail(el.dataset.actor)));
  }

  // ══════════════════════════════════════════════════════════════════════
  // WATCHLIST (persisted via StorageManager → 'iocs' store)
  // ══════════════════════════════════════════════════════════════════════
  async function _loadWatchlist() {
    try {
      if (!window.StorageManager) return;
      const saved = window.StorageManager.lsGet('ti_watchlist', []);
      watchlist = new Set(saved || []);
    } catch (e) { /* degrade silently */ }
  }

  function _saveWatchlist() {
    window.StorageManager?.lsSet('ti_watchlist', [...watchlist]);
  }

  function _toggleWatch(iocId) {
    if (watchlist.has(iocId)) { watchlist.delete(iocId); window.NotificationManager?.info('Removed', 'IOC removed from watchlist.'); }
    else { watchlist.add(iocId); window.NotificationManager?.success('Added', 'IOC added to watchlist.'); }
    _saveWatchlist();
    _renderFeed();
  }

  function _copyText(text, msg) {
    navigator.clipboard?.writeText(text).then(() => {
      window.NotificationManager?.info(msg || 'Copied', '');
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy');
      document.body.removeChild(ta);
      window.NotificationManager?.info(msg || 'Copied', '');
    });
  }

  // ══════════════════════════════════════════════════════════════════════
  // GLOBAL SEARCH INTEGRATION
  // ══════════════════════════════════════════════════════════════════════
  function _registerSearch() {
    if (!window.SearchEngine) return;
    const d = DATA();
    const items = [
      { title: 'Threat Intelligence Platform', meta: 'IOC feed, actors, campaigns, MITRE map', route: 'threat-intel', keywords: 'threat intelligence ioc feed actors campaigns mitre lookup' },
    ];
    d.actors.forEach(a => items.push({ title: a.name, meta: `Threat actor — ${a.type}`, route: 'threat-intel', keywords: `actor ${a.name} ${a.aliases.join(' ')} ${a.type}` }));
    d.campaigns.forEach(c => items.push({ title: c.name, meta: `Campaign — ${c.status}`, route: 'threat-intel', keywords: `campaign ${c.name} ${c.status}` }));
    window.SearchEngine.register('Threat Intelligence', items);
  }

  // ── Public API ─────────────────────────────────────────────────────────
  return { register };

})();

window.ThreatIntel = ThreatIntel;

if (window.Router) {
  ThreatIntel.register();
} else {
  console.error('[ThreatIntel] Router not found. Ensure router.js loads before threat-intel.js.');
}
