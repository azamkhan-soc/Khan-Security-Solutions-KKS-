/**
 * KHAN SECURITY SOLUTIONS ENTERPRISE
 * Enterprise Security Case Management System — Sample Dataset v1.4.0
 *
 * [EDUCATIONAL SIMULATION — 100% synthetic, offline data]
 * All cases, tasks, evidence, and analyst assignments below are fictional
 * and generated deterministically for demonstration purposes only.
 * MITRE ATT&CK technique IDs/names ARE the real public framework taxonomy.
 * Cross-module links (relatedIncidentHint, relatedAssetHint, linkedIocIds)
 * reference records from SampleIncidentData / SampleAssetData / SampleIOCData
 * when those modules are loaded, so Case Manager can show live cross-links.
 *
 * Consumed by: assets/js/modules/case-manager.js
 */

const SampleCaseData = (() => {

  const ANALYSTS = ['A. Khan', 'S. Rahman', 'M. Ortiz', 'D. Kim', 'T. Alvarez', 'N. Ibrahim'];
  const DEPARTMENTS = ['IT Ops', 'Finance', 'HR', 'Engineering', 'Sales', 'Legal', 'Executive', 'Security'];

  const CATEGORIES = ['Malware', 'Phishing', 'Insider Threat', 'Data Breach', 'Cloud Security', 'Web Attack', 'Credential Theft', 'Privilege Escalation', 'Network Intrusion', 'Compliance Investigation', 'Threat Hunting', 'Digital Forensics'];
  const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
  const SEVERITIES = ['critical', 'high', 'medium', 'low', 'informational'];
  const STATUSES = ['New', 'Assigned', 'Investigating', 'Containment', 'Eradication', 'Recovery', 'Resolved', 'Closed', 'False Positive', 'Archived'];

  const SCENARIOS = [
    { title: 'Ransomware Outbreak — File Server Encryption', category: 'Malware' },
    { title: 'Business Email Compromise — Wire Fraud Attempt', category: 'Phishing' },
    { title: 'Credential Theft via LSASS Memory Access', category: 'Credential Theft' },
    { title: 'Suspicious PowerShell Abuse Across Multiple Hosts', category: 'Threat Hunting' },
    { title: 'Cloud Security — Misconfigured Storage Bucket', category: 'Cloud Security' },
    { title: 'Linux Server Compromise — Unauthorized SSH Access', category: 'Network Intrusion' },
    { title: 'Data Exfiltration to External Cloud Storage', category: 'Data Breach' },
    { title: 'Suspected APT Activity — Long-Dwell Espionage', category: 'Threat Hunting' },
    { title: 'Privilege Escalation via Unpatched Service', category: 'Privilege Escalation' },
    { title: 'Web Shell Discovered on Public-Facing Server', category: 'Web Attack' },
    { title: 'Supply Chain Compromise — Malicious Package', category: 'Malware' },
    { title: 'Insider Threat — Abnormal Data Access Pattern', category: 'Insider Threat' },
    { title: 'Phishing Campaign Targeting Finance Department', category: 'Phishing' },
    { title: 'Compliance Investigation — Unauthorized Access Review', category: 'Compliance Investigation' },
    { title: 'Digital Forensics — Post-Termination Device Review', category: 'Digital Forensics' },
  ];

  const MITRE_POOL = [
    { id: 'T1486', tactic: 'Impact', technique: 'Data Encrypted for Impact' },
    { id: 'T1566.001', tactic: 'Initial Access', technique: 'Phishing: Spearphishing Attachment' },
    { id: 'T1003', tactic: 'Credential Access', technique: 'OS Credential Dumping' },
    { id: 'T1059.001', tactic: 'Execution', technique: 'Command and Scripting Interpreter: PowerShell' },
    { id: 'T1078.004', tactic: 'Initial Access', technique: 'Valid Accounts: Cloud Accounts' },
    { id: 'T1021.002', tactic: 'Lateral Movement', technique: 'Remote Services: SMB/Windows Admin Shares' },
    { id: 'T1567.002', tactic: 'Exfiltration', technique: 'Exfiltration Over Web Service: Cloud Storage' },
    { id: 'T1068', tactic: 'Privilege Escalation', technique: 'Exploitation for Privilege Escalation' },
    { id: 'T1190', tactic: 'Initial Access', technique: 'Exploit Public-Facing Application' },
    { id: 'T1195.002', tactic: 'Initial Access', technique: 'Compromise Software Supply Chain' },
    { id: 'T1213', tactic: 'Collection', technique: 'Data from Information Repositories' },
  ];
  const MITRE_DETAIL = {
    'T1486': { detectionLogic: 'Mass file modification/encryption detected by EDR.', mitigation: 'Maintain offline backups; deploy ransomware behavior blocking.', references: 'https://attack.mitre.org/techniques/T1486/' },
    'T1566.001': { detectionLogic: 'Email gateway sandbox detonation flags malicious attachment.', mitigation: 'User awareness training; attachment sandboxing.', references: 'https://attack.mitre.org/techniques/T1566/001/' },
    'T1003': { detectionLogic: 'EDR detects LSASS memory access from non-standard process.', mitigation: 'Enable LSASS protection (Credential Guard).', references: 'https://attack.mitre.org/techniques/T1003/' },
    'T1059.001': { detectionLogic: 'Script block logging flags encoded/obfuscated commands.', mitigation: 'Constrained Language Mode; restrict PowerShell execution policy.', references: 'https://attack.mitre.org/techniques/T1059/001/' },
    'T1078.004': { detectionLogic: 'Cloud audit log shows impossible-travel admin login.', mitigation: 'Conditional access policies; enforce MFA on all cloud accounts.', references: 'https://attack.mitre.org/techniques/T1078/004/' },
    'T1021.002': { detectionLogic: 'Unusual authentication pattern across hosts in short window.', mitigation: 'Network segmentation; restrict admin share access.', references: 'https://attack.mitre.org/techniques/T1021/002/' },
    'T1567.002': { detectionLogic: 'DLP/CASB flags large outbound transfer to unsanctioned storage.', mitigation: 'Block unsanctioned cloud storage domains; DLP policies.', references: 'https://attack.mitre.org/techniques/T1567/002/' },
    'T1068': { detectionLogic: 'Unexpected privilege token assignment in audit logs.', mitigation: 'Timely patch management; least-privilege enforcement.', references: 'https://attack.mitre.org/techniques/T1068/' },
    'T1190': { detectionLogic: 'WAF logs show exploitation attempt matching known CVE signature.', mitigation: 'Patch public-facing applications; WAF virtual patching.', references: 'https://attack.mitre.org/techniques/T1190/' },
    'T1195.002': { detectionLogic: 'Integrity check failure on software update package.', mitigation: 'Verify package signatures; SBOM monitoring.', references: 'https://attack.mitre.org/techniques/T1195/002/' },
    'T1213': { detectionLogic: 'DLP flags abnormal volume of sensitive file access by one user.', mitigation: 'Access reviews; behavior analytics (UEBA).', references: 'https://attack.mitre.org/techniques/T1213/' },
  };

  const EVIDENCE_TYPES = ['Memory Dump', 'Disk Image', 'PCAP', 'Email', 'Log File', 'Screenshot', 'Registry Export', 'Hash', 'File'];
  const PLACEHOLDER_TYPES = new Set(['Memory Dump', 'Disk Image', 'PCAP']);

  const HOSTNAMES = ['WIN-SRV-001', 'LNX-SRV-002', 'DC-003', 'WS-004', 'LT-006', 'MAC-007', 'AZ-VM-019', 'EC2-020', 'FW-023', 'WS-036', 'LT-030'];

  function _hash(n, mod) {
    let x = (n ^ 0x9e3779b9) >>> 0;
    x = Math.imul(x ^ (x >>> 16), 2246822519) >>> 0;
    x = Math.imul(x ^ (x >>> 13), 3266489917) >>> 0;
    x = (x ^ (x >>> 16)) >>> 0;
    return x % Math.max(1, mod);
  }
  function _pad(n, len) { return String(n).padStart(len, '0'); }
  function _dateOffset(days) { return new Date(Date.now() - days * 86400000); }
  function _fmtDate(d) { return d.toISOString().slice(0, 10); }
  function _fmtDateTime(d) { return d.toISOString().slice(0, 16).replace('T', ' '); }

  const TASK_TITLES = ['Isolate affected host', 'Collect forensic evidence', 'Reset compromised credentials', 'Review firewall/proxy logs', 'Notify affected department', 'Validate backup integrity', 'Patch vulnerable service', 'Update detection rules', 'Interview affected user', 'Review cloud audit logs', 'Correlate related IOCs', 'Draft containment plan'];
  const TASK_COLUMNS = ['To Do', 'In Progress', 'Review', 'Completed'];

  function _buildCase(idx) {
    const scenario = SCENARIOS[idx % SCENARIOS.length];
    const num = idx + 1;
    const priority = PRIORITIES[_hash(idx * 3, idx % 9 === 0 ? 4 : 3)];
    const severity = SEVERITIES[_hash(idx * 5, idx % 11 === 0 ? 5 : 4)];
    const analyst = ANALYSTS[_hash(idx * 7, ANALYSTS.length)];
    const dept = DEPARTMENTS[_hash(idx * 11, DEPARTMENTS.length)];
    const status = STATUSES[_hash(idx * 13, STATUSES.length)];
    const isClosed = ['Resolved', 'Closed', 'Archived', 'False Positive'].includes(status);
    const ageDays = 2 + _hash(idx * 17, 90);
    const createdDate = _fmtDateTime(_dateOffset(ageDays));
    const updatedDate = _fmtDateTime(_dateOffset(isClosed ? Math.max(0, ageDays - 3 - _hash(idx * 19, 10)) : _hash(idx * 19, ageDays)));
    const dueDate = _fmtDate(_dateOffset(-3 - _hash(idx * 23, 14)));
    const riskScore = 20 + _hash(idx * 29, 79);
    const mitre = MITRE_POOL[_hash(idx * 31, MITRE_POOL.length)];
    const mitreDetail = MITRE_DETAIL[mitre.id] || {};

    const hostname = HOSTNAMES[_hash(idx * 37, HOSTNAMES.length)];
    const relatedIncidentHint = idx % 3 === 0 ? `INC-2026-${_pad(1000 + (idx % 50) + 1, 4)}` : null;
    const relatedAssetHint = hostname;
    const linkedIocIds = Array.from({ length: 1 + _hash(idx, 4) }, (_, i) => `IOC-${_pad(1 + _hash(idx * 41 + i, 500), 5)}`);

    // ── Tasks (Kanban) ──────────────────────────────────────────────────
    const taskCount = 4 + (idx % 4);
    const tasks = Array.from({ length: taskCount }, (_, i) => {
      const colWeight = isClosed ? [0, 1, 1, 8] : [3, 4, 2, 3];
      let col = 0, roll = _hash(idx * 43 + i, colWeight.reduce((a, b) => a + b, 0)), acc = 0;
      for (let c = 0; c < colWeight.length; c++) { acc += colWeight[c]; if (roll < acc) { col = c; break; } }
      const status2 = TASK_COLUMNS[col];
      const completion = status2 === 'Completed' ? 100 : status2 === 'Review' ? 80 + _hash(idx + i, 20) : status2 === 'In Progress' ? 20 + _hash(idx + i, 60) : _hash(idx + i, 15);
      return {
        id: `task-${num}-${i}`, title: TASK_TITLES[_hash(idx * 47 + i, TASK_TITLES.length)],
        description: `Complete as part of the ${scenario.category.toLowerCase()} investigation workflow.`,
        priority: PRIORITIES[_hash(idx + i, 4)], owner: ANALYSTS[_hash(idx * 53 + i, ANALYSTS.length)],
        dueDate: _fmtDate(_dateOffset(-1 - i)), status: status2, completion,
        checklist: [
          { text: 'Confirm scope', done: completion > 20 }, { text: 'Document findings', done: completion > 60 }, { text: 'Peer review', done: completion >= 100 },
        ],
      };
    });

    // ── Timeline ────────────────────────────────────────────────────────
    const created = _dateOffset(ageDays);
    const timelineSteps = [
      { event: 'Case Created', detail: `${scenario.title} logged as a new case.`, hrs: 0 },
      { event: 'Analyst Assigned', detail: `Assigned to ${analyst}.`, hrs: 1 },
      { event: 'Investigation Started', detail: 'Initial scoping and triage began.', hrs: 2 },
      { event: 'Evidence Added', detail: 'Initial evidence collected and logged.', hrs: 6 },
      { event: 'IOC Linked', detail: 'Related indicators correlated from the IOC database.', hrs: 8 },
    ];
    if (['Containment', 'Eradication', 'Recovery', 'Resolved', 'Closed', 'Archived'].includes(status)) timelineSteps.push({ event: 'Containment', detail: 'Affected systems isolated and access restricted.', hrs: 12 });
    if (['Recovery', 'Resolved', 'Closed', 'Archived'].includes(status)) timelineSteps.push({ event: 'Recovery', detail: 'Systems restored to normal operation and validated.', hrs: 30 });
    if (isClosed) timelineSteps.push({ event: 'Case Closed', detail: 'Investigation concluded and case archived.', hrs: 40 });
    const timeline = timelineSteps.map(s => ({ time: _fmtDateTime(new Date(created.getTime() + s.hrs * 3600000)), event: s.event, detail: s.detail }));

    // ── Evidence ────────────────────────────────────────────────────────
    const evidenceCount = 2 + (idx % 4);
    const evidence = Array.from({ length: evidenceCount }, (_, i) => {
      const type = EVIDENCE_TYPES[_hash(idx * 59 + i, EVIDENCE_TYPES.length)];
      return {
        id: `evd-${num}-${i}`, type, name: `${type.replace(/\s/g, '_').toLowerCase()}_case${num}_${i}`,
        collectedBy: analyst, collectedDate: createdDate,
        note: PLACEHOLDER_TYPES.has(type) ? '[PLACEHOLDER] Simulated reference only — upload not implemented in this offline demo.' : 'Collected and logged during investigation.',
        custodyLog: [{ by: analyst, date: createdDate, action: 'Collected', notes: 'Initial evidence intake.' }],
      };
    });

    // ── Notes ───────────────────────────────────────────────────────────
    const notes = [{ author: analyst, date: createdDate, text: `Initial assessment: ${scenario.title.toLowerCase()} affecting ${hostname}. Investigation underway.` }];
    if (isClosed) notes.push({ author: analyst, date: updatedDate, text: 'Case closed. Root cause identified and remediated; recommendations logged for follow-up.' });

    // ── Reports meta (placeholders — generated on demand in the module) ──
    const recommendations = [
      `Tune detection rules for ${mitre.technique} to reduce time-to-detect in future incidents.`,
      `Review and patch systems susceptible to the ${scenario.category.toLowerCase()} vector observed in this case.`,
    ];
    const lessonsLearned = isClosed ? `Post-incident review completed. Key gap identified: ${mitreDetail.mitigation ? mitreDetail.mitigation.toLowerCase() : 'control coverage for this technique should be improved.'}` : '';

    return {
      id: `CASE-2026-${_pad(1000 + num, 4)}`,
      title: scenario.title, description: `Security case tracking investigation into ${scenario.title.toLowerCase()}, affecting ${hostname} in the ${dept} department.`,
      priority, severity, category: scenario.category, status,
      owner: analyst, assignedAnalyst: analyst, department: dept,
      businessImpact: severity === 'critical' ? 'High — significant potential operational or reputational impact.' : severity === 'high' ? 'Moderate — limited scope, prompt remediation required.' : 'Low — contained impact with minimal disruption.',
      riskScore, createdDate, updatedDate, dueDate, resolutionDate: isClosed ? updatedDate : null,
      relatedIncidentHint, relatedAssetHint, linkedIocIds,
      mitre: { ...mitre, ...mitreDetail },
      tasks, timeline, evidence, notes,
      recommendations, lessonsLearned,
    };
  }

  const cases = Array.from({ length: 100 }, (_, i) => _buildCase(i));

  function getCase(id) { return cases.find(c => c.id === id) || null; }

  return { cases, CATEGORIES, PRIORITIES, SEVERITIES, STATUSES, ANALYSTS, DEPARTMENTS, TASK_COLUMNS, MITRE_POOL, EVIDENCE_TYPES, getCase };

})();

window.SampleCaseData = SampleCaseData;
