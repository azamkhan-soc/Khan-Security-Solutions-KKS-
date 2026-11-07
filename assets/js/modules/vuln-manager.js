/**
 * KHAN SECURITY SOLUTIONS ENTERPRISE
 * Vulnerability Manager — Module v0.9.0
 *
 * Offline vulnerability management workbench: lightweight asset inventory,
 * CVE database, a fully functional CVSS v3.1 base-score calculator, patch
 * tracking, a likelihood×impact risk matrix, NIST CSF / CIS Controls /
 * OWASP Top 10 compliance mapping, an executive dashboard, and reports.
 *
 * [EDUCATIONAL SIMULATION — Asset names, patch tickets, and compliance
 *  coverage percentages are synthetic offline demo data. CVE IDs are real
 *  public NVD identifiers used for realistic demonstration; the CVSS v3.1
 *  calculator implements the real published scoring formula. NIST CSF, CIS
 *  Controls, and OWASP Top 10 are the real public reference taxonomies.]
 *
 * Integrates with:
 *   window.Router              — route: 'vuln-manager'
 *   window.SearchEngine        — searchable content
 *   window.NotificationManager — alerts and feedback
 *   window.StorageManager      — patch status persistence (localStorage)
 *   window.SampleVulnData      — bundled sample dataset
 */

const VulnManager = (() => {

  // ── State ──────────────────────────────────────────────────────────────
  let mounted      = false;
  let activeTab     = 'overview';
  let cveSearch      = '';
  let cveSeverityFilter = 'all';
  let patchStatusOverrides = {}; // patchId -> status (persisted overrides)

  // ── Icons ──────────────────────────────────────────────────────────────
  const I = {
    shield:   `<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>`,
    server:   `<path stroke-linecap="round" stroke-linejoin="round" d="M21.75 17.25v-.228a4.5 4.5 0 00-.12-1.03l-2.268-9.64a3.375 3.375 0 00-3.285-2.602H7.923a3.375 3.375 0 00-3.285 2.602l-2.268 9.64a4.5 4.5 0 00-.12 1.03v.228m19.5 0a3 3 0 01-3 3H5.25a3 3 0 01-3-3m19.5 0a3 3 0 00-3-3H5.25a3 3 0 00-3 3m16.5 0h.008v.008h-.008v-.008zm-3 0h.008v.008h-.008v-.008z"/>`,
    bug:      `<path stroke-linecap="round" stroke-linejoin="round" d="M12 12.75c1.148 0 2.278.08 3.383.237 1.037.146 1.866.966 1.866 2.013 0 3.728-2.35 6.75-5.25 6.75S6.75 18.728 6.75 15c0-1.046.83-1.867 1.866-2.013A24.204 24.204 0 0112 12.75zm0 0c2.883 0 5.647.508 8.207 1.44a23.91 23.91 0 01-1.152 6.06M12 12.75c-2.883 0-5.647.508-8.208 1.44.125 2.104.52 4.136 1.153 6.06M12 12.75a2.25 2.25 0 002.248-2.354M12 12.75a2.25 2.25 0 01-2.248-2.354M12 8.25c.995 0 1.971-.08 2.922-.236.403-.066.74-.358.795-.762a3.778 3.778 0 00-.399-2.25M12 8.25c-.995 0-1.97-.08-2.922-.236-.402-.066-.74-.358-.795-.762a3.734 3.734 0 01.4-2.25M12 8.25a2.25 2.25 0 00-2.248 2.146M12 8.25a2.25 2.25 0 012.248 2.146M8.683 5a6.032 6.032 0 01-1.155-1.002c.07-.63.27-1.222.574-1.747m11.196 2.749a6.03 6.03 0 001.155-1.002 6.07 6.07 0 00-.574-1.747M13.5 21v-2.25M6 5.25l1.5 1.5M18 5.25l-1.5 1.5"/>`,
    calc:     `<path stroke-linecap="round" stroke-linejoin="round" d="M9 7.5h6M9 10.5h6M9 13.5h1.5m3 0H15M9 16.5h1.5m3 0H15M6 3.75h12a1.5 1.5 0 011.5 1.5v13.5a1.5 1.5 0 01-1.5 1.5H6a1.5 1.5 0 01-1.5-1.5V5.25a1.5 1.5 0 011.5-1.5z"/>`,
    patch:    `<path stroke-linecap="round" stroke-linejoin="round" d="M9.75 9.75l-2.25 2.25a1.5 1.5 0 00-.44 1.06v1.19a1.5 1.5 0 001.5 1.5h1.19c.398 0 .78-.158 1.06-.44l2.25-2.25m-3.31-3.31l3.31 3.31m-3.31-3.31l6.14-6.14a1.5 1.5 0 012.12 0l1.05 1.05a1.5 1.5 0 010 2.12l-6.14 6.14m0 0l3.31 3.31"/>`,
    grid:     `<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/>`,
    compliance: `<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>`,
    exec:     `<path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/>`,
    report:   `<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"/>`,
    down:     `<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>`,
    search:   `<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z"/>`,
    close:    `<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>`,
    warn:     `<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>`,
    copy:     `<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"/>`,
  };
  function svg(name, cls = '') { return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">${I[name] || I.shield}</svg>`; }
  function esc(s) { const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }

  const SD = () => window.SampleVulnData || { assets: [], cves: [], patches: [], nistCsf: [], cisControls: [], owaspTop10: [], getAsset: () => null, getCVE: () => null };

  const SEVERITY_ORDER = { critical: 4, high: 3, medium: 2, low: 1, none: 0 };
  function severityFromScore(score) {
    if (score >= 9.0) return 'critical';
    if (score >= 7.0) return 'high';
    if (score >= 4.0) return 'medium';
    if (score > 0.0) return 'low';
    return 'none';
  }
  function severityBadge(sev) {
    const cls = { critical: 'badge-danger', high: 'badge-high', medium: 'badge-medium', low: 'badge-low', none: 'badge-neutral' }[sev] || 'badge-neutral';
    return `<span class="badge ${cls}">${esc(sev)}</span>`;
  }

  // ══════════════════════════════════════════════════════════════════════
  // ROUTE REGISTRATION
  // ══════════════════════════════════════════════════════════════════════
  function register() {
    window.Router.register('vuln-manager', { title: 'Vulnerability Manager', init, render });
  }

  function init() {
    _loadOverrides();
    _registerSearch();
  }

  function render() {
    const el = document.getElementById('page-vuln-manager');
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
    return `
    <div class="vm-shell">
      <div class="vm-header">
        <div class="vm-header-left">
          <div class="vm-header-icon">${svg('bug')}</div>
          <div>
            <div class="vm-header-title">Vulnerability Manager</div>
            <div class="vm-header-sub">CVE tracking, CVSS scoring, patch management, and compliance mapping</div>
          </div>
        </div>
        <span class="badge badge-warning" style="font-family:var(--font-mono);font-size:10px;">⚠ EDUCATIONAL SIMULATION — OFFLINE DATA</span>
      </div>

      <div class="vm-tabs" role="tablist">
        <div class="vm-tab active" data-tab="overview"   role="tab">${svg('shield')}     Severity Dashboard</div>
        <div class="vm-tab"        data-tab="assets"     role="tab">${svg('server')}     Assets</div>
        <div class="vm-tab"        data-tab="cve-db"     role="tab">${svg('bug')}        CVE Database</div>
        <div class="vm-tab"        data-tab="cvss-calc"  role="tab">${svg('calc')}       CVSS Calculator</div>
        <div class="vm-tab"        data-tab="patches"    role="tab">${svg('patch')}      Patch Tracking</div>
        <div class="vm-tab"        data-tab="risk-matrix" role="tab">${svg('grid')}      Risk Matrix</div>
        <div class="vm-tab"        data-tab="compliance" role="tab">${svg('compliance')} Compliance Mapping</div>
        <div class="vm-tab"        data-tab="executive"  role="tab">${svg('exec')}       Executive Dashboard</div>
        <div class="vm-tab"        data-tab="reports"    role="tab">${svg('report')}     Reports</div>
      </div>

      <div class="vm-body">
        <div class="vm-view active" id="vm-view-overview">${_buildOverview()}</div>
        <div class="vm-view" id="vm-view-assets">${_buildAssetsView()}</div>
        <div class="vm-view" id="vm-view-cve-db">${_buildCVEView()}</div>
        <div class="vm-view" id="vm-view-cvss-calc">${_buildCVSSView()}</div>
        <div class="vm-view" id="vm-view-patches">${_buildPatchesView()}</div>
        <div class="vm-view" id="vm-view-risk-matrix">${_buildRiskMatrixView()}</div>
        <div class="vm-view" id="vm-view-compliance">${_buildComplianceView()}</div>
        <div class="vm-view" id="vm-view-executive">${_buildExecutiveView()}</div>
        <div class="vm-view" id="vm-view-reports">${_buildReportsView()}</div>
      </div>
    </div>

    <div class="vm-detail-overlay" id="vm-detail-overlay">
      <div class="vm-detail-panel" id="vm-detail-panel">
        <div class="vm-detail-header">
          <div class="vm-detail-title" id="vm-detail-title">Detail</div>
          <div class="vm-detail-close" id="vm-detail-close">${svg('close')}</div>
        </div>
        <div id="vm-detail-body"></div>
      </div>
    </div>`;
  }

  function _wireAll() {
    document.querySelectorAll('#page-vuln-manager .vm-tab').forEach(tab => tab.addEventListener('click', () => _switchTab(tab.dataset.tab)));
    document.getElementById('vm-detail-close')?.addEventListener('click', _closeDetail);
    document.getElementById('vm-detail-overlay')?.addEventListener('click', e => { if (e.target.id === 'vm-detail-overlay') _closeDetail(); });
    _wireAssets();
    _wireCVE();
    _wireCVSS();
    _wirePatches();
    _wireRiskMatrix();
    _wireReports();
  }

  function _switchTab(tabId) {
    activeTab = tabId;
    document.querySelectorAll('#page-vuln-manager .vm-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
    document.querySelectorAll('#page-vuln-manager .vm-view').forEach(v => v.classList.toggle('active', v.id === `vm-view-${tabId}`));
  }

  // ══════════════════════════════════════════════════════════════════════
  // OVERVIEW / SEVERITY DASHBOARD
  // ══════════════════════════════════════════════════════════════════════
  function _buildOverview() {
    const d = SD();
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    d.cves.forEach(c => { if (counts[c.severity] !== undefined) counts[c.severity]++; });
    const unpatched = d.cves.filter(c => !c.patched).length;
    const topRisks = [...d.cves].filter(c => !c.patched).sort((a, b) => b.cvss - a.cvss).slice(0, 5);

    return `
      <div class="grid grid-stats">
        ${_statCard('Total CVEs Tracked', d.cves.length, `${unpatched} unpatched`, 'var(--color-primary)')}
        ${_statCard('Critical', counts.critical, 'CVSS 9.0 – 10.0', 'var(--color-danger)')}
        ${_statCard('High', counts.high, 'CVSS 7.0 – 8.9', '#f97316')}
        ${_statCard('Assets Tracked', d.assets.length, `${d.assets.filter(a => a.criticality === 'Critical').length} critical`, 'var(--color-info)')}
      </div>

      <div class="vm-severity-bar-card card">
        <div class="card-header"><div class="card-title">Severity Distribution</div></div>
        <div class="card-body">
          ${['critical', 'high', 'medium', 'low'].map(sev => {
            const n = counts[sev] || 0;
            const pct = d.cves.length ? Math.round((n / d.cves.length) * 100) : 0;
            const color = { critical: 'var(--color-danger)', high: '#f97316', medium: 'var(--color-warning)', low: 'var(--color-success)' }[sev];
            return `<div class="vm-sev-row">
              <div class="vm-sev-label">${esc(sev)}</div>
              <div class="vm-sev-track"><div class="vm-sev-fill" style="width:${pct}%;background:${color};"></div></div>
              <div class="vm-sev-count">${n}</div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <div class="card" style="margin-top:var(--space-4);">
        <div class="card-header"><div class="card-title">Top Unpatched Risks</div></div>
        <div class="card-body" style="padding:0;">
          <table class="data-table">
            <thead><tr><th>CVE ID</th><th>Product</th><th>CVSS</th><th>Severity</th></tr></thead>
            <tbody>
              ${topRisks.map(c => `<tr class="vm-row" data-cve="${c.id}"><td class="mono">${esc(c.id)}</td><td>${esc(c.product)}</td><td class="mono">${c.cvss.toFixed(1)}</td><td>${severityBadge(c.severity)}</td></tr>`).join('') || '<tr><td colspan="4"><div class="empty-state"><div class="empty-state-desc">No unpatched critical/high risks — nice work.</div></div></td></tr>'}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  function _statCard(label, value, change, color) {
    return `
      <div class="stat-card">
        <div class="stat-card-icon" style="background:${color}22;color:${color};">${svg('bug')}</div>
        <div class="stat-card-info">
          <div class="stat-card-value">${value}</div>
          <div class="stat-card-label">${esc(label)}</div>
          <div class="stat-card-change" style="color:var(--text-tertiary);">${esc(change)}</div>
        </div>
      </div>`;
  }

  // ══════════════════════════════════════════════════════════════════════
  // ASSETS (lightweight — full inventory module in Milestone 6)
  // ══════════════════════════════════════════════════════════════════════
  function _buildAssetsView() {
    const d = SD();
    return `
      <p style="color:var(--text-secondary);font-size:var(--text-sm);margin-bottom:var(--space-3);">Asset context for vulnerability correlation. A dedicated full Asset Inventory module ships in Milestone 6.</p>
      <div class="card">
        <div class="card-body" style="padding:0;overflow-x:auto;">
          <table class="data-table">
            <thead><tr><th>Name</th><th>Type</th><th>Owner</th><th>Criticality</th><th>IP</th><th>Open CVEs</th></tr></thead>
            <tbody>
              ${d.assets.map(a => {
                const openCves = d.cves.filter(c => c.affectedAssets.includes(a.id) && !c.patched);
                return `<tr class="vm-row" data-asset="${a.id}">
                  <td>${esc(a.name)}</td><td>${esc(a.type)}</td><td>${esc(a.owner)}</td>
                  <td><span class="badge ${a.criticality === 'Critical' ? 'badge-danger' : a.criticality === 'High' ? 'badge-high' : a.criticality === 'Medium' ? 'badge-medium' : 'badge-neutral'}">${esc(a.criticality)}</span></td>
                  <td class="mono">${esc(a.ip)}</td>
                  <td>${openCves.length ? `<span class="badge badge-danger">${openCves.length} open</span>` : '<span class="badge badge-success">clear</span>'}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  function _wireAssets() {
    document.querySelectorAll('#page-vuln-manager #vm-view-assets .vm-row').forEach(tr => tr.addEventListener('click', () => _openAssetDetail(tr.dataset.asset)));
  }

  function _openAssetDetail(assetId) {
    const d = SD();
    const a = d.getAsset(assetId);
    if (!a) return;
    const relatedCves = d.cves.filter(c => c.affectedAssets.includes(assetId));
    _openDetail(a.name, `
      <div class="vm-detail-grid">
        <div class="vm-detail-field"><div class="vm-detail-field-label">Type</div><div class="vm-detail-field-value">${esc(a.type)}</div></div>
        <div class="vm-detail-field"><div class="vm-detail-field-label">Owner</div><div class="vm-detail-field-value">${esc(a.owner)}</div></div>
        <div class="vm-detail-field"><div class="vm-detail-field-label">Criticality</div><div class="vm-detail-field-value">${esc(a.criticality)}</div></div>
        <div class="vm-detail-field"><div class="vm-detail-field-label">IP Address</div><div class="vm-detail-field-value mono">${esc(a.ip)}</div></div>
      </div>
      <div class="vm-detail-sub-title">Associated CVEs (${relatedCves.length})</div>
      ${relatedCves.map(c => `<div class="ti-detail-link" data-cve="${c.id}">${svg('bug', 'vm-inline-icon')} ${esc(c.id)} — ${esc(c.product)} ${severityBadge(c.severity)} ${c.patched ? '<span class="badge badge-success">patched</span>' : '<span class="badge badge-danger">open</span>'}</div>`).join('') || '<div style="color:var(--text-tertiary);font-size:var(--text-sm);">No known CVEs for this asset.</div>'}
    `);
    document.querySelectorAll('#vm-detail-body .ti-detail-link[data-cve]').forEach(el => el.addEventListener('click', () => _openCVEDetail(el.dataset.cve)));
  }

  // ══════════════════════════════════════════════════════════════════════
  // CVE DATABASE
  // ══════════════════════════════════════════════════════════════════════
  function _buildCVEView() {
    return `
      <div class="vm-toolbar">
        <div class="ti-search-box" style="flex:1;min-width:220px;">
          ${svg('search', 'vm-inline-icon')}
          <input type="text" id="vm-cve-search" placeholder="Search CVE ID or product…" />
        </div>
        <select class="input" id="vm-cve-sev" style="max-width:180px;">
          <option value="all">All Severities</option>
          <option value="critical">Critical</option><option value="high">High</option>
          <option value="medium">Medium</option><option value="low">Low</option>
        </select>
      </div>
      <div id="vm-cve-count" class="ti-result-count"></div>
      <div class="card" style="margin-top:var(--space-3);">
        <div class="card-body" style="padding:0;overflow-x:auto;">
          <table class="data-table">
            <thead><tr><th>CVE ID</th><th>Product</th><th>CVSS</th><th>Severity</th><th>Published</th><th>Status</th></tr></thead>
            <tbody id="vm-cve-tbody"></tbody>
          </table>
        </div>
      </div>`;
  }

  function _wireCVE() {
    document.getElementById('vm-cve-search')?.addEventListener('input', e => { cveSearch = e.target.value; _renderCVEList(); });
    document.getElementById('vm-cve-sev')?.addEventListener('change', e => { cveSeverityFilter = e.target.value; _renderCVEList(); });
    _renderCVEList();
  }

  function _renderCVEList() {
    const d = SD();
    const q = cveSearch.trim().toLowerCase();
    let rows = d.cves.filter(c => {
      if (cveSeverityFilter !== 'all' && c.severity !== cveSeverityFilter) return false;
      if (q && !(c.id.toLowerCase().includes(q) || c.product.toLowerCase().includes(q))) return false;
      return true;
    }).sort((a, b) => b.cvss - a.cvss);

    const tbody = document.getElementById('vm-cve-tbody');
    const count = document.getElementById('vm-cve-count');
    if (count) count.textContent = `${rows.length} of ${d.cves.length} CVEs`;
    if (!tbody) return;
    tbody.innerHTML = rows.map(c => `
      <tr class="vm-row" data-cve="${c.id}">
        <td class="mono">${esc(c.id)}</td><td>${esc(c.product)}</td><td class="mono">${c.cvss.toFixed(1)}</td>
        <td>${severityBadge(c.severity)}</td><td class="mono">${esc(c.publishedDate)}</td>
        <td>${c.patched ? '<span class="badge badge-success">Patched</span>' : '<span class="badge badge-danger">Open</span>'}</td>
      </tr>`).join('') || `<tr><td colspan="6"><div class="empty-state"><div class="empty-state-desc">No CVEs match this filter.</div></div></td></tr>`;
    tbody.querySelectorAll('.vm-row').forEach(tr => tr.addEventListener('click', () => _openCVEDetail(tr.dataset.cve)));
  }

  function _openCVEDetail(cveId) {
    const d = SD();
    const c = d.getCVE(cveId);
    if (!c) return;
    const affected = c.affectedAssets.map(id => d.getAsset(id)).filter(Boolean);
    _openDetail(c.id, `
      <div class="ti-tag-row" style="margin-bottom:var(--space-3);">
        ${severityBadge(c.severity)}
        <span class="badge badge-neutral">CVSS ${c.cvss.toFixed(1)}</span>
        ${c.patched ? '<span class="badge badge-success">Patched</span>' : '<span class="badge badge-danger">Open</span>'}
      </div>
      <div class="vm-cve-product">${esc(c.product)}</div>
      <div class="vm-cve-summary">${esc(c.summary)}</div>
      <div class="ti-detail-value-box mono" style="margin:var(--space-3) 0;font-size:var(--text-xs);word-break:break-all;">${esc(c.vector)}</div>
      <div class="vm-detail-grid">
        <div class="vm-detail-field"><div class="vm-detail-field-label">Published</div><div class="vm-detail-field-value">${esc(c.publishedDate)}</div></div>
        <div class="vm-detail-field"><div class="vm-detail-field-label">Affected Assets</div><div class="vm-detail-field-value">${affected.length}</div></div>
      </div>
      <div class="vm-detail-sub-title">Affected Assets</div>
      ${affected.map(a => `<div class="ti-detail-link" data-asset="${a.id}">${svg('server', 'vm-inline-icon')} ${esc(a.name)} <span style="color:var(--text-tertiary);">— ${esc(a.type)}</span></div>`).join('') || '<div style="color:var(--text-tertiary);font-size:var(--text-sm);">No assets currently associated.</div>'}
      <div style="margin-top:var(--space-4);">
        <a class="btn btn-secondary btn-sm" href="https://nvd.nist.gov/vuln/detail/${encodeURIComponent(c.id)}" target="_blank" rel="noopener">${svg('down', 'vm-inline-icon')} View on nvd.nist.gov</a>
      </div>
    `);
    document.querySelectorAll('#vm-detail-body .ti-detail-link[data-asset]').forEach(el => el.addEventListener('click', () => _openAssetDetail(el.dataset.asset)));
  }

  // ══════════════════════════════════════════════════════════════════════
  // CVSS v3.1 CALCULATOR (real base-score formula)
  // ══════════════════════════════════════════════════════════════════════
  const CVSS_WEIGHTS = {
    AV: { N: 0.85, A: 0.62, L: 0.55, P: 0.2 },
    AC: { L: 0.77, H: 0.44 },
    PR: { // depends on scope
      U: { N: 0.85, L: 0.62, H: 0.27 },
      C: { N: 0.85, L: 0.68, H: 0.5 },
    },
    UI: { N: 0.85, R: 0.62 },
    CIA: { H: 0.56, L: 0.22, N: 0 },
  };

  function _cvssRoundUp(input) {
    const intInput = Math.round(input * 100000);
    if (intInput % 10000 === 0) return intInput / 100000;
    return (Math.floor(intInput / 10000) + 1) / 10;
  }

  function _computeCVSS(m) {
    const av = CVSS_WEIGHTS.AV[m.AV], ac = CVSS_WEIGHTS.AC[m.AC];
    const pr = CVSS_WEIGHTS.PR[m.S][m.PR], ui = CVSS_WEIGHTS.UI[m.UI];
    const c = CVSS_WEIGHTS.CIA[m.C], i = CVSS_WEIGHTS.CIA[m.I], a = CVSS_WEIGHTS.CIA[m.A];

    const iss = 1 - ((1 - c) * (1 - i) * (1 - a));
    let impact;
    if (m.S === 'U') impact = 6.42 * iss;
    else impact = 7.52 * (iss - 0.029) - 3.25 * Math.pow(iss - 0.02, 15);

    const exploitability = 8.22 * av * ac * pr * ui;

    let base;
    if (impact <= 0) base = 0;
    else if (m.S === 'U') base = _cvssRoundUp(Math.min(impact + exploitability, 10));
    else base = _cvssRoundUp(Math.min(1.08 * (impact + exploitability), 10));

    return { base, impact: Math.max(impact, 0), exploitability };
  }

  function _buildCVSSView() {
    const groups = [
      { key: 'AV', label: 'Attack Vector', opts: [['N', 'Network'], ['A', 'Adjacent'], ['L', 'Local'], ['P', 'Physical']] },
      { key: 'AC', label: 'Attack Complexity', opts: [['L', 'Low'], ['H', 'High']] },
      { key: 'PR', label: 'Privileges Required', opts: [['N', 'None'], ['L', 'Low'], ['H', 'High']] },
      { key: 'UI', label: 'User Interaction', opts: [['N', 'None'], ['R', 'Required']] },
      { key: 'S',  label: 'Scope', opts: [['U', 'Unchanged'], ['C', 'Changed']] },
      { key: 'C',  label: 'Confidentiality Impact', opts: [['H', 'High'], ['L', 'Low'], ['N', 'None']] },
      { key: 'I',  label: 'Integrity Impact', opts: [['H', 'High'], ['L', 'Low'], ['N', 'None']] },
      { key: 'A',  label: 'Availability Impact', opts: [['H', 'High'], ['L', 'Low'], ['N', 'None']] },
    ];
    return `
      <div class="vm-cvss-grid">
        <div class="card">
          <div class="card-header"><div class="card-title">CVSS v3.1 Base Metrics</div></div>
          <div class="card-body">
            ${groups.map(g => `
              <div class="vm-form-row">
                <label class="vm-label">${esc(g.label)}</label>
                <div class="nt-checkbox-grid" data-group="${g.key}">
                  ${g.opts.map((o, idx) => `<label class="nt-checkbox"><input type="radio" name="vm-cvss-${g.key}" value="${o[0]}" ${idx === 0 ? 'checked' : ''}/> <span class="mono">${o[0]}</span> ${esc(o[1])}</label>`).join('')}
                </div>
              </div>`).join('')}
          </div>
        </div>
        <div class="card vm-cvss-result-card">
          <div class="card-header"><div class="card-title">Score</div></div>
          <div class="card-body">
            <div class="vm-cvss-score" id="vm-cvss-score">0.0</div>
            <div class="vm-cvss-score-label" id="vm-cvss-score-label">None</div>
            <div class="vm-cvss-sub-scores">
              <div><span>Impact Sub-score</span><span id="vm-cvss-impact" class="mono">0.00</span></div>
              <div><span>Exploitability Sub-score</span><span id="vm-cvss-exploit" class="mono">0.00</span></div>
            </div>
            <div class="ti-detail-value-box mono" id="vm-cvss-vector" style="margin-top:var(--space-3);font-size:var(--text-xs);word-break:break-all;">CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:N</div>
            <button class="btn btn-secondary btn-sm" id="vm-cvss-copy" style="margin-top:var(--space-3);">${svg('copy')} Copy Vector String</button>
          </div>
        </div>
      </div>`;
  }

  function _wireCVSS() {
    document.querySelectorAll('#page-vuln-manager #vm-view-cvss-calc input[type=radio]').forEach(el => el.addEventListener('change', _recomputeCVSS));
    document.getElementById('vm-cvss-copy')?.addEventListener('click', () => _copyText(document.getElementById('vm-cvss-vector').textContent, 'CVSS vector copied'));
    _recomputeCVSS();
  }

  function _recomputeCVSS() {
    const root = document.getElementById('page-vuln-manager');
    const m = {};
    ['AV', 'AC', 'PR', 'UI', 'S', 'C', 'I', 'A'].forEach(k => {
      m[k] = root.querySelector(`input[name="vm-cvss-${k}"]:checked`)?.value || 'N';
    });
    const result = _computeCVSS(m);
    const sev = severityFromScore(result.base);
    const scoreEl = document.getElementById('vm-cvss-score');
    const labelEl = document.getElementById('vm-cvss-score-label');
    const sevColor = { critical: 'var(--color-danger)', high: '#f97316', medium: 'var(--color-warning)', low: 'var(--color-success)', none: 'var(--text-tertiary)' }[sev];
    if (scoreEl) { scoreEl.textContent = result.base.toFixed(1); scoreEl.style.color = sevColor; }
    if (labelEl) { labelEl.textContent = sev.charAt(0).toUpperCase() + sev.slice(1); labelEl.style.color = sevColor; }
    document.getElementById('vm-cvss-impact').textContent = result.impact.toFixed(2);
    document.getElementById('vm-cvss-exploit').textContent = result.exploitability.toFixed(2);
    document.getElementById('vm-cvss-vector').textContent = `CVSS:3.1/AV:${m.AV}/AC:${m.AC}/PR:${m.PR}/UI:${m.UI}/S:${m.S}/C:${m.C}/I:${m.I}/A:${m.A}`;
  }

  // ══════════════════════════════════════════════════════════════════════
  // PATCH TRACKING
  // ══════════════════════════════════════════════════════════════════════
  const PATCH_STATUSES = ['Not Started', 'In Progress', 'Patched', 'Verified'];

  function _buildPatchesView() {
    return `
      <div class="card">
        <div class="card-body" style="padding:0;overflow-x:auto;">
          <table class="data-table">
            <thead><tr><th>CVE</th><th>Asset</th><th>Owner</th><th>Due Date</th><th>Status</th><th>Notes</th></tr></thead>
            <tbody id="vm-patch-tbody"></tbody>
          </table>
        </div>
      </div>`;
  }

  function _wirePatches() { _renderPatches(); }

  function _renderPatches() {
    const d = SD();
    const tbody = document.getElementById('vm-patch-tbody');
    if (!tbody) return;
    tbody.innerHTML = d.patches.map(p => {
      const cve = d.getCVE(p.cveId); const asset = d.getAsset(p.assetId);
      const status = patchStatusOverrides[p.id] || p.status;
      return `<tr>
        <td class="mono">${esc(p.cveId)}</td><td>${asset ? esc(asset.name) : '—'}</td><td>${esc(p.owner)}</td>
        <td class="mono">${esc(p.dueDate)}</td>
        <td><select class="input vm-patch-status" data-id="${p.id}" style="min-width:140px;">
          ${PATCH_STATUSES.map(s => `<option value="${s}" ${s === status ? 'selected' : ''}>${s}</option>`).join('')}
        </select></td>
        <td style="color:var(--text-tertiary);">${esc(p.notes)}</td>
      </tr>`;
    }).join('');
    tbody.querySelectorAll('.vm-patch-status').forEach(sel => {
      sel.addEventListener('change', () => {
        patchStatusOverrides[sel.dataset.id] = sel.value;
        _saveOverrides();
        window.NotificationManager?.success('Status Updated', `Patch marked as ${sel.value}.`);
      });
    });
  }

  // ══════════════════════════════════════════════════════════════════════
  // RISK MATRIX (Likelihood × Impact, 5×5)
  // ══════════════════════════════════════════════════════════════════════
  function _buildRiskMatrixView() {
    return `
      <p style="color:var(--text-secondary);font-size:var(--text-sm);margin-bottom:var(--space-3);">Unpatched CVEs plotted by likelihood (derived from CVSS exploitability) and impact (derived from CVSS impact sub-score). Click a cell to see contents.</p>
      <div id="vm-risk-matrix" class="vm-risk-matrix"></div>`;
  }

  function _wireRiskMatrix() { _renderRiskMatrix(); }

  function _cveToMatrixCell(c) {
    // Approximate exploitability/impact bands using the CVSS vector on the CVE record.
    const parts = {};
    c.vector.split('/').slice(1).forEach(p => { const [k, v] = p.split(':'); parts[k] = v; });
    const m = { AV: parts.AV, AC: parts.AC, PR: parts.PR, UI: parts.UI, S: parts.S, C: parts.C, I: parts.I, A: parts.A };
    const { impact, exploitability } = _computeCVSS(m);
    const likelihood = Math.min(5, Math.max(1, Math.round((exploitability / 3.9) * 5)));
    const impactBand  = Math.min(5, Math.max(1, Math.round((impact / 6.0) * 5)));
    return { likelihood, impactBand };
  }

  function _renderRiskMatrix() {
    const d = SD();
    const box = document.getElementById('vm-risk-matrix');
    if (!box) return;
    const open = d.cves.filter(c => !c.patched);
    const grid = {}; // key `${impact}-${likelihood}` -> [cves]
    open.forEach(c => {
      const { likelihood, impactBand } = _cveToMatrixCell(c);
      const key = `${impactBand}-${likelihood}`;
      (grid[key] || (grid[key] = [])).push(c);
    });

    let html = `<div class="vm-matrix-grid">`;
    html += `<div class="vm-matrix-corner"></div>`;
    for (let l = 1; l <= 5; l++) html += `<div class="vm-matrix-axis-label">L${l}</div>`;
    for (let impact = 5; impact >= 1; impact--) {
      html += `<div class="vm-matrix-axis-label">I${impact}</div>`;
      for (let l = 1; l <= 5; l++) {
        const key = `${impact}-${l}`;
        const items = grid[key] || [];
        const riskScore = impact * l;
        const color = riskScore >= 17 ? 'var(--color-danger)' : riskScore >= 10 ? '#f97316' : riskScore >= 5 ? 'var(--color-warning)' : 'var(--color-success)';
        html += `<div class="vm-matrix-cell" style="background:${color}22;border-color:${color}55;" data-key="${key}">
          <div class="vm-matrix-cell-count" style="color:${color};">${items.length || ''}</div>
        </div>`;
      }
    }
    html += `</div>
      <div class="vm-matrix-legend">
        <span>Likelihood (L1 = rare → L5 = frequent)</span>
        <span>Impact (I1 = negligible → I5 = severe)</span>
      </div>`;
    box.innerHTML = html;

    box.querySelectorAll('.vm-matrix-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        const items = grid[cell.dataset.key] || [];
        if (!items.length) return;
        _openDetail(`Risk Cell — ${items.length} CVE(s)`, items.map(c => `<div class="ti-detail-link" data-cve="${c.id}">${svg('bug', 'vm-inline-icon')} ${esc(c.id)} — ${esc(c.product)} ${severityBadge(c.severity)}</div>`).join(''));
        document.querySelectorAll('#vm-detail-body .ti-detail-link[data-cve]').forEach(el => el.addEventListener('click', () => _openCVEDetail(el.dataset.cve)));
      });
    });
  }

  // ══════════════════════════════════════════════════════════════════════
  // COMPLIANCE MAPPING (NIST CSF / CIS Controls / OWASP Top 10)
  // ══════════════════════════════════════════════════════════════════════
  function _buildComplianceView() {
    const d = SD();
    return `
      <div class="card">
        <div class="card-header"><div class="card-title">NIST Cybersecurity Framework 2.0</div></div>
        <div class="card-body">
          ${d.nistCsf.map(f => `
            <div class="vm-sev-row">
              <div class="vm-sev-label" style="width:110px;">${esc(f.fn)}</div>
              <div class="vm-sev-track"><div class="vm-sev-fill" style="width:${f.coverage}%;background:var(--color-primary);"></div></div>
              <div class="vm-sev-count">${f.coverage}%</div>
            </div>
            <div class="vm-nist-desc">${esc(f.desc)}</div>
          `).join('')}
        </div>
      </div>

      <div class="card" style="margin-top:var(--space-4);">
        <div class="card-header"><div class="card-title">CIS Controls v8</div></div>
        <div class="card-body" style="padding:0;">
          <table class="data-table">
            <thead><tr><th>Control</th><th>Name</th><th>Status</th></tr></thead>
            <tbody>${d.cisControls.map(c => `<tr><td class="mono">${esc(c.id)}</td><td>${esc(c.name)}</td><td><span class="badge ${c.status === 'Implemented' ? 'badge-success' : c.status === 'Partial' ? 'badge-warning' : 'badge-neutral'}">${esc(c.status)}</span></td></tr>`).join('')}</tbody>
          </table>
        </div>
      </div>

      <div class="card" style="margin-top:var(--space-4);">
        <div class="card-header"><div class="card-title">OWASP Top 10 (2021)</div></div>
        <div class="card-body" style="padding:0;">
          <table class="data-table">
            <thead><tr><th>ID</th><th>Category</th><th>Related CVEs</th></tr></thead>
            <tbody>${d.owaspTop10.map(o => `<tr><td class="mono">${esc(o.id)}</td><td>${esc(o.name)}</td><td>${o.relatedCves.length ? o.relatedCves.map(esc).join(', ') : '<span style="color:var(--text-tertiary);">none mapped</span>'}</td></tr>`).join('')}</tbody>
          </table>
        </div>
      </div>`;
  }

  // ══════════════════════════════════════════════════════════════════════
  // EXECUTIVE DASHBOARD
  // ══════════════════════════════════════════════════════════════════════
  function _buildExecutiveView() {
    const d = SD();
    const total = d.cves.length;
    const patchedCount = d.cves.filter(c => c.patched).length;
    const patchRate = total ? Math.round((patchedCount / total) * 100) : 0;
    const avgCsf = Math.round(d.nistCsf.reduce((s, f) => s + f.coverage, 0) / (d.nistCsf.length || 1));
    const criticalOpen = d.cves.filter(c => c.severity === 'critical' && !c.patched).length;

    return `
      <div class="grid grid-stats">
        ${_statCard('Patch Rate', patchRate + '%', `${patchedCount}/${total} CVEs remediated`, 'var(--color-success)')}
        ${_statCard('Avg. NIST CSF Coverage', avgCsf + '%', 'Across 6 functions', 'var(--color-primary)')}
        ${_statCard('Critical Open Risks', criticalOpen, 'Require immediate action', 'var(--color-danger)')}
        ${_statCard('Assets at Risk', new Set(d.cves.filter(c => !c.patched).flatMap(c => c.affectedAssets)).size, 'With ≥1 open CVE', 'var(--color-warning)')}
      </div>
      <div class="card" style="margin-top:var(--space-5);">
        <div class="card-header"><div class="card-title">Executive Summary</div></div>
        <div class="card-body">
          <p style="font-size:var(--text-sm);color:var(--text-secondary);line-height:1.7;">
            Of <strong>${total}</strong> tracked vulnerabilities, <strong>${patchedCount}</strong> (${patchRate}%) have been remediated.
            <strong>${criticalOpen}</strong> critical-severity vulnerabilities remain open and should be prioritized for immediate patching.
            Average coverage across the six NIST Cybersecurity Framework functions stands at <strong>${avgCsf}%</strong>, with
            the lowest maturity currently in <strong>Recover</strong>. Recommend prioritizing patch deployment for internet-facing
            and critical-tier assets, and continued investment in detection and response tooling.
          </p>
        </div>
      </div>`;
  }

  // ══════════════════════════════════════════════════════════════════════
  // REPORTS
  // ══════════════════════════════════════════════════════════════════════
  function _buildReportsView() {
    return `
      <div class="card" style="max-width:640px;">
        <div class="card-header"><div class="card-title">Export Vulnerability Data</div></div>
        <div class="card-body">
          <div style="display:flex;gap:var(--space-3);flex-wrap:wrap;">
            <button class="btn btn-secondary" id="vm-export-json">${svg('down')} CVE Data (JSON)</button>
            <button class="btn btn-secondary" id="vm-export-csv">${svg('down')} CVE Data (CSV)</button>
            <button class="btn btn-secondary" id="vm-export-exec">${svg('report')} Executive Report (HTML)</button>
          </div>
        </div>
      </div>`;
  }

  function _wireReports() {
    document.getElementById('vm-export-json')?.addEventListener('click', () => {
      _download('vulnerabilities.json', JSON.stringify(SD().cves, null, 2), 'application/json');
      window.NotificationManager?.success('Exported', 'CVE data exported as JSON.');
    });
    document.getElementById('vm-export-csv')?.addEventListener('click', () => {
      const d = SD();
      const header = ['id', 'product', 'cvss', 'severity', 'publishedDate', 'patched'];
      const rows = d.cves.map(c => header.map(k => `"${String(c[k]).replace(/"/g, '""')}"`).join(','));
      _download('vulnerabilities.csv', [header.join(','), ...rows].join('\n'), 'text/csv');
      window.NotificationManager?.success('Exported', 'CVE data exported as CSV.');
    });
    document.getElementById('vm-export-exec')?.addEventListener('click', _exportExecutiveHTML);
  }

  function _download(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function _exportExecutiveHTML() {
    const d = SD();
    const patchedCount = d.cves.filter(c => c.patched).length;
    const patchRate = d.cves.length ? Math.round((patchedCount / d.cves.length) * 100) : 0;
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Vulnerability Executive Report</title>
      <style>body{font-family:-apple-system,sans-serif;max-width:960px;margin:40px auto;color:#0f172a;}
      table{width:100%;border-collapse:collapse;margin:16px 0;} th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:13px;}
      th{background:#f1f5f9;} h1{font-size:22px;} h2{font-size:16px;margin-top:32px;} .warn{background:#fef3c7;padding:10px;border-radius:6px;font-size:12px;}</style>
      </head><body>
      <h1>Khan Security Solutions — Vulnerability Management Executive Report</h1>
      <div class="warn">⚠ Educational simulation — asset/patch data is synthetic; CVE IDs are real public identifiers.</div>
      <p>Patch rate: <strong>${patchRate}%</strong> (${patchedCount} of ${d.cves.length} CVEs remediated).</p>
      <h2>CVE Register</h2>
      <table><tr><th>CVE</th><th>Product</th><th>CVSS</th><th>Severity</th><th>Status</th></tr>
      ${d.cves.map(c => `<tr><td>${esc(c.id)}</td><td>${esc(c.product)}</td><td>${c.cvss.toFixed(1)}</td><td>${esc(c.severity)}</td><td>${c.patched ? 'Patched' : 'Open'}</td></tr>`).join('')}
      </table>
      <h2>CIS Controls v8 Status</h2>
      <table><tr><th>Control</th><th>Name</th><th>Status</th></tr>
      ${d.cisControls.map(c => `<tr><td>${esc(c.id)}</td><td>${esc(c.name)}</td><td>${esc(c.status)}</td></tr>`).join('')}
      </table>
      <p style="color:#64748b;font-size:11px;margin-top:24px;">Generated by Khan Security Solutions Enterprise · ${new Date().toLocaleString()}</p>
      </body></html>`;
    _download('vulnerability-executive-report.html', html, 'text/html');
    window.NotificationManager?.success('Report Exported', 'Executive report downloaded.');
  }

  // ══════════════════════════════════════════════════════════════════════
  // DETAIL PANEL / PERSISTENCE / SEARCH
  // ══════════════════════════════════════════════════════════════════════
  function _openDetail(title, bodyHtml) {
    document.getElementById('vm-detail-title').textContent = title;
    document.getElementById('vm-detail-body').innerHTML = bodyHtml;
    document.getElementById('vm-detail-overlay').classList.add('open');
  }
  function _closeDetail() { document.getElementById('vm-detail-overlay').classList.remove('open'); }

  function _loadOverrides() { patchStatusOverrides = window.StorageManager?.lsGet('vm_patch_overrides', {}) || {}; }
  function _saveOverrides() { window.StorageManager?.lsSet('vm_patch_overrides', patchStatusOverrides); }

  function _copyText(text, msg) {
    navigator.clipboard?.writeText(text).then(() => window.NotificationManager?.info(msg || 'Copied', '')).catch(() => {
      const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
      window.NotificationManager?.info(msg || 'Copied', '');
    });
  }

  function _registerSearch() {
    if (!window.SearchEngine) return;
    const d = SD();
    window.SearchEngine.register('Vulnerability Manager', [
      { title: 'Vulnerability Manager', meta: 'CVE database, CVSS calculator, patch tracking, compliance', route: 'vuln-manager', keywords: 'vulnerability manager cve cvss patch risk matrix nist cis owasp compliance' },
      ...d.cves.map(c => ({ title: c.id, meta: `${c.product} — CVSS ${c.cvss}`, route: 'vuln-manager', keywords: `cve ${c.id} ${c.product} ${c.severity}` })),
    ]);
  }

  return { register };

})();

window.VulnManager = VulnManager;

if (window.Router) {
  VulnManager.register();
} else {
  console.error('[VulnManager] Router not found. Ensure router.js loads before vuln-manager.js.');
}
