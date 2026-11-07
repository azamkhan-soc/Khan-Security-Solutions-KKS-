/**
 * KHAN SECURITY SOLUTIONS ENTERPRISE
 * Enterprise Incident Response Center — Sample Dataset v1.1.0
 *
 * [EDUCATIONAL SIMULATION — 100% synthetic, offline data]
 * All incidents, analysts, evidence, and IOCs below are fictional and
 * generated deterministically for demonstration purposes only.
 * MITRE ATT&CK technique IDs/names ARE the real public framework taxonomy.
 *
 * Consumed by: assets/js/modules/incident-response.js
 */

const SampleIncidentData = (() => {

  const ANALYSTS = ['A. Khan', 'S. Rahman', 'M. Ortiz', 'D. Kim', 'T. Alvarez', 'N. Ibrahim'];
  const DEPARTMENTS = ['IT Ops', 'Finance', 'HR', 'Engineering', 'Sales', 'Legal', 'Executive', 'Security'];
  const DETECTION_SOURCES = ['EDR Alert', 'SIEM Correlation Rule', 'User Report', 'Threat Intel Feed', 'DLP Alert', 'Firewall Alert', 'Email Gateway', 'Cloud Security Posture Mgmt'];
  const HOSTNAMES = ['WIN-SRV-001', 'LNX-SRV-002', 'DC-003', 'WS-004', 'LT-006', 'MAC-007', 'AZ-VM-019', 'EC2-020', 'FW-023', 'WS-036', 'LT-030'];

  const CATEGORIES = [
    'Malware', 'Phishing', 'Credential Theft', 'Privilege Escalation', 'Lateral Movement',
    'Persistence', 'Command & Control', 'Ransomware', 'Insider Threat', 'Data Exfiltration',
    'Cloud Incident', 'Web Attack', 'Vulnerability Exploitation',
  ];

  const SEVERITIES = ['critical', 'high', 'medium', 'low', 'informational'];
  const STATUSES = ['New', 'Investigating', 'Triaged', 'Contained', 'Eradicated', 'Recovering', 'Resolved', 'Closed', 'False Positive'];
  const PRIORITIES = ['P1', 'P2', 'P3', 'P4'];

  const MITRE_BY_CATEGORY = {
    'Malware':             { tactic: 'Execution', technique: 'Command and Scripting Interpreter', id: 'T1059', detectionLogic: 'EDR flags anomalous child process spawned from a scripting interpreter.', recommendations: 'Isolate host, capture memory image, run full AV/EDR scan.' },
    'Phishing':            { tactic: 'Initial Access', technique: 'Phishing: Spearphishing Attachment', id: 'T1566.001', detectionLogic: 'Email gateway sandbox detonation flags malicious attachment.', recommendations: 'Block sender domain, purge email from mailboxes, user awareness follow-up.' },
    'Credential Theft':    { tactic: 'Credential Access', technique: 'OS Credential Dumping', id: 'T1003', detectionLogic: 'EDR detects LSASS memory access from non-standard process.', recommendations: 'Force credential reset, enable LSASS protection, review MFA enrollment.' },
    'Privilege Escalation':{ tactic: 'Privilege Escalation', technique: 'Exploitation for Privilege Escalation', id: 'T1068', detectionLogic: 'Unexpected privilege token assignment observed in audit logs.', recommendations: 'Patch vulnerable component, review local admin group membership.' },
    'Lateral Movement':    { tactic: 'Lateral Movement', technique: 'Remote Services: SMB/Windows Admin Shares', id: 'T1021.002', detectionLogic: 'Unusual authentication pattern across multiple hosts in short window.', recommendations: 'Segment network, rotate service account credentials, review firewall rules.' },
    'Persistence':         { tactic: 'Persistence', technique: 'Scheduled Task/Job', id: 'T1053.005', detectionLogic: 'New scheduled task created with suspicious binary path.', recommendations: 'Remove persistence mechanism, audit all scheduled tasks on host.' },
    'Command & Control':   { tactic: 'Command and Control', technique: 'Application Layer Protocol: Web Traffic', id: 'T1071.001', detectionLogic: 'Beaconing pattern detected in outbound web traffic to known-bad IP.', recommendations: 'Block C2 IP/domain at firewall, isolate host, hunt for related IOCs.' },
    'Ransomware':          { tactic: 'Impact', technique: 'Data Encrypted for Impact', id: 'T1486', detectionLogic: 'Mass file modification/encryption pattern detected by EDR.', recommendations: 'Isolate immediately, activate IR plan, assess backup integrity before restore.' },
    'Insider Threat':      { tactic: 'Collection', technique: 'Data from Information Repositories', id: 'T1213', detectionLogic: 'DLP flags abnormal volume of sensitive file access by a single user.', recommendations: 'Engage HR/Legal, review access logs, consider account suspension pending review.' },
    'Data Exfiltration':   { tactic: 'Exfiltration', technique: 'Exfiltration Over Web Service', id: 'T1567.002', detectionLogic: 'DLP/CASB flags large outbound transfer to unsanctioned cloud storage.', recommendations: 'Block destination, review transferred data scope, notify data owner.' },
    'Cloud Incident':      { tactic: 'Initial Access', technique: 'Valid Accounts: Cloud Accounts', id: 'T1078.004', detectionLogic: 'Cloud audit log shows impossible-travel login to admin console.', recommendations: 'Revoke session tokens, force password reset, enable conditional access.' },
    'Web Attack':          { tactic: 'Initial Access', technique: 'Exploit Public-Facing Application', id: 'T1190', detectionLogic: 'WAF logs show exploitation attempt matching known CVE signature.', recommendations: 'Patch application, review WAF rules, check for webshell artifacts.' },
    'Vulnerability Exploitation': { tactic: 'Initial Access', technique: 'Exploit Public-Facing Application', id: 'T1190', detectionLogic: 'Vulnerability scanner + IDS correlate exploit attempt against known CVE.', recommendations: 'Apply vendor patch, verify no successful exploitation occurred.' },
  };

  // Scenario title templates mapped to a category, covering all explicitly requested demo types
  const SCENARIOS = [
    { title: 'Phishing Email Delivering Macro-Enabled Loader', category: 'Phishing' },
    { title: 'Ransomware Encryption Activity on File Server', category: 'Ransomware' },
    { title: 'Credential Theft via LSASS Memory Dump', category: 'Credential Theft' },
    { title: 'Suspicious PowerShell Abuse — Encoded Command Execution', category: 'Command & Control' },
    { title: 'Lateral Movement via SMB Admin Shares', category: 'Lateral Movement' },
    { title: 'Data Exfiltration to Unsanctioned Cloud Storage', category: 'Data Exfiltration' },
    { title: 'Cloud Incident — Impossible Travel Admin Login', category: 'Cloud Incident' },
    { title: 'Insider Threat — Abnormal Sensitive File Access', category: 'Insider Threat' },
    { title: 'Linux Compromise — Unauthorized SSH Key Addition', category: 'Malware' },
    { title: 'Web Shell Detected on Public-Facing Web Server', category: 'Web Attack' },
    { title: 'Supply Chain Compromise — Malicious Package Update', category: 'Vulnerability Exploitation' },
    { title: 'Business Email Compromise — Finance Wire Fraud Attempt', category: 'Phishing' },
    { title: 'Privilege Escalation via Unpatched Local Service', category: 'Privilege Escalation' },
    { title: 'Persistence Mechanism — Malicious Scheduled Task', category: 'Persistence' },
    { title: 'Malware Beaconing to Known C2 Infrastructure', category: 'Command & Control' },
    { title: 'Suspicious Login Attempts Against Domain Controller', category: 'Credential Theft' },
    { title: 'Malicious Macro Document Executed on Workstation', category: 'Malware' },
    { title: 'Firewall Alert — Port Scan from Internal Host', category: 'Lateral Movement' },
    { title: 'DLP Alert — Bulk PII Export via USB Device', category: 'Data Exfiltration' },
    { title: 'Cloud Storage Bucket Misconfiguration Exposure', category: 'Cloud Incident' },
  ];

  function _hash(n, mod) { return ((n * 2654435761) >>> 0) % mod; }
  function _pad(n, len) { return String(n).padStart(len, '0'); }
  function _dateOffset(days, hours = 0) { return new Date(Date.now() - days * 86400000 - hours * 3600000); }
  function _fmt(d) { return d.toISOString().slice(0, 16).replace('T', ' '); }

  const EVIDENCE_TYPES = ['Collected Logs', 'Screenshots', 'Memory Dump', 'PCAP', 'Disk Image', 'Email Evidence', 'Hashes', 'IOC References'];

  function _buildIncident(idx) {
    const scenario = SCENARIOS[idx % SCENARIOS.length];
    const category = scenario.category;
    const mitre = MITRE_BY_CATEGORY[category];
    const severity = SEVERITIES[_hash(idx * 3, idx % 11 === 0 ? 5 : 4)]; // mostly critical/high/medium/low, occasional informational
    const priority = PRIORITIES[_hash(idx * 5, 4)];
    const analyst = ANALYSTS[_hash(idx * 7, ANALYSTS.length)];
    const dept = DEPARTMENTS[_hash(idx * 11, DEPARTMENTS.length)];
    const hostname = HOSTNAMES[_hash(idx * 13, HOSTNAMES.length)];
    const detectionSource = DETECTION_SOURCES[_hash(idx * 17, DETECTION_SOURCES.length)];
    const statusIdx = _hash(idx * 19, STATUSES.length);
    const status = STATUSES[statusIdx];
    const ageDays = 1 + _hash(idx * 23, 45);
    const createdTime = _fmt(_dateOffset(ageDays, _hash(idx, 24)));
    const isClosed = ['Resolved', 'Closed', 'False Positive'].includes(status);
    const updatedTime = _fmt(_dateOffset(isClosed ? Math.max(0, ageDays - 1 - _hash(idx * 29, 5)) : _hash(idx * 29, ageDays)));
    const slaMinutes = { critical: 30, high: 60, medium: 240, low: 480, informational: 1440 }[severity];
    const responseMinutes = slaMinutes - 10 + _hash(idx * 31, 40);
    const slaStatus = responseMinutes <= slaMinutes ? 'Met' : 'Breached';
    const num = idx + 1;

    const iocCount = 1 + (idx % 4);
    const iocTypes = ['ip', 'domain', 'hash', 'url', 'email'];
    const iocs = Array.from({ length: iocCount }, (_, i) => {
      const type = iocTypes[_hash(idx * 37 + i, iocTypes.length)];
      const val = type === 'ip' ? `198.51.100.${10 + _hash(idx + i, 240)}`
        : type === 'domain' ? `malicious-${_hash(idx + i, 9999)}.example`
        : type === 'hash' ? Array.from({ length: 16 }, (_, j) => '0123456789abcdef'[_hash(idx + i + j, 16)]).join('')
        : type === 'url' ? `hxxps://malicious-${_hash(idx + i, 9999)}.example/payload`
        : `phish-${_hash(idx + i, 999)}@fake-domain.example`;
      return { type, value: val, detectionTime: createdTime, confidence: 60 + _hash(idx + i, 40) };
    });

    const evidence = EVIDENCE_TYPES.filter((_, i) => _hash(idx * 41 + i, 3) !== 0).map(type => ({
      type, name: `${type.replace(/\s/g, '_').toLowerCase()}_${hostname}_${num}`,
      note: type === 'Memory Dump' || type === 'PCAP' || type === 'Disk Image' ? '[PLACEHOLDER] Simulated reference only — not a real forensic artifact.' : 'Collected during initial triage.',
    }));

    const timelineSteps = [
      { event: 'Alert Generated', detail: `${detectionSource} generated an alert for ${hostname}.`, offsetHrs: 0 },
      { event: 'Incident Created', detail: `Incident ${category.toLowerCase()} case opened and logged.`, offsetHrs: 0.25 },
      { event: 'Analyst Assigned', detail: `Assigned to ${analyst} for triage.`, offsetHrs: 0.5 },
      { event: 'Investigation Started', detail: 'Initial triage and evidence collection began.', offsetHrs: 1 },
    ];
    if (['Contained', 'Eradicated', 'Recovering', 'Resolved', 'Closed'].includes(status)) timelineSteps.push({ event: 'Containment', detail: 'Affected host isolated from the network.', offsetHrs: 3 });
    if (['Eradicated', 'Recovering', 'Resolved', 'Closed'].includes(status)) timelineSteps.push({ event: 'Eradication', detail: 'Malicious artifacts and persistence mechanisms removed.', offsetHrs: 6 });
    if (['Recovering', 'Resolved', 'Closed'].includes(status)) timelineSteps.push({ event: 'Recovery', detail: 'System restored to normal operation and validated.', offsetHrs: 12 });
    if (['Resolved', 'Closed'].includes(status)) timelineSteps.push({ event: 'Lessons Learned', detail: 'Post-incident review completed with recommendations logged.', offsetHrs: 24 });

    const created = _dateOffset(ageDays);
    const timeline = timelineSteps.map(s => ({ time: _fmt(new Date(created.getTime() + s.offsetHrs * 3600000)), event: s.event, detail: s.detail }));

    const taskCount = 2 + (idx % 3);
    const taskTitles = ['Isolate affected host', 'Collect forensic evidence', 'Reset compromised credentials', 'Review firewall logs', 'Notify affected department', 'Validate backup integrity', 'Patch vulnerable service', 'Update detection rules'];
    const tasks = Array.from({ length: taskCount }, (_, i) => {
      const done = isClosed || _hash(idx + i, 3) === 0;
      return {
        id: `task-${num}-${i}`, title: taskTitles[_hash(idx * 43 + i, taskTitles.length)],
        assignee: ANALYSTS[_hash(idx * 47 + i, ANALYSTS.length)],
        dueDate: _fmt(_dateOffset(-2 - i)).slice(0, 10),
        progress: done ? 100 : _hash(idx + i * 5, 90),
        status: done ? 'Done' : (i === 0 ? 'In Progress' : 'To Do'),
      };
    });

    const notes = [
      { author: analyst, date: createdTime, text: `Initial triage confirms ${category.toLowerCase()} activity on ${hostname}. Continuing investigation.` },
    ];
    if (isClosed) notes.push({ author: analyst, date: updatedTime, text: 'Incident resolved. Root cause identified and remediated; monitoring for recurrence.' });

    const recovery = {
      systemRestored: isClosed || status === 'Recovering',
      passwordReset: category === 'Credential Theft' || category === 'Cloud Incident' ? isClosed : (idx % 2 === 0),
      patchApplied: category === 'Vulnerability Exploitation' || category === 'Web Attack' ? isClosed : (idx % 3 === 0),
      avScan: isClosed || status === 'Eradicated' || status === 'Recovering',
      validationComplete: isClosed,
      lessonsLearned: isClosed ? 'Documented in post-incident review; detection rule tuning recommended.' : '',
    };

    return {
      id: `INC-2026-${_pad(1000 + num, 4)}`,
      title: scenario.title, category, severity, status, priority,
      description: `Security monitoring detected ${scenario.title.toLowerCase()} affecting ${hostname}. Investigation is tracking scope of impact and remediation actions.`,
      businessImpact: severity === 'critical' ? 'High — potential for significant operational or data impact if not contained promptly.' : severity === 'high' ? 'Moderate — limited scope but requires prompt remediation.' : 'Low — contained to a single asset with minimal operational impact.',
      affectedAssetHostname: hostname, department: dept, assignedAnalyst: analyst, owner: analyst,
      detectionSource, createdTime, updatedTime,
      slaMinutes, responseMinutes: Math.max(1, responseMinutes), slaStatus,
      resolutionTime: isClosed ? updatedTime : null,
      mitre, iocs, evidence, timeline, tasks, notes, recovery,
    };
  }

  const incidents = Array.from({ length: 50 }, (_, i) => _buildIncident(i));

  function getIncident(id) { return incidents.find(i => i.id === id) || null; }

  return { incidents, CATEGORIES, SEVERITIES, STATUSES, PRIORITIES, DETECTION_SOURCES, ANALYSTS, MITRE_BY_CATEGORY, getIncident };

})();

window.SampleIncidentData = SampleIncidentData;
