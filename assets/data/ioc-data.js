/**
 * KHAN SECURITY SOLUTIONS ENTERPRISE
 * Enterprise IOC Manager — Sample Dataset v1.3.0
 *
 * [EDUCATIONAL SIMULATION — 100% synthetic, offline data]
 * All IOC values, campaigns, and associations below are fictional and
 * generated deterministically for demonstration purposes only.
 * Threat actor NAMES (APT28, APT29, Lazarus, FIN7, LockBit, BlackCat,
 * Emotet, QakBot, Cobalt Strike, TrickBot) are real, publicly reported
 * threat group / malware family names used for realistic demonstration —
 * the specific IOC values, campaigns, and detections attributed to them
 * here are entirely synthetic, not actual reported indicators.
 * MITRE ATT&CK technique IDs/names ARE the real public framework taxonomy.
 *
 * Consumed by: assets/js/modules/ioc-manager.js
 */

const SampleIOCData = (() => {

  const THREAT_ACTORS = ['APT28', 'APT29', 'Lazarus', 'FIN7', 'LockBit', 'BlackCat', 'Emotet', 'QakBot', 'Cobalt Strike', 'TrickBot'];
  const CAMPAIGNS_BY_ACTOR = {
    APT28: ['Operation Fancy Signal'], APT29: ['Operation Cozy Ledger'], Lazarus: ['Operation Hidden Cobra Echo'],
    FIN7: ['Operation Carbanak Reflex'], LockBit: ['Operation Locked Vault'], BlackCat: ['Operation Alpha Cipher'],
    Emotet: ['Operation Botnet Relay'], QakBot: ['Operation Quiet Loader'], 'Cobalt Strike': ['Operation Beacon Nest'], TrickBot: ['Operation Trick Relay'],
  };
  const SOURCES = ['Threat Intelligence', 'Incident Response', 'Phishing Investigation', 'Malware Analysis', 'Manual Entry', 'SIEM Detection', 'DFIR', 'Imported Feed'];
  const CATEGORIES = ['C2 Infrastructure', 'Delivery', 'Persistence', 'Credential Theft', 'Exfiltration', 'Ransomware Payload', 'Reconnaissance', 'Phishing Infrastructure'];
  const THREAT_LEVELS = ['critical', 'high', 'medium', 'low', 'informational'];
  const CONFIDENCE_LEVELS = ['High', 'Medium', 'Low', 'Unknown'];
  const STATUSES = ['Active', 'Under Review', 'Resolved', 'Archived'];
  const INDUSTRIES = ['Finance', 'Government', 'Healthcare', 'Energy', 'Technology', 'Manufacturing', 'Retail'];
  const COUNTRIES = ['United States', 'United Kingdom', 'Germany', 'Ukraine', 'South Korea', 'Australia', 'Canada'];

  const MITRE_POOL = [
    { id: 'T1566.001', tactic: 'Initial Access', technique: 'Phishing: Spearphishing Attachment' },
    { id: 'T1059.001', tactic: 'Execution', technique: 'Command and Scripting Interpreter: PowerShell' },
    { id: 'T1053.005', tactic: 'Persistence', technique: 'Scheduled Task/Job: Scheduled Task' },
    { id: 'T1055', tactic: 'Defense Evasion', technique: 'Process Injection' },
    { id: 'T1003', tactic: 'Credential Access', technique: 'OS Credential Dumping' },
    { id: 'T1071.001', tactic: 'Command and Control', technique: 'Application Layer Protocol: Web Traffic' },
    { id: 'T1041', tactic: 'Exfiltration', technique: 'Exfiltration Over C2 Channel' },
    { id: 'T1486', tactic: 'Impact', technique: 'Data Encrypted for Impact' },
    { id: 'T1021.002', tactic: 'Lateral Movement', technique: 'Remote Services: SMB/Windows Admin Shares' },
    { id: 'T1082', tactic: 'Discovery', technique: 'System Information Discovery' },
    { id: 'T1105', tactic: 'Command and Control', technique: 'Ingress Tool Transfer' },
    { id: 'T1027', tactic: 'Defense Evasion', technique: 'Obfuscated Files or Information' },
  ];

  const CVE_POOL = ['CVE-2021-44228', 'CVE-2023-23397', 'CVE-2021-34527', 'CVE-2022-30190', 'CVE-2020-1472', 'CVE-2019-0708', 'CVE-2024-3400'];

  // ── IOC types with their generator + emoji-free label ───────────────────
  const TYPES = ['IPv4', 'IPv6', 'Domain', 'Subdomain', 'URL', 'Email Address', 'SHA256', 'SHA1', 'MD5', 'Filename', 'Registry Key', 'File Path', 'Mutex', 'Process Name', 'YARA Rule', 'Sigma Rule', 'Certificate'];

  function _hash(n, mod) {
    let x = (n ^ 0x9e3779b9) >>> 0;
    x = Math.imul(x ^ (x >>> 16), 2246822519) >>> 0;
    x = Math.imul(x ^ (x >>> 13), 3266489917) >>> 0;
    x = (x ^ (x >>> 16)) >>> 0;
    return x % Math.max(1, mod);
  }
  function _pad(n, len) { return String(n).padStart(len, '0'); }
  function _hex(seed, len) { return Array.from({ length: len }, (_, i) => '0123456789abcdef'[_hash(seed + i * 17, 16)]).join(''); }
  function _dateOffset(days) { return new Date(Date.now() - days * 86400000); }
  function _fmtDate(d) { return d.toISOString().slice(0, 10); }

  const MAL_WORDS = ['loader', 'stager', 'dropper', 'implant', 'beacon', 'relay', 'harvester', 'stealer', 'payload', 'agent'];
  const PROC_NAMES = ['svch0st', 'winIogon', 'rundll64', 'explorer_helper', 'conh0st', 'taskhostw2', 'lsass_mon'];

  function _genValue(type, idx, actor) {
    const h = idx;
    switch (type) {
      case 'IPv4': return `${45 + _hash(h, 180)}.${_hash(h * 2, 255)}.${_hash(h * 3, 255)}.${1 + _hash(h * 4, 254)}`;
      case 'IPv6': return `fe80::${_hex(h, 4)}:${_hex(h + 1, 4)}`;
      case 'Domain': return `${actor.toLowerCase().replace(/\s/g, '')}-${MAL_WORDS[_hash(h, MAL_WORDS.length)]}-${_hash(h, 9999)}.example`;
      case 'Subdomain': return `cdn${_hash(h, 99)}.${actor.toLowerCase().replace(/\s/g, '')}-relay-${_hash(h, 999)}.example`;
      case 'URL': return `https://${actor.toLowerCase().replace(/\s/g, '')}-${MAL_WORDS[_hash(h, MAL_WORDS.length)]}-${_hash(h, 9999)}.example/${['gate.php', 'update.bin', 'panel/login', 'c2/beacon', 'drop/payload.exe'][_hash(h, 5)]}`;
      case 'Email Address': return `${['support', 'billing', 'admin', 'noreply', 'security'][_hash(h, 5)]}${_hash(h, 999)}@${actor.toLowerCase().replace(/\s/g, '')}-mail-${_hash(h, 999)}.example`;
      case 'SHA256': return _hex(h * 7, 64);
      case 'SHA1': return _hex(h * 11, 40);
      case 'MD5': return _hex(h * 13, 32);
      case 'Filename': return `${MAL_WORDS[_hash(h, MAL_WORDS.length)]}_${_hash(h, 9999)}.${['exe', 'dll', 'scr', 'bat', 'ps1'][_hash(h, 5)]}`;
      case 'Registry Key': return `HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\${actor.replace(/\s/g, '')}Update${_hash(h, 999)}`;
      case 'File Path': return `C:\\Users\\*\\AppData\\Local\\Temp\\${MAL_WORDS[_hash(h, MAL_WORDS.length)]}_${_hash(h, 9999)}.exe`;
      case 'Mutex': return `Global\\${actor.replace(/\s/g, '')}_Mutex_${_hex(h, 12)}`;
      case 'Process Name': return `${PROC_NAMES[_hash(h, PROC_NAMES.length)]}${_hash(h, 99)}.exe`;
      case 'YARA Rule': return `rule Detect_${actor.replace(/\s/g, '_')}_${_hash(h, 999)} { meta: actor = "${actor}" strings: $s1 = "${_hex(h, 8)}" condition: $s1 }`;
      case 'Sigma Rule': return `title: Suspicious ${actor} ${MAL_WORDS[_hash(h, MAL_WORDS.length)]} Activity — Rule #${_hash(h, 9999)}`;
      case 'Certificate': return `SHA1 Fingerprint: ${_hex(h * 17, 40).toUpperCase()}, CN=${actor.replace(/\s/g, '')}-${_hash(h, 999)}.example`;
      default: return `unknown-${h}`;
    }
  }

  function _buildIOC(idx) {
    const type = TYPES[idx % TYPES.length];
    const actor = THREAT_ACTORS[_hash(idx * 3, THREAT_ACTORS.length)];
    const campaign = CAMPAIGNS_BY_ACTOR[actor][0];
    const threatLevel = THREAT_LEVELS[_hash(idx * 5, idx % 13 === 0 ? 5 : 4)];
    const confidence = CONFIDENCE_LEVELS[_hash(idx * 7, idx % 5 === 0 ? 4 : 3)];
    const source = SOURCES[_hash(idx * 11, SOURCES.length)];
    const category = CATEGORIES[_hash(idx * 13, CATEGORIES.length)];
    const status = STATUSES[_hash(idx * 17, STATUSES.length)];
    const mitre = MITRE_POOL[_hash(idx * 19, MITRE_POOL.length)];
    const addedDaysAgo = _hash(idx * 23, 180);
    const dateAdded = _fmtDate(_dateOffset(addedDaysAgo));
    const firstSeen = _fmtDate(_dateOffset(addedDaysAgo + _hash(idx, 30)));
    const lastSeen = _fmtDate(_dateOffset(Math.max(0, addedDaysAgo - _hash(idx * 29, Math.max(1, Math.min(addedDaysAgo, 20))))));
    const detectionCount = 1 + _hash(idx * 31, 40);
    const num = idx + 1;

    const value = _genValue(type, idx, actor);

    const malwareFamilies = { Emotet: 'Emotet', QakBot: 'QakBot', TrickBot: 'TrickBot', LockBit: 'LockBit Ransomware', BlackCat: 'BlackCat/ALPHV Ransomware' };
    const cves = idx % 6 === 0 ? [CVE_POOL[_hash(idx, CVE_POOL.length)]] : [];

    const timeline = [
      { date: dateAdded, event: 'IOC Created', detail: `Indicator added via ${source}.` },
      { date: firstSeen, event: 'First Seen', detail: `Initial detection associated with ${actor}.` },
      { date: lastSeen, event: 'Last Seen', detail: `Most recent detection event recorded.` },
    ];
    if (status === 'Resolved' || status === 'Archived') timeline.push({ date: _fmtDate(_dateOffset(Math.max(0, addedDaysAgo - 25))), event: status === 'Resolved' ? 'Resolved' : 'Archived', detail: status === 'Resolved' ? 'Threat neutralized and indicator confirmed inactive.' : 'Indicator archived after extended inactivity.' });

    const relatedIncidentHint = idx % 4 === 0 ? `INC-2026-${_pad(1000 + (idx % 50) + 1, 4)}` : null;
    const relatedAssetHint = idx % 5 === 0 ? ['WIN-SRV-001', 'LNX-SRV-002', 'DC-003', 'WS-004', 'FW-023'][_hash(idx, 5)] : null;

    return {
      id: `IOC-${_pad(num, 5)}`,
      type, value, threatLevel, confidence, source, category,
      threatActor: actor, campaign, mitre, dateAdded, firstSeen, lastSeen, status,
      detectionCount,
      description: `${type} indicator associated with ${actor} activity, first observed via ${source.toLowerCase()} during ${campaign}.`,
      threatContext: {
        threatActor: actor, campaign, malwareFamily: malwareFamilies[actor] || `${actor}-associated tooling`,
        associatedCves: cves, knownTtps: [mitre.technique],
        affectedIndustries: [INDUSTRIES[_hash(idx, INDUSTRIES.length)], INDUSTRIES[_hash(idx * 2, INDUSTRIES.length)]].filter((v, i, a) => a.indexOf(v) === i),
        countries: [COUNTRIES[_hash(idx * 3, COUNTRIES.length)]],
      },
      relatedIncidentHint, relatedAssetHint,
      timeline,
      tags: [actor, category, type],
      notes: idx % 6 === 0 ? [{ author: 'A. Khan', date: dateAdded, text: `Corroborated with ${source.toLowerCase()} findings; confidence set to ${confidence.toLowerCase()}.` }] : [],
    };
  }

  const iocs = Array.from({ length: 500 }, (_, i) => _buildIOC(i));

  function getIOC(id) { return iocs.find(i => i.id === id) || null; }

  return { iocs, TYPES, THREAT_ACTORS, THREAT_LEVELS, CONFIDENCE_LEVELS, SOURCES, CATEGORIES, STATUSES, MITRE_POOL, getIOC };

})();

window.SampleIOCData = SampleIOCData;
