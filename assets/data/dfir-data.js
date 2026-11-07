/**
 * KHAN SECURITY SOLUTIONS ENTERPRISE
 * DFIR (Digital Forensics & Incident Response) — Sample Dataset v0.8.0
 *
 * [EDUCATIONAL SIMULATION — 100% synthetic, offline data]
 * All cases, evidence, custody logs, and analysis findings below are
 * fictional and generated for demonstration purposes only.
 *
 * Consumed by: assets/js/modules/dfir.js
 */

const SampleDFIR = (() => {

  // ── Cases ────────────────────────────────────────────────────────────────
  const cases = [
    {
      id: 'case-001', name: 'INC-2026-0142 — Suspicious Outbound Traffic',
      status: 'Open', severity: 'High', createdDate: '2026-07-10',
      leadInvestigator: 'A. Khan', description: 'Investigating repeated beaconing traffic from a finance workstation to an external IP flagged by threat intel.',
    },
    {
      id: 'case-002', name: 'INC-2026-0129 — Phishing-Delivered Loader',
      status: 'Open', severity: 'Critical', createdDate: '2026-06-28',
      leadInvestigator: 'A. Khan', description: 'End user reported a suspicious invoice attachment; endpoint later showed signs of a loader executing via macro.',
    },
    {
      id: 'case-003', name: 'INC-2026-0098 — Unauthorized RDP Access',
      status: 'Closed', severity: 'Medium', createdDate: '2026-05-14',
      leadInvestigator: 'S. Rahman', description: 'RDP session originating from an unrecognized external IP outside business hours; account was disabled and reviewed.',
    },
  ];

  // ── Timeline Events (type: general | ioc | mitre | evidence | note) ─────
  const timelineEvents = [
    { id: 'ev-001', caseId: 'case-001', timestamp: '2026-07-08 09:14', type: 'general', title: 'Alert Triggered', description: 'EDR flagged repeated outbound connections to 198.51.100.14 on port 443 at irregular intervals.' },
    { id: 'ev-002', caseId: 'case-001', timestamp: '2026-07-08 09:40', type: 'ioc', title: 'IOC Correlation', description: 'Destination IP matches a known indicator (198.51.100.14) tracked under Threat Intelligence campaign Operation Hollow Signal.', iocValue: '198.51.100.14' },
    { id: 'ev-003', caseId: 'case-001', timestamp: '2026-07-08 10:05', type: 'mitre', title: 'Technique Observed', description: 'Traffic pattern consistent with application-layer C2 over web traffic.', mitreId: 'T1071.001' },
    { id: 'ev-004', caseId: 'case-001', timestamp: '2026-07-08 11:30', type: 'evidence', title: 'Memory Image Collected', description: 'Full memory capture taken from affected workstation FIN-WS-014 prior to isolation.' },
    { id: 'ev-005', caseId: 'case-001', timestamp: '2026-07-10 14:00', type: 'note', title: 'Investigator Note', description: 'Awaiting sandbox detonation results for dropped payload before escalating to containment.' },

    { id: 'ev-006', caseId: 'case-002', timestamp: '2026-06-26 08:02', type: 'general', title: 'Phishing Report Received', description: 'End user forwarded a suspicious invoice email to the security mailbox.' },
    { id: 'ev-007', caseId: 'case-002', timestamp: '2026-06-26 08:20', type: 'ioc', title: 'Sender Domain Flagged', description: 'Sending domain matches a known phishing indicator in the threat intel feed.', iocValue: 'invoice-ledger-secure.example' },
    { id: 'ev-008', caseId: 'case-002', timestamp: '2026-06-26 08:45', type: 'mitre', title: 'Initial Access', description: 'User opened attached macro-enabled document, executing embedded PowerShell.', mitreId: 'T1566.001' },
    { id: 'ev-009', caseId: 'case-002', timestamp: '2026-06-26 09:10', type: 'mitre', title: 'Execution', description: 'PowerShell downloader retrieved a second-stage payload.', mitreId: 'T1059.001' },
    { id: 'ev-010', caseId: 'case-002', timestamp: '2026-06-26 12:00', type: 'evidence', title: 'Disk Image Collected', description: 'Forensic disk image acquired from affected endpoint ACC-WS-007.' },
    { id: 'ev-011', caseId: 'case-002', timestamp: '2026-06-27 09:00', type: 'note', title: 'Investigator Note', description: 'Ransomware indicators not yet observed; monitoring for lateral movement.' },

    { id: 'ev-012', caseId: 'case-003', timestamp: '2026-05-12 23:41', type: 'general', title: 'Off-Hours RDP Logon', description: 'Successful RDP logon recorded outside normal business hours from an external IP.' },
    { id: 'ev-013', caseId: 'case-003', timestamp: '2026-05-13 07:15', type: 'evidence', title: 'Event Logs Exported', description: 'Windows Security event logs exported from the affected server for review.' },
    { id: 'ev-014', caseId: 'case-003', timestamp: '2026-05-14 10:00', type: 'note', title: 'Resolution', description: 'Account credentials rotated, MFA enforced, RDP restricted to VPN-only access. Case closed.' },
  ];

  // ── Evidence Items (with chain of custody) ─────────────────────────────
  const evidence = [
    {
      id: 'evd-001', caseId: 'case-001', name: 'FIN-WS-014 Memory Capture',
      type: 'Memory Dump', hash: 'sha256:4f2a9c1e7b3d5f8a0c2e4b6d8f1a3c5e7b9d1f3a5c7e9b1d3f5a7c9e1b3d5f7a',
      collectedBy: 'A. Khan', collectedDate: '2026-07-08 11:30', location: 'Evidence Server / Case-001/mem/',
      custodyLog: [
        { by: 'A. Khan', date: '2026-07-08 11:30', action: 'Collected', notes: 'Captured via forensic imaging tool prior to host isolation.' },
        { by: 'A. Khan', date: '2026-07-08 11:45', action: 'Transferred', notes: 'Copied to encrypted evidence server share.' },
        { by: 'S. Rahman', date: '2026-07-09 09:00', action: 'Accessed', notes: 'Reviewed for process and network artifacts.' },
      ],
    },
    {
      id: 'evd-002', caseId: 'case-002', name: 'ACC-WS-007 Disk Image',
      type: 'Disk Image', hash: 'sha256:9d1f3a5c7e9b1d3f5a7c9e1b3d5f7a9c1e3b5d7f9a1c3e5b7d9f1a3c5e7b9d1f',
      collectedBy: 'A. Khan', collectedDate: '2026-06-26 12:00', location: 'Evidence Server / Case-002/disk/',
      custodyLog: [
        { by: 'A. Khan', date: '2026-06-26 12:00', action: 'Collected', notes: 'Full disk image acquired using write-blocked forensic duplicator.' },
        { by: 'A. Khan', date: '2026-06-26 12:20', action: 'Hashed', notes: 'SHA-256 hash recorded and verified against source.' },
      ],
    },
    {
      id: 'evd-003', caseId: 'case-002', name: 'Phishing Email (.eml)',
      type: 'Document', hash: 'sha256:1a3c5e7b9d1f3a5c7e9b1d3f5a7c9e1b3d5f7a9c1e3b5d7f9a1c3e5b7d9f1a3c',
      collectedBy: 'S. Rahman', collectedDate: '2026-06-26 08:30', location: 'Evidence Server / Case-002/email/',
      custodyLog: [
        { by: 'S. Rahman', date: '2026-06-26 08:30', action: 'Collected', notes: 'Exported original email with full headers from mail gateway.' },
      ],
    },
    {
      id: 'evd-004', caseId: 'case-003', name: 'Security Event Log Export',
      type: 'Log File', hash: 'sha256:5b7d9f1a3c5e7b9d1f3a5c7e9b1d3f5a7c9e1b3d5f7a9c1e3b5d7f9a1c3e5b7d',
      collectedBy: 'S. Rahman', collectedDate: '2026-05-13 07:15', location: 'Evidence Server / Case-003/logs/',
      custodyLog: [
        { by: 'S. Rahman', date: '2026-05-13 07:15', action: 'Collected', notes: 'Exported Windows Security event log (EVTX) from affected server.' },
        { by: 'S. Rahman', date: '2026-05-14 09:30', action: 'Reviewed', notes: 'Confirmed off-hours logon origin and correlated with firewall logs.' },
      ],
    },
  ];

  // ── Case Notes ───────────────────────────────────────────────────────────
  const caseNotes = [
    { id: 'note-001', caseId: 'case-001', author: 'A. Khan', date: '2026-07-08 11:50', text: 'Isolated FIN-WS-014 from the network pending further analysis. No lateral movement observed so far.' },
    { id: 'note-002', caseId: 'case-001', author: 'S. Rahman', date: '2026-07-09 09:15', text: 'Memory analysis shows a suspicious process masquerading as a system service. Escalating for malware sandbox review.' },
    { id: 'note-003', caseId: 'case-002', author: 'A. Khan', date: '2026-06-26 13:00', text: 'Disk image acquired successfully. Beginning artifact review of recent execution history.' },
    { id: 'note-004', caseId: 'case-002', author: 'S. Rahman', date: '2026-06-27 09:10', text: 'No evidence of data staging or exfiltration yet. Continuing endpoint monitoring for 72 hours.' },
    { id: 'note-005', caseId: 'case-003', author: 'S. Rahman', date: '2026-05-14 10:05', text: 'Root cause: reused password without MFA. Remediation complete, case closed.' },
  ];

  // ── Memory Analysis Placeholder Findings ────────────────────────────────
  const memoryFindings = {
    imageName: 'FIN-WS-014-mem.raw', size: '8,589,934,592 bytes (8 GB)', profile: 'Win10x64_19041 (simulated)',
    processes: [
      { pid: 4120, name: 'svch0st.exe', ppid: 812, note: 'Suspicious — misspelled system process name' },
      { pid: 812,  name: 'services.exe', ppid: 604, note: 'Normal' },
      { pid: 604,  name: 'wininit.exe', ppid: 480, note: 'Normal' },
      { pid: 5544, name: 'powershell.exe', ppid: 4120, note: 'Suspicious — spawned by non-standard parent' },
    ],
    networkConnections: [
      { pid: 5544, local: '10.0.0.15:51322', remote: '198.51.100.14:443', state: 'ESTABLISHED' },
    ],
    injectedModules: [
      { pid: 4120, module: 'unbacked_region_0x7ff6a2b40000', note: 'Memory region with no backing file — possible code injection' },
    ],
  };

  // ── Disk Analysis Placeholder Findings ──────────────────────────────────
  const diskFindings = {
    imageName: 'ACC-WS-007-disk.dd', size: '256 GB', fileSystem: 'NTFS (simulated)',
    recentlyExecuted: [
      { path: 'C:\\Users\\jsmith\\AppData\\Local\\Temp\\invoice_2026.docm', lastRun: '2026-06-26 08:45' },
      { path: 'C:\\Windows\\Temp\\update_stage2.exe', lastRun: '2026-06-26 09:11' },
    ],
    deletedFiles: [
      { path: 'C:\\Users\\jsmith\\AppData\\Local\\Temp\\stage2_dropper.tmp', deletedAt: '2026-06-26 09:15', recoverable: true },
    ],
    persistenceArtifacts: [
      { location: 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run', value: 'UpdateStage2 = C:\\Windows\\Temp\\update_stage2.exe', note: 'Non-standard autorun entry' },
    ],
  };

  // ── MITRE technique reference for timeline tagging (subset) ─────────────
  const mitreLookup = {
    'T1071.001': 'Application Layer Protocol: Web Traffic',
    'T1566.001': 'Phishing: Spearphishing Attachment',
    'T1059.001': 'Command and Scripting: PowerShell',
  };

  // ── Helpers ──────────────────────────────────────────────────────────────
  function getCase(id) { return cases.find(c => c.id === id) || null; }

  return { cases, timelineEvents, evidence, caseNotes, memoryFindings, diskFindings, mitreLookup, getCase };

})();

window.SampleDFIR = SampleDFIR;
