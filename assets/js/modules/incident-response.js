/**
 * KHAN SECURITY SOLUTIONS ENTERPRISE
 * Enterprise Incident Response Center — Module v1.1.0
 *
 * Offline SOC incident management: animated stat dashboard (MTTD/MTTR,
 * containment rate, severity breakdown), pure-SVG charts, a real-time
 * filterable/sortable/paginated incident table, a tabbed detail drawer
 * (Overview, Timeline, Evidence, MITRE Mapping, Affected Assets,
 * Indicators, Tasks, Notes, Recovery), Create/Edit/Delete, and offline
 * JSON/CSV import & export.
 *
 * [EDUCATIONAL SIMULATION — Ships with 50 deterministically generated
 *  synthetic incidents. Memory Dump / PCAP / Disk Image evidence entries
 *  are clearly labeled PLACEHOLDER references, not real forensic artifacts.
 *  Everything is stored locally via StorageManager; there is no backend.]
 *
 * Integrates with:
 *   window.Router              — route: 'incident-response'
 *   window.SearchEngine        — searchable content
 *   window.NotificationManager — alerts and feedback
 *   window.StorageManager      — incident persistence (localStorage)
 *   window.SampleIncidentData  — bundled sample dataset
 *   window.SampleAssetData     — cross-referenced for Affected Assets tab
 */

const IncidentResponse = (() => {

  // ── State ──────────────────────────────────────────────────────────────
  let mounted     = false;
  let customIncidents = [];
  let deletedIds    = new Set();
  let overrides       = {};

  let filters = { q: '', severity: 'all', status: 'all', category: 'all', analyst: 'all', priority: 'all' };
  let sortKey = 'createdTime', sortDir = 'desc';
  let currentPage = 1;
  const PAGE_SIZE = 10;

  // ── Icons ──────────────────────────────────────────────────────────────
  const I = {
    shield:   `<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>`,
    warn:     `<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>`,
    clock:    `<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>`,
    check:    `<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>`,
    plus:     `<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>`,
    upload:   `<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>`,
    down:     `<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>`,
    timeline: `<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>`,
    search:   `<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z"/>`,
    close:    `<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>`,
    edit:     `<path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"/>`,
    trash:    `<path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>`,
    map:      `<path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"/>`,
    hash:     `<path stroke-linecap="round" stroke-linejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5"/>`,
    evidence: `<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/>`,
    server:   `<path stroke-linecap="round" stroke-linejoin="round" d="M21.75 17.25v-.228a4.5 4.5 0 00-.12-1.03l-2.268-9.64a3.375 3.375 0 00-3.285-2.602H7.923a3.375 3.375 0 00-3.285 2.602l-2.268 9.64a4.5 4.5 0 00-.12 1.03v.228m19.5 0a3 3 0 01-3 3H5.25a3 3 0 01-3-3m19.5 0a3 3 0 00-3-3H5.25a3 3 0 00-3 3m16.5 0h.008v.008h-.008v-.008zm-3 0h.008v.008h-.008v-.008z"/>`,
    task:     `<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>`,
    note:     `<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-1.519-2.865a4.5 4.5 0 11-1.594-1.594m3.113 4.459a4.5 4.5 0 003.113-4.459M6 20.25h12A2.25 2.25 0 0020.25 18V9.75l-6-6H6a2.25 2.25 0 00-2.25 2.25v12A2.25 2.25 0 006 20.25z"/>`,
    recovery: `<path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/>`,
    copy:     `<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"/>`,
    chevronUp:  `<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5"/>`,
    chevronDown:`<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>`,
  };
  function svg(name, cls = '') { return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">${I[name] || I.shield}</svg>`; }
  function esc(s) { const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function uid(prefix) { return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`; }

  const SD = () => window.SampleIncidentData || { incidents: [], CATEGORIES: [], SEVERITIES: [], STATUSES: [], PRIORITIES: [], DETECTION_SOURCES: [], ANALYSTS: [], getIncident: () => null };
  const AD = () => window.SampleAssetData || { assets: [] };

  function allIncidents() {
    const base = SD().incidents.filter(i => !deletedIds.has(i.id)).map(i => overrides[i.id] ? { ...i, ...overrides[i.id] } : i);
    return [...base, ...customIncidents];
  }
  function findIncident(id) { return allIncidents().find(i => i.id === id) || null; }
  function findAssetByHostname(hostname) { return AD().assets.find(a => a.hostname === hostname) || null; }

  const SEV_CLS = { critical: 'badge-danger', high: 'badge-high', medium: 'badge-medium', low: 'badge-low', informational: 'badge-neutral' };
  const STATUS_CLS = {
    New: 'badge-info', Investigating: 'badge-warning', Triaged: 'badge-warning', Contained: 'badge-info',
    Eradicated: 'badge-info', Recovering: 'badge-info', Resolved: 'badge-success', Closed: 'badge-neutral', 'False Positive': 'badge-neutral',
  };

  // ══════════════════════════════════════════════════════════════════════
  // ROUTE REGISTRATION
  // ══════════════════════════════════════════════════════════════════════
  function register() { window.Router.register('incident-response', { title: 'Incident Response', init, render }); }

  function init() { _loadPersisted(); _registerSearch(); }

  function render() {
    const el = document.getElementById('page-incident-response');
    if (!el) return;
    if (!mounted) { el.innerHTML = _buildShell(); mounted = true; _wireAll(); _animateStats(); }
    else _renderAll();
  }

  // ══════════════════════════════════════════════════════════════════════
  // SHELL
  // ══════════════════════════════════════════════════════════════════════
  function _buildShell() {
    return `
    <div class="ir-shell">
      <div class="ir-header">
        <div>
          <div class="ir-header-title">Enterprise Incident Response Center</div>
          <div class="ir-header-sub">Manage, investigate and resolve cybersecurity incidents across the organisation.</div>
        </div>
        <div class="ir-header-actions">
          <button class="btn btn-secondary btn-sm" id="ir-btn-timeline">${svg('timeline')} Generate Timeline</button>
          <button class="btn btn-secondary btn-sm" id="ir-btn-import">${svg('upload')} Import Incidents</button>
          <button class="btn btn-secondary btn-sm" id="ir-btn-export">${svg('down')} Export Report</button>
          <button class="btn btn-primary btn-sm" id="ir-btn-add">${svg('plus')} Create Incident</button>
        </div>
      </div>

      <div class="ir-body">
        <div class="grid grid-stats ir-stats" id="ir-stats"></div>

        <div class="ir-charts-grid">
          <div class="card"><div class="card-header"><div class="card-title">Incidents by Severity</div></div><div class="card-body"><svg id="ir-chart-severity" viewBox="0 0 300 180" class="ai-chart-svg"></svg></div></div>
          <div class="card"><div class="card-header"><div class="card-title">Incidents by Category</div></div><div class="card-body"><svg id="ir-chart-category" viewBox="0 0 300 180" class="ai-chart-svg"></svg></div></div>
          <div class="card"><div class="card-header"><div class="card-title">Incidents by Status</div></div><div class="card-body"><svg id="ir-chart-status" viewBox="0 0 300 180" class="ai-chart-svg"></svg></div></div>
          <div class="card"><div class="card-header"><div class="card-title">Monthly Trend</div></div><div class="card-body"><svg id="ir-chart-trend" viewBox="0 0 300 180" class="ai-chart-svg"></svg></div></div>
          <div class="card"><div class="card-header"><div class="card-title">MITRE Technique Distribution</div></div><div class="card-body"><svg id="ir-chart-mitre" viewBox="0 0 300 180" class="ai-chart-svg"></svg></div></div>
          <div class="card"><div class="card-header"><div class="card-title">Response Time by Severity (min)</div></div><div class="card-body"><svg id="ir-chart-response" viewBox="0 0 300 180" class="ai-chart-svg"></svg></div></div>
        </div>

        <div class="card ai-filter-card">
          <div class="card-body">
            <div class="ai-filter-bar">
              <div class="ti-search-box" style="flex:2;min-width:220px;">
                ${svg('search', 'ir-inline-icon')}
                <input type="text" id="ir-f-search" placeholder="Search title, category, asset, analyst…" />
              </div>
              <select class="input ai-filter-select" id="ir-f-severity"><option value="all">All Severities</option></select>
              <select class="input ai-filter-select" id="ir-f-status"><option value="all">All Statuses</option></select>
              <select class="input ai-filter-select" id="ir-f-category"><option value="all">All Categories</option></select>
              <select class="input ai-filter-select" id="ir-f-analyst"><option value="all">All Analysts</option></select>
              <select class="input ai-filter-select" id="ir-f-priority"><option value="all">All Priorities</option></select>
              <button class="btn btn-secondary btn-sm" id="ir-f-clear">${svg('close')} Clear</button>
            </div>
          </div>
        </div>

        <div class="ai-result-count" id="ir-result-count"></div>
        <div class="card ai-table-card">
          <div class="card-body" style="padding:0;overflow-x:auto;">
            <table class="data-table ai-table">
              <thead>
                <tr>
                  <th data-sort="id">Incident ID</th><th data-sort="title">Title</th><th data-sort="severity">Severity</th>
                  <th data-sort="status">Status</th><th data-sort="category">Category</th><th data-sort="affectedAssetHostname">Affected Asset</th>
                  <th data-sort="assignedAnalyst">Analyst</th><th data-sort="priority">Priority</th><th>MITRE</th>
                  <th data-sort="detectionSource">Detection Source</th><th data-sort="createdTime">Created</th>
                  <th data-sort="updatedTime">Updated</th><th>SLA</th><th></th>
                </tr>
              </thead>
              <tbody id="ir-table-body"></tbody>
            </table>
          </div>
          <div class="ai-pagination" id="ir-pagination"></div>
        </div>
      </div>
    </div>

    ${_buildDrawer()}
    ${_buildAddEditModal()}
    ${_buildImportModal()}
    ${_buildConfirmModal()}
    `;
  }

  function _wireAll() {
    document.getElementById('ir-btn-timeline')?.addEventListener('click', _generateTimelineReport);
    document.getElementById('ir-btn-import')?.addEventListener('click', _openImportModal);
    document.getElementById('ir-btn-export')?.addEventListener('click', _openExportChoiceReal);
    document.getElementById('ir-btn-add')?.addEventListener('click', () => _openAddEditModal(null));

    document.getElementById('ir-f-search')?.addEventListener('input', e => { filters.q = e.target.value; currentPage = 1; _renderAll(); });
    ['severity', 'status', 'category', 'analyst', 'priority'].forEach(key => {
      document.getElementById(`ir-f-${key}`)?.addEventListener('change', e => { filters[key] = e.target.value; currentPage = 1; _renderAll(); });
    });
    document.getElementById('ir-f-clear')?.addEventListener('click', () => {
      filters = { q: '', severity: 'all', status: 'all', category: 'all', analyst: 'all', priority: 'all' };
      document.getElementById('ir-f-search').value = '';
      document.querySelectorAll('#page-incident-response .ai-filter-select').forEach(sel => sel.value = 'all');
      currentPage = 1; _renderAll();
    });
    document.querySelectorAll('#page-incident-response .ai-table thead th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const key = th.dataset.sort;
        if (sortKey === key) sortDir = sortDir === 'asc' ? 'desc' : 'asc'; else { sortKey = key; sortDir = 'asc'; }
        _renderAll();
      });
    });

    _wireDrawer(); _wireAddEditModal(); _wireImportModal(); _wireConfirmModal();
    _populateFilterOptions(); _renderAll();
  }

  // ══════════════════════════════════════════════════════════════════════
  // STATS (animated) — Open/Critical/High/Med/Low/Resolved, containment
  // rate, avg response/resolution time, MTTD, MTTR
  // ══════════════════════════════════════════════════════════════════════
  function _computeStats() {
    const list = allIncidents();
    const open = list.filter(i => !['Resolved', 'Closed', 'False Positive'].includes(i.status)).length;
    const bySev = sev => list.filter(i => i.severity === sev).length;
    const resolved = list.filter(i => ['Resolved', 'Closed'].includes(i.status)).length;
    const contained = list.filter(i => ['Contained', 'Eradicated', 'Recovering', 'Resolved', 'Closed'].includes(i.status)).length;
    const containmentRate = list.length ? Math.round((contained / list.length) * 100) : 0;
    const avgResponse = list.length ? Math.round(list.reduce((s, i) => s + (i.responseMinutes || 0), 0) / list.length) : 0;
    const closedList = list.filter(i => ['Resolved', 'Closed'].includes(i.status));
    const avgResolutionHrs = closedList.length ? Math.round(closedList.reduce((s, i) => {
      const created = new Date(i.createdTime).getTime(), updated = new Date(i.updatedTime).getTime();
      return s + Math.max(0, (updated - created) / 3600000);
    }, 0) / closedList.length) : 0;
    return {
      open, critical: bySev('critical'), high: bySev('high'), medium: bySev('medium'), low: bySev('low'), resolved,
      containmentRate, avgResponse, avgResolutionHrs,
      mttd: avgResponse, mttr: avgResolutionHrs,
    };
  }

  function _buildStatsHTML(s) {
    const cards = [
      ['Open Incidents', s.open, 'shield', 'var(--color-primary)'],
      ['Critical', s.critical, 'warn', 'var(--color-danger)'],
      ['High Severity', s.high, 'warn', '#f97316'],
      ['Medium Severity', s.medium, 'warn', 'var(--color-warning)'],
      ['Low Severity', s.low, 'warn', 'var(--color-success)'],
      ['Resolved', s.resolved, 'check', 'var(--color-success)'],
      ['Containment Rate', s.containmentRate + '%', 'shield', 'var(--color-info)'],
      ['Avg. Response Time', s.avgResponse + ' min', 'clock', 'var(--color-primary)'],
      ['Avg. Resolution Time', s.avgResolutionHrs + ' hrs', 'clock', 'var(--color-primary)'],
      ['MTTD', s.mttd + ' min', 'clock', '#a78bfa'],
      ['MTTR', s.mttr + ' hrs', 'clock', '#a78bfa'],
    ];
    return cards.map(([label, value, icon, color]) => `
      <div class="stat-card">
        <div class="stat-card-icon" style="background:${color}22;color:${color};">${svg(icon)}</div>
        <div class="stat-card-info">
          <div class="stat-card-value ai-count" data-target="${parseInt(value, 10) || 0}" data-suffix="${String(value).replace(/^-?\d+/, '')}">0</div>
          <div class="stat-card-label">${esc(label)}</div>
        </div>
      </div>`).join('');
  }

  function _animateStats() {
    const s = _computeStats();
    document.getElementById('ir-stats').innerHTML = _buildStatsHTML(s);
    document.querySelectorAll('#ir-stats .ai-count').forEach(el => {
      const target = parseInt(el.dataset.target, 10) || 0;
      const suffix = el.dataset.suffix || '';
      let current = 0;
      const step = Math.max(1, Math.ceil(target / 24));
      const timer = setInterval(() => {
        current = Math.min(target, current + step);
        el.textContent = current + suffix;
        if (current >= target) clearInterval(timer);
      }, 20);
    });
    _renderCharts();
  }
  function _refreshStatsStatic() {
    const s = _computeStats();
    const values = [s.open, s.critical, s.high, s.medium, s.low, s.resolved, s.containmentRate + '%', s.avgResponse + ' min', s.avgResolutionHrs + ' hrs', s.mttd + ' min', s.mttr + ' hrs'];
    document.querySelectorAll('#ir-stats .ai-count').forEach((el, idx) => { el.textContent = values[idx]; });
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
    const legend = data.slice(0, 6).map(([label, val], idx) => `<g transform="translate(190, ${18 + idx * 24})"><rect width="10" height="10" rx="2" fill="${CHART_COLORS[idx % CHART_COLORS.length]}"/><text x="16" y="9" font-size="10" fill="var(--text-secondary)">${esc(_truncate(label, 16))} (${val})</text></g>`).join('');
    el.innerHTML = `<g>${paths}</g>${legend}`;
  }
  function _renderBarChart(svgId, data) {
    const el = document.getElementById(svgId); if (!el) return;
    const items = data.slice(0, 6); const max = Math.max(1, ...items.map(([, v]) => v));
    const barH = 22, gap = 8, chartW = 300, labelW = 90;
    el.innerHTML = items.map(([label, val], idx) => {
      const y = idx * (barH + gap) + 6; const w = ((chartW - labelW - 40) * val) / max;
      return `<text x="0" y="${y + barH / 2 + 4}" font-size="10" fill="var(--text-secondary)">${esc(_truncate(label, 14))}</text>
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
    const list = allIncidents();
    _renderPieChart('ir-chart-severity', _groupCount(list, i => i.severity));
    _renderBarChart('ir-chart-category', _groupCount(list, i => i.category));
    _renderBarChart('ir-chart-status', _groupCount(list, i => i.status));
    _renderPieChart('ir-chart-mitre', _groupCount(list, i => i.mitre?.id));

    // Monthly trend — bucket by created month, last 6 months
    const months = [];
    for (let m = 5; m >= 0; m--) { const d = new Date(); d.setMonth(d.getMonth() - m); months.push(d.toISOString().slice(0, 7)); }
    const trendPoints = months.map(m => ({ label: m.slice(5), value: list.filter(i => (i.createdTime || '').slice(0, 7) === m).length }));
    _renderLineChart('ir-chart-trend', trendPoints);

    // Response time by severity (avg minutes)
    const sevOrder = ['critical', 'high', 'medium', 'low', 'informational'];
    const respData = sevOrder.map(sev => {
      const items = list.filter(i => i.severity === sev);
      const avg = items.length ? Math.round(items.reduce((s, i) => s + (i.responseMinutes || 0), 0) / items.length) : 0;
      return [sev, avg];
    }).filter(([, v]) => v > 0);
    _renderBarChart('ir-chart-response', respData);
  }

  // ══════════════════════════════════════════════════════════════════════
  // FILTER OPTIONS / TABLE
  // ══════════════════════════════════════════════════════════════════════
  function _populateFilterOptions() {
    const d = SD(); const list = allIncidents();
    const opts = (id, values) => {
      const sel = document.getElementById(id); if (!sel) return;
      const current = sel.value;
      sel.innerHTML = sel.options[0].outerHTML + [...new Set(values)].filter(Boolean).sort().map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
      sel.value = current || 'all';
    };
    opts('ir-f-severity', d.SEVERITIES.length ? d.SEVERITIES : list.map(i => i.severity));
    opts('ir-f-status', d.STATUSES.length ? d.STATUSES : list.map(i => i.status));
    opts('ir-f-category', d.CATEGORIES.length ? d.CATEGORIES : list.map(i => i.category));
    opts('ir-f-analyst', d.ANALYSTS.length ? d.ANALYSTS : list.map(i => i.assignedAnalyst));
    opts('ir-f-priority', d.PRIORITIES.length ? d.PRIORITIES : list.map(i => i.priority));
  }

  function _filteredSorted() {
    const q = filters.q.trim().toLowerCase();
    let rows = allIncidents().filter(i => {
      if (filters.severity !== 'all' && i.severity !== filters.severity) return false;
      if (filters.status !== 'all' && i.status !== filters.status) return false;
      if (filters.category !== 'all' && i.category !== filters.category) return false;
      if (filters.analyst !== 'all' && i.assignedAnalyst !== filters.analyst) return false;
      if (filters.priority !== 'all' && i.priority !== filters.priority) return false;
      if (q) {
        const hay = [i.id, i.title, i.category, i.affectedAssetHostname, i.assignedAnalyst, i.department, i.severity].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    rows.sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (sortKey === 'createdTime' || sortKey === 'updatedTime') { av = new Date(av).getTime(); bv = new Date(bv).getTime(); }
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

    document.getElementById('ir-result-count').textContent = `${total} of ${allIncidents().length} incidents`;
    document.querySelectorAll('#page-incident-response .ai-table thead th[data-sort]').forEach(th => {
      th.classList.toggle('sorted', th.dataset.sort === sortKey);
      th.dataset.dir = th.dataset.sort === sortKey ? sortDir : '';
    });

    const tbody = document.getElementById('ir-table-body');
    if (!slice.length) {
      tbody.innerHTML = `<tr><td colspan="14"><div class="empty-state"><div class="empty-state-title">No incidents match</div><div class="empty-state-desc">Try clearing filters or your search term.</div></div></td></tr>`;
    } else {
      tbody.innerHTML = slice.map(i => `
        <tr class="ai-row" data-id="${i.id}">
          <td class="mono">${esc(i.id)}</td>
          <td><strong>${esc(_truncate(i.title, 42))}</strong></td>
          <td><span class="badge ${SEV_CLS[i.severity] || 'badge-neutral'}">${esc(i.severity)}</span></td>
          <td><span class="badge ${STATUS_CLS[i.status] || 'badge-neutral'}">${esc(i.status)}</span></td>
          <td>${esc(i.category)}</td>
          <td class="mono">${esc(i.affectedAssetHostname)}</td>
          <td>${esc(i.assignedAnalyst)}</td>
          <td><span class="badge badge-neutral">${esc(i.priority)}</span></td>
          <td><span class="badge badge-info mono">${esc(i.mitre?.id || '—')}</span></td>
          <td>${esc(i.detectionSource)}</td>
          <td class="mono" style="font-size:11px;">${esc(i.createdTime)}</td>
          <td class="mono" style="font-size:11px;">${esc(i.updatedTime)}</td>
          <td><span class="badge ${i.slaStatus === 'Met' ? 'badge-success' : 'badge-danger'}">${esc(i.slaStatus)}</span></td>
          <td class="ai-actions-cell">
            <button class="btn-icon ir-edit-btn" data-id="${i.id}" title="Edit">${svg('edit')}</button>
            <button class="btn-icon ir-del-btn" data-id="${i.id}" title="Delete">${svg('trash')}</button>
          </td>
        </tr>`).join('');
    }
    tbody.querySelectorAll('.ai-row').forEach(tr => tr.addEventListener('click', e => {
      if (e.target.closest('.ir-edit-btn') || e.target.closest('.ir-del-btn')) return;
      _openDrawer(tr.dataset.id);
    }));
    tbody.querySelectorAll('.ir-edit-btn').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); _openAddEditModal(btn.dataset.id); }));
    tbody.querySelectorAll('.ir-del-btn').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); _confirmDelete(btn.dataset.id); }));

    _renderPagination(pages);
  }

  function _renderPagination(pages) {
    const box = document.getElementById('ir-pagination'); if (!box) return;
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
  // DETAIL DRAWER — 9 tabs
  // ══════════════════════════════════════════════════════════════════════
  function _buildDrawer() {
    return `
    <div class="ai-drawer-overlay" id="ir-drawer-overlay">
      <div class="ai-drawer" id="ir-drawer" style="max-width:680px;">
        <div class="ai-drawer-header">
          <div><div class="ai-drawer-title" id="ir-drawer-title">Incident</div><div class="ai-drawer-sub" id="ir-drawer-sub"></div></div>
          <div class="ai-drawer-close" id="ir-drawer-close">${svg('close')}</div>
        </div>
        <div class="ai-drawer-tabs">
          <div class="ai-drawer-tab active" data-dtab="overview">Overview</div>
          <div class="ai-drawer-tab" data-dtab="timeline">Timeline</div>
          <div class="ai-drawer-tab" data-dtab="evidence">Evidence</div>
          <div class="ai-drawer-tab" data-dtab="mitre">MITRE Mapping</div>
          <div class="ai-drawer-tab" data-dtab="assets">Affected Assets</div>
          <div class="ai-drawer-tab" data-dtab="iocs">Indicators</div>
          <div class="ai-drawer-tab" data-dtab="tasks">Tasks</div>
          <div class="ai-drawer-tab" data-dtab="notes">Notes</div>
          <div class="ai-drawer-tab" data-dtab="recovery">Recovery</div>
        </div>
        <div class="ai-drawer-body" id="ir-drawer-body"></div>
      </div>
    </div>`;
  }

  function _wireDrawer() {
    document.getElementById('ir-drawer-close')?.addEventListener('click', _closeDrawer);
    document.getElementById('ir-drawer-overlay')?.addEventListener('click', e => { if (e.target.id === 'ir-drawer-overlay') _closeDrawer(); });
    document.querySelectorAll('#ir-drawer .ai-drawer-tab').forEach(tab => tab.addEventListener('click', () => {
      document.querySelectorAll('#ir-drawer .ai-drawer-tab').forEach(t => t.classList.toggle('active', t === tab));
      _renderDrawerTab(tab.dataset.dtab);
    }));
  }

  let drawerIncidentId = null;
  function _openDrawer(incidentId) {
    drawerIncidentId = incidentId;
    const i = findIncident(incidentId); if (!i) return;
    document.getElementById('ir-drawer-title').textContent = `${i.id} — ${i.title}`;
    document.getElementById('ir-drawer-sub').textContent = `${i.category} · ${i.assignedAnalyst} · ${i.status}`;
    document.querySelectorAll('#ir-drawer .ai-drawer-tab').forEach(t => t.classList.toggle('active', t.dataset.dtab === 'overview'));
    _renderDrawerTab('overview');
    document.getElementById('ir-drawer-overlay').classList.add('open');
  }
  function _closeDrawer() { document.getElementById('ir-drawer-overlay').classList.remove('open'); drawerIncidentId = null; }

  function _renderDrawerTab(tab) {
    const i = findIncident(drawerIncidentId);
    const body = document.getElementById('ir-drawer-body');
    if (!i || !body) return;
    const map = { overview: _drTabOverview, timeline: _drTabTimeline, evidence: _drTabEvidence, mitre: _drTabMitre, assets: _drTabAssets, iocs: _drTabIocs, tasks: _drTabTasks, notes: _drTabNotes, recovery: _drTabRecovery };
    body.innerHTML = (map[tab] || _drTabOverview)(i);
    if (tab === 'tasks') _wireTaskCheckboxes(i);
  }

  function _field(label, value) {
    return `<div class="ai-detail-field"><div class="ai-detail-field-label">${esc(label)}</div><div class="ai-detail-field-value">${value == null || value === '' ? '<span style="color:var(--text-tertiary);">—</span>' : esc(String(value))}</div></div>`;
  }

  function _drTabOverview(i) {
    return `
      <div class="ti-tag-row" style="margin-bottom:var(--space-4);">
        <span class="badge ${SEV_CLS[i.severity] || 'badge-neutral'}">${esc(i.severity)}</span>
        <span class="badge ${STATUS_CLS[i.status] || 'badge-neutral'}">${esc(i.status)}</span>
        <span class="badge badge-neutral">${esc(i.priority)}</span>
      </div>
      <div class="ai-detail-sub-title">Description</div>
      <p style="font-size:var(--text-sm);color:var(--text-secondary);line-height:1.6;">${esc(i.description)}</p>
      <div class="ai-detail-sub-title">Business Impact</div>
      <p style="font-size:var(--text-sm);color:var(--text-secondary);line-height:1.6;">${esc(i.businessImpact)}</p>
      <div class="ai-detail-grid">
        ${_field('Owner', i.owner)} ${_field('Department', i.department)}
        ${_field('Created', i.createdTime)} ${_field('Updated', i.updatedTime)}
        ${_field('Resolution', i.resolutionTime)} ${_field('SLA Status', i.slaStatus)}
      </div>`;
  }

  function _drTabTimeline(i) {
    return `<div class="ir-timeline-track">${(i.timeline || []).map(t => `
      <div class="ai-timeline-row">
        <div class="ai-timeline-dot"></div>
        <div><div class="ai-timeline-head"><strong>${esc(t.event)}</strong> <span style="color:var(--text-tertiary);">— ${esc(t.time)}</span></div>
        <div class="ai-timeline-detail">${esc(t.detail)}</div></div>
      </div>`).join('') || '<div style="color:var(--text-tertiary);font-size:var(--text-sm);">No timeline recorded.</div>'}</div>`;
  }

  function _drTabEvidence(i) {
    return (i.evidence || []).map(e => `
      <div class="ir-evidence-item">
        ${svg('evidence', 'ir-inline-icon')}
        <div><div class="ir-evidence-name">${esc(e.type)} <span style="color:var(--text-tertiary);font-weight:normal;">— ${esc(e.name)}</span></div>
        <div class="ir-evidence-note">${esc(e.note)}</div></div>
      </div>`).join('') || '<div style="color:var(--text-tertiary);font-size:var(--text-sm);">No evidence collected yet.</div>';
  }

  function _drTabMitre(i) {
    const m = i.mitre; if (!m) return '<div style="color:var(--text-tertiary);font-size:var(--text-sm);">No MITRE mapping recorded.</div>';
    return `
      <div class="ai-detail-grid">
        ${_field('Tactic', m.tactic)} ${_field('Technique', m.technique)}
        ${_field('Technique ID', m.id)}
      </div>
      <div class="ai-detail-sub-title">Detection Logic</div><p style="font-size:var(--text-sm);color:var(--text-secondary);line-height:1.6;">${esc(m.detectionLogic)}</p>
      <div class="ai-detail-sub-title">Recommendations</div><p style="font-size:var(--text-sm);color:var(--text-secondary);line-height:1.6;">${esc(m.recommendations)}</p>
      <a class="btn btn-secondary btn-sm" href="https://attack.mitre.org/techniques/${m.id.replace('.', '/')}/" target="_blank" rel="noopener" style="margin-top:var(--space-2);">${svg('map', 'ir-inline-icon')} View on attack.mitre.org</a>`;
  }

  function _drTabAssets(i) {
    const asset = findAssetByHostname(i.affectedAssetHostname);
    if (!asset) {
      return `<div class="ai-detail-grid">${_field('Hostname', i.affectedAssetHostname)}${_field('Department', i.department)}</div>
        <div style="color:var(--text-tertiary);font-size:var(--text-sm);margin-top:var(--space-2);">Not found in the current Asset Inventory — it may have been renamed, retired, or removed.</div>`;
    }
    return `<div class="ai-detail-grid">
      ${_field('Hostname', asset.hostname)} ${_field('Assigned User', asset.assignedUser)}
      ${_field('Department', asset.department)} ${_field('Criticality', asset.criticality)}
    </div>
    <div class="ti-tag-row">
      <span class="badge ${RISK_CLS_LOCAL(asset.risk)}">${esc(asset.risk)} risk</span>
      <span class="badge badge-neutral">${esc(asset.status)}</span>
    </div>`;
  }
  function RISK_CLS_LOCAL(risk) { return { critical: 'badge-danger', high: 'badge-high', medium: 'badge-medium', low: 'badge-low', informational: 'badge-neutral' }[risk] || 'badge-neutral'; }

  function _drTabIocs(i) {
    return `<div class="card"><div class="card-body" style="padding:0;overflow-x:auto;">
      <table class="data-table"><thead><tr><th>Type</th><th>Value</th><th>Detection Time</th><th>Confidence</th></tr></thead>
      <tbody>${(i.iocs || []).map(ioc => `<tr><td>${esc(ioc.type.toUpperCase())}</td><td class="mono">${esc(ioc.value)}</td><td class="mono">${esc(ioc.detectionTime)}</td><td>${ioc.confidence}%</td></tr>`).join('') || '<tr><td colspan="4"><div class="empty-state"><div class="empty-state-desc">No indicators recorded.</div></div></td></tr>'}</tbody>
      </table></div></div>`;
  }

  function _drTabTasks(i) {
    return (i.tasks || []).map(t => `
      <div class="ir-task-item">
        <input type="checkbox" class="ir-task-check" data-task="${t.id}" ${t.status === 'Done' ? 'checked' : ''}/>
        <div style="flex:1;">
          <div class="ir-task-title" style="${t.status === 'Done' ? 'text-decoration:line-through;color:var(--text-tertiary);' : ''}">${esc(t.title)}</div>
          <div class="ir-task-meta">Assigned to ${esc(t.assignee)} &middot; due ${esc(t.dueDate)} &middot; <span class="badge badge-neutral">${esc(t.status)}</span></div>
          <div class="ir-task-progress-track"><div class="ir-task-progress-fill" style="width:${t.progress}%;"></div></div>
        </div>
      </div>`).join('') || '<div style="color:var(--text-tertiary);font-size:var(--text-sm);">No tasks recorded.</div>';
  }
  function _wireTaskCheckboxes(i) {
    document.querySelectorAll('#ir-drawer-body .ir-task-check').forEach(cb => {
      cb.addEventListener('change', () => {
        const task = (i.tasks || []).find(t => t.id === cb.dataset.task);
        if (!task) return;
        task.status = cb.checked ? 'Done' : 'In Progress';
        task.progress = cb.checked ? 100 : task.progress;
        _persistIncidentMutation(i);
        window.NotificationManager?.success('Task Updated', `"${task.title}" marked ${task.status}.`);
        _renderDrawerTab('tasks');
      });
    });
  }

  function _drTabNotes(i) {
    const notes = (i.notes || []).slice().reverse();
    return `
      ${notes.map(n => `<div class="df-note"><div class="df-note-meta">${esc(n.author)} &middot; ${esc(n.date)}</div><div class="df-note-text">${esc(n.text)}</div></div>`).join('') || '<div style="color:var(--text-tertiary);font-size:var(--text-sm);margin-bottom:var(--space-3);">No notes yet.</div>'}
      <textarea class="input" id="ir-note-text" rows="2" placeholder="Add a note about this incident…" style="margin-top:var(--space-2);"></textarea>
      <button class="btn btn-secondary btn-sm" id="ir-note-add" style="margin-top:var(--space-2);">${svg('plus')} Add Note</button>`;
  }

  function _drTabRecovery(i) {
    const r = i.recovery || {};
    const items = [
      ['System Restored', r.systemRestored], ['Password Reset', r.passwordReset], ['Patch Applied', r.patchApplied],
      ['AV Scan Completed', r.avScan], ['Validation Complete', r.validationComplete],
    ];
    return `
      ${items.map(([label, done]) => `
        <div class="ir-recovery-item">
          <div class="ir-recovery-check ${done ? 'done' : ''}">${done ? svg('check') : ''}</div>
          <div>${esc(label)}</div>
        </div>`).join('')}
      <div class="ai-detail-sub-title">Lessons Learned</div>
      <p style="font-size:var(--text-sm);color:var(--text-secondary);line-height:1.6;">${r.lessonsLearned ? esc(r.lessonsLearned) : '<span style="color:var(--text-tertiary);">Not yet documented — pending incident closure.</span>'}</p>`;
  }

  function _persistIncidentMutation(i) {
    const customIdx = customIncidents.findIndex(c => c.id === i.id);
    if (customIdx >= 0) customIncidents[customIdx] = i;
    else overrides[i.id] = { ...(overrides[i.id] || {}), tasks: i.tasks, notes: i.notes };
    _savePersisted();
  }

  // ══════════════════════════════════════════════════════════════════════
  // CREATE / EDIT MODAL
  // ══════════════════════════════════════════════════════════════════════
  function _buildAddEditModal() {
    const d = SD();
    const catOpts = (d.CATEGORIES.length ? d.CATEGORIES : ['Malware']).map(c => `<option>${esc(c)}</option>`).join('');
    const analystOpts = (d.ANALYSTS.length ? d.ANALYSTS : ['Unassigned']).map(a => `<option>${esc(a)}</option>`).join('');
    const statusOpts = (d.STATUSES.length ? d.STATUSES : ['New']).map(s => `<option>${esc(s)}</option>`).join('');
    return `
    <div class="ai-modal-overlay" id="ir-modal-overlay">
      <div class="ai-modal" id="ir-modal">
        <div class="ai-modal-header"><div class="ai-modal-title" id="ir-modal-title">Create Incident</div><div class="ai-detail-close" id="ir-modal-close">${svg('close')}</div></div>
        <div class="ai-modal-body">
          <input type="hidden" id="ir-form-id" />
          <div class="ai-form-row"><label class="ai-label">Incident Title *</label><input type="text" class="input" id="ir-form-title" /></div>
          <div class="ai-form-row"><label class="ai-label">Description</label><textarea class="input" id="ir-form-desc" rows="2"></textarea></div>
          <div class="ai-form-grid">
            <div class="ai-form-row"><label class="ai-label">Severity</label><select class="input" id="ir-form-severity"><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option><option value="informational">Informational</option></select></div>
            <div class="ai-form-row"><label class="ai-label">Priority</label><select class="input" id="ir-form-priority"><option>P1</option><option>P2</option><option>P3</option><option>P4</option></select></div>
            <div class="ai-form-row"><label class="ai-label">Category</label><select class="input" id="ir-form-category">${catOpts}</select></div>
            <div class="ai-form-row"><label class="ai-label">Affected Asset (hostname)</label><input type="text" class="input" id="ir-form-asset" placeholder="e.g. WIN-SRV-001" /></div>
            <div class="ai-form-row"><label class="ai-label">Assigned Analyst</label><select class="input" id="ir-form-analyst">${analystOpts}</select></div>
            <div class="ai-form-row"><label class="ai-label">Status</label><select class="input" id="ir-form-status">${statusOpts}</select></div>
            <div class="ai-form-row"><label class="ai-label">MITRE Technique ID</label><input type="text" class="input" id="ir-form-mitre" placeholder="e.g. T1566.001" /></div>
          </div>
          <div class="ai-form-row"><label class="ai-label">Business Impact</label><textarea class="input" id="ir-form-impact" rows="2"></textarea></div>
          <div class="ai-form-row"><label class="ai-label">Notes</label><textarea class="input" id="ir-form-notes" rows="2"></textarea></div>
          <div class="ai-form-error" id="ir-form-error"></div>
        </div>
        <div class="ai-modal-footer"><button class="btn btn-secondary" id="ir-form-cancel">Cancel</button><button class="btn btn-primary" id="ir-form-save">Save</button></div>
      </div>
    </div>`;
  }

  function _wireAddEditModal() {
    document.getElementById('ir-modal-close')?.addEventListener('click', _closeAddEditModal);
    document.getElementById('ir-form-cancel')?.addEventListener('click', _closeAddEditModal);
    document.getElementById('ir-modal-overlay')?.addEventListener('click', e => { if (e.target.id === 'ir-modal-overlay') _closeAddEditModal(); });
    document.getElementById('ir-form-save')?.addEventListener('click', _saveIncidentForm);
  }

  function _openAddEditModal(incidentId) {
    const isEdit = !!incidentId;
    document.getElementById('ir-modal-title').textContent = isEdit ? 'Edit Incident' : 'Create Incident';
    document.getElementById('ir-form-error').textContent = '';
    const i = isEdit ? findIncident(incidentId) : null;
    document.getElementById('ir-form-id').value = incidentId || '';
    document.getElementById('ir-form-title').value = i?.title || '';
    document.getElementById('ir-form-desc').value = i?.description || '';
    document.getElementById('ir-form-severity').value = i?.severity || 'medium';
    document.getElementById('ir-form-priority').value = i?.priority || 'P3';
    document.getElementById('ir-form-category').value = i?.category || (SD().CATEGORIES[0] || 'Malware');
    document.getElementById('ir-form-asset').value = i?.affectedAssetHostname || '';
    document.getElementById('ir-form-analyst').value = i?.assignedAnalyst || (SD().ANALYSTS[0] || '');
    document.getElementById('ir-form-status').value = i?.status || 'New';
    document.getElementById('ir-form-mitre').value = i?.mitre?.id || '';
    document.getElementById('ir-form-impact').value = i?.businessImpact || '';
    document.getElementById('ir-form-notes').value = (i?.notes || []).map(n => n.text).join('\n');
    document.getElementById('ir-modal-overlay').classList.add('open');
  }
  function _closeAddEditModal() { document.getElementById('ir-modal-overlay').classList.remove('open'); }

  function _saveIncidentForm() {
    const title = document.getElementById('ir-form-title').value.trim();
    const errEl = document.getElementById('ir-form-error');
    if (!title) { errEl.textContent = 'Incident title is required.'; return; }
    errEl.textContent = '';

    const id = document.getElementById('ir-form-id').value;
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const mitreId = document.getElementById('ir-form-mitre').value.trim();
    const category = document.getElementById('ir-form-category').value;
    const mitreLookup = SD().MITRE_BY_CATEGORY?.[category];

    const fields = {
      title, description: document.getElementById('ir-form-desc').value.trim() || '—',
      severity: document.getElementById('ir-form-severity').value, priority: document.getElementById('ir-form-priority').value,
      category, affectedAssetHostname: document.getElementById('ir-form-asset').value.trim() || 'Unassigned',
      assignedAnalyst: document.getElementById('ir-form-analyst').value, owner: document.getElementById('ir-form-analyst').value,
      status: document.getElementById('ir-form-status').value, updatedTime: now,
      mitre: mitreId ? { ...(mitreLookup || {}), id: mitreId } : (mitreLookup || null),
      businessImpact: document.getElementById('ir-form-impact').value.trim() || '—',
      department: 'IT Ops', detectionSource: 'Manual Entry',
      slaMinutes: 240, responseMinutes: 0, slaStatus: 'Met', resolutionTime: null,
      iocs: [], evidence: [], tasks: [],
      timeline: [{ time: now, event: id ? 'Incident Updated' : 'Incident Created', detail: id ? 'Fields updated by user.' : `${title} manually logged by analyst.` }],
      notes: document.getElementById('ir-form-notes').value.trim() ? [{ author: 'Current User', date: now.slice(0, 10), text: document.getElementById('ir-form-notes').value.trim() }] : [],
      recovery: { systemRestored: false, passwordReset: false, patchApplied: false, avScan: false, validationComplete: false, lessonsLearned: '' },
    };

    if (id) {
      const idx = customIncidents.findIndex(c => c.id === id);
      if (idx >= 0) customIncidents[idx] = { ...customIncidents[idx], ...fields };
      else overrides[id] = { ...(overrides[id] || {}), ...fields };
      window.NotificationManager?.success('Incident Updated', `${title} was updated.`);
    } else {
      customIncidents.push({ id: uid('INC').toUpperCase(), createdTime: now, ...fields });
      window.NotificationManager?.success('Incident Created', `${title} was logged.`);
    }
    _savePersisted();
    _closeAddEditModal();
    _renderAll();
  }

  // ══════════════════════════════════════════════════════════════════════
  // DELETE CONFIRMATION
  // ══════════════════════════════════════════════════════════════════════
  function _buildConfirmModal() {
    return `
    <div class="ai-modal-overlay" id="ir-confirm-overlay">
      <div class="ai-modal ai-modal-sm">
        <div class="ai-modal-header"><div class="ai-modal-title">Delete Incident</div><div class="ai-detail-close" id="ir-confirm-close">${svg('close')}</div></div>
        <div class="ai-modal-body"><p id="ir-confirm-text" style="color:var(--text-secondary);font-size:var(--text-sm);"></p></div>
        <div class="ai-modal-footer"><button class="btn btn-secondary" id="ir-confirm-cancel">Cancel</button><button class="btn btn-danger" id="ir-confirm-delete">Delete</button></div>
      </div>
    </div>`;
  }
  let pendingDeleteId = null;
  function _wireConfirmModal() {
    document.getElementById('ir-confirm-close')?.addEventListener('click', _closeConfirm);
    document.getElementById('ir-confirm-cancel')?.addEventListener('click', _closeConfirm);
    document.getElementById('ir-confirm-overlay')?.addEventListener('click', e => { if (e.target.id === 'ir-confirm-overlay') _closeConfirm(); });
    document.getElementById('ir-confirm-delete')?.addEventListener('click', () => {
      if (!pendingDeleteId) return;
      const i = findIncident(pendingDeleteId);
      if (customIncidents.some(c => c.id === pendingDeleteId)) customIncidents = customIncidents.filter(c => c.id !== pendingDeleteId);
      else deletedIds.add(pendingDeleteId);
      _savePersisted(); _closeConfirm(); _renderAll();
      window.NotificationManager?.success('Incident Deleted', i ? `${i.id} was removed.` : 'Incident removed.');
    });
  }
  function _confirmDelete(incidentId) {
    const i = findIncident(incidentId); if (!i) return;
    pendingDeleteId = incidentId;
    document.getElementById('ir-confirm-text').textContent = `Are you sure you want to delete "${i.id} — ${i.title}"? This cannot be undone.`;
    document.getElementById('ir-confirm-overlay').classList.add('open');
  }
  function _closeConfirm() { document.getElementById('ir-confirm-overlay').classList.remove('open'); pendingDeleteId = null; }

  // ══════════════════════════════════════════════════════════════════════
  // IMPORT (offline JSON / CSV, preview + validation)
  // ══════════════════════════════════════════════════════════════════════
  function _buildImportModal() {
    return `
    <div class="ai-modal-overlay" id="ir-import-overlay">
      <div class="ai-modal">
        <div class="ai-modal-header"><div class="ai-modal-title">Import Incidents</div><div class="ai-detail-close" id="ir-import-close">${svg('close')}</div></div>
        <div class="ai-modal-body">
          <p style="color:var(--text-secondary);font-size:var(--text-sm);margin-bottom:var(--space-3);">Paste JSON (array of incident objects with at least a <span class="mono">title</span> field) or CSV with a header row.</p>
          <textarea class="input" id="ir-import-text" rows="8" placeholder='[{"title":"New Phishing Report","severity":"high","category":"Phishing"}]' style="font-family:var(--font-mono);font-size:12px;"></textarea>
          <button class="btn btn-secondary btn-sm" id="ir-import-preview" style="margin-top:var(--space-3);">Preview</button>
          <div id="ir-import-preview-box" style="margin-top:var(--space-3);"></div>
        </div>
        <div class="ai-modal-footer"><button class="btn btn-secondary" id="ir-import-cancel">Cancel</button><button class="btn btn-primary" id="ir-import-confirm" disabled>Import</button></div>
      </div>
    </div>`;
  }
  let importPreviewRows = [];
  function _wireImportModal() {
    document.getElementById('ir-import-close')?.addEventListener('click', _closeImportModal);
    document.getElementById('ir-import-cancel')?.addEventListener('click', _closeImportModal);
    document.getElementById('ir-import-overlay')?.addEventListener('click', e => { if (e.target.id === 'ir-import-overlay') _closeImportModal(); });
    document.getElementById('ir-import-preview')?.addEventListener('click', _previewImport);
    document.getElementById('ir-import-confirm')?.addEventListener('click', _confirmImport);
  }
  function _openImportModal() {
    document.getElementById('ir-import-text').value = '';
    document.getElementById('ir-import-preview-box').innerHTML = '';
    document.getElementById('ir-import-confirm').disabled = true;
    importPreviewRows = [];
    document.getElementById('ir-import-overlay').classList.add('open');
  }
  function _closeImportModal() { document.getElementById('ir-import-overlay').classList.remove('open'); }

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
    const raw = document.getElementById('ir-import-text').value.trim();
    const box = document.getElementById('ir-import-preview-box');
    const confirmBtn = document.getElementById('ir-import-confirm');
    if (!raw) { box.innerHTML = `<div class="empty-state"><div class="empty-state-desc">Paste JSON or CSV data first.</div></div>`; confirmBtn.disabled = true; return; }
    let rows = [];
    try {
      if (raw.startsWith('[') || raw.startsWith('{')) { const parsed = JSON.parse(raw); rows = Array.isArray(parsed) ? parsed : [parsed]; }
      else rows = _parseCSV(raw);
    } catch (e) {
      box.innerHTML = `<div class="empty-state"><div class="empty-state-title">Parse Error</div><div class="empty-state-desc">${esc(e.message)}</div></div>`;
      confirmBtn.disabled = true; window.NotificationManager?.error('Import Error', 'Could not parse the provided data.'); return;
    }
    rows = rows.filter(r => r && r.title);
    if (!rows.length) { box.innerHTML = `<div class="empty-state"><div class="empty-state-desc">No valid rows found — each row needs at least a "title" field.</div></div>`; confirmBtn.disabled = true; return; }
    importPreviewRows = rows;
    box.innerHTML = `<div class="ti-result-count" style="margin-bottom:var(--space-2);">${rows.length} incident(s) ready to import</div>
      <div class="card"><div class="card-body" style="padding:0;max-height:220px;overflow:auto;">
      <table class="data-table"><thead><tr><th>Title</th><th>Severity</th><th>Category</th></tr></thead>
      <tbody>${rows.slice(0, 20).map(r => `<tr><td>${esc(r.title)}</td><td>${esc(r.severity || 'medium')}</td><td>${esc(r.category || 'Malware')}</td></tr>`).join('')}</tbody>
      </table></div></div>`;
    confirmBtn.disabled = false;
  }

  function _confirmImport() {
    if (!importPreviewRows.length) return;
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    importPreviewRows.forEach(r => {
      customIncidents.push({
        id: uid('INC').toUpperCase(), title: r.title, description: r.description || '—',
        severity: r.severity || 'medium', priority: r.priority || 'P3', category: r.category || 'Malware',
        affectedAssetHostname: r.affectedAssetHostname || r.asset || 'Unassigned',
        assignedAnalyst: r.assignedAnalyst || 'Unassigned', owner: r.assignedAnalyst || 'Unassigned',
        status: r.status || 'New', department: r.department || 'IT Ops', detectionSource: r.detectionSource || 'Imported',
        createdTime: now, updatedTime: now, slaMinutes: 240, responseMinutes: 0, slaStatus: 'Met', resolutionTime: null,
        mitre: r.mitreId ? { id: r.mitreId, tactic: '', technique: '', detectionLogic: '', recommendations: '' } : null,
        businessImpact: r.businessImpact || '—', iocs: [], evidence: [], tasks: [],
        timeline: [{ time: now, event: 'Incident Created', detail: `${r.title} imported into inventory.` }], notes: [],
        recovery: { systemRestored: false, passwordReset: false, patchApplied: false, avScan: false, validationComplete: false, lessonsLearned: '' },
      });
    });
    _savePersisted(); _closeImportModal(); _renderAll();
    window.NotificationManager?.success('Import Complete', `${importPreviewRows.length} incident(s) imported.`);
    importPreviewRows = [];
  }

  // ══════════════════════════════════════════════════════════════════════
  // EXPORT (CSV / JSON / Executive Summary / Technical Report / PDF placeholder)
  // ══════════════════════════════════════════════════════════════════════
  function _download(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function _exportCSV() {
    const rows = _filteredSorted();
    const header = ['id', 'title', 'severity', 'status', 'category', 'affectedAssetHostname', 'assignedAnalyst', 'priority', 'createdTime', 'updatedTime', 'slaStatus'];
    const csv = [header.join(','), ...rows.map(i => header.map(k => `"${String(i[k] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    _download('incident-report.csv', csv, 'text/csv');
  }
  function _exportJSON() {
    _download('incident-report.json', JSON.stringify(_filteredSorted(), null, 2), 'application/json');
  }
  function _exportExecutiveSummary() {
    const s = _computeStats(); const list = allIncidents();
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>IR Executive Summary</title>
      <style>body{font-family:-apple-system,sans-serif;max-width:900px;margin:40px auto;color:#0f172a;}
      table{width:100%;border-collapse:collapse;margin:16px 0;} th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:13px;} th{background:#f1f5f9;}
      h1{font-size:22px;} h2{font-size:16px;margin-top:28px;} .warn{background:#fef3c7;padding:10px;border-radius:6px;font-size:12px;}</style></head><body>
      <h1>Incident Response — Executive Summary</h1>
      <div class="warn">⚠ Educational simulation — offline synthetic incident data. PDF export is a placeholder; this HTML report can be printed to PDF from your browser.</div>
      <p><strong>${s.open}</strong> open incidents (${s.critical} critical, ${s.high} high). Containment rate: <strong>${s.containmentRate}%</strong>.
      Average response time: <strong>${s.avgResponse} minutes</strong>. Average resolution time: <strong>${s.avgResolutionHrs} hours</strong>.</p>
      <h2>Top Open Incidents</h2>
      <table><tr><th>ID</th><th>Title</th><th>Severity</th><th>Status</th></tr>
      ${list.filter(i => !['Resolved', 'Closed', 'False Positive'].includes(i.status)).sort((a, b) => (SD().SEVERITIES.indexOf(a.severity) - SD().SEVERITIES.indexOf(b.severity))).slice(0, 15).map(i => `<tr><td>${esc(i.id)}</td><td>${esc(i.title)}</td><td>${esc(i.severity)}</td><td>${esc(i.status)}</td></tr>`).join('')}
      </table>
      <p style="color:#64748b;font-size:11px;margin-top:24px;">Generated by Khan Security Solutions Enterprise · ${new Date().toLocaleString()}</p>
      </body></html>`;
    _download('ir-executive-summary.html', html, 'text/html');
  }
  function _exportTechnicalReport() {
    const list = allIncidents();
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>IR Technical Report</title>
      <style>body{font-family:-apple-system,sans-serif;max-width:960px;margin:40px auto;color:#0f172a;}
      table{width:100%;border-collapse:collapse;margin:16px 0;} th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:12px;} th{background:#f1f5f9;}
      h1{font-size:22px;} .warn{background:#fef3c7;padding:10px;border-radius:6px;font-size:12px;}</style></head><body>
      <h1>Incident Response — Technical Report</h1>
      <div class="warn">⚠ Educational simulation — offline synthetic incident data. PDF export is a placeholder; print this HTML to PDF from your browser.</div>
      <table><tr><th>ID</th><th>Title</th><th>Category</th><th>MITRE</th><th>Severity</th><th>Status</th><th>Analyst</th><th>Asset</th></tr>
      ${list.map(i => `<tr><td>${esc(i.id)}</td><td>${esc(i.title)}</td><td>${esc(i.category)}</td><td>${esc(i.mitre?.id || '—')}</td><td>${esc(i.severity)}</td><td>${esc(i.status)}</td><td>${esc(i.assignedAnalyst)}</td><td>${esc(i.affectedAssetHostname)}</td></tr>`).join('')}
      </table>
      <p style="color:#64748b;font-size:11px;margin-top:24px;">Generated by Khan Security Solutions Enterprise · ${new Date().toLocaleString()}</p>
      </body></html>`;
    _download('ir-technical-report.html', html, 'text/html');
  }
  function _generateTimelineReport() {
    const list = allIncidents().slice().sort((a, b) => new Date(a.createdTime) - new Date(b.createdTime));
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>IR Timeline</title>
      <style>body{font-family:-apple-system,sans-serif;max-width:900px;margin:40px auto;color:#0f172a;}
      .item{border-left:2px solid #2563eb;padding-left:16px;margin-bottom:16px;} .meta{color:#64748b;font-size:12px;}</style></head><body>
      <h1>Incident Timeline — All Incidents</h1>
      ${list.map(i => `<div class="item"><strong>${esc(i.id)} — ${esc(i.title)}</strong><div class="meta">${esc(i.createdTime)} · ${esc(i.severity)} · ${esc(i.status)}</div></div>`).join('')}
      <p style="color:#64748b;font-size:11px;margin-top:24px;">Generated by Khan Security Solutions Enterprise · ${new Date().toLocaleString()}</p>
      </body></html>`;
    _download('ir-timeline.html', html, 'text/html');
    window.NotificationManager?.success('Timeline Generated', 'Incident timeline exported as HTML.');
  }

  // Replace the earlier no-op stub with the real chooser now that export fns exist
  function _openExportChoiceReal() {
    const choice = window.confirm('Click OK for Executive Summary, or Cancel for Technical Report + CSV + JSON.');
    if (choice) _exportExecutiveSummary();
    else { _exportTechnicalReport(); _exportCSV(); _exportJSON(); }
    window.NotificationManager?.success('Report Exported', 'Incident report generated.');
  }

  // ══════════════════════════════════════════════════════════════════════
  // NOTES delegate (drawer body is re-rendered per tab, so delegate on doc)
  // ══════════════════════════════════════════════════════════════════════
  document.addEventListener('click', e => {
    if (e.target && e.target.id === 'ir-note-add') {
      const text = document.getElementById('ir-note-text')?.value.trim();
      if (!text || !drawerIncidentId) return;
      const note = { author: 'Current User', date: new Date().toISOString().slice(0, 10), text };
      const idx = customIncidents.findIndex(c => c.id === drawerIncidentId);
      if (idx >= 0) customIncidents[idx].notes = [...(customIncidents[idx].notes || []), note];
      else {
        const base = SD().getIncident(drawerIncidentId);
        const existing = (overrides[drawerIncidentId] && overrides[drawerIncidentId].notes) || (base ? base.notes : []) || [];
        overrides[drawerIncidentId] = { ...(overrides[drawerIncidentId] || {}), notes: [...existing, note] };
      }
      _savePersisted();
      window.NotificationManager?.success('Note Added', '');
      _renderDrawerTab('notes');
    }
  });

  // ══════════════════════════════════════════════════════════════════════
  // PERSISTENCE
  // ══════════════════════════════════════════════════════════════════════
  function _loadPersisted() {
    if (!window.StorageManager) return;
    customIncidents = window.StorageManager.lsGet('ir_custom_incidents', []) || [];
    deletedIds = new Set(window.StorageManager.lsGet('ir_deleted_ids', []) || []);
    overrides = window.StorageManager.lsGet('ir_overrides', {}) || {};
  }
  function _savePersisted() {
    window.StorageManager?.lsSet('ir_custom_incidents', customIncidents);
    window.StorageManager?.lsSet('ir_deleted_ids', [...deletedIds]);
    window.StorageManager?.lsSet('ir_overrides', overrides);
  }

  // ══════════════════════════════════════════════════════════════════════
  // SEARCH
  // ══════════════════════════════════════════════════════════════════════
  function _registerSearch() {
    if (!window.SearchEngine) return;
    window.SearchEngine.register('Incident Response', [
      { title: 'Incident Response Center', meta: 'SOC incidents, MITRE mapping, tasks, recovery', route: 'incident-response', keywords: 'incident response soc ransomware phishing credential theft lateral movement mitre' },
      ...SD().incidents.map(i => ({ title: i.id, meta: `${i.title} — ${i.severity}`, route: 'incident-response', keywords: `${i.id} ${i.title} ${i.category} ${i.severity} ${i.affectedAssetHostname} ${i.department} ${i.assignedAnalyst}` })),
    ]);
  }

  // ── Public API ─────────────────────────────────────────────────────────
  return { register };

})();

window.IncidentResponse = IncidentResponse;

if (window.Router) {
  IncidentResponse.register();
} else {
  console.error('[IncidentResponse] Router not found. Ensure router.js loads before incident-response.js.');
}
