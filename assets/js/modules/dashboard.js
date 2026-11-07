/**
 * KHAN SECURITY SOLUTIONS ENTERPRISE
 * Dashboard — Executive SOC Command Center
 *
 * Replaces the Milestone 1 "Pending M3" placeholder. This is the main
 * landing page of the application: an offline, demonstration-data
 * Executive Command Center in the style of Defender XDR / Sentinel /
 * CrowdStrike Falcon / Splunk ES.
 *
 * Reads live counts from every other module's bundled dataset (with a
 * safe numeric fallback if a dataset isn't loaded yet) — no external API
 * is ever called. Quick Actions simply navigate to the existing modules;
 * nothing here recreates them.
 *
 * Depends on:
 *   window.Router               — route: 'dashboard'
 *   window.SearchEngine         — registers Quick Action shortcuts
 *   window.SampleDashboardData  — demo-only content (activity feed, AI
 *                                  insights, platform health, quick actions)
 *   window.Sample*Data          — live data from every other module
 */

const Dashboard = (() => {

  // ── Data accessor with safe fallback ────────────────────────────────────
  const DD = () => window.SampleDashboardData || { ACTIVITY_FEED: [], AI_INSIGHTS: [], PLATFORM_HEALTH: {}, QUICK_ACTIONS: [] };

  let clockTimer = null;
  let activityTimer = null;
  let activityFeedEl = null;
  let activityIdx = 0;

  // ── Registration ─────────────────────────────────────────────────────────
  function register() { window.Router.register('dashboard', { title: 'Dashboard', init, render, cleanup }); }

  function init() {
    const items = DD().QUICK_ACTIONS.map(a => ({
      title: a.label, meta: 'Dashboard · Quick Action', route: a.route, keywords: `dashboard quick action ${a.label}`,
    }));
    window.SearchEngine?.register('Dashboard', items);
  }

  // ── Icons (minimal inline SVG set) ───────────────────────────────────────
  const I = {
    shield: '<path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z"/>',
    'shield-alert': '<path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z"/><path d="M12 8v4"/><circle cx="12" cy="15.5" r="0.6" fill="currentColor" stroke="none"/>',
    bug: '<path d="M8 3l1.5 2M16 3l-1.5 2M5 9h14M12 8v11M8 8a4 4 0 0 1 8 0M4 12h3M17 12h3M5 16l3-1M19 16l-3-1"/><rect x="8" y="8" width="8" height="11" rx="4"/>',
    server: '<rect x="3" y="4" width="18" height="6" rx="1.5"/><rect x="3" y="14" width="18" height="6" rx="1.5"/><circle cx="7" cy="7" r="0.6" fill="currentColor" stroke="none"/><circle cx="7" cy="17" r="0.6" fill="currentColor" stroke="none"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 4 5.6 4 9s-1.5 6.5-4 9c-2.5-2.5-4-5.6-4-9s1.5-6.5 4-9z"/>',
    user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-4 3-6.5 7-6.5s7 2.5 7 6.5"/>',
    users: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 14.2c2.6.3 4.5 2.2 4.5 5.3"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 6l9 7 9-7"/>',
    key: '<circle cx="8" cy="14" r="4"/><path d="M11 11l9-9M17 5l2 2M14 8l2 2"/>',
    report: '<path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h5"/><path d="M8 12h8M8 16h8M8 8h3"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-5-5"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    cloud: '<path d="M7 18a4.5 4.5 0 0 1-.5-8.97A5.5 5.5 0 0 1 17.3 9.1 4 4 0 0 1 17 18H7z"/>',
    terminal: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3M13 15h4"/>',
    alert: '<path d="M10.3 3.9L2.8 17a1.5 1.5 0 0 0 1.3 2.2h15.8a1.5 1.5 0 0 0 1.3-2.2L13.7 3.9a1.5 1.5 0 0 0-2.6 0z"/><path d="M12 9.5v4"/><circle cx="12" cy="16.3" r="0.6" fill="currentColor" stroke="none"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none"/>',
    folder: '<path d="M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6z"/>',
    sparkles: '<path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z"/><path d="M19 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 13a7.4 7.4 0 0 0 0-2l2-1.5-2-3.4-2.4.6a7.6 7.6 0 0 0-1.7-1L14.8 3H9.2l-.5 2.7a7.6 7.6 0 0 0-1.7 1l-2.4-.6-2 3.4L4.6 11a7.4 7.4 0 0 0 0 2l-2 1.5 2 3.4 2.4-.6a7.6 7.6 0 0 0 1.7 1l.5 2.7h5.6l.5-2.7a7.6 7.6 0 0 0 1.7-1l2.4.6 2-3.4z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    activity: '<path d="M3 12h4l2 7 4-14 2 7h6"/>',
    cpu: '<rect x="7" y="7" width="10" height="10" rx="1.5"/><rect x="10" y="2.5" width="4" height="3"/><rect x="10" y="18.5" width="4" height="3"/><rect x="2.5" y="10" width="3" height="4"/><rect x="18.5" y="10" width="3" height="4"/>',
    'hard-drive': '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 14h18"/><circle cx="7" cy="16" r="0.6" fill="currentColor" stroke="none"/>',
    database: '<ellipse cx="12" cy="5.5" rx="8" ry="3"/><path d="M4 5.5v13c0 1.7 3.6 3 8 3s8-1.3 8-3v-13"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    wifi: '<path d="M2 8.5a15 15 0 0 1 20 0M5.5 12.3a10 10 0 0 1 13 0M9 16a5 5 0 0 1 6 0"/><circle cx="12" cy="19.5" r="0.9" fill="currentColor" stroke="none"/>',
    'trend-up': '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5M3 17l9 5 9-5"/>',
    box: '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
    'arrow-right': '<path d="M5 12h14M13 6l6 6-6 6"/>',
  };
  function svg(name, cls = '') { return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${I[name] || I.box}</svg>`; }
  function esc(s) { const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function _fmtNum(n) { return Number(n || 0).toLocaleString('en-US'); }
  function _truncate(s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
  function _liveOrFallback(fn, fallback) { try { const v = fn(); return (v === null || v === undefined || Number.isNaN(v)) ? fallback : v; } catch (e) { return fallback; } }

  // ── Live stats aggregation ───────────────────────────────────────────────
  function _stats() {
    const kpi = window.SampleReportsData?.KPI || {};
    const assets = window.SampleAssetData?.assets || [];
    const incidents = window.SampleIncidentData?.incidents || [];
    const vulns = window.SampleVulnData?.cves || [];
    const iocs = window.SampleIOCData?.iocs || [];
    const cases = window.SampleCaseData?.cases || [];
    const threatIntel = window.SampleThreatIntel || {};
    const reports = window.SampleReportsData?.REPORTS || [];
    const malware = window.SampleMalware || {};

    const openIncidents = incidents.filter(i => !['Resolved', 'Closed'].includes(i.status));
    const bySeverity = sev => incidents.filter(i => (i.severity || '').toLowerCase() === sev).length;
    const activeCases = cases.filter(c => !['Resolved', 'Closed', 'Archived', 'False Positive'].includes(c.status));

    const distinctFamilies = new Set(
      iocs.map(i => i.threatContext?.malwareFamily).filter(Boolean)
    ).size;

    return {
      // Executive Summary
      securityScore: kpi.securityScore ?? 78,
      riskScore: kpi.riskIndex ?? 32,
      protectedAssets: _liveOrFallback(() => assets.length, kpi.totalAssets ?? 642),
      openIncidentsCount: _liveOrFallback(() => openIncidents.length, kpi.openIncidents ?? 14),
      criticalAlerts: _liveOrFallback(() => openIncidents.filter(i => (i.severity || '').toLowerCase() === 'critical').length, 4),
      threatFeeds: _liveOrFallback(() => (threatIntel.actors?.length || 0) + (threatIntel.campaigns?.length || 0), 18),
      iocCount: _liveOrFallback(() => iocs.length, kpi.threatIntelIOCs ?? 1284),
      activeCasesCount: _liveOrFallback(() => activeCases.length, kpi.activeCases ?? 22),
      reportsGenerated: _liveOrFallback(() => reports.length, 100),
      systemHealth: 98,

      // Security Overview
      endpointsOnline: _liveOrFallback(() => assets.filter(a => a.status !== 'Offline' && a.status !== 'Retired').length, 580),
      servers: _liveOrFallback(() => assets.filter(a => a.category === 'Servers').length, 64),
      cloudAssets: _liveOrFallback(() => assets.filter(a => a.category === 'Cloud Resources').length, 48),
      usersProtected: _liveOrFallback(() => new Set(assets.map(a => a.assignedUser).filter(Boolean)).size, 210),
      identitySources: 3,
      networkDevices: _liveOrFallback(() => assets.filter(a => a.category === 'Network Devices').length, 36),
      lastScanTime: _liveOrFallback(() => assets.map(a => a.lastSeen).filter(Boolean).sort().slice(-1)[0], null),

      // Incident Overview
      incCritical: _liveOrFallback(() => bySeverity('critical'), 6),
      incHigh: _liveOrFallback(() => bySeverity('high'), 11),
      incMedium: _liveOrFallback(() => bySeverity('medium'), 18),
      incLow: _liveOrFallback(() => bySeverity('low'), 9),
      resolvedToday: _liveOrFallback(() => incidents.filter(i => ['Resolved', 'Closed'].includes(i.status)).length, 5),
      avgResponseMin: kpi.mttdMinutes ?? 46,
      avgResolutionMin: kpi.mttrMinutes ?? 312,

      // Threat Intelligence
      latestFeed: threatIntel.campaigns?.[0]?.name || threatIntel.actors?.[0]?.name || 'GHOSTSPIDER Campaign Update',
      malwareFamilies: distinctFamilies || 5,
      threatActors: threatIntel.actors?.length ?? 12,
      mitreCount: threatIntel.mitreTechniques?.length ?? 32,
      detectionRules: (malware.yaraRules?.length || 12) + (iocs.filter(i => i.type === 'Sigma Rule').length || 8),
      yaraRules: malware.yaraRules?.length ?? 12,
      sigmaRules: _liveOrFallback(() => iocs.filter(i => i.type === 'Sigma Rule').length, 8),

      // Vulnerability Summary
      vCritical: _liveOrFallback(() => vulns.filter(v => v.severity === 'critical').length, 2),
      vHigh: _liveOrFallback(() => vulns.filter(v => v.severity === 'high').length, 3),
      vMedium: _liveOrFallback(() => vulns.filter(v => v.severity === 'medium').length, 1),
      vLow: _liveOrFallback(() => vulns.filter(v => v.severity === 'low').length, 0),
      patchCompliance: _liveOrFallback(() => Math.round((vulns.filter(v => v.patched).length / (vulns.length || 1)) * 100), 82),

      // Asset Summary
      astServers: _liveOrFallback(() => assets.filter(a => a.category === 'Servers').length, 64),
      astWorkstations: _liveOrFallback(() => assets.filter(a => a.category === 'Workstations').length, 210),
      astLaptops: _liveOrFallback(() => assets.filter(a => a.assetType === 'Laptop').length, 88),
      astLinux: _liveOrFallback(() => assets.filter(a => /linux|ubuntu/i.test(a.os || '')).length, 42),
      astWindows: _liveOrFallback(() => assets.filter(a => /windows/i.test(a.os || '')).length, 300),
      astCloud: _liveOrFallback(() => assets.filter(a => a.category === 'Cloud Resources').length, 48),
      astNetwork: _liveOrFallback(() => assets.filter(a => a.category === 'Network Devices').length, 36),
      astMobile: _liveOrFallback(() => assets.filter(a => a.category === 'Mobile Devices').length, 22),

      _incidentsRaw: incidents, _vulnsRaw: vulns, _assetsRaw: assets, _reportsRaw: reports,
    };
  }

  // ── Root layout ───────────────────────────────────────────────────────────
  function render() {
    const el = document.getElementById('page-dashboard');
    if (!el) return;
    const s = _stats();

    el.innerHTML = `
      <div class="xc-dashboard">
        ${_topSection()}
        ${_execSummary(s)}
        ${_securityOverview(s)}
        ${_incidentOverview(s)}
        ${_threatIntelSection(s)}
        ${_vulnSummary(s)}
        ${_assetSummary(s)}
        ${_recentIncidents(s)}
        <div class="xc-row-2">
          ${_liveActivity()}
          ${_quickActions()}
        </div>
        <div class="xc-row-2">
          ${_recentReports(s)}
          ${_aiInsights()}
        </div>
        ${_platformHealth()}
        ${_chartsSection()}
        <div class="xc-footer-note">${svg('shield', 'xc-icon-sm')} Khan Security Solutions Enterprise — Offline Demonstration Mode. All data on this dashboard is synthetic and generated locally; no external AI or network service is contacted.</div>
      </div>
    `;

    _startClock();
    _animateCounters();
    _startActivityFeed();
    _renderCharts(s);
    _wireQuickActions();
  }

  function cleanup() {
    if (clockTimer) clearInterval(clockTimer);
    if (activityTimer) clearInterval(activityTimer);
    clockTimer = null; activityTimer = null; activityFeedEl = null;
  }

  // ── Top section ───────────────────────────────────────────────────────────
  function _topSection() {
    return `
      <div class="xc-hero">
        <div class="xc-hero-main">
          <div class="xc-hero-eyebrow">${svg('shield', 'xc-icon-sm')} KHAN SECURITY SOLUTIONS · Enterprise Security Operations Center</div>
          <h1 class="xc-hero-title">Welcome back</h1>
          <p class="xc-hero-sub">Here's the current state of your security posture at a glance.</p>
        </div>
        <div class="xc-hero-meta">
          <div class="xc-hero-meta-item"><span class="xc-hero-meta-label">Date</span><span id="xc-clock-date" class="xc-hero-meta-value">—</span></div>
          <div class="xc-hero-meta-item"><span class="xc-hero-meta-label">Time</span><span id="xc-clock-time" class="xc-hero-meta-value">—</span></div>
          <div class="xc-hero-meta-item"><span class="xc-hero-meta-label">Platform Version</span><span class="xc-hero-meta-value">v1.9.0</span></div>
          <div class="xc-hero-meta-item"><span class="xc-hero-meta-label">Mode</span><span class="xc-hero-meta-value xc-badge-offline">${svg('wifi', 'xc-icon-xs')} Offline Mode Active</span></div>
          <div class="xc-hero-meta-item"><span class="xc-hero-meta-label">System Status</span><span class="xc-hero-meta-value xc-badge-ok">${svg('check', 'xc-icon-xs')} All Systems Operational</span></div>
        </div>
      </div>
    `;
  }

  function _startClock() {
    const dateEl = document.getElementById('xc-clock-date');
    const timeEl = document.getElementById('xc-clock-time');
    function tick() {
      const now = new Date();
      if (dateEl) dateEl.textContent = now.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
      if (timeEl) timeEl.textContent = now.toLocaleTimeString('en-US');
    }
    tick();
    if (clockTimer) clearInterval(clockTimer);
    clockTimer = setInterval(tick, 1000);
  }

  // ── Section helpers ──────────────────────────────────────────────────────
  function _sectionHeader(title, sub) {
    return `<div class="xc-section-head"><h2 class="xc-section-title">${esc(title)}</h2>${sub ? `<span class="xc-section-sub">${esc(sub)}</span>` : ''}</div>`;
  }

  function _statCard({ icon, label, value, sub, color = 'primary', animate = true }) {
    return `
      <div class="xc-stat-card">
        <div class="xc-stat-icon xc-c-${color}">${svg(icon)}</div>
        <div class="xc-stat-body">
          <div class="xc-stat-value" ${animate ? `data-xc-count="${Number(value) || 0}"` : ''}>${animate ? '0' : esc(value)}</div>
          <div class="xc-stat-label">${esc(label)}</div>
          ${sub ? `<div class="xc-stat-sub">${esc(sub)}</div>` : ''}
        </div>
      </div>`;
  }

  // ── Executive Summary ────────────────────────────────────────────────────
  function _execSummary(s) {
    return `
      <section class="xc-section">
        ${_sectionHeader('Executive Summary', 'Key metrics across the platform')}
        <div class="xc-stat-grid">
          ${_statCard({ icon: 'shield', label: 'Security Score', value: s.securityScore, sub: 'out of 100', color: 'success', animate: false })}
          ${_statCard({ icon: 'trend-up', label: 'Risk Score', value: s.riskScore, sub: 'lower is better', color: 'warning', animate: false })}
          ${_statCard({ icon: 'server', label: 'Protected Assets', value: s.protectedAssets, color: 'primary' })}
          ${_statCard({ icon: 'alert', label: 'Open Incidents', value: s.openIncidentsCount, color: 'warning' })}
          ${_statCard({ icon: 'shield-alert', label: 'Critical Alerts', value: s.criticalAlerts, color: 'danger' })}
          ${_statCard({ icon: 'globe', label: 'Threat Intel Feeds', value: s.threatFeeds, color: 'info' })}
          ${_statCard({ icon: 'target', label: 'IOC Database', value: s.iocCount, color: 'accent' })}
          ${_statCard({ icon: 'folder', label: 'Active Cases', value: s.activeCasesCount, color: 'primary' })}
          ${_statCard({ icon: 'report', label: 'Reports Generated', value: s.reportsGenerated, color: 'info' })}
          ${_statCard({ icon: 'cpu', label: 'System Health', value: s.systemHealth + '%', sub: 'Demo Value', color: 'success', animate: false })}
        </div>
      </section>`;
  }

  // ── Security Overview ────────────────────────────────────────────────────
  function _securityOverview(s) {
    return `
      <section class="xc-section">
        ${_sectionHeader('Security Overview')}
        <div class="xc-stat-grid xc-stat-grid-8">
          ${_statCard({ icon: 'shield', label: 'Assets Protected', value: s.protectedAssets, color: 'success' })}
          ${_statCard({ icon: 'wifi', label: 'Endpoints Online', value: s.endpointsOnline, color: 'success' })}
          ${_statCard({ icon: 'server', label: 'Servers', value: s.servers, color: 'primary' })}
          ${_statCard({ icon: 'cloud', label: 'Cloud Assets', value: s.cloudAssets, color: 'info' })}
          ${_statCard({ icon: 'users', label: 'Users Protected', value: s.usersProtected, color: 'primary' })}
          ${_statCard({ icon: 'key', label: 'Identity Sources', value: s.identitySources, color: 'accent', animate: false })}
          ${_statCard({ icon: 'layers', label: 'Network Devices', value: s.networkDevices, color: 'info' })}
          ${_statCard({ icon: 'clock', label: 'Last Scan', value: s.lastScanTime ? s.lastScanTime.split(' ')[0] : '—', sub: s.lastScanTime ? s.lastScanTime.split(' ')[1] || '' : 'Demo Value', color: 'warning', animate: false })}
        </div>
      </section>`;
  }

  // ── Incident Overview ─────────────────────────────────────────────────────
  function _incidentOverview(s) {
    return `
      <section class="xc-section">
        ${_sectionHeader('Incident Overview')}
        <div class="xc-stat-grid xc-stat-grid-7">
          ${_statCard({ icon: 'shield-alert', label: 'Critical', value: s.incCritical, color: 'danger' })}
          ${_statCard({ icon: 'alert', label: 'High', value: s.incHigh, color: 'warning' })}
          ${_statCard({ icon: 'alert', label: 'Medium', value: s.incMedium, color: 'accent' })}
          ${_statCard({ icon: 'alert', label: 'Low', value: s.incLow, color: 'info' })}
          ${_statCard({ icon: 'check', label: 'Resolved Today', value: s.resolvedToday, color: 'success' })}
          ${_statCard({ icon: 'clock', label: 'Avg. Response Time', value: s.avgResponseMin, sub: 'minutes', color: 'primary' })}
          ${_statCard({ icon: 'clock', label: 'Avg. Resolution Time', value: s.avgResolutionMin, sub: 'minutes', color: 'primary' })}
        </div>
      </section>`;
  }

  // ── Threat Intelligence ───────────────────────────────────────────────────
  function _threatIntelSection(s) {
    return `
      <section class="xc-section">
        ${_sectionHeader('Threat Intelligence')}
        <div class="xc-widget-row">
          <div class="xc-widget xc-widget-wide">
            <div class="xc-widget-title">${svg('globe', 'xc-icon-sm')} Latest Threat Feed</div>
            <div class="xc-widget-highlight">${esc(s.latestFeed)}</div>
            <div class="xc-widget-note">Most recent correlated intelligence update — offline demonstration data.</div>
          </div>
          <div class="xc-widget"><div class="xc-widget-num">${_fmtNum(s.malwareFamilies)}</div><div class="xc-widget-label">Malware Families</div></div>
          <div class="xc-widget"><div class="xc-widget-num">${_fmtNum(s.threatActors)}</div><div class="xc-widget-label">Threat Actors</div></div>
          <div class="xc-widget"><div class="xc-widget-num">${_fmtNum(s.mitreCount)}</div><div class="xc-widget-label">MITRE Techniques</div></div>
          <div class="xc-widget"><div class="xc-widget-num">${_fmtNum(s.detectionRules)}</div><div class="xc-widget-label">Detection Rules</div></div>
          <div class="xc-widget"><div class="xc-widget-num">${_fmtNum(s.yaraRules)}</div><div class="xc-widget-label">YARA Rules</div></div>
          <div class="xc-widget"><div class="xc-widget-num">${_fmtNum(s.sigmaRules)}</div><div class="xc-widget-label">Sigma Rules</div></div>
          <div class="xc-widget"><div class="xc-widget-num">${_fmtNum(s.iocCount)}</div><div class="xc-widget-label">IOC Count</div></div>
        </div>
      </section>`;
  }

  // ── Vulnerability Summary ────────────────────────────────────────────────
  function _vulnSummary(s) {
    return `
      <section class="xc-section">
        ${_sectionHeader('Vulnerability Summary')}
        <div class="xc-stat-grid xc-stat-grid-7">
          ${_statCard({ icon: 'shield-alert', label: 'Critical', value: s.vCritical, color: 'danger' })}
          ${_statCard({ icon: 'alert', label: 'High', value: s.vHigh, color: 'warning' })}
          ${_statCard({ icon: 'alert', label: 'Medium', value: s.vMedium, color: 'accent' })}
          ${_statCard({ icon: 'alert', label: 'Low', value: s.vLow, color: 'info' })}
          ${_statCard({ icon: 'clock', label: 'Latest Scan', value: 'Today', sub: 'Demo Value', color: 'primary', animate: false })}
          ${_statCard({ icon: 'check', label: 'Patch Compliance', value: s.patchCompliance + '%', color: 'success', animate: false })}
          ${_statCard({ icon: 'trend-up', label: 'Remediation Progress', value: Math.max(0, s.patchCompliance - 6) + '%', color: 'info', animate: false })}
        </div>
      </section>`;
  }

  // ── Asset Summary ────────────────────────────────────────────────────────
  function _assetSummary(s) {
    return `
      <section class="xc-section">
        ${_sectionHeader('Asset Summary', 'Live from Asset Inventory')}
        <div class="xc-stat-grid xc-stat-grid-8">
          ${_statCard({ icon: 'server', label: 'Servers', value: s.astServers, color: 'primary' })}
          ${_statCard({ icon: 'box', label: 'Workstations', value: s.astWorkstations, color: 'info' })}
          ${_statCard({ icon: 'box', label: 'Laptops', value: s.astLaptops, color: 'info' })}
          ${_statCard({ icon: 'terminal', label: 'Linux', value: s.astLinux, color: 'accent' })}
          ${_statCard({ icon: 'box', label: 'Windows', value: s.astWindows, color: 'primary' })}
          ${_statCard({ icon: 'cloud', label: 'Cloud', value: s.astCloud, color: 'info' })}
          ${_statCard({ icon: 'layers', label: 'Network Equipment', value: s.astNetwork, color: 'warning' })}
          ${_statCard({ icon: 'box', label: 'Mobile Devices', value: s.astMobile, color: 'accent' })}
        </div>
      </section>`;
  }

  // ── Recent Incidents table ───────────────────────────────────────────────
  function _recentIncidents(s) {
    const rows = [...s._incidentsRaw]
      .sort((a, b) => new Date(b.createdTime) - new Date(a.createdTime))
      .slice(0, 8);

    const sevBadge = sev => `<span class="xc-sev xc-sev-${(sev || 'info').toLowerCase()}">${esc(sev || '—')}</span>`;

    return `
      <section class="xc-section">
        ${_sectionHeader('Recent Incidents')}
        <div class="xc-table-wrap">
          <table class="xc-table">
            <thead><tr><th>Time</th><th>Severity</th><th>Incident</th><th>Status</th><th>Assigned</th><th>MITRE</th><th></th></tr></thead>
            <tbody>
              ${rows.length ? rows.map(inc => `
                <tr>
                  <td class="xc-nowrap">${esc((inc.createdTime || '').replace('T', ' ').slice(0, 16))}</td>
                  <td>${sevBadge(inc.severity)}</td>
                  <td class="xc-td-title">${esc(_truncate(inc.title, 46))}</td>
                  <td>${esc(inc.status)}</td>
                  <td>${esc(inc.assignedAnalyst || '—')}</td>
                  <td>${esc(inc.mitre?.id || '—')}</td>
                  <td><button class="xc-link-btn" data-xc-route="incident-response">View ${svg('arrow-right', 'xc-icon-xs')}</button></td>
                </tr>`).join('') : `<tr><td colspan="7" class="xc-empty">No incidents loaded yet.</td></tr>`}
            </tbody>
          </table>
        </div>
      </section>`;
  }

  // ── Live Security Activity ───────────────────────────────────────────────
  function _liveActivity() {
    return `
      <div class="xc-panel">
        <div class="xc-panel-head">${svg('activity', 'xc-icon-sm')} Live Security Activity</div>
        <div class="xc-activity-feed" id="xc-activity-feed"></div>
      </div>`;
  }

  function _startActivityFeed() {
    activityFeedEl = document.getElementById('xc-activity-feed');
    if (!activityFeedEl) return;
    const feed = DD().ACTIVITY_FEED.length ? DD().ACTIVITY_FEED : [{ icon: 'shield', text: 'Monitoring is active.', level: 'info' }];
    activityIdx = 0;

    function pushEntry() {
      const item = feed[activityIdx % feed.length];
      activityIdx++;
      const row = document.createElement('div');
      row.className = `xc-activity-item xc-sev-${item.level}`;
      row.innerHTML = `${svg(item.icon, 'xc-icon-xs')}<span class="xc-activity-text">${esc(item.text)}</span><span class="xc-activity-time">${new Date().toLocaleTimeString('en-US')}</span>`;
      activityFeedEl.prepend(row);
      while (activityFeedEl.children.length > 10) activityFeedEl.removeChild(activityFeedEl.lastChild);
    }

    pushEntry(); pushEntry(); pushEntry();
    if (activityTimer) clearInterval(activityTimer);
    activityTimer = setInterval(pushEntry, 4500);
  }

  // ── Quick Actions ─────────────────────────────────────────────────────────
  function _quickActions() {
    const actions = DD().QUICK_ACTIONS;
    return `
      <div class="xc-panel">
        <div class="xc-panel-head">${svg('sparkles', 'xc-icon-sm')} Quick Actions</div>
        <div class="xc-quick-grid">
          ${actions.map(a => `
            <button class="xc-quick-btn" data-xc-route="${esc(a.route)}">
              ${svg(a.icon, 'xc-icon-md')}
              <span>${esc(a.label)}</span>
            </button>`).join('')}
        </div>
      </div>`;
  }

  function _wireQuickActions() {
    document.querySelectorAll('[data-xc-route]').forEach(btn => {
      btn.addEventListener('click', () => {
        const route = btn.getAttribute('data-xc-route');
        if (route && window.Router) window.Router.navigate(route);
      });
    });
  }

  // ── Recent Reports ────────────────────────────────────────────────────────
  function _recentReports(s) {
    const reports = [...s._reportsRaw].sort((a, b) => new Date(b.created) - new Date(a.created)).slice(0, 6);
    return `
      <div class="xc-panel">
        <div class="xc-panel-head">${svg('report', 'xc-icon-sm')} Recent Reports</div>
        <div class="xc-list">
          ${reports.length ? reports.map(r => `
            <div class="xc-list-row">
              <div class="xc-list-main">
                <div class="xc-list-title">${esc(_truncate(r.name, 42))}</div>
                <div class="xc-list-sub">${esc(r.category)} · ${esc((r.created || '').slice(0, 10))}</div>
              </div>
              <span class="xc-chip">${esc(r.format)}</span>
            </div>`).join('') : `<div class="xc-empty">No reports generated yet.</div>`}
        </div>
        <button class="xc-panel-footer-btn" data-xc-route="reports">Open Reports ${svg('arrow-right', 'xc-icon-xs')}</button>
      </div>`;
  }

  // ── AI Security Insights ─────────────────────────────────────────────────
  function _aiInsights() {
    const insights = DD().AI_INSIGHTS;
    return `
      <div class="xc-panel">
        <div class="xc-panel-head">${svg('sparkles', 'xc-icon-sm')} AI Security Insights <span class="xc-panel-tag">Demonstration Recommendations</span></div>
        <div class="xc-list">
          ${insights.map(i => `
            <div class="xc-insight-row">
              <span class="xc-sev xc-sev-${i.severity}">${esc(i.severity)}</span>
              <div class="xc-list-main">
                <div class="xc-list-title">${esc(i.title)}</div>
                <div class="xc-list-sub">${esc(i.detail)}</div>
              </div>
            </div>`).join('')}
        </div>
        <button class="xc-panel-footer-btn" data-xc-route="ai-assistant">Ask AI Assistant ${svg('arrow-right', 'xc-icon-xs')}</button>
      </div>`;
  }

  // ── Platform Health ──────────────────────────────────────────────────────
  function _gauge(label, pct, color) {
    return `
      <div class="xc-gauge">
        <div class="xc-gauge-top"><span>${esc(label)}</span><span>${pct}%</span></div>
        <div class="xc-gauge-track"><div class="xc-gauge-fill xc-c-${color}" style="width:${Math.min(100, Math.max(0, pct))}%"></div></div>
      </div>`;
  }

  function _platformHealth() {
    const h = DD().PLATFORM_HEALTH;
    return `
      <section class="xc-section">
        ${_sectionHeader('Platform Health', 'Demonstration values — offline simulation')}
        <div class="xc-health-grid">
          <div class="xc-health-gauges">
            ${_gauge('CPU Usage', h.cpuUsage ?? 34, 'primary')}
            ${_gauge('Memory Usage', h.memoryUsage ?? 58, 'accent')}
            ${_gauge('Storage Usage', h.storageUsage ?? 47, 'warning')}
            ${_gauge('Application Health', h.appHealth ?? 99, 'success')}
          </div>
          <div class="xc-health-facts">
            <div class="xc-health-fact">${svg('database', 'xc-icon-sm')}<span>Database Status</span><strong>${esc(h.databaseStatus || 'Connected')}</strong></div>
            <div class="xc-health-fact">${svg('cloud', 'xc-icon-sm')}<span>Offline Cache</span><strong>${esc(h.offlineCache || 'Synced')}</strong></div>
            <div class="xc-health-fact">${svg('activity', 'xc-icon-sm')}<span>Background Services</span><strong>${esc(h.backgroundServices || 'Running')}</strong></div>
            <div class="xc-health-fact">${svg('clock', 'xc-icon-sm')}<span>System Uptime</span><strong>${esc(h.uptimeDays ?? 41)} days</strong></div>
          </div>
        </div>
      </section>`;
  }

  // ── Charts ────────────────────────────────────────────────────────────────
  function _chartsSection() {
    return `
      <section class="xc-section">
        ${_sectionHeader('Charts', 'Animated, offline — no external chart service used')}
        <div class="xc-chart-grid">
          <div class="xc-chart-card"><div class="xc-chart-title">Security Score &amp; Risk Trend</div><svg id="xc-chart-trend" viewBox="0 0 300 160"></svg></div>
          <div class="xc-chart-card"><div class="xc-chart-title">Incident Trend (Monthly)</div><svg id="xc-chart-incidents" viewBox="0 0 300 200"></svg></div>
          <div class="xc-chart-card"><div class="xc-chart-title">Vulnerability Severity</div><svg id="xc-chart-vuln" viewBox="0 0 300 200"></svg></div>
          <div class="xc-chart-card"><div class="xc-chart-title">Asset Growth (Monthly)</div><svg id="xc-chart-assets" viewBox="0 0 300 160"></svg></div>
          <div class="xc-chart-card"><div class="xc-chart-title">Incident Severity Distribution</div><svg id="xc-chart-severity" viewBox="0 0 260 160"></svg></div>
        </div>
      </section>`;
  }

  const CHART_COLORS = ['#2563eb', '#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9'];

  function _renderLineChart(svgId, points, keyA, keyB, labelA, labelB) {
    const el = document.getElementById(svgId); if (!el) return;
    const maxA = Math.max(1, ...points.map(p => p[keyA]));
    const maxB = keyB ? Math.max(1, ...points.map(p => p[keyB])) : maxA;
    const w = 296, h = 130, padL = 4, padB = 22;
    const stepX = points.length > 1 ? (w - padL) / (points.length - 1) : 0;
    const coordsA = points.map((p, i) => [padL + i * stepX, h - padB - (p[keyA] / maxA) * (h - padB - 8)]);
    const pathA = coordsA.map((c, i) => `${i === 0 ? 'M' : 'L'}${c[0].toFixed(1)},${c[1].toFixed(1)}`).join(' ');
    let pathB = '', coordsB = [];
    if (keyB) {
      coordsB = points.map((p, i) => [padL + i * stepX, h - padB - (p[keyB] / maxB) * (h - padB - 8)]);
      pathB = coordsB.map((c, i) => `${i === 0 ? 'M' : 'L'}${c[0].toFixed(1)},${c[1].toFixed(1)}`).join(' ');
    }
    const labels = coordsA.map((c, i) => i % 2 === 0 ? `<text x="${c[0].toFixed(1)}" y="${h - 4}" font-size="9" fill="var(--text-tertiary)" text-anchor="middle">${esc(points[i].month)}</text>` : '').join('');
    el.innerHTML = `
      <path d="${pathA}" fill="none" stroke="${CHART_COLORS[0]}" stroke-width="2"/>
      ${coordsA.map((c, i) => `<circle cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="2.5" fill="${CHART_COLORS[0]}"><title>${esc(labelA)} ${points[i].month}: ${points[i][keyA]}</title></circle>`).join('')}
      ${keyB ? `<path d="${pathB}" fill="none" stroke="${CHART_COLORS[5]}" stroke-width="2" stroke-dasharray="4 3"/>` : ''}
      ${labels}
      <g transform="translate(2,2)"><rect width="8" height="8" fill="${CHART_COLORS[0]}"/><text x="12" y="8" font-size="9" fill="var(--text-secondary)">${esc(labelA)}</text></g>
      ${keyB ? `<g transform="translate(120,2)"><rect width="8" height="8" fill="${CHART_COLORS[5]}"/><text x="12" y="8" font-size="9" fill="var(--text-secondary)">${esc(labelB)}</text></g>` : ''}
    `;
  }

  function _renderBarChart(svgId, data, horizontal) {
    const el = document.getElementById(svgId); if (!el) return;
    const max = Math.max(1, ...data.map(d => d.value));
    if (horizontal) {
      const barH = 24, gap = 10, chartW = 300, labelW = 90;
      el.innerHTML = data.map((d, idx) => {
        const y = idx * (barH + gap) + 4; const w = ((chartW - labelW - 30) * d.value) / max;
        return `<text x="0" y="${y + barH / 2 + 4}" font-size="10" fill="var(--text-secondary)">${esc(d.label)}</text>
          <rect x="${labelW}" y="${y}" width="${Math.max(2, w)}" height="${barH}" rx="4" fill="${d.color}" opacity="0.9"><title>${esc(d.label)}: ${d.value}</title></rect>
          <text x="${labelW + w + 6}" y="${y + barH / 2 + 4}" font-size="10" fill="var(--text-tertiary)">${d.value}</text>`;
      }).join('');
    } else {
      const w = 296, h = 176, padB = 22, barW = Math.min(34, (w - 10) / data.length - 10);
      const stepX = (w - 10) / data.length;
      el.innerHTML = data.map((d, idx) => {
        const barH = ((h - padB - 10) * d.value) / max;
        const x = 5 + idx * stepX + (stepX - barW) / 2;
        const y = h - padB - barH;
        return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${Math.max(1, barH).toFixed(1)}" rx="4" fill="${d.color}" opacity="0.9"><title>${esc(d.label)}: ${d.value}</title></rect>
          <text x="${(x + barW / 2).toFixed(1)}" y="${h - 6}" font-size="9" fill="var(--text-tertiary)" text-anchor="middle">${esc(d.label)}</text>`;
      }).join('');
    }
  }

  function _renderPieChart(svgId, data) {
    const el = document.getElementById(svgId); if (!el) return;
    const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
    const cx = 65, cy = 75, r = 58; let angle = -Math.PI / 2; let paths = '';
    data.forEach(d => {
      const frac = d.value / total; const nextAngle = angle + frac * 2 * Math.PI;
      const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
      const x2 = cx + r * Math.cos(nextAngle), y2 = cy + r * Math.sin(nextAngle);
      const largeArc = frac > 0.5 ? 1 : 0;
      paths += `<path d="M${cx},${cy} L${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${largeArc} 1 ${x2.toFixed(2)},${y2.toFixed(2)} Z" fill="${d.color}" opacity="0.9"><title>${esc(d.label)}: ${d.value}</title></path>`;
      angle = nextAngle;
    });
    const legend = data.map((d, idx) => `<g transform="translate(140, ${14 + idx * 20})"><rect width="10" height="10" rx="2" fill="${d.color}"/><text x="16" y="9" font-size="10" fill="var(--text-secondary)">${esc(d.label)} (${d.value})</text></g>`).join('');
    el.innerHTML = `<g>${paths}</g>${legend}`;
  }

  function _renderCharts(s) {
    const trend = window.SampleReportsData?.TREND || [];
    if (trend.length) {
      _renderLineChart('xc-chart-trend', trend, 'securityScore', 'riskIndex', 'Security Score', 'Risk Index');
      _renderBarChart('xc-chart-incidents', trend.map(t => ({ label: t.month, value: t.incidents, color: CHART_COLORS[1] })), false);
      // Deterministic synthetic asset-growth series ending at the current total
      const total = s.protectedAssets || 40;
      const growth = trend.map((t, i) => ({ month: t.month, value: Math.round(total * (0.55 + (i / (trend.length - 1 || 1)) * 0.45)) }));
      growth[growth.length - 1].value = total;
      _renderLineChart('xc-chart-assets', growth, 'value', null, 'Assets', '');
    }

    _renderBarChart('xc-chart-vuln', [
      { label: 'Critical', value: s.vCritical, color: 'var(--severity-critical)' },
      { label: 'High', value: s.vHigh, color: 'var(--severity-high)' },
      { label: 'Medium', value: s.vMedium, color: 'var(--severity-medium)' },
      { label: 'Low', value: s.vLow, color: 'var(--severity-low)' },
    ], false);

    _renderPieChart('xc-chart-severity', [
      { label: 'Critical', value: s.incCritical, color: 'var(--severity-critical)' },
      { label: 'High', value: s.incHigh, color: 'var(--severity-high)' },
      { label: 'Medium', value: s.incMedium, color: 'var(--severity-medium)' },
      { label: 'Low', value: s.incLow, color: 'var(--severity-low)' },
    ]);
  }

  // ── Animated counters ────────────────────────────────────────────────────
  function _animateCounters() {
    document.querySelectorAll('[data-xc-count]').forEach(el => {
      const target = Number(el.getAttribute('data-xc-count')) || 0;
      const duration = 900;
      const start = performance.now();
      function step(now) {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = _fmtNum(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = _fmtNum(target);
      }
      requestAnimationFrame(step);
    });
  }

  // ── Public API ─────────────────────────────────────────────────────────
  return { register };

})();

window.Dashboard = Dashboard;

if (window.Router) {
  Dashboard.register();
} else {
  console.error('[Dashboard] Router not found. Ensure router.js loads before dashboard.js.');
}
