/**
 * KHAN SECURITY SOLUTIONS ENTERPRISE
 * Enterprise Asset Inventory — Sample Dataset v1.0.0
 *
 * [EDUCATIONAL SIMULATION — 100% synthetic, offline data]
 * All hostnames, IPs, serial numbers, users, and security findings below
 * are fictional and generated deterministically for demonstration purposes.
 * No real devices, networks, or organizations are represented.
 *
 * Consumed by: assets/js/modules/asset-inventory.js
 */

const SampleAssetData = (() => {

  // ── Building blocks (deterministic combination → 40 assets) ────────────
  const DEPARTMENTS = ['IT Ops', 'Finance', 'HR', 'Engineering', 'Sales', 'Legal', 'Executive', 'Security'];
  const LOCATIONS   = ['HQ - Floor 1', 'HQ - Floor 2', 'HQ - Floor 3', 'Data Center A', 'Data Center B', 'Remote / VPN', 'Branch Office'];
  const USERS_BY_DEPT = {
    'IT Ops': ['A. Khan', 'S. Rahman', 'M. Ortiz'], 'Finance': ['J. Smith', 'P. Nguyen'],
    'HR': ['R. Patel', 'L. Chen'], 'Engineering': ['D. Kim', 'T. Alvarez', 'N. Ibrahim'],
    'Sales': ['C. Johnson', 'B. Fischer'], 'Legal': ['E. Novak'],
    'Executive': ['CEO Office'], 'Security': ['A. Khan', 'S. Rahman'],
  };

  const TYPE_TEMPLATES = [
    { type: 'Windows Server', prefix: 'WIN-SRV', os: 'Windows Server 2022', vendor: 'Dell', model: 'PowerEdge R750', category: 'Servers' },
    { type: 'Linux Server',   prefix: 'LNX-SRV', os: 'Ubuntu Server 22.04 LTS', vendor: 'HPE', model: 'ProLiant DL380', category: 'Servers' },
    { type: 'Domain Controller', prefix: 'DC', os: 'Windows Server 2022', vendor: 'Dell', model: 'PowerEdge R650', category: 'Servers' },
    { type: 'Desktop', prefix: 'WS', os: 'Windows 11 Pro', vendor: 'Dell', model: 'OptiPlex 7010', category: 'Workstations' },
    { type: 'Laptop',  prefix: 'LT',  os: 'Windows 11 Pro', vendor: 'Lenovo', model: 'ThinkPad X1 Carbon', category: 'Workstations' },
    { type: 'Mac',     prefix: 'MAC', os: 'macOS Sonoma 14.5', vendor: 'Apple', model: 'MacBook Pro 14"', category: 'Workstations' },
    { type: 'Azure VM', prefix: 'AZ-VM', os: 'Windows Server 2022', vendor: 'Microsoft Azure', model: 'Standard_D4s_v5', category: 'Cloud Resources' },
    { type: 'AWS EC2',  prefix: 'EC2', os: 'Amazon Linux 2023', vendor: 'Amazon AWS', model: 't3.large', category: 'Cloud Resources' },
    { type: 'Cloud VM', prefix: 'GCP-VM', os: 'Debian 12', vendor: 'Google Cloud', model: 'e2-standard-4', category: 'Cloud Resources' },
    { type: 'Firewall', prefix: 'FW', os: 'PAN-OS 11.1', vendor: 'Palo Alto Networks', model: 'PA-3220', category: 'Network Devices' },
    { type: 'Switch',   prefix: 'SW',  os: 'Cisco IOS XE 17.9', vendor: 'Cisco', model: 'Catalyst 9300', category: 'Network Devices' },
    { type: 'Router',   prefix: 'RTR', os: 'Cisco IOS XE 17.9', vendor: 'Cisco', model: 'ISR 4331', category: 'Network Devices' },
    { type: 'Wireless AP', prefix: 'AP', os: 'Aruba OS 8.11', vendor: 'Aruba (HPE)', model: 'AP-535', category: 'Network Devices' },
    { type: 'Printer', prefix: 'PRT', os: 'Embedded Firmware 4.2', vendor: 'HP', model: 'LaserJet Enterprise M610', category: 'Unknown Devices' },
    { type: 'IoT', prefix: 'IOT', os: 'Embedded Linux', vendor: 'Axis Communications', model: 'P3268 Camera', category: 'Unknown Devices' },
    { type: 'Mobile', prefix: 'MOB', os: 'iOS 17.5', vendor: 'Apple', model: 'iPhone 14', category: 'Mobile Devices' },
  ];

  // Distribution across 40 assets — index into TYPE_TEMPLATES, weighted for realism
  const TYPE_DISTRIBUTION = [
    0,0,0,1,1,2,2,           // 7 servers/DCs
    3,3,3,3,3,4,4,4,4,5,5,   // 11 workstations
    6,6,7,7,8,               // 5 cloud
    9,9,10,10,11,12,         // 6 network devices
    13,13,14,                // 3 unknown
    15,15,                   // 2 mobile
    3,4,7,9,10,11,           // +6 to reach 40 with extra variety
  ];

  const RISK_LEVELS = ['critical', 'high', 'medium', 'low', 'informational'];
  const STATUSES = ['Healthy', 'Warning', 'Offline', 'Retired', 'Maintenance', 'Compromised'];
  const PATCH_STATUSES = ['Fully Updated', 'Pending Updates', 'Critical Missing', 'Unknown'];
  const SECURITY_PRODUCTS = ['Windows Defender', 'Microsoft Defender XDR', 'CrowdStrike', 'SentinelOne', 'Elastic Agent', 'Wazuh', 'Splunk UF', 'Sysmon', 'OSQuery', 'Custom'];
  const SOFTWARE_CATALOG = [
    { app: 'Google Chrome', vendor: 'Google', version: '126.0.6478.'  },
    { app: '7-Zip', vendor: 'Igor Pavlov', version: '23.01' },
    { app: 'Microsoft 365 Apps', vendor: 'Microsoft', version: '2405' },
    { app: 'Adobe Acrobat Reader DC', vendor: 'Adobe', version: '24.002' },
    { app: 'Zoom', vendor: 'Zoom Video Communications', version: '6.1.1' },
    { app: 'Slack', vendor: 'Salesforce', version: '4.39.95' },
    { app: 'Docker Engine', vendor: 'Docker Inc.', version: '26.1.4' },
    { app: 'OpenSSH', vendor: 'OpenBSD', version: '9.7p1' },
    { app: 'nginx', vendor: 'F5 / nginx', version: '1.26.0' },
    { app: 'PostgreSQL', vendor: 'PostgreSQL Global Dev Group', version: '16.3' },
  ];

  function _hash(n, mod) { return ((n * 2654435761) >>> 0) % mod; } // deterministic pseudo-random
  function _pad(n, len) { return String(n).padStart(len, '0'); }
  function _ip(a, b, c, d) { return `${a}.${b}.${c}.${d}`; }
  function _mac(idx) {
    const bytes = [0x00, 0x1B, 0x44];
    for (let i = 0; i < 3; i++) bytes.push(_hash(idx * 7 + i, 256));
    return bytes.map(b => b.toString(16).padStart(2, '0')).join(':').toUpperCase();
  }

  function _buildAsset(idx) {
    const tpl = TYPE_TEMPLATES[TYPE_DISTRIBUTION[idx]];
    const dept = DEPARTMENTS[_hash(idx, DEPARTMENTS.length)];
    const users = USERS_BY_DEPT[dept];
    const user = users[_hash(idx * 3, users.length)];
    const location = LOCATIONS[_hash(idx * 5, LOCATIONS.length)];
    const risk = RISK_LEVELS[_hash(idx * 11, tpl.category === 'Network Devices' || tpl.category === 'Servers' ? 4 : 5)];
    const status = STATUSES[_hash(idx * 13, idx % 9 === 0 ? STATUSES.length : 3)]; // mostly Healthy/Warning/Offline, occasional others
    const patchStatus = PATCH_STATUSES[_hash(idx * 17, PATCH_STATUSES.length)];
    const criticality = ['Low', 'Medium', 'High', 'Critical'][_hash(idx * 19, 4)];
    const isCloud = tpl.category === 'Cloud Resources';
    const num = idx + 1;

    const hostname = `${tpl.prefix}-${_pad(num, 3)}`;
    const octet2 = isCloud ? 20 : 0;
    const octet3 = tpl.category === 'Network Devices' ? 0 : (1 + (idx % 4));
    const ip = isCloud ? _ip(10, 20, _hash(idx, 254) + 1, _hash(idx * 2, 254) + 1) : _ip(10, 0, octet3, 10 + idx);

    const daysAgo = _hash(idx * 23, 30);
    const lastSeen = new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10) + ' ' + _pad(_hash(idx, 24), 2) + ':' + _pad(_hash(idx * 2, 60), 2);

    const secProducts = [SECURITY_PRODUCTS[_hash(idx * 29, SECURITY_PRODUCTS.length)]];
    if (idx % 3 === 0) secProducts.push(SECURITY_PRODUCTS[_hash(idx * 31, SECURITY_PRODUCTS.length)]);

    const softwareCount = 3 + (idx % 4);
    const software = Array.from({ length: softwareCount }, (_, i) => {
      const s = SOFTWARE_CATALOG[_hash(idx * 37 + i, SOFTWARE_CATALOG.length)];
      return { app: s.app, vendor: s.vendor, version: s.version + _hash(idx + i, 90), installDate: new Date(Date.now() - _hash(idx + i * 3, 400) * 86400000).toISOString().slice(0, 10), license: idx % 2 === 0 ? 'Licensed' : 'Open Source' };
    });

    const openPorts = tpl.category === 'Network Devices'
      ? [22, 443, 8443].slice(0, 1 + (idx % 3))
      : tpl.category === 'Servers'
        ? [22, 80, 443, 3389, 3306].slice(0, 2 + (idx % 3))
        : [];

    const services = tpl.category === 'Servers'
      ? ['sshd', 'nginx', 'cron', 'systemd-journald'].slice(0, 2 + (idx % 3))
      : ['Windows Update', 'Print Spooler', 'Defender Service'].slice(0, 1 + (idx % 3));

    const timeline = [
      { date: new Date(Date.now() - (daysAgo + 180) * 86400000).toISOString().slice(0, 10), event: 'Asset Created', detail: `${hostname} enrolled into inventory.` },
      { date: new Date(Date.now() - (daysAgo + 120) * 86400000).toISOString().slice(0, 10), event: 'User Assigned', detail: `Assigned to ${user}.` },
      { date: new Date(Date.now() - (daysAgo + 60) * 86400000).toISOString().slice(0, 10), event: 'OS Updated', detail: `Updated to ${tpl.os}.` },
      { date: new Date(Date.now() - (daysAgo + 14) * 86400000).toISOString().slice(0, 10), event: 'Patch Installed', detail: 'Monthly security rollup applied.' },
      { date: lastSeen.slice(0, 10), event: 'Last Scan', detail: `${secProducts[0]} completed a full scan.` },
    ];
    if (status === 'Retired') timeline.push({ date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10), event: 'Asset Retired', detail: 'Decommissioned and removed from production.' });

    return {
      id: `ast-${_pad(num, 3)}`,
      hostname, deviceName: `${dept.replace(/\s/g, '')}-${hostname}`,
      ip, ipv6: isCloud ? '' : `fe80::${_hash(idx, 9999).toString(16)}`,
      mac: isCloud ? '' : _mac(idx),
      os: tpl.os, osVersion: tpl.os,
      assetType: tpl.type, category: tpl.category, vendor: tpl.vendor, model: tpl.model,
      serialNumber: `SN-${_hash(idx * 41, 999999).toString().padStart(6, '0')}`,
      department: dept, assignedUser: user, owner: user, location,
      risk, criticality, status, lastSeen, patchStatus,
      health: status === 'Compromised' ? 'Critical' : status === 'Warning' ? 'Degraded' : status === 'Offline' ? 'Unknown' : 'Good',
      tags: [dept, tpl.category, risk === 'critical' || risk === 'high' ? 'High Priority' : 'Standard'],
      network: {
        hostname, domain: isCloud ? 'cloud.internal' : 'khansecurity.local',
        dns: '10.0.0.53', gateway: isCloud ? '10.20.0.1' : '10.0.0.1',
        subnet: '255.255.255.0', dhcp: idx % 2 === 0 ? 'Enabled' : 'Static',
        publicIp: isCloud ? _ip(203, 0, 113, 10 + idx) : '',
      },
      hardware: {
        cpu: tpl.category === 'Network Devices' ? 'N/A (ASIC)' : `${['Intel Xeon Gold 6338', 'Intel Core i7-1365U', 'Apple M3 Pro', 'AMD EPYC 7763'][_hash(idx, 4)]}`,
        ram: tpl.category === 'Servers' ? `${64 + (idx % 4) * 32} GB` : tpl.category === 'Workstations' ? `${8 + (idx % 3) * 8} GB` : 'N/A',
        disk: tpl.category === 'Servers' ? `${1 + (idx % 4)} TB NVMe RAID` : tpl.category === 'Workstations' ? `${256 + (idx % 3) * 256} GB SSD` : 'N/A',
        motherboard: tpl.vendor + ' OEM', bios: `v${1 + (idx % 5)}.${_hash(idx, 20)}`,
        tpm: tpl.category === 'Workstations' || tpl.category === 'Servers' ? 'TPM 2.0' : 'N/A',
        gpu: tpl.type === 'Desktop' || tpl.type === 'Laptop' ? 'Integrated' : 'N/A',
        serial: `SN-${_hash(idx * 41, 999999).toString().padStart(6, '0')}`,
      },
      security: {
        firewall: idx % 5 !== 0 ? 'Enabled' : 'Disabled',
        antivirus: secProducts[0],
        edr: secProducts.length > 1 ? secProducts[1] : 'None',
        diskEncryption: idx % 3 === 0 ? 'Disabled' : 'Enabled',
        bitlocker: tpl.os.startsWith('Windows') ? (idx % 3 === 0 ? 'Off' : 'On') : 'N/A',
        secureBoot: tpl.category === 'Workstations' || tpl.category === 'Servers' ? (idx % 4 === 0 ? 'Off' : 'On') : 'N/A',
        tpm: tpl.category === 'Workstations' || tpl.category === 'Servers' ? 'Present' : 'N/A',
        lastScan: lastSeen,
        threatCount: risk === 'critical' ? 2 + (idx % 3) : risk === 'high' ? 1 : 0,
        installedProducts: secProducts,
      },
      software, services, openPorts, timeline,
      notes: idx % 4 === 0 ? [{ author: 'A. Khan', date: lastSeen.slice(0, 10), text: 'Reviewed during routine asset audit — no action required.' }] : [],
    };
  }

  const assets = Array.from({ length: 40 }, (_, i) => _buildAsset(i));

  function getAsset(id) { return assets.find(a => a.id === id) || null; }

  return { assets, TYPE_TEMPLATES, RISK_LEVELS, STATUSES, PATCH_STATUSES, SECURITY_PRODUCTS, DEPARTMENTS, LOCATIONS, getAsset };

})();

window.SampleAssetData = SampleAssetData;
