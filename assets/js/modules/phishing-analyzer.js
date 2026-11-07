/**
 * KHAN SECURITY SOLUTIONS ENTERPRISE
 * Enterprise Phishing Investigation Lab — Module v1.2.0
 *
 * Offline phishing triage & investigation workbench: animated stat
 * dashboard, pure-SVG charts, a real-time filterable/sortable/paginated
 * email queue, a tabbed detail drawer (Overview, Headers, Authentication,
 * URLs, Attachments, Indicators, Timeline, Notes), Create Investigation,
 * and offline JSON/CSV/.eml-placeholder import & export.
 *
 * [EDUCATIONAL SIMULATION — Ships with 60 deterministically generated
 *  synthetic phishing investigations. No live email, URL, or sandbox
 *  services are contacted. Everything is stored locally via StorageManager.]
 *
 * Integrates with:
 *   window.Router              — route: 'phishing'
 *   window.SearchEngine        — searchable content
 *   window.NotificationManager — alerts and feedback
 *   window.StorageManager      — investigation persistence (localStorage)
 *   window.SamplePhishingData  — bundled sample dataset
 */

const PhishingAnalyzer = (() => {

  // ── State ──────────────────────────────────────────────────────────────
  let mounted     = false;
  let customInv     = [];
  let deletedIds      = new Set();
  let overrides         = {};

  let filters = { q: '', risk: 'all', verdict: 'all', status: 'all', analyst: 'all', category: 'all' };
  let sortKey = 'receivedTime', sortDir = 'desc';
  let currentPage = 1;
  const PAGE_SIZE = 10;

  // ── Icons ──────────────────────────────────────────────────────────────
  const I = {
    shield:   `<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>`,
    mail:     `<path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>`,
    warn:     `<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>`,
    check:    `<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>`,
    x:        `<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>`,
    plus:     `<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>`,
    upload:   `<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>`,
    down:     `<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>`,
    report:   `<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"/>`,
    search:   `<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z"/>`,
    edit:     `<path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"/>`,
    trash:    `<path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>`,
    link:     `<path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"/>`,
    paperclip:`<path stroke-linecap="round" stroke-linejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"/>`,
    hash:     `<path stroke-linecap="round" stroke-linejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5"/>`,
    clock:    `<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>`,
    chevronUp:  `<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5"/>`,
    chevronDown:`<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>`,
  };
  function svg(name, cls = '') { return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">${I[name] || I.shield}</svg>`; }
  function esc(s) { const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function uid(prefix) { return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`; }

  const SD = () => window.SamplePhishingData || { investigations: [], RISK_LEVELS: [], STATUSES: [], CAMPAIGNS: [], ANALYSTS: [], getInvestigation: () => null };

  function allInv() {
    const base = SD().investigations.filter(i => !deletedIds.has(i.id)).map(i => overrides[i.id] ? { ...i, ...overrides[i.id] } : i);
    return [...base, ...customInv];
  }
  function findInv(id) { return allInv().find(i => i.id === id) || null; }

  const RISK_CLS = { critical: 'badge-danger', high: 'badge-high', medium: 'badge-medium', low: 'badge-low', safe: 'badge-success' };
  const VERDICT_CLS = {
    'Confirmed Phishing': 'badge-danger', 'Business Email Compromise': 'badge-danger', 'Credential Harvesting': 'badge-danger',
    'Malicious Attachment': 'badge-danger', Suspicious: 'badge-warning', Spam: 'badge-neutral', Benign: 'badge-success',
  };
  const STATUS_CLS = { New: 'badge-info', Investigating: 'badge-warning', Escalated: 'badge-danger', Resolved: 'badge-success', Closed: 'badge-neutral' };

  // ══════════════════════════════════════════════════════════════════════
  // ROUTE REGISTRATION
  // ══════════════════════════════════════════════════════════════════════
  function register() { window.Router.register('phishing', { title: 'Phishing Analyzer', init, render }); }
  function init() { _loadPersisted(); _registerSearch(); }
  function render() {
    const el = document.getElementById('page-phishing');
    if (!el) return;
    if (!mounted) { el.innerHTML = _buildShell(); mounted = true; _wireAll(); _animateStats(); }
    else _renderAll();
  }

  // ══════════════════════════════════════════════════════════════════════
  // SHELL
  // ══════════════════════════════════════════════════════════════════════
  function _buildShell() {
    return `
    <div class="ph-shell">
      <div class="ph-header">
        <div>
          <div class="ph-header-title">Enterprise Phishing Investigation Lab</div>
          <div class="ph-header-sub">Investigate suspicious emails, phishing campaigns and malicious attachments.</div>
        </div>
        <div class="ph-header-actions">
          <button class="btn btn-secondary btn-sm" id="ph-btn-import">${svg('upload')} Import Email</button>
          <button class="btn btn-secondary btn-sm" id="ph-btn-export">${svg('down')} Export Investigation</button>
          <button class="btn btn-secondary btn-sm" id="ph-btn-report">${svg('report')} Generate Report</button>
          <button class="btn btn-primary btn-sm" id="ph-btn-add">${svg('plus')} Analyze Email</button>
        </div>
      </div>

      <div class="ph-body">
        <div class="grid grid-stats ph-stats" id="ph-stats"></div>

        <div class="ir-charts-grid">
          <div class="card"><div class="card-header"><div class="card-title">Phishing by Category</div></div><div class="card-body"><svg id="ph-chart-category" viewBox="0 0 300 180" class="ai-chart-svg"></svg></div></div>
          <div class="card"><div class="card-header"><div class="card-title">Risk Distribution</div></div><div class="card-body"><svg id="ph-chart-risk" viewBox="0 0 300 180" class="ai-chart-svg"></svg></div></div>
          <div class="card"><div class="card-header"><div class="card-title">Campaign Timeline</div></div><div class="card-body"><svg id="ph-chart-campaign" viewBox="0 0 300 180" class="ai-chart-svg"></svg></div></div>
          <div class="card"><div class="card-header"><div class="card-title">Top Sender Domains</div></div><div class="card-body"><svg id="ph-chart-domains" viewBox="0 0 300 180" class="ai-chart-svg"></svg></div></div>
          <div class="card"><div class="card-header"><div class="card-title">Most Targeted Users</div></div><div class="card-body"><svg id="ph-chart-targets" viewBox="0 0 300 180" class="ai-chart-svg"></svg></div></div>
        </div>

        <div class="card ai-filter-card">
          <div class="card-body">
            <div class="ai-filter-bar">
              <div class="ti-search-box" style="flex:2;min-width:220px;">
                ${svg('search', 'ph-inline-icon')}
                <input type="text" id="ph-f-search" placeholder="Search subject, sender, recipient, category…" />
              </div>
              <select class="input ai-filter-select" id="ph-f-risk"><option value="all">All Risk Levels</option></select>
              <select class="input ai-filter-select" id="ph-f-verdict"><option value="all">All Verdicts</option></select>
              <select class="input ai-filter-select" id="ph-f-status"><option value="all">All Statuses</option></select>
              <select class="input ai-filter-select" id="ph-f-analyst"><option value="all">All Analysts</option></select>
              <select class="input ai-filter-select" id="ph-f-category"><option value="all">All Categories</option></select>
              <button class="btn btn-secondary btn-sm" id="ph-f-clear">${svg('x')} Clear</button>
            </div>
          </div>
        </div>

        <div class="ai-result-count" id="ph-result-count"></div>
        <div class="card ai-table-card">
          <div class="card-body" style="padding:0;overflow-x:auto;">
            <table class="data-table ai-table">
              <thead>
                <tr>
                  <th data-sort="id">Email ID</th><th data-sort="sender">Sender</th><th data-sort="recipient">Recipient</th>
                  <th data-sort="subject">Subject</th><th data-sort="receivedTime">Received</th><th data-sort="riskScore">Risk</th>
                  <th data-sort="verdict">Verdict</th><th data-sort="campaign">Campaign</th><th>Attach.</th>
                  <th data-sort="urlCount">URLs</th><th data-sort="status">Status</th><th data-sort="assignedAnalyst">Analyst</th><th></th>
                </tr>
              </thead>
              <tbody id="ph-table-body"></tbody>
            </table>
          </div>
          <div class="ai-pagination" id="ph-pagination"></div>
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
    document.getElementById('ph-btn-import')?.addEventListener('click', _openImportModal);
    document.getElementById('ph-btn-export')?.addEventListener('click', _exportCurrentSelection);
    document.getElementById('ph-btn-report')?.addEventListener('click', _openReportChoice);
    document.getElementById('ph-btn-add')?.addEventListener('click', () => _openAddEditModal(null));

    document.getElementById('ph-f-search')?.addEventListener('input', e => { filters.q = e.target.value; currentPage = 1; _renderAll(); });
    ['risk', 'verdict', 'status', 'analyst', 'category'].forEach(key => {
      document.getElementById(`ph-f-${key}`)?.addEventListener('change', e => { filters[key] = e.target.value; currentPage = 1; _renderAll(); });
    });
    document.getElementById('ph-f-clear')?.addEventListener('click', () => {
      filters = { q: '', risk: 'all', verdict: 'all', status: 'all', analyst: 'all', category: 'all' };
      document.getElementById('ph-f-search').value = '';
      document.querySelectorAll('#page-phishing .ai-filter-select').forEach(sel => sel.value = 'all');
      currentPage = 1; _renderAll();
    });
    document.querySelectorAll('#page-phishing .ai-table thead th[data-sort]').forEach(th => {
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
    const list = allInv();
    const confirmed = list.filter(i => i.verdict === 'Confirmed Phishing' || i.verdict === 'Business Email Compromise').length;
    const suspicious = list.filter(i => i.verdict === 'Suspicious').length;
    const benign = list.filter(i => i.verdict === 'Benign' || i.verdict === 'Spam').length;
    const campaigns = new Set(list.map(i => i.campaign).filter(c => c && c !== 'None')).size;
    const blocked = list.filter(i => i.blocked).length;
    const attachments = list.filter(i => i.hasAttachment).length;
    const maliciousUrls = list.reduce((s, i) => s + (i.urls || []).filter(u => u.risk === 'critical' || u.risk === 'high').length, 0);
    const credTheft = list.filter(i => i.verdict === 'Credential Harvesting').length;
    const avgTime = list.length ? Math.round(list.reduce((s, i) => s + (i.investigationMinutes || 0), 0) / list.length) : 0;
    return { analyzed: list.length, confirmed, suspicious, benign, campaigns, blocked, attachments, maliciousUrls, credTheft, avgTime };
  }

  function _buildStatsHTML(s) {
    const cards = [
      ['Emails Analyzed', s.analyzed, 'mail', 'var(--color-primary)'],
      ['Confirmed Phishing', s.confirmed, 'warn', 'var(--color-danger)'],
      ['Suspicious', s.suspicious, 'warn', 'var(--color-warning)'],
      ['Benign', s.benign, 'check', 'var(--color-success)'],
      ['Campaigns', s.campaigns, 'link', '#a78bfa'],
      ['Blocked', s.blocked, 'shield', 'var(--color-danger)'],
      ['Attachments', s.attachments, 'paperclip', 'var(--color-info)'],
      ['Malicious URLs', s.maliciousUrls, 'link', '#f97316'],
      ['Credential Theft Attempts', s.credTheft, 'hash', 'var(--color-danger)'],
      ['Avg. Investigation Time', s.avgTime + ' min', 'clock', 'var(--color-primary)'],
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
    document.getElementById('ph-stats').innerHTML = _buildStatsHTML(s);
    document.querySelectorAll('#ph-stats .ai-count').forEach(el => {
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
    const values = [s.analyzed, s.confirmed, s.suspicious, s.benign, s.campaigns, s.blocked, s.attachments, s.maliciousUrls, s.credTheft, s.avgTime + ' min'];
    document.querySelectorAll('#ph-stats .ai-count').forEach((el, idx) => { el.textContent = values[idx]; });
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
    const barH = 22, gap = 8, chartW = 300, labelW = 100;
    el.innerHTML = items.map(([label, val], idx) => {
      const y = idx * (barH + gap) + 6; const w = ((chartW - labelW - 40) * val) / max;
      return `<text x="0" y="${y + barH / 2 + 4}" font-size="10" fill="var(--text-secondary)">${esc(_truncate(label, 15))}</text>
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
    const list = allInv();
    _renderBarChart('ph-chart-category', _groupCount(list, i => i.category));
    _renderPieChart('ph-chart-risk', _groupCount(list, i => i.riskScore));
    const months = [];
    for (let m = 5; m >= 0; m--) { const d = new Date(); d.setMonth(d.getMonth() - m); months.push(d.toISOString().slice(0, 7)); }
    const trendPoints = months.map(m => ({ label: m.slice(5), value: list.filter(i => (i.receivedTime || '').slice(0, 7) === m).length }));
    _renderLineChart('ph-chart-campaign', trendPoints);
    _renderBarChart('ph-chart-domains', _groupCount(list, i => (i.sender || '').split('@')[1]));
    _renderBarChart('ph-chart-targets', _groupCount(list, i => i.recipient));
  }

  // ══════════════════════════════════════════════════════════════════════
  // FILTER OPTIONS / TABLE
  // ══════════════════════════════════════════════════════════════════════
  function _populateFilterOptions() {
    const d = SD(); const list = allInv();
    const opts = (id, values) => {
      const sel = document.getElementById(id); if (!sel) return;
      const current = sel.value;
      sel.innerHTML = sel.options[0].outerHTML + [...new Set(values)].filter(Boolean).sort().map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
      sel.value = current || 'all';
    };
    opts('ph-f-risk', d.RISK_LEVELS.length ? d.RISK_LEVELS : list.map(i => i.riskScore));
    opts('ph-f-verdict', list.map(i => i.verdict));
    opts('ph-f-status', d.STATUSES.length ? d.STATUSES : list.map(i => i.status));
    opts('ph-f-analyst', d.ANALYSTS.length ? d.ANALYSTS : list.map(i => i.assignedAnalyst));
    opts('ph-f-category', list.map(i => i.category));
  }

  function _filteredSorted() {
    const q = filters.q.trim().toLowerCase();
    let rows = allInv().filter(i => {
      if (filters.risk !== 'all' && i.riskScore !== filters.risk) return false;
      if (filters.verdict !== 'all' && i.verdict !== filters.verdict) return false;
      if (filters.status !== 'all' && i.status !== filters.status) return false;
      if (filters.analyst !== 'all' && i.assignedAnalyst !== filters.analyst) return false;
      if (filters.category !== 'all' && i.category !== filters.category) return false;
      if (q) {
        const hay = [i.id, i.sender, i.recipient, i.subject, i.category, i.verdict].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    rows.sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (sortKey === 'receivedTime') { av = new Date(av).getTime(); bv = new Date(bv).getTime(); }
      else if (sortKey === 'urlCount') { av = a.urlCount || 0; bv = b.urlCount || 0; }
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

    document.getElementById('ph-result-count').textContent = `${total} of ${allInv().length} emails`;
    document.querySelectorAll('#page-phishing .ai-table thead th[data-sort]').forEach(th => {
      th.classList.toggle('sorted', th.dataset.sort === sortKey);
      th.dataset.dir = th.dataset.sort === sortKey ? sortDir : '';
    });

    const tbody = document.getElementById('ph-table-body');
    if (!slice.length) {
      tbody.innerHTML = `<tr><td colspan="13"><div class="empty-state"><div class="empty-state-title">No emails match</div><div class="empty-state-desc">Try clearing filters or your search term.</div></div></td></tr>`;
    } else {
      tbody.innerHTML = slice.map(i => `
        <tr class="ai-row" data-id="${i.id}">
          <td class="mono">${esc(i.id)}</td>
          <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;">${esc(i.sender)}</td>
          <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;">${esc(i.recipient)}</td>
          <td><strong>${esc(_truncate(i.subject, 36))}</strong></td>
          <td class="mono" style="font-size:11px;">${esc(i.receivedTime)}</td>
          <td><span class="badge ${RISK_CLS[i.riskScore] || 'badge-neutral'}">${esc(i.riskScore)}</span></td>
          <td><span class="badge ${VERDICT_CLS[i.verdict] || 'badge-neutral'}">${esc(i.verdict)}</span></td>
          <td>${i.campaign && i.campaign !== 'None' ? esc(i.campaign) : '<span style="color:var(--text-tertiary);">—</span>'}</td>
          <td>${i.hasAttachment ? svg('paperclip', 'ph-inline-icon') : '—'}</td>
          <td>${i.urlCount}</td>
          <td><span class="badge ${STATUS_CLS[i.status] || 'badge-neutral'}">${esc(i.status)}</span></td>
          <td>${esc(i.assignedAnalyst)}</td>
          <td class="ai-actions-cell">
            <button class="btn-icon ph-edit-btn" data-id="${i.id}" title="Edit">${svg('edit')}</button>
            <button class="btn-icon ph-del-btn" data-id="${i.id}" title="Delete">${svg('trash')}</button>
          </td>
        </tr>`).join('');
    }
    tbody.querySelectorAll('.ai-row').forEach(tr => tr.addEventListener('click', e => {
      if (e.target.closest('.ph-edit-btn') || e.target.closest('.ph-del-btn')) return;
      _openDrawer(tr.dataset.id);
    }));
    tbody.querySelectorAll('.ph-edit-btn').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); _openAddEditModal(btn.dataset.id); }));
    tbody.querySelectorAll('.ph-del-btn').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); _confirmDelete(btn.dataset.id); }));

    _renderPagination(pages);
  }

  function _renderPagination(pages) {
    const box = document.getElementById('ph-pagination'); if (!box) return;
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
  // DETAIL DRAWER — 8 tabs
  // ══════════════════════════════════════════════════════════════════════
  function _buildDrawer() {
    return `
    <div class="ai-drawer-overlay" id="ph-drawer-overlay">
      <div class="ai-drawer" id="ph-drawer" style="max-width:700px;">
        <div class="ai-drawer-header">
          <div><div class="ai-drawer-title" id="ph-drawer-title">Email</div><div class="ai-drawer-sub" id="ph-drawer-sub"></div></div>
          <div class="ai-drawer-close" id="ph-drawer-close">${svg('x')}</div>
        </div>
        <div class="ai-drawer-tabs">
          <div class="ai-drawer-tab active" data-dtab="overview">Overview</div>
          <div class="ai-drawer-tab" data-dtab="headers">Headers</div>
          <div class="ai-drawer-tab" data-dtab="auth">Authentication</div>
          <div class="ai-drawer-tab" data-dtab="urls">URLs</div>
          <div class="ai-drawer-tab" data-dtab="attachments">Attachments</div>
          <div class="ai-drawer-tab" data-dtab="iocs">Indicators</div>
          <div class="ai-drawer-tab" data-dtab="timeline">Timeline</div>
          <div class="ai-drawer-tab" data-dtab="notes">Notes</div>
        </div>
        <div class="ai-drawer-body" id="ph-drawer-body"></div>
      </div>
    </div>`;
  }

  function _wireDrawer() {
    document.getElementById('ph-drawer-close')?.addEventListener('click', _closeDrawer);
    document.getElementById('ph-drawer-overlay')?.addEventListener('click', e => { if (e.target.id === 'ph-drawer-overlay') _closeDrawer(); });
    document.querySelectorAll('#ph-drawer .ai-drawer-tab').forEach(tab => tab.addEventListener('click', () => {
      document.querySelectorAll('#ph-drawer .ai-drawer-tab').forEach(t => t.classList.toggle('active', t === tab));
      _renderDrawerTab(tab.dataset.dtab);
    }));
  }

  let drawerInvId = null;
  function _openDrawer(invId) {
    drawerInvId = invId;
    const i = findInv(invId); if (!i) return;
    document.getElementById('ph-drawer-title').textContent = i.subject;
    document.getElementById('ph-drawer-sub').textContent = `${i.id} · ${i.sender} · ${i.verdict}`;
    document.querySelectorAll('#ph-drawer .ai-drawer-tab').forEach(t => t.classList.toggle('active', t.dataset.dtab === 'overview'));
    _renderDrawerTab('overview');
    document.getElementById('ph-drawer-overlay').classList.add('open');
  }
  function _closeDrawer() { document.getElementById('ph-drawer-overlay').classList.remove('open'); drawerInvId = null; }

  function _renderDrawerTab(tab) {
    const i = findInv(drawerInvId);
    const body = document.getElementById('ph-drawer-body');
    if (!i || !body) return;
    const map = { overview: _drOverview, headers: _drHeaders, auth: _drAuth, urls: _drUrls, attachments: _drAttachments, iocs: _drIocs, timeline: _drTimeline, notes: _drNotes };
    body.innerHTML = (map[tab] || _drOverview)(i);
    if (tab === 'overview') _wireVerdictSelect(i);
  }

  function _field(label, value) {
    return `<div class="ai-detail-field"><div class="ai-detail-field-label">${esc(label)}</div><div class="ai-detail-field-value">${value == null || value === '' ? '<span style="color:var(--text-tertiary);">—</span>' : esc(String(value))}</div></div>`;
  }

  function _drOverview(i) {
    const d = SD();
    const verdictOpts = ['Confirmed Phishing', 'Suspicious', 'Spam', 'Benign', 'Malicious Attachment', 'Credential Harvesting', 'Business Email Compromise'];
    return `
      <div class="ti-tag-row" style="margin-bottom:var(--space-4);">
        <span class="badge ${RISK_CLS[i.riskScore] || 'badge-neutral'}">${esc(i.riskScore)} risk</span>
        <span class="badge ${STATUS_CLS[i.status] || 'badge-neutral'}">${esc(i.status)}</span>
        ${i.blocked ? '<span class="badge badge-danger">Blocked at Gateway</span>' : ''}
      </div>
      <div class="ai-detail-grid">
        ${_field('Sender', i.sender)} ${_field('Recipient', i.recipient)}
        ${_field('Received', i.receivedTime)} ${_field('Category', i.category)}
        ${_field('Campaign', i.campaign)} ${_field('Assigned Analyst', i.assignedAnalyst)}
        ${_field('Investigation Time', i.investigationMinutes + ' min')} ${_field('URL Count', i.urlCount)}
      </div>
      <div class="ai-detail-sub-title">Verdict</div>
      <div style="display:flex;gap:var(--space-3);align-items:center;">
        <select class="input" id="ph-verdict-select" style="max-width:280px;">
          ${verdictOpts.map(v => `<option ${v === i.verdict ? 'selected' : ''}>${esc(v)}</option>`).join('')}
        </select>
        <button class="btn btn-secondary btn-sm" id="ph-verdict-save">Update Verdict</button>
      </div>`;
  }
  function _wireVerdictSelect(i) {
    document.getElementById('ph-verdict-save')?.addEventListener('click', () => {
      const val = document.getElementById('ph-verdict-select').value;
      i.verdict = val;
      _persistMutation(i);
      window.NotificationManager?.success('Verdict Updated', `${i.id} marked as ${val}.`);
      _renderTable();
      _renderDrawerTab('overview');
    });
  }

  function _drHeaders(i) {
    const h = i.headers || {};
    return `<div class="ai-detail-grid">
      ${_field('Return-Path', h.returnPath)} ${_field('From', h.from)}
      ${_field('To', h.to)} ${_field('Reply-To', h.replyTo)}
      ${_field('SPF', h.spf)} ${_field('DKIM', h.dkim)}
      ${_field('DMARC', h.dmarc)} ${_field('Message-ID', h.messageId)}
      ${_field('Originating IP', h.originatingIp)}
    </div>
    <div class="ai-detail-sub-title">Received Chain</div>
    <div class="ti-tag-row">${(h.receivedChain || []).map(hop => `<span class="badge badge-neutral mono">${esc(hop)}</span>`).join('')}</div>`;
  }

  function _drAuth(i) {
    const a = i.auth || {};
    const statusCard = (label, val) => `
      <div class="ph-auth-card ${val === 'Pass' ? 'pass' : 'fail'}">
        <div class="ph-auth-card-icon">${svg(val === 'Pass' ? 'check' : 'x')}</div>
        <div><div class="ph-auth-card-label">${esc(label)}</div><div class="ph-auth-card-value">${esc(val)}</div></div>
      </div>`;
    return `
      <div class="ph-auth-grid">${statusCard('SPF', a.spf)}${statusCard('DKIM', a.dkim)}${statusCard('DMARC', a.dmarc)}</div>
      <div class="ph-auth-card ${a.spoofingDetected ? 'fail' : 'pass'}" style="margin-top:var(--space-3);">
        <div class="ph-auth-card-icon">${svg(a.spoofingDetected ? 'warn' : 'check')}</div>
        <div><div class="ph-auth-card-label">Spoofing Detection</div><div class="ph-auth-card-value">${a.spoofingDetected ? 'Likely Spoofed' : 'No Spoofing Indicators'}</div></div>
      </div>
      <div class="ai-detail-sub-title">Explanation</div>
      <p style="font-size:var(--text-sm);color:var(--text-secondary);line-height:1.6;">${esc(a.explanation)}</p>`;
  }

  function _drUrls(i) {
    return `<div class="card"><div class="card-body" style="padding:0;overflow-x:auto;">
      <table class="data-table"><thead><tr><th>URL</th><th>Domain</th><th>Reputation</th><th>HTTPS</th><th>Risk</th><th>Status</th><th>Sandbox</th></tr></thead>
      <tbody>${(i.urls || []).map(u => `<tr><td class="mono" style="max-width:220px;overflow:hidden;text-overflow:ellipsis;">${esc(u.url)}</td><td>${esc(u.domain)}</td><td>${esc(u.reputation)}</td><td>${u.https ? '<span class="badge badge-success">Yes</span>' : '<span class="badge badge-danger">No</span>'}</td><td><span class="badge ${RISK_CLS[u.risk] || 'badge-neutral'}">${esc(u.risk)}</span></td><td><span class="badge ${u.status === 'Blocked' ? 'badge-danger' : 'badge-neutral'}">${esc(u.status)}</span></td><td style="color:var(--text-tertiary);font-size:12px;">${esc(u.sandboxResult)}</td></tr>`).join('') || '<tr><td colspan="7"><div class="empty-state"><div class="empty-state-desc">No URLs found in this message.</div></div></td></tr>'}</tbody>
      </table></div></div>`;
  }

  function _drAttachments(i) {
    return `<div class="card"><div class="card-body" style="padding:0;overflow-x:auto;">
      <table class="data-table"><thead><tr><th>Filename</th><th>Type</th><th>Size</th><th>SHA256</th><th>Risk</th><th>Macro</th><th>Password Protected</th></tr></thead>
      <tbody>${(i.attachments || []).map(a => `<tr><td>${esc(a.filename)}</td><td>${esc(a.type)}</td><td>${esc(a.size)}</td><td class="mono" style="font-size:11px;">${esc(_truncate(a.sha256, 20))}</td><td><span class="badge ${RISK_CLS[a.risk] || 'badge-neutral'}">${esc(a.risk)}</span></td><td>${a.macro ? '<span class="badge badge-danger">Yes</span>' : '<span class="badge badge-neutral">No</span>'}</td><td>${a.passwordProtected ? '<span class="badge badge-warning">Yes</span>' : '<span class="badge badge-neutral">No</span>'}</td></tr>`).join('') || '<tr><td colspan="7"><div class="empty-state"><div class="empty-state-desc">No attachments on this message.</div></div></td></tr>'}</tbody>
      </table></div></div>
      ${(i.attachments || []).map(a => `<div class="ph-sandbox-note">${svg('warn', 'ph-inline-icon')} <strong>${esc(a.filename)}</strong>: ${esc(a.sandbox)}</div>`).join('')}`;
  }

  function _drIocs(i) {
    const iocs = i.iocs || {};
    const sections = [
      ['Domains', iocs.domains], ['IPs', iocs.ips], ['Hashes', iocs.hashes],
      ['URLs', iocs.urls], ['Email Addresses', iocs.emails], ['Registry Keys', iocs.registryKeys], ['File Paths', iocs.filePaths],
    ];
    return `
      ${sections.map(([label, vals]) => (vals && vals.length) ? `
        <div class="ai-detail-sub-title">${esc(label)} (${vals.length})</div>
        <div class="ti-tag-row" style="margin-bottom:var(--space-3);">${vals.map(v => `<span class="badge badge-neutral mono" style="word-break:break-all;">${esc(v)}</span>`).join('')}</div>` : '').join('')}
      <button class="btn btn-secondary btn-sm" id="ph-ioc-export">${svg('down')} Export IOC List</button>`;
  }

  function _drTimeline(i) {
    return (i.timeline || []).map(t => `
      <div class="ai-timeline-row"><div class="ai-timeline-dot"></div>
        <div><div class="ai-timeline-head"><strong>${esc(t.event)}</strong> <span style="color:var(--text-tertiary);">— ${esc(t.time)}</span></div>
        <div class="ai-timeline-detail">${esc(t.detail)}</div></div>
      </div>`).join('') || '<div style="color:var(--text-tertiary);font-size:var(--text-sm);">No timeline recorded.</div>';
  }

  function _drNotes(i) {
    const notes = (i.notes || []).slice().reverse();
    return `
      ${notes.map(n => `<div class="df-note"><div class="df-note-meta">${esc(n.author)} &middot; ${esc(n.date)}</div><div class="df-note-text">${esc(n.text)}</div></div>`).join('') || '<div style="color:var(--text-tertiary);font-size:var(--text-sm);margin-bottom:var(--space-3);">No notes yet.</div>'}
      <textarea class="input" id="ph-note-text" rows="2" placeholder="Add an investigation note…" style="margin-top:var(--space-2);"></textarea>
      <button class="btn btn-secondary btn-sm" id="ph-note-add" style="margin-top:var(--space-2);">${svg('plus')} Add Note</button>`;
  }

  function _persistMutation(i) {
    const idx = customInv.findIndex(c => c.id === i.id);
    if (idx >= 0) customInv[idx] = i;
    else overrides[i.id] = { ...(overrides[i.id] || {}), verdict: i.verdict, notes: i.notes, status: i.status };
    _savePersisted();
  }

  // Delegated listeners for drawer body actions that persist across re-renders
  document.addEventListener('click', e => {
    if (e.target && e.target.id === 'ph-note-add') {
      const text = document.getElementById('ph-note-text')?.value.trim();
      if (!text || !drawerInvId) return;
      const i = findInv(drawerInvId); if (!i) return;
      const note = { author: 'Current User', date: new Date().toISOString().slice(0, 10), text };
      i.notes = [...(i.notes || []), note];
      _persistMutation(i);
      window.NotificationManager?.success('Note Added', '');
      _renderDrawerTab('notes');
    }
    if (e.target && e.target.id === 'ph-ioc-export') {
      const i = findInv(drawerInvId); if (!i) return;
      _download(`${i.id}-iocs.json`, JSON.stringify(i.iocs, null, 2), 'application/json');
      window.NotificationManager?.success('IOC List Exported', `Indicators for ${i.id} exported as JSON.`);
    }
  });

  // ══════════════════════════════════════════════════════════════════════
  // CREATE / EDIT (ANALYZE EMAIL) MODAL
  // ══════════════════════════════════════════════════════════════════════
  function _buildAddEditModal() {
    const d = SD();
    const analystOpts = (d.ANALYSTS.length ? d.ANALYSTS : ['Unassigned']).map(a => `<option>${esc(a)}</option>`).join('');
    const statusOpts = (d.STATUSES.length ? d.STATUSES : ['New']).map(s => `<option>${esc(s)}</option>`).join('');
    return `
    <div class="ai-modal-overlay" id="ph-modal-overlay">
      <div class="ai-modal" id="ph-modal">
        <div class="ai-modal-header"><div class="ai-modal-title" id="ph-modal-title">Analyze Email</div><div class="ai-detail-close" id="ph-modal-close">${svg('x')}</div></div>
        <div class="ai-modal-body">
          <input type="hidden" id="ph-form-id" />
          <div class="ai-form-grid">
            <div class="ai-form-row"><label class="ai-label">Sender *</label><input type="text" class="input" id="ph-form-sender" placeholder="sender@example.com" /></div>
            <div class="ai-form-row"><label class="ai-label">Recipient</label><input type="text" class="input" id="ph-form-recipient" placeholder="user@khansecurity.local" /></div>
          </div>
          <div class="ai-form-row"><label class="ai-label">Subject *</label><input type="text" class="input" id="ph-form-subject" /></div>
          <div class="ai-form-grid">
            <div class="ai-form-row"><label class="ai-label">Received Time</label><input type="text" class="input" id="ph-form-received" placeholder="YYYY-MM-DD HH:MM" value="${new Date().toISOString().slice(0, 16).replace('T', ' ')}" /></div>
            <div class="ai-form-row"><label class="ai-label">Priority</label><select class="input" id="ph-form-priority"><option>P1</option><option>P2</option><option selected>P3</option><option>P4</option></select></div>
            <div class="ai-form-row"><label class="ai-label">Risk</label><select class="input" id="ph-form-risk"><option value="critical">Critical</option><option value="high">High</option><option value="medium" selected>Medium</option><option value="low">Low</option><option value="safe">Safe</option></select></div>
            <div class="ai-form-row"><label class="ai-label">Category</label><input type="text" class="input" id="ph-form-category" placeholder="e.g. Invoice Fraud" /></div>
            <div class="ai-form-row"><label class="ai-label">Status</label><select class="input" id="ph-form-status">${statusOpts}</select></div>
            <div class="ai-form-row"><label class="ai-label">Assigned Analyst</label><select class="input" id="ph-form-analyst">${analystOpts}</select></div>
          </div>
          <div class="ai-form-row"><label class="ai-label">Notes</label><textarea class="input" id="ph-form-notes" rows="2"></textarea></div>
          <div class="ai-form-error" id="ph-form-error"></div>
        </div>
        <div class="ai-modal-footer"><button class="btn btn-secondary" id="ph-form-cancel">Cancel</button><button class="btn btn-primary" id="ph-form-save">Save</button></div>
      </div>
    </div>`;
  }

  function _wireAddEditModal() {
    document.getElementById('ph-modal-close')?.addEventListener('click', _closeAddEditModal);
    document.getElementById('ph-form-cancel')?.addEventListener('click', _closeAddEditModal);
    document.getElementById('ph-modal-overlay')?.addEventListener('click', e => { if (e.target.id === 'ph-modal-overlay') _closeAddEditModal(); });
    document.getElementById('ph-form-save')?.addEventListener('click', _saveInvForm);
  }

  function _openAddEditModal(invId) {
    const isEdit = !!invId;
    document.getElementById('ph-modal-title').textContent = isEdit ? 'Edit Investigation' : 'Analyze Email';
    document.getElementById('ph-form-error').textContent = '';
    const i = isEdit ? findInv(invId) : null;
    document.getElementById('ph-form-id').value = invId || '';
    document.getElementById('ph-form-sender').value = i?.sender || '';
    document.getElementById('ph-form-recipient').value = i?.recipient || '';
    document.getElementById('ph-form-subject').value = i?.subject || '';
    document.getElementById('ph-form-received').value = i?.receivedTime || new Date().toISOString().slice(0, 16).replace('T', ' ');
    document.getElementById('ph-form-risk').value = i?.riskScore || 'medium';
    document.getElementById('ph-form-category').value = i?.category || '';
    document.getElementById('ph-form-status').value = i?.status || 'New';
    document.getElementById('ph-form-analyst').value = i?.assignedAnalyst || (SD().ANALYSTS[0] || '');
    document.getElementById('ph-form-notes').value = (i?.notes || []).map(n => n.text).join('\n');
    document.getElementById('ph-modal-overlay').classList.add('open');
  }
  function _closeAddEditModal() { document.getElementById('ph-modal-overlay').classList.remove('open'); }

  function _saveInvForm() {
    const sender = document.getElementById('ph-form-sender').value.trim();
    const subject = document.getElementById('ph-form-subject').value.trim();
    const errEl = document.getElementById('ph-form-error');
    if (!sender || !subject) { errEl.textContent = 'Sender and Subject are required.'; return; }
    errEl.textContent = '';

    const id = document.getElementById('ph-form-id').value;
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const fields = {
      sender, recipient: document.getElementById('ph-form-recipient').value.trim() || 'unassigned@khansecurity.local',
      subject, receivedTime: document.getElementById('ph-form-received').value.trim() || now,
      riskScore: document.getElementById('ph-form-risk').value, category: document.getElementById('ph-form-category').value.trim() || 'Uncategorized',
      status: document.getElementById('ph-form-status').value, assignedAnalyst: document.getElementById('ph-form-analyst').value,
      verdict: 'Suspicious', campaign: 'None', blocked: false, hasAttachment: false, urlCount: 0, investigationMinutes: 0,
      headers: { returnPath: '', from: sender, to: '', replyTo: sender, spf: 'Unknown', dkim: 'Unknown', dmarc: 'Unknown', messageId: '', receivedChain: [], originatingIp: '' },
      auth: { spf: 'Unknown', dkim: 'Unknown', dmarc: 'Unknown', spoofingDetected: false, explanation: 'Manual entry — authentication analysis not yet performed.' },
      urls: [], attachments: [], iocs: { domains: [], ips: [], hashes: [], urls: [], emails: [sender], registryKeys: [], filePaths: [] },
      timeline: [{ time: now, event: id ? 'Investigation Updated' : 'Email Received', detail: id ? 'Fields updated by user.' : `${subject} manually logged for investigation.` }],
      notes: document.getElementById('ph-form-notes').value.trim() ? [{ author: 'Current User', date: now.slice(0, 10), text: document.getElementById('ph-form-notes').value.trim() }] : [],
    };

    if (id) {
      const idx = customInv.findIndex(c => c.id === id);
      if (idx >= 0) customInv[idx] = { ...customInv[idx], ...fields };
      else overrides[id] = { ...(overrides[id] || {}), ...fields };
      window.NotificationManager?.success('Investigation Updated', `${subject} was updated.`);
    } else {
      customInv.push({ id: uid('EMAIL').toUpperCase(), ...fields });
      window.NotificationManager?.success('Investigation Created', `${subject} was logged for analysis.`);
    }
    _savePersisted(); _closeAddEditModal(); _renderAll();
  }

  // ══════════════════════════════════════════════════════════════════════
  // DELETE CONFIRMATION
  // ══════════════════════════════════════════════════════════════════════
  function _buildConfirmModal() {
    return `
    <div class="ai-modal-overlay" id="ph-confirm-overlay">
      <div class="ai-modal ai-modal-sm">
        <div class="ai-modal-header"><div class="ai-modal-title">Delete Investigation</div><div class="ai-detail-close" id="ph-confirm-close">${svg('x')}</div></div>
        <div class="ai-modal-body"><p id="ph-confirm-text" style="color:var(--text-secondary);font-size:var(--text-sm);"></p></div>
        <div class="ai-modal-footer"><button class="btn btn-secondary" id="ph-confirm-cancel">Cancel</button><button class="btn btn-danger" id="ph-confirm-delete">Delete</button></div>
      </div>
    </div>`;
  }
  let pendingDeleteId = null;
  function _wireConfirmModal() {
    document.getElementById('ph-confirm-close')?.addEventListener('click', _closeConfirm);
    document.getElementById('ph-confirm-cancel')?.addEventListener('click', _closeConfirm);
    document.getElementById('ph-confirm-overlay')?.addEventListener('click', e => { if (e.target.id === 'ph-confirm-overlay') _closeConfirm(); });
    document.getElementById('ph-confirm-delete')?.addEventListener('click', () => {
      if (!pendingDeleteId) return;
      const i = findInv(pendingDeleteId);
      if (customInv.some(c => c.id === pendingDeleteId)) customInv = customInv.filter(c => c.id !== pendingDeleteId);
      else deletedIds.add(pendingDeleteId);
      _savePersisted(); _closeConfirm(); _renderAll();
      window.NotificationManager?.success('Investigation Deleted', i ? `${i.id} was removed.` : 'Investigation removed.');
    });
  }
  function _confirmDelete(invId) {
    const i = findInv(invId); if (!i) return;
    pendingDeleteId = invId;
    document.getElementById('ph-confirm-text').textContent = `Are you sure you want to delete "${i.id} — ${i.subject}"? This cannot be undone.`;
    document.getElementById('ph-confirm-overlay').classList.add('open');
  }
  function _closeConfirm() { document.getElementById('ph-confirm-overlay').classList.remove('open'); pendingDeleteId = null; }

  // ══════════════════════════════════════════════════════════════════════
  // IMPORT (.eml placeholder / JSON / CSV, with preview & validation)
  // ══════════════════════════════════════════════════════════════════════
  function _buildImportModal() {
    return `
    <div class="ai-modal-overlay" id="ph-import-overlay">
      <div class="ai-modal">
        <div class="ai-modal-header"><div class="ai-modal-title">Import Email</div><div class="ai-detail-close" id="ph-import-close">${svg('x')}</div></div>
        <div class="ai-modal-body">
          <p style="color:var(--text-secondary);font-size:var(--text-sm);margin-bottom:var(--space-3);">
            Paste JSON (array of investigation objects with at least a <span class="mono">subject</span> field) or CSV with a header row.
            A raw <span class="mono">.eml</span> file upload is shown as a labeled <strong>placeholder</strong> below — full MIME parsing is not implemented in this offline demo.
          </p>
          <div class="ph-eml-placeholder">${svg('mail', 'ph-inline-icon')} .EML FILE UPLOAD — PLACEHOLDER (use JSON/CSV paste below for this demo)</div>
          <textarea class="input" id="ph-import-text" rows="7" placeholder='[{"subject":"Fake invoice","sender":"a@b.example","riskScore":"high"}]' style="font-family:var(--font-mono);font-size:12px;margin-top:var(--space-3);"></textarea>
          <button class="btn btn-secondary btn-sm" id="ph-import-preview" style="margin-top:var(--space-3);">Preview</button>
          <div id="ph-import-preview-box" style="margin-top:var(--space-3);"></div>
        </div>
        <div class="ai-modal-footer"><button class="btn btn-secondary" id="ph-import-cancel">Cancel</button><button class="btn btn-primary" id="ph-import-confirm" disabled>Import</button></div>
      </div>
    </div>`;
  }
  let importPreviewRows = [];
  function _wireImportModal() {
    document.getElementById('ph-import-close')?.addEventListener('click', _closeImportModal);
    document.getElementById('ph-import-cancel')?.addEventListener('click', _closeImportModal);
    document.getElementById('ph-import-overlay')?.addEventListener('click', e => { if (e.target.id === 'ph-import-overlay') _closeImportModal(); });
    document.getElementById('ph-import-preview')?.addEventListener('click', _previewImport);
    document.getElementById('ph-import-confirm')?.addEventListener('click', _confirmImport);
  }
  function _openImportModal() {
    document.getElementById('ph-import-text').value = '';
    document.getElementById('ph-import-preview-box').innerHTML = '';
    document.getElementById('ph-import-confirm').disabled = true;
    importPreviewRows = [];
    document.getElementById('ph-import-overlay').classList.add('open');
  }
  function _closeImportModal() { document.getElementById('ph-import-overlay').classList.remove('open'); }

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
    const raw = document.getElementById('ph-import-text').value.trim();
    const box = document.getElementById('ph-import-preview-box');
    const confirmBtn = document.getElementById('ph-import-confirm');
    if (!raw) { box.innerHTML = `<div class="empty-state"><div class="empty-state-desc">Paste JSON or CSV data first.</div></div>`; confirmBtn.disabled = true; return; }
    let rows = [];
    try {
      if (raw.startsWith('[') || raw.startsWith('{')) { const parsed = JSON.parse(raw); rows = Array.isArray(parsed) ? parsed : [parsed]; }
      else rows = _parseCSV(raw);
    } catch (e) {
      box.innerHTML = `<div class="empty-state"><div class="empty-state-title">Parse Error</div><div class="empty-state-desc">${esc(e.message)}</div></div>`;
      confirmBtn.disabled = true; window.NotificationManager?.error('Import Error', 'Could not parse the provided data.'); return;
    }
    rows = rows.filter(r => r && r.subject);
    if (!rows.length) { box.innerHTML = `<div class="empty-state"><div class="empty-state-desc">No valid rows found — each row needs at least a "subject" field.</div></div>`; confirmBtn.disabled = true; return; }
    importPreviewRows = rows;
    box.innerHTML = `<div class="ti-result-count" style="margin-bottom:var(--space-2);">${rows.length} email(s) ready to import</div>
      <div class="card"><div class="card-body" style="padding:0;max-height:220px;overflow:auto;">
      <table class="data-table"><thead><tr><th>Subject</th><th>Sender</th><th>Risk</th></tr></thead>
      <tbody>${rows.slice(0, 20).map(r => `<tr><td>${esc(r.subject)}</td><td>${esc(r.sender || '—')}</td><td>${esc(r.riskScore || 'medium')}</td></tr>`).join('')}</tbody>
      </table></div></div>`;
    confirmBtn.disabled = false;
  }

  function _confirmImport() {
    if (!importPreviewRows.length) return;
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    importPreviewRows.forEach(r => {
      customInv.push({
        id: uid('EMAIL').toUpperCase(), sender: r.sender || 'unknown@example.com', recipient: r.recipient || 'unassigned@khansecurity.local',
        subject: r.subject, receivedTime: r.receivedTime || now, riskScore: r.riskScore || 'medium', verdict: r.verdict || 'Suspicious',
        category: r.category || 'Uncategorized', campaign: r.campaign || 'None', blocked: false, hasAttachment: false, urlCount: 0,
        status: r.status || 'New', assignedAnalyst: r.assignedAnalyst || 'Unassigned', investigationMinutes: 0,
        headers: { returnPath: '', from: r.sender || '', to: r.recipient || '', replyTo: r.sender || '', spf: 'Unknown', dkim: 'Unknown', dmarc: 'Unknown', messageId: '', receivedChain: [], originatingIp: '' },
        auth: { spf: 'Unknown', dkim: 'Unknown', dmarc: 'Unknown', spoofingDetected: false, explanation: 'Imported record — authentication analysis not yet performed.' },
        urls: [], attachments: [], iocs: { domains: [], ips: [], hashes: [], urls: [], emails: [r.sender || ''], registryKeys: [], filePaths: [] },
        timeline: [{ time: now, event: 'Email Imported', detail: `${r.subject} imported into the investigation queue.` }], notes: [],
      });
    });
    _savePersisted(); _closeImportModal(); _renderAll();
    window.NotificationManager?.success('Email Imported', `${importPreviewRows.length} email(s) imported.`);
    importPreviewRows = [];
  }

  // ══════════════════════════════════════════════════════════════════════
  // EXPORT (CSV / JSON / Executive Report / Technical Report)
  // ══════════════════════════════════════════════════════════════════════
  function _download(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function _exportCurrentSelection() {
    const rows = _filteredSorted();
    const header = ['id', 'sender', 'recipient', 'subject', 'receivedTime', 'riskScore', 'verdict', 'category', 'campaign', 'status', 'assignedAnalyst'];
    const csv = [header.join(','), ...rows.map(i => header.map(k => `"${String(i[k] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    _download('phishing-investigations.csv', csv, 'text/csv');
    window.NotificationManager?.success('Investigation Exported', `${rows.length} record(s) exported as CSV.`);
  }

  function _openReportChoice() {
    const choice = window.confirm('Click OK for Executive Report, or Cancel for Technical Report + CSV + JSON.');
    if (choice) _exportExecutiveReport();
    else { _exportTechnicalReport(); _exportCurrentSelection(); _download('phishing-investigations.json', JSON.stringify(_filteredSorted(), null, 2), 'application/json'); }
    window.NotificationManager?.success('Report Exported', 'Phishing investigation report generated.');
  }

  function _exportExecutiveReport() {
    const s = _computeStats(); const list = allInv();
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Phishing Investigation Executive Report</title>
      <style>body{font-family:-apple-system,sans-serif;max-width:900px;margin:40px auto;color:#0f172a;}
      table{width:100%;border-collapse:collapse;margin:16px 0;} th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:13px;} th{background:#f1f5f9;}
      h1{font-size:22px;} h2{font-size:16px;margin-top:28px;} .warn{background:#fef3c7;padding:10px;border-radius:6px;font-size:12px;}</style></head><body>
      <h1>Phishing Investigation — Executive Report</h1>
      <div class="warn">⚠ Educational simulation — offline synthetic phishing data.</div>
      <p><strong>${s.analyzed}</strong> emails analyzed, <strong>${s.confirmed}</strong> confirmed phishing/BEC, <strong>${s.blocked}</strong> blocked at the gateway.
      Average investigation time: <strong>${s.avgTime} minutes</strong>.</p>
      <h2>Top Confirmed Threats</h2>
      <table><tr><th>ID</th><th>Subject</th><th>Verdict</th><th>Risk</th></tr>
      ${list.filter(i => i.verdict !== 'Benign' && i.verdict !== 'Spam').slice(0, 15).map(i => `<tr><td>${esc(i.id)}</td><td>${esc(i.subject)}</td><td>${esc(i.verdict)}</td><td>${esc(i.riskScore)}</td></tr>`).join('')}
      </table>
      <p style="color:#64748b;font-size:11px;margin-top:24px;">Generated by Khan Security Solutions Enterprise · ${new Date().toLocaleString()}</p>
      </body></html>`;
    _download('phishing-executive-report.html', html, 'text/html');
  }
  function _exportTechnicalReport() {
    const list = allInv();
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Phishing Investigation Technical Report</title>
      <style>body{font-family:-apple-system,sans-serif;max-width:960px;margin:40px auto;color:#0f172a;}
      table{width:100%;border-collapse:collapse;margin:16px 0;} th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:12px;} th{background:#f1f5f9;}
      h1{font-size:22px;} .warn{background:#fef3c7;padding:10px;border-radius:6px;font-size:12px;}</style></head><body>
      <h1>Phishing Investigation — Technical Report</h1>
      <div class="warn">⚠ Educational simulation — offline synthetic phishing data.</div>
      <table><tr><th>ID</th><th>Sender</th><th>Subject</th><th>Verdict</th><th>Risk</th><th>SPF</th><th>DKIM</th><th>DMARC</th><th>Analyst</th></tr>
      ${list.map(i => `<tr><td>${esc(i.id)}</td><td>${esc(i.sender)}</td><td>${esc(i.subject)}</td><td>${esc(i.verdict)}</td><td>${esc(i.riskScore)}</td><td>${esc(i.auth?.spf)}</td><td>${esc(i.auth?.dkim)}</td><td>${esc(i.auth?.dmarc)}</td><td>${esc(i.assignedAnalyst)}</td></tr>`).join('')}
      </table>
      <p style="color:#64748b;font-size:11px;margin-top:24px;">Generated by Khan Security Solutions Enterprise · ${new Date().toLocaleString()}</p>
      </body></html>`;
    _download('phishing-technical-report.html', html, 'text/html');
  }

  // ══════════════════════════════════════════════════════════════════════
  // PERSISTENCE
  // ══════════════════════════════════════════════════════════════════════
  function _loadPersisted() {
    if (!window.StorageManager) return;
    customInv = window.StorageManager.lsGet('ph_custom_investigations', []) || [];
    deletedIds = new Set(window.StorageManager.lsGet('ph_deleted_ids', []) || []);
    overrides = window.StorageManager.lsGet('ph_overrides', {}) || {};
  }
  function _savePersisted() {
    window.StorageManager?.lsSet('ph_custom_investigations', customInv);
    window.StorageManager?.lsSet('ph_deleted_ids', [...deletedIds]);
    window.StorageManager?.lsSet('ph_overrides', overrides);
  }

  // ══════════════════════════════════════════════════════════════════════
  // SEARCH
  // ══════════════════════════════════════════════════════════════════════
  function _registerSearch() {
    if (!window.SearchEngine) return;
    window.SearchEngine.register('Phishing Analyzer', [
      { title: 'Phishing Investigation Lab', meta: 'Email queue, headers, URLs, attachments, IOCs', route: 'phishing', keywords: 'phishing email investigation bec credential harvesting invoice microsoft paypal bank office365 amazon' },
      ...SD().investigations.map(i => ({ title: i.subject, meta: `${i.id} — ${i.verdict}`, route: 'phishing', keywords: `${i.id} ${i.subject} ${i.sender} ${i.recipient} ${i.category} ${i.verdict}` })),
    ]);
  }

  // ── Public API ─────────────────────────────────────────────────────────
  return { register };

})();

window.PhishingAnalyzer = PhishingAnalyzer;

if (window.Router) {
  PhishingAnalyzer.register();
} else {
  console.error('[PhishingAnalyzer] Router not found. Ensure router.js loads before phishing-analyzer.js.');
}
