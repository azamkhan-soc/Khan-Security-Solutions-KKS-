/**
 * KHAN SECURITY SOLUTIONS ENTERPRISE
 * Network Security Toolkit — Module v0.7.0
 *
 * Offline network engineering & security toolkit: IP/subnet/CIDR calculator,
 * DNS lookup, WHOIS placeholder, port scanner simulator, Nmap command
 * builder, firewall rule builder, packet viewer, hex viewer, OSI/TCP-IP
 * reference, network topology demo, and report export.
 *
 * [EDUCATIONAL SIMULATION — DNS/WHOIS/port-scan results are served from a
 *  bundled offline dataset. No live network queries, DNS resolution, WHOIS
 *  lookups, or port scans are ever performed. The Hex Viewer is the one
 *  fully real, local-only utility — it reads bytes you provide and renders
 *  them; nothing leaves the browser.]
 *
 * Integrates with:
 *   window.Router              — route: 'network-tools'
 *   window.SearchEngine        — searchable content
 *   window.NotificationManager — alerts and feedback
 *   window.StorageManager      — firewall rule persistence (localStorage)
 *   window.SampleNetworkData   — bundled sample dataset
 */

const NetworkTools = (() => {

  // ── State ──────────────────────────────────────────────────────────────
  let mounted        = false;
  let activeTab       = 'overview';
  let firewallRules    = [];
  let selectedPacket   = null;

  // ── Icon paths (heroicons-style outline) ────────────────────────────────
  const I = {
    shield:   `<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>`,
    calc:     `<path stroke-linecap="round" stroke-linejoin="round" d="M9 7.5h6M9 10.5h6M9 13.5h1.5m3 0H15M9 16.5h1.5m3 0H15M6 3.75h12a1.5 1.5 0 011.5 1.5v13.5a1.5 1.5 0 01-1.5 1.5H6a1.5 1.5 0 01-1.5-1.5V5.25a1.5 1.5 0 011.5-1.5z"/>`,
    globe:    `<path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"/>`,
    id:       `<path stroke-linecap="round" stroke-linejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5h-15A1.5 1.5 0 003 6v12a1.5 1.5 0 001.5 1.5zm6.75-10.5a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-4.5 6.75a4.5 4.5 0 019 0v.75h-9v-.75z"/>`,
    radar:    `<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z"/>`,
    terminal: `<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z"/>`,
    firewall: `<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 9.75h16.5m-16.5 4.5h16.5m-16.5-9h16.5A1.5 1.5 0 0121.75 6.75v10.5a1.5 1.5 0 01-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5V6.75a1.5 1.5 0 011.5-1.5z"/>`,
    packet:   `<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 3.75c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"/>`,
    hex:      `<path stroke-linecap="round" stroke-linejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z"/>`,
    topology: `<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75a3 3 0 116 0 3 3 0 01-6 0zM3.75 17.25a3 3 0 116 0 3 3 0 01-6 0zm12 0a3 3 0 116 0 3 3 0 01-6 0zM12 9.75v3m0 0l-4.5 3m4.5-3l4.5 3"/>`,
    book:     `<path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/>`,
    report:   `<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"/>`,
    copy:     `<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"/>`,
    down:     `<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>`,
    trash:    `<path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>`,
    plus:     `<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>`,
    warn:     `<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>`,
    close:    `<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>`,
    upload:   `<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>`,
  };

  function svg(name, cls = '') {
    return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">${I[name] || I.shield}</svg>`;
  }
  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }

  const DATA = () => window.SampleNetworkData || {
    dnsZone: {}, whoisRecords: {}, hostProfiles: {}, commonPorts: [],
    packetCapture: [], osiLayers: [], tcpipLayers: [], nmapFlags: { scanType: [], timing: [], extras: [] },
  };

  // ══════════════════════════════════════════════════════════════════════
  // ROUTE REGISTRATION
  // ══════════════════════════════════════════════════════════════════════
  function register() {
    window.Router.register('network-tools', { title: 'Network Tools', init, render });
  }

  function init() {
    _loadFirewallRules();
    _registerSearch();
  }

  function render() {
    const el = document.getElementById('page-network-tools');
    if (!el) return;
    if (!mounted) {
      el.innerHTML = _buildShell();
      mounted = true;
      _wireAll();
    }
    _switchTab(activeTab);
  }

  // ══════════════════════════════════════════════════════════════════════
  // SHELL
  // ══════════════════════════════════════════════════════════════════════
  function _buildShell() {
    return `
    <div class="nt-shell">
      <div class="nt-header">
        <div class="nt-header-left">
          <div class="nt-header-icon">${svg('terminal')}</div>
          <div>
            <div class="nt-header-title">Network Security Toolkit</div>
            <div class="nt-header-sub">IP tools, offline DNS/WHOIS, scan simulation, packet &amp; hex inspection, reference</div>
          </div>
        </div>
        <span class="badge badge-warning" style="font-family:var(--font-mono);font-size:10px;">⚠ EDUCATIONAL SIMULATION — OFFLINE DATA</span>
      </div>

      <div class="nt-tabs" role="tablist">
        <div class="nt-tab active" data-tab="overview"  role="tab">${svg('shield')}   Overview</div>
        <div class="nt-tab"        data-tab="ip-calc"   role="tab">${svg('calc')}     IP / Subnet / CIDR</div>
        <div class="nt-tab"        data-tab="dns"       role="tab">${svg('globe')}    DNS Lookup</div>
        <div class="nt-tab"        data-tab="whois"     role="tab">${svg('id')}       WHOIS</div>
        <div class="nt-tab"        data-tab="portscan"  role="tab">${svg('radar')}    Port Scanner</div>
        <div class="nt-tab"        data-tab="nmap"      role="tab">${svg('terminal')} Nmap Builder</div>
        <div class="nt-tab"        data-tab="firewall"  role="tab">${svg('firewall')} Firewall Rules</div>
        <div class="nt-tab"        data-tab="packets"   role="tab">${svg('packet')}   Packet Viewer</div>
        <div class="nt-tab"        data-tab="hex"       role="tab">${svg('hex')}      Hex Viewer</div>
        <div class="nt-tab"        data-tab="topology"  role="tab">${svg('topology')} Topology Demo</div>
        <div class="nt-tab"        data-tab="reference" role="tab">${svg('book')}     OSI / TCP-IP Ref</div>
        <div class="nt-tab"        data-tab="reports"   role="tab">${svg('report')}   Reports</div>
      </div>

      <div class="nt-body">
        <div class="nt-view active" id="nt-view-overview">${_buildOverview()}</div>
        <div class="nt-view" id="nt-view-ip-calc">${_buildIPCalcView()}</div>
        <div class="nt-view" id="nt-view-dns">${_buildDNSView()}</div>
        <div class="nt-view" id="nt-view-whois">${_buildWhoisView()}</div>
        <div class="nt-view" id="nt-view-portscan">${_buildPortScanView()}</div>
        <div class="nt-view" id="nt-view-nmap">${_buildNmapView()}</div>
        <div class="nt-view" id="nt-view-firewall">${_buildFirewallView()}</div>
        <div class="nt-view" id="nt-view-packets">${_buildPacketsView()}</div>
        <div class="nt-view" id="nt-view-hex">${_buildHexView()}</div>
        <div class="nt-view" id="nt-view-topology">${_buildTopologyView()}</div>
        <div class="nt-view" id="nt-view-reference">${_buildReferenceView()}</div>
        <div class="nt-view" id="nt-view-reports">${_buildReportsView()}</div>
      </div>
    </div>

    <div class="nt-detail-overlay" id="nt-detail-overlay">
      <div class="nt-detail-panel" id="nt-detail-panel">
        <div class="nt-detail-header">
          <div class="nt-detail-title" id="nt-detail-title">Detail</div>
          <div class="nt-detail-close" id="nt-detail-close">${svg('close')}</div>
        </div>
        <div id="nt-detail-body"></div>
      </div>
    </div>`;
  }

  function _wireAll() {
    document.querySelectorAll('#page-network-tools .nt-tab').forEach(tab => {
      tab.addEventListener('click', () => _switchTab(tab.dataset.tab));
    });
    document.getElementById('nt-detail-close')?.addEventListener('click', _closeDetail);
    document.getElementById('nt-detail-overlay')?.addEventListener('click', e => {
      if (e.target.id === 'nt-detail-overlay') _closeDetail();
    });
    _wireIPCalc();
    _wireDNS();
    _wireWhois();
    _wirePortScan();
    _wireNmap();
    _wireFirewall();
    _wirePackets();
    _wireHex();
    _wireReports();
  }

  function _switchTab(tabId) {
    activeTab = tabId;
    document.querySelectorAll('#page-network-tools .nt-tab').forEach(t =>
      t.classList.toggle('active', t.dataset.tab === tabId));
    document.querySelectorAll('#page-network-tools .nt-view').forEach(v =>
      v.classList.toggle('active', v.id === `nt-view-${tabId}`));
  }

  // ══════════════════════════════════════════════════════════════════════
  // OVERVIEW
  // ══════════════════════════════════════════════════════════════════════
  function _buildOverview() {
    const d = DATA();
    return `
      <div class="grid grid-stats">
        ${_statCard('Toolkit Modules', '11', 'IP calc → reports', 'var(--color-primary)')}
        ${_statCard('Offline DNS Records', Object.keys(d.dnsZone).length, 'Bundled zone file', 'var(--color-info)')}
        ${_statCard('Simulated Hosts', Object.keys(d.hostProfiles).length, 'Port scan targets', 'var(--color-warning)')}
        ${_statCard('Firewall Rules', firewallRules.length, 'Saved this session', 'var(--color-success)')}
      </div>
      <div class="nt-tool-grid">
        ${_toolCard('calc',     'IP / Subnet / CIDR Calculator', 'Compute network, broadcast, usable range, and binary breakdown for any IPv4 address + mask.', 'ip-calc')}
        ${_toolCard('globe',    'DNS Lookup', 'Offline resolver against a bundled sample zone file — A, AAAA, MX, NS, TXT, CNAME.', 'dns')}
        ${_toolCard('id',       'WHOIS', 'Simulated placeholder WHOIS record lookup — clearly labeled, not a live registry query.', 'whois')}
        ${_toolCard('radar',    'Port Scanner Simulator', 'Run a simulated scan against bundled sample hosts to see open/closed/filtered ports.', 'portscan')}
        ${_toolCard('terminal', 'Nmap Command Builder', 'Compose a valid nmap command from scan type, timing, and option flags.', 'nmap')}
        ${_toolCard('firewall', 'Firewall Rule Builder', 'Build allow/deny rules and generate equivalent iptables-style commands.', 'firewall')}
        ${_toolCard('packet',   'Packet Viewer', 'Inspect a bundled sample packet capture, frame by frame.', 'packets')}
        ${_toolCard('hex',      'Hex Viewer', 'Paste text or load a small file to view its real hex + ASCII dump, entirely client-side.', 'hex')}
        ${_toolCard('topology', 'Network Topology Demo', 'A labeled reference diagram of a typical segmented enterprise network.', 'topology')}
        ${_toolCard('book',     'OSI / TCP-IP Reference', 'Quick-reference tables for both networking models and common ports.', 'reference')}
      </div>`;
  }

  function _toolCard(icon, title, desc, tab) {
    return `
      <div class="card nt-tool-card" data-goto="${tab}">
        <div class="nt-tool-card-icon">${svg(icon)}</div>
        <div class="nt-tool-card-title">${esc(title)}</div>
        <div class="nt-tool-card-desc">${esc(desc)}</div>
      </div>`;
  }

  function _statCard(label, value, change, color) {
    return `
      <div class="stat-card">
        <div class="stat-card-icon" style="background:${color}22;color:${color};">${svg('shield')}</div>
        <div class="stat-card-info">
          <div class="stat-card-value">${value}</div>
          <div class="stat-card-label">${esc(label)}</div>
          <div class="stat-card-change" style="color:var(--text-tertiary);">${esc(change)}</div>
        </div>
      </div>`;
  }

  // ══════════════════════════════════════════════════════════════════════
  // IP / SUBNET / CIDR CALCULATOR
  // ══════════════════════════════════════════════════════════════════════
  function _ipToInt(ip) {
    const p = ip.split('.').map(Number);
    if (p.length !== 4 || p.some(n => isNaN(n) || n < 0 || n > 255)) return null;
    return ((p[0] << 24) | (p[1] << 16) | (p[2] << 8) | p[3]) >>> 0;
  }
  function _intToIp(n) {
    return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
  }
  function _cidrToMaskInt(cidr) {
    return cidr === 0 ? 0 : (0xFFFFFFFF << (32 - cidr)) >>> 0;
  }
  function _toBinary(n) {
    return n.toString(2).padStart(32, '0').match(/.{8}/g).join('.');
  }
  function _ipClass(firstOctet) {
    if (firstOctet < 128) return 'A';
    if (firstOctet < 192) return 'B';
    if (firstOctet < 224) return 'C';
    if (firstOctet < 240) return 'D (Multicast)';
    return 'E (Experimental)';
  }

  function _buildIPCalcView() {
    return `
      <div class="card" style="max-width:640px;">
        <div class="card-header"><div class="card-title">IP / Subnet / CIDR Calculator</div></div>
        <div class="card-body">
          <div class="nt-form-row">
            <label class="nt-label">IP Address</label>
            <input type="text" class="input" id="nt-ip-input" placeholder="e.g. 192.168.1.10" value="192.168.1.10" />
          </div>
          <div class="nt-form-row">
            <label class="nt-label">CIDR Prefix Length</label>
            <input type="number" class="input" id="nt-cidr-input" min="0" max="32" value="24" />
          </div>
          <button class="btn btn-primary" id="nt-calc-btn">${svg('calc')} Calculate</button>
        </div>
      </div>
      <div id="nt-calc-result" style="margin-top:var(--space-4);"></div>`;
  }

  function _wireIPCalc() {
    document.getElementById('nt-calc-btn')?.addEventListener('click', _runIPCalc);
    _runIPCalc();
  }

  function _runIPCalc() {
    const box = document.getElementById('nt-calc-result');
    const ipRaw = document.getElementById('nt-ip-input')?.value.trim() || '';
    const cidr  = parseInt(document.getElementById('nt-cidr-input')?.value, 10);
    const ipInt = _ipToInt(ipRaw);

    if (ipInt === null || isNaN(cidr) || cidr < 0 || cidr > 32) {
      box.innerHTML = `<div class="empty-state"><div class="empty-state-title">Invalid input</div><div class="empty-state-desc">Enter a valid IPv4 address and a CIDR prefix from 0–32.</div></div>`;
      return;
    }

    const maskInt   = _cidrToMaskInt(cidr);
    const netInt    = (ipInt & maskInt) >>> 0;
    const bcastInt  = (netInt | (~maskInt >>> 0)) >>> 0;
    const wildcard  = (~maskInt) >>> 0;
    const totalHosts = Math.pow(2, 32 - cidr);
    const usable      = cidr >= 31 ? 0 : totalHosts - 2;
    const firstHost   = cidr >= 31 ? netInt : netInt + 1;
    const lastHost     = cidr >= 31 ? bcastInt : bcastInt - 1;

    const rows = [
      ['IP Address',        ipRaw],
      ['CIDR Notation',     `/${cidr}`],
      ['Subnet Mask',       _intToIp(maskInt)],
      ['Wildcard Mask',     _intToIp(wildcard)],
      ['Network Address',   _intToIp(netInt)],
      ['Broadcast Address', _intToIp(bcastInt)],
      ['First Usable Host', usable > 0 ? _intToIp(firstHost) : 'N/A'],
      ['Last Usable Host',  usable > 0 ? _intToIp(lastHost)  : 'N/A'],
      ['Total Addresses',   totalHosts.toLocaleString()],
      ['Usable Hosts',      usable.toLocaleString()],
      ['IP Class',          _ipClass(ipInt >>> 24)],
    ];

    box.innerHTML = `
      <div class="card">
        <div class="card-header"><div class="card-title">Results</div></div>
        <div class="card-body" style="padding:0;">
          <table class="data-table">
            <tbody>
              ${rows.map(([k, v]) => `<tr><td style="width:220px;color:var(--text-tertiary);">${esc(k)}</td><td class="mono">${esc(String(v))}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="card" style="margin-top:var(--space-4);">
        <div class="card-header"><div class="card-title">Binary Breakdown</div></div>
        <div class="card-body">
          <div class="nt-binary-row"><span>IP Address</span><span class="mono">${esc(_toBinary(ipInt))}</span></div>
          <div class="nt-binary-row"><span>Subnet Mask</span><span class="mono">${esc(_toBinary(maskInt))}</span></div>
          <div class="nt-binary-row"><span>Network</span><span class="mono">${esc(_toBinary(netInt))}</span></div>
        </div>
      </div>`;
  }

  // ══════════════════════════════════════════════════════════════════════
  // DNS LOOKUP (offline)
  // ══════════════════════════════════════════════════════════════════════
  function _buildDNSView() {
    const d = DATA();
    return `
      <div class="card" style="max-width:640px;">
        <div class="card-header"><div class="card-title">Offline DNS Lookup</div></div>
        <div class="card-body">
          <p style="color:var(--text-secondary);font-size:var(--text-sm);margin-bottom:var(--space-4);">
            Resolves against a bundled offline zone file — no live DNS queries are made. Try: ${Object.keys(d.dnsZone).slice(0, 2).map(z => `<span class="mono">${esc(z)}</span>`).join(', ')}
          </p>
          <div class="nt-form-row">
            <label class="nt-label">Domain</label>
            <input type="text" class="input" id="nt-dns-input" placeholder="e.g. khansecurity.example" value="khansecurity.example" />
          </div>
          <div class="nt-form-row">
            <label class="nt-label">Record Type</label>
            <select class="input" id="nt-dns-type">
              <option>A</option><option>AAAA</option><option>MX</option><option>NS</option><option>TXT</option><option>CNAME</option>
            </select>
          </div>
          <button class="btn btn-primary" id="nt-dns-btn">${svg('globe')} Lookup</button>
        </div>
      </div>
      <div id="nt-dns-result" style="margin-top:var(--space-4);"></div>`;
  }

  function _wireDNS() {
    document.getElementById('nt-dns-btn')?.addEventListener('click', _runDNS);
    document.getElementById('nt-dns-input')?.addEventListener('keydown', e => { if (e.key === 'Enter') _runDNS(); });
    _runDNS();
  }

  function _runDNS() {
    const d = DATA();
    const box = document.getElementById('nt-dns-result');
    const domain = document.getElementById('nt-dns-input')?.value.trim().toLowerCase() || '';
    const type   = document.getElementById('nt-dns-type')?.value || 'A';
    const zone = d.dnsZone[domain];

    if (!zone) {
      box.innerHTML = `<div class="empty-state"><div class="empty-state-title">No zone record</div><div class="empty-state-desc">"${esc(domain)}" is not in the bundled offline zone file.</div></div>`;
      return;
    }
    const values = zone[type] || [];
    box.innerHTML = `
      <div class="card">
        <div class="card-header"><div class="card-title">${esc(domain)} — ${esc(type)} records</div></div>
        <div class="card-body" style="padding:0;">
          ${values.length
            ? `<table class="data-table"><tbody>${values.map(v => `<tr><td class="mono">${esc(v)}</td></tr>`).join('')}</tbody></table>`
            : `<div class="empty-state" style="padding:var(--space-5);"><div class="empty-state-desc">No ${esc(type)} record found for this domain.</div></div>`}
        </div>
      </div>`;
  }

  // ══════════════════════════════════════════════════════════════════════
  // WHOIS (placeholder)
  // ══════════════════════════════════════════════════════════════════════
  function _buildWhoisView() {
    return `
      <div class="card" style="max-width:640px;">
        <div class="card-header"><div class="card-title">WHOIS Lookup</div></div>
        <div class="card-body">
          <div class="empty-state" style="padding:var(--space-3);border:1px dashed var(--border-default);border-radius:var(--radius-lg);margin-bottom:var(--space-4);">
            <div style="display:flex;gap:var(--space-3);align-items:flex-start;">
              <div style="color:var(--color-warning);flex-shrink:0;">${svg('warn', 'nt-inline-icon')}</div>
              <div style="font-size:var(--text-sm);color:var(--text-secondary);text-align:left;">
                Placeholder tool. This looks up a small bundled set of sample records only — it is not a live
                WHOIS registry query. For real records use a licensed WHOIS service.
              </div>
            </div>
          </div>
          <div class="nt-form-row">
            <label class="nt-label">Domain</label>
            <input type="text" class="input" id="nt-whois-input" placeholder="e.g. khansecurity.example" value="khansecurity.example" />
          </div>
          <button class="btn btn-primary" id="nt-whois-btn">${svg('id')} Lookup</button>
        </div>
      </div>
      <div id="nt-whois-result" style="margin-top:var(--space-4);"></div>`;
  }

  function _wireWhois() {
    document.getElementById('nt-whois-btn')?.addEventListener('click', _runWhois);
    _runWhois();
  }

  function _runWhois() {
    const d = DATA();
    const box = document.getElementById('nt-whois-result');
    const domain = document.getElementById('nt-whois-input')?.value.trim().toLowerCase() || '';
    const rec = d.whoisRecords[domain];

    if (!rec) {
      box.innerHTML = `<div class="empty-state"><div class="empty-state-title">No sample record</div><div class="empty-state-desc">"${esc(domain)}" is not in the bundled WHOIS sample set.</div></div>`;
      return;
    }
    const rows = [
      ['Domain', rec.domain], ['Registrar', rec.registrar], ['Created', rec.created],
      ['Updated', rec.updated], ['Expires', rec.expires], ['Status', rec.status.join(', ')],
      ['Name Servers', rec.nameServers.join(', ')], ['Registrant Org', rec.registrantOrg],
    ];
    box.innerHTML = `
      <div class="card">
        <div class="card-header"><div class="card-title">Simulated WHOIS Record</div></div>
        <div class="card-body" style="padding:0;">
          <table class="data-table"><tbody>
            ${rows.map(([k, v]) => `<tr><td style="width:180px;color:var(--text-tertiary);">${esc(k)}</td><td class="mono">${esc(v)}</td></tr>`).join('')}
          </tbody></table>
        </div>
      </div>`;
  }

  // ══════════════════════════════════════════════════════════════════════
  // PORT SCANNER SIMULATOR
  // ══════════════════════════════════════════════════════════════════════
  function _buildPortScanView() {
    const d = DATA();
    return `
      <div class="card" style="max-width:640px;">
        <div class="card-header"><div class="card-title">Port Scanner Simulator</div></div>
        <div class="card-body">
          <p style="color:var(--text-secondary);font-size:var(--text-sm);margin-bottom:var(--space-4);">
            Runs against bundled sample host profiles only. Demo targets: ${Object.keys(d.hostProfiles).map(ip => `<span class="mono">${esc(ip)}</span>`).join(', ')}
          </p>
          <div class="nt-form-row">
            <label class="nt-label">Target IP</label>
            <input type="text" class="input" id="nt-scan-input" placeholder="e.g. 203.0.113.10" value="203.0.113.10" />
          </div>
          <button class="btn btn-primary" id="nt-scan-btn">${svg('radar')} Run Simulated Scan</button>
        </div>
      </div>
      <div id="nt-scan-result" style="margin-top:var(--space-4);"></div>`;
  }

  function _wirePortScan() {
    document.getElementById('nt-scan-btn')?.addEventListener('click', _runPortScan);
  }

  function _runPortScan() {
    const d = DATA();
    const box = document.getElementById('nt-scan-result');
    const ip = document.getElementById('nt-scan-input')?.value.trim() || '';
    const host = d.hostProfiles[ip];

    box.innerHTML = `<div class="nt-scan-progress"><div class="nt-scan-progress-bar"></div><div style="margin-top:var(--space-2);color:var(--text-tertiary);font-size:var(--text-xs);">Scanning ${esc(ip)}…</div></div>`;

    setTimeout(() => {
      if (!host) {
        box.innerHTML = `<div class="empty-state"><div class="empty-state-title">Host not in demo dataset</div><div class="empty-state-desc">"${esc(ip)}" has no simulated profile. Try one of the demo targets listed above.</div></div>`;
        return;
      }
      const stateCls = { open: 'badge-danger', closed: 'badge-neutral', filtered: 'badge-warning' };
      box.innerHTML = `
        <div class="card">
          <div class="card-header">
            <div class="card-title">${esc(host.hostname)} (${esc(ip)})</div>
            <span class="badge badge-info">${esc(host.os)}</span>
          </div>
          <div class="card-body" style="padding:0;">
            <table class="data-table">
              <thead><tr><th>Port</th><th>Protocol</th><th>State</th><th>Service</th><th>Banner</th></tr></thead>
              <tbody>
                ${host.ports.map(p => `
                  <tr><td class="mono">${p.port}</td><td>${esc(p.proto.toUpperCase())}</td>
                  <td><span class="badge ${stateCls[p.state] || 'badge-neutral'}">${esc(p.state)}</span></td>
                  <td>${esc(p.service)}</td><td style="color:var(--text-tertiary);">${esc(p.banner || '—')}</td></tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>`;
      window.NotificationManager?.success('Scan Complete', `Simulated scan of ${ip} finished — ${host.ports.filter(p => p.state === 'open').length} open ports.`);
    }, 700);
  }

  // ══════════════════════════════════════════════════════════════════════
  // NMAP COMMAND BUILDER
  // ══════════════════════════════════════════════════════════════════════
  function _buildNmapView() {
    const d = DATA();
    return `
      <div class="card" style="max-width:720px;">
        <div class="card-header"><div class="card-title">Nmap Command Builder</div></div>
        <div class="card-body">
          <div class="nt-form-row">
            <label class="nt-label">Target</label>
            <input type="text" class="input" id="nt-nmap-target" placeholder="e.g. 203.0.113.10 or 203.0.113.0/24" value="203.0.113.10" />
          </div>
          <div class="nt-form-row">
            <label class="nt-label">Scan Type</label>
            <div class="nt-checkbox-grid" id="nt-nmap-scantype">
              ${d.nmapFlags.scanType.map((f, idx) => `
                <label class="nt-checkbox"><input type="radio" name="nt-scantype" value="${f.flag}" ${idx === 0 ? 'checked' : ''}/> <span class="mono">${f.flag}</span> ${esc(f.label)}</label>`).join('')}
            </div>
          </div>
          <div class="nt-form-row">
            <label class="nt-label">Timing Template</label>
            <select class="input" id="nt-nmap-timing">
              <option value="">None</option>
              ${d.nmapFlags.timing.map(f => `<option value="${f.flag}" ${f.flag === '-T3' ? 'selected' : ''}>${f.flag} — ${esc(f.label)}</option>`).join('')}
            </select>
          </div>
          <div class="nt-form-row">
            <label class="nt-label">Extra Options</label>
            <div class="nt-checkbox-grid" id="nt-nmap-extras">
              ${d.nmapFlags.extras.map(f => `<label class="nt-checkbox"><input type="checkbox" value="${f.flag}"/> <span class="mono">${f.flag}</span> ${esc(f.label)}</label>`).join('')}
            </div>
          </div>
        </div>
      </div>
      <div class="card" style="margin-top:var(--space-4);max-width:720px;">
        <div class="card-header"><div class="card-title">Generated Command</div></div>
        <div class="card-body">
          <div class="ti-detail-value-box mono" id="nt-nmap-output" style="font-size:var(--text-sm);">nmap -sS 203.0.113.10</div>
          <button class="btn btn-secondary btn-sm" id="nt-nmap-copy" style="margin-top:var(--space-3);">${svg('copy')} Copy Command</button>
        </div>
      </div>`;
  }

  function _wireNmap() {
    const root = document.getElementById('page-network-tools');
    root.querySelectorAll('#nt-nmap-scantype input, #nt-nmap-extras input, #nt-nmap-timing').forEach(el => el.addEventListener('change', _buildNmapCommand));
    root.querySelector('#nt-nmap-target')?.addEventListener('input', _buildNmapCommand);
    root.querySelector('#nt-nmap-copy')?.addEventListener('click', () => {
      const cmd = document.getElementById('nt-nmap-output').textContent;
      _copyText(cmd, 'Nmap command copied');
    });
    _buildNmapCommand();
  }

  function _buildNmapCommand() {
    const target = document.getElementById('nt-nmap-target')?.value.trim() || '<target>';
    const scanType = document.querySelector('#nt-nmap-scantype input:checked')?.value || '';
    const timing   = document.getElementById('nt-nmap-timing')?.value || '';
    const extras   = [...document.querySelectorAll('#nt-nmap-extras input:checked')].map(i => i.value);
    const parts = ['nmap', scanType, timing, ...extras, target].filter(Boolean);
    const out = document.getElementById('nt-nmap-output');
    if (out) out.textContent = parts.join(' ');
  }

  // ══════════════════════════════════════════════════════════════════════
  // FIREWALL RULE BUILDER
  // ══════════════════════════════════════════════════════════════════════
  function _buildFirewallView() {
    return `
      <div class="nt-firewall-grid">
        <div class="card">
          <div class="card-header"><div class="card-title">New Rule</div></div>
          <div class="card-body">
            <div class="nt-form-row">
              <label class="nt-label">Action</label>
              <select class="input" id="nt-fw-action"><option value="ALLOW">ALLOW</option><option value="DENY">DENY</option></select>
            </div>
            <div class="nt-form-row">
              <label class="nt-label">Direction</label>
              <select class="input" id="nt-fw-direction"><option value="IN">Inbound</option><option value="OUT">Outbound</option></select>
            </div>
            <div class="nt-form-row">
              <label class="nt-label">Protocol</label>
              <select class="input" id="nt-fw-protocol"><option value="tcp">TCP</option><option value="udp">UDP</option><option value="icmp">ICMP</option><option value="all">ALL</option></select>
            </div>
            <div class="nt-form-row">
              <label class="nt-label">Source (IP/CIDR)</label>
              <input type="text" class="input" id="nt-fw-source" placeholder="0.0.0.0/0" value="0.0.0.0/0" />
            </div>
            <div class="nt-form-row">
              <label class="nt-label">Destination Port</label>
              <input type="text" class="input" id="nt-fw-port" placeholder="e.g. 443 or 1000:2000" value="443" />
            </div>
            <div class="nt-form-row">
              <label class="nt-label">Description</label>
              <input type="text" class="input" id="nt-fw-desc" placeholder="e.g. Allow HTTPS from anywhere" />
            </div>
            <button class="btn btn-primary" id="nt-fw-add">${svg('plus')} Add Rule</button>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">Rule Set (<span id="nt-fw-count">0</span>)</div></div>
          <div class="card-body" style="padding:0;overflow-x:auto;">
            <table class="data-table">
              <thead><tr><th>#</th><th>Action</th><th>Dir</th><th>Proto</th><th>Source</th><th>Port</th><th>Description</th><th></th></tr></thead>
              <tbody id="nt-fw-tbody"></tbody>
            </table>
          </div>
        </div>
      </div>
      <div class="card" style="margin-top:var(--space-4);">
        <div class="card-header"><div class="card-title">Generated iptables-style Commands</div></div>
        <div class="card-body">
          <pre class="ti-detail-value-box mono" id="nt-fw-commands" style="white-space:pre-wrap;font-size:var(--text-sm);">No rules yet.</pre>
        </div>
      </div>`;
  }

  function _loadFirewallRules() {
    firewallRules = window.StorageManager?.lsGet('nt_firewall_rules', []) || [];
  }
  function _saveFirewallRules() {
    window.StorageManager?.lsSet('nt_firewall_rules', firewallRules);
  }

  function _wireFirewall() {
    document.getElementById('nt-fw-add')?.addEventListener('click', () => {
      const rule = {
        id: 'r' + Date.now(),
        action: document.getElementById('nt-fw-action').value,
        direction: document.getElementById('nt-fw-direction').value,
        protocol: document.getElementById('nt-fw-protocol').value,
        source: document.getElementById('nt-fw-source').value.trim() || '0.0.0.0/0',
        port: document.getElementById('nt-fw-port').value.trim() || 'any',
        desc: document.getElementById('nt-fw-desc').value.trim() || '—',
      };
      firewallRules.push(rule);
      _saveFirewallRules();
      _renderFirewallRules();
      document.getElementById('nt-fw-desc').value = '';
      window.NotificationManager?.success('Rule Added', `${rule.action} rule added to rule set.`);
    });
    _renderFirewallRules();
  }

  function _renderFirewallRules() {
    const tbody = document.getElementById('nt-fw-tbody');
    const count = document.getElementById('nt-fw-count');
    const cmdBox = document.getElementById('nt-fw-commands');
    if (count) count.textContent = firewallRules.length;
    if (!tbody) return;

    if (!firewallRules.length) {
      tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="empty-state-desc">No rules yet — add one on the left.</div></div></td></tr>`;
      if (cmdBox) cmdBox.textContent = 'No rules yet.';
      return;
    }

    tbody.innerHTML = firewallRules.map((r, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td><span class="badge ${r.action === 'ALLOW' ? 'badge-success' : 'badge-danger'}">${esc(r.action)}</span></td>
        <td>${esc(r.direction)}</td><td>${esc(r.protocol.toUpperCase())}</td>
        <td class="mono">${esc(r.source)}</td><td class="mono">${esc(r.port)}</td>
        <td>${esc(r.desc)}</td>
        <td><button class="btn-icon nt-fw-del" data-id="${r.id}">${svg('trash')}</button></td>
      </tr>`).join('');

    tbody.querySelectorAll('.nt-fw-del').forEach(btn => btn.addEventListener('click', () => {
      firewallRules = firewallRules.filter(r => r.id !== btn.dataset.id);
      _saveFirewallRules();
      _renderFirewallRules();
    }));

    if (cmdBox) {
      cmdBox.textContent = firewallRules.map(r => {
        const chain = r.direction === 'IN' ? 'INPUT' : 'OUTPUT';
        const target = r.action === 'ALLOW' ? 'ACCEPT' : 'DROP';
        const proto = r.protocol === 'all' ? '' : ` -p ${r.protocol}`;
        const port  = r.protocol !== 'all' && r.port !== 'any' ? ` --dport ${r.port}` : '';
        const src   = r.direction === 'IN' ? ` -s ${r.source}` : '';
        return `iptables -A ${chain}${proto}${src}${port} -j ${target}   # ${r.desc}`;
      }).join('\n');
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  // PACKET VIEWER
  // ══════════════════════════════════════════════════════════════════════
  function _buildPacketsView() {
    const d = DATA();
    return `
      <p style="color:var(--text-secondary);font-size:var(--text-sm);margin-bottom:var(--space-3);">Bundled sample capture (${d.packetCapture.length} frames) — click a row for a simulated layer breakdown.</p>
      <div class="card">
        <div class="card-body" style="padding:0;overflow-x:auto;">
          <table class="data-table">
            <thead><tr><th>No.</th><th>Time</th><th>Source</th><th>Destination</th><th>Protocol</th><th>Length</th><th>Info</th></tr></thead>
            <tbody id="nt-packet-tbody">
              ${d.packetCapture.map(p => `
                <tr class="ti-row" data-pkt="${p.no}">
                  <td class="mono">${p.no}</td><td class="mono">${esc(p.time)}</td>
                  <td class="mono">${esc(p.src)}</td><td class="mono">${esc(p.dst)}</td>
                  <td><span class="badge badge-neutral">${esc(p.proto)}</span></td>
                  <td>${p.len}</td><td>${esc(p.info)}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  function _wirePackets() {
    document.querySelectorAll('#page-network-tools #nt-packet-tbody tr').forEach(tr => {
      tr.addEventListener('click', () => _openPacketDetail(parseInt(tr.dataset.pkt, 10)));
    });
  }

  function _openPacketDetail(no) {
    const d = DATA();
    const p = d.packetCapture.find(x => x.no === no);
    if (!p) return;
    _openDetail(`Frame ${p.no}`, `
      <div class="nt-detail-grid">
        <div class="nt-detail-field"><div class="nt-detail-field-label">Timestamp</div><div class="nt-detail-field-value">${esc(p.time)}</div></div>
        <div class="nt-detail-field"><div class="nt-detail-field-label">Length</div><div class="nt-detail-field-value">${p.len} bytes</div></div>
        <div class="nt-detail-field"><div class="nt-detail-field-label">Protocol</div><div class="nt-detail-field-value">${esc(p.proto)}</div></div>
      </div>
      <div class="nt-detail-sub-title">Simulated Layer Breakdown</div>
      <div class="ti-detail-link">${svg('topology', 'nt-inline-icon')} Layer 2 (Data Link) — Ethernet II</div>
      <div class="ti-detail-link">${svg('globe', 'nt-inline-icon')} Layer 3 (Network) — ${esc(p.src)} → ${esc(p.dst)}</div>
      <div class="ti-detail-link">${svg('terminal', 'nt-inline-icon')} Layer 4 (Transport) — ${p.proto.startsWith('TCP') || p.proto === 'TCP' ? 'TCP' : p.proto === 'DNS' ? 'UDP' : 'TCP'}</div>
      <div class="ti-detail-link">${svg('packet', 'nt-inline-icon')} Layer 7 (Application) — ${esc(p.proto)}: ${esc(p.info)}</div>
      <div class="nt-detail-sub-title">Info</div>
      <div class="ti-detail-value-box mono">${esc(p.info)}</div>
    `);
  }

  // ══════════════════════════════════════════════════════════════════════
  // HEX VIEWER (real, local-only utility)
  // ══════════════════════════════════════════════════════════════════════
  function _buildHexView() {
    return `
      <div class="card" style="max-width:900px;">
        <div class="card-header"><div class="card-title">Hex Viewer</div></div>
        <div class="card-body">
          <p style="color:var(--text-secondary);font-size:var(--text-sm);margin-bottom:var(--space-4);">
            Paste text or load a small local file to view a real hex + ASCII dump. Runs entirely in your browser — nothing is uploaded.
          </p>
          <textarea class="input" id="nt-hex-text" rows="3" placeholder="Type or paste text here…" style="width:100%;font-family:var(--font-mono);resize:vertical;"></textarea>
          <div style="display:flex;gap:var(--space-3);margin-top:var(--space-3);align-items:center;flex-wrap:wrap;">
            <button class="btn btn-primary" id="nt-hex-render">${svg('hex')} Render Hex Dump</button>
            <label class="btn btn-secondary" style="cursor:pointer;">${svg('upload')} Load File<input type="file" id="nt-hex-file" style="display:none;" /></label>
            <span id="nt-hex-filename" style="color:var(--text-tertiary);font-size:var(--text-xs);"></span>
          </div>
        </div>
      </div>
      <div class="card" style="margin-top:var(--space-4);">
        <div class="card-body" style="overflow-x:auto;">
          <pre class="mono" id="nt-hex-output" style="font-size:12px;line-height:1.6;color:var(--text-secondary);white-space:pre;">Nothing rendered yet.</pre>
        </div>
      </div>`;
  }

  function _wireHex() {
    document.getElementById('nt-hex-render')?.addEventListener('click', () => {
      const text = document.getElementById('nt-hex-text').value;
      _renderHexDump(new TextEncoder().encode(text));
    });
    document.getElementById('nt-hex-file')?.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 65536) { window.NotificationManager?.warning('File Too Large', 'Please choose a file under 64 KB for the demo hex viewer.'); return; }
      document.getElementById('nt-hex-filename').textContent = `${file.name} (${file.size} bytes)`;
      const reader = new FileReader();
      reader.onload = () => _renderHexDump(new Uint8Array(reader.result));
      reader.readAsArrayBuffer(file);
    });
  }

  function _renderHexDump(bytes) {
    const out = document.getElementById('nt-hex-output');
    if (!bytes.length) { out.textContent = 'No data to display.'; return; }
    const lines = [];
    for (let i = 0; i < bytes.length; i += 16) {
      const chunk = bytes.slice(i, i + 16);
      const offset = i.toString(16).padStart(8, '0');
      const hex = [...chunk].map(b => b.toString(16).padStart(2, '0')).join(' ').padEnd(47, ' ');
      const ascii = [...chunk].map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.').join('');
      lines.push(`${offset}  ${hex}  ${ascii}`);
    }
    out.textContent = lines.join('\n');
  }

  // ══════════════════════════════════════════════════════════════════════
  // NETWORK TOPOLOGY DEMO
  // ══════════════════════════════════════════════════════════════════════
  function _buildTopologyView() {
    return `
      <p style="color:var(--text-secondary);font-size:var(--text-sm);margin-bottom:var(--space-3);">A static labeled reference diagram of a typical segmented enterprise network — for demonstration purposes.</p>
      <div class="card">
        <div class="card-body" style="overflow-x:auto;">
          <svg viewBox="0 0 900 420" style="width:100%;min-width:700px;height:auto;" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <marker id="nt-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="var(--border-strong)"/></marker>
            </defs>
            <!-- Internet -->
            <g>
              <rect x="380" y="10" width="140" height="46" rx="8" fill="none" stroke="var(--color-info)" stroke-width="1.5"/>
              <text x="450" y="38" text-anchor="middle" fill="var(--text-primary)" font-size="13" font-family="var(--font-mono)">INTERNET</text>
            </g>
            <line x1="450" y1="56" x2="450" y2="96" stroke="var(--border-strong)" stroke-width="1.5" marker-end="url(#nt-arrow)"/>
            <!-- Firewall / Edge Router -->
            <rect x="370" y="96" width="160" height="46" rx="8" fill="none" stroke="var(--color-danger)" stroke-width="1.5"/>
            <text x="450" y="124" text-anchor="middle" fill="var(--text-primary)" font-size="13" font-family="var(--font-mono)">EDGE FIREWALL</text>
            <line x1="450" y1="142" x2="450" y2="182" stroke="var(--border-strong)" stroke-width="1.5" marker-end="url(#nt-arrow)"/>
            <!-- Core Switch -->
            <rect x="370" y="182" width="160" height="46" rx="8" fill="none" stroke="var(--color-primary)" stroke-width="1.5"/>
            <text x="450" y="210" text-anchor="middle" fill="var(--text-primary)" font-size="13" font-family="var(--font-mono)">CORE SWITCH</text>
            <!-- Branches -->
            <line x1="450" y1="228" x2="180" y2="284" stroke="var(--border-strong)" stroke-width="1.5"/>
            <line x1="450" y1="228" x2="450" y2="284" stroke="var(--border-strong)" stroke-width="1.5"/>
            <line x1="450" y1="228" x2="720" y2="284" stroke="var(--border-strong)" stroke-width="1.5"/>

            <rect x="90"  y="284" width="180" height="46" rx="8" fill="none" stroke="var(--color-success)" stroke-width="1.5"/>
            <text x="180" y="312" text-anchor="middle" fill="var(--text-primary)" font-size="12" font-family="var(--font-mono)">DMZ (Web/Mail)</text>

            <rect x="360" y="284" width="180" height="46" rx="8" fill="none" stroke="var(--color-warning)" stroke-width="1.5"/>
            <text x="450" y="312" text-anchor="middle" fill="var(--text-primary)" font-size="12" font-family="var(--font-mono)">Internal LAN</text>

            <rect x="630" y="284" width="180" height="46" rx="8" fill="none" stroke="#a78bfa" stroke-width="1.5"/>
            <text x="720" y="312" text-anchor="middle" fill="var(--text-primary)" font-size="12" font-family="var(--font-mono)">Server VLAN</text>

            <line x1="180" y1="330" x2="180" y2="360" stroke="var(--border-strong)" stroke-width="1.5"/>
            <line x1="450" y1="330" x2="450" y2="360" stroke="var(--border-strong)" stroke-width="1.5"/>
            <line x1="720" y1="330" x2="720" y2="360" stroke="var(--border-strong)" stroke-width="1.5"/>

            <rect x="105" y="360" width="150" height="40" rx="6" fill="none" stroke="var(--border-default)" stroke-width="1.5"/>
            <text x="180" y="385" text-anchor="middle" fill="var(--text-secondary)" font-size="11" font-family="var(--font-mono)">Public Web Server</text>

            <rect x="375" y="360" width="150" height="40" rx="6" fill="none" stroke="var(--border-default)" stroke-width="1.5"/>
            <text x="450" y="385" text-anchor="middle" fill="var(--text-secondary)" font-size="11" font-family="var(--font-mono)">Workstations</text>

            <rect x="645" y="360" width="150" height="40" rx="6" fill="none" stroke="var(--border-default)" stroke-width="1.5"/>
            <text x="720" y="385" text-anchor="middle" fill="var(--text-secondary)" font-size="11" font-family="var(--font-mono)">DB / App Servers</text>
          </svg>
        </div>
      </div>`;
  }

  // ══════════════════════════════════════════════════════════════════════
  // OSI / TCP-IP REFERENCE + COMMON PORTS
  // ══════════════════════════════════════════════════════════════════════
  function _buildReferenceView() {
    const d = DATA();
    return `
      <div class="card">
        <div class="card-header"><div class="card-title">OSI Reference Model</div></div>
        <div class="card-body" style="padding:0;">
          <table class="data-table">
            <thead><tr><th>#</th><th>Layer</th><th>PDU</th><th>Description</th><th>Examples</th></tr></thead>
            <tbody>
              ${d.osiLayers.map(l => `<tr><td>${l.n}</td><td><strong>${esc(l.name)}</strong></td><td>${esc(l.pdu)}</td><td>${esc(l.desc)}</td><td style="color:var(--text-tertiary);">${esc(l.examples)}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="card" style="margin-top:var(--space-4);">
        <div class="card-header"><div class="card-title">TCP/IP Reference Model</div></div>
        <div class="card-body" style="padding:0;">
          <table class="data-table">
            <thead><tr><th>Layer</th><th>OSI Equivalent</th><th>Examples</th></tr></thead>
            <tbody>
              ${d.tcpipLayers.map(l => `<tr><td><strong>${esc(l.name)}</strong></td><td>${esc(l.osiEquivalent)}</td><td style="color:var(--text-tertiary);">${esc(l.examples)}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="card" style="margin-top:var(--space-4);">
        <div class="card-header"><div class="card-title">Common Ports Reference</div></div>
        <div class="card-body" style="padding:0;">
          <table class="data-table">
            <thead><tr><th>Port</th><th>Service</th></tr></thead>
            <tbody>${d.commonPorts.map(p => `<tr><td class="mono">${p.port}</td><td>${esc(p.service)}</td></tr>`).join('')}</tbody>
          </table>
        </div>
      </div>`;
  }

  // ══════════════════════════════════════════════════════════════════════
  // REPORTS
  // ══════════════════════════════════════════════════════════════════════
  function _buildReportsView() {
    return `
      <div class="card" style="max-width:640px;">
        <div class="card-header"><div class="card-title">Export Toolkit Data</div></div>
        <div class="card-body">
          <p style="color:var(--text-secondary);font-size:var(--text-sm);margin-bottom:var(--space-4);">Export your saved firewall rule set and the bundled reference data. Generated entirely in your browser.</p>
          <div class="nt-export-row">
            <button class="btn btn-secondary" id="nt-export-fw-json">${svg('down')} Firewall Rules (JSON)</button>
            <button class="btn btn-secondary" id="nt-export-fw-txt">${svg('down')} iptables Commands (TXT)</button>
            <button class="btn btn-secondary" id="nt-export-html">${svg('down')} Full HTML Report</button>
          </div>
        </div>
      </div>`;
  }

  function _wireReports() {
    document.getElementById('nt-export-fw-json')?.addEventListener('click', () => {
      _download('firewall-rules.json', JSON.stringify(firewallRules, null, 2), 'application/json');
      window.NotificationManager?.success('Exported', 'Firewall rules exported as JSON.');
    });
    document.getElementById('nt-export-fw-txt')?.addEventListener('click', () => {
      const text = document.getElementById('nt-fw-commands')?.textContent || firewallRules.map(r => JSON.stringify(r)).join('\n');
      _download('firewall-rules.txt', text, 'text/plain');
      window.NotificationManager?.success('Exported', 'iptables commands exported.');
    });
    document.getElementById('nt-export-html')?.addEventListener('click', _exportHTMLReport);
  }

  function _download(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function _exportHTMLReport() {
    const d = DATA();
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Network Toolkit Report</title>
      <style>body{font-family:-apple-system,sans-serif;max-width:960px;margin:40px auto;color:#0f172a;}
      table{width:100%;border-collapse:collapse;margin:16px 0;} th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:13px;}
      th{background:#f1f5f9;} h1{font-size:22px;} h2{font-size:16px;margin-top:32px;} .warn{background:#fef3c7;padding:10px;border-radius:6px;font-size:12px;}</style>
      </head><body>
      <h1>Khan Security Solutions — Network Toolkit Report</h1>
      <div class="warn">⚠ Educational simulation — DNS/WHOIS/port-scan data is synthetic and offline.</div>
      <h2>Firewall Rule Set (${firewallRules.length})</h2>
      <table><tr><th>Action</th><th>Direction</th><th>Protocol</th><th>Source</th><th>Port</th><th>Description</th></tr>
      ${firewallRules.map(r => `<tr><td>${esc(r.action)}</td><td>${esc(r.direction)}</td><td>${esc(r.protocol)}</td><td>${esc(r.source)}</td><td>${esc(r.port)}</td><td>${esc(r.desc)}</td></tr>`).join('') || '<tr><td colspan="6">No rules saved.</td></tr>'}
      </table>
      <h2>Common Ports Reference</h2>
      <table><tr><th>Port</th><th>Service</th></tr>${d.commonPorts.map(p => `<tr><td>${p.port}</td><td>${esc(p.service)}</td></tr>`).join('')}</table>
      <p style="color:#64748b;font-size:11px;margin-top:24px;">Generated by Khan Security Solutions Enterprise · ${new Date().toLocaleString()}</p>
      </body></html>`;
    _download('network-toolkit-report.html', html, 'text/html');
    window.NotificationManager?.success('Report Exported', 'Full HTML report downloaded.');
  }

  // ══════════════════════════════════════════════════════════════════════
  // DETAIL PANEL
  // ══════════════════════════════════════════════════════════════════════
  function _openDetail(title, bodyHtml) {
    document.getElementById('nt-detail-title').textContent = title;
    document.getElementById('nt-detail-body').innerHTML = bodyHtml;
    document.getElementById('nt-detail-overlay').classList.add('open');
  }
  function _closeDetail() {
    document.getElementById('nt-detail-overlay').classList.remove('open');
  }

  function _copyText(text, msg) {
    navigator.clipboard?.writeText(text).then(() => {
      window.NotificationManager?.info(msg || 'Copied', '');
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy');
      document.body.removeChild(ta);
      window.NotificationManager?.info(msg || 'Copied', '');
    });
  }

  // ══════════════════════════════════════════════════════════════════════
  // GLOBAL SEARCH INTEGRATION
  // ══════════════════════════════════════════════════════════════════════
  function _registerSearch() {
    if (!window.SearchEngine) return;
    window.SearchEngine.register('Network Tools', [
      { title: 'Network Security Toolkit', meta: 'IP calc, DNS, WHOIS, scans, packets, hex, topology', route: 'network-tools', keywords: 'network tools ip subnet cidr dns whois port scan nmap firewall packet hex topology osi tcp' },
      { title: 'IP / Subnet / CIDR Calculator', meta: 'Compute network, broadcast, usable range', route: 'network-tools', keywords: 'ip subnet cidr calculator mask broadcast netmask' },
      { title: 'DNS Lookup', meta: 'Offline zone file resolver', route: 'network-tools', keywords: 'dns lookup a aaaa mx ns txt cname' },
      { title: 'Port Scanner Simulator', meta: 'Simulated scan against sample hosts', route: 'network-tools', keywords: 'port scan nmap simulator open closed filtered' },
      { title: 'Firewall Rule Builder', meta: 'Build allow/deny rules and iptables commands', route: 'network-tools', keywords: 'firewall rules iptables allow deny' },
      { title: 'Hex Viewer', meta: 'Hex + ASCII byte dump', route: 'network-tools', keywords: 'hex viewer bytes ascii dump' },
    ]);
  }

  // ── Public API ─────────────────────────────────────────────────────────
  return { register };

})();

window.NetworkTools = NetworkTools;

if (window.Router) {
  NetworkTools.register();
} else {
  console.error('[NetworkTools] Router not found. Ensure router.js loads before network-tools.js.');
}
