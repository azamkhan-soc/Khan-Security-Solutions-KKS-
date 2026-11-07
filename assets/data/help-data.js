/**
 * KHAN SECURITY SOLUTIONS ENTERPRISE
 * Enterprise Help Center — Sample Dataset v1.7.0
 *
 * [EDUCATIONAL SIMULATION — 100% offline, static documentation content]
 * All articles, FAQs, tutorials and video placeholders below are authored
 * for demonstration purposes to describe THIS portfolio project. No real
 * video playback, AI assistant, or client portal exists yet.
 *
 * Consumed by: assets/js/modules/help.js
 */

const SampleHelpData = (() => {

  // ── Sections (also used as documentation categories) ────────────────
  const SECTIONS = [
    { id: 'getting-started',  label: 'Getting Started',        icon: 'flag',      color: '#2563eb', comingSoon: false, summary: 'Everything you need to start using Khan Security Solutions Enterprise.' },
    { id: 'platform',         label: 'Platform Overview',      icon: 'globe',     color: '#7c3aed', comingSoon: false, summary: 'How the platform is structured and how modules work together.' },
    { id: 'navigation',       label: 'Navigation Guide',       icon: 'compass',   color: '#06b6d4', comingSoon: false, summary: 'Sidebar, top bar, breadcrumbs, and global search explained.' },
    { id: 'soc',              label: 'SOC Dashboard',          icon: 'shield',    color: '#10b981', comingSoon: false, summary: 'Reading the SOC overview, alerts, and live status widgets.' },
    { id: 'siem',             label: 'SIEM',                    icon: 'server',    color: '#f59e0b', comingSoon: false, summary: 'Log ingestion, correlation rules, and the log analyzer workspace.' },
    { id: 'malware',          label: 'Malware Lab',            icon: 'bug',       color: '#dc2626', comingSoon: false, summary: 'Browsing samples, YARA rules, and static analysis views.' },
    { id: 'threat-intel',     label: 'Threat Intelligence',    icon: 'target',    color: '#ef4444', comingSoon: false, summary: 'Threat actor profiles, campaigns, and IOC feed context.' },
    { id: 'network-tools',    label: 'Network Tools',          icon: 'network',   color: '#0ea5e9', comingSoon: false, summary: 'DNS, WHOIS, packet capture viewer, and OSI/TCP-IP references.' },
    { id: 'dfir',             label: 'DFIR',                    icon: 'search',    color: '#6366f1', comingSoon: false, summary: 'Digital forensics case workflow, timelines, and evidence handling.' },
    { id: 'asset',            label: 'Asset Inventory',        icon: 'server',    color: '#22c55e', comingSoon: false, summary: 'Tracking hosts, criticality, patch status, and ownership.' },
    { id: 'incident',         label: 'Incident Response',      icon: 'alert',     color: '#f97316', comingSoon: false, summary: 'Incident lifecycle, tasks, MITRE mapping, and evidence.' },
    { id: 'ioc',              label: 'IOC Manager',             icon: 'hash',      color: '#8b5cf6', comingSoon: false, summary: 'Managing indicators of compromise and their lifecycle.' },
    { id: 'case',             label: 'Case Manager',           icon: 'folder',    color: '#0891b2', comingSoon: false, summary: 'Case creation, Kanban tasks, evidence, and cross-linking.' },
    { id: 'password',         label: 'Password Toolkit',       icon: 'key',       color: '#14b8a6', comingSoon: false, summary: 'Generators, policy checks, hashing tools, and the vault demo.' },
    { id: 'reporting',        label: 'Reporting Center',       icon: 'report',    color: '#2563eb', comingSoon: false, summary: 'Building, previewing, and exporting reports.' },
    { id: 'settings',         label: 'Settings',                icon: 'settings',  color: '#94a3b8', comingSoon: false, summary: 'Theme, profile, and data management preferences.' },
    { id: 'ai-assistant',     label: 'AI Assistant',           icon: 'sparkle',   color: '#a78bfa', comingSoon: true,  summary: 'A conversational assistant across every module — in development.' },
    { id: 'client-portal',    label: 'Client Portal',          icon: 'briefcase', color: '#64748b', comingSoon: true,  summary: 'External stakeholder access to shared reports — in development.' },
  ];

  // ── Documentation articles (professional layout: reading time,
  //    difficulty, category, related articles, code examples, best
  //    practices) — 1–2 per section ─────────────────────────────────────
  function art(id, sectionId, title, minutes, difficulty, body, code, practices, related) {
    return { id, sectionId, title, minutes, difficulty, body, code: code || null, practices: practices || [], related: related || [] };
  }

  const ARTICLES = [
    art('gs-1', 'getting-started', 'Welcome to Khan Security Solutions Enterprise', 4, 'Beginner',
      'This platform is a fully client-side cybersecurity operations portfolio. There is no backend server — every module (SOC, SIEM, Malware Lab, Threat Intelligence, DFIR, Asset Inventory, Incident Response, IOC Manager, Case Manager, Password Toolkit, and the Reporting Center) runs entirely in your browser, with sample data bundled locally and any records you create persisted via StorageManager (localStorage / IndexedDB). Nothing you do here leaves your machine.',
      null, ['Bookmark this article for a quick refresher.', 'Use the sidebar to jump between modules at any time.'], ['gs-2', 'nav-1']),
    art('gs-2', 'getting-started', 'Your First 5 Minutes', 5, 'Beginner',
      'Start on the Dashboard for a high-level SOC snapshot, then open Case Manager or Incident Response to see how records are structured. Every module ships with realistic, deterministically generated demo data so the platform feels populated from the first click. Try the global search (top bar) to jump straight to a record by name.',
      null, ['Use Quick Start (this Help Center) for a guided walkthrough.', 'Check the Keyboard Shortcuts page to move faster.'], ['gs-1', 'nav-1']),
    art('platform-1', 'platform', 'How the Platform Is Structured', 6, 'Intermediate',
      'Khan Security Solutions Enterprise is a single-page application built on four core systems: Router (hash-based navigation between modules), StorageManager (localStorage/IndexedDB persistence), NotificationManager (toasts and the notification panel), and SearchEngine (global full-text search across every module). Each feature module registers itself with these core systems on load.',
      'Router.register(\'my-module\', { title: \'My Module\', init, render });', ['Modules should never touch storage directly outside StorageManager.', 'Register searchable content in init(), not render(), to avoid duplicate entries.'], ['platform-2']),
    art('platform-2', 'platform', 'Data & Privacy Model', 4, 'Beginner',
      'All records — cases, incidents, IOCs, generated reports, vault entries, and more — are stored locally in your browser via localStorage or IndexedDB. Clearing your browser storage removes them permanently. Nothing is transmitted to a server; there is no backend API in this build.',
      null, ['Use Settings → Export Backup before clearing browser data.', 'Treat all bundled data as fictional — it is generated for demonstration only.'], ['platform-1']),
    art('nav-1', 'navigation', 'Sidebar, Top Bar & Breadcrumbs', 3, 'Beginner',
      'The left sidebar lists every module grouped by function. The top bar hosts global search, notifications, and your profile menu. Breadcrumbs above the page content always show your current location and update as you navigate.',
      null, ['Collapse the sidebar for more working space on smaller screens.'], ['nav-2']),
    art('nav-2', 'navigation', 'Using Global Search', 3, 'Beginner',
      'Global search indexes records across every module — cases, incidents, IOCs, assets, reports, and documentation. Press the search shortcut or click the search icon in the top bar, then type at least one character to see grouped, categorized results.',
      null, ['Search is local and instant — no network round-trip.', 'Use specific terms (an ID, hostname, or CVE) for the fastest match.'], ['nav-1']),
    art('soc-1', 'soc', 'Reading the SOC Dashboard', 5, 'Beginner',
      'The SOC Dashboard (in progress) surfaces the most important numbers at a glance: open alerts, active incidents, asset health, and current threat level. Widgets refresh automatically as underlying module data changes.',
      null, ['Check the dashboard first thing in a shift for situational awareness.'], []),
    art('siem-1', 'siem', 'Working with the Log Analyzer', 6, 'Intermediate',
      'The SIEM / Log Analyzer module ingests bundled sample logs across Windows, Linux, Apache, Nginx, and firewall sources. Use filters to narrow by source, severity, or time window, and drill into a single event for full field-level detail.',
      null, ['Start broad, then filter by source before drilling into individual events.', 'Cross-reference suspicious events with IOC Manager.'], ['soc-1']),
    art('malware-1', 'malware', 'Browsing the Malware Lab', 5, 'Intermediate',
      'The Malware Lab presents a bundled library of sample malware records with static-analysis-style metadata (hashes, families, YARA rule matches). This is a reference/demonstration library — no real executables are stored or run.',
      null, ['Cross-reference a sample\'s hash in IOC Manager to see related indicators.'], ['threat-intel-1']),
    art('threat-intel-1', 'threat-intel', 'Threat Actor & Campaign Profiles', 6, 'Intermediate',
      'Threat Intelligence tracks threat actor profiles and campaigns, each mapped to MITRE ATT&CK techniques. Use this module to understand the "who" and "why" behind indicators you see elsewhere in the platform.',
      null, ['Pair actor profiles with IOC Manager for a fuller investigative picture.'], ['ioc-1']),
    art('network-1', 'network-tools', 'DNS, WHOIS & Packet Capture Viewer', 5, 'Intermediate',
      'Network Tools bundles reference utilities: a sample DNS zone, WHOIS records, a simplified packet capture viewer, and OSI/TCP-IP layer references — useful for training and quick lookups during an investigation.',
      null, [], []),
    art('dfir-1', 'dfir', 'DFIR Case Workflow', 7, 'Advanced',
      'DFIR cases move through intake, evidence collection, timeline reconstruction, and reporting. Evidence types like Memory Dump, Disk Image, and PCAP are clearly labeled placeholders in this offline build — they represent where real forensic artifacts would attach in a production system.',
      null, ['Always build the timeline before drawing conclusions.', 'Document chain-of-custody notes as you go, not after.'], ['incident-1']),
    art('asset-1', 'asset', 'Managing the Asset Inventory', 5, 'Beginner',
      'Asset Inventory tracks hosts with criticality, patch status, owner, and department. Use filters to quickly find critical or non-compliant assets, and open a record to see its full network, software, and timeline detail.',
      null, ['Prioritize patch reviews on Critical-criticality assets first.'], ['reporting-1']),
    art('incident-1', 'incident', 'Incident Response Lifecycle', 6, 'Intermediate',
      'Incidents flow through New → Assigned → Investigating → Containment → Eradication → Recovery → Resolved. Each incident tracks tasks, MITRE techniques, evidence, and a full timeline of analyst actions.',
      null, ['Keep the timeline updated in real time, not retroactively.'], ['case-1', 'dfir-1']),
    art('ioc-1', 'ioc', 'IOC Lifecycle & Confidence Levels', 5, 'Intermediate',
      'Every indicator in IOC Manager carries a type, threat level, confidence level, source, and status. Indicators can be linked back to the incidents or assets that surfaced them for full traceability.',
      null, ['Lower confidence indicators should be corroborated before action.'], ['threat-intel-1']),
    art('case-1', 'case', 'Case Manager: Tasks, Evidence & Cross-Links', 6, 'Intermediate',
      'Cases organize investigative work into a Kanban task board, an evidence list, and cross-links to related incidents, assets, and IOCs. Use the detail drawer tabs to move between Overview, Timeline, Tasks, Evidence, and more.',
      null, ['Close checklist items on a task before marking it done.'], ['incident-1']),
    art('password-1', 'password', 'Password Toolkit Overview', 4, 'Beginner',
      'The Password Toolkit bundles a generator, passphrase generator, strength analyzer, policy checker (NIST 800-63B, Corporate, PCI-DSS, Strict templates), hash tools (MD5/SHA-1/SHA-256/SHA-512), an offline breach-checker demo, and a labeled vault demo.',
      null, ['The Vault and Breach Checker are demonstrations only — no real encryption or breach database is involved.'], []),
    art('reporting-1', 'reporting', 'Building a Report', 6, 'Intermediate',
      'The Reporting Center\'s 5-step wizard walks you through choosing a report type, date range, data sources, previewing the result, and exporting. Reports save to Report History and can be exported as PDF (placeholder), CSV, JSON, or HTML.',
      null, ['Select only the data sources you need for a focused report.', 'Use the Executive Summary style for leadership, Technical Report for peers.'], ['asset-1']),
    art('settings-1', 'settings', 'Settings & Data Management', 3, 'Beginner',
      'Settings lets you switch themes, update your local profile, and manage stored data, including exporting a full backup of everything StorageManager has saved.',
      null, ['Export a backup before clearing your browser\'s site data.'], ['platform-2']),
  ];

  // ── Deterministic PRNG (mulberry32) for padding FAQ content ─────────
  function _mulberry32(seed) {
    return function () { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const rand = _mulberry32(170826);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];

  // ── Curated FAQs explicitly required ─────────────────────────────────
  const CURATED_FAQS = [
    { q: 'How do I import logs?', a: 'Open SIEM / Log Analyzer, then use the Import button to load a supported log file. Bundled sample logs (Windows, Linux, Apache, Nginx, Firewall) are already available for exploration without importing anything.', cat: 'siem' },
    { q: 'How do I create incidents?', a: 'Go to Incident Response and click "New Incident." Fill in the category, severity, and affected host, then save — the incident is added to the list and persisted locally via StorageManager.', cat: 'incident' },
    { q: 'How does IOC Manager work?', a: 'IOC Manager stores indicators of compromise (hashes, IPs, domains, etc.) with type, threat level, confidence, and source. You can filter, search, and cross-link indicators to related incidents or assets.', cat: 'ioc' },
    { q: 'How does Asset Inventory work?', a: 'Asset Inventory lists tracked hosts with details like criticality, patch status, owner, and network info. Use the filters and search bar to quickly locate specific assets, and click a row to open the full detail view.', cat: 'asset' },
    { q: 'How do I export reports?', a: 'In the Reporting Center, use the Report Builder wizard to generate a new report, or click the download icon next to any report in Report History. Formats supported are PDF (placeholder), CSV, JSON, and HTML.', cat: 'reporting' },
    { q: 'How is data stored?', a: 'All platform data is stored locally in your browser via StorageManager, which uses a combination of localStorage and IndexedDB. There is no backend server — nothing is transmitted anywhere.', cat: 'platform' },
    { q: 'Can I use the platform offline?', a: 'Yes. Every module works entirely offline once the page assets are loaded, since there is no server dependency — all data is bundled or generated client-side.', cat: 'platform' },
    { q: 'Is the bundled data real?', a: 'No. Every record across every module — cases, incidents, IOCs, malware samples, threat actors, reports, and more — is synthetic and deterministically generated for demonstration purposes only.', cat: 'platform' },
    { q: 'How do I bookmark a documentation article?', a: 'Open the article in the Documentation tab of the Help Center and click the bookmark icon in the article header. Bookmarked articles appear under the Bookmarks filter.', cat: 'getting-started' },
    { q: 'How do I change the theme?', a: 'Go to Settings and choose your preferred theme. Your choice is saved locally and applied the next time you open the app.', cat: 'settings' },
    { q: 'How do I search across the whole platform?', a: 'Click the search icon (or use the search shortcut) in the top bar. Global search checks every module — cases, incidents, IOCs, assets, reports, and documentation — at once.', cat: 'navigation' },
    { q: 'What does the "Coming Soon" label mean?', a: 'A few sections, like the AI Assistant and Client Portal, describe planned functionality that hasn\'t been built yet in this offline demo. They\'re listed here so the platform\'s roadmap is transparent.', cat: 'platform' },
    { q: 'How do I delete a generated report?', a: 'In Reporting Center → Report History, click the trash icon on any report you generated yourself. Bundled sample reports can be removed from view the same way.', cat: 'reporting' },
    { q: 'Does the Password Toolkit store my real passwords?', a: 'No. The Vault Demo is explicitly a demonstration with no real encryption — do not use it, or any part of this offline portfolio project, to store real credentials.', cat: 'password' },
    { q: 'How do I back up my data?', a: 'Go to Settings → Data Management and use Export Backup to download a JSON snapshot of everything stored locally. Use Import Backup to restore it later.', cat: 'settings' },
  ];

  const FAQ_TEMPLATES = [
    { q: (s) => `What is the ${s.label} module for?`, a: (s) => `${s.label} ${s.comingSoon ? 'is a planned module that will' : 'is used to'} ${s.summary.charAt(0).toLowerCase()}${s.summary.slice(1)}` },
    { q: (s) => `Where do I find ${s.label} in the sidebar?`, a: (s) => `Open the left sidebar and look for the ${s.label} entry with its module icon. Clicking it navigates directly to that module.` },
    { q: (s) => `Is data in ${s.label} stored locally?`, a: (s) => `Yes — like every module here, ${s.label} persists any records you create locally via StorageManager. Nothing is sent to a server.` },
    { q: (s) => `Can I search within ${s.label}?`, a: (s) => `Yes. Most modules, including ${s.label}, include local filters and a search box, and are also indexed by the platform's global search.` },
    { q: (s) => `Who should use ${s.label}?`, a: (s) => `${s.label} is aimed at SOC analysts, incident responders, and security engineers exploring how this functional area fits into a broader security platform.` },
    { q: (s) => `Is ${s.label} data exportable?`, a: (s) => `Where applicable, records from ${s.label} can be included in a generated report via the Reporting Center, or exported directly as CSV/JSON from within the module.` },
  ];

  function _generateFaqs() {
    const generated = [];
    SECTIONS.forEach((s) => {
      FAQ_TEMPLATES.forEach((tpl) => {
        generated.push({ q: tpl.q(s), a: tpl.a(s), cat: s.id });
      });
    });
    return generated;
  }

  const ALL_FAQS_RAW = [...CURATED_FAQS, ..._generateFaqs()];
  const FAQS = ALL_FAQS_RAW.map((f, i) => ({ id: `FAQ-${String(i + 1).padStart(3, '0')}`, ...f }));

  // ── Tutorials (step-by-step) ─────────────────────────────────────────
  const TUTORIALS = [
    { id: 'tut-soc', title: 'SOC Investigation Walkthrough', minutes: 8, difficulty: 'Intermediate', steps: [
      'Start on the SOC Dashboard to identify the highest-priority alert.',
      'Open the related module (SIEM, Malware, or Threat Intel) to gather context.',
      'Cross-reference any indicators found in IOC Manager.',
      'Escalate to Incident Response if the activity is confirmed malicious.',
      'Document your findings in the incident timeline and notes.',
    ] },
    { id: 'tut-ir', title: 'Running an Incident Response', minutes: 10, difficulty: 'Intermediate', steps: [
      'Create a new incident in Incident Response with category and severity.',
      'Assign tasks to analysts and track them to completion.',
      'Attach evidence (memory dump, disk image, or PCAP placeholders) as collected.',
      'Move the incident through Containment, Eradication, and Recovery.',
      'Close the incident and export a summary from the Reporting Center.',
    ] },
    { id: 'tut-malware', title: 'Malware Sample Analysis', minutes: 9, difficulty: 'Advanced', steps: [
      'Open the Malware Lab and locate a sample by hash or family.',
      'Review the static-analysis metadata and any matched YARA rules.',
      'Cross-check the sample hash in IOC Manager for related indicators.',
      'Note the associated threat actor or campaign in Threat Intelligence.',
      'Summarize findings in a Malware Report from the Reporting Center.',
    ] },
    { id: 'tut-hunt', title: 'Threat Hunting Basics', minutes: 10, difficulty: 'Advanced', steps: [
      'Form a hypothesis based on a recent threat actor or campaign profile.',
      'Search SIEM logs for behavior matching that hypothesis.',
      'Pivot into Asset Inventory to check exposure across your environment.',
      'Log any new indicators discovered into IOC Manager.',
      'Open an incident if hunting activity confirms a real finding.',
    ] },
    { id: 'tut-asset', title: 'Asset Management Essentials', minutes: 6, difficulty: 'Beginner', steps: [
      'Open Asset Inventory and filter by Critical criticality.',
      'Review patch status and flag any assets that are out of compliance.',
      'Update ownership or department fields as needed.',
      'Cross-reference flagged assets in any open incidents.',
      'Export an Asset Report from the Reporting Center.',
    ] },
    { id: 'tut-report', title: 'Generating Your First Report', minutes: 5, difficulty: 'Beginner', steps: [
      'Open the Reporting Center and click Generate Report.',
      'Choose a report type and date range in the wizard.',
      'Select the data sources you want included.',
      'Review the live preview and choose Executive Summary or Technical Report.',
      'Pick an export format and finish to save it to Report History.',
    ] },
  ];

  // ── Video placeholders (no real playback) ────────────────────────────
  const VIDEOS = [
    { id: 'vid-soc', title: 'SOC Training', category: 'Security Operations', duration: '12:30' },
    { id: 'vid-blue', title: 'Blue Team Fundamentals', category: 'Defense', duration: '18:45' },
    { id: 'vid-siem', title: 'SIEM Deep Dive', category: 'Detection Engineering', duration: '22:10' },
    { id: 'vid-hunt', title: 'Threat Hunting Techniques', category: 'Threat Hunting', duration: '15:20' },
    { id: 'vid-dfir', title: 'DFIR Case Walkthrough', category: 'Forensics', duration: '20:05' },
  ];

  // ── Keyboard shortcuts ────────────────────────────────────────────────
  const SHORTCUTS = {
    Search: [
      { keys: ['/'], desc: 'Focus global search' },
      { keys: ['Esc'], desc: 'Close search / close any open modal' },
      { keys: ['↑', '↓'], desc: 'Move between search results' },
      { keys: ['Enter'], desc: 'Open the highlighted search result' },
    ],
    Navigation: [
      { keys: ['G', 'D'], desc: 'Go to Dashboard' },
      { keys: ['G', 'R'], desc: 'Go to Reporting Center' },
      { keys: ['G', 'H'], desc: 'Go to Help Center' },
      { keys: ['Tab'], desc: 'Move focus to the next interactive element' },
    ],
    Accessibility: [
      { keys: ['Shift', 'Tab'], desc: 'Move focus to the previous interactive element' },
      { keys: ['Space'], desc: 'Activate the focused button or toggle' },
      { keys: ['Enter'], desc: 'Activate the focused link or nav item' },
    ],
  };

  // ── Changelog ─────────────────────────────────────────────────────────
  const CHANGELOG = [
    { version: '1.7.0', milestone: 16, title: 'Help Center & Documentation', date: '2026-07-26', notes: ['Added the Enterprise Help Center', '100+ FAQ knowledge base', 'Quick Start onboarding, tutorials, and shortcuts reference'] },
    { version: '1.6.0', milestone: 16, title: 'Enterprise Reporting Center', date: '2026-07-26', notes: ['Executive dashboard with cross-module KPIs', '5-step Report Builder wizard', 'CSV/JSON/HTML/PDF-placeholder export'] },
    { version: '1.5.0', milestone: 15, title: 'Password & Security Toolkit', date: '2026-07-25', notes: ['Generator, passphrase, strength analyzer, policy checker', 'Real MD5/SHA-1/SHA-256/SHA-512 hash tools', 'Vault demo and MFA/tips reference'] },
    { version: '1.4.0', milestone: 14, title: 'Case Manager', date: '2026-07-25', notes: ['Kanban task board', 'Evidence tracking and cross-module linking'] },
    { version: '1.3.0', milestone: 13, title: 'IOC Manager', date: '2026-07-24', notes: ['Indicator lifecycle tracking', 'Threat actor and campaign cross-links'] },
    { version: '1.2.0', milestone: 12, title: 'Phishing Analyzer', date: '2026-07-23', notes: ['Email header and URL risk analysis', 'Attachment sandbox summaries'] },
    { version: '1.1.0', milestone: 11, title: 'Incident Response', date: '2026-07-23', notes: ['Full incident lifecycle', 'Task board, evidence, and MITRE mapping'] },
    { version: '1.0.5', milestone: 10, title: 'Asset Inventory', date: '2026-07-23', notes: ['Host tracking with criticality and patch status'] },
    { version: '1.0.4', milestone: 9, title: 'Vulnerability Manager', date: '2026-07-23', notes: ['CVE tracking mapped to NIST CSF, CIS, and OWASP Top 10'] },
    { version: '1.0.3', milestone: 8, title: 'DFIR', date: '2026-07-23', notes: ['Forensic case timeline and evidence workflow'] },
    { version: '1.0.2', milestone: 6, title: 'Network Tools', date: '2026-07-22', notes: ['DNS, WHOIS, and packet capture reference views'] },
    { version: '1.0.1', milestone: 5, title: 'Threat Intelligence', date: '2026-07-22', notes: ['Threat actor and campaign profiles with MITRE mapping'] },
    { version: '1.0.0', milestone: 1, title: 'Platform Launch', date: '2026-06-27', notes: ['Core router, storage, notifications, and search systems', 'Portfolio and Company modules'] },
  ];

  const ROADMAP = [
    'SOC Dashboard — full live-metrics build-out (Milestone 3 follow-up)',
    'AI Assistant — conversational helper across every module',
    'Client Portal — external stakeholder access to shared reports',
    'Real PDF rendering for the Reporting Center',
  ];

  // ── About ─────────────────────────────────────────────────────────────
  const ABOUT = {
    version: '1.7.0',
    developer: 'Mohammad Azam Khan',
    company: 'Khan Security Solutions',
    license: 'Portfolio / educational use',
    credits: ['Built with vanilla JavaScript, HTML, and CSS — no frameworks.', 'Icons in the Heroicons outline style.', 'All security data is synthetic and generated for demonstration.'],
  };

  return { SECTIONS, ARTICLES, FAQS, TUTORIALS, VIDEOS, SHORTCUTS, CHANGELOG, ROADMAP, ABOUT };
})();

window.SampleHelpData = SampleHelpData;
