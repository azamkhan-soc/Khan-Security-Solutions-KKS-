/**
 * KHAN SECURITY SOLUTIONS ENTERPRISE
 * Portfolio Data — Source of Truth
 *
 * All content here is taken directly from the uploaded resume
 * (Mohammad Azam Khan — Cybersecurity / SOC Analyst).
 * No fabricated employers, certifications, or experience.
 * Update this file to change portfolio content — do not hardcode
 * personal data inside portfolio.js.
 */

const PortfolioData = {

  // ── Identity ────────────────────────────────────────────────────────────
  profile: {
    name:        'Mohammad Azam Khan',
    initials:    'MK',
    tagline:     'SOC Analyst · Blue Team Defense · Threat Detection & Incident Response',
    subtagline:  'CompTIA Security+ Certified',
    location:    'Lucknow, Uttar Pradesh, India 226061',
    email:       'azamkhan730768@gmail.com',
    phone:       '+91 73076 86974',
    availability: 'Open to: Remote · International · Hybrid · Shift Work · Visa-Sponsorship Ready',
    cgpa:        '8.17',
    cgpaScale:   '10.00',
    certCount:   6,
    projectCount: 4,
    socials: {
      linkedin: 'https://linkedin.com/in/mohammad-azam-khan-soc',
      github:   'https://github.com/azamkhan-soc',
      tryhackme:'https://tryhackme.com/p/azamkhan730768',
    }
  },

  // ── Professional Summary ───────────────────────────────────────────────
  summary: `CompTIA Security+ certified Cybersecurity Analyst and B.Tech Computer Science student (CGPA 8.17) with demonstrated SOC operations experience in SIEM monitoring, threat detection, log analysis, and incident response across enterprise-simulated environments. Proficient in Splunk, Wireshark, MITRE ATT&CK, and Linux-based security workflows, backed by 6 industry certifications including Let's Defend SOC Level 1, TryHackMe SOC Path, Google Cybersecurity Professional, and Microsoft SC-900. Currently pursuing SC-200 (Microsoft Security Operations Analyst) to deepen cloud-native detection capabilities with Microsoft Sentinel and Defender XDR. Actively seeking SOC Analyst, Tier 1 Security Analyst, Threat Detection, or Blue Team roles — remote, hybrid, or international.`,

  careerObjective: `To contribute as a SOC Analyst in a security operations environment where I can apply hands-on experience in SIEM monitoring, threat detection, and incident response — while continuing to develop advanced detection engineering and cloud security skills through Microsoft SC-200 and real-world blue team practice.`,

  // ── Hero badges ─────────────────────────────────────────────────────────
  heroBadges: [
    { label: 'Available Now',     type: 'success' },
    { label: 'Security+ Certified', type: 'primary' },
    { label: 'SOC Analyst',       type: 'info' },
    { label: 'Blue Team',         type: 'primary' },
    { label: 'Threat Detection',  type: 'warning' },
  ],

  // ── Certifications ──────────────────────────────────────────────────────
  // status: 'certified' | 'in-progress' | 'completed'
  certifications: [
    {
      id: 'sec-plus',
      name: 'CompTIA Security+ (SY0-701)',
      issuer: 'CompTIA',
      status: 'certified',
      description: 'Threats & Attacks, Architecture, Implementation, Operations, GRC',
      skills: ['Threat Analysis', 'Security Architecture', 'GRC', 'Operations'],
    },
    {
      id: 'sc-200',
      name: 'SC-200: Microsoft Security Operations Analyst',
      issuer: 'Microsoft',
      status: 'in-progress',
      description: 'Microsoft Sentinel, Defender XDR, KQL, threat hunting & incident management',
      skills: ['Microsoft Sentinel', 'Defender XDR', 'KQL', 'Threat Hunting'],
    },
    {
      id: 'lets-defend',
      name: 'SOC Analyst Certified — Level 1',
      issuer: "Let's Defend",
      status: 'certified',
      description: 'Real-world SOC alert triage, malware analysis & incident documentation',
      skills: ['Alert Triage', 'Malware Analysis', 'Incident Documentation'],
    },
    {
      id: 'thm-soc',
      name: 'TryHackMe SOC Level 1 Path',
      issuer: 'TryHackMe',
      status: 'completed',
      description: 'Alert triage, phishing investigation, SIEM operations & threat intelligence',
      skills: ['Phishing Investigation', 'SIEM Operations', 'Threat Intel'],
    },
    {
      id: 'google-cyber',
      name: 'Google Cybersecurity Professional Certificate',
      issuer: 'Google / Coursera',
      status: 'certified',
      description: 'Linux, MySQL, Python scripting, network security & incident response',
      skills: ['Linux', 'MySQL', 'Python', 'Network Security'],
    },
    {
      id: 'sc-900',
      name: 'Microsoft Certified: SC-900',
      issuer: 'Microsoft',
      status: 'certified',
      description: 'Security, Compliance & Identity Fundamentals — Azure AD, IAM, compliance frameworks, Microsoft Sentinel concepts',
      skills: ['Azure AD', 'IAM', 'Compliance', 'Sentinel Concepts'],
    },
    {
      id: 'ms-cyber-analyst',
      name: 'Microsoft Cybersecurity Analyst Professional Certificate',
      issuer: 'Microsoft / Coursera',
      status: 'certified',
      description: 'Threat detection, cloud security operations, incident response',
      skills: ['Threat Detection', 'Cloud Security', 'Incident Response'],
    },
    {
      id: 'tcs-forage',
      name: 'Tata Cybersecurity Analyst Job Simulation',
      issuer: 'Forage / TCS',
      status: 'completed',
      date: 'Dec 2024',
      description: 'IAM strategy, RBAC design & cybersecurity documentation',
      skills: ['IAM Strategy', 'RBAC Design', 'Documentation'],
    },
  ],

  // ── Skills (Core Competencies) ──────────────────────────────────────────
  // level is illustrative self-assessment (1-5), clearly labeled as such in UI
  skillCategories: [
    {
      category: 'Security Operations',
      skills: [
        { name: 'SIEM Operations (Splunk)',        level: 4 },
        { name: 'Incident Detection & Response',   level: 4 },
        { name: 'Threat Hunting & Analysis',        level: 3 },
        { name: 'Alert Triage & Escalation',         level: 4 },
        { name: 'Log & Event Analysis',              level: 4 },
        { name: 'MITRE ATT&CK Framework',            level: 4 },
      ]
    },
    {
      category: 'Network & Threat Analysis',
      skills: [
        { name: 'Wireshark / Network Security',     level: 4 },
        { name: 'Phishing & Malware Analysis',        level: 3 },
        { name: 'Vulnerability Management',           level: 3 },
        { name: 'IDS / IPS Concepts',                  level: 3 },
        { name: 'Detection Engineering (basics)',      level: 2 },
      ]
    },
    {
      category: 'Identity, Cloud & Systems',
      skills: [
        { name: 'Identity & Access Mgmt (IAM)',      level: 3 },
        { name: 'Linux Administration (CLI)',          level: 4 },
        { name: 'SQL / MySQL',                          level: 3 },
        { name: 'Microsoft Azure (SC-900 / SC-200)',   level: 3 },
        { name: 'Python (basic scripting)',             level: 2 },
      ]
    },
  ],

  // ── Tools & Platforms ────────────────────────────────────────────────────
  toolCategories: [
    { category: 'SIEM & Detection', tools: ['Splunk (Free Tier)', 'Microsoft Sentinel (learning)', 'Wazuh (familiar)'] },
    { category: 'Network Analysis', tools: ['Wireshark', 'tcpdump', 'Nmap (basics)'] },
    { category: 'Threat Intelligence', tools: ['VirusTotal', 'ANY.RUN', 'CyberChef', 'MITRE ATT&CK Navigator'] },
    { category: 'SOC Platforms', tools: ["Let's Defend", 'TryHackMe', 'Hack The Box (learning)'] },
    { category: 'OS & Scripting', tools: ['Linux CLI (proficient)', 'Windows', 'Python (basic)', 'Bash'] },
    { category: 'Databases', tools: ['MySQL', 'SQL query-based log analysis'] },
    { category: 'Cloud & Identity', tools: ['Microsoft Azure (SC-900 / SC-200)', 'Azure AD / Entra ID', 'RBAC / IAM'] },
    { category: 'Frameworks', tools: ['MITRE ATT&CK', 'NIST CSF', 'Cyber Kill Chain', 'CIA Triad', 'ISO 27001 (awareness)'] },
  ],

  // ── Projects / SOC Simulations ───────────────────────────────────────────
  // Clearly labeled as simulations/labs per resume — never presented as production deployments.
  projects: [
    {
      id: 'ir-siem',
      title: 'Incident Response & SIEM Log Analysis',
      type: 'SOC Simulation',
      tools: ['Splunk', 'Wireshark', 'SOC Playbooks'],
      points: [
        'Executed end-to-end incident response simulations — triaged 50+ mock security alerts, performed packet capture analysis, and produced formal incident documentation following SOC L1 playbook methodology, achieving a simulated 40% reduction in mean-time-to-detect.',
        'Correlated multi-source log events in Splunk; classified True Positive / False Positive alerts and escalated confirmed incidents per SOC L1 escalation procedures — demonstrating structured threat detection workflow.',
      ],
    },
    {
      id: 'phishing-ioc',
      title: 'Phishing Campaign Analysis & IOC Extraction',
      type: 'SOC Simulation',
      tools: ['TryHackMe', 'CyberChef', 'MITRE ATT&CK', 'Threat Intelligence'],
      points: [
        'Investigated 10+ simulated phishing campaigns — extracted Indicators of Compromise (IOCs) including malicious URLs, suspicious email headers, and payload hashes; correlated against threat intelligence feeds using VirusTotal and ANY.RUN.',
        'Mapped attack patterns to MITRE ATT&CK techniques (T1566.001 Spearphishing Attachment, T1078 Valid Accounts); produced formal analyst reports detailing attack vectors, IOCs, and recommended remediation for each campaign.',
      ],
      mitreTechniques: ['T1566.001', 'T1078'],
    },
    {
      id: 'linux-hardening',
      title: 'Linux Hardening, Vulnerability Assessment & Access Controls',
      type: 'SOC Simulation',
      tools: ['Linux CLI', 'SQL', 'CIS Benchmarks'],
      points: [
        'Performed basic vulnerability assessments across Linux environments; implemented file-system access controls, configured user permission hierarchies, and audited sudo access logs to identify privilege escalation risks.',
        'Applied CIS Benchmark standards to harden Linux systems — identified and remediated misconfigurations; used SQL queries to analyse security logs and detect anomalous database activity patterns.',
      ],
    },
    {
      id: 'iam-strategy',
      title: 'IAM Strategy Design — Enterprise Simulation',
      type: 'Forage Job Simulation (Tata/TCS)',
      tools: ['RBAC', 'IAM', 'Least Privilege'],
      points: [
        'Delivered comprehensive Identity & Access Management (IAM) documentation for a simulated TCS enterprise consulting engagement, aligning cybersecurity controls with business objectives and regulatory requirements.',
        'Designed Role-Based Access Control (RBAC) policies, least-privilege access frameworks, and onboarding/offboarding security workflows for a multi-team environment — demonstrating GRC-aligned security planning.',
      ],
    },
  ],

  // ── Professional Experience ──────────────────────────────────────────────
  experience: [
    {
      id: 'vivekananda',
      title: 'Office Receptionist / IT Support Associate',
      employer: 'Vivekananda Trade Test Center',
      location: 'Deoria, Uttar Pradesh, India',
      period: '2023',
      points: [
        'Provided Tier-1 IT support with a security-first mindset — managed user access requests, enforced data confidentiality protocols, and resolved 15+ technical issues monthly with zero data incidents recorded.',
        'Maintained audit-ready client records with strict data accuracy and confidentiality controls — directly applicable to security documentation and chain-of-custody practices in SOC environments.',
        'Coordinated scheduling between engineers and clients, demonstrating professional stakeholder communication, prioritisation under pressure, and organisational efficiency.',
        'Delivered first-line hardware and software troubleshooting for staff, reducing operational disruptions and building foundational IT operations experience relevant to SOC tooling administration.',
      ],
    },
  ],

  // ── Education ─────────────────────────────────────────────────────────────
  education: [
    {
      id: 'integral-btech',
      degree: 'Bachelor of Technology (B.Tech) in Computer Science',
      status: 'Currently Pursuing',
      institution: 'Integral University, Lucknow, India',
      period: '2024 – Present',
      expectedGraduation: '2028',
      cgpa: '8.17 / 10.00',
      detail: '3rd Semester Completed · Specialisation: Cybersecurity & Network Security',
    },
  ],

  // ── Timeline (chronological, built from resume facts) ────────────────────
  timeline: [
    { year: '2023', title: 'IT Support Associate', org: 'Vivekananda Trade Test Center', type: 'work',
      desc: 'Began career in Tier-1 IT support with a security-first mindset.' },
    { year: '2024', title: 'B.Tech Computer Science Begins', org: 'Integral University, Lucknow', type: 'education',
      desc: 'Started B.Tech, specialising in Cybersecurity & Network Security.' },
    { year: '2024', title: 'Tata Cybersecurity Analyst Job Simulation', org: 'Forage / TCS', type: 'cert',
      desc: 'Completed IAM strategy and RBAC design simulation — December 2024.' },
    { year: '2024–25', title: 'SOC Path & Certifications', org: "TryHackMe · Let's Defend · Google · Microsoft", type: 'cert',
      desc: "Completed TryHackMe SOC Level 1, Let's Defend SOC Analyst L1, Google Cybersecurity Professional, and Microsoft SC-900." },
    { year: '2025', title: 'CompTIA Security+ Certified', org: 'CompTIA', type: 'cert',
      desc: 'Achieved Security+ (SY0-701) certification, validating core security knowledge.' },
    { year: 'Now', title: 'Pursuing SC-200', org: 'Microsoft', type: 'cert',
      desc: 'Currently working toward Microsoft Security Operations Analyst certification.' },
  ],

  // ── Resume file reference ─────────────────────────────────────────────────
  resume: {
    filename: 'Mohammad_Azam_Khan_Cybersecurity.pdf',
    // Path is relative to index.html; module copies the uploaded resume into assets/ on build.
    path: 'assets/resume/Mohammad_Azam_Khan_Cybersecurity.pdf',
  },
};

window.PortfolioData = PortfolioData;
