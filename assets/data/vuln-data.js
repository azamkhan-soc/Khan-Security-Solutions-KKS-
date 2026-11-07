/**
 * KHAN SECURITY SOLUTIONS ENTERPRISE
 * Vulnerability Management — Sample Dataset v0.9.0
 *
 * [EDUCATIONAL SIMULATION — asset names, patch tickets, and risk scoring
 *  below are synthetic offline demo data.]
 * CVE IDs referenced ARE real, publicly disclosed vulnerabilities (public
 * NVD identifiers used for realistic demonstration — descriptions here are
 * simplified/paraphrased, not reproduced verbatim from NVD).
 * NIST CSF, CIS Controls v8, and OWASP Top 10 mappings are the real public
 * framework reference taxonomies.
 *
 * Consumed by: assets/js/modules/vuln-manager.js
 */

const SampleVulnData = (() => {

  // ── Assets (lightweight — full Asset Inventory module ships in M6) ─────
  const assets = [
    { id: 'ast-01', name: 'FIN-WS-014',  type: 'Workstation', owner: 'Finance', criticality: 'High',     ip: '10.0.2.14' },
    { id: 'ast-02', name: 'ACC-WS-007',  type: 'Workstation', owner: 'Accounting', criticality: 'Medium', ip: '10.0.2.7' },
    { id: 'ast-03', name: 'WEB-PROD-01', type: 'Server',      owner: 'IT Ops', criticality: 'Critical',  ip: '203.0.113.10' },
    { id: 'ast-04', name: 'DB-PROD-02',  type: 'Server',      owner: 'IT Ops', criticality: 'Critical',  ip: '10.0.1.22' },
    { id: 'ast-05', name: 'EDGE-FW-01',  type: 'Network Device', owner: 'IT Ops', criticality: 'Critical', ip: '10.0.0.1' },
    { id: 'ast-06', name: 'HR-WS-003',   type: 'Workstation', owner: 'HR', criticality: 'Low',            ip: '10.0.2.33' },
  ];

  // ── CVE Database (real public CVE IDs, paraphrased summaries) ──────────
  const cves = [
    {
      id: 'CVE-2024-3400', product: 'Palo Alto Networks PAN-OS GlobalProtect', cvss: 10.0, severity: 'critical',
      vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H',
      summary: 'A command injection weakness in the GlobalProtect feature allowed unauthenticated attackers to execute arbitrary code with root privileges.',
      publishedDate: '2024-04-12', affectedAssets: ['ast-05'], patched: false,
    },
    {
      id: 'CVE-2023-4863', product: 'libwebp (WebP image library)', cvss: 8.8, severity: 'high',
      vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:H',
      summary: 'A heap buffer overflow in WebP image decoding could allow an attacker to achieve arbitrary code execution via a crafted image.',
      publishedDate: '2023-09-11', affectedAssets: ['ast-01', 'ast-02'], patched: true,
    },
    {
      id: 'CVE-2021-44228', product: 'Apache Log4j2', cvss: 10.0, severity: 'critical',
      vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H',
      summary: 'The well-known "Log4Shell" JNDI lookup flaw allows remote code execution via crafted log messages.',
      publishedDate: '2021-12-10', affectedAssets: ['ast-03', 'ast-04'], patched: true,
    },
    {
      id: 'CVE-2022-22965', product: 'VMware Spring Framework ("Spring4Shell")', cvss: 9.8, severity: 'critical',
      vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
      summary: 'A data-binding flaw in Spring MVC/WebFlux running on JDK 9+ can lead to remote code execution under specific deployment conditions.',
      publishedDate: '2022-03-31', affectedAssets: ['ast-03'], patched: true,
    },
    {
      id: 'CVE-2023-38831', product: 'RARLAB WinRAR', cvss: 7.8, severity: 'high',
      vector: 'CVSS:3.1/AV:L/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:H',
      summary: 'A crafted archive could execute arbitrary code when a user opens a file appearing to be a benign file inside the archive.',
      publishedDate: '2023-08-23', affectedAssets: ['ast-06'], patched: false,
    },
    {
      id: 'CVE-2020-1472', product: 'Microsoft Netlogon ("Zerologon")', cvss: 10.0, severity: 'critical',
      vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H',
      summary: 'An elevation-of-privilege flaw in Netlogon allows an attacker to impersonate a domain controller and gain domain admin rights.',
      publishedDate: '2020-08-11', affectedAssets: ['ast-05'], patched: true,
    },
    {
      id: 'CVE-2019-0708', product: 'Microsoft RDP ("BlueKeep")', cvss: 9.8, severity: 'critical',
      vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
      summary: 'A pre-authentication remote code execution flaw in Remote Desktop Services, wormable without user interaction.',
      publishedDate: '2019-05-14', affectedAssets: [], patched: true,
    },
    {
      id: 'CVE-2023-23397', product: 'Microsoft Outlook', cvss: 9.8, severity: 'critical',
      vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
      summary: 'A privilege-escalation flaw allowing NTLM credential theft via a specially crafted email, triggered without the user opening it.',
      publishedDate: '2023-03-14', affectedAssets: ['ast-01', 'ast-02', 'ast-06'], patched: false,
    },
    {
      id: 'CVE-2021-34527', product: 'Microsoft Windows Print Spooler ("PrintNightmare")', cvss: 8.8, severity: 'high',
      vector: 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H',
      summary: 'A remote code execution flaw in the Windows Print Spooler service, exploitable via a malicious printer driver.',
      publishedDate: '2021-07-01', affectedAssets: ['ast-02'], patched: true,
    },
    {
      id: 'CVE-2022-30190', product: 'Microsoft Office ("Follina")', cvss: 7.8, severity: 'high',
      vector: 'CVSS:3.1/AV:L/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:H',
      summary: 'A flaw in the Microsoft Support Diagnostic Tool (MSDT) allows remote code execution via a crafted Office document.',
      publishedDate: '2022-05-30', affectedAssets: ['ast-06'], patched: false,
    },
  ];

  // ── Patch Tracking ───────────────────────────────────────────────────────
  const patches = [
    { id: 'pt-01', cveId: 'CVE-2024-3400',  assetId: 'ast-05', status: 'Not Started',  owner: 'IT Ops',    dueDate: '2026-08-01', notes: 'Awaiting vendor hotfix validation in staging.' },
    { id: 'pt-02', cveId: 'CVE-2023-38831', assetId: 'ast-06', status: 'Not Started',  owner: 'HR IT',      dueDate: '2026-08-05', notes: 'WinRAR update scheduled for next patch window.' },
    { id: 'pt-03', cveId: 'CVE-2023-23397', assetId: 'ast-01', status: 'In Progress',  owner: 'IT Ops',    dueDate: '2026-07-28', notes: 'Outlook security update rolling out via WSUS.' },
    { id: 'pt-04', cveId: 'CVE-2023-23397', assetId: 'ast-02', status: 'In Progress',  owner: 'IT Ops',    dueDate: '2026-07-28', notes: 'Same rollout as ast-01.' },
    { id: 'pt-05', cveId: 'CVE-2023-23397', assetId: 'ast-06', status: 'Not Started',  owner: 'HR IT',      dueDate: '2026-08-02', notes: 'Pending maintenance window.' },
    { id: 'pt-06', cveId: 'CVE-2022-30190', assetId: 'ast-06', status: 'Not Started',  owner: 'HR IT',      dueDate: '2026-08-10', notes: 'Registry workaround applied; full patch pending.' },
    { id: 'pt-07', cveId: 'CVE-2021-44228', assetId: 'ast-03', status: 'Verified',     owner: 'IT Ops',    dueDate: '2022-01-05', notes: 'Log4j upgraded to patched version; verified via scan.' },
    { id: 'pt-08', cveId: 'CVE-2021-44228', assetId: 'ast-04', status: 'Verified',     owner: 'IT Ops',    dueDate: '2022-01-05', notes: 'Log4j upgraded to patched version; verified via scan.' },
    { id: 'pt-09', cveId: 'CVE-2020-1472',  assetId: 'ast-05', status: 'Patched',      owner: 'IT Ops',    dueDate: '2020-09-15', notes: 'Netlogon enforcement mode enabled domain-wide.' },
    { id: 'pt-10', cveId: 'CVE-2021-34527', assetId: 'ast-02', status: 'Patched',      owner: 'IT Ops',    dueDate: '2021-08-01', notes: 'Print Spooler cumulative update applied.' },
  ];

  // ── NIST CSF 2.0 Function Mapping (public reference) ────────────────────
  const nistCsf = [
    { fn: 'Govern',  desc: 'Organizational context, risk strategy, and policy for cybersecurity risk management.', coverage: 72 },
    { fn: 'Identify', desc: 'Asset management, risk assessment, and understanding of the current environment.', coverage: 80 },
    { fn: 'Protect',  desc: 'Safeguards to ensure delivery of critical services — access control, awareness, data security.', coverage: 68 },
    { fn: 'Detect',   desc: 'Timely discovery of cybersecurity events — SIEM, monitoring, anomaly detection.', coverage: 75 },
    { fn: 'Respond',  desc: 'Actions taken regarding a detected incident — this platform\'s DFIR toolkit.', coverage: 70 },
    { fn: 'Recover',  desc: 'Plans and processes to restore capabilities impaired by an incident.', coverage: 60 },
  ];

  // ── CIS Controls v8 (public reference, subset of 18) ─────────────────────
  const cisControls = [
    { id: 'CIS-1',  name: 'Inventory and Control of Enterprise Assets', status: 'Partial' },
    { id: 'CIS-2',  name: 'Inventory and Control of Software Assets',   status: 'Partial' },
    { id: 'CIS-3',  name: 'Data Protection',                            status: 'Implemented' },
    { id: 'CIS-4',  name: 'Secure Configuration of Enterprise Assets and Software', status: 'Partial' },
    { id: 'CIS-5',  name: 'Account Management',                         status: 'Implemented' },
    { id: 'CIS-6',  name: 'Access Control Management',                  status: 'Implemented' },
    { id: 'CIS-7',  name: 'Continuous Vulnerability Management',        status: 'Implemented' },
    { id: 'CIS-8',  name: 'Audit Log Management',                       status: 'Implemented' },
    { id: 'CIS-10', name: 'Malware Defenses',                           status: 'Implemented' },
    { id: 'CIS-13', name: 'Network Monitoring and Defense',             status: 'Partial' },
    { id: 'CIS-17', name: 'Incident Response Management',               status: 'Implemented' },
    { id: 'CIS-18', name: 'Penetration Testing',                        status: 'Not Started' },
  ];

  // ── OWASP Top 10 (2021, public reference) ─────────────────────────────────
  const owaspTop10 = [
    { id: 'A01:2021', name: 'Broken Access Control', relatedCves: [] },
    { id: 'A02:2021', name: 'Cryptographic Failures', relatedCves: [] },
    { id: 'A03:2021', name: 'Injection', relatedCves: ['CVE-2024-3400'] },
    { id: 'A04:2021', name: 'Insecure Design', relatedCves: [] },
    { id: 'A05:2021', name: 'Security Misconfiguration', relatedCves: ['CVE-2021-44228'] },
    { id: 'A06:2021', name: 'Vulnerable and Outdated Components', relatedCves: ['CVE-2023-4863', 'CVE-2022-22965'] },
    { id: 'A07:2021', name: 'Identification and Authentication Failures', relatedCves: ['CVE-2020-1472'] },
    { id: 'A08:2021', name: 'Software and Data Integrity Failures', relatedCves: [] },
    { id: 'A09:2021', name: 'Security Logging and Monitoring Failures', relatedCves: [] },
    { id: 'A10:2021', name: 'Server-Side Request Forgery (SSRF)', relatedCves: [] },
  ];

  function getAsset(id) { return assets.find(a => a.id === id) || null; }
  function getCVE(id)   { return cves.find(c => c.id === id) || null; }

  return { assets, cves, patches, nistCsf, cisControls, owaspTop10, getAsset, getCVE };

})();

window.SampleVulnData = SampleVulnData;
