/**
 * KHAN SECURITY SOLUTIONS ENTERPRISE
 * Enterprise AI Security Assistant — Sample Dataset v1.9.0
 *
 * [EDUCATIONAL SIMULATION — 100% offline. No external AI API is called.
 *  Every response below (or generated from these templates at runtime) is
 *  a pre-written / deterministically assembled simulation, clearly labeled
 *  "Demonstration Mode (Offline AI Simulation)" in the UI.]
 *
 * Consumed by: assets/js/modules/ai-assistant.js
 */

const SampleAIData = (() => {

  // ── Deterministic PRNG (mulberry32) ──────────────────────────────────
  function _mulberry32(seed) {
    return function () { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const rand = _mulberry32(190726);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];

  // ── Welcome-screen example questions ─────────────────────────────────
  const EXAMPLE_QUESTIONS = [
    "Summarise today's incidents",
    'Explain MITRE T1059',
    'Generate executive report',
    'Investigate IOC 192.168.10.55',
    'Explain this phishing email',
    'Show critical assets',
    'Create SOC investigation checklist',
  ];

  // ── Smart (slash) commands ───────────────────────────────────────────
  const SMART_COMMANDS = [
    { cmd: '/summary',  desc: 'Cross-module security posture summary' },
    { cmd: '/incidents', desc: 'List open incidents from Incident Response' },
    { cmd: '/assets',   desc: 'Show critical / at-risk assets' },
    { cmd: '/iocs',     desc: 'Show recent indicators of compromise' },
    { cmd: '/cases',    desc: 'List active cases from Case Manager' },
    { cmd: '/reports',  desc: 'List recent reports from the Reporting Center' },
    { cmd: '/help',     desc: 'Open the Help Center' },
    { cmd: '/search',   desc: 'Search across the whole platform' },
    { cmd: '/settings', desc: 'Open Assistant settings' },
    { cmd: '/mitre',    desc: 'Look up a MITRE ATT&CK technique, e.g. /mitre T1059' },
    { cmd: '/threats',  desc: 'Summarise tracked threat actors and campaigns' },
  ];

  // ── Prompt library ────────────────────────────────────────────────────
  const PROMPT_LIBRARY = [
    { category: 'SOC Investigation', prompts: [
      'Summarise today\'s incidents',
      'What are the highest severity alerts right now?',
      'Walk me through triaging a new alert',
      'What should I check first during a shift handover?',
    ] },
    { category: 'Incident Response', prompts: [
      'Create SOC investigation checklist',
      'What are the phases of incident response?',
      'How do I contain a compromised host?',
      'Draft a post-incident review outline',
    ] },
    { category: 'Threat Hunting', prompts: [
      'Give me threat hunting advice for lateral movement',
      'How do I hunt for persistence mechanisms?',
      'What data sources are best for hunting C2 traffic?',
    ] },
    { category: 'Malware Analysis', prompts: [
      'Explain static vs dynamic malware analysis',
      'What does a YARA rule match tell me?',
      'Summarise the malware samples on file',
    ] },
    { category: 'Executive Reporting', prompts: [
      'Generate executive report',
      'Summarise this month\'s security posture for leadership',
      'What is our current risk index?',
    ] },
    { category: 'Risk Assessment', prompts: [
      'Show critical assets',
      'What are our biggest exposure gaps right now?',
      'Explain asset criticality scoring',
    ] },
    { category: 'Compliance Review', prompts: [
      'Give me a compliance overview',
      'Summarise our NIST CSF coverage',
      'What CIS Controls need attention?',
    ] },
    { category: 'Security Awareness', prompts: [
      'Explain this phishing email',
      'Give me awareness training tips for new hires',
      'What makes a strong password policy?',
    ] },
  ];

  // ── Knowledge Base cards ──────────────────────────────────────────────
  const KNOWLEDGE_BASE = [
    { id: 'kb-mitre', title: 'MITRE ATT&CK', category: 'Frameworks', icon: 'target',
      summary: 'A globally accessible knowledge base of adversary tactics and techniques based on real-world observations.',
      body: 'MITRE ATT&CK organizes adversary behavior into Tactics (the "why") and Techniques (the "how"), spanning Initial Access through Impact. Use it to map detections, close visibility gaps, and communicate threats in a common vocabulary. This platform\'s DFIR and Incident Response modules tag records with ATT&CK technique IDs where relevant.' },
    { id: 'kb-nist', title: 'NIST Cybersecurity Framework', category: 'Frameworks', icon: 'shield',
      summary: 'Govern, Identify, Protect, Detect, Respond, and Recover — a risk-based approach to managing cybersecurity.',
      body: 'The NIST CSF 2.0 organizes cybersecurity outcomes into six functions: Govern, Identify, Protect, Detect, Respond, and Recover. It is technology-neutral and widely used to benchmark program maturity and communicate risk posture to leadership.' },
    { id: 'kb-cis', title: 'CIS Controls', category: 'Frameworks', icon: 'check',
      summary: 'A prioritized set of safeguards to mitigate the most common cyber attacks against systems and networks.',
      body: 'The CIS Critical Security Controls are grouped into Implementation Groups (IG1–IG3) by organizational maturity. They start with foundational hygiene — asset inventory, secure configuration, and data protection — before layering in more advanced controls.' },
    { id: 'kb-owasp', title: 'OWASP Top 10', category: 'Frameworks', icon: 'bug',
      summary: 'The most critical web application security risks, updated periodically by the OWASP community.',
      body: 'The OWASP Top 10 (2021 edition) leads with Broken Access Control, Cryptographic Failures, and Injection. It\'s a standard reference for secure development training and application security reviews.' },
    { id: 'kb-zerotrust', title: 'Zero Trust', category: 'Architecture', icon: 'key',
      summary: '"Never trust, always verify" — no implicit trust is granted based on network location alone.',
      body: 'Zero Trust architecture assumes breach and verifies every request as though it originates from an open network — continuously validating identity, device posture, and least-privilege access rather than relying on perimeter defenses alone.' },
    { id: 'kb-killchain', title: 'Cyber Kill Chain', category: 'Frameworks', icon: 'flag',
      summary: 'A 7-stage model of an intrusion: Recon, Weaponization, Delivery, Exploitation, Installation, C2, Actions on Objectives.',
      body: 'Originally developed by Lockheed Martin, the Kill Chain helps defenders reason about where in an attack lifecycle a detection or control applies. Breaking any single link can stop the intrusion, though modern defenders often pair it with ATT&CK for finer-grained technique mapping.' },
    { id: 'kb-soc', title: 'SOC Concepts', category: 'Operations', icon: 'server',
      summary: 'Core building blocks of a Security Operations Center: triage, escalation, playbooks, and metrics.',
      body: 'A mature SOC balances detection coverage, analyst workflow, and measurable outcomes — commonly tracked via MTTD (Mean Time To Detect) and MTTR (Mean Time To Respond). Tiered analyst models (L1 triage → L2 investigation → L3 hunting/engineering) are common.' },
    { id: 'kb-cloud', title: 'Cloud Security', category: 'Domains', icon: 'globe',
      summary: 'Shared responsibility, identity-centric controls, and misconfiguration as the leading cloud risk.',
      body: 'Cloud security shifts emphasis from network perimeter to identity and configuration. The shared responsibility model means the provider secures the cloud, while the customer secures what they put in it — most cloud breaches trace back to misconfiguration or over-permissioned identities.' },
    { id: 'kb-linux', title: 'Linux Security', category: 'Domains', icon: 'server',
      summary: 'Hardening, logging, and common persistence mechanisms on Linux hosts.',
      body: 'Key Linux security practices include minimizing SUID binaries, auditing cron jobs and systemd timers for persistence, centralizing auditd/syslog output, and applying SELinux/AppArmor mandatory access controls where supported.' },
    { id: 'kb-windows', title: 'Windows Security', category: 'Domains', icon: 'server',
      summary: 'Event logging, LOLBins, and Active Directory hardening fundamentals.',
      body: 'Windows environments benefit from enabling Sysmon and forwarding Security/PowerShell event logs, watching for living-off-the-land binaries (LOLBins) like certutil or rundll32 used for malicious purposes, and hardening Active Directory (tiered admin model, LAPS, disabling legacy protocols).' },
    { id: 'kb-identity', title: 'Identity Security', category: 'Domains', icon: 'key',
      summary: 'MFA, privileged access management, and identity as the new perimeter.',
      body: 'With cloud and remote work, identity has become the primary security boundary. Strong identity security combines phishing-resistant MFA, just-in-time privileged access, regular access reviews, and monitoring for anomalous authentication patterns.' },
  ];

  // ── MITRE technique lookup (small offline reference) ──────────────────
  const MITRE_LIBRARY = {
    'T1059': { name: 'Command and Scripting Interpreter', tactic: 'Execution', desc: 'Adversaries abuse command and script interpreters (PowerShell, cmd, bash, Python, etc.) to execute commands, scripts, or binaries.' },
    'T1566': { name: 'Phishing', tactic: 'Initial Access', desc: 'Adversaries send phishing messages to gain access to victim systems, often via malicious attachments or links.' },
    'T1078': { name: 'Valid Accounts', tactic: 'Defense Evasion / Persistence', desc: 'Adversaries use legitimate credentials to maintain access and blend in with normal activity, evading detection.' },
    'T1105': { name: 'Ingress Tool Transfer', tactic: 'Command and Control', desc: 'Adversaries transfer tools or files from an external system into a compromised environment.' },
    'T1027': { name: 'Obfuscated Files or Information', tactic: 'Defense Evasion', desc: 'Adversaries obfuscate content to make it harder for defenses and analysts to discover or analyze.' },
    'T1041': { name: 'Exfiltration Over C2 Channel', tactic: 'Exfiltration', desc: 'Adversaries steal data by exfiltrating it over an existing command-and-control channel.' },
    'T1486': { name: 'Data Encrypted for Impact', tactic: 'Impact', desc: 'Adversaries encrypt data on target systems to interrupt availability, typically for ransomware extortion.' },
    'T1112': { name: 'Modify Registry', tactic: 'Defense Evasion', desc: 'Adversaries modify the Windows Registry to hide configuration information or establish persistence.' },
    'T1021': { name: 'Remote Services', tactic: 'Lateral Movement', desc: 'Adversaries use valid accounts to log into remote services (RDP, SSH, SMB) for lateral movement.' },
    'T1071': { name: 'Application Layer Protocol', tactic: 'Command and Control', desc: 'Adversaries blend C2 traffic into normal application-layer protocols (HTTP/S, DNS) to avoid detection.' },
  };

  // ── Curated high-quality answers for the 7 welcome-screen examples ────
  // (paired with the exact welcome prompts above; live counts are filled
  //  in by ai-assistant.js at render time using {{token}} placeholders.)
  const CURATED_RESPONSES = {
    "Summarise today's incidents": `**Incident Summary — Offline Demonstration**

Based on Incident Response module data:
- {{openIncidents}} open incidents, {{criticalIncidents}} marked critical
- Most common category: {{topIncidentCategory}}
- Average time in "Investigating" status: elevated versus target MTTR

**Recommended next step:** review the highest-severity incident first in Incident Response, then cross-check any related indicators in IOC Manager.`,
    'Explain MITRE T1059': `**T1059 — Command and Scripting Interpreter**

- **Tactic:** Execution
- **Summary:** Adversaries abuse command and script interpreters (PowerShell, cmd.exe, bash, Python, JavaScript, etc.) to execute commands, scripts, or binaries during an intrusion.
- **Why it matters:** It's one of the most commonly observed techniques because nearly every OS ships with a scripting interpreter — making it a high-value detection target.
- **Detection ideas:** Log full command-line auditing (Sysmon Event ID 1 / Security 4688), flag encoded PowerShell (\`-enc\`), and alert on interpreters spawned from unusual parent processes (e.g. Office apps).`,
    'Generate executive report': `**Executive Summary — Offline Demonstration**

| Metric | Value |
|---|---|
| Security Score | {{securityScore}} / 100 |
| Open Incidents | {{openIncidents}} |
| Critical Assets | {{criticalAssets}} |
| Risk Index | {{riskIndex}} / 100 |

Overall posture is stable with {{openIncidents}} incidents currently in progress. For a formatted, exportable version, open the **Reporting Center** and use the Report Builder wizard with the Executive Summary style.`,
    'Investigate IOC 192.168.10.55': `**IOC Lookup — 192.168.10.55 (Offline Demonstration)**

This address was not found in the current IOC Manager dataset, so this is a **simulated walkthrough** of the investigation steps you'd take:
1. Check **IOC Manager** for existing records on this IP.
2. Pivot to **SIEM / Log Analyzer** and filter firewall/network logs for this source or destination.
3. Cross-reference **Threat Intelligence** for any campaign or actor associated with this range.
4. If confirmed malicious, add it to IOC Manager with confidence and source, then link it to an incident.`,
    'Explain this phishing email': `**Phishing Triage Guide — Offline Demonstration**

I don't have a specific email attached, so here's the general triage checklist used by the Phishing Analyzer module:
- **Sender domain:** does it closely mimic a legitimate domain (typosquatting)?
- **Links:** hover to reveal the true destination before clicking anything.
- **Urgency/authority language:** "act now," "verify your account," impersonated executives.
- **Attachments:** unexpected invoices, macros-enabled documents.

Paste specific header or body text into the **Phishing Analyzer** module for a structured risk score.`,
    'Show critical assets': `**Critical Assets — Offline Demonstration**

- {{criticalAssets}} assets currently marked Critical criticality in Asset Inventory
- {{totalAssets}} total tracked assets platform-wide

**Recommended next step:** open **Asset Inventory** and filter by Criticality = Critical to review patch status and ownership for each one.`,
    'Create SOC investigation checklist': `**SOC Investigation Checklist — Offline Demonstration**

1. **Identify** — confirm the alert, gather initial context (host, user, time).
2. **Scope** — check related logs in SIEM, look for lateral movement or repeated activity.
3. **Correlate** — search IOC Manager and Threat Intelligence for known indicators.
4. **Contain** — isolate the affected host/account if malicious activity is confirmed.
5. **Escalate** — open an incident in Incident Response with severity and category.
6. **Document** — log every action in the incident timeline as you go, not after.
7. **Review** — once resolved, capture lessons learned for the post-incident review.`,
  };

  // ── Intent library (16 supported tasks from the spec) ─────────────────
  // Each intent has trigger keywords and a response template using
  // {{token}} placeholders resolved at runtime against live module data.
  const INTENTS = [
    { id: 'incident-summary', label: 'Incident Summary', keywords: ['incident', 'incidents', 'breach summary'],
      response: `**Incident Summary — Offline Demonstration**\n\n{{openIncidents}} open incidents are tracked in Incident Response, {{criticalIncidents}} of which are critical severity. The most common category right now is **{{topIncidentCategory}}**.\n\nOpen **Incident Response** to review individual records and timelines.` },
    { id: 'ioc-explanation', label: 'IOC Explanation', keywords: ['ioc', 'indicator', 'indicators of compromise'],
      response: `**IOC Overview — Offline Demonstration**\n\nAn Indicator of Compromise (IOC) is an artifact — a hash, IP, domain, or file — observed during an intrusion that can be used to detect similar activity elsewhere. IOC Manager currently tracks **{{iocCount}} indicators**.\n\nEach indicator carries a type, threat level, confidence, and source so you can weigh how strongly to act on it.` },
    { id: 'threat-actor', label: 'Threat Actor Summary', keywords: ['threat actor', 'apt', 'campaign', 'threat group'],
      response: `**Threat Actor Summary — Offline Demonstration**\n\nThreat Intelligence tracks **{{actorCount}} actor profiles**, each mapped to associated campaigns and MITRE ATT&CK techniques.\n\nOpen **Threat Intelligence** to review a specific actor's TTPs and related IOCs.` },
    { id: 'mitre-explanation', label: 'MITRE ATT&CK Explanation', keywords: ['mitre', 'att&ck', 'attack technique', 'technique t1', 't1'],
      response: null }, // handled specially (technique lookup) in ai-assistant.js
    { id: 'detection-rule', label: 'Detection Rule Explanation', keywords: ['detection rule', 'yara', 'sigma', 'correlation rule'],
      response: `**Detection Rule Guidance — Offline Demonstration**\n\nA good detection rule specifies: the data source (e.g. Sysmon Event ID 1), the exact condition (command-line pattern, hash match, or behavioral sequence), and an actionable severity. In this platform, YARA-style matches appear in the **Malware Lab**, and correlation-style logic is referenced in **SIEM**.` },
    { id: 'executive-report', label: 'Executive Report Summary', keywords: ['executive report', 'executive summary', 'leadership summary', 'board report'],
      response: `**Executive Summary — Offline Demonstration**\n\n| Metric | Value |\n|---|---|\n| Security Score | {{securityScore}} / 100 |\n| Open Incidents | {{openIncidents}} |\n| Critical Assets | {{criticalAssets}} |\n| Risk Index | {{riskIndex}} / 100 |\n\nFor a formatted, exportable version use the **Reporting Center**'s Report Builder wizard.` },
    { id: 'asset-risk', label: 'Asset Risk Summary', keywords: ['critical asset', 'asset risk', 'assets at risk', 'asset inventory'],
      response: `**Asset Risk Summary — Offline Demonstration**\n\n{{criticalAssets}} of {{totalAssets}} tracked assets are marked Critical criticality. Review **Asset Inventory** filtered by criticality and patch status to prioritize remediation.` },
    { id: 'case-summary', label: 'Case Summary', keywords: ['case', 'cases', 'case manager'],
      response: `**Case Summary — Offline Demonstration**\n\n{{caseCount}} cases are currently tracked in Case Manager. Each case organizes a Kanban task board, evidence, and cross-links to related incidents and IOCs.` },
    { id: 'best-practices', label: 'Security Best Practices', keywords: ['best practice', 'best practices', 'hardening'],
      response: `**Security Best Practices — Offline Demonstration**\n\n- Enforce MFA everywhere, prioritizing phishing-resistant methods.\n- Patch internet-facing and critical assets first.\n- Centralize logging and retain at least 90 days for investigations.\n- Apply least-privilege access and review it regularly.\n- Maintain and test an incident response plan.` },
    { id: 'ir-steps', label: 'Incident Response Steps', keywords: ['incident response steps', 'ir process', 'ir lifecycle', 'respond to an incident'],
      response: `**Incident Response Lifecycle — Offline Demonstration**\n\n1. Identification\n2. Containment\n3. Eradication\n4. Recovery\n5. Lessons Learned\n\nIn this platform, track each phase using the Incident Response module's status field and timeline.` },
    { id: 'threat-hunting', label: 'Threat Hunting Advice', keywords: ['threat hunt', 'threat hunting', 'hunting advice', 'hunt for'],
      response: `**Threat Hunting Advice — Offline Demonstration**\n\nStart from a hypothesis (e.g. "an actor is using T1059 for execution"), then search SIEM logs for supporting evidence, pivot into Asset Inventory to check exposure, and log any new indicators into IOC Manager as you confirm them.` },
    { id: 'soc-guidance', label: 'SOC Analyst Guidance', keywords: ['soc analyst', 'soc guidance', 'shift handover', 'triage alert'],
      response: `**SOC Analyst Guidance — Offline Demonstration**\n\nStart each shift on the Dashboard for situational awareness, triage the highest-severity alert first, and document your reasoning in the incident timeline as you go rather than after the fact.` },
    { id: 'blue-team', label: 'Blue Team Recommendations', keywords: ['blue team', 'defensive recommendation', 'detection coverage'],
      response: `**Blue Team Recommendations — Offline Demonstration**\n\nFocus detection engineering on the MITRE tactics with the lowest coverage first (see the Reporting Center's MITRE Coverage heat map), and validate new detections against recent SIEM log samples before rolling them out broadly.` },
    { id: 'password-rec', label: 'Password Recommendations', keywords: ['password', 'passphrase', 'credential policy'],
      response: `**Password Recommendations — Offline Demonstration**\n\nPrefer long passphrases (4+ random words) over complex-but-short passwords, enforce MFA everywhere it's supported, and check policy compliance using the **Password Toolkit**'s Policy Checker (NIST 800-63B template recommended).` },
    { id: 'awareness', label: 'Awareness Training Tips', keywords: ['awareness training', 'security awareness', 'phishing training'],
      response: `**Security Awareness Tips — Offline Demonstration**\n\nRun regular simulated phishing campaigns, keep training bite-sized and frequent rather than annual, and make it easy for employees to report suspicious emails with a single click.` },
    { id: 'compliance', label: 'Compliance Overview', keywords: ['compliance', 'nist csf', 'cis controls', 'pci', 'iso 27001', 'soc 2'],
      response: `**Compliance Overview — Offline Demonstration**\n\nThis platform references NIST CSF, CIS Controls, and OWASP Top 10 as the primary frameworks. Use the **Reporting Center**'s Compliance Reports category and the Knowledge Base's Frameworks section for details on each.` },
  ];

  // ── Generate 100 sample prompt/response pairs ────────────────────────
  const PROMPT_TEMPLATES = [
    { cat: 'SOC', q: (n) => `What should I prioritize during ${n}?`, a: (n) => `**SOC Guidance — Offline Demonstration**\n\nDuring ${n}, prioritize alerts by severity and asset criticality first, then cross-reference IOC Manager for known indicators before escalating.` },
    { cat: 'Threat Hunting', q: (n) => `How do I hunt for ${n}?`, a: (n) => `**Threat Hunting — Offline Demonstration**\n\nTo hunt for ${n}, start with a hypothesis, pull relevant SIEM log sources, and validate findings against Threat Intelligence before logging new IOCs.` },
    { cat: 'Incident Response', q: (n) => `What are the response steps for ${n}?`, a: (n) => `**Incident Response — Offline Demonstration**\n\nFor ${n}, follow Identification → Containment → Eradication → Recovery → Lessons Learned, documenting each step in the incident timeline.` },
    { cat: 'Executive Reporting', q: (n) => `Summarise ${n} for leadership`, a: (n) => `**Executive Summary — Offline Demonstration**\n\n${n} can be summarized using the current Security Score, open incident count, and risk index — available live in the Reporting Center's Executive Dashboard.` },
  ];
  const TOPIC_POOL = [
    'a ransomware alert', 'a phishing campaign', 'lateral movement activity', 'a brute-force attempt',
    'suspicious PowerShell execution', 'data exfiltration', 'a new critical CVE', 'an insider threat report',
    'command and control traffic', 'a compromised service account', 'unusual DNS activity', 'a malware detection',
    'privilege escalation attempts', 'a failed login spike', 'an unpatched critical asset', 'a supply-chain alert',
    'weekend on-call coverage', 'a high-severity vulnerability scan result', 'a new threat actor campaign',
    'an anomalous outbound connection', 'a suspicious scheduled task', 'credential stuffing activity',
    'a Kerberoasting attempt', 'unusual cloud IAM activity', 'a firewall rule change',
  ];

  function _generateSamplePairs() {
    const pairs = [];
    let n = 0;
    for (const topic of TOPIC_POOL) {
      for (const tpl of PROMPT_TEMPLATES) {
        n++;
        pairs.push({ id: `QA-${String(n).padStart(3, '0')}`, category: tpl.cat, prompt: tpl.q(topic), response: tpl.a(topic) });
        if (n >= 100) return pairs;
      }
    }
    return pairs;
  }
  const SAMPLE_QA = _generateSamplePairs();

  return {
    EXAMPLE_QUESTIONS,
    SMART_COMMANDS,
    PROMPT_LIBRARY,
    KNOWLEDGE_BASE,
    MITRE_LIBRARY,
    CURATED_RESPONSES,
    INTENTS,
    SAMPLE_QA,
  };
})();

window.SampleAIData = SampleAIData;
