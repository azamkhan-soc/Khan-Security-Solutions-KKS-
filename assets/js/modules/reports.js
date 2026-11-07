/**
 * KHAN SECURITY SOLUTIONS ENTERPRISE
 * Enterprise Reporting & Analytics Center — Module v1.6.0 (Milestone 16)
 *
 * Offline Executive/SOC/SIEM/Threat-Intel/Asset/Incident/IOC/Case/Phishing/
 * Malware/DFIR/Password/Compliance/Risk/Custom reporting center. Ships with
 * an animated executive KPI dashboard, pure-SVG charts (bar/pie/line),
 * a MITRE tactic coverage heat map, a 5-step Report Builder wizard that
 * reads live counts from every other module (when loaded), a filterable/
 * sortable/paginated Report History table (100 bundled reports + any
 * reports you generate), and offline CSV/JSON/HTML/PDF-placeholder export.
 *
 * [EDUCATIONAL SIMULATION — Ships with 100 deterministically generated
 *  synthetic report records. "PDF Placeholder" exports a text/HTML file
 *  labeled as such — there is no PDF renderer or backend. Everything is
 *  stored locally via StorageManager; there is no server.]
 *
 * Integrates with:
 *   window.Router               — route: 'reports'
 *   window.SearchEngine         — searchable content
 *   window.NotificationManager  — alerts and feedback
 *   window.StorageManager       — generated-report persistence (localStorage)
 *   window.SampleReportsData    — bundled sample dataset
 *   Reads (best-effort, if loaded) window.SampleAssetData, SampleCaseData,
 *   SampleIncidentData, SampleIOCData, SampleDFIR, SampleVulnData,
 *   SampleMalware, SampleThreatIntel, SamplePhishingData, SamplePasswordData,
 *   SampleLogs for live cross-module KPI counts.
 */

const ReportsCenter = (() => {

  // ── State ──────────────────────────────────────────────────────────────
  let mounted = false;
  let activeTab = 'overview';

  let customReports = [];               // user-generated / imported reports
  let deletedStaticIds = new Set();     // deleted bundled sample reports

  const filters = { q: '', category: 'all', status: 'all', format: 'all' };
  let sortKey = 'created', sortDir = 'desc';
  let currentPage = 1;
  const PAGE_SIZE = 10;

  const wizard = {
    step: 1,
    categoryId: null,
    title: '',
    rangeDays: 30,
    sources: {},        // sourceId -> bool
    style: 'Executive Summary',
    format: 'PDF',
  };

  let pendingDeleteId = null;

  // ── Cross-module data sources ─────────────────────────────────────────
  const DATA_SOURCES = [
    { id: 'soc',      label: 'SOC Dashboard',      global: null,                 count: () => SD().KPI.openIncidents },
    { id: 'siem',     label: 'SIEM',                global: 'SampleLogs',         count: () => { const d = window.SampleLogs; if (!d) return null; return ['windows','linux','apache','nginx','firewall'].reduce((s,k)=> s + (Array.isArray(d[k]) ? d[k].length : 0), 0); } },
    { id: 'malware',  label: 'Malware',             global: 'SampleMalware',      count: () => window.SampleMalware?.samples?.length ?? null },
    { id: 'threat',   label: 'Threat Intelligence', global: 'SampleThreatIntel',  count: () => window.SampleThreatIntel?.actors?.length ?? null },
    { id: 'dfir',     label: 'DFIR',                 global: 'SampleDFIR',         count: () => window.SampleDFIR?.cases?.length ?? null },
    { id: 'asset',    label: 'Asset Inventory',     global: 'SampleAssetData',    count: () => window.SampleAssetData?.assets?.length ?? null },
    { id: 'incident', label: 'Incident Response',   global: 'SampleIncidentData', count: () => window.SampleIncidentData?.incidents?.length ?? null },
    { id: 'ioc',      label: 'IOC Manager',          global: 'SampleIOCData',      count: () => window.SampleIOCData?.iocs?.length ?? null },
    { id: 'case',     label: 'Case Manager',        global: 'SampleCaseData',     count: () => window.SampleCaseData?.cases?.length ?? null },
    { id: 'password', label: 'Password Toolkit',    global: 'SamplePasswordData', count: () => window.SamplePasswordData?.POLICY_TEMPLATES?.length ?? null },
  ];

  // ── Icons ──────────────────────────────────────────────────────────────
  const I = {
    briefcase: `<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18a48.55 48.55 0 01-12.756 0C4.537 20.436 3.75 19.494 3.75 18.4v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.02-.388.04-.583.06m-16.5-8.006c0-1.081.768-2.015 1.837-2.175a48.114 48.114 0 013.413-.387m0 0V4.5c0-1.036.84-1.875 1.875-1.875h1.5c1.035 0 1.875.84 1.875 1.875v.166m-4.5 0c1.496-.099 3.004-.099 4.5 0"/>`,
    shield: `<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>`,
    server: `<path stroke-linecap="round" stroke-linejoin="round" d="M21.75 17.25v-.228a4.5 4.5 0 00-.12-1.03l-2.268-9.64a3.375 3.375 0 00-3.285-2.602H7.923a3.375 3.375 0 00-3.285 2.602l-2.268 9.64a4.5 4.5 0 00-.12 1.03v.228m19.5 0a3 3 0 01-3 3H5.25a3 3 0 01-3-3m19.5 0a3 3 0 00-3-3H5.25a3 3 0 00-3 3m16.5 0h.008v.008h-.008v-.008zm-3 0h.008v.008h-.008v-.008z"/>`,
    globe: `<path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"/>`,
    warn: `<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>`,
    hash: `<path stroke-linecap="round" stroke-linejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5"/>`,
    folder: `<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 015.25 3.75h4.5l2.25 2.25h6.75a2.25 2.25 0 012.25 2.25v1.526"/>`,
    mail: `<path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>`,
    bug: `<path stroke-linecap="round" stroke-linejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"/>`,
    search: `<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z"/>`,
    key: `<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"/>`,
    check: `<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>`,
    settings: `<path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>`,
    calendar: `<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/>`,
    clock: `<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>`,
    eye: `<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>`,
    trash: `<path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>`,
    down: `<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>`,
    up: `<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>`,
    plus: `<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>`,
    close: `<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>`,
    chevLeft: `<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/>`,
    chevRight: `<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>`,
    report: `<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"/>`,
  };
  function svg(name, cls = '') { return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">${I[name] || I.report}</svg>`; }
  function esc(s) { const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function _truncate(s, n) { s = String(s); return s.length > n ? s.slice(0, n - 1) + '…' : s; }

  const SD = () => window.SampleReportsData || { CATEGORIES: [], REPORTS: [], KPI: {}, TREND: [], MITRE_COVERAGE: [] };

  // ══════════════════════════════════════════════════════════════════════
  // REGISTRATION
  // ══════════════════════════════════════════════════════════════════════
  function register() { window.Router.register('reports', { title: 'Reports', init, render }); }

  function init() {
    _loadPersisted();
    _registerSearch();
  }

  function render() {
    const el = document.getElementById('page-reports');
    if (!el) return;
    if (!mounted) {
      el.innerHTML = _buildShell();
      mounted = true;
      _wireAll();
      _animateKpis();
      _renderCharts();
      _renderCategoryGrid();
      _renderHistory();
    } else {
      _refreshKpisStatic();
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  // PERSISTENCE
  // ══════════════════════════════════════════════════════════════════════
  function _loadPersisted() {
    customReports = window.StorageManager?.lsGet('rp_custom_reports', []) || [];
    deletedStaticIds = new Set(window.StorageManager?.lsGet('rp_deleted_static', []) || []);
  }
  function _persist() {
    window.StorageManager?.lsSet('rp_custom_reports', customReports);
    window.StorageManager?.lsSet('rp_deleted_static', [...deletedStaticIds]);
  }

  function _registerSearch() {
    const all = _allReports().slice(0, 40).map(r => ({
      title: r.name, meta: `${r.category} • ${r.status}`, route: 'reports', keywords: `${r.name} ${r.category} report ${r.status}`, icon: 'report',
    }));
    window.SearchEngine?.register('Reports', all);
  }

  // ══════════════════════════════════════════════════════════════════════
  // SHELL
  // ══════════════════════════════════════════════════════════════════════
  function _buildShell() {
    return `
    <div class="rp-shell">
      <div class="rp-header">
        <div>
          <div class="rp-header-title">Enterprise Reporting Center</div>
          <div class="rp-header-sub">Generate professional executive and technical cybersecurity reports.</div>
        </div>
        <div class="rp-header-actions">
          <button class="btn btn-primary btn-sm" id="rp-btn-generate">${svg('plus')} Generate Report</button>
          <button class="btn btn-secondary btn-sm" id="rp-btn-export">${svg('down')} Export</button>
          <button class="btn btn-secondary btn-sm" id="rp-btn-import">${svg('up')} Import</button>
          <button class="btn btn-ghost btn-sm" id="rp-btn-schedule">${svg('calendar')} Schedule Report (Demo)</button>
          <input type="file" id="rp-import-input" accept="application/json" style="display:none" />
        </div>
      </div>

      <div class="rp-tabs" role="tablist">
        <div class="rp-tab active" data-tab="overview" role="tab">${svg('briefcase')} Overview</div>
        <div class="rp-tab" data-tab="builder" role="tab">${svg('report')} Report Builder</div>
        <div class="rp-tab" data-tab="history" role="tab">${svg('folder')} Report History</div>
      </div>

      <div class="rp-body">
        <div class="rp-view active" id="rp-view-overview">${_buildOverviewView()}</div>
        <div class="rp-view" id="rp-view-builder">${_buildBuilderView()}</div>
        <div class="rp-view" id="rp-view-history">${_buildHistoryView()}</div>
      </div>
    </div>

    ${_buildPreviewModal()}
    ${_buildScheduleModal()}
    ${_buildConfirmModal()}
    `;
  }

  function _wireAll() {
    document.querySelectorAll('#page-reports .rp-tab').forEach(t => t.addEventListener('click', () => _switchTab(t.dataset.tab)));
    document.getElementById('rp-btn-generate')?.addEventListener('click', () => { _resetWizard(); _switchTab('builder'); });
    document.getElementById('rp-btn-export')?.addEventListener('click', _exportHistoryCsv);
    document.getElementById('rp-btn-import')?.addEventListener('click', () => document.getElementById('rp-import-input')?.click());
    document.getElementById('rp-import-input')?.addEventListener('change', _handleImport);
    document.getElementById('rp-btn-schedule')?.addEventListener('click', _openScheduleModal);
    _wireBuilder();
    _wireHistory();
    _wireModals();
  }

  function _switchTab(tabId) {
    activeTab = tabId;
    document.querySelectorAll('#page-reports .rp-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
    document.querySelectorAll('#page-reports .rp-view').forEach(v => v.classList.toggle('active', v.id === `rp-view-${tabId}`));
    if (tabId === 'overview') { _refreshKpisStatic(); _renderCharts(); _renderCategoryGrid(); }
    if (tabId === 'history') _renderHistory();
    if (tabId === 'builder') _renderWizardStep();
  }

  // ══════════════════════════════════════════════════════════════════════
  // OVERVIEW / EXECUTIVE DASHBOARD
  // ══════════════════════════════════════════════════════════════════════
  function _liveOrBaseline(sourceId, baselineKey) {
    const src = DATA_SOURCES.find(s => s.id === sourceId);
    const val = src ? src.count() : null;
    return (val === null || val === undefined) ? SD().KPI[baselineKey] : val;
  }

  function _computeKpis() {
    const k = SD().KPI;
    return {
      securityScore: k.securityScore,
      totalAssets: _liveOrBaseline('asset', 'totalAssets'),
      openIncidents: _liveOrBaseline('incident', 'openIncidents'),
      criticalAssets: k.criticalAssets,
      threatIntelIOCs: _liveOrBaseline('ioc', 'threatIntelIOCs'),
      cases: _liveOrBaseline('case', 'activeCases'),
      analysts: k.analysts,
      mttd: k.mttdMinutes,
      mttr: k.mttrMinutes,
      riskIndex: k.riskIndex,
    };
  }

  function _buildOverviewView() {
    return `
      <div class="rp-kpi-grid" id="rp-kpi-grid"></div>

      <div class="rp-chart-grid">
        <div class="card rp-glass">
          <div class="rp-chart-title">Reports by Category <small>Top 6</small></div>
          <div class="rp-chart"><svg id="rp-chart-category" viewBox="0 0 300 200"></svg></div>
        </div>
        <div class="card rp-glass">
          <div class="rp-chart-title">Report Status Breakdown</div>
          <div class="rp-chart"><svg id="rp-chart-status" viewBox="0 0 260 160"></svg></div>
        </div>
        <div class="card rp-glass">
          <div class="rp-chart-title">Security Score &amp; Risk Index <small>12-Month Trend</small></div>
          <div class="rp-chart"><svg id="rp-chart-trend" viewBox="0 0 300 160"></svg></div>
        </div>
        <div class="card rp-glass">
          <div class="rp-chart-title">MITRE ATT&amp;CK Tactic Coverage</div>
          <div id="rp-mitre-heat"></div>
        </div>
      </div>

      <div class="card rp-glass" style="margin-top:var(--space-4)">
        <div class="rp-chart-title">Report Categories</div>
        <div class="rp-cat-grid" id="rp-cat-grid"></div>
      </div>
    `;
  }

  function _kpiCard(label, value, icon, color, suffix = '') {
    return `<div class="stat-card">
      <div class="stat-card-icon" style="background:${color}22;color:${color};">${svg(icon)}</div>
      <div class="stat-card-info">
        <div class="stat-card-value ai-count" data-target="${parseInt(value, 10) || 0}" data-suffix="${suffix}">0</div>
        <div class="stat-card-label">${esc(label)}</div>
      </div>
    </div>`;
  }

  function _animateKpis() {
    const k = _computeKpis();
    const box = document.getElementById('rp-kpi-grid');
    if (!box) return;
    box.innerHTML = [
      _kpiCard('Security Score', k.securityScore, 'shield', 'var(--color-success)', ' / 100'),
      _kpiCard('Total Assets', k.totalAssets, 'server', 'var(--color-primary)'),
      _kpiCard('Open Incidents', k.openIncidents, 'warn', 'var(--color-danger)'),
      _kpiCard('Critical Assets', k.criticalAssets, 'server', 'var(--color-warning)'),
      _kpiCard('Threat Intel IOCs', k.threatIntelIOCs, 'hash', 'var(--color-accent)'),
      _kpiCard('Active Cases', k.cases, 'folder', 'var(--color-info)'),
      _kpiCard('Analysts', k.analysts, 'briefcase', '#a78bfa'),
      _kpiCard('Mean Time To Detect', k.mttd, 'clock', 'var(--color-info)', ' min'),
      _kpiCard('Mean Time To Respond', k.mttr, 'clock', 'var(--color-warning)', ' min'),
      _kpiCard('Risk Index', k.riskIndex, 'warn', 'var(--color-danger)', ' / 100'),
    ].join('');
    box.querySelectorAll('.ai-count').forEach(el => {
      const target = parseInt(el.dataset.target, 10) || 0;
      const suffix = el.dataset.suffix || '';
      let current = 0; const step = Math.max(1, Math.ceil(target / 24));
      const timer = setInterval(() => { current = Math.min(target, current + step); el.textContent = current + suffix; if (current >= target) clearInterval(timer); }, 20);
    });
  }
  function _refreshKpisStatic() {
    const k = _computeKpis();
    const box = document.getElementById('rp-kpi-grid');
    if (!box) return;
    const values = [k.securityScore + ' / 100', k.totalAssets, k.openIncidents, k.criticalAssets, k.threatIntelIOCs, k.cases, k.analysts, k.mttd + ' min', k.mttr + ' min', k.riskIndex + ' / 100'];
    box.querySelectorAll('.ai-count').forEach((el, idx) => { el.textContent = values[idx]; });
  }

  // ══════════════════════════════════════════════════════════════════════
  // SVG CHARTS
  // ══════════════════════════════════════════════════════════════════════
  const CHART_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#a78bfa', '#f97316', '#06b6d4', '#84cc16', '#ec4899', '#64748b'];
  function _groupCount(list, keyFn) { const map = {}; list.forEach(x => { const k = keyFn(x) || 'Unknown'; map[k] = (map[k] || 0) + 1; }); return Object.entries(map).sort((a, b) => b[1] - a[1]); }

  function _renderBarChart(svgId, data) {
    const el = document.getElementById(svgId); if (!el) return;
    const items = data.slice(0, 6); const max = Math.max(1, ...items.map(([, v]) => v));
    const barH = 22, gap = 8, chartW = 300, labelW = 100;
    el.innerHTML = items.map(([label, val], idx) => {
      const y = idx * (barH + gap) + 6; const w = ((chartW - labelW - 40) * val) / max;
      return `<text x="0" y="${y + barH / 2 + 4}" font-size="10" fill="var(--text-secondary)">${esc(_truncate(label, 15))}</text>
        <rect x="${labelW}" y="${y}" width="${Math.max(2, w)}" height="${barH}" rx="4" fill="${CHART_COLORS[idx % CHART_COLORS.length]}" opacity="0.9"><title>${esc(label)}: ${val}</title></rect>
        <text x="${labelW + w + 6}" y="${y + barH / 2 + 4}" font-size="10" fill="var(--text-tertiary)">${val}</text>`;
    }).join('');
  }

  function _renderPieChart(svgId, data) {
    const el = document.getElementById(svgId); if (!el) return;
    const total = data.reduce((s, [, v]) => s + v, 0) || 1;
    const cx = 70, cy = 75, r = 60; let angle = -Math.PI / 2; let paths = '';
    data.slice(0, 6).forEach(([label, val], idx) => {
      const frac = val / total; const nextAngle = angle + frac * 2 * Math.PI;
      const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
      const x2 = cx + r * Math.cos(nextAngle), y2 = cy + r * Math.sin(nextAngle);
      const largeArc = frac > 0.5 ? 1 : 0;
      paths += `<path d="M${cx},${cy} L${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${largeArc} 1 ${x2.toFixed(2)},${y2.toFixed(2)} Z" fill="${CHART_COLORS[idx % CHART_COLORS.length]}" opacity="0.9"><title>${esc(label)}: ${val}</title></path>`;
      angle = nextAngle;
    });
    const legend = data.slice(0, 6).map(([label, val], idx) => `<g transform="translate(150, ${14 + idx * 22})"><rect width="10" height="10" rx="2" fill="${CHART_COLORS[idx % CHART_COLORS.length]}"/><text x="16" y="9" font-size="10" fill="var(--text-secondary)">${esc(_truncate(label, 14))} (${val})</text></g>`).join('');
    el.innerHTML = `<g>${paths}</g>${legend}`;
  }

  function _renderLineChart(svgId, points) {
    const el = document.getElementById(svgId); if (!el) return;
    const maxA = Math.max(1, ...points.map(p => p.a));
    const maxB = Math.max(1, ...points.map(p => p.b));
    const w = 290, h = 130, padL = 6, padB = 20;
    const stepX = points.length > 1 ? (w - padL) / (points.length - 1) : 0;
    const coordsA = points.map((p, i) => [padL + i * stepX, h - padB - (p.a / maxA) * (h - padB - 8)]);
    const coordsB = points.map((p, i) => [padL + i * stepX, h - padB - (p.b / maxB) * (h - padB - 8)]);
    const pathA = coordsA.map((c, i) => `${i === 0 ? 'M' : 'L'}${c[0].toFixed(1)},${c[1].toFixed(1)}`).join(' ');
    const pathB = coordsB.map((c, i) => `${i === 0 ? 'M' : 'L'}${c[0].toFixed(1)},${c[1].toFixed(1)}`).join(' ');
    const labels = coordsA.map((c, i) => i % 2 === 0 ? `<text x="${c[0].toFixed(1)}" y="${h - 4}" font-size="9" fill="var(--text-tertiary)" text-anchor="middle">${esc(points[i].month)}</text>` : '').join('');
    el.innerHTML = `<path d="${pathA}" fill="none" stroke="#10b981" stroke-width="2"/>
      <path d="${pathB}" fill="none" stroke="#ef4444" stroke-width="2" stroke-dasharray="4 3"/>
      ${coordsA.map((c,i)=>`<circle cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="2.5" fill="#10b981"><title>Score ${points[i].month}: ${points[i].a}</title></circle>`).join('')}
      ${labels}
      <g transform="translate(4,4)"><rect width="8" height="8" fill="#10b981"/><text x="12" y="8" font-size="9" fill="var(--text-secondary)">Security Score</text></g>
      <g transform="translate(120,4)"><rect width="8" height="8" fill="#ef4444"/><text x="12" y="8" font-size="9" fill="var(--text-secondary)">Risk Index</text></g>`;
  }

  function _renderMitreHeat() {
    const el = document.getElementById('rp-mitre-heat'); if (!el) return;
    el.innerHTML = SD().MITRE_COVERAGE.map(m => {
      const color = m.coverage >= 70 ? 'var(--color-success)' : m.coverage >= 50 ? 'var(--color-warning)' : 'var(--color-danger)';
      return `<div class="rp-heat-row">
        <div class="rp-heat-label">${esc(m.tactic)}</div>
        <div class="rp-heat-bar-track"><div class="rp-heat-bar-fill" style="width:${m.coverage}%;background:${color}"></div></div>
        <div class="rp-heat-val">${m.coverage}%</div>
      </div>`;
    }).join('');
  }

  function _renderCharts() {
    const list = _allReports();
    _renderBarChart('rp-chart-category', _groupCount(list, r => r.category));
    _renderPieChart('rp-chart-status', _groupCount(list, r => r.status));
    _renderLineChart('rp-chart-trend', SD().TREND.map(t => ({ month: t.month, a: t.securityScore, b: t.riskIndex })));
    _renderMitreHeat();
  }

  function _renderCategoryGrid() {
    const el = document.getElementById('rp-cat-grid'); if (!el) return;
    const list = _allReports();
    el.innerHTML = SD().CATEGORIES.map(c => {
      const count = list.filter(r => r.categoryId === c.id).length;
      return `<div class="card rp-cat-card" data-cat="${c.id}">
        <div class="rp-cat-icon" style="background:${c.color}22;color:${c.color}">${svg(c.icon)}</div>
        <div>
          <div class="rp-cat-name">${esc(c.label)}</div>
          <div class="rp-cat-count">${count} report${count === 1 ? '' : 's'}</div>
        </div>
      </div>`;
    }).join('');
    el.querySelectorAll('.rp-cat-card').forEach(card => card.addEventListener('click', () => {
      _resetWizard();
      wizard.categoryId = card.dataset.cat;
      _switchTab('builder');
    }));
  }

  // ══════════════════════════════════════════════════════════════════════
  // REPORT BUILDER WIZARD
  // ══════════════════════════════════════════════════════════════════════
  function _resetWizard() {
    wizard.step = 1; wizard.categoryId = null; wizard.title = '';
    wizard.rangeDays = 30; wizard.style = 'Executive Summary'; wizard.format = 'PDF';
    wizard.sources = {}; DATA_SOURCES.forEach(s => { wizard.sources[s.id] = true; });
  }
  _resetWizard();

  function _buildBuilderView() {
    return `
      <div class="card rp-glass">
        <div class="rp-wizard-steps" id="rp-wiz-steps"></div>
        <div class="rp-wizard-body" id="rp-wiz-body"></div>
        <div class="rp-wizard-nav">
          <button class="btn btn-secondary btn-sm" id="rp-wiz-back">${svg('chevLeft')} Back</button>
          <button class="btn btn-primary btn-sm" id="rp-wiz-next">Next ${svg('chevRight')}</button>
        </div>
      </div>
    `;
  }

  const STEP_LABELS = ['Select Report Type', 'Select Date Range', 'Choose Data Sources', 'Preview', 'Export'];

  function _renderWizSteps() {
    const el = document.getElementById('rp-wiz-steps'); if (!el) return;
    el.innerHTML = STEP_LABELS.map((label, i) => {
      const n = i + 1;
      const cls = n === wizard.step ? 'active' : n < wizard.step ? 'done' : '';
      const connector = n < STEP_LABELS.length ? `<div class="rp-wizard-connector"></div>` : '';
      return `<div class="rp-wizard-step ${cls}"><span class="rp-wizard-step-num">${n < wizard.step ? '✓' : n}</span>${label}</div>${connector}`;
    }).join('');
  }

  function _renderWizardStep() {
    _renderWizSteps();
    const body = document.getElementById('rp-wiz-body'); if (!body) return;
    const back = document.getElementById('rp-wiz-back'); const next = document.getElementById('rp-wiz-next');
    if (back) back.style.visibility = wizard.step === 1 ? 'hidden' : 'visible';
    if (next) next.innerHTML = wizard.step === 5 ? `${svg('check')} Finish &amp; Save Report` : `Next ${svg('chevRight')}`;

    if (wizard.step === 1) {
      body.innerHTML = `
        <div class="form-group"><label class="form-label">Report Title</label>
          <input type="text" class="form-input" id="rp-wiz-title" placeholder="e.g. Monthly Executive Security Summary" value="${esc(wizard.title)}" /></div>
        <div class="rp-select-grid">
          ${SD().CATEGORIES.map(c => `
            <label class="rp-select-card ${wizard.categoryId === c.id ? 'selected' : ''}" data-cat="${c.id}">
              <input type="radio" name="rp-wiz-cat" value="${c.id}" ${wizard.categoryId === c.id ? 'checked' : ''}/>
              <div class="rp-cat-icon" style="background:${c.color}22;color:${c.color}">${svg(c.icon)}</div>
              <span>${esc(c.label)}</span>
            </label>`).join('')}
        </div>`;
      body.querySelectorAll('.rp-select-card').forEach(card => card.addEventListener('click', () => {
        wizard.categoryId = card.dataset.cat;
        body.querySelectorAll('.rp-select-card').forEach(c => c.classList.toggle('selected', c === card));
        body.querySelectorAll('input[name="rp-wiz-cat"]').forEach(r => r.checked = r.value === wizard.categoryId);
      }));
      document.getElementById('rp-wiz-title')?.addEventListener('input', e => wizard.title = e.target.value);
    }

    else if (wizard.step === 2) {
      const ranges = [7, 30, 90, 180];
      body.innerHTML = `
        <p style="color:var(--text-tertiary);font-size:var(--text-sm);margin-bottom:var(--space-4)">Choose the reporting period to include in this report.</p>
        <div class="rp-select-grid">
          ${ranges.map(r => `<label class="rp-select-card ${wizard.rangeDays === r ? 'selected' : ''}" data-range="${r}">
            <input type="radio" name="rp-wiz-range" value="${r}" ${wizard.rangeDays === r ? 'checked' : ''}/>
            ${svg('calendar')} <span>Last ${r} days</span>
          </label>`).join('')}
        </div>`;
      body.querySelectorAll('.rp-select-card').forEach(card => card.addEventListener('click', () => {
        wizard.rangeDays = parseInt(card.dataset.range, 10);
        body.querySelectorAll('.rp-select-card').forEach(c => c.classList.toggle('selected', c === card));
      }));
    }

    else if (wizard.step === 3) {
      body.innerHTML = `
        <p style="color:var(--text-tertiary);font-size:var(--text-sm);margin-bottom:var(--space-4)">Select which modules should feed data into this report.</p>
        ${DATA_SOURCES.map(s => {
          const c = s.count();
          return `<div class="rp-source-toggle">
            <div><strong style="font-size:var(--text-sm)">${esc(s.label)}</strong>
              <div style="font-size:var(--text-xs);color:var(--text-tertiary)">${c === null ? 'Offline — module not loaded' : `${c} records available`}</div>
            </div>
            <label class="rp-switch"><input type="checkbox" data-src="${s.id}" ${wizard.sources[s.id] ? 'checked' : ''}/><span class="rp-switch-track"></span></label>
          </div>`;
        }).join('')}`;
      body.querySelectorAll('input[data-src]').forEach(inp => inp.addEventListener('change', e => { wizard.sources[e.target.dataset.src] = e.target.checked; }));
    }

    else if (wizard.step === 4) {
      const cat = SD().CATEGORIES.find(c => c.id === wizard.categoryId) || SD().CATEGORIES[0];
      const k = _computeKpis();
      const activeSources = DATA_SOURCES.filter(s => wizard.sources[s.id]);
      body.innerHTML = `
        <div class="form-group" style="max-width:320px">
          <label class="form-label">Report Style</label>
          <select class="form-select" id="rp-wiz-style">
            <option ${wizard.style === 'Executive Summary' ? 'selected' : ''}>Executive Summary</option>
            <option ${wizard.style === 'Technical Report' ? 'selected' : ''}>Technical Report</option>
          </select>
        </div>
        <div class="rp-preview-doc">
          <h2>${esc(wizard.title || (cat ? cat.label : 'Security Report'))}</h2>
          <div class="rp-preview-sub">${esc(cat ? cat.label : '')} • ${wizard.style} • Last ${wizard.rangeDays} days • Generated ${new Date().toLocaleDateString()}</div>
          <div class="rp-preview-kpi">
            <div><b>${k.securityScore}</b><span>Security Score</span></div>
            <div><b>${k.openIncidents}</b><span>Open Incidents</span></div>
            <div><b>${k.riskIndex}</b><span>Risk Index</span></div>
          </div>
          <p style="font-size:12px;color:#333">This ${wizard.style.toLowerCase()} summarizes findings across ${activeSources.length} connected data source${activeSources.length === 1 ? '' : 's'}: ${activeSources.map(s => esc(s.label)).join(', ') || 'none selected'}. All figures are drawn from the offline demonstration dataset.</p>
        </div>`;
      document.getElementById('rp-wiz-style')?.addEventListener('change', e => wizard.style = e.target.value);
    }

    else if (wizard.step === 5) {
      body.innerHTML = `
        <p style="color:var(--text-tertiary);font-size:var(--text-sm);margin-bottom:var(--space-4)">Choose an export format, then finish to save this report to your history.</p>
        <div class="rp-select-grid">
          ${['PDF', 'CSV', 'JSON', 'HTML'].map(f => `<label class="rp-select-card ${wizard.format === f ? 'selected' : ''}" data-fmt="${f}">
            <input type="radio" name="rp-wiz-fmt" value="${f}" ${wizard.format === f ? 'checked' : ''}/>
            ${svg('down')} <span>${f}${f === 'PDF' ? ' (Placeholder)' : ''}</span>
          </label>`).join('')}
        </div>`;
      body.querySelectorAll('.rp-select-card').forEach(card => card.addEventListener('click', () => {
        wizard.format = card.dataset.fmt;
        body.querySelectorAll('.rp-select-card').forEach(c => c.classList.toggle('selected', c === card));
      }));
    }
  }

  function _wireBuilder() {
    document.getElementById('rp-wiz-back')?.addEventListener('click', () => { if (wizard.step > 1) { wizard.step--; _renderWizardStep(); } });
    document.getElementById('rp-wiz-next')?.addEventListener('click', () => {
      if (wizard.step === 1 && !wizard.categoryId) { window.NotificationManager?.info('Select a report type', 'Please choose a report category to continue.'); return; }
      if (wizard.step < 5) { wizard.step++; _renderWizardStep(); }
      else _finalizeReport();
    });
    _renderWizardStep();
  }

  function _finalizeReport() {
    const cat = SD().CATEGORIES.find(c => c.id === wizard.categoryId) || SD().CATEGORIES[0];
    const report = {
      id: `CUSTOM-${Date.now()}`,
      name: wizard.title || `${cat.label} — ${new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' })}`,
      categoryId: cat.id,
      category: cat.label,
      type: wizard.style,
      created: new Date().toISOString(),
      author: 'You (Analyst)',
      status: 'Completed',
      format: wizard.format,
      sizeKb: Math.round(80 + Math.random() * 600),
      rangeDays: wizard.rangeDays,
      sources: DATA_SOURCES.filter(s => wizard.sources[s.id]).map(s => s.label),
      synthetic: false,
    };
    customReports.unshift(report);
    _persist();
    _registerSearch();
    window.NotificationManager?.success('Report Generated', `"${report.name}" has been saved to Report History.`);
    _resetWizard();
    _switchTab('history');
  }

  // ══════════════════════════════════════════════════════════════════════
  // REPORT HISTORY
  // ══════════════════════════════════════════════════════════════════════
  function _allReports() {
    const base = SD().REPORTS.filter(r => !deletedStaticIds.has(r.id));
    return [...customReports, ...base];
  }

  function _buildHistoryView() {
    return `
      <div class="rp-toolbar">
        <input type="text" class="form-input" id="rp-hist-q" placeholder="Search reports…" style="max-width:220px" />
        <select class="form-select" id="rp-hist-cat"><option value="all">All Categories</option>${SD().CATEGORIES.map(c => `<option value="${c.id}">${esc(c.label)}</option>`).join('')}</select>
        <select class="form-select" id="rp-hist-status"><option value="all">All Statuses</option>${['Completed','Generating','Scheduled','Failed'].map(s => `<option>${s}</option>`).join('')}</select>
        <select class="form-select" id="rp-hist-fmt"><option value="all">All Formats</option>${['PDF','CSV','JSON','HTML'].map(f => `<option>${f}</option>`).join('')}</select>
      </div>
      <div style="overflow-x:auto">
        <table class="data-table">
          <thead><tr>
            <th data-sort="name" style="cursor:pointer">Report Name</th>
            <th data-sort="category" style="cursor:pointer">Type</th>
            <th data-sort="created" style="cursor:pointer">Created</th>
            <th data-sort="author" style="cursor:pointer">Author</th>
            <th data-sort="status" style="cursor:pointer">Status</th>
            <th>Export Format</th>
            <th></th>
          </tr></thead>
          <tbody id="rp-hist-tbody"></tbody>
        </table>
      </div>
      <div class="rp-pagination">
        <span id="rp-hist-count"></span>
        <div class="rp-pagination-btns">
          <button class="btn btn-ghost btn-sm" id="rp-hist-prev">${svg('chevLeft')}</button>
          <span id="rp-hist-page" style="align-self:center"></span>
          <button class="btn btn-ghost btn-sm" id="rp-hist-next">${svg('chevRight')}</button>
        </div>
      </div>
    `;
  }

  const STATUS_COLOR = { Completed: 'var(--color-success)', Generating: 'var(--color-info)', Scheduled: 'var(--color-warning)', Failed: 'var(--color-danger)' };

  function _filteredSortedReports() {
    let list = _allReports().filter(r => {
      if (filters.category !== 'all' && r.categoryId !== filters.category) return false;
      if (filters.status !== 'all' && r.status !== filters.status) return false;
      if (filters.format !== 'all' && r.format !== filters.format) return false;
      if (filters.q && !(`${r.name} ${r.category} ${r.author}`.toLowerCase().includes(filters.q.toLowerCase()))) return false;
      return true;
    });
    list.sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (sortKey === 'created') { av = new Date(av).getTime(); bv = new Date(bv).getTime(); }
      else { av = String(av).toLowerCase(); bv = String(bv).toLowerCase(); }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }

  function _renderHistory() {
    const tbody = document.getElementById('rp-hist-tbody'); if (!tbody) return;
    const list = _filteredSortedReports();
    const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    currentPage = Math.min(currentPage, totalPages);
    const pageItems = list.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    tbody.innerHTML = pageItems.length ? pageItems.map(r => `
      <tr>
        <td>${esc(r.name)}</td>
        <td><span class="badge badge-neutral">${esc(r.category)}</span></td>
        <td class="mono" style="font-size:var(--text-xs)">${new Date(r.created).toLocaleDateString()}</td>
        <td>${esc(r.author)}</td>
        <td><span class="rp-status-dot" style="background:${STATUS_COLOR[r.status] || 'var(--text-tertiary)'}"></span>${esc(r.status)}</td>
        <td class="mono">${esc(r.format)}</td>
        <td style="white-space:nowrap">
          <button class="btn-icon btn-sm rp-act-view" data-id="${r.id}" title="View">${svg('eye')}</button>
          <button class="btn-icon btn-sm rp-act-dl" data-id="${r.id}" title="Download">${svg('down')}</button>
          ${r.synthetic ? '' : `<button class="btn-icon btn-sm rp-act-del" data-id="${r.id}" title="Delete">${svg('trash')}</button>`}
        </td>
      </tr>`).join('') : `<tr><td colspan="7"><div class="empty-state"><div class="empty-state-title">No reports found</div><div class="empty-state-desc">Try adjusting your filters, or generate a new report.</div></div></td></tr>`;

    document.getElementById('rp-hist-count').textContent = `${list.length} report${list.length === 1 ? '' : 's'}`;
    document.getElementById('rp-hist-page').textContent = `Page ${currentPage} of ${totalPages}`;

    tbody.querySelectorAll('.rp-act-view').forEach(b => b.addEventListener('click', () => _openPreview(b.dataset.id)));
    tbody.querySelectorAll('.rp-act-dl').forEach(b => b.addEventListener('click', () => _exportReport(b.dataset.id)));
    tbody.querySelectorAll('.rp-act-del').forEach(b => b.addEventListener('click', () => _confirmDelete(b.dataset.id)));
  }

  function _wireHistory() {
    document.getElementById('rp-hist-q')?.addEventListener('input', e => { filters.q = e.target.value; currentPage = 1; _renderHistory(); });
    document.getElementById('rp-hist-cat')?.addEventListener('change', e => { filters.category = e.target.value; currentPage = 1; _renderHistory(); });
    document.getElementById('rp-hist-status')?.addEventListener('change', e => { filters.status = e.target.value; currentPage = 1; _renderHistory(); });
    document.getElementById('rp-hist-fmt')?.addEventListener('change', e => { filters.format = e.target.value; currentPage = 1; _renderHistory(); });
    document.getElementById('rp-hist-prev')?.addEventListener('click', () => { if (currentPage > 1) { currentPage--; _renderHistory(); } });
    document.getElementById('rp-hist-next')?.addEventListener('click', () => { currentPage++; _renderHistory(); });
    document.querySelectorAll('#page-reports th[data-sort]').forEach(th => th.addEventListener('click', () => {
      const key = th.dataset.sort;
      if (sortKey === key) sortDir = sortDir === 'asc' ? 'desc' : 'asc'; else { sortKey = key; sortDir = 'asc'; }
      _renderHistory();
    }));
  }

  function _findReport(id) { return _allReports().find(r => r.id === id); }

  // ── Preview modal ──────────────────────────────────────────────────────
  function _buildPreviewModal() {
    return `<div class="modal-overlay" id="rp-preview-modal" style="display:none">
      <div class="modal" style="max-width:640px">
        <div class="modal-header"><span class="modal-title">Report Preview</span><button class="modal-close" id="rp-preview-close">${svg('close')}</button></div>
        <div class="modal-body" id="rp-preview-body"></div>
        <div class="modal-footer"><button class="btn btn-secondary btn-sm" id="rp-preview-close2">Close</button></div>
      </div>
    </div>`;
  }
  function _openPreview(id) {
    const r = _findReport(id); if (!r) return;
    const body = document.getElementById('rp-preview-body');
    body.innerHTML = `<div class="rp-preview-doc">
      <h2>${esc(r.name)}</h2>
      <div class="rp-preview-sub">${esc(r.category)} • ${esc(r.type)} • Last ${r.rangeDays} days • ${new Date(r.created).toLocaleString()}</div>
      <div class="rp-preview-kpi">
        <div><b>${SD().KPI.securityScore}</b><span>Security Score</span></div>
        <div><b>${SD().KPI.openIncidents}</b><span>Open Incidents</span></div>
        <div><b>${SD().KPI.riskIndex}</b><span>Risk Index</span></div>
      </div>
      <p style="font-size:12px;color:#333">Author: ${esc(r.author)} · Status: ${esc(r.status)} · Format: ${esc(r.format)} · Size: ${r.sizeKb} KB${r.sources ? `<br/>Data sources: ${r.sources.map(esc).join(', ')}` : ''}</p>
    </div>`;
    document.getElementById('rp-preview-modal').style.display = 'flex';
  }

  // ── Schedule modal ─────────────────────────────────────────────────────
  function _buildScheduleModal() {
    return `<div class="modal-overlay" id="rp-schedule-modal" style="display:none">
      <div class="modal" style="max-width:420px">
        <div class="modal-header"><span class="modal-title">Schedule Report (Demo)</span><button class="modal-close" id="rp-schedule-close">${svg('close')}</button></div>
        <div class="modal-body">
          <div class="demo-banner" style="margin-bottom:var(--space-4)"><span class="demo-banner-text">Demonstration only — no real scheduling engine runs. The report is saved with a "Scheduled" status.</span></div>
          <div class="form-group"><label class="form-label">Report Type</label>
            <select class="form-select" id="rp-sched-cat">${SD().CATEGORIES.map(c => `<option value="${c.id}">${esc(c.label)}</option>`).join('')}</select></div>
          <div class="form-group"><label class="form-label">Frequency</label>
            <select class="form-select" id="rp-sched-freq"><option>Daily</option><option selected>Weekly</option><option>Monthly</option></select></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary btn-sm" id="rp-schedule-cancel">Cancel</button>
          <button class="btn btn-primary btn-sm" id="rp-schedule-confirm">${svg('calendar')} Schedule</button>
        </div>
      </div>
    </div>`;
  }
  function _openScheduleModal() { document.getElementById('rp-schedule-modal').style.display = 'flex'; }

  // ── Confirm-delete modal ───────────────────────────────────────────────
  function _buildConfirmModal() {
    return `<div class="modal-overlay" id="rp-confirm-modal" style="display:none">
      <div class="modal" style="max-width:380px">
        <div class="modal-header"><span class="modal-title">Delete Report</span><button class="modal-close" id="rp-confirm-close">${svg('close')}</button></div>
        <div class="modal-body"><p style="font-size:var(--text-sm);color:var(--text-secondary)">This will permanently remove the report from your local history. This cannot be undone.</p></div>
        <div class="modal-footer">
          <button class="btn btn-secondary btn-sm" id="rp-confirm-cancel">Cancel</button>
          <button class="btn btn-danger btn-sm" id="rp-confirm-ok">${svg('trash')} Delete</button>
        </div>
      </div>
    </div>`;
  }
  function _confirmDelete(id) { pendingDeleteId = id; document.getElementById('rp-confirm-modal').style.display = 'flex'; }

  function _wireModals() {
    document.getElementById('rp-preview-close')?.addEventListener('click', () => document.getElementById('rp-preview-modal').style.display = 'none');
    document.getElementById('rp-preview-close2')?.addEventListener('click', () => document.getElementById('rp-preview-modal').style.display = 'none');

    document.getElementById('rp-schedule-close')?.addEventListener('click', () => document.getElementById('rp-schedule-modal').style.display = 'none');
    document.getElementById('rp-schedule-cancel')?.addEventListener('click', () => document.getElementById('rp-schedule-modal').style.display = 'none');
    document.getElementById('rp-schedule-confirm')?.addEventListener('click', () => {
      const catId = document.getElementById('rp-sched-cat').value;
      const freq = document.getElementById('rp-sched-freq').value;
      const cat = SD().CATEGORIES.find(c => c.id === catId) || SD().CATEGORIES[0];
      const report = {
        id: `SCHED-${Date.now()}`, name: `${cat.label} — ${freq} Schedule`, categoryId: cat.id, category: cat.label,
        type: 'Executive Summary', created: new Date().toISOString(), author: 'You (Analyst)', status: 'Scheduled',
        format: 'PDF', sizeKb: 0, rangeDays: 30, synthetic: false,
      };
      customReports.unshift(report); _persist(); _registerSearch();
      document.getElementById('rp-schedule-modal').style.display = 'none';
      window.NotificationManager?.success('Report Scheduled', `${freq} "${cat.label}" report scheduled (demo).`);
      _switchTab('history');
    });

    document.getElementById('rp-confirm-close')?.addEventListener('click', () => document.getElementById('rp-confirm-modal').style.display = 'none');
    document.getElementById('rp-confirm-cancel')?.addEventListener('click', () => document.getElementById('rp-confirm-modal').style.display = 'none');
    document.getElementById('rp-confirm-ok')?.addEventListener('click', () => {
      if (!pendingDeleteId) return;
      customReports = customReports.filter(r => r.id !== pendingDeleteId);
      deletedStaticIds.add(pendingDeleteId);
      _persist(); _registerSearch();
      document.getElementById('rp-confirm-modal').style.display = 'none';
      window.NotificationManager?.info('Report Deleted', 'The report was removed from history.');
      pendingDeleteId = null;
      _renderHistory();
    });
  }

  // ══════════════════════════════════════════════════════════════════════
  // EXPORT / IMPORT
  // ══════════════════════════════════════════════════════════════════════
  function _download(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  function _exportHistoryCsv() {
    const list = _filteredSortedReports();
    const header = 'ID,Name,Category,Type,Created,Author,Status,Format,SizeKB\n';
    const rows = list.map(r => [r.id, r.name, r.category, r.type, r.created, r.author, r.status, r.format, r.sizeKb]
      .map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    _download('reports-history.csv', header + rows, 'text/csv');
    window.NotificationManager?.success('Exported', `${list.length} reports exported as CSV.`);
  }

  function _exportReport(id) {
    const r = _findReport(id); if (!r) return;
    const kpi = SD().KPI;
    if (r.format === 'CSV') {
      const csv = `Field,Value\nName,"${r.name}"\nCategory,${r.category}\nType,${r.type}\nCreated,${r.created}\nAuthor,${r.author}\nStatus,${r.status}\nSecurityScore,${kpi.securityScore}\nOpenIncidents,${kpi.openIncidents}\nRiskIndex,${kpi.riskIndex}\n`;
      _download(`${r.id}.csv`, csv, 'text/csv');
    } else if (r.format === 'JSON') {
      _download(`${r.id}.json`, JSON.stringify({ ...r, kpiSnapshot: kpi }, null, 2), 'application/json');
    } else if (r.format === 'HTML') {
      _download(`${r.id}.html`, `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(r.name)}</title></head><body style="font-family:sans-serif;max-width:640px;margin:40px auto"><h1>${esc(r.name)}</h1><p>${esc(r.category)} • ${esc(r.type)} • ${new Date(r.created).toLocaleString()}</p><ul><li>Security Score: ${kpi.securityScore}</li><li>Open Incidents: ${kpi.openIncidents}</li><li>Risk Index: ${kpi.riskIndex}</li></ul></body></html>`, 'text/html');
    } else {
      _download(`${r.id}.pdf.txt`, `[PDF PLACEHOLDER — no real PDF renderer in this offline demo]\n\n${r.name}\n${r.category} • ${r.type}\nCreated: ${r.created}\nAuthor: ${r.author}\n\nSecurity Score: ${kpi.securityScore}\nOpen Incidents: ${kpi.openIncidents}\nRisk Index: ${kpi.riskIndex}\n`, 'text/plain');
    }
    window.NotificationManager?.success('Exported', `"${r.name}" exported as ${r.format}.`);
  }

  function _handleImport(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        const arr = Array.isArray(data) ? data : [data];
        let imported = 0;
        arr.forEach(item => {
          if (!item || !item.name) return;
          customReports.unshift({
            id: `IMPORT-${Date.now()}-${imported}`,
            name: String(item.name),
            categoryId: item.categoryId || 'custom',
            category: item.category || 'Custom Reports',
            type: item.type || 'Custom Report',
            created: item.created || new Date().toISOString(),
            author: item.author || 'Imported',
            status: item.status || 'Completed',
            format: item.format || 'JSON',
            sizeKb: item.sizeKb || 0,
            rangeDays: item.rangeDays || 30,
            synthetic: false,
          });
          imported++;
        });
        _persist(); _registerSearch(); _renderHistory();
        window.NotificationManager?.success('Import Complete', `${imported} report${imported === 1 ? '' : 's'} imported.`);
      } catch (err) {
        window.NotificationManager?.show({ type: 'error', title: 'Import Failed', message: 'The selected file is not valid JSON.' });
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  }

  return { register };

})();

window.ReportsCenter = ReportsCenter;

if (window.Router) {
  ReportsCenter.register();
} else {
  console.error('[ReportsCenter] Router not found. Ensure router.js loads before reports.js.');
}
