/**
 * KHAN SECURITY SOLUTIONS ENTERPRISE
 * Enterprise IOC Manager — Module v1.3.0
 *
 * Offline Indicator of Compromise database: animated stat dashboard,
 * pure-SVG charts, a real-time filterable/sortable/paginated IOC table
 * (500 bundled indicators across 17 types), a tabbed detail drawer
 * (Overview, Threat Context, MITRE, Related Incidents, Related Assets,
 * Timeline, Notes), Add/Edit/Delete, and offline JSON/CSV import & export.
 *
 * [EDUCATIONAL SIMULATION — Ships with 500 deterministically generated
 *  synthetic indicators. Threat actor names are real public reporting
 *  names used for realistic demonstration; the specific IOC values here
 *  are entirely synthetic. Everything is stored locally via StorageManager.]
 *
 * Integrates with:
 *   window.Router               — route: 'ioc-manager'
 *   window.SearchEngine         — searchable content
 *   window.NotificationManager  — alerts and feedback
 *   window.StorageManager       — IOC persistence (localStorage)
 *   window.SampleIOCData        — bundled sample dataset
 *   window.SampleIncidentData   — cross-referenced for Related Incidents tab
 *   window.SampleAssetData      — cross-referenced for Related Assets tab
 */

const IOCManager = (() => {

  // ── State ──────────────────────────────────────────────────────────────
  let mounted     = false;
  let customIOCs    = [];
  let deletedIds       = new Set();
  let overrides           = {};

  let filters = { q: '', type: 'all', threatLevel: 'all', confidence: 'all', source: 'all', category: 'all', actor: 'all', status: 'all' };
  let sortKey = 'dateAdded', sortDir = 'desc';
  let currentPage = 1;
  const PAGE_SIZE = 20;

  // ── Icons ──────────────────────────────────────────────────────────────
  const I = {
    shield:   `<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>`,
    globe:    `<path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"/>`,
    hash:     `<path stroke-linecap="round" stroke-linejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5"/>`,
    mail:     `<path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>`,
    key:      `<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"/>`,
    file:     `<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-1.519-2.865a4.5 4.5 0 11-1.594-1.594m3.113 4.459a4.5 4.5 0 003.113-4.459M6 20.25h12A2.25 2.25 0 0020.25 18V9.75l-6-6H6a2.25 2.25 0 00-2.25 2.25v12A2.25 2.25 0 006 20.25z"/>`,
    code:     `<path stroke-linecap="round" stroke-linejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z"/>`,
    target:   `<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m0 13.5V21m9-9h-2.25m-13.5 0H3m14.485-6.364l-1.591 1.591M6.227 17.773l-1.591 1.591m0-12.728l1.591 1.591m11.546 11.546l1.591 1.591M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"/>`,
    warn:     `<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>`,
    star:     `<path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>`,
    plus:     `<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>`,
    upload:   `<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>`,
    down:     `<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>`,
    report:   `<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"/>`,
    search:   `<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z"/>`,
    close:    `<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>`,
    edit:     `<path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"/>`,
    trash:    `<path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>`,
    map:      `<path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"/>`,
    server:   `<path stroke-linecap="round" stroke-linejoin="round" d="M21.75 17.25v-.228a4.5 4.5 0 00-.12-1.03l-2.268-9.64a3.375 3.375 0 00-3.285-2.602H7.923a3.375 3.375 0 00-3.285 2.602l-2.268 9.64a4.5 4.5 0 00-.12 1.03v.228m19.5 0a3 3 0 01-3 3H5.25a3 3 0 01-3-3m19.5 0a3 3 0 00-3-3H5.25a3 3 0 00-3 3m16.5 0h.008v.008h-.008v-.008zm-3 0h.008v.008h-.008v-.008z"/>`,
    folder:   `<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 015.25 3.75h4.5a2.25 2.25 0 011.591.659l1.5 1.5a2.25 2.25 0 001.591.659H18.75A2.25 2.25 0 0121 8.25v1.526"/>`,
    chevronUp:  `<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5"/>`,
    chevronDown:`<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>`,
  };
  function svg(name, cls = '') { return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">${I[name] || I.shield}</svg>`; }
  function esc(s) { const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function uid(prefix) { return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`; }

  const SD = () => window.SampleIOCData || { iocs: [], TYPES: [], THREAT_ACTORS: [], THREAT_LEVELS: [], CONFIDENCE_LEVELS: [], SOURCES: [], CATEGORIES: [], STATUSES: [], MITRE_POOL: [], getIOC: () => null };
  const ID_INC = () => window.SampleIncidentData || { getIncident: () => null };
  const AD = () => window.SampleAssetData || { assets: [] };

  const HASH_TYPES = ['SHA256', 'SHA1', 'MD5'];
  const TYPE_ICON = {
    IPv4: 'globe', IPv6: 'globe', Domain: 'globe', Subdomain: 'globe', URL: 'globe',
    'Email Address': 'mail', SHA256: 'hash', SHA1: 'hash', MD5: 'hash', Filename: 'file',
    'Registry Key': 'key', 'File Path': 'folder', Mutex: 'code', 'Process Name': 'server',
    'YARA Rule': 'code', 'Sigma Rule': 'code', Certificate: 'shield',
  };

  function allIOCs() {
    const base = SD().iocs.filter(i => !deletedIds.has(i.id)).map(i => overrides[i.id] ? { ...i, ...overrides[i.id] } : i);
    return [...base, ...customIOCs];
  }
  function findIOC(id) { return allIOCs().find(i => i.id === id) || null; }

  const LEVEL_CLS = { critical: 'badge-danger', high: 'badge-high', medium: 'badge-medium', low: 'badge-low', informational: 'badge-neutral' };
  const CONF_CLS = { High: 'badge-success', Medium: 'badge-warning', Low: 'badge-neutral', Unknown: 'badge-neutral' };
  const STATUS_CLS = { Active: 'badge-danger', 'Under Review': 'badge-warning', Resolved: 'badge-success', Archived: 'badge-neutral' };

  // ══════════════════════════════════════════════════════════════════════
  // ROUTE REGISTRATION
  // ══════════════════════════════════════════════════════════════════════
  function register() { window.Router.register('ioc-manager', { title: 'IOC Manager', init, render }); }
  function init() { _loadPersisted(); _registerSearch(); }
  function render() {
    const el = document.getElementById('page-ioc-manager');
    if (!el) return;
    if (!mounted) { el.innerHTML = _buildShell(); mounted = true; _wireAll(); _animateStats(); }
    else _renderAll();
  }

  // ══════════════════════════════════════════════════════════════════════
  // SHELL
  // ══════════════════════════════════════════════════════════════════════
  function _buildShell() {
    return `
    <div class="ioc-shell">
      <div class="ioc-header">
        <div>
          <div class="ioc-header-title">Enterprise IOC Manager</div>
          <div class="ioc-header-sub">Manage Indicators of Compromise collected from investigations and threat intelligence.</div>
        </div>
        <div class="ioc-header-actions">
          <button class="btn btn-secondary btn-sm" id="ioc-btn-search">${svg('search')} IOC Search</button>
          <button class="btn btn-secondary btn-sm" id="ioc-btn-import">${svg('upload')} Import IOCs</button>
          <button class="btn btn-secondary btn-sm" id="ioc-btn-export">${svg('down')} Export IOCs</button>
          <button class="btn btn-secondary btn-sm" id="ioc-btn-report">${svg('report')} Generate Report</button>
          <button class="btn btn-primary btn-sm" id="ioc-btn-add">${svg('plus')} Add IOC</button>
        </div>
      </div>

      <div class="ioc-body">
        <div class="grid grid-stats ioc-stats" id="ioc-stats"></div>

        <div class="ir-charts-grid">
          <div class="card"><div class="card-header"><div class="card-title">IOCs by Type</div></div><div class="card-body"><svg id="ioc-chart-type" viewBox="0 0 300 180" class="ai-chart-svg"></svg></div></div>
          <div class="card"><div class="card-header"><div class="card-title">Threat Levels</div></div><div class="card-body"><svg id="ioc-chart-level" viewBox="0 0 300 180" class="ai-chart-svg"></svg></div></div>
          <div class="card"><div class="card-header"><div class="card-title">Threat Actors</div></div><div class="card-body"><svg id="ioc-chart-actors" viewBox="0 0 300 180" class="ai-chart-svg"></svg></div></div>
          <div class="card"><div class="card-header"><div class="card-title">Campaign Distribution</div></div><div class="card-body"><svg id="ioc-chart-campaigns" viewBox="0 0 300 180" class="ai-chart-svg"></svg></div></div>
          <div class="card"><div class="card-header"><div class="card-title">MITRE Distribution</div></div><div class="card-body"><svg id="ioc-chart-mitre" viewBox="0 0 300 180" class="ai-chart-svg"></svg></div></div>
          <div class="card"><div class="card-header"><div class="card-title">Monthly Trend</div></div><div class="card-body"><svg id="ioc-chart-trend" viewBox="0 0 300 180" class="ai-chart-svg"></svg></div></div>
        </div>

        <div class="card ai-filter-card">
          <div class="card-body">
            <div class="ai-filter-bar">
              <div class="ti-search-box" style="flex:2;min-width:220px;">
                ${svg('search', 'ioc-inline-icon')}
                <input type="text" id="ioc-f-search" placeholder="Search value, actor, campaign, MITRE ID…" />
              </div>
              <select class="input ai-filter-select" id="ioc-f-type"><option value="all">All Types</option></select>
              <select class="input ai-filter-select" id="ioc-f-level"><option value="all">All Threat Levels</option></select>
              <select class="input ai-filter-select" id="ioc-f-confidence"><option value="all">All Confidence</option></select>
              <select class="input ai-filter-select" id="ioc-f-source"><option value="all">All Sources</option></select>
              <select class="input ai-filter-select" id="ioc-f-category"><option value="all">All Categories</option></select>
              <select class="input ai-filter-select" id="ioc-f-actor"><option value="all">All Threat Actors</option></select>
              <select class="input ai-filter-select" id="ioc-f-status"><option value="all">All Statuses</option></select>
              <button class="btn btn-secondary btn-sm" id="ioc-f-clear">${svg('close')} Clear</button>
            </div>
          </div>
        </div>

        <div class="ai-result-count" id="ioc-result-count"></div>
        <div class="card ai-table-card">
          <div class="card-body" style="padding:0;overflow-x:auto;">
            <table class="data-table ai-table">
              <thead>
                <tr>
                  <th data-sort="id">IOC ID</th><th data-sort="type">Type</th><th data-sort="value">Value</th>
                  <th data-sort="threatLevel">Threat Level</th><th data-sort="confidence">Confidence</th>
                  <th data-sort="source">Source</th><th data-sort="category">Category</th>
                  <th data-sort="threatActor">Threat Actor</th><th data-sort="campaign">Campaign</th>
                  <th>MITRE</th><th data-sort="dateAdded">Date Added</th><th data-sort="status">Status</th><th></th>
                </tr>
              </thead>
              <tbody id="ioc-table-body"></tbody>
            </table>
          </div>
          <div class="ai-pagination" id="ioc-pagination"></div>
        </div>
      </div>
    </div>

    ${_buildDrawer()}
    ${_buildAddEditModal()}
    ${_buildImportModal()}
    ${_buildConfirmModal()}
    ${_buildSearchModal()}
    `;
  }

  function _wireAll() {
    document.getElementById('ioc-btn-import')?.addEventListener('click', _openImportModal);
    document.getElementById('ioc-btn-export')?.addEventListener('click', _exportCurrent);
    document.getElementById('ioc-btn-report')?.addEventListener('click', _openReportChoice);
    document.getElementById('ioc-btn-add')?.addEventListener('click', () => _openAddEditModal(null));
    document.getElementById('ioc-btn-search')?.addEventListener('click', _openSearchModal);

    document.getElementById('ioc-f-search')?.addEventListener('input', e => { filters.q = e.target.value; currentPage = 1; _renderAll(); });
    ['type', 'level', 'confidence', 'source', 'category', 'actor', 'status'].forEach(key => {
      const filterKey = key === 'level' ? 'threatLevel' : key;
      document.getElementById(`ioc-f-${key}`)?.addEventListener('change', e => { filters[filterKey] = e.target.value; currentPage = 1; _renderAll(); });
    });
    document.getElementById('ioc-f-clear')?.addEventListener('click', () => {
      filters = { q: '', type: 'all', threatLevel: 'all', confidence: 'all', source: 'all', category: 'all', actor: 'all', status: 'all' };
      document.getElementById('ioc-f-search').value = '';
      document.querySelectorAll('#page-ioc-manager .ai-filter-select').forEach(sel => sel.value = 'all');
      currentPage = 1; _renderAll();
    });
    document.querySelectorAll('#page-ioc-manager .ai-table thead th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const key = th.dataset.sort;
        if (sortKey === key) sortDir = sortDir === 'asc' ? 'desc' : 'asc'; else { sortKey = key; sortDir = 'asc'; }
        _renderAll();
      });
    });

    _wireDrawer(); _wireAddEditModal(); _wireImportModal(); _wireConfirmModal(); _wireSearchModal();
    _populateFilterOptions(); _renderAll();
  }

  // ══════════════════════════════════════════════════════════════════════
  // STATS (animated)
  // ══════════════════════════════════════════════════════════════════════
  function _computeStats() {
    const list = allIOCs();
    const byType = t => list.filter(i => i.type === t).length;
    return {
      total: list.length,
      ips: byType('IPv4') + byType('IPv6'),
      domains: byType('Domain') + byType('Subdomain'),
      urls: byType('URL'),
      hashes: HASH_TYPES.reduce((s, t) => s + byType(t), 0),
      emails: byType('Email Address'),
      registryKeys: byType('Registry Key'),
      filePaths: byType('File Path'),
      yaraRules: byType('YARA Rule'),
      sigmaRules: byType('Sigma Rule'),
      activeThreats: list.filter(i => i.status === 'Active').length,
      highConfidence: list.filter(i => i.confidence === 'High').length,
    };
  }

  function _buildStatsHTML(s) {
    const cards = [
      ['Total IOCs', s.total, 'shield', 'var(--color-primary)'],
      ['IPs', s.ips, 'globe', 'var(--color-info)'],
      ['Domains', s.domains, 'globe', 'var(--color-info)'],
      ['URLs', s.urls, 'globe', '#f97316'],
      ['File Hashes', s.hashes, 'hash', '#a78bfa'],
      ['Email Addresses', s.emails, 'mail', 'var(--color-warning)'],
      ['Registry Keys', s.registryKeys, 'key', 'var(--color-danger)'],
      ['File Paths', s.filePaths, 'folder', 'var(--text-tertiary)'],
      ['YARA Rules', s.yaraRules, 'code', 'var(--color-success)'],
      ['Sigma Rules', s.sigmaRules, 'code', 'var(--color-success)'],
      ['Active Threats', s.activeThreats, 'warn', 'var(--color-danger)'],
      ['High Confidence', s.highConfidence, 'star', 'var(--color-primary)'],
    ];
    return cards.map(([label, value, icon, color]) => `
      <div class="stat-card">
        <div class="stat-card-icon" style="background:${color}22;color:${color};">${svg(icon)}</div>
        <div class="stat-card-info">
          <div class="stat-card-value ai-count" data-target="${value}">0</div>
          <div class="stat-card-label">${esc(label)}</div>
        </div>
      </div>`).join('');
  }

  function _animateStats() {
    const s = _computeStats();
    document.getElementById('ioc-stats').innerHTML = _buildStatsHTML(s);
    document.querySelectorAll('#ioc-stats .ai-count').forEach(el => {
      const target = parseInt(el.dataset.target, 10) || 0;
      let current = 0;
      const step = Math.max(1, Math.ceil(target / 24));
      const timer = setInterval(() => { current = Math.min(target, current + step); el.textContent = current; if (current >= target) clearInterval(timer); }, 20);
    });
    _renderCharts();
  }
  function _refreshStatsStatic() {
    const s = _computeStats();
    const values = [s.total, s.ips, s.domains, s.urls, s.hashes, s.emails, s.registryKeys, s.filePaths, s.yaraRules, s.sigmaRules, s.activeThreats, s.highConfidence];
    document.querySelectorAll('#ioc-stats .ai-count').forEach((el, idx) => { el.textContent = values[idx]; });
    _renderCharts();
  }

  // ══════════════════════════════════════════════════════════════════════
  // SVG CHARTS
  // ══════════════════════════════════════════════════════════════════════
  const CHART_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#a78bfa', '#f97316', '#06b6d4', '#84cc16', '#ec4899', '#64748b'];
  function _groupCount(list, keyFn) { const map = {}; list.forEach(x => { const k = keyFn(x) || 'Unknown'; map[k] = (map[k] || 0) + 1; }); return Object.entries(map).sort((a, b) => b[1] - a[1]); }
  function _truncate(s, n) { return s.length > n ? s.slice(0, n - 1) + '…' : s; }

  function _renderPieChart(svgId, data) {
    const el = document.getElementById(svgId); if (!el) return;
    const total = data.reduce((s, [, v]) => s + v, 0) || 1;
    const cx = 90, cy = 90, r = 70; let angle = -Math.PI / 2; let paths = '';
    data.slice(0, 6).forEach(([label, val], idx) => {
      const frac = val / total; const nextAngle = angle + frac * 2 * Math.PI;
      const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
      const x2 = cx + r * Math.cos(nextAngle), y2 = cy + r * Math.sin(nextAngle);
      const largeArc = frac > 0.5 ? 1 : 0;
      paths += `<path d="M${cx},${cy} L${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${largeArc} 1 ${x2.toFixed(2)},${y2.toFixed(2)} Z" fill="${CHART_COLORS[idx % CHART_COLORS.length]}" opacity="0.9"><title>${label}: ${val}</title></path>`;
      angle = nextAngle;
    });
    const legend = data.slice(0, 6).map(([label, val], idx) => `<g transform="translate(190, ${18 + idx * 24})"><rect width="10" height="10" rx="2" fill="${CHART_COLORS[idx % CHART_COLORS.length]}"/><text x="16" y="9" font-size="10" fill="var(--text-secondary)">${esc(_truncate(String(label), 16))} (${val})</text></g>`).join('');
    el.innerHTML = `<g>${paths}</g>${legend}`;
  }
  function _renderBarChart(svgId, data) {
    const el = document.getElementById(svgId); if (!el) return;
    const items = data.slice(0, 6); const max = Math.max(1, ...items.map(([, v]) => v));
    const barH = 22, gap = 8, chartW = 300, labelW = 100;
    el.innerHTML = items.map(([label, val], idx) => {
      const y = idx * (barH + gap) + 6; const w = ((chartW - labelW - 40) * val) / max;
      return `<text x="0" y="${y + barH / 2 + 4}" font-size="10" fill="var(--text-secondary)">${esc(_truncate(String(label), 15))}</text>
        <rect x="${labelW}" y="${y}" width="${Math.max(2, w)}" height="${barH}" rx="4" fill="${CHART_COLORS[idx % CHART_COLORS.length]}" opacity="0.9"><title>${label}: ${val}</title></rect>
        <text x="${labelW + w + 6}" y="${y + barH / 2 + 4}" font-size="10" fill="var(--text-tertiary)">${val}</text>`;
    }).join('');
  }
  function _renderLineChart(svgId, points) {
    const el = document.getElementById(svgId); if (!el) return;
    const max = Math.max(1, ...points.map(p => p.value));
    const w = 280, h = 140, padL = 10, padB = 20;
    const stepX = points.length > 1 ? (w - padL) / (points.length - 1) : 0;
    const coords = points.map((p, i) => [padL + i * stepX, h - padB - (p.value / max) * (h - padB - 10)]);
    const path = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c[0].toFixed(1)},${c[1].toFixed(1)}`).join(' ');
    const dots = coords.map((c, i) => `<circle cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="3" fill="#2563eb"><title>${points[i].label}: ${points[i].value}</title></circle>`).join('');
    const labels = coords.map((c, i) => i % 2 === 0 ? `<text x="${c[0].toFixed(1)}" y="${h - 4}" font-size="9" fill="var(--text-tertiary)" text-anchor="middle">${esc(points[i].label)}</text>` : '').join('');
    el.innerHTML = `<path d="${path}" fill="none" stroke="#2563eb" stroke-width="2"/>${dots}${labels}`;
  }

  function _renderCharts() {
    const list = allIOCs();
    _renderBarChart('ioc-chart-type', _groupCount(list, i => i.type));
    _renderPieChart('ioc-chart-level', _groupCount(list, i => i.threatLevel));
    _renderBarChart('ioc-chart-actors', _groupCount(list, i => i.threatActor));
    _renderBarChart('ioc-chart-campaigns', _groupCount(list, i => i.campaign));
    _renderBarChart('ioc-chart-mitre', _groupCount(list, i => i.mitre?.id));
    const months = [];
    for (let m = 5; m >= 0; m--) { const d = new Date(); d.setMonth(d.getMonth() - m); months.push(d.toISOString().slice(0, 7)); }
    const trendPoints = months.map(m => ({ label: m.slice(5), value: list.filter(i => (i.dateAdded || '').slice(0, 7) === m).length }));
    _renderLineChart('ioc-chart-trend', trendPoints);
  }

  // ══════════════════════════════════════════════════════════════════════
  // FILTER OPTIONS / TABLE
  // ══════════════════════════════════════════════════════════════════════
  function _populateFilterOptions() {
    const d = SD(); const list = allIOCs();
    const opts = (id, values) => {
      const sel = document.getElementById(id); if (!sel) return;
      const current = sel.value;
      sel.innerHTML = sel.options[0].outerHTML + [...new Set(values)].filter(Boolean).sort().map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
      sel.value = current || 'all';
    };
    opts('ioc-f-type', d.TYPES.length ? d.TYPES : list.map(i => i.type));
    opts('ioc-f-level', d.THREAT_LEVELS.length ? d.THREAT_LEVELS : list.map(i => i.threatLevel));
    opts('ioc-f-confidence', d.CONFIDENCE_LEVELS.length ? d.CONFIDENCE_LEVELS : list.map(i => i.confidence));
    opts('ioc-f-source', d.SOURCES.length ? d.SOURCES : list.map(i => i.source));
    opts('ioc-f-category', d.CATEGORIES.length ? d.CATEGORIES : list.map(i => i.category));
    opts('ioc-f-actor', d.THREAT_ACTORS.length ? d.THREAT_ACTORS : list.map(i => i.threatActor));
    opts('ioc-f-status', d.STATUSES.length ? d.STATUSES : list.map(i => i.status));
  }

  function _matchesFilters(i, q) {
    if (filters.type !== 'all' && i.type !== filters.type) return false;
    if (filters.threatLevel !== 'all' && i.threatLevel !== filters.threatLevel) return false;
    if (filters.confidence !== 'all' && i.confidence !== filters.confidence) return false;
    if (filters.source !== 'all' && i.source !== filters.source) return false;
    if (filters.category !== 'all' && i.category !== filters.category) return false;
    if (filters.actor !== 'all' && i.threatActor !== filters.actor) return false;
    if (filters.status !== 'all' && i.status !== filters.status) return false;
    if (q) {
      const hay = [i.id, i.value, i.threatActor, i.campaign, i.mitre?.id, i.type, i.category].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }

  function _filteredSorted() {
    const q = filters.q.trim().toLowerCase();
    let rows = allIOCs().filter(i => _matchesFilters(i, q));
    rows.sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (sortKey === 'dateAdded') { av = new Date(av).getTime(); bv = new Date(bv).getTime(); }
      else { av = (av || '').toString().toLowerCase(); bv = (bv || '').toString().toLowerCase(); }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return rows;
  }

  function _renderAll() { _refreshStatsStatic(); _populateFilterOptions(); _renderTable(); }

  function _renderTable() {
    const rows = _filteredSorted();
    const total = rows.length;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    currentPage = Math.min(currentPage, pages);
    const start = (currentPage - 1) * PAGE_SIZE;
    const slice = rows.slice(start, start + PAGE_SIZE);

    document.getElementById('ioc-result-count').textContent = `${total} of ${allIOCs().length} indicators`;
    document.querySelectorAll('#page-ioc-manager .ai-table thead th[data-sort]').forEach(th => {
      th.classList.toggle('sorted', th.dataset.sort === sortKey);
      th.dataset.dir = th.dataset.sort === sortKey ? sortDir : '';
    });

    const tbody = document.getElementById('ioc-table-body');
    if (!slice.length) {
      tbody.innerHTML = `<tr><td colspan="13"><div class="empty-state"><div class="empty-state-title">No IOCs match</div><div class="empty-state-desc">Try clearing filters or your search term.</div></div></td></tr>`;
    } else {
      tbody.innerHTML = slice.map(i => `
        <tr class="ai-row" data-id="${i.id}">
          <td class="mono">${esc(i.id)}</td>
          <td>${svg(TYPE_ICON[i.type] || 'shield', 'ioc-inline-icon')} ${esc(i.type)}</td>
          <td class="mono" style="max-width:220px;overflow:hidden;text-overflow:ellipsis;">${esc(_truncate(i.value, 40))}</td>
          <td><span class="badge ${LEVEL_CLS[i.threatLevel] || 'badge-neutral'}">${esc(i.threatLevel)}</span></td>
          <td><span class="badge ${CONF_CLS[i.confidence] || 'badge-neutral'}">${esc(i.confidence)}</span></td>
          <td>${esc(i.source)}</td><td>${esc(i.category)}</td>
          <td>${esc(i.threatActor)}</td><td>${esc(i.campaign)}</td>
          <td><span class="badge badge-info mono">${esc(i.mitre?.id || '—')}</span></td>
          <td class="mono" style="font-size:11px;">${esc(i.dateAdded)}</td>
          <td><span class="badge ${STATUS_CLS[i.status] || 'badge-neutral'}">${esc(i.status)}</span></td>
          <td class="ai-actions-cell">
            <button class="btn-icon ioc-edit-btn" data-id="${i.id}" title="Edit">${svg('edit')}</button>
            <button class="btn-icon ioc-del-btn" data-id="${i.id}" title="Delete">${svg('trash')}</button>
          </td>
        </tr>`).join('');
    }
    tbody.querySelectorAll('.ai-row').forEach(tr => tr.addEventListener('click', e => {
      if (e.target.closest('.ioc-edit-btn') || e.target.closest('.ioc-del-btn')) return;
      _openDrawer(tr.dataset.id);
    }));
    tbody.querySelectorAll('.ioc-edit-btn').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); _openAddEditModal(btn.dataset.id); }));
    tbody.querySelectorAll('.ioc-del-btn').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); _confirmDelete(btn.dataset.id); }));

    _renderPagination(pages);
  }

  function _renderPagination(pages) {
    const box = document.getElementById('ioc-pagination'); if (!box) return;
    if (pages <= 1) { box.innerHTML = ''; return; }
    let html = `<button class="btn-icon" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>${svg('chevronUp', 'ai-page-arrow-left')}</button>`;
    html += `<span class="ai-page-label">Page ${currentPage} of ${pages}</span>`;
    html += `<button class="btn-icon" data-page="${currentPage + 1}" ${currentPage === pages ? 'disabled' : ''}>${svg('chevronDown', 'ai-page-arrow-right')}</button>`;
    box.innerHTML = html;
    box.querySelectorAll('button[data-page]').forEach(btn => btn.addEventListener('click', () => {
      const p = parseInt(btn.dataset.page, 10);
      if (p >= 1 && p <= pages) { currentPage = p; _renderTable(); }
    }));
  }

  // ══════════════════════════════════════════════════════════════════════
  // DETAIL DRAWER — 7 tabs
  // ══════════════════════════════════════════════════════════════════════
  function _buildDrawer() {
    return `
    <div class="ai-drawer-overlay" id="ioc-drawer-overlay">
      <div class="ai-drawer" id="ioc-drawer" style="max-width:660px;">
        <div class="ai-drawer-header">
          <div><div class="ai-drawer-title" id="ioc-drawer-title">IOC</div><div class="ai-drawer-sub" id="ioc-drawer-sub"></div></div>
          <div class="ai-drawer-close" id="ioc-drawer-close">${svg('close')}</div>
        </div>
        <div class="ai-drawer-tabs">
          <div class="ai-drawer-tab active" data-dtab="overview">Overview</div>
          <div class="ai-drawer-tab" data-dtab="context">Threat Context</div>
          <div class="ai-drawer-tab" data-dtab="mitre">MITRE</div>
          <div class="ai-drawer-tab" data-dtab="incidents">Related Incidents</div>
          <div class="ai-drawer-tab" data-dtab="assets">Related Assets</div>
          <div class="ai-drawer-tab" data-dtab="timeline">Timeline</div>
          <div class="ai-drawer-tab" data-dtab="notes">Notes</div>
        </div>
        <div class="ai-drawer-body" id="ioc-drawer-body"></div>
      </div>
    </div>`;
  }

  function _wireDrawer() {
    document.getElementById('ioc-drawer-close')?.addEventListener('click', _closeDrawer);
    document.getElementById('ioc-drawer-overlay')?.addEventListener('click', e => { if (e.target.id === 'ioc-drawer-overlay') _closeDrawer(); });
    document.querySelectorAll('#ioc-drawer .ai-drawer-tab').forEach(tab => tab.addEventListener('click', () => {
      document.querySelectorAll('#ioc-drawer .ai-drawer-tab').forEach(t => t.classList.toggle('active', t === tab));
      _renderDrawerTab(tab.dataset.dtab);
    }));
  }

  let drawerIocId = null;
  function _openDrawer(iocId) {
    drawerIocId = iocId;
    const i = findIOC(iocId); if (!i) return;
    document.getElementById('ioc-drawer-title').textContent = i.id;
    document.getElementById('ioc-drawer-sub').textContent = `${i.type} · ${i.threatActor} · ${i.status}`;
    document.querySelectorAll('#ioc-drawer .ai-drawer-tab').forEach(t => t.classList.toggle('active', t.dataset.dtab === 'overview'));
    _renderDrawerTab('overview');
    document.getElementById('ioc-drawer-overlay').classList.add('open');
  }
  function _closeDrawer() { document.getElementById('ioc-drawer-overlay').classList.remove('open'); drawerIocId = null; }

  function _renderDrawerTab(tab) {
    const i = findIOC(drawerIocId);
    const body = document.getElementById('ioc-drawer-body');
    if (!i || !body) return;
    const map = { overview: _drOverview, context: _drContext, mitre: _drMitre, incidents: _drIncidents, assets: _drAssets, timeline: _drTimeline, notes: _drNotes };
    body.innerHTML = (map[tab] || _drOverview)(i);
  }

  function _field(label, value) {
    return `<div class="ai-detail-field"><div class="ai-detail-field-label">${esc(label)}</div><div class="ai-detail-field-value">${value == null || value === '' ? '<span style="color:var(--text-tertiary);">—</span>' : esc(String(value))}</div></div>`;
  }

  function _drOverview(i) {
    return `
      <div class="ti-tag-row" style="margin-bottom:var(--space-4);">
        <span class="badge ${LEVEL_CLS[i.threatLevel] || 'badge-neutral'}">${esc(i.threatLevel)}</span>
        <span class="badge ${CONF_CLS[i.confidence] || 'badge-neutral'}">${esc(i.confidence)} confidence</span>
        <span class="badge ${STATUS_CLS[i.status] || 'badge-neutral'}">${esc(i.status)}</span>
      </div>
      <div class="ti-detail-value-box mono" style="word-break:break-all;margin-bottom:var(--space-4);">${esc(i.value)}</div>
      <div class="ai-detail-grid">
        ${_field('Type', i.type)} ${_field('Source', i.source)}
        ${_field('Detection Count', i.detectionCount)} ${_field('Last Seen', i.lastSeen)}
      </div>
      <div class="ai-detail-sub-title">Description</div>
      <p style="font-size:var(--text-sm);color:var(--text-secondary);line-height:1.6;">${esc(i.description)}</p>
      <div class="ai-detail-sub-title">Tags</div>
      <div class="ti-tag-row">${(i.tags || []).map(t => `<span class="badge badge-neutral">${esc(t)}</span>`).join('')}</div>`;
  }

  function _drContext(i) {
    const c = i.threatContext || {};
    return `<div class="ai-detail-grid">
      ${_field('Threat Actor', c.threatActor)} ${_field('Campaign', c.campaign)}
      ${_field('Malware Family', c.malwareFamily)}
    </div>
    <div class="ai-detail-sub-title">Associated CVEs</div>
    <div class="ti-tag-row">${(c.associatedCves || []).map(cve => `<span class="badge badge-danger mono">${esc(cve)}</span>`).join('') || '<span style="color:var(--text-tertiary);font-size:var(--text-sm);">None recorded.</span>'}</div>
    <div class="ai-detail-sub-title">Known TTPs</div>
    <div class="ti-tag-row">${(c.knownTtps || []).map(t => `<span class="badge badge-neutral">${esc(t)}</span>`).join('')}</div>
    <div class="ai-detail-sub-title">Affected Industries</div>
    <div class="ti-tag-row">${(c.affectedIndustries || []).map(t => `<span class="badge badge-neutral">${esc(t)}</span>`).join('')}</div>
    <div class="ai-detail-sub-title">Countries</div>
    <div class="ti-tag-row">${(c.countries || []).map(t => `<span class="badge badge-neutral">${esc(t)}</span>`).join('')}</div>`;
  }

  function _drMitre(i) {
    const m = i.mitre; if (!m) return '<div style="color:var(--text-tertiary);font-size:var(--text-sm);">No MITRE mapping recorded.</div>';
    return `<div class="ai-detail-grid">
      ${_field('Tactic', m.tactic)} ${_field('Technique', m.technique)} ${_field('Technique ID', m.id)}
    </div>
    <div class="ai-detail-sub-title">Detection</div>
    <p style="font-size:var(--text-sm);color:var(--text-secondary);line-height:1.6;">Correlate this indicator with EDR/SIEM telemetry matching ${esc(m.technique)} behavior for higher-confidence detection.</p>
    <div class="ai-detail-sub-title">Mitigation</div>
    <p style="font-size:var(--text-sm);color:var(--text-secondary);line-height:1.6;">Apply relevant hardening and monitoring controls for the ${esc(m.tactic)} tactic; block or alert on this indicator at the perimeter.</p>
    <div class="ai-detail-sub-title">References</div>
    <a class="btn btn-secondary btn-sm" href="https://attack.mitre.org/techniques/${m.id.replace('.', '/')}/" target="_blank" rel="noopener">${svg('map', 'ioc-inline-icon')} View on attack.mitre.org</a>`;
  }

  function _drIncidents(i) {
    const inc = i.relatedIncidentHint ? ID_INC().getIncident(i.relatedIncidentHint) : null;
    if (!inc) return `<div style="color:var(--text-tertiary);font-size:var(--text-sm);">No related incidents found in the current Incident Response module.</div>`;
    return `<div class="ti-detail-link" data-goto-incident="${inc.id}">
      ${svg('warn', 'ioc-inline-icon')} <strong>${esc(inc.id)}</strong> — ${esc(inc.title)}
      <span style="margin-left:auto;"><span class="badge ${LEVEL_CLS[inc.severity] || 'badge-neutral'}">${esc(inc.severity)}</span> <span class="badge badge-neutral">${esc(inc.status)}</span></span>
    </div>
    <div style="color:var(--text-tertiary);font-size:var(--text-xs);margin-top:var(--space-2);">Open the Incident Response Center and search "${esc(inc.id)}" for full details.</div>`;
  }

  function _drAssets(i) {
    const asset = i.relatedAssetHint ? AD().assets.find(a => a.hostname === i.relatedAssetHint) : null;
    if (!asset) return `<div style="color:var(--text-tertiary);font-size:var(--text-sm);">No related assets found in the current Asset Inventory.</div>`;
    return `<div class="ai-detail-grid">
      ${_field('Hostname', asset.hostname)} ${_field('Assigned User', asset.assignedUser)}
      ${_field('Department', asset.department)} ${_field('Criticality', asset.criticality)}
    </div>
    <div class="ti-tag-row"><span class="badge ${LEVEL_CLS[asset.risk] || 'badge-neutral'}">${esc(asset.risk)} risk</span><span class="badge badge-neutral">${esc(asset.status)}</span></div>
    <div style="color:var(--text-tertiary);font-size:var(--text-xs);margin-top:var(--space-2);">Open the Asset Inventory and search "${esc(asset.hostname)}" for full details.</div>`;
  }

  function _drTimeline(i) {
    return (i.timeline || []).map(t => `
      <div class="ai-timeline-row"><div class="ai-timeline-dot"></div>
        <div><div class="ai-timeline-head"><strong>${esc(t.event)}</strong> <span style="color:var(--text-tertiary);">— ${esc(t.date)}</span></div>
        <div class="ai-timeline-detail">${esc(t.detail)}</div></div>
      </div>`).join('') || '<div style="color:var(--text-tertiary);font-size:var(--text-sm);">No timeline recorded.</div>';
  }

  function _drNotes(i) {
    const notes = (i.notes || []).slice().reverse();
    return `
      ${notes.map(n => `<div class="df-note"><div class="df-note-meta">${esc(n.author)} &middot; ${esc(n.date)}</div><div class="df-note-text">${esc(n.text)}</div></div>`).join('') || '<div style="color:var(--text-tertiary);font-size:var(--text-sm);margin-bottom:var(--space-3);">No notes yet.</div>'}
      <textarea class="input" id="ioc-note-text" rows="2" placeholder="Add a note about this indicator…" style="margin-top:var(--space-2);"></textarea>
      <button class="btn btn-secondary btn-sm" id="ioc-note-add" style="margin-top:var(--space-2);">${svg('plus')} Add Note</button>`;
  }

  document.addEventListener('click', e => {
    if (e.target && e.target.id === 'ioc-note-add') {
      const text = document.getElementById('ioc-note-text')?.value.trim();
      if (!text || !drawerIocId) return;
      const i = findIOC(drawerIocId); if (!i) return;
      const note = { author: 'Current User', date: new Date().toISOString().slice(0, 10), text };
      i.notes = [...(i.notes || []), note];
      _persistMutation(i);
      window.NotificationManager?.success('Note Added', '');
      _renderDrawerTab('notes');
    }
  });

  function _persistMutation(i) {
    const idx = customIOCs.findIndex(c => c.id === i.id);
    if (idx >= 0) customIOCs[idx] = i;
    else overrides[i.id] = { ...(overrides[i.id] || {}), notes: i.notes, status: i.status };
    _savePersisted();
  }

  // ══════════════════════════════════════════════════════════════════════
  // ADD / EDIT MODAL
  // ══════════════════════════════════════════════════════════════════════
  function _buildAddEditModal() {
    const d = SD();
    const typeOpts = (d.TYPES.length ? d.TYPES : ['IPv4']).map(t => `<option>${esc(t)}</option>`).join('');
    const actorOpts = (d.THREAT_ACTORS.length ? d.THREAT_ACTORS : ['Unknown']).map(a => `<option>${esc(a)}</option>`).join('');
    const sourceOpts = (d.SOURCES.length ? d.SOURCES : ['Manual Entry']).map(s => `<option>${esc(s)}</option>`).join('');
    const statusOpts = (d.STATUSES.length ? d.STATUSES : ['Active']).map(s => `<option>${esc(s)}</option>`).join('');
    return `
    <div class="ai-modal-overlay" id="ioc-modal-overlay">
      <div class="ai-modal" id="ioc-modal">
        <div class="ai-modal-header"><div class="ai-modal-title" id="ioc-modal-title">Add IOC</div><div class="ai-detail-close" id="ioc-modal-close">${svg('close')}</div></div>
        <div class="ai-modal-body">
          <input type="hidden" id="ioc-form-id" />
          <div class="ai-form-grid">
            <div class="ai-form-row"><label class="ai-label">IOC Type *</label><select class="input" id="ioc-form-type">${typeOpts}</select></div>
            <div class="ai-form-row"><label class="ai-label">Value *</label><input type="text" class="input" id="ioc-form-value" placeholder="e.g. 198.51.100.14" /></div>
            <div class="ai-form-row"><label class="ai-label">Threat Level</label><select class="input" id="ioc-form-level"><option value="critical">Critical</option><option value="high">High</option><option value="medium" selected>Medium</option><option value="low">Low</option><option value="informational">Informational</option></select></div>
            <div class="ai-form-row"><label class="ai-label">Confidence</label><select class="input" id="ioc-form-confidence"><option>High</option><option>Medium</option><option>Low</option><option>Unknown</option></select></div>
            <div class="ai-form-row"><label class="ai-label">Source</label><select class="input" id="ioc-form-source">${sourceOpts}</select></div>
            <div class="ai-form-row"><label class="ai-label">Threat Actor</label><select class="input" id="ioc-form-actor">${actorOpts}</select></div>
            <div class="ai-form-row"><label class="ai-label">Campaign</label><input type="text" class="input" id="ioc-form-campaign" placeholder="Optional" /></div>
            <div class="ai-form-row"><label class="ai-label">MITRE Technique ID</label><input type="text" class="input" id="ioc-form-mitre" placeholder="e.g. T1071.001" /></div>
            <div class="ai-form-row"><label class="ai-label">Status</label><select class="input" id="ioc-form-status">${statusOpts}</select></div>
            <div class="ai-form-row"><label class="ai-label">Tags (comma-separated)</label><input type="text" class="input" id="ioc-form-tags" placeholder="e.g. c2, ransomware" /></div>
          </div>
          <div class="ai-form-row"><label class="ai-label">Description</label><textarea class="input" id="ioc-form-desc" rows="2"></textarea></div>
          <div class="ai-form-error" id="ioc-form-error"></div>
        </div>
        <div class="ai-modal-footer"><button class="btn btn-secondary" id="ioc-form-cancel">Cancel</button><button class="btn btn-primary" id="ioc-form-save">Save</button></div>
      </div>
    </div>`;
  }

  function _wireAddEditModal() {
    document.getElementById('ioc-modal-close')?.addEventListener('click', _closeAddEditModal);
    document.getElementById('ioc-form-cancel')?.addEventListener('click', _closeAddEditModal);
    document.getElementById('ioc-modal-overlay')?.addEventListener('click', e => { if (e.target.id === 'ioc-modal-overlay') _closeAddEditModal(); });
    document.getElementById('ioc-form-save')?.addEventListener('click', _saveIOCForm);
  }

  function _openAddEditModal(iocId) {
    const isEdit = !!iocId;
    document.getElementById('ioc-modal-title').textContent = isEdit ? 'Edit IOC' : 'Add IOC';
    document.getElementById('ioc-form-error').textContent = '';
    const i = isEdit ? findIOC(iocId) : null;
    document.getElementById('ioc-form-id').value = iocId || '';
    document.getElementById('ioc-form-type').value = i?.type || (SD().TYPES[0] || 'IPv4');
    document.getElementById('ioc-form-value').value = i?.value || '';
    document.getElementById('ioc-form-level').value = i?.threatLevel || 'medium';
    document.getElementById('ioc-form-confidence').value = i?.confidence || 'Medium';
    document.getElementById('ioc-form-source').value = i?.source || 'Manual Entry';
    document.getElementById('ioc-form-actor').value = i?.threatActor || (SD().THREAT_ACTORS[0] || '');
    document.getElementById('ioc-form-campaign').value = (i?.campaign && i.campaign !== 'None') ? i.campaign : '';
    document.getElementById('ioc-form-mitre').value = i?.mitre?.id || '';
    document.getElementById('ioc-form-status').value = i?.status || 'Active';
    document.getElementById('ioc-form-tags').value = (i?.tags || []).join(', ');
    document.getElementById('ioc-form-desc').value = i?.description || '';
    document.getElementById('ioc-modal-overlay').classList.add('open');
  }
  function _closeAddEditModal() { document.getElementById('ioc-modal-overlay').classList.remove('open'); }

  function _saveIOCForm() {
    const value = document.getElementById('ioc-form-value').value.trim();
    const errEl = document.getElementById('ioc-form-error');
    if (!value) { errEl.textContent = 'Value is required.'; return; }
    errEl.textContent = '';

    const id = document.getElementById('ioc-form-id').value;
    const now = new Date().toISOString().slice(0, 10);
    const mitreId = document.getElementById('ioc-form-mitre').value.trim();
    const mitreRef = mitreId ? (SD().MITRE_POOL.find(m => m.id === mitreId) || { id: mitreId, tactic: '', technique: '' }) : null;

    const fields = {
      type: document.getElementById('ioc-form-type').value, value,
      threatLevel: document.getElementById('ioc-form-level').value, confidence: document.getElementById('ioc-form-confidence').value,
      source: document.getElementById('ioc-form-source').value, category: 'Manual Entry',
      threatActor: document.getElementById('ioc-form-actor').value, campaign: document.getElementById('ioc-form-campaign').value.trim() || 'None',
      mitre: mitreRef, status: document.getElementById('ioc-form-status').value,
      tags: document.getElementById('ioc-form-tags').value.split(',').map(t => t.trim()).filter(Boolean),
      description: document.getElementById('ioc-form-desc').value.trim() || '—',
      dateAdded: id ? undefined : now, firstSeen: id ? undefined : now, lastSeen: now, detectionCount: id ? undefined : 1,
      threatContext: { threatActor: document.getElementById('ioc-form-actor').value, campaign: document.getElementById('ioc-form-campaign').value.trim() || 'None', malwareFamily: '', associatedCves: [], knownTtps: mitreRef ? [mitreRef.technique] : [], affectedIndustries: [], countries: [] },
      timeline: id ? undefined : [{ date: now, event: 'IOC Created', detail: `Indicator added manually.` }],
    };
    Object.keys(fields).forEach(k => fields[k] === undefined && delete fields[k]);

    if (id) {
      const idx = customIOCs.findIndex(c => c.id === id);
      if (idx >= 0) customIOCs[idx] = { ...customIOCs[idx], ...fields };
      else overrides[id] = { ...(overrides[id] || {}), ...fields };
      window.NotificationManager?.success('IOC Updated', `${id} was updated.`);
    } else {
      customIOCs.push({ id: uid('IOC').toUpperCase(), relatedIncidentHint: null, relatedAssetHint: null, notes: [], detectionCount: 1, ...fields });
      window.NotificationManager?.success('IOC Added', `${value} was added to the database.`);
    }
    _savePersisted(); _closeAddEditModal(); _renderAll();
  }

  // ══════════════════════════════════════════════════════════════════════
  // DELETE CONFIRMATION
  // ══════════════════════════════════════════════════════════════════════
  function _buildConfirmModal() {
    return `
    <div class="ai-modal-overlay" id="ioc-confirm-overlay">
      <div class="ai-modal ai-modal-sm">
        <div class="ai-modal-header"><div class="ai-modal-title">Delete IOC</div><div class="ai-detail-close" id="ioc-confirm-close">${svg('close')}</div></div>
        <div class="ai-modal-body"><p id="ioc-confirm-text" style="color:var(--text-secondary);font-size:var(--text-sm);"></p></div>
        <div class="ai-modal-footer"><button class="btn btn-secondary" id="ioc-confirm-cancel">Cancel</button><button class="btn btn-danger" id="ioc-confirm-delete">Delete</button></div>
      </div>
    </div>`;
  }
  let pendingDeleteId = null;
  function _wireConfirmModal() {
    document.getElementById('ioc-confirm-close')?.addEventListener('click', _closeConfirm);
    document.getElementById('ioc-confirm-cancel')?.addEventListener('click', _closeConfirm);
    document.getElementById('ioc-confirm-overlay')?.addEventListener('click', e => { if (e.target.id === 'ioc-confirm-overlay') _closeConfirm(); });
    document.getElementById('ioc-confirm-delete')?.addEventListener('click', () => {
      if (!pendingDeleteId) return;
      const i = findIOC(pendingDeleteId);
      if (customIOCs.some(c => c.id === pendingDeleteId)) customIOCs = customIOCs.filter(c => c.id !== pendingDeleteId);
      else deletedIds.add(pendingDeleteId);
      _savePersisted(); _closeConfirm(); _renderAll();
      window.NotificationManager?.success('IOC Deleted', i ? `${i.id} was removed.` : 'IOC removed.');
    });
  }
  function _confirmDelete(iocId) {
    const i = findIOC(iocId); if (!i) return;
    pendingDeleteId = iocId;
    document.getElementById('ioc-confirm-text').textContent = `Are you sure you want to delete "${i.id} — ${i.value}"? This cannot be undone.`;
    document.getElementById('ioc-confirm-overlay').classList.add('open');
  }
  function _closeConfirm() { document.getElementById('ioc-confirm-overlay').classList.remove('open'); pendingDeleteId = null; }

  // ══════════════════════════════════════════════════════════════════════
  // IMPORT (offline JSON / CSV, preview + validation)
  // ══════════════════════════════════════════════════════════════════════
  function _buildImportModal() {
    return `
    <div class="ai-modal-overlay" id="ioc-import-overlay">
      <div class="ai-modal">
        <div class="ai-modal-header"><div class="ai-modal-title">Import IOCs</div><div class="ai-detail-close" id="ioc-import-close">${svg('close')}</div></div>
        <div class="ai-modal-body">
          <p style="color:var(--text-secondary);font-size:var(--text-sm);margin-bottom:var(--space-3);">Paste JSON (array of IOC objects with at least a <span class="mono">value</span> field) or CSV with a header row.</p>
          <textarea class="input" id="ioc-import-text" rows="8" placeholder='[{"type":"IPv4","value":"203.0.113.5","threatLevel":"high"}]' style="font-family:var(--font-mono);font-size:12px;"></textarea>
          <button class="btn btn-secondary btn-sm" id="ioc-import-preview" style="margin-top:var(--space-3);">Preview</button>
          <div id="ioc-import-preview-box" style="margin-top:var(--space-3);"></div>
        </div>
        <div class="ai-modal-footer"><button class="btn btn-secondary" id="ioc-import-cancel">Cancel</button><button class="btn btn-primary" id="ioc-import-confirm" disabled>Import</button></div>
      </div>
    </div>`;
  }
  let importPreviewRows = [];
  function _wireImportModal() {
    document.getElementById('ioc-import-close')?.addEventListener('click', _closeImportModal);
    document.getElementById('ioc-import-cancel')?.addEventListener('click', _closeImportModal);
    document.getElementById('ioc-import-overlay')?.addEventListener('click', e => { if (e.target.id === 'ioc-import-overlay') _closeImportModal(); });
    document.getElementById('ioc-import-preview')?.addEventListener('click', _previewImport);
    document.getElementById('ioc-import-confirm')?.addEventListener('click', _confirmImport);
  }
  function _openImportModal() {
    document.getElementById('ioc-import-text').value = '';
    document.getElementById('ioc-import-preview-box').innerHTML = '';
    document.getElementById('ioc-import-confirm').disabled = true;
    importPreviewRows = [];
    document.getElementById('ioc-import-overlay').classList.add('open');
  }
  function _closeImportModal() { document.getElementById('ioc-import-overlay').classList.remove('open'); }

  function _parseCSV(text) {
    const lines = text.trim().split('\n').filter(Boolean);
    if (!lines.length) return [];
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    return lines.slice(1).map(line => {
      const cells = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      const obj = {}; headers.forEach((h, i) => obj[h] = cells[i] || ''); return obj;
    });
  }

  function _previewImport() {
    const raw = document.getElementById('ioc-import-text').value.trim();
    const box = document.getElementById('ioc-import-preview-box');
    const confirmBtn = document.getElementById('ioc-import-confirm');
    if (!raw) { box.innerHTML = `<div class="empty-state"><div class="empty-state-desc">Paste JSON or CSV data first.</div></div>`; confirmBtn.disabled = true; return; }
    let rows = [];
    try {
      if (raw.startsWith('[') || raw.startsWith('{')) { const parsed = JSON.parse(raw); rows = Array.isArray(parsed) ? parsed : [parsed]; }
      else rows = _parseCSV(raw);
    } catch (e) {
      box.innerHTML = `<div class="empty-state"><div class="empty-state-title">Parse Error</div><div class="empty-state-desc">${esc(e.message)}</div></div>`;
      confirmBtn.disabled = true; window.NotificationManager?.error('Import Error', 'Could not parse the provided data.'); return;
    }
    rows = rows.filter(r => r && r.value);
    if (!rows.length) { box.innerHTML = `<div class="empty-state"><div class="empty-state-desc">No valid rows found — each row needs at least a "value" field.</div></div>`; confirmBtn.disabled = true; return; }
    importPreviewRows = rows;
    box.innerHTML = `<div class="ti-result-count" style="margin-bottom:var(--space-2);">${rows.length} indicator(s) ready to import</div>
      <div class="card"><div class="card-body" style="padding:0;max-height:220px;overflow:auto;">
      <table class="data-table"><thead><tr><th>Type</th><th>Value</th><th>Threat Level</th></tr></thead>
      <tbody>${rows.slice(0, 20).map(r => `<tr><td>${esc(r.type || 'IPv4')}</td><td>${esc(r.value)}</td><td>${esc(r.threatLevel || 'medium')}</td></tr>`).join('')}</tbody>
      </table></div></div>`;
    confirmBtn.disabled = false;
  }

  function _confirmImport() {
    if (!importPreviewRows.length) return;
    const now = new Date().toISOString().slice(0, 10);
    importPreviewRows.forEach(r => {
      customIOCs.push({
        id: uid('IOC').toUpperCase(), type: r.type || 'IPv4', value: r.value, threatLevel: r.threatLevel || 'medium',
        confidence: r.confidence || 'Medium', source: 'Imported Feed', category: r.category || 'Imported',
        threatActor: r.threatActor || 'Unknown', campaign: r.campaign || 'None',
        mitre: r.mitreId ? { id: r.mitreId, tactic: '', technique: '' } : null,
        dateAdded: now, firstSeen: now, lastSeen: now, status: r.status || 'Active', detectionCount: 1,
        description: r.description || `Imported ${r.type || 'IOC'} indicator.`,
        threatContext: { threatActor: r.threatActor || 'Unknown', campaign: r.campaign || 'None', malwareFamily: '', associatedCves: [], knownTtps: [], affectedIndustries: [], countries: [] },
        relatedIncidentHint: null, relatedAssetHint: null,
        timeline: [{ date: now, event: 'IOC Created', detail: 'Indicator imported into the database.' }],
        tags: [], notes: [],
      });
    });
    _savePersisted(); _closeImportModal(); _renderAll();
    window.NotificationManager?.success('Import Complete', `${importPreviewRows.length} IOC(s) imported.`);
    importPreviewRows = [];
  }

  // ══════════════════════════════════════════════════════════════════════
  // EXPORT / REPORTS
  // ══════════════════════════════════════════════════════════════════════
  function _download(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function _exportCurrent() {
    const rows = _filteredSorted();
    const header = ['id', 'type', 'value', 'threatLevel', 'confidence', 'source', 'category', 'threatActor', 'campaign', 'dateAdded', 'status'];
    const csv = [header.join(','), ...rows.map(i => header.map(k => `"${String(i[k] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    _download('ioc-export.csv', csv, 'text/csv');
    window.NotificationManager?.success('Export Complete', `${rows.length} IOC(s) exported as CSV.`);
  }

  function _openReportChoice() {
    const choice = window.confirm('Click OK for IOC Report + Executive Summary, or Cancel for Technical Summary + JSON.');
    if (choice) { _exportIOCReport(); _exportExecutiveSummary(); }
    else { _exportTechnicalSummary(); _download('ioc-export.json', JSON.stringify(_filteredSorted(), null, 2), 'application/json'); }
    window.NotificationManager?.success('Export Complete', 'IOC report generated.');
  }

  function _exportIOCReport() {
    const list = allIOCs();
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>IOC Report</title>
      <style>body{font-family:-apple-system,sans-serif;max-width:960px;margin:40px auto;color:#0f172a;}
      table{width:100%;border-collapse:collapse;margin:16px 0;} th,td{border:1px solid #ddd;padding:6px;text-align:left;font-size:11px;} th{background:#f1f5f9;}
      h1{font-size:22px;} .warn{background:#fef3c7;padding:10px;border-radius:6px;font-size:12px;}</style></head><body>
      <h1>Khan Security Solutions — IOC Report</h1>
      <div class="warn">⚠ Educational simulation — synthetic offline IOC dataset.</div>
      <table><tr><th>ID</th><th>Type</th><th>Value</th><th>Level</th><th>Actor</th><th>Campaign</th></tr>
      ${list.slice(0, 500).map(i => `<tr><td>${esc(i.id)}</td><td>${esc(i.type)}</td><td>${esc(i.value)}</td><td>${esc(i.threatLevel)}</td><td>${esc(i.threatActor)}</td><td>${esc(i.campaign)}</td></tr>`).join('')}
      </table>
      <p style="color:#64748b;font-size:11px;margin-top:24px;">Generated by Khan Security Solutions Enterprise · ${new Date().toLocaleString()}</p>
      </body></html>`;
    _download('ioc-report.html', html, 'text/html');
  }
  function _exportExecutiveSummary() {
    const s = _computeStats(); const list = allIOCs();
    const byActor = _groupCount(list, i => i.threatActor).slice(0, 10);
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>IOC Executive Summary</title>
      <style>body{font-family:-apple-system,sans-serif;max-width:900px;margin:40px auto;color:#0f172a;}
      table{width:100%;border-collapse:collapse;margin:16px 0;} th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:13px;} th{background:#f1f5f9;}
      h1{font-size:22px;} .warn{background:#fef3c7;padding:10px;border-radius:6px;font-size:12px;}</style></head><body>
      <h1>IOC Database — Executive Summary</h1>
      <div class="warn">⚠ Educational simulation — synthetic offline IOC dataset.</div>
      <p><strong>${s.total}</strong> total indicators tracked, <strong>${s.activeThreats}</strong> currently active, <strong>${s.highConfidence}</strong> high confidence.</p>
      <h2>Top Threat Actors by IOC Count</h2>
      <table><tr><th>Threat Actor</th><th>IOC Count</th></tr>${byActor.map(([a, c]) => `<tr><td>${esc(a)}</td><td>${c}</td></tr>`).join('')}</table>
      <p style="color:#64748b;font-size:11px;margin-top:24px;">Generated by Khan Security Solutions Enterprise · ${new Date().toLocaleString()}</p>
      </body></html>`;
    _download('ioc-executive-summary.html', html, 'text/html');
  }
  function _exportTechnicalSummary() {
    const list = allIOCs();
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>IOC Technical Summary</title>
      <style>body{font-family:-apple-system,sans-serif;max-width:960px;margin:40px auto;color:#0f172a;}
      table{width:100%;border-collapse:collapse;margin:16px 0;} th,td{border:1px solid #ddd;padding:6px;text-align:left;font-size:11px;} th{background:#f1f5f9;}
      h1{font-size:22px;} .warn{background:#fef3c7;padding:10px;border-radius:6px;font-size:12px;}</style></head><body>
      <h1>IOC Database — Technical Summary</h1>
      <div class="warn">⚠ Educational simulation — synthetic offline IOC dataset.</div>
      <table><tr><th>ID</th><th>Type</th><th>Value</th><th>MITRE</th><th>Source</th><th>Status</th></tr>
      ${list.slice(0, 500).map(i => `<tr><td>${esc(i.id)}</td><td>${esc(i.type)}</td><td>${esc(i.value)}</td><td>${esc(i.mitre?.id || '—')}</td><td>${esc(i.source)}</td><td>${esc(i.status)}</td></tr>`).join('')}
      </table>
      <p style="color:#64748b;font-size:11px;margin-top:24px;">Generated by Khan Security Solutions Enterprise · ${new Date().toLocaleString()}</p>
      </body></html>`;
    _download('ioc-technical-summary.html', html, 'text/html');
  }

  // ══════════════════════════════════════════════════════════════════════
  // IOC SEARCH MODAL (quick lookup)
  // ══════════════════════════════════════════════════════════════════════
  function _buildSearchModal() {
    return `
    <div class="ai-modal-overlay" id="ioc-search-overlay">
      <div class="ai-modal">
        <div class="ai-modal-header"><div class="ai-modal-title">IOC Search</div><div class="ai-detail-close" id="ioc-search-close">${svg('close')}</div></div>
        <div class="ai-modal-body">
          <div class="ti-search-box" style="margin-bottom:var(--space-3);">
            ${svg('search', 'ioc-inline-icon')}
            <input type="text" id="ioc-search-input" placeholder="Search by value, actor, campaign, MITRE ID…" />
          </div>
          <div id="ioc-search-results"></div>
        </div>
      </div>
    </div>`;
  }
  function _wireSearchModal() {
    document.getElementById('ioc-search-close')?.addEventListener('click', () => document.getElementById('ioc-search-overlay').classList.remove('open'));
    document.getElementById('ioc-search-overlay')?.addEventListener('click', e => { if (e.target.id === 'ioc-search-overlay') document.getElementById('ioc-search-overlay').classList.remove('open'); });
    document.getElementById('ioc-search-input')?.addEventListener('input', e => _runQuickSearch(e.target.value));
  }
  function _openSearchModal() {
    document.getElementById('ioc-search-input').value = '';
    document.getElementById('ioc-search-results').innerHTML = '';
    document.getElementById('ioc-search-overlay').classList.add('open');
    setTimeout(() => document.getElementById('ioc-search-input')?.focus(), 50);
  }
  function _runQuickSearch(q) {
    const box = document.getElementById('ioc-search-results');
    const query = q.trim().toLowerCase();
    if (!query) { box.innerHTML = ''; return; }
    const matches = allIOCs().filter(i => [i.id, i.value, i.threatActor, i.campaign, i.mitre?.id, i.type].join(' ').toLowerCase().includes(query)).slice(0, 25);
    box.innerHTML = matches.length
      ? `<div class="ti-result-count" style="margin-bottom:var(--space-2);">${matches.length} match(es)</div>` + matches.map(m => `<div class="ti-detail-link" data-goto-ioc="${m.id}">${svg(TYPE_ICON[m.type] || 'shield', 'ioc-inline-icon')} <strong>${esc(m.id)}</strong> — ${esc(_truncate(m.value, 40))} <span style="margin-left:auto;"><span class="badge ${LEVEL_CLS[m.threatLevel] || 'badge-neutral'}">${esc(m.threatLevel)}</span></span></div>`).join('')
      : `<div class="empty-state"><div class="empty-state-desc">No matches found.</div></div>`;
    box.querySelectorAll('[data-goto-ioc]').forEach(el => el.addEventListener('click', () => {
      document.getElementById('ioc-search-overlay').classList.remove('open');
      _openDrawer(el.dataset.gotoIoc);
    }));
  }

  // ══════════════════════════════════════════════════════════════════════
  // PERSISTENCE
  // ══════════════════════════════════════════════════════════════════════
  function _loadPersisted() {
    if (!window.StorageManager) return;
    customIOCs = window.StorageManager.lsGet('ioc_custom_iocs', []) || [];
    deletedIds = new Set(window.StorageManager.lsGet('ioc_deleted_ids', []) || []);
    overrides = window.StorageManager.lsGet('ioc_overrides', {}) || {};
  }
  function _savePersisted() {
    window.StorageManager?.lsSet('ioc_custom_iocs', customIOCs);
    window.StorageManager?.lsSet('ioc_deleted_ids', [...deletedIds]);
    window.StorageManager?.lsSet('ioc_overrides', overrides);
  }

  // ══════════════════════════════════════════════════════════════════════
  // SEARCH (global)
  // ══════════════════════════════════════════════════════════════════════
  function _registerSearch() {
    if (!window.SearchEngine) return;
    const d = SD();
    const items = [{ title: 'Enterprise IOC Manager', meta: 'IOC database, MITRE mapping, threat actors', route: 'ioc-manager', keywords: 'ioc indicators of compromise database apt29 apt28 lazarus fin7 lockbit blackcat emotet qakbot cobalt strike trickbot' }];
    d.iocs.slice(0, 200).forEach(i => items.push({ title: i.id, meta: `${i.type} — ${i.threatActor}`, route: 'ioc-manager', keywords: `${i.id} ${i.value} ${i.type} ${i.threatActor} ${i.campaign} ${i.mitre?.id || ''}` }));
    window.SearchEngine.register('IOC Manager', items);
  }

  // ── Public API ─────────────────────────────────────────────────────────
  return { register };

})();

window.IOCManager = IOCManager;

if (window.Router) {
  IOCManager.register();
} else {
  console.error('[IOCManager] Router not found. Ensure router.js loads before ioc-manager.js.');
}
