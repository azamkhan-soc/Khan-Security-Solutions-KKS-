/**
 * KHAN SECURITY SOLUTIONS ENTERPRISE
 * Executive Command Center — Dashboard Sample Dataset v1.0.0
 *
 * [EDUCATIONAL SIMULATION — 100% synthetic, offline data]
 * Two kinds of content live here:
 *   1. Demo-only content with no other source-of-truth module: the
 *      Live Security Activity feed templates, AI Insight recommendation
 *      cards, and Platform Health gauge values.
 *   2. computeLive() — aggregates REAL live counts from every other
 *      module's existing sample dataset (Asset Inventory, Incident
 *      Response, Vulnerability Manager, Threat Intelligence, IOC Manager,
 *      Case Manager, Reports) so the Dashboard is never a second,
 *      disconnected copy of the data.
 *
 * Consumed by: assets/js/modules/dashboard.js
 */

const SampleDashboardData = (() => {

  // ── Deterministic PRNG (mulberry32 — same approach used across the app) ──
  function _mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rand = _mulberry32(20260729);
  const randInt = (min, max) => Math.floor(rand() * (max - min + 1)) + min;

  function _fmtDuration(mins) {
    if (!isFinite(mins) || mins <= 0) return '—';
    const h = Math.floor(mins / 60), m = Math.round(mins % 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }
  function _timeAgo(ts) {
    const diffMin = Math.max(0, Math.round((Date.now() - ts) / 60000));
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const h = Math.floor(diffMin / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }
  function _isToday(dateLike) {
    const d = new Date(dateLike), n = new Date();
    return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
  }

  // ── Live Security Activity feed templates (cycled with fresh timestamps) ──
  const ACTIVITY_FEED = [
    { icon: 'shield',  text: () => `Firewall blocked inbound connection from 203.0.113.${randInt(10, 250)}`, level: 'info' },
    { icon: 'bug',     text: () => `Malware detected on endpoint WS-${randInt(1, 40)} — quarantined automatically`, level: 'critical' },
    { icon: 'target',  text: () => 'New IOC imported from Threat Intel Feed — indicator added', level: 'medium' },
    { icon: 'server',  text: () => `Asset discovered on network — added to inventory`, level: 'info' },
    { icon: 'globe',   text: () => `Threat Intelligence feed updated — new indicators correlated`, level: 'info' },
    { icon: 'user',    text: () => `Incident INC-2026-${1000 + randInt(1, 50)} assigned to analyst`, level: 'medium' },
    { icon: 'mail',    text: () => 'Phishing email quarantined from corporate mailbox', level: 'high' },
    { icon: 'key',     text: () => 'Password audit completed — weak credentials flagged', level: 'medium' },
    { icon: 'report',  text: () => 'Report generated and archived', level: 'info' },
    { icon: 'search',  text: () => 'DFIR investigation started on affected host', level: 'high' },
    { icon: 'lock',    text: () => 'MFA challenge blocked a suspicious login attempt', level: 'medium' },
    { icon: 'cloud',   text: () => 'Cloud posture scan completed', level: 'medium' },
  ];

  // ── AI Security Insights — demonstration recommendations only ───────────
  const AI_INSIGHTS = [
    { title: 'Enable MFA on all privileged accounts', detail: 'Several administrator accounts do not yet enforce multi-factor authentication.', severity: 'high' },
    { title: 'Patch vulnerable internet-facing systems', detail: 'Critical CVEs remain unpatched on assets exposed to the internet.', severity: 'critical' },
    { title: 'Review administrator account membership', detail: 'Local admin group membership has grown across several workstations.', severity: 'medium' },
    { title: 'Investigate suspicious PowerShell activity', detail: 'Encoded command execution observed on a small number of endpoints.', severity: 'high' },
    { title: 'Rotate privileged service account passwords', detail: 'Several service accounts have not rotated credentials in over 90 days.', severity: 'medium' },
    { title: 'Review externally exposed assets', detail: 'A handful of assets are reachable from outside the corporate network.', severity: 'medium' },
  ];

  // ── Platform Health — demo gauge values (offline simulation) ─────────────
  const PLATFORM_HEALTH = {
    cpuUsage: 18 + randInt(0, 16),
    memoryUsage: 40 + randInt(0, 20),
    storageUsage: 30 + randInt(0, 12),
    appHealth: 99,
    offlineCache: 'Synced',
    backgroundServices: 'Running (6/6)',
    uptimeDays: 41,
    databaseStatus: 'Connected (Local)',
  };

  // ── Quick Actions — open existing modules only ───────────────────────────
  const QUICK_ACTIONS = [
    { label: 'Log Analyzer',           route: 'siem',               icon: 'terminal',  color: '#2563eb' },
    { label: 'Threat Intelligence',    route: 'threat-intel',       icon: 'globe',     color: '#f59e0b' },
    { label: 'Malware Analysis',       route: 'malware',            icon: 'bug',       color: '#dc2626' },
    { label: 'DFIR Toolkit',           route: 'dfir',               icon: 'search',    color: '#6366f1' },
    { label: 'Vulnerability Manager',  route: 'vuln-manager',       icon: 'shield-alert', color: '#f97316' },
    { label: 'Asset Inventory',        route: 'asset-inventory',    icon: 'server',    color: '#10b981' },
    { label: 'Incident Response',      route: 'incident-response',  icon: 'alert',     color: '#ef4444' },
    { label: 'IOC Manager',            route: 'ioc-manager',        icon: 'target',    color: '#8b5cf6' },
    { label: 'Case Manager',           route: 'case-manager',       icon: 'folder',    color: '#0ea5e9' },
    { label: 'Reports',                route: 'reports',            icon: 'report',    color: '#22c55e' },
    { label: 'AI Security Assistant',  route: 'ai-assistant',       icon: 'sparkles',  color: '#a855f7' },
    { label: 'Settings',               route: 'settings',           icon: 'settings',  color: '#64748b' },
  ];

  // ── Safe accessors — dashboard must never throw if a module hasn't loaded ──
  const INC   = () => (window.SampleIncidentData || { incidents: [] }).incidents;
  const VULN  = () => window.SampleVulnData || { assets: [], cves: [], patches: [] };
  const TI    = () => window.SampleThreatIntel || { actors: [], campaigns: [], mitreTechniques: [] };
  const IOC   = () => (window.SampleIOCData || { iocs: [] }).iocs;
  const CASES = () => (window.SampleCaseData || { cases: [] }).cases;
  const ASSET = () => (window.SampleAssetData || { assets: [] }).assets;
  const RPT   = () => window.SampleReportsData || { REPORTS: [], KPI: {}, TREND: [], MITRE_COVERAGE: [] };

  // ── Live aggregation — pulls real counts from every other module ────────
  function computeLive() {
    const incidents = INC();
    const vuln = VULN();
    const ti = TI();
    const iocs = IOC();
    const cases = CASES();
    const assets = ASSET();
    const rpt = RPT();
    const KPI = rpt.KPI || {};

    const sevCount = s => incidents.filter(i => i.severity === s).length;
    const openStatuses = ['New', 'Investigating', 'Triaged', 'Contained', 'Eradicated', 'Recovering'];
    const closedStatuses = ['Resolved', 'Closed'];
    const openIncidents = incidents.filter(i => openStatuses.includes(i.status));
    const closedIncidents = incidents.filter(i => closedStatuses.includes(i.status));
    const resolvedToday = incidents.filter(i => closedStatuses.includes(i.status) && i.updatedTime && _isToday(i.updatedTime)).length;
    const avgResponseMin = incidents.length ? incidents.reduce((s, i) => s + (i.responseMinutes || 0), 0) / incidents.length : 0;
    const avgResolutionMin = closedIncidents.length
      ? closedIncidents.reduce((s, i) => s + Math.max(0, (new Date(i.updatedTime) - new Date(i.createdTime)) / 60000), 0) / closedIncidents.length
      : 0;

    const cveSev = s => vuln.cves.filter(c => c.severity === s).length;
    const patchedCves = vuln.cves.filter(c => c.patched).length;
    const patchCompliance = vuln.cves.length ? Math.round((patchedCves / vuln.cves.length) * 100) : 0;
    const remediationDone = (vuln.patches || []).filter(p => ['Patched', 'Verified'].includes(p.status)).length;
    const remediationProgress = (vuln.patches || []).length ? Math.round((remediationDone / vuln.patches.length) * 100) : 0;

    const byCat = c => assets.filter(a => a.category === c).length;
    const servers = byCat('Servers');
    const workstations = byCat('Workstations');
    const cloudAssets = byCat('Cloud Resources');
    const networkDevices = byCat('Network Devices');
    const mobileDevices = assets.filter(a => a.assetType === 'Mobile').length;
    const linuxAssets = assets.filter(a => /linux|ubuntu/i.test(a.os || '')).length;
    const windowsAssets = assets.filter(a => /windows/i.test(a.os || '')).length;
    const endpointsOnline = assets.filter(a => a.status !== 'Offline').length;
    const usersProtected = new Set(assets.map(a => a.assignedUser).filter(Boolean)).size;
    const lastScan = assets.length ? assets.reduce((max, a) => new Date(a.lastSeen) > new Date(max) ? a.lastSeen : max, assets[0].lastSeen) : null;
    const criticalAssetRisk = assets.filter(a => a.risk === 'critical').length;

    const malwareFamilies = new Set(iocs.map(i => i.threatContext && i.threatContext.malwareFamily).filter(Boolean)).size;
    const activeCases = cases.filter(c => !['Resolved', 'Closed', 'Archived'].includes(c.status)).length;

    const securityScore = KPI.securityScore ?? 78;
    const riskScore = KPI.riskIndex ?? 32;

    return {
      exec: {
        securityScore, riskScore,
        protectedAssets: assets.length,
        openIncidents: openIncidents.length,
        criticalAlerts: sevCount('critical'),
        threatFeeds: ti.actors.length + ti.campaigns.length,
        iocCount: iocs.length,
        activeCases,
        reportsGenerated: rpt.REPORTS.length,
        systemHealth: 98,
      },
      security: { protected: assets.length, endpointsOnline, servers, cloudAssets, usersProtected, identitySources: 3, networkDevices, lastScan },
      incidents: {
        critical: sevCount('critical'), high: sevCount('high'), medium: sevCount('medium'), low: sevCount('low'),
        resolvedToday, avgResponse: _fmtDuration(avgResponseMin), avgResolution: _fmtDuration(avgResolutionMin),
        recent: [...incidents].sort((a, b) => new Date(b.createdTime) - new Date(a.createdTime)).slice(0, 8),
      },
      threatIntel: {
        latestFeedUpdate: _timeAgo(Date.now() - randInt(4, 90) * 60000),
        malwareFamilies, actors: ti.actors.length, mitreTechniques: ti.mitreTechniques.length,
        detectionRules: 214, yaraRules: 86, sigmaRules: 128, iocCount: iocs.length,
      },
      vuln: {
        critical: cveSev('critical'), high: cveSev('high'), medium: cveSev('medium'), low: cveSev('low'),
        latestScan: _timeAgo(Date.now() - randInt(2, 20) * 3600000), patchCompliance, remediationProgress,
      },
      assets: {
        servers, workstations, laptops: assets.filter(a => a.assetType === 'Laptop').length,
        linux: linuxAssets, windows: windowsAssets, cloud: cloudAssets,
        network: networkDevices, mobile: mobileDevices, criticalRisk: criticalAssetRisk,
      },
      reports: (rpt.REPORTS || []).filter(r => r.status === 'Completed').slice(0, 6),
      trend: rpt.TREND || [],
      mitreCoverage: rpt.MITRE_COVERAGE || [],
    };
  }

  function nextActivity() {
    const tpl = ACTIVITY_FEED[randInt(0, ACTIVITY_FEED.length - 1)];
    return { icon: tpl.icon, level: tpl.level, text: tpl.text(), time: 'just now' };
  }

  return { ACTIVITY_FEED, AI_INSIGHTS, PLATFORM_HEALTH, QUICK_ACTIONS, computeLive, nextActivity, timeAgo: _timeAgo };

})();

window.SampleDashboardData = SampleDashboardData;
