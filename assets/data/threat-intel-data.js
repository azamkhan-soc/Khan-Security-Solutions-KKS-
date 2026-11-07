/**
 * KHAN SECURITY SOLUTIONS ENTERPRISE
 * Threat Intelligence Sample Dataset v0.6.0
 *
 * [EDUCATIONAL SIMULATION — 100% synthetic, offline data]
 * All actor names, campaigns, IOCs, and infrastructure below are fictional
 * and generated for demonstration purposes only. No real organizations,
 * IP addresses, or threat groups are represented. MITRE ATT&CK technique
 * IDs/names ARE the real public MITRE reference taxonomy (framework
 * metadata, not proprietary intel) — used here for realistic mapping.
 *
 * Consumed by: assets/js/modules/threat-intel.js
 */

const SampleThreatIntel = (() => {

  // ── Threat Actors (synthetic) ───────────────────────────────────────────
  const actors = [
    {
      id: 'actor-01', name: 'GHOSTSPIDER', aliases: ['Silent Orchid', 'UNC-9911'],
      type: 'Nation-state (simulated)', sophistication: 'High', motivation: 'Espionage',
      firstObserved: '2021-03', targetSectors: ['Government', 'Defense', 'Telecom'],
      targetRegions: ['Fictional-Region A', 'Fictional-Region B'],
      summary: 'Simulated advanced persistent actor known for long-dwell-time espionage operations using custom implants and living-off-the-land techniques.',
      techniques: ['T1566.001', 'T1059.001', 'T1053.005', 'T1055', 'T1071.001', 'T1041'],
      confidence: 92,
    },
    {
      id: 'actor-02', name: 'CRIMSON MAGPIE', aliases: ['Fin-Locker', 'TA-4482'],
      type: 'Financially motivated (simulated)', sophistication: 'Medium-High', motivation: 'Financial gain',
      firstObserved: '2022-07', targetSectors: ['Finance', 'Retail', 'Healthcare'],
      targetRegions: ['Global'],
      summary: 'Simulated ransomware-affiliated crew distributing loader malware via phishing, followed by double-extortion ransomware deployment.',
      techniques: ['T1566.002', 'T1204.002', 'T1486', 'T1490', 'T1567.002'],
      confidence: 87,
    },
    {
      id: 'actor-03', name: 'IRON SPARROW', aliases: ['Cobalt Nest'],
      type: 'Hacktivist (simulated)', sophistication: 'Medium', motivation: 'Ideological',
      firstObserved: '2023-01', targetSectors: ['Media', 'Government', 'Energy'],
      targetRegions: ['Fictional-Region C'],
      summary: 'Simulated hacktivist collective conducting DDoS and website defacement campaigns, with occasional data-leak operations for publicity.',
      techniques: ['T1498', 'T1491.001', 'T1594', 'T1213'],
      confidence: 74,
    },
    {
      id: 'actor-04', name: 'VOID LANTERN', aliases: ['APT-Ember', 'Shadow Kiln'],
      type: 'Nation-state (simulated)', sophistication: 'Very High', motivation: 'Espionage / Sabotage',
      firstObserved: '2019-11', targetSectors: ['Critical Infrastructure', 'Energy', 'Manufacturing'],
      targetRegions: ['Fictional-Region A', 'Fictional-Region D'],
      summary: 'Simulated top-tier actor with demonstrated ICS/OT targeting capability, custom zero-day tooling, and multi-stage supply-chain compromise history.',
      techniques: ['T1195.002', 'T1190', 'T1543.003', 'T1082', 'T1489', 'T1592'],
      confidence: 95,
    },
    {
      id: 'actor-05', name: 'PALE FERRET', aliases: ['Quiet Otter'],
      type: 'Cybercrime (simulated)', sophistication: 'Medium', motivation: 'Financial gain',
      firstObserved: '2022-02', targetSectors: ['SMB', 'Education', 'Retail'],
      targetRegions: ['Global'],
      summary: 'Simulated commodity malware operator distributing infostealers and access-broker services on underground forums.',
      techniques: ['T1566.001', 'T1555', 'T1071.001', 'T1552.001'],
      confidence: 80,
    },
    {
      id: 'actor-06', name: 'OBSIDIAN WREN', aliases: ['Night Loom', 'TA-7754'],
      type: 'Nation-state (simulated)', sophistication: 'High', motivation: 'Espionage',
      firstObserved: '2020-09', targetSectors: ['Diplomatic', 'NGO', 'Think Tanks'],
      targetRegions: ['Fictional-Region B', 'Fictional-Region C'],
      summary: 'Simulated actor specializing in spear-phishing against diplomatic and policy targets, using cloud services for C2 to blend with legitimate traffic.',
      techniques: ['T1566.001', 'T1102', 'T1027', 'T1140', 'T1105'],
      confidence: 88,
    },
  ];

  // ── Campaigns (synthetic) ───────────────────────────────────────────────
  const campaigns = [
    {
      id: 'camp-01', name: 'Operation Hollow Signal', actorId: 'actor-01',
      status: 'Active', startDate: '2025-11-02', endDate: null,
      severity: 'Critical',
      targetSectors: ['Government', 'Defense'],
      summary: 'Ongoing simulated spear-phishing campaign delivering a custom loader via malicious document macros, followed by a modular backdoor.',
      iocCount: 14,
    },
    {
      id: 'camp-02', name: 'Operation Iron Ledger', actorId: 'actor-02',
      status: 'Active', startDate: '2026-01-18', endDate: null,
      severity: 'Critical',
      targetSectors: ['Finance', 'Retail'],
      summary: 'Simulated ransomware campaign using a fake invoice-themed phishing lure to drop a loader, culminating in encryption and data-leak extortion.',
      iocCount: 11,
    },
    {
      id: 'camp-03', name: 'Operation Static Chorus', actorId: 'actor-04',
      status: 'Dormant', startDate: '2025-06-10', endDate: '2025-09-02',
      severity: 'High',
      targetSectors: ['Energy', 'Manufacturing'],
      summary: 'Simulated multi-stage supply-chain compromise targeting OT vendor update mechanisms; observed activity has been dormant for 4+ months.',
      iocCount: 9,
    },
    {
      id: 'camp-04', name: 'Operation Quiet Bazaar', actorId: 'actor-05',
      status: 'Active', startDate: '2026-03-05', endDate: null,
      severity: 'Medium',
      targetSectors: ['SMB', 'Education'],
      summary: 'Simulated commodity infostealer distribution via cracked-software lures and malvertising.',
      iocCount: 17,
    },
    {
      id: 'camp-05', name: 'Operation Glass Embassy', actorId: 'actor-06',
      status: 'Active', startDate: '2026-05-22', endDate: null,
      severity: 'High',
      targetSectors: ['Diplomatic', 'NGO'],
      summary: 'Simulated spear-phishing campaign against diplomatic staff using cloud-storage-hosted payloads to evade perimeter filtering.',
      iocCount: 8,
    },
    {
      id: 'camp-06', name: 'Operation Painted Static', actorId: 'actor-03',
      status: 'Concluded', startDate: '2025-02-14', endDate: '2025-04-01',
      severity: 'Medium',
      targetSectors: ['Media'],
      summary: 'Simulated hacktivist DDoS + defacement campaign against regional media outlets, concluded after infrastructure takedown.',
      iocCount: 6,
    },
  ];

  // ── IOC Feed (synthetic) ────────────────────────────────────────────────
  // type: ip | domain | url | hash | email
  const iocs = [
    { id: 'ioc-0001', type: 'ip',     value: '198.51.100.14',                         threatLevel: 'critical', confidence: 91, source: 'Internal Sensor Net',  actorId: 'actor-01', campaignId: 'camp-01', tags: ['c2', 'active'],            firstSeen: '2026-06-01', lastSeen: '2026-07-18' },
    { id: 'ioc-0002', type: 'domain', value: 'update-secure-portal.example',           threatLevel: 'critical', confidence: 89, source: 'Internal Sensor Net',  actorId: 'actor-01', campaignId: 'camp-01', tags: ['phishing', 'c2'],          firstSeen: '2026-06-03', lastSeen: '2026-07-20' },
    { id: 'ioc-0003', type: 'hash',   value: 'a3f5e9c2b1d4f6a8e0c3b5d7f9a1c3e5b7d9f1a3', threatLevel: 'critical', confidence: 94, source: 'Sandbox Detonation', actorId: 'actor-01', campaignId: 'camp-01', tags: ['loader'],                 firstSeen: '2026-06-02', lastSeen: '2026-07-15' },
    { id: 'ioc-0004', type: 'url',    value: 'hxxps://update-secure-portal.example/dl/inv.docm', threatLevel: 'high', confidence: 85, source: 'Email Gateway',   actorId: 'actor-01', campaignId: 'camp-01', tags: ['delivery'],               firstSeen: '2026-06-04', lastSeen: '2026-07-10' },
    { id: 'ioc-0005', type: 'ip',     value: '203.0.113.77',                          threatLevel: 'high',     confidence: 82, source: 'Threat Feed Sync',    actorId: 'actor-01', campaignId: 'camp-01', tags: ['staging'],                 firstSeen: '2026-05-20', lastSeen: '2026-06-30' },

    { id: 'ioc-0006', type: 'domain', value: 'invoice-ledger-secure.example',          threatLevel: 'critical', confidence: 90, source: 'Internal Sensor Net',  actorId: 'actor-02', campaignId: 'camp-02', tags: ['phishing'],               firstSeen: '2026-01-19', lastSeen: '2026-07-19' },
    { id: 'ioc-0007', type: 'hash',   value: 'b7d1f3e5a7c9b1d3f5a7c9e1b3d5f7a9c1e3b5d7', threatLevel: 'critical', confidence: 96, source: 'Sandbox Detonation', actorId: 'actor-02', campaignId: 'camp-02', tags: ['ransomware'],             firstSeen: '2026-01-22', lastSeen: '2026-07-18' },
    { id: 'ioc-0008', type: 'ip',     value: '192.0.2.201',                           threatLevel: 'critical', confidence: 88, source: 'Threat Feed Sync',    actorId: 'actor-02', campaignId: 'camp-02', tags: ['c2', 'exfil'],             firstSeen: '2026-01-25', lastSeen: '2026-07-17' },
    { id: 'ioc-0009', type: 'email',  value: 'billing-support@invoice-ledger-secure.example', threatLevel: 'high', confidence: 80, source: 'Email Gateway',   actorId: 'actor-02', campaignId: 'camp-02', tags: ['phishing'],               firstSeen: '2026-01-19', lastSeen: '2026-06-01' },
    { id: 'ioc-0010', type: 'hash',   value: 'c9e3a5b7d9f1c3e5a7b9d1f3e5a7c9b1d3f5a7e9', threatLevel: 'high',     confidence: 84, source: 'Sandbox Detonation', actorId: 'actor-02', campaignId: 'camp-02', tags: ['ransomware', 'dropper'],  firstSeen: '2026-02-02', lastSeen: '2026-05-10' },

    { id: 'ioc-0011', type: 'domain', value: 'vendor-firmware-update.example',         threatLevel: 'high',     confidence: 78, source: 'ICS-CERT Style Feed', actorId: 'actor-04', campaignId: 'camp-03', tags: ['supply-chain'],           firstSeen: '2025-06-11', lastSeen: '2025-09-01' },
    { id: 'ioc-0012', type: 'hash',   value: 'd1e3f5a7c9b1d3e5f7a9c1b3d5e7f9a1c3e5b7d9', threatLevel: 'high',     confidence: 90, source: 'Sandbox Detonation', actorId: 'actor-04', campaignId: 'camp-03', tags: ['implant', 'ot'],          firstSeen: '2025-06-15', lastSeen: '2025-08-28' },
    { id: 'ioc-0013', type: 'ip',     value: '198.51.100.240',                        threatLevel: 'medium',    confidence: 70, source: 'Threat Feed Sync',    actorId: 'actor-04', campaignId: 'camp-03', tags: ['c2', 'dormant'],           firstSeen: '2025-06-20', lastSeen: '2025-08-30' },

    { id: 'ioc-0014', type: 'domain', value: 'free-software-cracks.example',           threatLevel: 'medium',   confidence: 72, source: 'Internal Sensor Net',  actorId: 'actor-05', campaignId: 'camp-04', tags: ['malvertising'],           firstSeen: '2026-03-06', lastSeen: '2026-07-21' },
    { id: 'ioc-0015', type: 'hash',   value: 'e5f7a9c1b3d5e7f9a1c3b5d7e9f1a3c5b7d9f1e3', threatLevel: 'medium',   confidence: 76, source: 'Sandbox Detonation', actorId: 'actor-05', campaignId: 'camp-04', tags: ['infostealer'],            firstSeen: '2026-03-08', lastSeen: '2026-07-19' },
    { id: 'ioc-0016', type: 'ip',     value: '203.0.113.150',                         threatLevel: 'medium',    confidence: 68, source: 'Threat Feed Sync',    actorId: 'actor-05', campaignId: 'camp-04', tags: ['exfil'],                   firstSeen: '2026-03-10', lastSeen: '2026-07-05' },
    { id: 'ioc-0017', type: 'url',    value: 'hxxps://free-software-cracks.example/setup_x64.exe', threatLevel: 'medium', confidence: 74, source: 'Web Proxy Log', actorId: 'actor-05', campaignId: 'camp-04', tags: ['delivery'],               firstSeen: '2026-03-09', lastSeen: '2026-06-30' },

    { id: 'ioc-0018', type: 'domain', value: 'docs-share-cloudstore.example',          threatLevel: 'high',     confidence: 83, source: 'Internal Sensor Net',  actorId: 'actor-06', campaignId: 'camp-05', tags: ['c2', 'cloud-abuse'],       firstSeen: '2026-05-23', lastSeen: '2026-07-20' },
    { id: 'ioc-0019', type: 'hash',   value: 'f1a3c5e7b9d1f3a5c7e9b1d3f5a7c9e1b3d5f7a9', threatLevel: 'high',     confidence: 86, source: 'Sandbox Detonation', actorId: 'actor-06', campaignId: 'camp-05', tags: ['backdoor'],               firstSeen: '2026-05-24', lastSeen: '2026-07-16' },
    { id: 'ioc-0020', type: 'email',  value: 'protocol-office@docs-share-cloudstore.example', threatLevel: 'high', confidence: 79, source: 'Email Gateway',   actorId: 'actor-06', campaignId: 'camp-05', tags: ['phishing'],               firstSeen: '2026-05-23', lastSeen: '2026-06-28' },

    { id: 'ioc-0021', type: 'domain', value: 'press-freedom-alerts.example',           threatLevel: 'low',      confidence: 55, source: 'OSINT Sweep',        actorId: 'actor-03', campaignId: 'camp-06', tags: ['defacement'],             firstSeen: '2025-02-15', lastSeen: '2025-03-30' },
    { id: 'ioc-0022', type: 'ip',     value: '192.0.2.90',                            threatLevel: 'low',       confidence: 52, source: 'OSINT Sweep',        actorId: 'actor-03', campaignId: 'camp-06', tags: ['ddos-infra'],             firstSeen: '2025-02-16', lastSeen: '2025-03-28' },

    { id: 'ioc-0023', type: 'hash',   value: '01a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4', threatLevel: 'low',      confidence: 48, source: 'Threat Feed Sync',   actorId: null,        campaignId: null,      tags: ['unattributed'],           firstSeen: '2026-04-11', lastSeen: '2026-04-20' },
    { id: 'ioc-0024', type: 'ip',     value: '198.51.100.9',                          threatLevel: 'low',       confidence: 40, source: 'Threat Feed Sync',    actorId: null,        campaignId: null,      tags: ['scanning'],                firstSeen: '2026-07-01', lastSeen: '2026-07-19' },
    { id: 'ioc-0025', type: 'domain', value: 'test-mailer-relay.example',              threatLevel: 'low',      confidence: 44, source: 'Email Gateway',      actorId: null,        campaignId: null,      tags: ['spam'],                    firstSeen: '2026-07-05', lastSeen: '2026-07-21' },
  ];

  // ── MITRE ATT&CK Techniques Referenced (real public taxonomy) ──────────
  const mitreTechniques = [
    { id: 'T1566.001', name: 'Phishing: Spearphishing Attachment', tactic: 'Initial Access' },
    { id: 'T1566.002', name: 'Phishing: Spearphishing Link',       tactic: 'Initial Access' },
    { id: 'T1190',     name: 'Exploit Public-Facing Application',  tactic: 'Initial Access' },
    { id: 'T1195.002', name: 'Compromise Software Supply Chain',   tactic: 'Initial Access' },
    { id: 'T1594',     name: 'Search Victim-Owned Websites',       tactic: 'Reconnaissance' },
    { id: 'T1592',     name: 'Gather Victim Host Information',     tactic: 'Reconnaissance' },
    { id: 'T1204.002', name: 'User Execution: Malicious File',     tactic: 'Execution' },
    { id: 'T1059.001', name: 'Command and Scripting: PowerShell',  tactic: 'Execution' },
    { id: 'T1543.003', name: 'Create/Modify System Process: Windows Service', tactic: 'Persistence' },
    { id: 'T1053.005', name: 'Scheduled Task/Job: Scheduled Task', tactic: 'Persistence' },
    { id: 'T1055',     name: 'Process Injection',                 tactic: 'Defense Evasion' },
    { id: 'T1027',     name: 'Obfuscated Files or Information',   tactic: 'Defense Evasion' },
    { id: 'T1140',     name: 'Deobfuscate/Decode Files',           tactic: 'Defense Evasion' },
    { id: 'T1552.001', name: 'Unsecured Credentials: Credentials In Files', tactic: 'Credential Access' },
    { id: 'T1555',     name: 'Credentials from Password Stores',  tactic: 'Credential Access' },
    { id: 'T1082',     name: 'System Information Discovery',      tactic: 'Discovery' },
    { id: 'T1213',     name: 'Data from Information Repositories', tactic: 'Collection' },
    { id: 'T1071.001', name: 'Application Layer Protocol: Web Traffic', tactic: 'Command and Control' },
    { id: 'T1105',     name: 'Ingress Tool Transfer',              tactic: 'Command and Control' },
    { id: 'T1102',     name: 'Web Service',                        tactic: 'Command and Control' },
    { id: 'T1041',     name: 'Exfiltration Over C2 Channel',       tactic: 'Exfiltration' },
    { id: 'T1567.002', name: 'Exfil Over Web Service: Cloud Storage', tactic: 'Exfiltration' },
    { id: 'T1486',     name: 'Data Encrypted for Impact',          tactic: 'Impact' },
    { id: 'T1490',     name: 'Inhibit System Recovery',             tactic: 'Impact' },
    { id: 'T1489',     name: 'Service Stop',                        tactic: 'Impact' },
    { id: 'T1498',     name: 'Network Denial of Service',           tactic: 'Impact' },
    { id: 'T1491.001', name: 'Defacement: Internal Defacement',    tactic: 'Impact' },
  ];

  const TACTIC_ORDER = [
    'Reconnaissance', 'Initial Access', 'Execution', 'Persistence',
    'Defense Evasion', 'Credential Access', 'Discovery', 'Collection',
    'Command and Control', 'Exfiltration', 'Impact',
  ];

  // ── Helpers ──────────────────────────────────────────────────────────────
  function getActor(id)    { return actors.find(a => a.id === id) || null; }
  function getCampaign(id) { return campaigns.find(c => c.id === id) || null; }

  return { actors, campaigns, iocs, mitreTechniques, TACTIC_ORDER, getActor, getCampaign };

})();

window.SampleThreatIntel = SampleThreatIntel;
