/**
 * KHAN SECURITY SOLUTIONS ENTERPRISE
 * Network Security Toolkit — Sample Dataset v0.7.0
 *
 * [EDUCATIONAL SIMULATION — 100% synthetic, offline data]
 * DNS records, WHOIS records, host/port profiles, and packet captures below
 * are fictional. No live DNS, WHOIS, or network queries are ever performed.
 * OSI / TCP-IP reference tables and the common-ports list ARE standard
 * public networking reference material.
 *
 * Consumed by: assets/js/modules/network-tools.js
 */

const SampleNetworkData = (() => {

  // ── Offline DNS Zone (simulated resolver) ──────────────────────────────
  const dnsZone = {
    'khansecurity.example': {
      A:     ['203.0.113.10'],
      AAAA:  ['2001:db8::10'],
      MX:    ['10 mail.khansecurity.example'],
      NS:    ['ns1.khansecurity.example', 'ns2.khansecurity.example'],
      TXT:   ['v=spf1 include:_spf.khansecurity.example ~all'],
      CNAME: [],
    },
    'mail.khansecurity.example':      { A: ['203.0.113.11'], AAAA: [], MX: [], NS: [], TXT: [], CNAME: [] },
    'ns1.khansecurity.example':       { A: ['203.0.113.20'], AAAA: [], MX: [], NS: [], TXT: [], CNAME: [] },
    'ns2.khansecurity.example':       { A: ['203.0.113.21'], AAAA: [], MX: [], NS: [], TXT: [], CNAME: [] },
    'portal.khansecurity.example':    { A: [], AAAA: [], MX: [], NS: [], TXT: [], CNAME: ['khansecurity.example'] },
    'update-secure-portal.example':   { A: ['198.51.100.14'], AAAA: [], MX: [], NS: [], TXT: [], CNAME: [] },
    'invoice-ledger-secure.example':  { A: ['192.0.2.201'], AAAA: [], MX: [], NS: [], TXT: [], CNAME: [] },
    'docs-share-cloudstore.example':  { A: ['198.51.100.55'], AAAA: [], MX: [], NS: [], TXT: [], CNAME: [] },
  };

  // ── Offline WHOIS Records (simulated placeholder — NOT live) ───────────
  const whoisRecords = {
    'khansecurity.example': {
      domain: 'khansecurity.example', registrar: 'Example Registrar Inc. (simulated)',
      created: '2020-04-11', updated: '2026-03-02', expires: '2027-04-11',
      status: ['clientTransferProhibited'], nameServers: ['ns1.khansecurity.example', 'ns2.khansecurity.example'],
      registrantOrg: 'Redacted for Privacy (simulated)',
    },
    'update-secure-portal.example': {
      domain: 'update-secure-portal.example', registrar: 'Budget Domains Ltd. (simulated)',
      created: '2026-05-28', updated: '2026-05-28', expires: '2027-05-28',
      status: ['clientHold'], nameServers: ['ns1.fastdns.example', 'ns2.fastdns.example'],
      registrantOrg: 'Redacted for Privacy (simulated)',
    },
  };

  // ── Simulated Host Profiles (for Port Scanner) ──────────────────────────
  const hostProfiles = {
    '203.0.113.10': {
      hostname: 'khansecurity.example', os: 'Linux 5.x (simulated fingerprint)',
      ports: [
        { port: 22,  proto: 'tcp', state: 'open',     service: 'ssh',    banner: 'OpenSSH 9.2 (simulated)' },
        { port: 80,  proto: 'tcp', state: 'open',     service: 'http',   banner: 'nginx/1.25 (simulated)' },
        { port: 443, proto: 'tcp', state: 'open',     service: 'https',  banner: 'nginx/1.25 (simulated)' },
        { port: 25,  proto: 'tcp', state: 'filtered', service: 'smtp',   banner: '' },
        { port: 3306,proto: 'tcp', state: 'closed',   service: 'mysql',  banner: '' },
      ],
    },
    '198.51.100.14': {
      hostname: 'update-secure-portal.example', os: 'Windows Server (simulated fingerprint)',
      ports: [
        { port: 80,  proto: 'tcp', state: 'open',   service: 'http',    banner: 'Apache/2.4 (simulated)' },
        { port: 443, proto: 'tcp', state: 'open',   service: 'https',   banner: 'Apache/2.4 (simulated)' },
        { port: 445, proto: 'tcp', state: 'open',   service: 'smb',     banner: '' },
        { port: 3389,proto: 'tcp', state: 'open',   service: 'rdp',     banner: '' },
        { port: 8080,proto: 'tcp', state: 'filtered', service: 'http-proxy', banner: '' },
      ],
    },
    '192.0.2.201': {
      hostname: 'invoice-ledger-secure.example', os: 'Linux 4.x (simulated fingerprint)',
      ports: [
        { port: 22, proto: 'tcp', state: 'open', service: 'ssh', banner: 'OpenSSH 7.4 (simulated, outdated)' },
        { port: 443, proto: 'tcp', state: 'open', service: 'https', banner: 'nginx/1.18 (simulated)' },
        { port: 6379, proto: 'tcp', state: 'open', service: 'redis', banner: 'Redis 5.0 — no auth (simulated finding)' },
      ],
    },
  };

  const commonPorts = [
    { port: 20,   service: 'FTP (Data)' },       { port: 21,   service: 'FTP (Control)' },
    { port: 22,   service: 'SSH' },               { port: 23,   service: 'Telnet' },
    { port: 25,   service: 'SMTP' },              { port: 53,   service: 'DNS' },
    { port: 67,   service: 'DHCP (Server)' },     { port: 68,   service: 'DHCP (Client)' },
    { port: 80,   service: 'HTTP' },              { port: 110,  service: 'POP3' },
    { port: 123,  service: 'NTP' },               { port: 143,  service: 'IMAP' },
    { port: 161,  service: 'SNMP' },              { port: 389,  service: 'LDAP' },
    { port: 443,  service: 'HTTPS' },             { port: 445,  service: 'SMB' },
    { port: 465,  service: 'SMTPS' },             { port: 587,  service: 'SMTP (Submission)' },
    { port: 993,  service: 'IMAPS' },             { port: 995,  service: 'POP3S' },
    { port: 1433, service: 'MS SQL Server' },     { port: 3306, service: 'MySQL' },
    { port: 3389, service: 'RDP' },               { port: 5432, service: 'PostgreSQL' },
    { port: 5900, service: 'VNC' },               { port: 6379, service: 'Redis' },
    { port: 8080, service: 'HTTP Proxy / Alt' },  { port: 8443, service: 'HTTPS Alt' },
    { port: 27017,service: 'MongoDB' },
  ];

  // ── Simulated Packet Capture (offline, static sample) ───────────────────
  const packetCapture = [
    { no: 1, time: '0.000000', src: '10.0.0.15',     dst: '203.0.113.10',   proto: 'TCP', len: 66,  info: '51322 → 443 [SYN] Seq=0 Win=64240' },
    { no: 2, time: '0.021342', src: '203.0.113.10',  dst: '10.0.0.15',      proto: 'TCP', len: 66,  info: '443 → 51322 [SYN, ACK] Seq=0 Ack=1' },
    { no: 3, time: '0.021501', src: '10.0.0.15',     dst: '203.0.113.10',   proto: 'TCP', len: 60,  info: '51322 → 443 [ACK] Seq=1 Ack=1' },
    { no: 4, time: '0.022980', src: '10.0.0.15',     dst: '203.0.113.10',   proto: 'TLSv1.3', len: 583, info: 'Client Hello' },
    { no: 5, time: '0.045110', src: '203.0.113.10',  dst: '10.0.0.15',      proto: 'TLSv1.3', len: 1466, info: 'Server Hello, Certificate, Finished' },
    { no: 6, time: '0.046200', src: '10.0.0.15',     dst: '203.0.113.10',   proto: 'TLSv1.3', len: 126, info: 'Finished, Application Data' },
    { no: 7, time: '0.312445', src: '10.0.0.15',     dst: '198.51.100.14',  proto: 'DNS', len: 78,  info: 'Standard query A update-secure-portal.example' },
    { no: 8, time: '0.334120', src: '198.51.100.14', dst: '10.0.0.15',      proto: 'DNS', len: 94,  info: 'Standard query response A 198.51.100.14' },
    { no: 9, time: '0.501223', src: '10.0.0.15',     dst: '198.51.100.14',  proto: 'HTTP', len: 421, info: 'GET /dl/inv.docm HTTP/1.1' },
    { no: 10,time: '0.522018', src: '198.51.100.14', dst: '10.0.0.15',      proto: 'HTTP', len: 1298,info: 'HTTP/1.1 200 OK (application/octet-stream)' },
  ];

  // ── OSI Reference Model (public reference) ───────────────────────────────
  const osiLayers = [
    { n: 7, name: 'Application', desc: 'End-user protocols — HTTP, FTP, DNS, SMTP.', pdu: 'Data', examples: 'HTTP, HTTPS, DNS, SMTP, FTP' },
    { n: 6, name: 'Presentation', desc: 'Translation, encryption, compression.', pdu: 'Data', examples: 'TLS/SSL, JPEG, ASCII' },
    { n: 5, name: 'Session', desc: 'Establishes, manages, terminates sessions.', pdu: 'Data', examples: 'NetBIOS, RPC, PPTP' },
    { n: 4, name: 'Transport', desc: 'End-to-end delivery, segmentation, flow control.', pdu: 'Segment', examples: 'TCP, UDP' },
    { n: 3, name: 'Network', desc: 'Logical addressing and routing between networks.', pdu: 'Packet', examples: 'IP, ICMP, OSPF' },
    { n: 2, name: 'Data Link', desc: 'Physical addressing, framing, error detection on a link.', pdu: 'Frame', examples: 'Ethernet, ARP, Wi-Fi (802.11)' },
    { n: 1, name: 'Physical', desc: 'Raw bit transmission over physical medium.', pdu: 'Bits', examples: 'Cabling, radio, hubs, connectors' },
  ];

  // ── TCP/IP Reference Model (public reference) ────────────────────────────
  const tcpipLayers = [
    { name: 'Application', osiEquivalent: 'Application, Presentation, Session', examples: 'HTTP, HTTPS, DNS, SMTP, SSH, FTP' },
    { name: 'Transport',   osiEquivalent: 'Transport',                          examples: 'TCP, UDP' },
    { name: 'Internet',    osiEquivalent: 'Network',                           examples: 'IP, ICMP, IGMP' },
    { name: 'Link',        osiEquivalent: 'Data Link, Physical',               examples: 'Ethernet, ARP, Wi-Fi' },
  ];

  // ── Nmap Flag Reference (public reference — for command builder) ────────
  const nmapFlags = {
    scanType: [
      { flag: '-sS', label: 'TCP SYN scan (stealth)' },
      { flag: '-sT', label: 'TCP connect scan' },
      { flag: '-sU', label: 'UDP scan' },
      { flag: '-sV', label: 'Service/version detection' },
      { flag: '-sn', label: 'Ping scan (no port scan)' },
    ],
    timing: [
      { flag: '-T0', label: 'Paranoid' }, { flag: '-T1', label: 'Sneaky' },
      { flag: '-T2', label: 'Polite' },   { flag: '-T3', label: 'Normal' },
      { flag: '-T4', label: 'Aggressive' }, { flag: '-T5', label: 'Insane' },
    ],
    extras: [
      { flag: '-O',     label: 'OS detection' },
      { flag: '-A',     label: 'Aggressive (OS, version, script, traceroute)' },
      { flag: '-v',     label: 'Verbose output' },
      { flag: '-Pn',    label: 'Skip host discovery' },
      { flag: '--top-ports 100', label: 'Scan top 100 ports' },
    ],
  };

  return { dnsZone, whoisRecords, hostProfiles, commonPorts, packetCapture, osiLayers, tcpipLayers, nmapFlags };

})();

window.SampleNetworkData = SampleNetworkData;
