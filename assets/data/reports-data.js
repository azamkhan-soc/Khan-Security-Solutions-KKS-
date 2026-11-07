/**
 * KHAN SECURITY SOLUTIONS ENTERPRISE
 * Enterprise Reporting Center — Sample Dataset v1.6.0
 *
 * [EDUCATIONAL SIMULATION — 100% synthetic, offline data]
 * All reports, KPIs, and trend figures below are fictional and generated
 * deterministically for demonstration purposes only. There is no backend;
 * everything is rendered client-side and persisted via StorageManager.
 *
 * Consumed by: assets/js/modules/reports.js
 */

const SampleReportsData = (() => {

  // ── Deterministic PRNG (mulberry32) — same approach used across modules ──
  function _mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rand = _mulberry32(160816);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const randInt = (min, max) => Math.floor(rand() * (max - min + 1)) + min;

  // ── Report Categories ─────────────────────────────────────────────────
  const CATEGORIES = [
    { id: 'executive',     label: 'Executive Reports',        icon: 'briefcase', color: '#2563eb' },
    { id: 'soc',           label: 'SOC Reports',               icon: 'shield',    color: '#7c3aed' },
    { id: 'siem',          label: 'SIEM Reports',               icon: 'server',    color: '#06b6d4' },
    { id: 'threat-intel',  label: 'Threat Intelligence Reports',icon: 'globe',     color: '#f59e0b' },
    { id: 'asset',         label: 'Asset Reports',              icon: 'server',    color: '#10b981' },
    { id: 'incident',      label: 'Incident Reports',           icon: 'alert',     color: '#ef4444' },
    { id: 'ioc',           label: 'IOC Reports',                icon: 'hash',      color: '#8b5cf6' },
    { id: 'case',          label: 'Case Reports',               icon: 'folder',    color: '#0ea5e9' },
    { id: 'phishing',      label: 'Phishing Reports',           icon: 'mail',      color: '#f97316' },
    { id: 'malware',       label: 'Malware Reports',            icon: 'bug',       color: '#dc2626' },
    { id: 'dfir',          label: 'DFIR Reports',                icon: 'search',    color: '#6366f1' },
    { id: 'password',      label: 'Password Security Reports',  icon: 'key',       color: '#14b8a6' },
    { id: 'compliance',    label: 'Compliance Reports',         icon: 'check',     color: '#22c55e' },
    { id: 'risk',          label: 'Risk Reports',               icon: 'warn',      color: '#eab308' },
    { id: 'custom',        label: 'Custom Reports',             icon: 'settings',  color: '#94a3b8' },
  ];

  const ANALYSTS = ['A. Khan', 'S. Rahman', 'M. Ortiz', 'D. Kim', 'T. Alvarez', 'N. Ibrahim', 'R. Chen', 'L. Novak'];
  const STATUSES = ['Completed', 'Completed', 'Completed', 'Completed', 'Generating', 'Scheduled', 'Failed'];
  const FORMATS  = ['PDF', 'CSV', 'JSON', 'HTML'];

  const NAME_TEMPLATES = {
    executive:    ['Monthly Executive Security Summary', 'Quarterly Board Security Briefing', 'Executive Risk Overview', 'CISO Monthly Snapshot', 'Annual Security Posture Review'],
    soc:          ['Weekly SOC Operations Report', 'SOC Shift Handover Summary', 'SOC Alert Triage Report', 'Analyst Performance Report', 'SOC Coverage & Staffing Report'],
    siem:         ['SIEM Log Ingestion Report', 'SIEM Correlation Rule Effectiveness', 'SIEM Alert Volume Trend Report', 'Log Source Health Report', 'SIEM Detection Coverage Report'],
    'threat-intel':['Weekly Threat Intelligence Digest', 'APT Activity Tracking Report', 'Threat Actor Profile Summary', 'IOC Feed Ingestion Report', 'Emerging Threats Briefing'],
    asset:        ['Asset Inventory Summary', 'Critical Asset Exposure Report', 'Unpatched Asset Report', 'Asset Lifecycle Report', 'Shadow IT Discovery Report'],
    incident:     ['Monthly Incident Summary', 'Incident Response Timeline Report', 'Post-Incident Review', 'Incident Category Breakdown', 'MTTR/MTTD Trend Report'],
    ioc:          ['IOC Match Summary Report', 'IOC Feed Coverage Report', 'Indicator Lifecycle Report', 'IOC False-Positive Rate Report'],
    case:         ['Case Load Summary Report', 'Case Resolution Time Report', 'Analyst Caseload Report', 'Case Category Trend Report'],
    phishing:     ['Phishing Campaign Summary', 'Simulated Phishing Results', 'Email Threat Report', 'Phishing Click-Rate Report'],
    malware:      ['Malware Detection Summary', 'Malware Family Trend Report', 'Endpoint Malware Report', 'Sample Analysis Digest'],
    dfir:         ['DFIR Case Summary', 'Forensic Timeline Report', 'Evidence Chain-of-Custody Report', 'Root Cause Analysis Report'],
    password:     ['Password Policy Compliance Report', 'Credential Strength Audit', 'MFA Adoption Report', 'Breach Exposure Summary'],
    compliance:   ['NIST 800-53 Compliance Report', 'PCI-DSS Compliance Snapshot', 'ISO 27001 Gap Report', 'SOC 2 Readiness Report', 'GDPR Data Handling Report'],
    risk:         ['Enterprise Risk Register Report', 'Risk Heat Map Summary', 'Third-Party Risk Report', 'Vulnerability Risk Report'],
    custom:       ['Ad-Hoc Security Query Report', 'Custom Department Report', 'Custom Data Export', 'Custom KPI Dashboard Export'],
  };

  const AUTHORS_BY_CAT = ANALYSTS;

  // ── Generate 100 sample reports ──────────────────────────────────────
  function _generateReports() {
    const reports = [];
    const now = new Date('2026-07-25T00:00:00Z');
    for (let i = 1; i <= 100; i++) {
      const cat = CATEGORIES[i % CATEGORIES.length];
      const nameOptions = NAME_TEMPLATES[cat.id] || ['Security Report'];
      const baseName = pick(nameOptions);
      const daysAgo = randInt(0, 180);
      const created = new Date(now.getTime() - daysAgo * 86400000);
      const status = pick(STATUSES);
      reports.push({
        id: `RPT-${String(1000 + i)}`,
        name: `${baseName} — ${created.toLocaleString('en-US', { month: 'short', year: 'numeric' })}`,
        categoryId: cat.id,
        category: cat.label,
        type: pick(['Executive Summary', 'Technical Report']),
        created: created.toISOString(),
        author: pick(AUTHORS_BY_CAT),
        status,
        format: pick(FORMATS),
        sizeKb: randInt(48, 2400),
        rangeDays: pick([7, 30, 90, 180]),
        synthetic: true,
      });
    }
    return reports.sort((a, b) => new Date(b.created) - new Date(a.created));
  }

  // ── KPI baseline (Executive Dashboard) ───────────────────────────────
  const KPI = {
    securityScore:      78,
    totalAssets:         642,
    openIncidents:        14,
    criticalAssets:       37,
    threatIntelIOCs:    1284,
    activeCases:          22,
    analysts:              8,
    mttdMinutes:          46,
    mttrMinutes:         312,
    riskIndex:            32, // lower is better, 0-100
  };

  // ── Monthly trend (last 12 months) — incidents / risk index / score ──
  function _generateTrend() {
    const months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
    let score = 64, risk = 48, incidents = 26;
    return months.map((m) => {
      score = Math.max(50, Math.min(95, score + randInt(-3, 4)));
      risk = Math.max(10, Math.min(60, risk + randInt(-4, 3)));
      incidents = Math.max(4, Math.min(40, incidents + randInt(-5, 4)));
      return { month: m, securityScore: score, riskIndex: risk, incidents };
    });
  }

  // ── MITRE tactic coverage (for coverage chart) ───────────────────────
  const MITRE_COVERAGE = [
    { tactic: 'Initial Access',        coverage: 82 },
    { tactic: 'Execution',             coverage: 74 },
    { tactic: 'Persistence',           coverage: 61 },
    { tactic: 'Privilege Escalation',  coverage: 58 },
    { tactic: 'Defense Evasion',       coverage: 49 },
    { tactic: 'Credential Access',     coverage: 71 },
    { tactic: 'Discovery',             coverage: 66 },
    { tactic: 'Lateral Movement',      coverage: 54 },
    { tactic: 'Collection',            coverage: 47 },
    { tactic: 'Exfiltration',          coverage: 39 },
    { tactic: 'Impact',                coverage: 68 },
  ];

  const REPORTS  = _generateReports();
  const TREND    = _generateTrend();

  return {
    CATEGORIES,
    ANALYSTS,
    STATUSES,
    FORMATS,
    REPORTS,
    KPI,
    TREND,
    MITRE_COVERAGE,
  };
})();

window.SampleReportsData = SampleReportsData;
