/**
 * KHAN SECURITY SOLUTIONS ENTERPRISE
 * Enterprise Asset Inventory — Module v1.0.0
 *
 * Offline CMDB-style asset inventory: animated stat dashboard, SVG charts
 * (pure SVG — no chart libraries), real-time multi-field filtering, a
 * sortable/paginated enterprise table, a tabbed detail drawer (Overview,
 * Network, Security, Applications, Timeline, Notes), Add/Edit/Delete asset
 * management, and offline JSON/CSV import & export.
 *
 * [EDUCATIONAL SIMULATION — Ships with 40 deterministically generated
 *  synthetic assets. Everything is stored locally via StorageManager;
 *  there is no backend, login, or live device discovery.]
 *
 * Integrates with:
 *   window.Router              — route: 'asset-inventory'
 *   window.SearchEngine        — searchable content
 *   window.NotificationManager — alerts and feedback
 *   window.StorageManager      — asset persistence (localStorage)
 *   window.SampleAssetData     — bundled sample dataset
 */

const AssetInventory = (() => {

  // ── State ──────────────────────────────────────────────────────────────
  let mounted        = false;
  let customAssets     = [];   // user-added assets (persisted)
  let deletedIds        = new Set(); // sample-asset ids the user deleted (persisted)
  let overrides           = {};       // assetId -> partial field overrides for edits to sample assets

  let filters = { q: '', type: 'all', status: 'all', risk: 'all', dept: 'all', os: 'all', vendor: 'all', location: 'all' };
  let sortKey = 'hostname', sortDir = 'asc';
  let currentPage = 1;
  const PAGE_SIZE = 10;
  let selectedIds = new Set();

  // ── Icons ──────────────────────────────────────────────────────────────
  const I = {
    shield:   `<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>`,
    server:   `<path stroke-linecap="round" stroke-linejoin="round" d="M21.75 17.25v-.228a4.5 4.5 0 00-.12-1.03l-2.268-9.64a3.375 3.375 0 00-3.285-2.602H7.923a3.375 3.375 0 00-3.285 2.602l-2.268 9.64a4.5 4.5 0 00-.12 1.03v.228m19.5 0a3 3 0 01-3 3H5.25a3 3 0 01-3-3m19.5 0a3 3 0 00-3-3H5.25a3 3 0 00-3 3m16.5 0h.008v.008h-.008v-.008zm-3 0h.008v.008h-.008v-.008z"/>`,
    desktop:  `<path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"/>`,
    cloud:    `<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z"/>`,
    network:  `<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75a3 3 0 116 0 3 3 0 01-6 0zM3.75 17.25a3 3 0 116 0 3 3 0 01-6 0zm12 0a3 3 0 116 0 3 3 0 01-6 0zM12 9.75v3m0 0l-4.5 3m4.5-3l4.5 3"/>`,
    mobile:   `<path stroke-linecap="round" stroke-linejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"/>`,
    question: `<path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"/>`,
    warn:     `<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>`,
    plus:     `<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>`,
    upload:   `<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>`,
    down:     `<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>`,
    refresh:  `<path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/>`,
    search:   `<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z"/>`,
    close:    `<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>`,
    edit:     `<path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"/>`,
    trash:    `<path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>`,
    chevronUp:  `<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5"/>`,
    chevronDown:`<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>`,
    filter:   `<path stroke-linecap="round" stroke-linejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"/>`,
  };
  const TYPE_ICON = {
    'Windows Server': 'server', 'Linux Server': 'server', 'Domain Controller': 'server',
    Desktop: 'desktop', Laptop: 'desktop', Mac: 'desktop',
    'Azure VM': 'cloud', 'AWS EC2': 'cloud', 'Cloud VM': 'cloud',
    Firewall: 'network', Switch: 'network', Router: 'network', 'Wireless AP': 'network',
    Printer: 'question', IoT: 'question', Mobile: 'mobile',
  };
  function svg(name, cls = '') { return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">${I[name] || I.shield}</svg>`; }
  function esc(s) { const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function uid(prefix) { return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`; }

  const SD = () => window.SampleAssetData || { assets: [], TYPE_TEMPLATES: [], RISK_LEVELS: [], STATUSES: [], PATCH_STATUSES: [], SECURITY_PRODUCTS: [], DEPARTMENTS: [], LOCATIONS: [], getAsset: () => null };

  // Merged, overridden, non-deleted asset list
  function allAssets() {
    const base = SD().assets.filter(a => !deletedIds.has(a.id)).map(a => overrides[a.id] ? { ...a, ...overrides[a.id] } : a);
    return [...base, ...customAssets];
  }
  function findAsset(id) { return allAssets().find(a => a.id === id) || null; }

  const RISK_CLS = { critical: 'badge-danger', high: 'badge-high', medium: 'badge-medium', low: 'badge-low', informational: 'badge-neutral' };
  const STATUS_CLS = { Healthy: 'badge-success', Warning: 'badge-warning', Offline: 'badge-neutral', Retired: 'badge-neutral', Maintenance: 'badge-info', Compromised: 'badge-danger' };
  const PATCH_CLS = { 'Fully Updated': 'badge-success', 'Pending Updates': 'badge-warning', 'Critical Missing': 'badge-danger', Unknown: 'badge-neutral' };

  // ══════════════════════════════════════════════════════════════════════
  // ROUTE REGISTRATION
  // ══════════════════════════════════════════════════════════════════════
  function register() {
    window.Router.register('asset-inventory', { title: 'Asset Inventory', init, render });
  }

  function init() {
    _loadPersisted();
    _registerSearch();
  }

  function render() {
    const el = document.getElementById('page-asset-inventory');
    if (!el) return;
    if (!mounted) {
      el.innerHTML = _buildShell();
      mounted = true;
      _wireAll();
      _animateStats();
    } else {
      _renderAll();
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  // SHELL
  // ══════════════════════════════════════════════════════════════════════
  function _buildShell() {
    return `
    <div class="ai-shell">
      <div class="ai-header">
        <div>
          <div class="ai-header-title">Enterprise Asset Inventory</div>
          <div class="ai-header-sub">Track and manage every device connected to your organisation.</div>
        </div>
        <div class="ai-header-actions">
          <button class="btn btn-secondary btn-sm" id="ai-btn-refresh">${svg('refresh')} Refresh Inventory</button>
          <button class="btn btn-secondary btn-sm" id="ai-btn-import">${svg('upload')} Import Assets</button>
          <button class="btn btn-secondary btn-sm" id="ai-btn-export">${svg('down')} Export CSV</button>
          <button class="btn btn-primary btn-sm" id="ai-btn-add">${svg('plus')} Add Asset</button>
        </div>
      </div>

      <div class="ai-body">
        <div class="grid grid-stats ai-stats" id="ai-stats"></div>

        <div class="ai-charts-grid">
          <div class="card"><div class="card-header"><div class="card-title">Assets by Operating System</div></div><div class="card-body"><svg id="ai-chart-os" viewBox="0 0 300 180" class="ai-chart-svg"></svg></div></div>
          <div class="card"><div class="card-header"><div class="card-title">Assets by Department</div></div><div class="card-body"><svg id="ai-chart-dept" viewBox="0 0 300 180" class="ai-chart-svg"></svg></div></div>
          <div class="card"><div class="card-header"><div class="card-title">Assets by Risk</div></div><div class="card-body"><svg id="ai-chart-risk" viewBox="0 0 300 180" class="ai-chart-svg"></svg></div></div>
          <div class="card"><div class="card-header"><div class="card-title">Assets by Status</div></div><div class="card-body"><svg id="ai-chart-status" viewBox="0 0 300 180" class="ai-chart-svg"></svg></div></div>
        </div>

        <div class="card ai-filter-card">
          <div class="card-body">
            <div class="ai-filter-bar">
              <div class="ti-search-box" style="flex:2;min-width:220px;">
                ${svg('search', 'ai-inline-icon')}
                <input type="text" id="ai-f-search" placeholder="Search hostname, IP, owner, department, OS…" />
              </div>
              <select class="input ai-filter-select" id="ai-f-type"><option value="all">All Types</option></select>
              <select class="input ai-filter-select" id="ai-f-status"><option value="all">All Statuses</option></select>
              <select class="input ai-filter-select" id="ai-f-risk"><option value="all">All Risk Levels</option></select>
              <select class="input ai-filter-select" id="ai-f-dept"><option value="all">All Departments</option></select>
              <select class="input ai-filter-select" id="ai-f-os"><option value="all">All OS</option></select>
              <select class="input ai-filter-select" id="ai-f-vendor"><option value="all">All Vendors</option></select>
              <select class="input ai-filter-select" id="ai-f-location"><option value="all">All Locations</option></select>
              <button class="btn btn-secondary btn-sm" id="ai-f-clear">${svg('close')} Clear</button>
            </div>
          </div>
        </div>

        <div class="ai-result-count" id="ai-result-count"></div>
        <div class="card ai-table-card">
          <div class="card-body" style="padding:0;overflow-x:auto;">
            <table class="data-table ai-table">
              <thead>
                <tr>
                  <th data-sort="hostname">Hostname</th>
                  <th data-sort="ip">IP Address</th>
                  <th data-sort="mac">MAC</th>
                  <th data-sort="assetType">Type</th>
                  <th data-sort="os">Operating System</th>
                  <th data-sort="vendor">Vendor</th>
                  <th data-sort="department">Department</th>
                  <th data-sort="assignedUser">Assigned User</th>
                  <th data-sort="location">Location</th>
                  <th data-sort="risk">Risk</th>
                  <th data-sort="status">Status</th>
                  <th data-sort="patchStatus">Patch</th>
                  <th data-sort="lastSeen">Last Seen</th>
                  <th></th>
                </tr>
              </thead>
              <tbody id="ai-table-body"></tbody>
            </table>
          </div>
          <div class="ai-pagination" id="ai-pagination"></div>
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
    document.getElementById('ai-btn-refresh')?.addEventListener('click', () => {
      window.NotificationManager?.info('Inventory Refreshed', 'Asset list re-scanned.');
      _renderAll();
    });
    document.getElementById('ai-btn-import')?.addEventListener('click', _openImportModal);
    document.getElementById('ai-btn-export')?.addEventListener('click', _exportCSV);
    document.getElementById('ai-btn-add')?.addEventListener('click', () => _openAddEditModal(null));

    document.getElementById('ai-f-search')?.addEventListener('input', e => { filters.q = e.target.value; currentPage = 1; _renderAll(); });
    ['type', 'status', 'risk', 'dept', 'os', 'vendor', 'location'].forEach(key => {
      document.getElementById(`ai-f-${key}`)?.addEventListener('change', e => { filters[key === 'dept' ? 'dept' : key] = e.target.value; currentPage = 1; _renderAll(); });
    });
    document.getElementById('ai-f-clear')?.addEventListener('click', () => {
      filters = { q: '', type: 'all', status: 'all', risk: 'all', dept: 'all', os: 'all', vendor: 'all', location: 'all' };
      document.getElementById('ai-f-search').value = '';
      document.querySelectorAll('.ai-filter-select').forEach(sel => sel.value = 'all');
      currentPage = 1; _renderAll();
    });

    document.querySelectorAll('#page-asset-inventory .ai-table thead th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const key = th.dataset.sort;
        if (sortKey === key) sortDir = sortDir === 'asc' ? 'desc' : 'asc'; else { sortKey = key; sortDir = 'asc'; }
        _renderAll();
      });
    });

    _wireDrawer();
    _wireAddEditModal();
    _wireImportModal();
    _wireConfirmModal();
    _populateFilterOptions();
    _renderAll();
  }

  // ══════════════════════════════════════════════════════════════════════
  // STATS (animated counters)
  // ══════════════════════════════════════════════════════════════════════
  function _computeStats() {
    const list = allAssets();
    const byCat = c => list.filter(a => a.category === c).length;
    const recentCutoff = Date.now() - 30 * 86400000;
    return {
      total: list.length,
      servers: byCat('Servers'),
      workstations: byCat('Workstations'),
      vms: list.filter(a => (a.assetType || '').includes('VM')).length,
      network: byCat('Network Devices'),
      mobile: byCat('Mobile Devices'),
      cloud: byCat('Cloud Resources'),
      unknown: byCat('Unknown Devices'),
      critical: list.filter(a => a.risk === 'critical').length,
      recent: list.filter(a => new Date(a.lastSeen).getTime() >= recentCutoff).length,
    };
  }

  function _buildStatsHTML(stats) {
    const cards = [
      ['Total Assets', stats.total, 'shield', 'var(--color-primary)'],
      ['Servers', stats.servers, 'server', 'var(--color-info)'],
      ['Workstations', stats.workstations, 'desktop', 'var(--color-success)'],
      ['Virtual Machines', stats.vms, 'cloud', '#a78bfa'],
      ['Network Devices', stats.network, 'network', 'var(--color-warning)'],
      ['Mobile Devices', stats.mobile, 'mobile', '#f97316'],
      ['Cloud Resources', stats.cloud, 'cloud', 'var(--color-primary)'],
      ['Unknown Devices', stats.unknown, 'question', 'var(--text-tertiary)'],
      ['Critical Assets', stats.critical, 'warn', 'var(--color-danger)'],
      ['Recently Added', stats.recent, 'refresh', 'var(--color-success)'],
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
    const stats = _computeStats();
    document.getElementById('ai-stats').innerHTML = _buildStatsHTML(stats);
    document.querySelectorAll('#ai-stats .ai-count').forEach(el => {
      const target = parseInt(el.dataset.target, 10) || 0;
      let current = 0;
      const step = Math.max(1, Math.ceil(target / 24));
      const timer = setInterval(() => {
        current = Math.min(target, current + step);
        el.textContent = current;
        if (current >= target) clearInterval(timer);
      }, 20);
    });
    _renderCharts(stats);
  }

  function _refreshStatsStatic() {
    const stats = _computeStats();
    document.querySelectorAll('#ai-stats .ai-count').forEach((el, idx) => {
      const values = [stats.total, stats.servers, stats.workstations, stats.vms, stats.network, stats.mobile, stats.cloud, stats.unknown, stats.critical, stats.recent];
      el.textContent = values[idx];
      el.dataset.target = values[idx];
    });
    _renderCharts(stats);
  }

  // ══════════════════════════════════════════════════════════════════════
  // SVG CHARTS (pure SVG, no libraries)
  // ══════════════════════════════════════════════════════════════════════
  const CHART_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#a78bfa', '#f97316', '#06b6d4', '#84cc16', '#ec4899', '#64748b'];

  function _groupCount(list, keyFn) {
    const map = {};
    list.forEach(a => { const k = keyFn(a) || 'Unknown'; map[k] = (map[k] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }

  function _renderPieChart(svgId, data) {
    const el = document.getElementById(svgId);
    if (!el) return;
    const total = data.reduce((s, [, v]) => s + v, 0) || 1;
    const cx = 90, cy = 90, r = 70;
    let angle = -Math.PI / 2;
    let paths = '';
    data.slice(0, 6).forEach(([label, val], idx) => {
      const frac = val / total;
      const nextAngle = angle + frac * 2 * Math.PI;
      const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
      const x2 = cx + r * Math.cos(nextAngle), y2 = cy + r * Math.sin(nextAngle);
      const largeArc = frac > 0.5 ? 1 : 0;
      paths += `<path d="M${cx},${cy} L${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${largeArc} 1 ${x2.toFixed(2)},${y2.toFixed(2)} Z" fill="${CHART_COLORS[idx % CHART_COLORS.length]}" opacity="0.9"><title>${label}: ${val}</title></path>`;
      angle = nextAngle;
    });
    const legend = data.slice(0, 6).map(([label, val], idx) => `
      <g transform="translate(190, ${18 + idx * 24})">
        <rect width="10" height="10" rx="2" fill="${CHART_COLORS[idx % CHART_COLORS.length]}"/>
        <text x="16" y="9" font-size="10" fill="var(--text-secondary)">${esc(_truncate(label, 16))} (${val})</text>
      </g>`).join('');
    el.innerHTML = `<g>${paths}</g>${legend}`;
  }

  function _renderBarChart(svgId, data) {
    const el = document.getElementById(svgId);
    if (!el) return;
    const items = data.slice(0, 6);
    const max = Math.max(1, ...items.map(([, v]) => v));
    const barH = 22, gap = 8, chartW = 300;
    const labelW = 90;
    el.innerHTML = items.map(([label, val], idx) => {
      const y = idx * (barH + gap) + 6;
      const w = ((chartW - labelW - 40) * val) / max;
      return `
        <text x="0" y="${y + barH / 2 + 4}" font-size="10" fill="var(--text-secondary)">${esc(_truncate(label, 14))}</text>
        <rect x="${labelW}" y="${y}" width="${Math.max(2, w)}" height="${barH}" rx="4" fill="${CHART_COLORS[idx % CHART_COLORS.length]}" opacity="0.9"><title>${label}: ${val}</title></rect>
        <text x="${labelW + w + 6}" y="${y + barH / 2 + 4}" font-size="10" fill="var(--text-tertiary)">${val}</text>`;
    }).join('');
  }

  function _truncate(s, n) { return s.length > n ? s.slice(0, n - 1) + '…' : s; }

  function _renderCharts(stats) {
    const list = allAssets();
    _renderPieChart('ai-chart-os', _groupCount(list, a => a.os));
    _renderBarChart('ai-chart-dept', _groupCount(list, a => a.department));
    _renderPieChart('ai-chart-risk', _groupCount(list, a => a.risk));
    _renderBarChart('ai-chart-status', _groupCount(list, a => a.status));
  }

  // ══════════════════════════════════════════════════════════════════════
  // FILTER OPTIONS
  // ══════════════════════════════════════════════════════════════════════
  function _populateFilterOptions() {
    const d = SD();
    const list = allAssets();
    const opts = (id, values) => {
      const sel = document.getElementById(id);
      if (!sel) return;
      const current = sel.value;
      sel.innerHTML = sel.options[0].outerHTML + [...new Set(values)].filter(Boolean).sort().map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
      sel.value = current || 'all';
    };
    opts('ai-f-type', list.map(a => a.assetType));
    opts('ai-f-status', d.STATUSES.length ? d.STATUSES : list.map(a => a.status));
    opts('ai-f-risk', d.RISK_LEVELS.length ? d.RISK_LEVELS : list.map(a => a.risk));
    opts('ai-f-dept', list.map(a => a.department));
    opts('ai-f-os', list.map(a => a.os));
    opts('ai-f-vendor', list.map(a => a.vendor));
    opts('ai-f-location', list.map(a => a.location));
  }

  // ══════════════════════════════════════════════════════════════════════
  // FILTER + SORT + TABLE
  // ══════════════════════════════════════════════════════════════════════
  function _filteredSorted() {
    const q = filters.q.trim().toLowerCase();
    let rows = allAssets().filter(a => {
      if (filters.type !== 'all' && a.assetType !== filters.type) return false;
      if (filters.status !== 'all' && a.status !== filters.status) return false;
      if (filters.risk !== 'all' && a.risk !== filters.risk) return false;
      if (filters.dept !== 'all' && a.department !== filters.dept) return false;
      if (filters.os !== 'all' && a.os !== filters.os) return false;
      if (filters.vendor !== 'all' && a.vendor !== filters.vendor) return false;
      if (filters.location !== 'all' && a.location !== filters.location) return false;
      if (q) {
        const hay = [a.hostname, a.ip, a.assignedUser, a.department, a.os, a.assetType, a.vendor, a.location, (a.tags || []).join(' ')].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    rows.sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (sortKey === 'lastSeen') { av = new Date(av).getTime(); bv = new Date(bv).getTime(); }
      else { av = (av || '').toString().toLowerCase(); bv = (bv || '').toString().toLowerCase(); }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return rows;
  }

  function _renderAll() {
    _refreshStatsStatic();
    _populateFilterOptions();
    _renderTable();
  }

  function _renderTable() {
    const rows = _filteredSorted();
    const total = rows.length;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    currentPage = Math.min(currentPage, pages);
    const start = (currentPage - 1) * PAGE_SIZE;
    const slice = rows.slice(start, start + PAGE_SIZE);

    document.getElementById('ai-result-count').textContent = `${total} of ${allAssets().length} assets`;

    document.querySelectorAll('#page-asset-inventory .ai-table thead th[data-sort]').forEach(th => {
      th.classList.toggle('sorted', th.dataset.sort === sortKey);
      th.dataset.dir = th.dataset.sort === sortKey ? sortDir : '';
    });

    const tbody = document.getElementById('ai-table-body');
    if (!slice.length) {
      tbody.innerHTML = `<tr><td colspan="14"><div class="empty-state"><div class="empty-state-title">No assets match</div><div class="empty-state-desc">Try clearing filters or your search term.</div></div></td></tr>`;
    } else {
      tbody.innerHTML = slice.map(a => `
        <tr class="ai-row" data-id="${a.id}">
          <td>${svg(TYPE_ICON[a.assetType] || 'question', 'ai-inline-icon')} <strong>${esc(a.hostname)}</strong></td>
          <td class="mono">${esc(a.ip)}</td>
          <td class="mono" style="font-size:11px;">${esc(a.mac || '—')}</td>
          <td>${esc(a.assetType)}</td>
          <td>${esc(a.os)}</td>
          <td>${esc(a.vendor)}</td>
          <td>${esc(a.department)}</td>
          <td>${esc(a.assignedUser)}</td>
          <td>${esc(a.location)}</td>
          <td><span class="badge ${RISK_CLS[a.risk] || 'badge-neutral'}">${esc(a.risk)}</span></td>
          <td><span class="badge ${STATUS_CLS[a.status] || 'badge-neutral'}">${esc(a.status)}</span></td>
          <td><span class="badge ${PATCH_CLS[a.patchStatus] || 'badge-neutral'}">${esc(a.patchStatus)}</span></td>
          <td class="mono" style="font-size:11px;">${esc(a.lastSeen)}</td>
          <td class="ai-actions-cell">
            <button class="btn-icon ai-edit-btn" data-id="${a.id}" title="Edit">${svg('edit')}</button>
            <button class="btn-icon ai-del-btn" data-id="${a.id}" title="Delete">${svg('trash')}</button>
          </td>
        </tr>`).join('');
    }

    tbody.querySelectorAll('.ai-row').forEach(tr => tr.addEventListener('click', e => {
      if (e.target.closest('.ai-edit-btn') || e.target.closest('.ai-del-btn')) return;
      _openDrawer(tr.dataset.id);
    }));
    tbody.querySelectorAll('.ai-edit-btn').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); _openAddEditModal(btn.dataset.id); }));
    tbody.querySelectorAll('.ai-del-btn').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); _confirmDelete(btn.dataset.id); }));

    _renderPagination(pages);
  }

  function _renderPagination(pages) {
    const box = document.getElementById('ai-pagination');
    if (!box) return;
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
  // DETAIL DRAWER (Overview / Network / Security / Applications / Timeline / Notes)
  // ══════════════════════════════════════════════════════════════════════
  function _buildDrawer() {
    return `
    <div class="ai-drawer-overlay" id="ai-drawer-overlay">
      <div class="ai-drawer" id="ai-drawer">
        <div class="ai-drawer-header">
          <div>
            <div class="ai-drawer-title" id="ai-drawer-title">Asset</div>
            <div class="ai-drawer-sub" id="ai-drawer-sub"></div>
          </div>
          <div class="ai-drawer-close" id="ai-drawer-close">${svg('close')}</div>
        </div>
        <div class="ai-drawer-tabs">
          <div class="ai-drawer-tab active" data-dtab="overview">Overview</div>
          <div class="ai-drawer-tab" data-dtab="network">Network</div>
          <div class="ai-drawer-tab" data-dtab="security">Security</div>
          <div class="ai-drawer-tab" data-dtab="applications">Applications</div>
          <div class="ai-drawer-tab" data-dtab="timeline">Timeline</div>
          <div class="ai-drawer-tab" data-dtab="notes">Notes</div>
        </div>
        <div class="ai-drawer-body" id="ai-drawer-body"></div>
      </div>
    </div>`;
  }

  function _wireDrawer() {
    document.getElementById('ai-drawer-close')?.addEventListener('click', _closeDrawer);
    document.getElementById('ai-drawer-overlay')?.addEventListener('click', e => { if (e.target.id === 'ai-drawer-overlay') _closeDrawer(); });
    document.querySelectorAll('#ai-drawer .ai-drawer-tab').forEach(tab => tab.addEventListener('click', () => {
      document.querySelectorAll('#ai-drawer .ai-drawer-tab').forEach(t => t.classList.toggle('active', t === tab));
      _renderDrawerTab(tab.dataset.dtab);
    }));
  }

  let drawerAssetId = null;
  function _openDrawer(assetId) {
    drawerAssetId = assetId;
    const a = findAsset(assetId);
    if (!a) return;
    document.getElementById('ai-drawer-title').textContent = a.hostname;
    document.getElementById('ai-drawer-sub').textContent = `${a.assetType} · ${a.department} · ${a.location}`;
    document.querySelectorAll('#ai-drawer .ai-drawer-tab').forEach(t => t.classList.toggle('active', t.dataset.dtab === 'overview'));
    _renderDrawerTab('overview');
    document.getElementById('ai-drawer-overlay').classList.add('open');
  }
  function _closeDrawer() { document.getElementById('ai-drawer-overlay').classList.remove('open'); drawerAssetId = null; }

  function _renderDrawerTab(tab) {
    const a = findAsset(drawerAssetId);
    const body = document.getElementById('ai-drawer-body');
    if (!a || !body) return;
    if (tab === 'overview') body.innerHTML = _drawerOverview(a);
    else if (tab === 'network') body.innerHTML = _drawerNetwork(a);
    else if (tab === 'security') body.innerHTML = _drawerSecurity(a);
    else if (tab === 'applications') body.innerHTML = _drawerApplications(a);
    else if (tab === 'timeline') body.innerHTML = _drawerTimeline(a);
    else if (tab === 'notes') body.innerHTML = _drawerNotes(a);
  }

  function _field(label, value) {
    return `<div class="ai-detail-field"><div class="ai-detail-field-label">${esc(label)}</div><div class="ai-detail-field-value">${value == null || value === '' ? '<span style="color:var(--text-tertiary);">—</span>' : esc(String(value))}</div></div>`;
  }

  function _drawerOverview(a) {
    return `
      <div class="ti-tag-row" style="margin-bottom:var(--space-4);">
        <span class="badge ${RISK_CLS[a.risk] || 'badge-neutral'}">${esc(a.risk)} risk</span>
        <span class="badge ${STATUS_CLS[a.status] || 'badge-neutral'}">${esc(a.status)}</span>
        <span class="badge ${PATCH_CLS[a.patchStatus] || 'badge-neutral'}">${esc(a.patchStatus)}</span>
        <span class="badge badge-neutral">${esc(a.criticality)} criticality</span>
      </div>
      <div class="ai-detail-grid">
        ${_field('Device Name', a.deviceName)} ${_field('IP Address', a.ip)}
        ${_field('Operating System', a.os)} ${_field('OS Version', a.osVersion)}
        ${_field('Vendor', a.vendor)} ${_field('Model', a.model)}
        ${_field('Serial Number', a.serialNumber)} ${_field('Assigned User', a.assignedUser)}
        ${_field('Department', a.department)} ${_field('Location', a.location)}
        ${_field('Health', a.health)} ${_field('Last Seen', a.lastSeen)}
      </div>
      <div class="ai-detail-sub-title">Hardware</div>
      <div class="ai-detail-grid">
        ${_field('CPU', a.hardware.cpu)} ${_field('RAM', a.hardware.ram)}
        ${_field('Disk', a.hardware.disk)} ${_field('Motherboard', a.hardware.motherboard)}
        ${_field('BIOS', a.hardware.bios)} ${_field('TPM', a.hardware.tpm)}
        ${_field('GPU', a.hardware.gpu)}
      </div>
      <div class="ai-detail-sub-title">Tags</div>
      <div class="ti-tag-row">${(a.tags || []).map(t => `<span class="badge badge-neutral">${esc(t)}</span>`).join('')}</div>
    `;
  }

  function _drawerNetwork(a) {
    const n = a.network;
    return `<div class="ai-detail-grid">
      ${_field('IPv4', a.ip)} ${_field('IPv6', n.ipv6 || a.ipv6)}
      ${_field('MAC Address', a.mac)} ${_field('Hostname', n.hostname)}
      ${_field('Domain', n.domain)} ${_field('DNS', n.dns)}
      ${_field('Gateway', n.gateway)} ${_field('Subnet', n.subnet)}
      ${_field('DHCP', n.dhcp)} ${_field('Public IP', n.publicIp)}
    </div>
    <div class="ai-detail-sub-title">Open Ports</div>
    <div class="ti-tag-row">${(a.openPorts || []).map(p => `<span class="badge badge-neutral mono">${p}</span>`).join('') || '<span style="color:var(--text-tertiary);font-size:var(--text-sm);">None recorded.</span>'}</div>
    <div class="ai-detail-sub-title">Running Services</div>
    <div class="ti-tag-row">${(a.services || []).map(s => `<span class="badge badge-neutral">${esc(s)}</span>`).join('') || '<span style="color:var(--text-tertiary);font-size:var(--text-sm);">None recorded.</span>'}</div>`;
  }

  function _drawerSecurity(a) {
    const s = a.security;
    return `<div class="ai-detail-grid">
      ${_field('Firewall', s.firewall)} ${_field('Antivirus', s.antivirus)}
      ${_field('EDR', s.edr)} ${_field('Disk Encryption', s.diskEncryption)}
      ${_field('BitLocker', s.bitlocker)} ${_field('Secure Boot', s.secureBoot)}
      ${_field('TPM', s.tpm)} ${_field('Last Scan', s.lastScan)}
      ${_field('Threat Count', s.threatCount)}
    </div>
    <div class="ai-detail-sub-title">Installed Security Products</div>
    <div class="ti-tag-row">${(s.installedProducts || []).map(p => `<span class="badge badge-info">${esc(p)}</span>`).join('')}</div>`;
  }

  function _drawerApplications(a) {
    return `<div class="card"><div class="card-body" style="padding:0;overflow-x:auto;">
      <table class="data-table"><thead><tr><th>Application</th><th>Vendor</th><th>Version</th><th>Install Date</th><th>License</th></tr></thead>
      <tbody>${(a.software || []).map(s => `<tr><td>${esc(s.app)}</td><td>${esc(s.vendor)}</td><td class="mono">${esc(s.version)}</td><td class="mono">${esc(s.installDate)}</td><td><span class="badge badge-neutral">${esc(s.license)}</span></td></tr>`).join('') || '<tr><td colspan="5"><div class="empty-state"><div class="empty-state-desc">No software recorded.</div></div></td></tr>'}</tbody>
      </table></div></div>`;
  }

  function _drawerTimeline(a) {
    return (a.timeline || []).map(t => `
      <div class="ai-timeline-row">
        <div class="ai-timeline-dot"></div>
        <div>
          <div class="ai-timeline-head"><strong>${esc(t.event)}</strong> <span style="color:var(--text-tertiary);">— ${esc(t.date)}</span></div>
          <div class="ai-timeline-detail">${esc(t.detail)}</div>
        </div>
      </div>`).join('') || '<div style="color:var(--text-tertiary);font-size:var(--text-sm);">No timeline events recorded.</div>';
  }

  function _drawerNotes(a) {
    const notes = (a.notes || []).slice().reverse();
    return `
      ${notes.map(n => `<div class="df-note"><div class="df-note-meta">${esc(n.author)} &middot; ${esc(n.date)}</div><div class="df-note-text">${esc(n.text)}</div></div>`).join('') || '<div style="color:var(--text-tertiary);font-size:var(--text-sm);margin-bottom:var(--space-3);">No notes yet.</div>'}
      <textarea class="input" id="ai-note-text" rows="2" placeholder="Add a note about this asset…" style="margin-top:var(--space-2);"></textarea>
      <button class="btn btn-secondary btn-sm" id="ai-note-add" style="margin-top:var(--space-2);">${svg('plus')} Add Note</button>
    `;
  }

  // ══════════════════════════════════════════════════════════════════════
  // ADD / EDIT ASSET MODAL
  // ══════════════════════════════════════════════════════════════════════
  function _buildAddEditModal() {
    const d = SD();
    const typeOpts = (d.TYPE_TEMPLATES.length ? d.TYPE_TEMPLATES.map(t => t.type) : ['Desktop']).map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
    return `
    <div class="ai-modal-overlay" id="ai-modal-overlay">
      <div class="ai-modal" id="ai-modal">
        <div class="ai-modal-header">
          <div class="ai-modal-title" id="ai-modal-title">Add Asset</div>
          <div class="ai-detail-close" id="ai-modal-close">${svg('close')}</div>
        </div>
        <div class="ai-modal-body">
          <input type="hidden" id="ai-form-id" />
          <div class="ai-form-grid">
            <div class="ai-form-row"><label class="ai-label">Hostname *</label><input type="text" class="input" id="ai-form-hostname" /></div>
            <div class="ai-form-row"><label class="ai-label">Asset Type *</label><select class="input" id="ai-form-type">${typeOpts}</select></div>
            <div class="ai-form-row"><label class="ai-label">IP Address</label><input type="text" class="input" id="ai-form-ip" placeholder="e.g. 10.0.1.20" /></div>
            <div class="ai-form-row"><label class="ai-label">MAC Address</label><input type="text" class="input" id="ai-form-mac" placeholder="e.g. 00:1B:44:11:3A:B7" /></div>
            <div class="ai-form-row"><label class="ai-label">Operating System</label><input type="text" class="input" id="ai-form-os" /></div>
            <div class="ai-form-row"><label class="ai-label">OS Version</label><input type="text" class="input" id="ai-form-osversion" /></div>
            <div class="ai-form-row"><label class="ai-label">Vendor</label><input type="text" class="input" id="ai-form-vendor" /></div>
            <div class="ai-form-row"><label class="ai-label">Model</label><input type="text" class="input" id="ai-form-model" /></div>
            <div class="ai-form-row"><label class="ai-label">Department</label><input type="text" class="input" id="ai-form-dept" /></div>
            <div class="ai-form-row"><label class="ai-label">Assigned User</label><input type="text" class="input" id="ai-form-user" /></div>
            <div class="ai-form-row"><label class="ai-label">Location</label><input type="text" class="input" id="ai-form-location" /></div>
            <div class="ai-form-row"><label class="ai-label">Owner</label><input type="text" class="input" id="ai-form-owner" /></div>
            <div class="ai-form-row"><label class="ai-label">Criticality</label><select class="input" id="ai-form-criticality"><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></div>
            <div class="ai-form-row"><label class="ai-label">Risk Level</label><select class="input" id="ai-form-risk"><option value="informational">Informational</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></div>
            <div class="ai-form-row"><label class="ai-label">Status</label><select class="input" id="ai-form-status">${(d.STATUSES.length ? d.STATUSES : ['Healthy']).map(s => `<option>${esc(s)}</option>`).join('')}</select></div>
          </div>
          <div class="ai-form-row"><label class="ai-label">Notes</label><textarea class="input" id="ai-form-notes" rows="3"></textarea></div>
          <div class="ai-form-error" id="ai-form-error"></div>
        </div>
        <div class="ai-modal-footer">
          <button class="btn btn-secondary" id="ai-form-cancel">Cancel</button>
          <button class="btn btn-primary" id="ai-form-save">Save</button>
        </div>
      </div>
    </div>`;
  }

  function _wireAddEditModal() {
    document.getElementById('ai-modal-close')?.addEventListener('click', _closeAddEditModal);
    document.getElementById('ai-form-cancel')?.addEventListener('click', _closeAddEditModal);
    document.getElementById('ai-modal-overlay')?.addEventListener('click', e => { if (e.target.id === 'ai-modal-overlay') _closeAddEditModal(); });
    document.getElementById('ai-form-save')?.addEventListener('click', _saveAssetForm);
  }

  function _openAddEditModal(assetId) {
    const isEdit = !!assetId;
    document.getElementById('ai-modal-title').textContent = isEdit ? 'Edit Asset' : 'Add Asset';
    document.getElementById('ai-form-error').textContent = '';
    const a = isEdit ? findAsset(assetId) : null;
    document.getElementById('ai-form-id').value = assetId || '';
    document.getElementById('ai-form-hostname').value = a?.hostname || '';
    document.getElementById('ai-form-type').value = a?.assetType || 'Desktop';
    document.getElementById('ai-form-ip').value = a?.ip || '';
    document.getElementById('ai-form-mac').value = a?.mac || '';
    document.getElementById('ai-form-os').value = a?.os || '';
    document.getElementById('ai-form-osversion').value = a?.osVersion || '';
    document.getElementById('ai-form-vendor').value = a?.vendor || '';
    document.getElementById('ai-form-model').value = a?.model || '';
    document.getElementById('ai-form-dept').value = a?.department || '';
    document.getElementById('ai-form-user').value = a?.assignedUser || '';
    document.getElementById('ai-form-location').value = a?.location || '';
    document.getElementById('ai-form-owner').value = a?.owner || '';
    document.getElementById('ai-form-criticality').value = a?.criticality || 'Medium';
    document.getElementById('ai-form-risk').value = a?.risk || 'low';
    document.getElementById('ai-form-status').value = a?.status || 'Healthy';
    document.getElementById('ai-form-notes').value = (a?.notes || []).map(n => n.text).join('\n');
    document.getElementById('ai-modal-overlay').classList.add('open');
  }
  function _closeAddEditModal() { document.getElementById('ai-modal-overlay').classList.remove('open'); }

  function _saveAssetForm() {
    const hostname = document.getElementById('ai-form-hostname').value.trim();
    const ip = document.getElementById('ai-form-ip').value.trim();
    const errEl = document.getElementById('ai-form-error');
    if (!hostname) { errEl.textContent = 'Hostname is required.'; return; }
    if (ip && !/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) { errEl.textContent = 'IP address format looks invalid (expected e.g. 10.0.1.20).'; return; }
    errEl.textContent = '';

    const id = document.getElementById('ai-form-id').value;
    const type = document.getElementById('ai-form-type').value;
    const fields = {
      hostname, deviceName: hostname, assetType: type,
      category: (SD().TYPE_TEMPLATES.find(t => t.type === type) || {}).category || 'Unknown Devices',
      ip, mac: document.getElementById('ai-form-mac').value.trim(),
      os: document.getElementById('ai-form-os').value.trim(), osVersion: document.getElementById('ai-form-osversion').value.trim(),
      vendor: document.getElementById('ai-form-vendor').value.trim(), model: document.getElementById('ai-form-model').value.trim(),
      department: document.getElementById('ai-form-dept').value.trim(), assignedUser: document.getElementById('ai-form-user').value.trim(),
      location: document.getElementById('ai-form-location').value.trim(), owner: document.getElementById('ai-form-owner').value.trim(),
      criticality: document.getElementById('ai-form-criticality').value, risk: document.getElementById('ai-form-risk').value,
      status: document.getElementById('ai-form-status').value, lastSeen: new Date().toISOString().slice(0, 16).replace('T', ' '),
      patchStatus: 'Unknown', health: 'Good', tags: [],
      network: { hostname, domain: '', dns: '', gateway: '', subnet: '', dhcp: '', publicIp: '' },
      hardware: { cpu: '', ram: '', disk: '', motherboard: '', bios: '', tpm: '', gpu: '', serial: '' },
      security: { firewall: '', antivirus: '', edr: '', diskEncryption: '', bitlocker: '', secureBoot: '', tpm: '', lastScan: '', threatCount: 0, installedProducts: [] },
      software: [], services: [], openPorts: [],
      timeline: [{ date: new Date().toISOString().slice(0, 10), event: id ? 'Asset Updated' : 'Asset Created', detail: id ? 'Fields updated by user.' : `${hostname} manually added to inventory.` }],
      notes: document.getElementById('ai-form-notes').value.trim() ? [{ author: 'Current User', date: new Date().toISOString().slice(0, 10), text: document.getElementById('ai-form-notes').value.trim() }] : [],
    };

    if (id) {
      const existingCustomIdx = customAssets.findIndex(a => a.id === id);
      if (existingCustomIdx >= 0) {
        customAssets[existingCustomIdx] = { ...customAssets[existingCustomIdx], ...fields };
      } else {
        overrides[id] = { ...(overrides[id] || {}), ...fields };
      }
      window.NotificationManager?.success('Asset Updated', `${hostname} was updated.`);
    } else {
      customAssets.push({ id: uid('ast'), serialNumber: uid('SN').toUpperCase(), ipv6: '', ...fields });
      window.NotificationManager?.success('Asset Created', `${hostname} was added to the inventory.`);
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
    <div class="ai-modal-overlay" id="ai-confirm-overlay">
      <div class="ai-modal ai-modal-sm">
        <div class="ai-modal-header"><div class="ai-modal-title">Delete Asset</div><div class="ai-detail-close" id="ai-confirm-close">${svg('close')}</div></div>
        <div class="ai-modal-body"><p id="ai-confirm-text" style="color:var(--text-secondary);font-size:var(--text-sm);"></p></div>
        <div class="ai-modal-footer">
          <button class="btn btn-secondary" id="ai-confirm-cancel">Cancel</button>
          <button class="btn btn-danger" id="ai-confirm-delete">Delete</button>
        </div>
      </div>
    </div>`;
  }
  let pendingDeleteId = null;
  function _wireConfirmModal() {
    document.getElementById('ai-confirm-close')?.addEventListener('click', _closeConfirm);
    document.getElementById('ai-confirm-cancel')?.addEventListener('click', _closeConfirm);
    document.getElementById('ai-confirm-overlay')?.addEventListener('click', e => { if (e.target.id === 'ai-confirm-overlay') _closeConfirm(); });
    document.getElementById('ai-confirm-delete')?.addEventListener('click', () => {
      if (!pendingDeleteId) return;
      const a = findAsset(pendingDeleteId);
      if (customAssets.some(c => c.id === pendingDeleteId)) customAssets = customAssets.filter(c => c.id !== pendingDeleteId);
      else deletedIds.add(pendingDeleteId);
      _savePersisted();
      _closeConfirm();
      _renderAll();
      window.NotificationManager?.success('Asset Deleted', a ? `${a.hostname} was removed from inventory.` : 'Asset removed.');
    });
  }
  function _confirmDelete(assetId) {
    const a = findAsset(assetId);
    if (!a) return;
    pendingDeleteId = assetId;
    document.getElementById('ai-confirm-text').textContent = `Are you sure you want to delete "${a.hostname}"? This cannot be undone.`;
    document.getElementById('ai-confirm-overlay').classList.add('open');
  }
  function _closeConfirm() { document.getElementById('ai-confirm-overlay').classList.remove('open'); pendingDeleteId = null; }

  // ══════════════════════════════════════════════════════════════════════
  // IMPORT (offline JSON / CSV, with preview)
  // ══════════════════════════════════════════════════════════════════════
  function _buildImportModal() {
    return `
    <div class="ai-modal-overlay" id="ai-import-overlay">
      <div class="ai-modal">
        <div class="ai-modal-header"><div class="ai-modal-title">Import Assets</div><div class="ai-detail-close" id="ai-import-close">${svg('close')}</div></div>
        <div class="ai-modal-body">
          <p style="color:var(--text-secondary);font-size:var(--text-sm);margin-bottom:var(--space-3);">Paste JSON (array of asset objects with at least a <span class="mono">hostname</span> field) or CSV with a header row. Everything is processed locally in your browser.</p>
          <textarea class="input" id="ai-import-text" rows="8" placeholder='[{"hostname":"NEW-WS-001","ip":"10.0.2.99","assetType":"Desktop"}]' style="font-family:var(--font-mono);font-size:12px;"></textarea>
          <div style="display:flex;gap:var(--space-3);margin-top:var(--space-3);">
            <button class="btn btn-secondary btn-sm" id="ai-import-preview">Preview</button>
          </div>
          <div id="ai-import-preview-box" style="margin-top:var(--space-3);"></div>
        </div>
        <div class="ai-modal-footer">
          <button class="btn btn-secondary" id="ai-import-cancel">Cancel</button>
          <button class="btn btn-primary" id="ai-import-confirm" disabled>Import</button>
        </div>
      </div>
    </div>`;
  }

  let importPreviewRows = [];
  function _wireImportModal() {
    document.getElementById('ai-import-close')?.addEventListener('click', _closeImportModal);
    document.getElementById('ai-import-cancel')?.addEventListener('click', _closeImportModal);
    document.getElementById('ai-import-overlay')?.addEventListener('click', e => { if (e.target.id === 'ai-import-overlay') _closeImportModal(); });
    document.getElementById('ai-import-preview')?.addEventListener('click', _previewImport);
    document.getElementById('ai-import-confirm')?.addEventListener('click', _confirmImport);
  }
  function _openImportModal() {
    document.getElementById('ai-import-text').value = '';
    document.getElementById('ai-import-preview-box').innerHTML = '';
    document.getElementById('ai-import-confirm').disabled = true;
    importPreviewRows = [];
    document.getElementById('ai-import-overlay').classList.add('open');
  }
  function _closeImportModal() { document.getElementById('ai-import-overlay').classList.remove('open'); }

  function _parseCSV(text) {
    const lines = text.trim().split('\n').filter(Boolean);
    if (!lines.length) return [];
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    return lines.slice(1).map(line => {
      const cells = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      const obj = {};
      headers.forEach((h, i) => obj[h] = cells[i] || '');
      return obj;
    });
  }

  function _previewImport() {
    const raw = document.getElementById('ai-import-text').value.trim();
    const box = document.getElementById('ai-import-preview-box');
    const confirmBtn = document.getElementById('ai-import-confirm');
    if (!raw) { box.innerHTML = `<div class="empty-state"><div class="empty-state-desc">Paste JSON or CSV data first.</div></div>`; confirmBtn.disabled = true; return; }
    let rows = [];
    try {
      if (raw.startsWith('[') || raw.startsWith('{')) {
        const parsed = JSON.parse(raw);
        rows = Array.isArray(parsed) ? parsed : [parsed];
      } else {
        rows = _parseCSV(raw);
      }
    } catch (e) {
      box.innerHTML = `<div class="empty-state"><div class="empty-state-title">Parse Error</div><div class="empty-state-desc">${esc(e.message)}</div></div>`;
      confirmBtn.disabled = true;
      window.NotificationManager?.error('Import Error', 'Could not parse the provided data.');
      return;
    }
    rows = rows.filter(r => r && r.hostname);
    if (!rows.length) {
      box.innerHTML = `<div class="empty-state"><div class="empty-state-desc">No valid rows found — each row needs at least a "hostname" field.</div></div>`;
      confirmBtn.disabled = true;
      return;
    }
    importPreviewRows = rows;
    box.innerHTML = `
      <div class="ti-result-count" style="margin-bottom:var(--space-2);">${rows.length} asset(s) ready to import</div>
      <div class="card"><div class="card-body" style="padding:0;max-height:220px;overflow:auto;">
        <table class="data-table"><thead><tr><th>Hostname</th><th>Type</th><th>IP</th></tr></thead>
        <tbody>${rows.slice(0, 20).map(r => `<tr><td>${esc(r.hostname)}</td><td>${esc(r.assetType || 'Desktop')}</td><td class="mono">${esc(r.ip || '—')}</td></tr>`).join('')}</tbody>
        </table></div></div>`;
    confirmBtn.disabled = false;
  }

  function _confirmImport() {
    if (!importPreviewRows.length) return;
    importPreviewRows.forEach(r => {
      customAssets.push({
        id: uid('ast'), hostname: r.hostname, deviceName: r.hostname, ip: r.ip || '', mac: r.mac || '',
        os: r.os || 'Unknown', osVersion: r.osVersion || '', assetType: r.assetType || 'Desktop',
        category: (SD().TYPE_TEMPLATES.find(t => t.type === (r.assetType || 'Desktop')) || {}).category || 'Unknown Devices',
        vendor: r.vendor || '', model: r.model || '', serialNumber: r.serialNumber || uid('SN').toUpperCase(),
        department: r.department || 'Unassigned', assignedUser: r.assignedUser || 'Unassigned', owner: r.owner || r.assignedUser || 'Unassigned',
        location: r.location || 'Unknown', risk: r.risk || 'low', criticality: r.criticality || 'Medium',
        status: r.status || 'Healthy', lastSeen: new Date().toISOString().slice(0, 16).replace('T', ' '),
        patchStatus: r.patchStatus || 'Unknown', health: 'Good', tags: [],
        network: { hostname: r.hostname, domain: '', dns: '', gateway: '', subnet: '', dhcp: '', publicIp: '' },
        hardware: { cpu: '', ram: '', disk: '', motherboard: '', bios: '', tpm: '', gpu: '', serial: '' },
        security: { firewall: '', antivirus: '', edr: '', diskEncryption: '', bitlocker: '', secureBoot: '', tpm: '', lastScan: '', threatCount: 0, installedProducts: [] },
        software: [], services: [], openPorts: [],
        timeline: [{ date: new Date().toISOString().slice(0, 10), event: 'Asset Created', detail: `${r.hostname} imported into inventory.` }],
        notes: [],
      });
    });
    _savePersisted();
    _closeImportModal();
    _renderAll();
    window.NotificationManager?.success('Import Complete', `${importPreviewRows.length} asset(s) imported.`);
    importPreviewRows = [];
  }

  // ══════════════════════════════════════════════════════════════════════
  // EXPORT
  // ══════════════════════════════════════════════════════════════════════
  function _download(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function _exportCSV() {
    const rows = _filteredSorted();
    const header = ['hostname', 'ip', 'mac', 'assetType', 'os', 'vendor', 'department', 'assignedUser', 'location', 'risk', 'status', 'patchStatus', 'lastSeen'];
    const csv = [header.join(','), ...rows.map(a => header.map(k => `"${String(a[k] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    _download('asset-inventory.csv', csv, 'text/csv');
    window.NotificationManager?.success('Exported', `${rows.length} asset(s) exported as CSV.`);
  }

  // ══════════════════════════════════════════════════════════════════════
  // PERSISTENCE
  // ══════════════════════════════════════════════════════════════════════
  function _loadPersisted() {
    if (!window.StorageManager) return;
    customAssets = window.StorageManager.lsGet('ai_custom_assets', []) || [];
    deletedIds = new Set(window.StorageManager.lsGet('ai_deleted_ids', []) || []);
    overrides = window.StorageManager.lsGet('ai_overrides', {}) || {};
  }
  function _savePersisted() {
    window.StorageManager?.lsSet('ai_custom_assets', customAssets);
    window.StorageManager?.lsSet('ai_deleted_ids', [...deletedIds]);
    window.StorageManager?.lsSet('ai_overrides', overrides);
  }

  // ══════════════════════════════════════════════════════════════════════
  // NOTES (wired after drawer body render — delegate via drawer body)
  // ══════════════════════════════════════════════════════════════════════
  document.addEventListener('click', e => {
    if (e.target && e.target.id === 'ai-note-add') {
      const text = document.getElementById('ai-note-text')?.value.trim();
      if (!text || !drawerAssetId) return;
      const note = { author: 'Current User', date: new Date().toISOString().slice(0, 10), text };
      const customIdx = customAssets.findIndex(a => a.id === drawerAssetId);
      if (customIdx >= 0) {
        customAssets[customIdx].notes = [...(customAssets[customIdx].notes || []), note];
      } else {
        const base = SD().getAsset(drawerAssetId);
        const existingNotes = (overrides[drawerAssetId] && overrides[drawerAssetId].notes) || (base ? base.notes : []) || [];
        overrides[drawerAssetId] = { ...(overrides[drawerAssetId] || {}), notes: [...existingNotes, note] };
      }
      _savePersisted();
      window.NotificationManager?.success('Note Added', '');
      _renderDrawerTab('notes');
    }
  });

  // ══════════════════════════════════════════════════════════════════════
  // GLOBAL SEARCH INTEGRATION
  // ══════════════════════════════════════════════════════════════════════
  function _registerSearch() {
    if (!window.SearchEngine) return;
    window.SearchEngine.register('Asset Inventory', [
      { title: 'Enterprise Asset Inventory', meta: 'Devices, servers, cloud resources, network gear', route: 'asset-inventory', keywords: 'asset inventory cmdb devices servers workstations cloud network windows linux firewall' },
      ...SD().assets.map(a => ({ title: a.hostname, meta: `${a.assetType} — ${a.department}`, route: 'asset-inventory', keywords: `${a.hostname} ${a.assetType} ${a.os} ${a.department} ${a.location} ${a.vendor}` })),
    ]);
  }

  // ── Public API ─────────────────────────────────────────────────────────
  return { register };

})();

window.AssetInventory = AssetInventory;

if (window.Router) {
  AssetInventory.register();
} else {
  console.error('[AssetInventory] Router not found. Ensure router.js loads before asset-inventory.js.');
}
