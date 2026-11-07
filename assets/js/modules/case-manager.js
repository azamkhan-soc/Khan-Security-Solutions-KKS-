/**
 * KHAN SECURITY SOLUTIONS ENTERPRISE
 * Enterprise Security Case Manager — Module v1.4.0
 *
 * Offline SOC case management: animated stat dashboard, pure-SVG charts,
 * a real-time filterable/sortable/paginated case table (100 bundled
 * cases), a tabbed detail drawer (Overview, Timeline, Tasks [Kanban],
 * Evidence, IOCs, Assets, Incidents, MITRE, Notes, Reports),
 * Create/Edit/Delete, and offline JSON/CSV import & export.
 *
 * [EDUCATIONAL SIMULATION — Ships with 100 deterministically generated
 *  synthetic cases. Evidence types Memory Dump/Disk Image/PCAP are clearly
 *  labeled PLACEHOLDER references, not real forensic artifacts. Everything
 *  is stored locally via StorageManager; there is no backend.]
 *
 * Integrates with:
 *   window.Router               — route: 'case-manager'
 *   window.SearchEngine         — searchable content
 *   window.NotificationManager  — alerts and feedback
 *   window.StorageManager       — case persistence (localStorage)
 *   window.SampleCaseData       — bundled sample dataset
 *   window.SampleIncidentData   — cross-referenced for Incidents tab
 *   window.SampleAssetData      — cross-referenced for Assets tab
 *   window.SampleIOCData        — cross-referenced for IOCs tab
 */

const CaseManager = (() => {

  // ── State ──────────────────────────────────────────────────────────────
  let mounted     = false;
  let customCases   = [];
  let deletedIds       = new Set();
  let overrides           = {};

  let filters = { q: '', priority: 'all', severity: 'all', status: 'all', analyst: 'all', category: 'all', department: 'all' };
  let sortKey = 'createdDate', sortDir = 'desc';
  let currentPage = 1;
  const PAGE_SIZE = 10;

  // ── Icons ──────────────────────────────────────────────────────────────
  const I = {
    shield:   `<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>`,
    warn:     `<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>`,
    check:    `<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>`,
    clock:    `<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>`,
    plus:     `<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>`,
    upload:   `<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>`,
    down:     `<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>`,
    report:   `<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"/>`,
    search:   `<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z"/>`,
    close:    `<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>`,
    edit:     `<path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"/>`,
    trash:    `<path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>`,
    map:      `<path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"/>`,
    evidence: `<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/>`,
    hash:     `<path stroke-linecap="round" stroke-linejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5"/>`,
    server:   `<path stroke-linecap="round" stroke-linejoin="round" d="M21.75 17.25v-.228a4.5 4.5 0 00-.12-1.03l-2.268-9.64a3.375 3.375 0 00-3.285-2.602H7.923a3.375 3.375 0 00-3.285 2.602l-2.268 9.64a4.5 4.5 0 00-.12 1.03v.228m19.5 0a3 3 0 01-3 3H5.25a3 3 0 01-3-3m19.5 0a3 3 0 00-3-3H5.25a3 3 0 00-3 3m16.5 0h.008v.008h-.008v-.008zm-3 0h.008v.008h-.008v-.008z"/>`,
    chevronUp:  `<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5"/>`,
    chevronDown:`<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>`,
  };
  function svg(name, cls = '') { return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">${I[name] || I.shield}</svg>`; }
  function esc(s) { const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function uid(prefix) { return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`; }

  const SD = () => window.SampleCaseData || { cases: [], CATEGORIES: [], PRIORITIES: [], SEVERITIES: [], STATUSES: [], ANALYSTS: [], DEPARTMENTS: [], TASK_COLUMNS: ['To Do', 'In Progress', 'Review', 'Completed'], getCase: () => null };
  const ID_INC = () => window.SampleIncidentData || { getIncident: () => null };
  const AD = () => window.SampleAssetData || { assets: [] };
  const IOD = () => window.SampleIOCData || { getIOC: () => null };

  function allCases() {
    const base = SD().cases.filter(c => !deletedIds.has(c.id)).map(c => overrides[c.id] ? { ...c, ...overrides[c.id] } : c);
    return [...base, ...customCases];
  }
  function findCase(id) { return allCases().find(c => c.id === id) || null; }

  const PRI_CLS = { Critical: 'badge-danger', High: 'badge-high', Medium: 'badge-medium', Low: 'badge-low' };
  const SEV_CLS = { critical: 'badge-danger', high: 'badge-high', medium: 'badge-medium', low: 'badge-low', informational: 'badge-neutral' };
  const STATUS_CLS = {
    New: 'badge-info', Assigned: 'badge-info', Investigating: 'badge-warning', Containment: 'badge-warning',
    Eradication: 'badge-warning', Recovery: 'badge-info', Resolved: 'badge-success', Closed: 'badge-neutral',
    'False Positive': 'badge-neutral', Archived: 'badge-neutral',
  };

  // ══════════════════════════════════════════════════════════════════════
  // ROUTE REGISTRATION
  // ══════════════════════════════════════════════════════════════════════
  function register() { window.Router.register('case-manager', { title: 'Case Manager', init, render }); }
  function init() { _loadPersisted(); _registerSearch(); }
  function render() {
    const el = document.getElementById('page-case-manager');
    if (!el) return;
    if (!mounted) { el.innerHTML = _buildShell(); mounted = true; _wireAll(); _animateStats(); }
    else _renderAll();
  }

  // ══════════════════════════════════════════════════════════════════════
  // SHELL
  // ══════════════════════════════════════════════════════════════════════
  function _buildShell() {
    return `
    <div class="cm-shell">
      <div class="cm-header">
        <div>
          <div class="cm-header-title">Enterprise Security Case Manager</div>
          <div class="cm-header-sub">Manage complete cybersecurity investigations, analyst assignments and case lifecycles.</div>
        </div>
        <div class="cm-header-actions">
          <button class="btn btn-secondary btn-sm" id="cm-btn-import">${svg('upload')} Import Cases</button>
          <button class="btn btn-secondary btn-sm" id="cm-btn-export">${svg('down')} Export Case</button>
          <button class="btn btn-secondary btn-sm" id="cm-btn-report">${svg('report')} Generate Report</button>
          <button class="btn btn-primary btn-sm" id="cm-btn-add">${svg('plus')} Create Case</button>
        </div>
      </div>

      <div class="cm-body">
        <div class="grid grid-stats cm-stats" id="cm-stats"></div>

        <div class="ir-charts-grid">
          <div class="card"><div class="card-header"><div class="card-title">Cases by Status</div></div><div class="card-body"><svg id="cm-chart-status" viewBox="0 0 300 180" class="ai-chart-svg"></svg></div></div>
          <div class="card"><div class="card-header"><div class="card-title">Cases by Priority</div></div><div class="card-body"><svg id="cm-chart-priority" viewBox="0 0 300 180" class="ai-chart-svg"></svg></div></div>
          <div class="card"><div class="card-header"><div class="card-title">Cases by Analyst</div></div><div class="card-body"><svg id="cm-chart-analyst" viewBox="0 0 300 180" class="ai-chart-svg"></svg></div></div>
          <div class="card"><div class="card-header"><div class="card-title">Cases by Category</div></div><div class="card-body"><svg id="cm-chart-category" viewBox="0 0 300 180" class="ai-chart-svg"></svg></div></div>
          <div class="card"><div class="card-header"><div class="card-title">Monthly Trend</div></div><div class="card-body"><svg id="cm-chart-trend" viewBox="0 0 300 180" class="ai-chart-svg"></svg></div></div>
          <div class="card"><div class="card-header"><div class="card-title">Avg. Response Time by Priority (hrs)</div></div><div class="card-body"><svg id="cm-chart-response" viewBox="0 0 300 180" class="ai-chart-svg"></svg></div></div>
        </div>

        <div class="card ai-filter-card">
          <div class="card-body">
            <div class="ai-filter-bar">
              <div class="ti-search-box" style="flex:2;min-width:220px;">
                ${svg('search', 'cm-inline-icon')}
                <input type="text" id="cm-f-search" placeholder="Search title, category, analyst, department…" />
              </div>
              <select class="input ai-filter-select" id="cm-f-priority"><option value="all">All Priorities</option></select>
              <select class="input ai-filter-select" id="cm-f-severity"><option value="all">All Severities</option></select>
              <select class="input ai-filter-select" id="cm-f-status"><option value="all">All Statuses</option></select>
              <select class="input ai-filter-select" id="cm-f-analyst"><option value="all">All Analysts</option></select>
              <select class="input ai-filter-select" id="cm-f-category"><option value="all">All Categories</option></select>
              <select class="input ai-filter-select" id="cm-f-department"><option value="all">All Departments</option></select>
              <button class="btn btn-secondary btn-sm" id="cm-f-clear">${svg('close')} Clear</button>
            </div>
          </div>
        </div>

        <div class="ai-result-count" id="cm-result-count"></div>
        <div class="card ai-table-card">
          <div class="card-body" style="padding:0;overflow-x:auto;">
            <table class="data-table ai-table">
              <thead>
                <tr>
                  <th data-sort="id">Case ID</th><th data-sort="title">Title</th><th data-sort="priority">Priority</th>
                  <th data-sort="severity">Severity</th><th data-sort="status">Status</th><th data-sort="assignedAnalyst">Analyst</th>
                  <th data-sort="category">Category</th><th data-sort="department">Department</th>
                  <th data-sort="createdDate">Created</th><th data-sort="dueDate">Due</th>
                  <th>Related Incident</th><th data-sort="riskScore">Risk Score</th><th></th>
                </tr>
              </thead>
              <tbody id="cm-table-body"></tbody>
            </table>
          </div>
          <div class="ai-pagination" id="cm-pagination"></div>
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
    document.getElementById('cm-btn-import')?.addEventListener('click', _openImportModal);
    document.getElementById('cm-btn-export')?.addEventListener('click', _exportCurrent);
    document.getElementById('cm-btn-report')?.addEventListener('click', _openReportChoice);
    document.getElementById('cm-btn-add')?.addEventListener('click', () => _openAddEditModal(null));

    document.getElementById('cm-f-search')?.addEventListener('input', e => { filters.q = e.target.value; currentPage = 1; _renderAll(); });
    ['priority', 'severity', 'status', 'analyst', 'category', 'department'].forEach(key => {
      document.getElementById(`cm-f-${key}`)?.addEventListener('change', e => { filters[key] = e.target.value; currentPage = 1; _renderAll(); });
    });
    document.getElementById('cm-f-clear')?.addEventListener('click', () => {
      filters = { q: '', priority: 'all', severity: 'all', status: 'all', analyst: 'all', category: 'all', department: 'all' };
      document.getElementById('cm-f-search').value = '';
      document.querySelectorAll('#page-case-manager .ai-filter-select').forEach(sel => sel.value = 'all');
      currentPage = 1; _renderAll();
    });
    document.querySelectorAll('#page-case-manager .ai-table thead th[data-sort]').forEach(th => {
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
  // STATS (animated)
  // ══════════════════════════════════════════════════════════════════════
  function _computeStats() {
    const list = allCases();
    const open = list.filter(c => !['Resolved', 'Closed', 'Archived', 'False Positive'].includes(c.status)).length;
    const critical = list.filter(c => c.priority === 'Critical').length;
    const high = list.filter(c => c.priority === 'High').length;
    const thisMonth = list.filter(c => (c.createdDate || '').slice(0, 7) === new Date().toISOString().slice(0, 7)).length;
    const resolved = list.filter(c => ['Resolved', 'Closed'].includes(c.status)).length;
    const closedList = list.filter(c => c.resolutionDate);
    const avgResolutionHrs = closedList.length ? Math.round(closedList.reduce((s, c) => s + Math.max(0, (new Date(c.updatedDate) - new Date(c.createdDate)) / 3600000), 0) / closedList.length) : 0;
    const workload = {};
    list.filter(c => !['Resolved', 'Closed', 'Archived', 'False Positive'].includes(c.status)).forEach(c => { workload[c.assignedAnalyst] = (workload[c.assignedAnalyst] || 0) + 1; });
    const maxWorkload = Object.values(workload).length ? Math.max(...Object.values(workload)) : 0;
    const pendingTasks = list.reduce((s, c) => s + (c.tasks || []).filter(t => t.status !== 'Completed').length, 0);
    const evidenceTotal = list.reduce((s, c) => s + (c.evidence || []).length, 0);
    const iocsLinked = list.reduce((s, c) => s + (c.linkedIocIds || []).length, 0);
    const incidentsLinked = list.filter(c => c.relatedIncidentHint).length;
    return { open, critical, high, thisMonth, resolved, avgResolutionHrs, maxWorkload, pendingTasks, evidenceTotal, iocsLinked, incidentsLinked };
  }

  function _buildStatsHTML(s) {
    const cards = [
      ['Open Cases', s.open, 'shield', 'var(--color-primary)'],
      ['Critical Cases', s.critical, 'warn', 'var(--color-danger)'],
      ['High Priority', s.high, 'warn', '#f97316'],
      ['Cases This Month', s.thisMonth, 'clock', 'var(--color-info)'],
      ['Resolved Cases', s.resolved, 'check', 'var(--color-success)'],
      ['Avg. Resolution Time', s.avgResolutionHrs + ' hrs', 'clock', 'var(--color-primary)'],
      ['Peak Analyst Workload', s.maxWorkload, 'server', '#a78bfa'],
      ['Pending Tasks', s.pendingTasks, 'report', 'var(--color-warning)'],
      ['Evidence Collected', s.evidenceTotal, 'evidence', 'var(--color-info)'],
      ['IOCs Linked', s.iocsLinked, 'hash', 'var(--color-danger)'],
      ['Incidents Linked', s.incidentsLinked, 'warn', 'var(--color-warning)'],
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
    document.getElementById('cm-stats').innerHTML = _buildStatsHTML(s);
    document.querySelectorAll('#cm-stats .ai-count').forEach(el => {
      const target = parseInt(el.dataset.target, 10) || 0;
      const suffix = el.dataset.suffix || '';
      let current = 0;
      const step = Math.max(1, Math.ceil(target / 24));
      const timer = setInterval(() => { current = Math.min(target, current + step); el.textContent = current + suffix; if (current >= target) clearInterval(timer); }, 20);
    });
    _renderCharts();
  }
  function _refreshStatsStatic() {
    const s = _computeStats();
    const values = [s.open, s.critical, s.high, s.thisMonth, s.resolved, s.avgResolutionHrs + ' hrs', s.maxWorkload, s.pendingTasks, s.evidenceTotal, s.iocsLinked, s.incidentsLinked];
    document.querySelectorAll('#cm-stats .ai-count').forEach((el, idx) => { el.textContent = values[idx]; });
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
    const list = allCases();
    _renderBarChart('cm-chart-status', _groupCount(list, c => c.status));
    _renderPieChart('cm-chart-priority', _groupCount(list, c => c.priority));
    _renderBarChart('cm-chart-analyst', _groupCount(list, c => c.assignedAnalyst));
    _renderBarChart('cm-chart-category', _groupCount(list, c => c.category));
    const months = [];
    for (let m = 5; m >= 0; m--) { const d = new Date(); d.setMonth(d.getMonth() - m); months.push(d.toISOString().slice(0, 7)); }
    const trendPoints = months.map(m => ({ label: m.slice(5), value: list.filter(c => (c.createdDate || '').slice(0, 7) === m).length }));
    _renderLineChart('cm-chart-trend', trendPoints);
    const prOrder = ['Critical', 'High', 'Medium', 'Low'];
    const respData = prOrder.map(p => {
      const items = list.filter(c => c.priority === p && c.resolutionDate);
      const avg = items.length ? Math.round(items.reduce((s, c) => s + Math.max(0, (new Date(c.updatedDate) - new Date(c.createdDate)) / 3600000), 0) / items.length) : 0;
      return [p, avg];
    }).filter(([, v]) => v > 0);
    _renderBarChart('cm-chart-response', respData);
  }

  // ══════════════════════════════════════════════════════════════════════
  // FILTER OPTIONS / TABLE
  // ══════════════════════════════════════════════════════════════════════
  function _populateFilterOptions() {
    const d = SD(); const list = allCases();
    const opts = (id, values) => {
      const sel = document.getElementById(id); if (!sel) return;
      const current = sel.value;
      sel.innerHTML = sel.options[0].outerHTML + [...new Set(values)].filter(Boolean).sort().map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
      sel.value = current || 'all';
    };
    opts('cm-f-priority', d.PRIORITIES.length ? d.PRIORITIES : list.map(c => c.priority));
    opts('cm-f-severity', d.SEVERITIES.length ? d.SEVERITIES : list.map(c => c.severity));
    opts('cm-f-status', d.STATUSES.length ? d.STATUSES : list.map(c => c.status));
    opts('cm-f-analyst', d.ANALYSTS.length ? d.ANALYSTS : list.map(c => c.assignedAnalyst));
    opts('cm-f-category', d.CATEGORIES.length ? d.CATEGORIES : list.map(c => c.category));
    opts('cm-f-department', d.DEPARTMENTS.length ? d.DEPARTMENTS : list.map(c => c.department));
  }

  function _filteredSorted() {
    const q = filters.q.trim().toLowerCase();
    let rows = allCases().filter(c => {
      if (filters.priority !== 'all' && c.priority !== filters.priority) return false;
      if (filters.severity !== 'all' && c.severity !== filters.severity) return false;
      if (filters.status !== 'all' && c.status !== filters.status) return false;
      if (filters.analyst !== 'all' && c.assignedAnalyst !== filters.analyst) return false;
      if (filters.category !== 'all' && c.category !== filters.category) return false;
      if (filters.department !== 'all' && c.department !== filters.department) return false;
      if (q) {
        const hay = [c.id, c.title, c.category, c.assignedAnalyst, c.department, c.status].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    rows.sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (sortKey === 'createdDate' || sortKey === 'dueDate') { av = new Date(av).getTime(); bv = new Date(bv).getTime(); }
      else if (sortKey === 'riskScore') { av = a.riskScore || 0; bv = b.riskScore || 0; }
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

    document.getElementById('cm-result-count').textContent = `${total} of ${allCases().length} cases`;
    document.querySelectorAll('#page-case-manager .ai-table thead th[data-sort]').forEach(th => {
      th.classList.toggle('sorted', th.dataset.sort === sortKey);
      th.dataset.dir = th.dataset.sort === sortKey ? sortDir : '';
    });

    const tbody = document.getElementById('cm-table-body');
    if (!slice.length) {
      tbody.innerHTML = `<tr><td colspan="13"><div class="empty-state"><div class="empty-state-title">No cases match</div><div class="empty-state-desc">Try clearing filters or your search term.</div></div></td></tr>`;
    } else {
      tbody.innerHTML = slice.map(c => `
        <tr class="ai-row" data-id="${c.id}">
          <td class="mono">${esc(c.id)}</td>
          <td><strong>${esc(_truncate(c.title, 40))}</strong></td>
          <td><span class="badge ${PRI_CLS[c.priority] || 'badge-neutral'}">${esc(c.priority)}</span></td>
          <td><span class="badge ${SEV_CLS[c.severity] || 'badge-neutral'}">${esc(c.severity)}</span></td>
          <td><span class="badge ${STATUS_CLS[c.status] || 'badge-neutral'}">${esc(c.status)}</span></td>
          <td>${esc(c.assignedAnalyst)}</td><td>${esc(c.category)}</td><td>${esc(c.department)}</td>
          <td class="mono" style="font-size:11px;">${esc(c.createdDate)}</td>
          <td class="mono" style="font-size:11px;">${esc(c.dueDate)}</td>
          <td>${c.relatedIncidentHint ? `<span class="badge badge-info mono">${esc(c.relatedIncidentHint)}</span>` : '<span style="color:var(--text-tertiary);">—</span>'}</td>
          <td class="mono">${c.riskScore}</td>
          <td class="ai-actions-cell">
            <button class="btn-icon cm-edit-btn" data-id="${c.id}" title="Edit">${svg('edit')}</button>
            <button class="btn-icon cm-del-btn" data-id="${c.id}" title="Delete">${svg('trash')}</button>
          </td>
        </tr>`).join('');
    }
    tbody.querySelectorAll('.ai-row').forEach(tr => tr.addEventListener('click', e => {
      if (e.target.closest('.cm-edit-btn') || e.target.closest('.cm-del-btn')) return;
      _openDrawer(tr.dataset.id);
    }));
    tbody.querySelectorAll('.cm-edit-btn').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); _openAddEditModal(btn.dataset.id); }));
    tbody.querySelectorAll('.cm-del-btn').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); _confirmDelete(btn.dataset.id); }));

    _renderPagination(pages);
  }

  function _renderPagination(pages) {
    const box = document.getElementById('cm-pagination'); if (!box) return;
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
  // DETAIL DRAWER — 10 tabs
  // ══════════════════════════════════════════════════════════════════════
  function _buildDrawer() {
    return `
    <div class="ai-drawer-overlay" id="cm-drawer-overlay">
      <div class="ai-drawer" id="cm-drawer" style="max-width:760px;">
        <div class="ai-drawer-header">
          <div><div class="ai-drawer-title" id="cm-drawer-title">Case</div><div class="ai-drawer-sub" id="cm-drawer-sub"></div></div>
          <div class="ai-drawer-close" id="cm-drawer-close">${svg('close')}</div>
        </div>
        <div class="ai-drawer-tabs">
          <div class="ai-drawer-tab active" data-dtab="overview">Overview</div>
          <div class="ai-drawer-tab" data-dtab="timeline">Timeline</div>
          <div class="ai-drawer-tab" data-dtab="tasks">Tasks</div>
          <div class="ai-drawer-tab" data-dtab="evidence">Evidence</div>
          <div class="ai-drawer-tab" data-dtab="iocs">IOCs</div>
          <div class="ai-drawer-tab" data-dtab="assets">Assets</div>
          <div class="ai-drawer-tab" data-dtab="incidents">Incidents</div>
          <div class="ai-drawer-tab" data-dtab="mitre">MITRE</div>
          <div class="ai-drawer-tab" data-dtab="notes">Notes</div>
          <div class="ai-drawer-tab" data-dtab="reports">Reports</div>
        </div>
        <div class="ai-drawer-body" id="cm-drawer-body"></div>
      </div>
    </div>`;
  }

  function _wireDrawer() {
    document.getElementById('cm-drawer-close')?.addEventListener('click', _closeDrawer);
    document.getElementById('cm-drawer-overlay')?.addEventListener('click', e => { if (e.target.id === 'cm-drawer-overlay') _closeDrawer(); });
    document.querySelectorAll('#cm-drawer .ai-drawer-tab').forEach(tab => tab.addEventListener('click', () => {
      document.querySelectorAll('#cm-drawer .ai-drawer-tab').forEach(t => t.classList.toggle('active', t === tab));
      _renderDrawerTab(tab.dataset.dtab);
    }));
  }

  let drawerCaseId = null;
  function _openDrawer(caseId) {
    drawerCaseId = caseId;
    const c = findCase(caseId); if (!c) return;
    document.getElementById('cm-drawer-title').textContent = `${c.id} — ${c.title}`;
    document.getElementById('cm-drawer-sub').textContent = `${c.category} · ${c.assignedAnalyst} · ${c.status}`;
    document.querySelectorAll('#cm-drawer .ai-drawer-tab').forEach(t => t.classList.toggle('active', t.dataset.dtab === 'overview'));
    _renderDrawerTab('overview');
    document.getElementById('cm-drawer-overlay').classList.add('open');
  }
  function _closeDrawer() { document.getElementById('cm-drawer-overlay').classList.remove('open'); drawerCaseId = null; }

  function _renderDrawerTab(tab) {
    const c = findCase(drawerCaseId);
    const body = document.getElementById('cm-drawer-body');
    if (!c || !body) return;
    const map = { overview: _drOverview, timeline: _drTimeline, tasks: _drTasks, evidence: _drEvidence, iocs: _drIocs, assets: _drAssets, incidents: _drIncidents, mitre: _drMitre, notes: _drNotes, reports: _drReports };
    body.innerHTML = (map[tab] || _drOverview)(c);
    if (tab === 'tasks') _wireKanban(c);
  }

  function _field(label, value) {
    return `<div class="ai-detail-field"><div class="ai-detail-field-label">${esc(label)}</div><div class="ai-detail-field-value">${value == null || value === '' ? '<span style="color:var(--text-tertiary);">—</span>' : esc(String(value))}</div></div>`;
  }

  function _drOverview(c) {
    return `
      <div class="ti-tag-row" style="margin-bottom:var(--space-4);">
        <span class="badge ${PRI_CLS[c.priority] || 'badge-neutral'}">${esc(c.priority)}</span>
        <span class="badge ${SEV_CLS[c.severity] || 'badge-neutral'}">${esc(c.severity)}</span>
        <span class="badge ${STATUS_CLS[c.status] || 'badge-neutral'}">${esc(c.status)}</span>
        <span class="badge badge-neutral">Risk ${c.riskScore}</span>
      </div>
      <div class="ai-detail-sub-title">Description</div>
      <p style="font-size:var(--text-sm);color:var(--text-secondary);line-height:1.6;">${esc(c.description)}</p>
      <div class="ai-detail-sub-title">Business Impact</div>
      <p style="font-size:var(--text-sm);color:var(--text-secondary);line-height:1.6;">${esc(c.businessImpact)}</p>
      <div class="ai-detail-grid">
        ${_field('Owner', c.owner)} ${_field('Assigned Analyst', c.assignedAnalyst)}
        ${_field('Department', c.department)} ${_field('Created', c.createdDate)}
        ${_field('Updated', c.updatedDate)} ${_field('Resolution', c.resolutionDate)}
      </div>`;
  }

  function _drTimeline(c) {
    return (c.timeline || []).map(t => `
      <div class="ai-timeline-row"><div class="ai-timeline-dot"></div>
        <div><div class="ai-timeline-head"><strong>${esc(t.event)}</strong> <span style="color:var(--text-tertiary);">— ${esc(t.time)}</span></div>
        <div class="ai-timeline-detail">${esc(t.detail)}</div></div>
      </div>`).join('') || '<div style="color:var(--text-tertiary);font-size:var(--text-sm);">No timeline recorded.</div>';
  }

  // ── Tasks — Kanban board ─────────────────────────────────────────────
  function _drTasks(c) {
    const cols = (SD().TASK_COLUMNS || ['To Do', 'In Progress', 'Review', 'Completed']);
    return `<div class="cm-kanban">
      ${cols.map(col => `
        <div class="cm-kanban-col" data-col="${esc(col)}">
          <div class="cm-kanban-col-header">${esc(col)} <span class="cm-kanban-count">${(c.tasks || []).filter(t => t.status === col).length}</span></div>
          <div class="cm-kanban-col-body" data-col="${esc(col)}">
            ${(c.tasks || []).filter(t => t.status === col).map(t => `
              <div class="cm-task-card" data-task="${t.id}">
                <div class="cm-task-title">${esc(t.title)}</div>
                <div class="cm-task-meta"><span class="badge ${PRI_CLS[t.priority] || 'badge-neutral'}">${esc(t.priority)}</span> ${esc(t.owner)}</div>
                <div class="cm-task-progress-track"><div class="cm-task-progress-fill" style="width:${t.completion}%;"></div></div>
                <div class="cm-task-due">Due ${esc(t.dueDate)}</div>
                <select class="input cm-task-move" data-task="${t.id}" style="margin-top:var(--space-2);font-size:11px;padding:4px 6px;">
                  ${cols.map(c2 => `<option value="${esc(c2)}" ${c2 === col ? 'selected' : ''}>${esc(c2)}</option>`).join('')}
                </select>
              </div>`).join('')}
          </div>
        </div>`).join('')}
    </div>`;
  }
  function _wireKanban(c) {
    document.querySelectorAll('#cm-drawer-body .cm-task-move').forEach(sel => {
      sel.addEventListener('change', () => {
        const task = (c.tasks || []).find(t => t.id === sel.dataset.task);
        if (!task) return;
        task.status = sel.value;
        task.completion = sel.value === 'Completed' ? 100 : task.completion;
        _persistMutation(c);
        window.NotificationManager?.success('Task Updated', `"${task.title}" moved to ${sel.value}.`);
        if (sel.value === 'Completed') window.NotificationManager?.success('Task Completed', task.title);
        _renderDrawerTab('tasks');
      });
    });
  }

  // ── Evidence ─────────────────────────────────────────────────────────
  function _drEvidence(c) {
    return (c.evidence || []).map(e => `
      <div class="ir-evidence-item">
        ${svg('evidence', 'cm-inline-icon')}
        <div><div class="ir-evidence-name">${esc(e.type)} <span style="color:var(--text-tertiary);font-weight:normal;">— ${esc(e.name)}</span></div>
        <div class="ir-evidence-note">Collected by ${esc(e.collectedBy)} on ${esc(e.collectedDate)}. ${esc(e.note)}</div></div>
      </div>`).join('') || '<div style="color:var(--text-tertiary);font-size:var(--text-sm);">No evidence collected yet.</div>';
  }

  // ── IOCs (integrates with IOC Manager) ──────────────────────────────
  function _drIocs(c) {
    const iocs = (c.linkedIocIds || []).map(id => IOD().getIOC(id)).filter(Boolean);
    if (!iocs.length) return `<div style="color:var(--text-tertiary);font-size:var(--text-sm);">No linked IOCs found in the current IOC Manager database.</div>`;
    return `<div class="card"><div class="card-body" style="padding:0;overflow-x:auto;">
      <table class="data-table"><thead><tr><th>Type</th><th>Value</th><th>Threat Level</th><th>Confidence</th><th>Source</th><th>Last Seen</th></tr></thead>
      <tbody>${iocs.map(i => `<tr><td>${esc(i.type)}</td><td class="mono" style="max-width:200px;overflow:hidden;text-overflow:ellipsis;">${esc(i.value)}</td><td><span class="badge ${SEV_CLS[i.threatLevel] || 'badge-neutral'}">${esc(i.threatLevel)}</span></td><td>${esc(i.confidence)}</td><td>${esc(i.source)}</td><td class="mono">${esc(i.lastSeen)}</td></tr>`).join('')}</tbody>
      </table></div></div>
      <div style="color:var(--text-tertiary);font-size:var(--text-xs);margin-top:var(--space-2);">Open the IOC Manager and search these IOC IDs for full detail.</div>`;
  }

  // ── Assets (integrates with Asset Inventory) ────────────────────────
  function _drAssets(c) {
    const asset = c.relatedAssetHint ? AD().assets.find(a => a.hostname === c.relatedAssetHint) : null;
    if (!asset) return `<div style="color:var(--text-tertiary);font-size:var(--text-sm);">No related assets found in the current Asset Inventory.</div>`;
    return `<div class="ai-detail-grid">
      ${_field('Hostname', asset.hostname)} ${_field('Owner', asset.assignedUser)}
      ${_field('Department', asset.department)} ${_field('Criticality', asset.criticality)}
    </div>
    <div class="ti-tag-row"><span class="badge ${SEV_CLS[asset.risk] || 'badge-neutral'}">${esc(asset.risk)} risk</span><span class="badge badge-neutral">${esc(asset.status)}</span></div>
    <div style="color:var(--text-tertiary);font-size:var(--text-xs);margin-top:var(--space-2);">Open the Asset Inventory and search "${esc(asset.hostname)}" for full details.</div>`;
  }

  // ── Incidents (integrates with Incident Response) ──────────────────
  function _drIncidents(c) {
    const inc = c.relatedIncidentHint ? ID_INC().getIncident(c.relatedIncidentHint) : null;
    if (!inc) return `<div style="color:var(--text-tertiary);font-size:var(--text-sm);">No related incidents found in the current Incident Response module.</div>`;
    return `<div class="ti-detail-link">
      ${svg('warn', 'cm-inline-icon')} <strong>${esc(inc.id)}</strong> — ${esc(inc.title)}
      <span style="margin-left:auto;"><span class="badge ${SEV_CLS[inc.severity] || 'badge-neutral'}">${esc(inc.severity)}</span> <span class="badge badge-neutral">${esc(inc.status)}</span></span>
    </div>
    <div style="color:var(--text-tertiary);font-size:var(--text-xs);margin-top:var(--space-2);">Open the Incident Response Center and search "${esc(inc.id)}" for full details.</div>`;
  }

  function _drMitre(c) {
    const m = c.mitre; if (!m) return '<div style="color:var(--text-tertiary);font-size:var(--text-sm);">No MITRE mapping recorded.</div>';
    return `<div class="ai-detail-grid">
      ${_field('Tactic', m.tactic)} ${_field('Technique', m.technique)} ${_field('Technique ID', m.id)}
    </div>
    <div class="ai-detail-sub-title">Detection Logic</div><p style="font-size:var(--text-sm);color:var(--text-secondary);line-height:1.6;">${esc(m.detectionLogic || '—')}</p>
    <div class="ai-detail-sub-title">Mitigation</div><p style="font-size:var(--text-sm);color:var(--text-secondary);line-height:1.6;">${esc(m.mitigation || '—')}</p>
    <a class="btn btn-secondary btn-sm" href="${m.references || `https://attack.mitre.org/techniques/${m.id.replace('.', '/')}/`}" target="_blank" rel="noopener">${svg('map', 'cm-inline-icon')} View on attack.mitre.org</a>`;
  }

  function _drNotes(c) {
    const notes = (c.notes || []).slice().reverse();
    return `
      ${notes.map(n => `<div class="df-note"><div class="df-note-meta">${esc(n.author)} &middot; ${esc(n.date)}</div><div class="df-note-text">${esc(n.text)}</div></div>`).join('') || '<div style="color:var(--text-tertiary);font-size:var(--text-sm);margin-bottom:var(--space-3);">No notes yet.</div>'}
      <textarea class="input" id="cm-note-text" rows="2" placeholder="Add a case note…" style="margin-top:var(--space-2);"></textarea>
      <button class="btn btn-secondary btn-sm" id="cm-note-add" style="margin-top:var(--space-2);">${svg('plus')} Add Note</button>`;
  }

  function _drReports(c) {
    return `
      <p style="color:var(--text-secondary);font-size:var(--text-sm);margin-bottom:var(--space-4);">Generate case-specific reports. All exports run locally in your browser.</p>
      <div class="ai-detail-sub-title">Recommendations</div>
      <ul style="font-size:var(--text-sm);color:var(--text-secondary);line-height:1.7;padding-left:20px;">${(c.recommendations || []).map(r => `<li>${esc(r)}</li>`).join('') || '<li style="color:var(--text-tertiary);">None recorded.</li>'}</ul>
      <div class="ai-detail-sub-title">Lessons Learned</div>
      <p style="font-size:var(--text-sm);color:var(--text-secondary);line-height:1.6;">${c.lessonsLearned ? esc(c.lessonsLearned) : '<span style="color:var(--text-tertiary);">Not yet documented — pending case closure.</span>'}</p>
      <div class="cm-report-btns">
        <button class="btn btn-secondary btn-sm" id="cm-rep-exec">${svg('report')} Executive Summary</button>
        <button class="btn btn-secondary btn-sm" id="cm-rep-tech">${svg('report')} Technical Summary</button>
        <button class="btn btn-secondary btn-sm" id="cm-rep-evd">${svg('evidence')} Evidence Summary</button>
        <button class="btn btn-secondary btn-sm" id="cm-rep-timeline">${svg('clock')} Timeline Report</button>
        <button class="btn btn-secondary btn-sm" id="cm-rep-archive">${svg('down')} Case Archive (JSON)</button>
      </div>`;
  }

  document.addEventListener('click', e => {
    const c = findCase(drawerCaseId);
    if (!c) return;
    if (e.target && e.target.id === 'cm-note-add') {
      const text = document.getElementById('cm-note-text')?.value.trim();
      if (!text) return;
      const note = { author: 'Current User', date: new Date().toISOString().slice(0, 10), text };
      c.notes = [...(c.notes || []), note];
      _persistMutation(c);
      window.NotificationManager?.success('Note Added', '');
      _renderDrawerTab('notes');
    }
    if (e.target && e.target.id === 'cm-rep-exec') _exportCaseExecutive(c);
    if (e.target && e.target.id === 'cm-rep-tech') _exportCaseTechnical(c);
    if (e.target && e.target.id === 'cm-rep-evd') _exportCaseEvidence(c);
    if (e.target && e.target.id === 'cm-rep-timeline') _exportCaseTimeline(c);
    if (e.target && e.target.id === 'cm-rep-archive') { _download(`${c.id}-archive.json`, JSON.stringify(c, null, 2), 'application/json'); window.NotificationManager?.success('Export Complete', `${c.id} archived as JSON.`); }
  });

  function _persistMutation(c) {
    const idx = customCases.findIndex(x => x.id === c.id);
    if (idx >= 0) customCases[idx] = c;
    else overrides[c.id] = { ...(overrides[c.id] || {}), tasks: c.tasks, notes: c.notes };
    _savePersisted();
  }

  // ══════════════════════════════════════════════════════════════════════
  // CREATE / EDIT MODAL
  // ══════════════════════════════════════════════════════════════════════
  function _buildAddEditModal() {
    const d = SD();
    const catOpts = (d.CATEGORIES.length ? d.CATEGORIES : ['Malware']).map(c => `<option>${esc(c)}</option>`).join('');
    const analystOpts = (d.ANALYSTS.length ? d.ANALYSTS : ['Unassigned']).map(a => `<option>${esc(a)}</option>`).join('');
    const deptOpts = (d.DEPARTMENTS.length ? d.DEPARTMENTS : ['IT Ops']).map(dp => `<option>${esc(dp)}</option>`).join('');
    return `
    <div class="ai-modal-overlay" id="cm-modal-overlay">
      <div class="ai-modal" id="cm-modal">
        <div class="ai-modal-header"><div class="ai-modal-title" id="cm-modal-title">Create Case</div><div class="ai-detail-close" id="cm-modal-close">${svg('close')}</div></div>
        <div class="ai-modal-body">
          <input type="hidden" id="cm-form-id" />
          <div class="ai-form-row"><label class="ai-label">Title *</label><input type="text" class="input" id="cm-form-title" /></div>
          <div class="ai-form-row"><label class="ai-label">Description</label><textarea class="input" id="cm-form-desc" rows="2"></textarea></div>
          <div class="ai-form-grid">
            <div class="ai-form-row"><label class="ai-label">Priority</label><select class="input" id="cm-form-priority"><option>Critical</option><option>High</option><option selected>Medium</option><option>Low</option></select></div>
            <div class="ai-form-row"><label class="ai-label">Severity</label><select class="input" id="cm-form-severity"><option value="critical">Critical</option><option value="high">High</option><option value="medium" selected>Medium</option><option value="low">Low</option><option value="informational">Informational</option></select></div>
            <div class="ai-form-row"><label class="ai-label">Category</label><select class="input" id="cm-form-category">${catOpts}</select></div>
            <div class="ai-form-row"><label class="ai-label">Assigned Analyst</label><select class="input" id="cm-form-analyst">${analystOpts}</select></div>
            <div class="ai-form-row"><label class="ai-label">Department</label><select class="input" id="cm-form-department">${deptOpts}</select></div>
            <div class="ai-form-row"><label class="ai-label">Related Incident ID</label><input type="text" class="input" id="cm-form-incident" placeholder="e.g. INC-2026-1001" /></div>
            <div class="ai-form-row"><label class="ai-label">Related Asset (hostname)</label><input type="text" class="input" id="cm-form-asset" placeholder="e.g. WIN-SRV-001" /></div>
            <div class="ai-form-row"><label class="ai-label">Due Date</label><input type="text" class="input" id="cm-form-due" placeholder="YYYY-MM-DD" /></div>
          </div>
          <div class="ai-form-row"><label class="ai-label">Business Impact</label><textarea class="input" id="cm-form-impact" rows="2"></textarea></div>
          <div class="ai-form-row"><label class="ai-label">Notes</label><textarea class="input" id="cm-form-notes" rows="2"></textarea></div>
          <div class="ai-form-error" id="cm-form-error"></div>
        </div>
        <div class="ai-modal-footer"><button class="btn btn-secondary" id="cm-form-cancel">Cancel</button><button class="btn btn-primary" id="cm-form-save">Save</button></div>
      </div>
    </div>`;
  }

  function _wireAddEditModal() {
    document.getElementById('cm-modal-close')?.addEventListener('click', _closeAddEditModal);
    document.getElementById('cm-form-cancel')?.addEventListener('click', _closeAddEditModal);
    document.getElementById('cm-modal-overlay')?.addEventListener('click', e => { if (e.target.id === 'cm-modal-overlay') _closeAddEditModal(); });
    document.getElementById('cm-form-save')?.addEventListener('click', _saveCaseForm);
  }

  function _openAddEditModal(caseId) {
    const isEdit = !!caseId;
    document.getElementById('cm-modal-title').textContent = isEdit ? 'Edit Case' : 'Create Case';
    document.getElementById('cm-form-error').textContent = '';
    const c = isEdit ? findCase(caseId) : null;
    document.getElementById('cm-form-id').value = caseId || '';
    document.getElementById('cm-form-title').value = c?.title || '';
    document.getElementById('cm-form-desc').value = c?.description || '';
    document.getElementById('cm-form-priority').value = c?.priority || 'Medium';
    document.getElementById('cm-form-severity').value = c?.severity || 'medium';
    document.getElementById('cm-form-category').value = c?.category || (SD().CATEGORIES[0] || 'Malware');
    document.getElementById('cm-form-analyst').value = c?.assignedAnalyst || (SD().ANALYSTS[0] || '');
    document.getElementById('cm-form-department').value = c?.department || (SD().DEPARTMENTS[0] || '');
    document.getElementById('cm-form-incident').value = c?.relatedIncidentHint || '';
    document.getElementById('cm-form-asset').value = c?.relatedAssetHint || '';
    document.getElementById('cm-form-due').value = c?.dueDate || '';
    document.getElementById('cm-form-impact').value = c?.businessImpact || '';
    document.getElementById('cm-form-notes').value = (c?.notes || []).map(n => n.text).join('\n');
    document.getElementById('cm-modal-overlay').classList.add('open');
  }
  function _closeAddEditModal() { document.getElementById('cm-modal-overlay').classList.remove('open'); }

  function _saveCaseForm() {
    const title = document.getElementById('cm-form-title').value.trim();
    const errEl = document.getElementById('cm-form-error');
    if (!title) { errEl.textContent = 'Case title is required.'; return; }
    errEl.textContent = '';

    const id = document.getElementById('cm-form-id').value;
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const fields = {
      title, description: document.getElementById('cm-form-desc').value.trim() || '—',
      priority: document.getElementById('cm-form-priority').value, severity: document.getElementById('cm-form-severity').value,
      category: document.getElementById('cm-form-category').value, status: 'New',
      owner: document.getElementById('cm-form-analyst').value, assignedAnalyst: document.getElementById('cm-form-analyst').value,
      department: document.getElementById('cm-form-department').value,
      relatedIncidentHint: document.getElementById('cm-form-incident').value.trim() || null,
      relatedAssetHint: document.getElementById('cm-form-asset').value.trim() || null,
      linkedIocIds: [], riskScore: 50,
      businessImpact: document.getElementById('cm-form-impact').value.trim() || '—',
      updatedDate: now, dueDate: document.getElementById('cm-form-due').value.trim() || now.slice(0, 10), resolutionDate: null,
      mitre: null, tasks: [], evidence: [],
      timeline: [{ time: now, event: id ? 'Case Updated' : 'Case Created', detail: id ? 'Fields updated by user.' : `${title} manually logged.` }],
      notes: document.getElementById('cm-form-notes').value.trim() ? [{ author: 'Current User', date: now.slice(0, 10), text: document.getElementById('cm-form-notes').value.trim() }] : [],
      recommendations: [], lessonsLearned: '',
    };

    if (id) {
      const idx = customCases.findIndex(c => c.id === id);
      if (idx >= 0) customCases[idx] = { ...customCases[idx], ...fields };
      else overrides[id] = { ...(overrides[id] || {}), ...fields };
      window.NotificationManager?.success('Case Updated', `${title} was updated.`);
    } else {
      customCases.push({ id: uid('CASE').toUpperCase(), createdDate: now, ...fields });
      window.NotificationManager?.success('Case Created', `${title} was logged.`);
    }
    _savePersisted(); _closeAddEditModal(); _renderAll();
  }

  // ══════════════════════════════════════════════════════════════════════
  // DELETE CONFIRMATION
  // ══════════════════════════════════════════════════════════════════════
  function _buildConfirmModal() {
    return `
    <div class="ai-modal-overlay" id="cm-confirm-overlay">
      <div class="ai-modal ai-modal-sm">
        <div class="ai-modal-header"><div class="ai-modal-title">Delete Case</div><div class="ai-detail-close" id="cm-confirm-close">${svg('close')}</div></div>
        <div class="ai-modal-body"><p id="cm-confirm-text" style="color:var(--text-secondary);font-size:var(--text-sm);"></p></div>
        <div class="ai-modal-footer"><button class="btn btn-secondary" id="cm-confirm-cancel">Cancel</button><button class="btn btn-danger" id="cm-confirm-delete">Delete</button></div>
      </div>
    </div>`;
  }
  let pendingDeleteId = null;
  function _wireConfirmModal() {
    document.getElementById('cm-confirm-close')?.addEventListener('click', _closeConfirm);
    document.getElementById('cm-confirm-cancel')?.addEventListener('click', _closeConfirm);
    document.getElementById('cm-confirm-overlay')?.addEventListener('click', e => { if (e.target.id === 'cm-confirm-overlay') _closeConfirm(); });
    document.getElementById('cm-confirm-delete')?.addEventListener('click', () => {
      if (!pendingDeleteId) return;
      const c = findCase(pendingDeleteId);
      if (customCases.some(x => x.id === pendingDeleteId)) customCases = customCases.filter(x => x.id !== pendingDeleteId);
      else deletedIds.add(pendingDeleteId);
      _savePersisted(); _closeConfirm(); _renderAll();
      window.NotificationManager?.success('Case Deleted', c ? `${c.id} was removed.` : 'Case removed.');
    });
  }
  function _confirmDelete(caseId) {
    const c = findCase(caseId); if (!c) return;
    pendingDeleteId = caseId;
    document.getElementById('cm-confirm-text').textContent = `Are you sure you want to delete "${c.id} — ${c.title}"? This cannot be undone.`;
    document.getElementById('cm-confirm-overlay').classList.add('open');
  }
  function _closeConfirm() { document.getElementById('cm-confirm-overlay').classList.remove('open'); pendingDeleteId = null; }

  // ══════════════════════════════════════════════════════════════════════
  // IMPORT (offline JSON / CSV, preview + validation)
  // ══════════════════════════════════════════════════════════════════════
  function _buildImportModal() {
    return `
    <div class="ai-modal-overlay" id="cm-import-overlay">
      <div class="ai-modal">
        <div class="ai-modal-header"><div class="ai-modal-title">Import Cases</div><div class="ai-detail-close" id="cm-import-close">${svg('close')}</div></div>
        <div class="ai-modal-body">
          <p style="color:var(--text-secondary);font-size:var(--text-sm);margin-bottom:var(--space-3);">Paste JSON (array of case objects with at least a <span class="mono">title</span> field) or CSV with a header row.</p>
          <textarea class="input" id="cm-import-text" rows="8" placeholder='[{"title":"New Case","priority":"High","category":"Malware"}]' style="font-family:var(--font-mono);font-size:12px;"></textarea>
          <button class="btn btn-secondary btn-sm" id="cm-import-preview" style="margin-top:var(--space-3);">Preview</button>
          <div id="cm-import-preview-box" style="margin-top:var(--space-3);"></div>
        </div>
        <div class="ai-modal-footer"><button class="btn btn-secondary" id="cm-import-cancel">Cancel</button><button class="btn btn-primary" id="cm-import-confirm" disabled>Import</button></div>
      </div>
    </div>`;
  }
  let importPreviewRows = [];
  function _wireImportModal() {
    document.getElementById('cm-import-close')?.addEventListener('click', _closeImportModal);
    document.getElementById('cm-import-cancel')?.addEventListener('click', _closeImportModal);
    document.getElementById('cm-import-overlay')?.addEventListener('click', e => { if (e.target.id === 'cm-import-overlay') _closeImportModal(); });
    document.getElementById('cm-import-preview')?.addEventListener('click', _previewImport);
    document.getElementById('cm-import-confirm')?.addEventListener('click', _confirmImport);
  }
  function _openImportModal() {
    document.getElementById('cm-import-text').value = '';
    document.getElementById('cm-import-preview-box').innerHTML = '';
    document.getElementById('cm-import-confirm').disabled = true;
    importPreviewRows = [];
    document.getElementById('cm-import-overlay').classList.add('open');
  }
  function _closeImportModal() { document.getElementById('cm-import-overlay').classList.remove('open'); }

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
    const raw = document.getElementById('cm-import-text').value.trim();
    const box = document.getElementById('cm-import-preview-box');
    const confirmBtn = document.getElementById('cm-import-confirm');
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
    box.innerHTML = `<div class="ti-result-count" style="margin-bottom:var(--space-2);">${rows.length} case(s) ready to import</div>
      <div class="card"><div class="card-body" style="padding:0;max-height:220px;overflow:auto;">
      <table class="data-table"><thead><tr><th>Title</th><th>Priority</th><th>Category</th></tr></thead>
      <tbody>${rows.slice(0, 20).map(r => `<tr><td>${esc(r.title)}</td><td>${esc(r.priority || 'Medium')}</td><td>${esc(r.category || 'Malware')}</td></tr>`).join('')}</tbody>
      </table></div></div>`;
    confirmBtn.disabled = false;
  }

  function _confirmImport() {
    if (!importPreviewRows.length) return;
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    importPreviewRows.forEach(r => {
      customCases.push({
        id: uid('CASE').toUpperCase(), title: r.title, description: r.description || '—',
        priority: r.priority || 'Medium', severity: r.severity || 'medium', category: r.category || 'Malware', status: r.status || 'New',
        owner: r.assignedAnalyst || 'Unassigned', assignedAnalyst: r.assignedAnalyst || 'Unassigned', department: r.department || 'IT Ops',
        relatedIncidentHint: r.relatedIncidentHint || null, relatedAssetHint: r.relatedAssetHint || null, linkedIocIds: [],
        riskScore: parseInt(r.riskScore, 10) || 50,
        businessImpact: r.businessImpact || '—', createdDate: now, updatedDate: now, dueDate: r.dueDate || now.slice(0, 10), resolutionDate: null,
        mitre: null, tasks: [], evidence: [],
        timeline: [{ time: now, event: 'Case Created', detail: `${r.title} imported into the case system.` }], notes: [],
        recommendations: [], lessonsLearned: '',
      });
    });
    _savePersisted(); _closeImportModal(); _renderAll();
    window.NotificationManager?.success('Import Complete', `${importPreviewRows.length} case(s) imported.`);
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
    const header = ['id', 'title', 'priority', 'severity', 'status', 'assignedAnalyst', 'category', 'department', 'createdDate', 'dueDate', 'riskScore'];
    const csv = [header.join(','), ...rows.map(c => header.map(k => `"${String(c[k] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    _download('case-export.csv', csv, 'text/csv');
    window.NotificationManager?.success('Export Complete', `${rows.length} case(s) exported as CSV.`);
  }

  function _openReportChoice() {
    const choice = window.confirm('Click OK for Executive Report, or Cancel for Technical Report + Case Archive (JSON).');
    if (choice) _exportOverallExecutive();
    else { _exportOverallTechnical(); _download('case-archive.json', JSON.stringify(_filteredSorted(), null, 2), 'application/json'); }
    window.NotificationManager?.success('Export Complete', 'Case report generated.');
  }

  function _reportShell(title, bodyHtml) {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${esc(title)}</title>
      <style>body{font-family:-apple-system,sans-serif;max-width:960px;margin:40px auto;color:#0f172a;}
      table{width:100%;border-collapse:collapse;margin:16px 0;} th,td{border:1px solid #ddd;padding:6px;text-align:left;font-size:12px;} th{background:#f1f5f9;}
      h1{font-size:22px;} h2{font-size:16px;margin-top:28px;} .warn{background:#fef3c7;padding:10px;border-radius:6px;font-size:12px;}</style></head><body>
      <h1>${esc(title)}</h1>
      <div class="warn">⚠ Educational simulation — synthetic offline case data.</div>
      ${bodyHtml}
      <p style="color:#64748b;font-size:11px;margin-top:24px;">Generated by Khan Security Solutions Enterprise · ${new Date().toLocaleString()}</p>
      </body></html>`;
  }

  function _exportOverallExecutive() {
    const s = _computeStats(); const list = allCases();
    const body = `<p><strong>${s.open}</strong> open cases (${s.critical} critical, ${s.high} high priority). <strong>${s.resolved}</strong> resolved.
      Average resolution time: <strong>${s.avgResolutionHrs} hours</strong>. <strong>${s.pendingTasks}</strong> tasks pending across all open cases.</p>
      <h2>Top Open Cases</h2><table><tr><th>ID</th><th>Title</th><th>Priority</th><th>Status</th></tr>
      ${list.filter(c => !['Resolved', 'Closed', 'Archived'].includes(c.status)).slice(0, 15).map(c => `<tr><td>${esc(c.id)}</td><td>${esc(c.title)}</td><td>${esc(c.priority)}</td><td>${esc(c.status)}</td></tr>`).join('')}</table>`;
    _download('case-executive-report.html', _reportShell('Case Management — Executive Report', body), 'text/html');
  }
  function _exportOverallTechnical() {
    const list = allCases();
    const body = `<table><tr><th>ID</th><th>Title</th><th>Category</th><th>MITRE</th><th>Priority</th><th>Status</th><th>Analyst</th></tr>
      ${list.map(c => `<tr><td>${esc(c.id)}</td><td>${esc(c.title)}</td><td>${esc(c.category)}</td><td>${esc(c.mitre?.id || '—')}</td><td>${esc(c.priority)}</td><td>${esc(c.status)}</td><td>${esc(c.assignedAnalyst)}</td></tr>`).join('')}</table>`;
    _download('case-technical-report.html', _reportShell('Case Management — Technical Report', body), 'text/html');
  }

  function _exportCaseExecutive(c) {
    const body = `<h2>${esc(c.id)} — ${esc(c.title)}</h2><p>${esc(c.description)}</p>
      <p>Priority: <strong>${esc(c.priority)}</strong> · Severity: <strong>${esc(c.severity)}</strong> · Status: <strong>${esc(c.status)}</strong> · Risk Score: <strong>${c.riskScore}</strong></p>
      <p>${esc(c.businessImpact)}</p>`;
    _download(`${c.id}-executive-summary.html`, _reportShell(`Executive Summary — ${c.id}`, body), 'text/html');
    window.NotificationManager?.success('Export Complete', 'Executive summary generated.');
  }
  function _exportCaseTechnical(c) {
    const body = `<h2>${esc(c.id)} — ${esc(c.title)}</h2>
      <p>MITRE: <strong>${esc(c.mitre?.id || '—')}</strong> — ${esc(c.mitre?.technique || '')}</p>
      <h3>Tasks</h3><table><tr><th>Title</th><th>Status</th><th>Owner</th><th>Completion</th></tr>
      ${(c.tasks || []).map(t => `<tr><td>${esc(t.title)}</td><td>${esc(t.status)}</td><td>${esc(t.owner)}</td><td>${t.completion}%</td></tr>`).join('')}</table>`;
    _download(`${c.id}-technical-summary.html`, _reportShell(`Technical Summary — ${c.id}`, body), 'text/html');
    window.NotificationManager?.success('Export Complete', 'Technical summary generated.');
  }
  function _exportCaseEvidence(c) {
    const body = `<h2>${esc(c.id)} — Evidence Summary</h2><table><tr><th>Type</th><th>Name</th><th>Collected By</th><th>Date</th><th>Note</th></tr>
      ${(c.evidence || []).map(e => `<tr><td>${esc(e.type)}</td><td>${esc(e.name)}</td><td>${esc(e.collectedBy)}</td><td>${esc(e.collectedDate)}</td><td>${esc(e.note)}</td></tr>`).join('') || '<tr><td colspan="5">No evidence recorded.</td></tr>'}</table>`;
    _download(`${c.id}-evidence-summary.html`, _reportShell(`Evidence Summary — ${c.id}`, body), 'text/html');
    window.NotificationManager?.success('Export Complete', 'Evidence summary generated.');
  }
  function _exportCaseTimeline(c) {
    const body = `<h2>${esc(c.id)} — Timeline</h2>` + (c.timeline || []).map(t => `<p><strong>${esc(t.event)}</strong> — ${esc(t.time)}<br>${esc(t.detail)}</p>`).join('');
    _download(`${c.id}-timeline.html`, _reportShell(`Timeline — ${c.id}`, body), 'text/html');
    window.NotificationManager?.success('Export Complete', 'Timeline report generated.');
  }

  // ══════════════════════════════════════════════════════════════════════
  // PERSISTENCE
  // ══════════════════════════════════════════════════════════════════════
  function _loadPersisted() {
    if (!window.StorageManager) return;
    customCases = window.StorageManager.lsGet('cm_custom_cases', []) || [];
    deletedIds = new Set(window.StorageManager.lsGet('cm_deleted_ids', []) || []);
    overrides = window.StorageManager.lsGet('cm_overrides', {}) || {};
  }
  function _savePersisted() {
    window.StorageManager?.lsSet('cm_custom_cases', customCases);
    window.StorageManager?.lsSet('cm_deleted_ids', [...deletedIds]);
    window.StorageManager?.lsSet('cm_overrides', overrides);
  }

  // ══════════════════════════════════════════════════════════════════════
  // SEARCH (global)
  // ══════════════════════════════════════════════════════════════════════
  function _registerSearch() {
    if (!window.SearchEngine) return;
    window.SearchEngine.register('Case Manager', [
      { title: 'Enterprise Security Case Manager', meta: 'Cases, Kanban tasks, evidence, cross-module links', route: 'case-manager', keywords: 'case manager investigation soc phishing ransomware apt29 finance critical windows server' },
      ...SD().cases.map(c => ({ title: c.title, meta: `${c.id} — ${c.status}`, route: 'case-manager', keywords: `${c.id} ${c.title} ${c.category} ${c.priority} ${c.assignedAnalyst} ${c.department}` })),
    ]);
  }

  // ── Public API ─────────────────────────────────────────────────────────
  return { register };

})();

window.CaseManager = CaseManager;

if (window.Router) {
  CaseManager.register();
} else {
  console.error('[CaseManager] Router not found. Ensure router.js loads before case-manager.js.');
}
