/**
 * KHAN SECURITY SOLUTIONS ENTERPRISE
 * Log Analyzer — SIEM Workbench Module (log-analyzer.js)
 * v0.4.0 — Part 4
 *
 * Educational offline SOC platform.
 * All analysis is client-side. No data leaves the browser.
 *
 * Integrates with:
 *   window.Router            — route: 'siem'
 *   window.SearchEngine      — searchable content registration
 *   window.NotificationManager — alerts and feedback
 *   window.StorageManager    — log persistence via IndexedDB
 *   window.SampleLogs        — bundled sample log data
 */

const LogAnalyzer = (() => {

  // ── State ──────────────────────────────────────────────────────────────────
  let mounted       = false;
  let allLogs       = [];        // Full parsed log array (all sources)
  let filteredLogs  = [];        // After search/filter applied
  let currentPage   = 1;
  const PAGE_SIZE   = 50;
  let sortField     = 'ts';
  let sortAsc       = false;
  let activeTab     = 'logs';
  let searchQuery   = '';
  let useRegex      = false;
  let filterSev     = 'all';
  let filterSrc     = 'all';
  let filterCat     = 'all';
  let detailLog     = null;
  let ruleHits      = {};        // ruleId → count

  // ── Detection Rules ────────────────────────────────────────────────────────
  const DETECTION_RULES = [
    {
      id: 'brute-force',
      title: 'Brute Force Attack',
      desc: 'Five or more failed logon attempts from the same IP within 60 seconds.',
      severity: 'critical',
      mitre: 'T1110',
      tactic: 'Credential Access',
      enabled: true,
      match: (logs) => {
        const fails = logs.filter(l => l._eid === 4625 || (l.msg && l.msg.toLowerCase().includes('failed') && l.msg.toLowerCase().includes('log')));
        const groups = _groupBy(fails, l => `${l.ip}|${_timeBucket(l.ts, 60)}`);
        return Object.values(groups).filter(g => g.length >= 5).flat();
      },
    },
    {
      id: 'password-spray',
      title: 'Password Spray',
      desc: 'Failed logon attempts against multiple different users from the same IP within 2 minutes.',
      severity: 'critical',
      mitre: 'T1110.003',
      tactic: 'Credential Access',
      enabled: true,
      match: (logs) => {
        const fails = logs.filter(l => l._eid === 4625 || (l.msg && l.msg.includes('Failed password')));
        const groups = _groupBy(fails, l => `${l.ip}|${_timeBucket(l.ts, 120)}`);
        return Object.values(groups).filter(g => {
          const users = new Set(g.map(e => e.user));
          return users.size >= 3;
        }).flat();
      },
    },
    {
      id: 'account-lockout',
      title: 'Account Lockout',
      desc: 'User account locked out — possible brute force.',
      severity: 'high',
      mitre: 'T1110.001',
      tactic: 'Credential Access',
      enabled: true,
      match: (logs) => logs.filter(l => l._eid === 4740 || (l.msg && l.msg.toLowerCase().includes('locked out'))),
    },
    {
      id: 'lateral-movement',
      title: 'Lateral Movement (SMB)',
      desc: 'Connections to administrative shares (Admin$, C$, IPC$) from a workstation.',
      severity: 'critical',
      mitre: 'T1021.002',
      tactic: 'Lateral Movement',
      enabled: true,
      match: (logs) => logs.filter(l => l._eid === 5145 || (l.msg && /Admin\$|C\$|IPC\$/.test(l.msg))),
    },
    {
      id: 'persistence-task',
      title: 'Scheduled Task Created',
      desc: 'A new scheduled task was created — common persistence mechanism.',
      severity: 'high',
      mitre: 'T1053.005',
      tactic: 'Persistence',
      enabled: true,
      match: (logs) => logs.filter(l => l._eid === 4698 || (l.msg && l.msg.toLowerCase().includes('scheduled task') && l.msg.toLowerCase().includes('created'))),
    },
    {
      id: 'privilege-escalation',
      title: 'Privilege Escalation',
      desc: 'Special privileges assigned or sudo executed to root.',
      severity: 'high',
      mitre: 'T1078.002',
      tactic: 'Privilege Escalation',
      enabled: true,
      match: (logs) => logs.filter(l =>
        l._eid === 4672 ||
        (l.msg && l.msg.includes('SeDebugPrivilege')) ||
        (l.msg && l.msg.includes('sudo') && l.msg.includes('root'))
      ),
    },
    {
      id: 'powershell-encoded',
      title: 'Suspicious PowerShell (Encoded)',
      desc: 'PowerShell executed with -EncodedCommand flag — commonly used to obfuscate malicious code.',
      severity: 'critical',
      mitre: 'T1059.001',
      tactic: 'Execution',
      enabled: true,
      match: (logs) => logs.filter(l => l.msg && l.msg.toLowerCase().includes('encodedcommand')),
    },
    {
      id: 'powershell-suspicious',
      title: 'Suspicious PowerShell Flags',
      desc: 'PowerShell executed with -nop -w hidden flags, bypassing execution policy.',
      severity: 'high',
      mitre: 'T1059.001',
      tactic: 'Execution',
      enabled: true,
      match: (logs) => logs.filter(l => l.msg && /powershell.*-nop|-noni|-w\s+hidden|-exec\s+bypass/i.test(l.msg)),
    },
    {
      id: 'new-local-admin',
      title: 'New Local Admin Account',
      desc: 'A user account was added to the Administrators group.',
      severity: 'critical',
      mitre: 'T1136.001',
      tactic: 'Persistence',
      enabled: true,
      match: (logs) => logs.filter(l =>
        l._eid === 4732 ||
        (l.msg && l.msg.toLowerCase().includes('administrators') && l.msg.toLowerCase().includes('added')) ||
        (l.msg && l.msg.includes('UID=0') && l.msg.includes('useradd'))
      ),
    },
    {
      id: 'disabled-audit',
      title: 'Security Audit Policy Disabled',
      desc: 'Windows audit policy was modified to remove success/failure logging.',
      severity: 'critical',
      mitre: 'T1562.002',
      tactic: 'Defense Evasion',
      enabled: true,
      match: (logs) => logs.filter(l => l._eid === 4719 || (l.msg && l.msg.toLowerCase().includes('audit policy') && l.msg.toLowerCase().includes('removed'))),
    },
    {
      id: 'c2-beacon',
      title: 'Possible C2 Beacon',
      desc: 'Outbound connection to uncommon port that may indicate command and control communication.',
      severity: 'critical',
      mitre: 'T1071',
      tactic: 'Command and Control',
      enabled: true,
      match: (logs) => logs.filter(l => l.msg && /C2|beacon|4444|8080|1337|31337/i.test(l.msg) && l.category === 'C2'),
    },
    {
      id: 'rdp-login',
      title: 'Remote Desktop Login',
      desc: 'A user authenticated via Remote Desktop (Logon Type 10).',
      severity: 'medium',
      mitre: 'T1021.001',
      tactic: 'Lateral Movement',
      enabled: true,
      match: (logs) => logs.filter(l => l._eid === 4624 && l.msg && l.msg.includes('RemoteInteractive')),
    },
    {
      id: 'web-attack',
      title: 'Web Application Attack',
      desc: 'Path traversal, SQL injection, or vulnerability scanner detected in web logs.',
      severity: 'high',
      mitre: 'T1190',
      tactic: 'Initial Access',
      enabled: true,
      match: (logs) => logs.filter(l => l.category === 'Web Attack' || (l.msg && /traversal|injection|sqlmap|scanner|\/etc\/passwd/i.test(l.msg))),
    },
  ];

  // ── SVG Icons ──────────────────────────────────────────────────────────────
  const I = {
    upload:  `<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>`,
    search:  `<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z"/>`,
    shield:  `<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>`,
    logs:    `<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776"/>`,
    rules:   `<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>`,
    charts:  `<path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/>`,
    report:  `<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>`,
    close:   `<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>`,
    warn:    `<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>`,
    info:    `<path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/>`,
    check:   `<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>`,
    down:    `<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>`,
    trash:   `<path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>`,
    windows: `<path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"/>`,
    linux:   `<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z"/>`,
    web:     `<path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"/>`,
    fire:    `<path stroke-linecap="round" stroke-linejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z"/>`,
    sort:    `<path stroke-linecap="round" stroke-linejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5"/>`,
  };

  function svg(name, cls = '') {
    return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">${I[name] || I.info}</svg>`;
  }

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ROUTE REGISTRATION
  // ══════════════════════════════════════════════════════════════════════════
  function register() {
    window.Router.register('siem', {
      title: 'Log Analyzer',
      init,
      render,
    });
  }

  function init() {
    _registerSearch();
  }

  function render() {
    const el = document.getElementById('page-siem');
    if (!el) return;

    if (!mounted) {
      el.innerHTML = _buildShell();
      mounted = true;
      _wireAll();
    }

    _switchTab(activeTab);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // HTML SHELL
  // ══════════════════════════════════════════════════════════════════════════
  function _buildShell() {
    return `
    <div class="la-shell">

      <!-- Header -->
      <div class="la-header">
        <div class="la-header-left">
          <div class="la-header-icon">${svg('logs')}</div>
          <div>
            <div class="la-header-title">Enterprise Log Analyzer</div>
            <div class="la-header-sub" id="la-source-label">No logs loaded — load sample data or upload a file</div>
          </div>
        </div>
        <div class="la-header-right">
          <span class="badge badge-warning" style="font-family:var(--font-mono);font-size:10px;">⚠ EDUCATIONAL SIMULATION</span>
          <button class="btn btn-secondary btn-sm" id="la-clear-btn">${svg('trash')} Clear Logs</button>
          <button class="btn btn-primary btn-sm" id="la-load-sample-quick">${svg('logs')} Load Sample Data</button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="la-tabs" role="tablist">
        <div class="la-tab active" data-tab="logs"    role="tab">${svg('logs')}   Log Events</div>
        <div class="la-tab"        data-tab="upload"  role="tab">${svg('upload')} Import Logs</div>
        <div class="la-tab"        data-tab="rules"   role="tab">${svg('rules')}  Detection Rules</div>
        <div class="la-tab"        data-tab="charts"  role="tab">${svg('charts')} Visualizations</div>
        <div class="la-tab"        data-tab="reports" role="tab">${svg('report')} Reports</div>
      </div>

      <!-- Stat Row -->
      <div class="la-stat-row" id="la-stat-row">
        ${_buildStatRow()}
      </div>

      <!-- Body — all views -->
      <div class="la-body">

        <!-- ── LOG EVENTS VIEW ── -->
        <div class="la-view active" id="la-view-logs">
          <div class="la-search-bar">
            <div class="la-search-wrap">
              ${svg('search', 'la-search-icon')}
              <input class="la-search-input" id="la-search" type="text"
                     placeholder="Search logs… (field:value syntax: host:DC01 user:admin ip:192.168.10.45)"
                     autocomplete="off" spellcheck="false" />
            </div>
            <select class="la-filter-select" id="la-filter-sev">
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
            <select class="la-filter-select" id="la-filter-src">
              <option value="all">All Sources</option>
              <option value="windows">Windows</option>
              <option value="linux">Linux</option>
              <option value="apache">Apache</option>
              <option value="nginx">Nginx</option>
              <option value="firewall">Firewall</option>
              <option value="custom">Uploaded</option>
            </select>
            <select class="la-filter-select" id="la-filter-cat">
              <option value="all">All Categories</option>
              <option value="Authentication">Authentication</option>
              <option value="Account Lockout">Account Lockout</option>
              <option value="Account Management">Account Management</option>
              <option value="Privilege Use">Privilege Use</option>
              <option value="Privilege Escalation">Privilege Escalation</option>
              <option value="Lateral Movement">Lateral Movement</option>
              <option value="Persistence">Persistence</option>
              <option value="Process Execution">Process Execution</option>
              <option value="Web Access">Web Access</option>
              <option value="Web Attack">Web Attack</option>
              <option value="Firewall">Firewall</option>
              <option value="DNS">DNS</option>
              <option value="C2">C2</option>
            </select>
            <div class="la-regex-toggle" id="la-regex-toggle" title="Toggle Regex search">
              <span class="la-regex-dot"></span> RegEx
            </div>
          </div>

          <div class="la-table-wrap" id="la-table-wrap">
            <table class="la-table" id="la-table">
              <thead>
                <tr>
                  <th class="la-col-time"     data-sort="ts">Timestamp ${svg('sort')}</th>
                  <th class="la-col-severity" data-sort="level">Severity</th>
                  <th class="la-col-host"     data-sort="host">Host</th>
                  <th class="la-col-user"     data-sort="user">User</th>
                  <th class="la-col-src-ip"   data-sort="ip">Source IP</th>
                  <th class="la-col-event"    data-sort="_eid">Event ID</th>
                  <th class="la-col-category" data-sort="category">Category</th>
                  <th class="la-col-mitre"    data-sort="mitre">MITRE</th>
                  <th class="la-col-msg">Message</th>
                </tr>
              </thead>
              <tbody id="la-table-body">
                <tr class="la-empty-row">
                  <td colspan="9">
                    <div style="display:flex;flex-direction:column;align-items:center;gap:var(--space-3);padding:var(--space-10);">
                      ${svg('logs')} <span>No logs loaded. Use <strong>Import Logs</strong> or <strong>Load Sample Data</strong> to begin analysis.</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="la-table-footer">
            <span class="la-table-count" id="la-count-label">0 events</span>
            <div class="la-pagination" id="la-pagination"></div>
          </div>
        </div>

        <!-- ── IMPORT LOGS VIEW ── -->
        <div class="la-view" id="la-view-upload">
          <div class="la-upload-view">
            <div>
              <div style="font-size:var(--text-lg);font-weight:var(--weight-semibold);color:var(--text-primary);margin-bottom:var(--space-2);">Import Log Files</div>
              <p style="font-size:var(--text-sm);color:var(--text-tertiary);margin-bottom:var(--space-5);">
                Upload your own log files for analysis. All processing happens entirely in your browser — no data is uploaded to any server.
              </p>
            </div>

            <div class="la-dropzone" id="la-dropzone">
              <input type="file" id="la-file-input" multiple
                     accept=".log,.txt,.csv,.json,.evtx" />
              <div class="la-dropzone-icon">${svg('upload')}</div>
              <div class="la-dropzone-title">Drag &amp; Drop Log Files Here</div>
              <div class="la-dropzone-sub">or click to browse files</div>
              <div class="la-dropzone-types">
                <span class="la-type-chip">.log</span>
                <span class="la-type-chip">.txt</span>
                <span class="la-type-chip">.csv</span>
                <span class="la-type-chip">.json</span>
                <span class="la-type-chip">Windows Events</span>
                <span class="la-type-chip">Linux Auth</span>
                <span class="la-type-chip">Apache</span>
                <span class="la-type-chip">Nginx</span>
                <span class="la-type-chip">Firewall</span>
              </div>
            </div>

            <!-- Sample data loader -->
            <div>
              <div style="font-size:var(--text-sm);font-weight:var(--weight-semibold);color:var(--text-secondary);margin-bottom:var(--space-3);text-transform:uppercase;letter-spacing:0.07em;">
                Load Sample Educational Datasets
                <span class="badge badge-info" style="margin-left:var(--space-2);font-size:10px;">SIMULATED DATA</span>
              </div>
              <div class="la-sample-grid">
                <div class="la-sample-card" data-source="windows">
                  <div class="la-sample-icon" style="background:var(--color-info-bg);color:var(--color-info-light);">${svg('windows')}</div>
                  <div class="la-sample-card-title">Windows Event Logs</div>
                  <div class="la-sample-card-count">27 events · Brute force, Lateral movement, Persistence</div>
                </div>
                <div class="la-sample-card" data-source="linux">
                  <div class="la-sample-icon" style="background:var(--color-success-bg);color:var(--color-success-light);">${svg('linux')}</div>
                  <div class="la-sample-card-title">Linux auth.log</div>
                  <div class="la-sample-card-count">18 events · SSH brute force, Privilege escalation</div>
                </div>
                <div class="la-sample-card" data-source="apache">
                  <div class="la-sample-icon" style="background:var(--color-warning-bg);color:var(--color-warning-light);">${svg('web')}</div>
                  <div class="la-sample-card-title">Apache Access Logs</div>
                  <div class="la-sample-card-count">10 events · Web attacks, Path traversal, SQLi</div>
                </div>
                <div class="la-sample-card" data-source="nginx">
                  <div class="la-sample-icon" style="background:var(--color-accent-glow);color:var(--color-accent-light);">${svg('web')}</div>
                  <div class="la-sample-card-title">Nginx Access Logs</div>
                  <div class="la-sample-card-count">5 events · Scanner probes, Forbidden access</div>
                </div>
                <div class="la-sample-card" data-source="firewall">
                  <div class="la-sample-icon" style="background:var(--color-danger-bg);color:var(--color-danger-light);">${svg('fire')}</div>
                  <div class="la-sample-card-title">Firewall Logs</div>
                  <div class="la-sample-card-count">10 events · SMB scan, C2 beacon, SSH block</div>
                </div>
                <div class="la-sample-card" data-source="all">
                  <div class="la-sample-icon" style="background:var(--color-primary-glow);color:var(--color-primary-light);">${svg('shield')}</div>
                  <div class="la-sample-card-title">Full Attack Scenario</div>
                  <div class="la-sample-card-count">All 70 events · Complete APT kill chain</div>
                </div>
              </div>
            </div>

            <!-- Format guide -->
            <div class="card" style="background:var(--bg-elevated);border-color:var(--border-subtle);">
              <div class="card-body">
                <div style="font-size:var(--text-sm);font-weight:var(--weight-semibold);color:var(--text-secondary);margin-bottom:var(--space-3);">Supported Log Formats</div>
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:var(--space-3);">
                  ${[
                    ['Windows Event Log (JSON export)', 'Event ID, Timestamp, User, Host fields'],
                    ['Linux auth.log / syslog', 'sshd, sudo, useradd entries'],
                    ['Apache / Nginx Access Log', 'Combined log format'],
                    ['Firewall Log (CSV or JSON)', 'src, dst, port, action columns'],
                    ['Generic CSV', 'timestamp, level, message columns'],
                    ['Generic JSON Array', 'Array of log objects'],
                  ].map(([title, desc]) => `
                    <div style="background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:var(--space-3);">
                      <div style="font-size:var(--text-xs);font-weight:var(--weight-semibold);color:var(--text-primary);margin-bottom:2px;">${esc(title)}</div>
                      <div style="font-size:11px;color:var(--text-tertiary);">${esc(desc)}</div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── DETECTION RULES VIEW ── -->
        <div class="la-view" id="la-view-rules">
          <div class="la-rules-view">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-5);">
              <div>
                <div style="font-size:var(--text-lg);font-weight:var(--weight-semibold);color:var(--text-primary);">Detection Rules</div>
                <div style="font-size:var(--text-xs);color:var(--text-tertiary);margin-top:2px;">${DETECTION_RULES.length} rules active — run against loaded logs</div>
              </div>
              <button class="btn btn-primary btn-sm" id="la-run-rules-btn">${svg('shield')} Run All Rules</button>
            </div>
            <div id="la-rules-list">
              ${DETECTION_RULES.map(r => _buildRuleCard(r)).join('')}
            </div>
          </div>
        </div>

        <!-- ── VISUALIZATIONS VIEW ── -->
        <div class="la-view" id="la-view-charts">
          <div class="la-charts-view" id="la-charts-container">
            <div class="la-chart-card full-width" style="text-align:center;padding:var(--space-12);">
              <div style="color:var(--text-tertiary);font-size:var(--text-sm);">Load logs first to generate visualizations.</div>
            </div>
          </div>
        </div>

        <!-- ── REPORTS VIEW ── -->
        <div class="la-view" id="la-view-reports">
          <div class="la-reports-view" id="la-reports-container">
            ${_buildReportsView()}
          </div>
        </div>

      </div><!-- /la-body -->
    </div><!-- /la-shell -->

    <!-- ── LOG DETAIL MODAL ── -->
    <div class="la-detail-overlay" id="la-detail-overlay">
      <div class="la-detail-panel" id="la-detail-panel">
        <div class="la-detail-header">
          <div class="la-detail-title">Log Event Detail</div>
          <div class="la-detail-close" id="la-detail-close">${svg('close')}</div>
        </div>
        <div id="la-detail-body"></div>
      </div>
    </div>`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STAT ROW
  // ══════════════════════════════════════════════════════════════════════════
  function _buildStatRow() {
    const total    = allLogs.length;
    const critical = allLogs.filter(l => l.level === 'critical').length;
    const warnings = allLogs.filter(l => l.level === 'warning').length;
    const mitreHit = allLogs.filter(l => l.mitre).length;
    const sources  = [...new Set(allLogs.map(l => l._source))].length;

    return `
      <div class="la-stat">
        <div class="la-stat-icon primary">${svg('logs')}</div>
        <div>
          <div class="la-stat-value" id="la-stat-total">${total.toLocaleString()}</div>
          <div class="la-stat-label">Total Events</div>
        </div>
      </div>
      <div class="la-stat">
        <div class="la-stat-icon critical">${svg('warn')}</div>
        <div>
          <div class="la-stat-value" id="la-stat-critical">${critical.toLocaleString()}</div>
          <div class="la-stat-label">Critical</div>
        </div>
      </div>
      <div class="la-stat">
        <div class="la-stat-icon warning">${svg('warn')}</div>
        <div>
          <div class="la-stat-value" id="la-stat-warning">${warnings.toLocaleString()}</div>
          <div class="la-stat-label">Warnings</div>
        </div>
      </div>
      <div class="la-stat">
        <div class="la-stat-icon info">${svg('shield')}</div>
        <div>
          <div class="la-stat-value" id="la-stat-mitre">${mitreHit.toLocaleString()}</div>
          <div class="la-stat-label">MITRE Matches</div>
        </div>
      </div>
      <div class="la-stat">
        <div class="la-stat-icon success">${svg('check')}</div>
        <div>
          <div class="la-stat-value" id="la-stat-sources">${sources}</div>
          <div class="la-stat-label">Log Sources</div>
        </div>
      </div>`;
  }

  function _refreshStats() {
    const el = document.getElementById('la-stat-row');
    if (el) el.innerHTML = _buildStatRow();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DETECTION RULE CARD
  // ══════════════════════════════════════════════════════════════════════════
  function _buildRuleCard(r) {
    const hits = ruleHits[r.id] || 0;
    return `
    <div class="la-rule-card" id="la-rule-${esc(r.id)}">
      <div class="la-rule-status ${r.enabled ? 'enabled' : 'disabled'}"></div>
      <div class="la-rule-body">
        <div class="la-rule-title">${esc(r.title)}</div>
        <div class="la-rule-desc">${esc(r.desc)}</div>
        <div class="la-rule-meta">
          <span class="la-rule-chip mitre">${esc(r.mitre)}</span>
          <span class="la-rule-chip tactic">${esc(r.tactic)}</span>
          <span class="la-rule-chip severity-${r.severity}">${esc(r.severity.toUpperCase())}</span>
        </div>
      </div>
      <div class="la-rule-hits ${hits > 0 ? 'fired' : ''}" id="la-hits-${esc(r.id)}">
        ${hits > 0 ? `${hits} HIT${hits > 1 ? 'S' : ''}` : 'NOT RUN'}
      </div>
    </div>`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // REPORTS VIEW
  // ══════════════════════════════════════════════════════════════════════════
  function _buildReportsView() {
    return `
    <div style="font-size:var(--text-lg);font-weight:var(--weight-semibold);color:var(--text-primary);margin-bottom:var(--space-5);">Reports &amp; Export</div>

    <div class="la-report-section">
      <div class="la-report-header">
        <div class="la-report-title">${svg('report', 'inline-icon')} Executive Summary</div>
        <div style="display:flex;gap:var(--space-2);">
          <button class="btn btn-secondary btn-sm" id="la-export-html">${svg('down')} Export HTML</button>
          <button class="btn btn-secondary btn-sm" id="la-export-json">${svg('down')} Export JSON</button>
          <button class="btn btn-secondary btn-sm" id="la-export-pdf">${svg('down')} PDF (Print)</button>
        </div>
      </div>
      <div class="la-report-body" id="la-exec-summary">
        <p style="color:var(--text-tertiary);font-size:var(--text-sm);">Load logs and run detection rules to generate an executive summary.</p>
      </div>
    </div>

    <div class="la-report-section">
      <div class="la-report-header">
        <div class="la-report-title">${svg('shield', 'inline-icon')} IOC Summary</div>
        <button class="btn btn-secondary btn-sm" id="la-export-ioc">${svg('down')} Export IOCs</button>
      </div>
      <div class="la-report-body" id="la-ioc-summary">
        <p style="color:var(--text-tertiary);font-size:var(--text-sm);">Indicators of Compromise will appear here after log analysis.</p>
      </div>
    </div>

    <div class="la-report-section">
      <div class="la-report-header">
        <div class="la-report-title">${svg('rules', 'inline-icon')} MITRE ATT&amp;CK Summary</div>
      </div>
      <div class="la-report-body" id="la-mitre-summary">
        <p style="color:var(--text-tertiary);font-size:var(--text-sm);">MITRE ATT&CK mapping will appear here after running detection rules.</p>
      </div>
    </div>`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // WIRE ALL INTERACTIONS
  // ══════════════════════════════════════════════════════════════════════════
  function _wireAll() {
    _wireTabs();
    _wireSearch();
    _wireFilters();
    _wireSort();
    _wireUpload();
    _wireSamples();
    _wireRules();
    _wireDetail();
    _wireButtons();
  }

  // ── Tabs ───────────────────────────────────────────────────────────────────
  function _wireTabs() {
    document.querySelectorAll('#page-siem .la-tab').forEach(tab => {
      tab.addEventListener('click', () => _switchTab(tab.dataset.tab));
    });
  }

  function _switchTab(tabId) {
    activeTab = tabId;
    document.querySelectorAll('#page-siem .la-tab').forEach(t =>
      t.classList.toggle('active', t.dataset.tab === tabId));
    document.querySelectorAll('#page-siem .la-view').forEach(v =>
      v.classList.toggle('active', v.id === `la-view-${tabId}`));

    if (tabId === 'charts' && allLogs.length > 0) _renderCharts();
    if (tabId === 'reports' && allLogs.length > 0) _renderReports();
    if (tabId === 'rules') _refreshRuleList();
  }

  // ── Search ─────────────────────────────────────────────────────────────────
  function _wireSearch() {
    const input = document.getElementById('la-search');
    const regexBtn = document.getElementById('la-regex-toggle');
    if (!input || !regexBtn) return;

    let debounce;
    input.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        searchQuery = input.value.trim();
        currentPage = 1;
        _applyFilters();
      }, 180);
    });

    regexBtn.addEventListener('click', () => {
      useRegex = !useRegex;
      regexBtn.classList.toggle('active', useRegex);
      _applyFilters();
    });
  }

  // ── Filters ────────────────────────────────────────────────────────────────
  function _wireFilters() {
    ['la-filter-sev', 'la-filter-src', 'la-filter-cat'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('change', () => {
        filterSev = document.getElementById('la-filter-sev')?.value || 'all';
        filterSrc = document.getElementById('la-filter-src')?.value || 'all';
        filterCat = document.getElementById('la-filter-cat')?.value || 'all';
        currentPage = 1;
        _applyFilters();
      });
    });
  }

  // ── Sort ───────────────────────────────────────────────────────────────────
  function _wireSort() {
    document.querySelectorAll('#la-table th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const field = th.dataset.sort;
        if (sortField === field) {
          sortAsc = !sortAsc;
        } else {
          sortField = field;
          sortAsc = true;
        }
        document.querySelectorAll('#la-table th').forEach(h => h.classList.remove('sorted'));
        th.classList.add('sorted');
        _applyFilters();
      });
    });
  }

  // ── Upload ──────────────────────────────────────────────────────────────────
  function _wireUpload() {
    const dropzone = document.getElementById('la-dropzone');
    const fileInput = document.getElementById('la-file-input');
    if (!dropzone || !fileInput) return;

    dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('drag-over'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
    dropzone.addEventListener('drop', e => {
      e.preventDefault();
      dropzone.classList.remove('drag-over');
      _handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', () => _handleFiles(fileInput.files));
  }

  // ── Sample data cards ──────────────────────────────────────────────────────
  function _wireSamples() {
    document.querySelectorAll('#page-siem .la-sample-card').forEach(card => {
      card.addEventListener('click', () => {
        const source = card.dataset.source;
        _loadSampleData(source);
        _switchTab('logs');
      });
    });

    const quickBtn = document.getElementById('la-load-sample-quick');
    if (quickBtn) quickBtn.addEventListener('click', () => {
      _loadSampleData('all');
      _switchTab('logs');
    });
  }

  // ── Rule runner ────────────────────────────────────────────────────────────
  function _wireRules() {
    const btn = document.getElementById('la-run-rules-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (!allLogs.length) {
        window.NotificationManager.warning('No Logs', 'Load sample data or upload logs first.');
        return;
      }
      _runDetectionRules();
    });
  }

  // ── Detail panel ───────────────────────────────────────────────────────────
  function _wireDetail() {
    const overlay = document.getElementById('la-detail-overlay');
    const closeBtn = document.getElementById('la-detail-close');
    if (!overlay || !closeBtn) return;

    closeBtn.addEventListener('click', _closeDetail);
    overlay.addEventListener('click', e => { if (e.target === overlay) _closeDetail(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && detailLog) _closeDetail(); });
  }

  function _closeDetail() {
    detailLog = null;
    document.getElementById('la-detail-overlay')?.classList.remove('open');
  }

  // ── Header buttons ─────────────────────────────────────────────────────────
  function _wireButtons() {
    document.getElementById('la-clear-btn')?.addEventListener('click', () => {
      allLogs = [];
      filteredLogs = [];
      ruleHits = {};
      currentPage = 1;
      _refreshStats();
      _renderTable();
      _updateSourceLabel('No logs loaded');
      window.NotificationManager.info('Logs Cleared', 'All log data has been removed from memory.');
    });

    document.getElementById('la-export-html')?.addEventListener('click', _exportHTML);
    document.getElementById('la-export-json')?.addEventListener('click', _exportJSON);
    document.getElementById('la-export-ioc')?.addEventListener('click', _exportIOCs);
    document.getElementById('la-export-pdf')?.addEventListener('click', () => {
      window.print();
      window.NotificationManager.info('Print Dialog', 'Use your browser\'s Save as PDF option to export.');
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SAMPLE DATA LOADER
  // ══════════════════════════════════════════════════════════════════════════
  function _loadSampleData(source) {
    if (!window.SampleLogs) {
      window.NotificationManager.error('Sample Data Missing', 'assets/data/sample-logs.js not loaded.');
      return;
    }

    const S = window.SampleLogs;
    let newLogs = [];

    const normalize = (logs, src) => logs.map((l, i) => ({
      ...l,
      _id:     `${src}_${i}_${Date.now()}`,
      _source: src,
      _eid:    l.id || null,
      ip:      l.ip || l.src || '',
      user:    l.user || '',
      host:    l.host || '',
      level:   l.level || 'info',
      category: l.category || src,
      mitre:   l.mitre || null,
    }));

    if (source === 'all') {
      newLogs = [
        ...normalize(S.windows || [], 'windows'),
        ...normalize(S.linux   || [], 'linux'),
        ...normalize(S.apache  || [], 'apache'),
        ...normalize(S.nginx   || [], 'nginx'),
        ...normalize(S.firewall|| [], 'firewall'),
      ];
    } else if (S[source]) {
      newLogs = normalize(S[source], source);
    }

    // Sort by timestamp
    newLogs.sort((a, b) => new Date(a.ts) - new Date(b.ts));
    allLogs = newLogs;
    filteredLogs = [...allLogs];
    currentPage = 1;
    ruleHits = {};

    _refreshStats();
    _applyFilters();
    _updateSourceLabel(`[SIMULATED] ${source === 'all' ? 'Full Attack Scenario' : source.charAt(0).toUpperCase() + source.slice(1)} logs — ${newLogs.length} events`);

    window.NotificationManager.success(
      'Sample Data Loaded',
      `${newLogs.length} simulated log events loaded. [EDUCATIONAL — Not real data]`,
      { source: 'Log Analyzer' }
    );

    // Auto-run detection rules after loading
    setTimeout(() => _runDetectionRules(), 300);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // FILE UPLOAD PARSER
  // ══════════════════════════════════════════════════════════════════════════
  function _handleFiles(files) {
    if (!files || !files.length) return;
    let parsed = [];
    let pending = files.length;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        const content = e.target.result;
        const logs = _parseFileContent(content, file.name);
        parsed = [...parsed, ...logs];
        pending--;
        if (pending === 0) {
          parsed.sort((a, b) => new Date(a.ts) - new Date(b.ts));
          allLogs = [...allLogs, ...parsed];
          filteredLogs = [...allLogs];
          currentPage = 1;
          _refreshStats();
          _applyFilters();
          _updateSourceLabel(`Uploaded: ${Array.from(files).map(f => f.name).join(', ')} — ${allLogs.length} total events`);
          window.NotificationManager.success('File Imported', `${parsed.length} events parsed from ${files.length} file(s).`);
          _switchTab('logs');
        }
      };
      reader.readAsText(file);
    });
  }

  function _parseFileContent(content, filename) {
    const logs = [];
    const name = filename.toLowerCase();

    // JSON array
    if (name.endsWith('.json')) {
      try {
        const data = JSON.parse(content);
        const arr = Array.isArray(data) ? data : (data.events || data.logs || [data]);
        arr.forEach((item, i) => {
          logs.push({
            _id:      `custom_${i}_${Date.now()}`,
            _source:  'custom',
            ts:       item.timestamp || item.ts || item.TimeCreated || item.time || new Date().toISOString(),
            level:    _normalizeLevel(item.level || item.Level || item.severity || 'info'),
            host:     item.host || item.Hostname || item.Computer || item.hostname || '',
            user:     item.user || item.User || item.SubjectUserName || item.TargetUserName || '',
            ip:       item.ip || item.IpAddress || item.src || item.source_ip || '',
            _eid:     item.EventID || item.event_id || item.id || null,
            msg:      item.msg || item.message || item.Message || item.Description || JSON.stringify(item),
            category: item.category || item.Category || item.EventType || 'Custom',
            mitre:    item.mitre || null,
          });
        });
      } catch (_) {
        // fall through to line-by-line
        _parseLines(content, logs, filename);
      }
      return logs;
    }

    // CSV
    if (name.endsWith('.csv')) {
      const lines = content.split('\n').filter(Boolean);
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      lines.slice(1).forEach((line, i) => {
        const cols = _csvSplit(line);
        const obj = {};
        headers.forEach((h, idx) => { obj[h] = cols[idx] || ''; });
        logs.push({
          _id:      `csv_${i}_${Date.now()}`,
          _source:  'custom',
          ts:       obj.timestamp || obj.time || obj.date || new Date().toISOString(),
          level:    _normalizeLevel(obj.level || obj.severity || 'info'),
          host:     obj.host || obj.hostname || obj.computer || '',
          user:     obj.user || obj.username || '',
          ip:       obj.ip || obj.src_ip || obj.source || '',
          _eid:     obj.event_id || obj.eventid || null,
          msg:      obj.message || obj.msg || obj.description || line,
          category: obj.category || 'Custom',
          mitre:    obj.mitre || null,
        });
      });
      return logs;
    }

    // Plain text / log files
    _parseLines(content, logs, filename);
    return logs;
  }

  function _parseLines(content, logs, filename) {
    const lines = content.split('\n').filter(l => l.trim());
    lines.forEach((line, i) => {
      const log = _parseLogLine(line, i, filename);
      if (log) logs.push(log);
    });
  }

  function _parseLogLine(line, idx, filename) {
    const ts = _extractTimestamp(line) || new Date().toISOString();

    // Linux syslog / auth.log
    const sshFail    = /sshd.*[Ff]ailed|Invalid user|authentication failure/i.test(line);
    const sshSuccess = /sshd.*Accepted/i.test(line);
    const sudoLine   = /sudo:/i.test(line);
    const userAdd    = /useradd|userdel|usermod/i.test(line);

    // Apache/Nginx
    const apacheMatch = line.match(/^(\S+) \S+ \S+ \[([^\]]+)\] "(\w+) (\S+) HTTP\/[\d.]+" (\d+)/);

    // Windows event (text export)
    const winFail    = /EventID.*4625|FailedLogon|failed to log on/i.test(line);
    const winSuccess = /EventID.*4624|SuccessfulLogon|logged on/i.test(line);
    const winPS      = /EncodedCommand|powershell.*-nop/i.test(line);

    let level = 'info';
    let category = 'Custom';
    let msg = line.trim();

    if (sshFail || winFail) { level = 'warning'; category = 'Authentication'; }
    if (sshSuccess || winSuccess) { level = 'info'; category = 'Authentication'; }
    if (sudoLine) { level = 'warning'; category = 'Privilege Escalation'; }
    if (userAdd) { level = 'warning'; category = 'Account Management'; }
    if (winPS) { level = 'critical'; category = 'Process Execution'; }
    if (/error|fail|block|deny/i.test(line)) level = 'warning';
    if (/critical|attack|malware|exploit/i.test(line)) level = 'critical';

    const ipMatch   = line.match(/\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/);
    const userMatch = line.match(/(?:for|user)\s+(\w[\w.-]{0,30})/i);

    if (apacheMatch) {
      const status = parseInt(apacheMatch[5]);
      level = status >= 400 ? (status >= 500 ? 'critical' : 'warning') : 'info';
      category = (status === 400 || status === 403 || status === 404) ? 'Web Access' : 'Web Access';
      msg = `${apacheMatch[3]} ${apacheMatch[4]} HTTP/1.1 ${status}`;
    }

    return {
      _id:      `custom_${idx}_${Date.now()}`,
      _source:  'custom',
      ts,
      level,
      host:     _extractHost(line) || '',
      user:     userMatch ? userMatch[1] : '',
      ip:       ipMatch ? ipMatch[1] : '',
      _eid:     null,
      msg,
      category,
      mitre:    null,
    };
  }

  function _extractTimestamp(line) {
    // ISO 8601
    const iso = line.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    if (iso) return iso[0] + 'Z';
    // Syslog format: Jun 15 08:00:01
    const syslog = line.match(/([A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})/);
    if (syslog) return new Date(`${new Date().getFullYear()} ${syslog[1]}`).toISOString();
    // Apache: [15/Jun/2025:06:00:05
    const apache = line.match(/\[(\d{2})\/([A-Za-z]{3})\/(\d{4}):(\d{2}:\d{2}:\d{2})/);
    if (apache) return new Date(`${apache[3]}-${_monthNum(apache[2])}-${apache[1]}T${apache[4]}Z`).toISOString();
    return null;
  }

  function _extractHost(line) {
    const m = line.match(/(?:host[=:\s]+|computer[=:\s]+)([a-z0-9_.-]+)/i) ||
              line.match(/^[A-Za-z]{3}\s+\d+\s+[\d:]+\s+([a-zA-Z0-9_.-]+)/);
    return m ? m[1] : '';
  }

  function _monthNum(mon) {
    return { Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',
             Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12' }[mon] || '01';
  }

  function _normalizeLevel(l) {
    l = (l || '').toLowerCase();
    if (['crit','critical','error','fatal'].includes(l)) return 'critical';
    if (['warn','warning','alert'].includes(l)) return 'warning';
    return 'info';
  }

  function _csvSplit(line) {
    const result = [];
    let cur = '';
    let inQ = false;
    for (let c of line) {
      if (c === '"') { inQ = !inQ; }
      else if (c === ',' && !inQ) { result.push(cur.trim()); cur = ''; }
      else { cur += c; }
    }
    result.push(cur.trim());
    return result;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // FILTER & SEARCH ENGINE
  // ══════════════════════════════════════════════════════════════════════════
  function _applyFilters() {
    let logs = [...allLogs];

    // Severity filter
    if (filterSev !== 'all') logs = logs.filter(l => l.level === filterSev);

    // Source filter
    if (filterSrc !== 'all') logs = logs.filter(l => l._source === filterSrc);

    // Category filter
    if (filterCat !== 'all') logs = logs.filter(l => l.category === filterCat);

    // Search
    if (searchQuery) {
      // field:value syntax
      const fieldMatch = searchQuery.match(/^(\w+):(.+)$/);
      if (fieldMatch) {
        const [, field, val] = fieldMatch;
        const lv = val.toLowerCase();
        logs = logs.filter(l => String(l[field] || '').toLowerCase().includes(lv));
      } else if (useRegex) {
        try {
          const rx = new RegExp(searchQuery, 'i');
          logs = logs.filter(l =>
            rx.test(l.msg) || rx.test(l.host) || rx.test(l.user) ||
            rx.test(l.ip) || rx.test(l.category)
          );
        } catch (_) { /* invalid regex — skip */ }
      } else {
        const q = searchQuery.toLowerCase();
        logs = logs.filter(l =>
          (l.msg && l.msg.toLowerCase().includes(q)) ||
          (l.host && l.host.toLowerCase().includes(q)) ||
          (l.user && l.user.toLowerCase().includes(q)) ||
          (l.ip && l.ip.includes(q)) ||
          (l.category && l.category.toLowerCase().includes(q)) ||
          (l._eid && String(l._eid).includes(q)) ||
          (l.mitre && l.mitre.toLowerCase().includes(q))
        );
      }
    }

    // Sort
    logs.sort((a, b) => {
      let va = a[sortField] ?? '';
      let vb = b[sortField] ?? '';
      if (sortField === 'ts') { va = new Date(va); vb = new Date(vb); }
      else { va = String(va).toLowerCase(); vb = String(vb).toLowerCase(); }
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });

    filteredLogs = logs;
    _renderTable();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TABLE RENDERER
  // ══════════════════════════════════════════════════════════════════════════
  function _renderTable() {
    const tbody  = document.getElementById('la-table-body');
    const countEl = document.getElementById('la-count-label');
    const pagination = document.getElementById('la-pagination');
    if (!tbody) return;

    const total  = filteredLogs.length;
    const pages  = Math.max(1, Math.ceil(total / PAGE_SIZE));
    currentPage  = Math.min(currentPage, pages);
    const start  = (currentPage - 1) * PAGE_SIZE;
    const slice  = filteredLogs.slice(start, start + PAGE_SIZE);

    if (countEl) countEl.textContent = `${total.toLocaleString()} event${total !== 1 ? 's' : ''}${allLogs.length !== total ? ` (filtered from ${allLogs.length.toLocaleString()})` : ''}`;

    if (!slice.length) {
      tbody.innerHTML = `<tr class="la-empty-row"><td colspan="9">No events match the current filters.</td></tr>`;
      if (pagination) pagination.innerHTML = '';
      return;
    }

    tbody.innerHTML = slice.map(l => `
      <tr data-id="${esc(l._id)}">
        <td class="la-col-time">${_fmtTime(l.ts)}</td>
        <td class="la-col-severity"><span class="la-sev ${esc(l.level)}">${esc(l.level)}</span></td>
        <td class="la-col-host">${esc(l.host)}</td>
        <td class="la-col-user">${esc(l.user)}</td>
        <td class="la-col-src-ip">${esc(l.ip)}</td>
        <td class="la-col-event">${l._eid ? esc(String(l._eid)) : ''}</td>
        <td class="la-col-category">${esc(l.category)}</td>
        <td class="la-col-mitre">${l.mitre ? `<span class="la-mitre-chip">${esc(l.mitre)}</span>` : ''}</td>
        <td class="la-col-msg" title="${esc(l.msg)}">${esc(l.msg)}</td>
      </tr>
    `).join('');

    // Row click → detail panel
    tbody.querySelectorAll('tr[data-id]').forEach(row => {
      row.addEventListener('click', () => {
        const log = filteredLogs.find(l => l._id === row.dataset.id);
        if (log) _showDetail(log);
      });
    });

    // Pagination
    if (pagination) {
      let pHtml = `<button class="la-page-btn" id="la-prev-btn" ${currentPage === 1 ? 'disabled' : ''}>‹ Prev</button>`;
      const maxBtns = 5;
      const half = Math.floor(maxBtns / 2);
      let pStart = Math.max(1, currentPage - half);
      let pEnd   = Math.min(pages, pStart + maxBtns - 1);
      if (pEnd - pStart < maxBtns - 1) pStart = Math.max(1, pEnd - maxBtns + 1);
      for (let p = pStart; p <= pEnd; p++) {
        pHtml += `<button class="la-page-btn${p === currentPage ? ' active' : ''}" data-page="${p}">${p}</button>`;
      }
      pHtml += `<button class="la-page-btn" id="la-next-btn" ${currentPage === pages ? 'disabled' : ''}>Next ›</button>`;
      pagination.innerHTML = pHtml;

      pagination.querySelector('#la-prev-btn')?.addEventListener('click', () => { currentPage--; _renderTable(); });
      pagination.querySelector('#la-next-btn')?.addEventListener('click', () => { currentPage++; _renderTable(); });
      pagination.querySelectorAll('[data-page]').forEach(btn => {
        btn.addEventListener('click', () => { currentPage = parseInt(btn.dataset.page); _renderTable(); });
      });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DETAIL PANEL
  // ══════════════════════════════════════════════════════════════════════════
  function _showDetail(log) {
    detailLog = log;
    const overlay = document.getElementById('la-detail-overlay');
    const body    = document.getElementById('la-detail-body');
    if (!overlay || !body) return;

    const mitreDef = window.SampleLogs?.mitreTechniques?.[log.mitre] || null;

    body.innerHTML = `
      <div class="la-detail-grid">
        ${_dField('Timestamp',   _fmtTime(log.ts))}
        ${_dField('Severity',    `<span class="la-sev ${esc(log.level)}">${esc(log.level)}</span>`, true)}
        ${_dField('Source',      log._source || '')}
        ${_dField('Host',        log.host)}
        ${_dField('User',        log.user)}
        ${_dField('Source IP',   log.ip)}
        ${_dField('Event ID',    log._eid ? String(log._eid) : '—')}
        ${_dField('Category',    log.category)}
        ${_dField('MITRE ID',    log.mitre || '—')}
      </div>

      <div class="la-detail-msg">${esc(log.msg)}</div>

      ${mitreDef ? `
        <div class="la-mitre-detail">
          <div class="la-mitre-detail-id">${esc(log.mitre)}</div>
          <div class="la-mitre-detail-info">
            <div class="la-mitre-detail-name">${esc(mitreDef.name)}</div>
            <div class="la-mitre-detail-tactic">Tactic: ${esc(mitreDef.tactic)}</div>
          </div>
          <a href="https://attack.mitre.org/techniques/${esc(log.mitre?.replace('.', '/')).replace(/\./g, '/')}/"
             target="_blank" rel="noopener" class="btn btn-secondary btn-sm"
             title="View MITRE ATT&CK (requires internet)">MITRE ↗</a>
        </div>
      ` : ''}`;

    overlay.classList.add('open');
  }

  function _dField(label, value, raw = false) {
    return `
    <div class="la-detail-field">
      <div class="la-detail-field-label">${esc(label)}</div>
      <div class="la-detail-field-value">${raw ? value : esc(value)}</div>
    </div>`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DETECTION RULE ENGINE
  // ══════════════════════════════════════════════════════════════════════════
  function _runDetectionRules() {
    ruleHits = {};
    let totalHits = 0;

    DETECTION_RULES.forEach(rule => {
      if (!rule.enabled) return;
      try {
        const matched = rule.match(allLogs);
        ruleHits[rule.id] = matched.length;
        totalHits += matched.length > 0 ? 1 : 0;
      } catch (e) {
        ruleHits[rule.id] = 0;
      }
    });

    _refreshRuleList();

    const fired = DETECTION_RULES.filter(r => ruleHits[r.id] > 0);
    if (fired.length > 0) {
      window.NotificationManager.warning(
        `${fired.length} Detection Rule${fired.length > 1 ? 's' : ''} Fired`,
        fired.map(r => `${r.title} (${ruleHits[r.id]} hits)`).slice(0, 3).join(' · '),
        { source: 'Log Analyzer', persist: true }
      );
    } else {
      window.NotificationManager.success('Detection Complete', 'No rule violations detected in loaded logs.', { source: 'Log Analyzer' });
    }

    _renderReports();
  }

  function _refreshRuleList() {
    const container = document.getElementById('la-rules-list');
    if (!container) return;
    container.innerHTML = DETECTION_RULES.map(r => _buildRuleCard(r)).join('');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VISUALIZATIONS
  // ══════════════════════════════════════════════════════════════════════════
  function _renderCharts() {
    const container = document.getElementById('la-charts-container');
    if (!container || !allLogs.length) return;

    container.innerHTML = `
      ${_chartSeverityDist()}
      ${_chartTopUsers()}
      ${_chartTopIPs()}
      ${_chartTopHosts()}
      ${_chartTopCategories()}
      ${_chartSourceDist()}
      ${_chartTimeline()}
      ${_chartMitreMap()}
    `;

    // Animate bar fills
    requestAnimationFrame(() => {
      container.querySelectorAll('.la-bar-fill[data-pct]').forEach(el => {
        el.style.width = el.dataset.pct + '%';
      });
    });
  }

  function _chartSeverityDist() {
    const critical = allLogs.filter(l => l.level === 'critical').length;
    const warning  = allLogs.filter(l => l.level === 'warning').length;
    const info     = allLogs.filter(l => l.level === 'info').length;
    const total    = allLogs.length || 1;

    const segments = [
      { label: 'Critical', count: critical, color: 'var(--color-danger)', pct: (critical / total * 100).toFixed(1) },
      { label: 'Warning',  count: warning,  color: 'var(--color-warning)', pct: (warning / total * 100).toFixed(1) },
      { label: 'Info',     count: info,     color: 'var(--color-info)',    pct: (info / total * 100).toFixed(1) },
    ];

    // Build simple SVG donut
    const r = 50; const cx = 70; const cy = 70;
    let startAngle = -90;
    const arcs = segments.map(seg => {
      const pct = seg.count / total;
      const endAngle = startAngle + pct * 360;
      const arc = _describeArc(cx, cy, r, startAngle, endAngle);
      const el = `<path d="${arc}" fill="none" stroke="${seg.color}" stroke-width="20" class="la-donut-segment"/>`;
      startAngle = endAngle;
      return el;
    });

    return `
    <div class="la-chart-card">
      <div class="la-chart-title">Severity Distribution</div>
      <div class="la-donut-wrap">
        <svg class="la-donut-chart" width="140" height="140" viewBox="0 0 140 140">
          <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--bg-elevated)" stroke-width="20"/>
          ${arcs.join('')}
          <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle"
                font-size="18" font-weight="bold" fill="var(--text-primary)" font-family="var(--font-mono)">${total}</text>
          <text x="${cx}" y="${cy + 16}" text-anchor="middle" font-size="9" fill="var(--text-tertiary)">TOTAL</text>
        </svg>
        <div class="la-donut-legend">
          ${segments.map(s => `
            <div class="la-legend-item">
              <div class="la-legend-dot" style="background:${s.color}"></div>
              <span>${s.label}</span>
              <span class="la-legend-count">${s.count}</span>
            </div>`).join('')}
        </div>
      </div>
    </div>`;
  }

  function _chartTopUsers() {
    const counts = _countBy(allLogs.filter(l => l.user), l => l.user);
    return _barChart('Top Users', counts, 'var(--color-primary)');
  }

  function _chartTopIPs() {
    const counts = _countBy(allLogs.filter(l => l.ip), l => l.ip);
    return _barChart('Top Source IPs', counts, 'var(--color-accent)');
  }

  function _chartTopHosts() {
    const counts = _countBy(allLogs.filter(l => l.host), l => l.host);
    return _barChart('Top Hosts', counts, 'var(--color-info)');
  }

  function _chartTopCategories() {
    const counts = _countBy(allLogs, l => l.category || 'Unknown');
    return _barChart('Event Categories', counts, 'var(--color-success)');
  }

  function _chartSourceDist() {
    const counts = _countBy(allLogs, l => l._source || 'unknown');
    return _barChart('Log Sources', counts, 'var(--color-warning)');
  }

  function _barChart(title, counts, color) {
    const top = Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0, 8);
    const max = top[0]?.[1] || 1;

    return `
    <div class="la-chart-card">
      <div class="la-chart-title">${esc(title)}</div>
      <div class="la-bar-list">
        ${top.map(([label, count]) => `
          <div class="la-bar-row">
            <div class="la-bar-label" title="${esc(label)}">${esc(label)}</div>
            <div class="la-bar-track">
              <div class="la-bar-fill" data-pct="${(count/max*100).toFixed(1)}"
                   style="width:0%;background:${color}"></div>
            </div>
            <div class="la-bar-count">${count}</div>
          </div>
        `).join('')}
        ${!top.length ? '<div style="color:var(--text-tertiary);font-size:var(--text-xs);">No data</div>' : ''}
      </div>
    </div>`;
  }

  function _chartTimeline() {
    const byHour = {};
    allLogs.forEach(l => {
      const d = new Date(l.ts);
      if (!isNaN(d)) {
        const key = `${d.getHours().toString().padStart(2,'0')}:00`;
        byHour[key] = (byHour[key] || 0) + 1;
      }
    });

    const keys   = Object.keys(byHour).sort();
    const vals   = keys.map(k => byHour[k]);
    const maxVal = Math.max(...vals, 1);
    const W = 580; const H = 100; const P = 30;

    const points = keys.map((k, i) => {
      const x = P + (i / Math.max(keys.length - 1, 1)) * (W - P * 2);
      const y = H - P - (byHour[k] / maxVal) * (H - P * 2);
      return `${x},${y}`;
    });

    const fillPts = points.length
      ? `${P},${H - P} ${points.join(' ')} ${P + ((keys.length-1) / Math.max(keys.length-1,1)) * (W-P*2)},${H-P}`
      : '';

    return `
    <div class="la-chart-card full-width">
      <div class="la-chart-title">Event Timeline (by Hour)</div>
      <div class="la-timeline-chart">
        <svg class="la-timeline-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
          <defs>
            <linearGradient id="la-tl-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="var(--color-primary)" stop-opacity="0.4"/>
              <stop offset="100%" stop-color="var(--color-primary)" stop-opacity="0.05"/>
            </linearGradient>
          </defs>
          ${fillPts ? `<polygon points="${fillPts}" fill="url(#la-tl-grad)"/>` : ''}
          ${points.length > 1
            ? `<polyline points="${points.join(' ')}" fill="none" stroke="var(--color-primary)" stroke-width="2"/>`
            : ''}
          ${points.map((pt, i) => {
              const [x,y] = pt.split(',');
              return `<circle cx="${x}" cy="${y}" r="3" fill="var(--color-primary)"/>
                      <text x="${x}" y="${H-5}" text-anchor="middle" font-size="8"
                            fill="var(--text-tertiary)" font-family="var(--font-mono)">${esc(keys[i])}</text>`;
          }).join('')}
          <line x1="${P}" y1="${P}" x2="${P}" y2="${H-P}" stroke="var(--border-subtle)" stroke-width="1"/>
          <line x1="${P}" y1="${H-P}" x2="${W-P}" y2="${H-P}" stroke="var(--border-subtle)" stroke-width="1"/>
        </svg>
      </div>
    </div>`;
  }

  function _chartMitreMap() {
    const mitreMap = window.SampleLogs?.mitreTechniques || {};
    const mitreHits = {};
    allLogs.forEach(l => { if (l.mitre) mitreHits[l.mitre] = (mitreHits[l.mitre] || 0) + 1; });
    const max = Math.max(...Object.values(mitreHits), 1);

    const allTechniques = Object.keys({ ...mitreMap, ...mitreHits });
    if (!allTechniques.length) return `
      <div class="la-chart-card full-width">
        <div class="la-chart-title">MITRE ATT&amp;CK Coverage Map</div>
        <div style="color:var(--text-tertiary);font-size:var(--text-sm);padding:var(--space-6)">No MITRE technique matches in loaded logs.</div>
      </div>`;

    return `
    <div class="la-chart-card full-width">
      <div class="la-chart-title">MITRE ATT&amp;CK Technique Coverage</div>
      <div class="la-mitre-grid">
        ${allTechniques.map(tech => {
          const count = mitreHits[tech] || 0;
          const def   = mitreMap[tech] || {};
          const cls   = count === 0 ? '' : count < 3 ? 'hit-low' : count < 6 ? 'hit-medium' : 'hit-high';
          return `
          <div class="la-mitre-cell ${cls}">
            <div class="la-mitre-cell-id">${esc(tech)}</div>
            <div class="la-mitre-cell-name">${esc(def.name || tech)}</div>
            ${count ? `<div class="la-mitre-cell-count">${count} hit${count > 1 ? 's' : ''}</div>` : ''}
            ${def.tactic ? `<div style="font-size:10px;color:var(--text-tertiary);margin-top:2px;">${esc(def.tactic)}</div>` : ''}
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }

  // Arc helper for donut chart
  function _describeArc(cx, cy, r, startAngle, endAngle) {
    if (Math.abs(endAngle - startAngle) >= 360) endAngle = startAngle + 359.99;
    const s = _polar(cx, cy, r, startAngle);
    const e = _polar(cx, cy, r, endAngle);
    const large = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  }
  function _polar(cx, cy, r, angle) {
    const rad = (angle - 90) * Math.PI / 180;
    return { x: +(cx + r * Math.cos(rad)).toFixed(2), y: +(cy + r * Math.sin(rad)).toFixed(2) };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // REPORTS
  // ══════════════════════════════════════════════════════════════════════════
  function _renderReports() {
    _renderExecSummary();
    _renderIOCSummary();
    _renderMitreSummary();
  }

  function _renderExecSummary() {
    const el = document.getElementById('la-exec-summary');
    if (!el) return;

    const now = new Date().toLocaleString();
    const total    = allLogs.length;
    const critical = allLogs.filter(l => l.level === 'critical').length;
    const warnings = allLogs.filter(l => l.level === 'warning').length;
    const fired    = DETECTION_RULES.filter(r => (ruleHits[r.id] || 0) > 0);
    const sources  = [...new Set(allLogs.map(l => l._source))];

    el.innerHTML = `
      <div style="background:var(--color-danger-bg);border:1px solid rgba(239,68,68,0.2);border-radius:var(--radius-md);padding:var(--space-3) var(--space-4);margin-bottom:var(--space-4);font-size:var(--text-xs);color:var(--color-danger-light);">
        ⚠ EDUCATIONAL SIMULATION — This report is based on synthetic sample data. Not a real security assessment.
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:var(--space-3);margin-bottom:var(--space-5);">
        ${[
          ['Total Events', total, 'var(--text-primary)'],
          ['Critical Events', critical, 'var(--color-danger-light)'],
          ['Warnings', warnings, 'var(--color-warning-light)'],
          ['Rules Fired', fired.length, fired.length > 0 ? 'var(--color-danger-light)' : 'var(--color-success-light)'],
          ['Log Sources', sources.length, 'var(--color-info-light)'],
        ].map(([label, val, color]) => `
          <div style="background:var(--bg-elevated);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:var(--space-3);text-align:center;">
            <div style="font-size:var(--text-2xl);font-weight:bold;font-family:var(--font-mono);color:${color}">${val}</div>
            <div style="font-size:var(--text-xs);color:var(--text-tertiary)">${label}</div>
          </div>
        `).join('')}
      </div>
      <div style="font-size:var(--text-sm);color:var(--text-secondary);line-height:var(--leading-loose);">
        <strong style="color:var(--text-primary)">Analysis Period:</strong> ${now}<br>
        <strong style="color:var(--text-primary)">Log Sources:</strong> ${sources.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ') || 'None'}<br>
        <strong style="color:var(--text-primary)">Detection Rules Run:</strong> ${DETECTION_RULES.length}<br>
        <strong style="color:var(--text-primary)">Rules Fired:</strong> ${fired.length > 0 ? fired.map(r => r.title).join(', ') : 'None'}
      </div>
      ${fired.length > 0 ? `
        <div style="margin-top:var(--space-4);">
          <div style="font-size:var(--text-sm);font-weight:600;color:var(--text-primary);margin-bottom:var(--space-3);">Rule Findings</div>
          ${fired.map(r => `
            <div style="display:flex;align-items:center;gap:var(--space-3);padding:var(--space-2) var(--space-3);background:var(--bg-elevated);border:1px solid var(--border-subtle);border-radius:var(--radius-md);margin-bottom:var(--space-2);">
              <span class="la-sev ${r.severity === 'critical' ? 'critical' : r.severity === 'high' ? 'warning' : 'info'}">${r.severity}</span>
              <span style="flex:1;font-size:var(--text-sm);color:var(--text-primary)">${esc(r.title)}</span>
              <span class="la-mitre-chip">${esc(r.mitre)}</span>
              <span style="font-family:var(--font-mono);font-size:var(--text-xs);color:var(--color-danger-light)">${ruleHits[r.id]} hit${ruleHits[r.id]>1?'s':''}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}`;
  }

  function _renderIOCSummary() {
    const el = document.getElementById('la-ioc-summary');
    if (!el) return;

    const ips     = [...new Set(allLogs.filter(l => l.ip && l.level !== 'info').map(l => l.ip))];
    const users   = [...new Set(allLogs.filter(l => l.user && l.level === 'critical').map(l => l.user))];
    const hosts   = [...new Set(allLogs.filter(l => l.host && l.level === 'critical').map(l => l.host))];

    if (!ips.length && !users.length && !hosts.length) {
      el.innerHTML = '<p style="color:var(--text-tertiary);font-size:var(--text-sm);">No IOCs extracted. Load logs and run detection rules first.</p>';
      return;
    }

    el.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:var(--space-4)">
        ${_iocTable('Suspicious IPs', ips, 'ip')}
        ${_iocTable('Suspicious Users', users, 'user')}
        ${_iocTable('Affected Hosts', hosts, 'host')}
      </div>`;
  }

  function _iocTable(title, items, type) {
    if (!items.length) return '';
    return `
    <div>
      <div style="font-size:var(--text-xs);font-weight:600;text-transform:uppercase;letter-spacing:0.07em;color:var(--text-tertiary);margin-bottom:var(--space-2)">${esc(title)}</div>
      ${items.slice(0, 10).map(item => `
        <div style="font-family:var(--font-mono);font-size:var(--text-xs);color:var(--text-secondary);padding:var(--space-1) var(--space-2);background:var(--bg-elevated);border-radius:var(--radius-sm);margin-bottom:2px;cursor:pointer;"
             onclick="document.getElementById('la-search').value='${type}:${esc(item)}';document.getElementById('la-search').dispatchEvent(new Event('input'));window.Router&&(document.querySelector('.la-tab[data-tab=logs]').click())">
          ${esc(item)}
        </div>
      `).join('')}
    </div>`;
  }

  function _renderMitreSummary() {
    const el = document.getElementById('la-mitre-summary');
    if (!el) return;

    const mitreMap = window.SampleLogs?.mitreTechniques || {};
    const hits = allLogs.filter(l => l.mitre).reduce((acc, l) => {
      acc[l.mitre] = (acc[l.mitre] || 0) + 1;
      return acc;
    }, {});

    if (!Object.keys(hits).length) {
      el.innerHTML = '<p style="color:var(--text-tertiary);font-size:var(--text-sm);">No MITRE ATT&CK techniques identified in current logs.</p>';
      return;
    }

    el.innerHTML = `
      <div class="la-bar-list">
        ${Object.entries(hits).sort((a,b) => b[1]-a[1]).map(([tech, count]) => {
          const def = mitreMap[tech] || {};
          return `
          <div style="margin-bottom:var(--space-3)">
            <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-1)">
              <span class="la-mitre-chip">${esc(tech)}</span>
              <span style="font-size:var(--text-sm);font-weight:600;color:var(--text-primary)">${esc(def.name || tech)}</span>
              ${def.tactic ? `<span style="font-size:var(--text-xs);color:var(--text-tertiary)">${esc(def.tactic)}</span>` : ''}
              <span style="margin-left:auto;font-family:var(--font-mono);font-size:var(--text-xs);color:var(--color-danger-light)">${count} event${count>1?'s':''}</span>
            </div>
          </div>`;
        }).join('')}
      </div>`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // EXPORT FUNCTIONS
  // ══════════════════════════════════════════════════════════════════════════
  function _exportJSON() {
    if (!filteredLogs.length) { window.NotificationManager.warning('No Data', 'Load logs first.'); return; }
    const data = {
      exported:  new Date().toISOString(),
      source:    'Khan Security Solutions Enterprise — EDUCATIONAL SIMULATION',
      totalEvents: filteredLogs.length,
      events: filteredLogs,
    };
    _download('kss-logs-export.json', JSON.stringify(data, null, 2), 'application/json');
    window.NotificationManager.success('JSON Exported', `${filteredLogs.length} events exported.`);
  }

  function _exportIOCs() {
    const ips   = [...new Set(allLogs.filter(l => l.ip && l.level !== 'info').map(l => l.ip))];
    const users = [...new Set(allLogs.filter(l => l.user && l.level === 'critical').map(l => l.user))];
    const data  = {
      exported: new Date().toISOString(),
      disclaimer: 'EDUCATIONAL SIMULATION — Not real IOC data',
      iocs: {
        suspiciousIPs:   ips,
        suspiciousUsers: users,
        mitreTechniques: [...new Set(allLogs.filter(l => l.mitre).map(l => l.mitre))],
      }
    };
    _download('kss-ioc-report.json', JSON.stringify(data, null, 2), 'application/json');
    window.NotificationManager.success('IOC Report Exported', 'Indicators of compromise saved to file.');
  }

  function _exportHTML() {
    if (!allLogs.length) { window.NotificationManager.warning('No Data', 'Load logs first.'); return; }

    const fired = DETECTION_RULES.filter(r => (ruleHits[r.id] || 0) > 0);
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>KSS Log Analysis Report — ${new Date().toLocaleDateString()}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#0a0c10; color:#f1f5f9; padding:40px; }
  h1   { color:#60a5fa; font-size:24px; margin-bottom:4px; }
  h2   { color:#94a3b8; font-size:14px; font-weight:normal; margin-bottom:32px; }
  .warning { background:#3b0a0a; border:1px solid #7f1d1d; border-radius:8px; padding:12px 16px; margin-bottom:24px; color:#fca5a5; font-size:13px; }
  table { width:100%; border-collapse:collapse; font-size:12px; margin-top:16px; }
  th { background:#161b27; padding:8px 12px; text-align:left; font-size:10px; text-transform:uppercase; letter-spacing:0.07em; color:#64748b; }
  td { padding:6px 12px; border-bottom:1px solid #1e2436; color:#94a3b8; font-family:monospace; }
  tr:nth-child(even) td { background:#0d1018; }
  .critical { color:#f87171; font-weight:bold; }
  .warning  { color:#fbbf24; }
  .info     { color:#22d3ee; }
  .mitre    { background:#3b0a0a; color:#f87171; padding:2px 6px; border-radius:3px; font-size:10px; }
  .stat { display:inline-block; background:#161b27; border:1px solid #1e2436; border-radius:8px; padding:12px 20px; margin:0 8px 8px 0; text-align:center; }
  .stat-val { font-size:24px; font-weight:bold; color:#60a5fa; font-family:monospace; }
  .stat-lbl { font-size:11px; color:#64748b; margin-top:4px; }
  .rule-row { background:#0d1018; border:1px solid #1e2436; border-radius:6px; padding:10px 14px; margin-bottom:8px; }
  .rule-title { font-size:13px; font-weight:600; color:#f1f5f9; }
  .rule-mitre { display:inline-block; background:#3b0a0a; color:#f87171; padding:2px 6px; border-radius:3px; font-size:10px; margin-top:4px; }
</style>
</head>
<body>
<h1>Khan Security Solutions — Log Analysis Report</h1>
<h2>Generated: ${new Date().toLocaleString()} | Platform: KSS Enterprise (Offline)</h2>
<div class="warning">⚠ EDUCATIONAL SIMULATION — This report is based on synthetic sample data and does not represent a real security assessment.</div>

<div style="margin-bottom:24px;">
  <div class="stat"><div class="stat-val">${allLogs.length}</div><div class="stat-lbl">Total Events</div></div>
  <div class="stat"><div class="stat-val" style="color:#f87171">${allLogs.filter(l=>l.level==='critical').length}</div><div class="stat-lbl">Critical</div></div>
  <div class="stat"><div class="stat-val" style="color:#fbbf24">${allLogs.filter(l=>l.level==='warning').length}</div><div class="stat-lbl">Warnings</div></div>
  <div class="stat"><div class="stat-val" style="color:#f87171">${fired.length}</div><div class="stat-lbl">Rules Fired</div></div>
</div>

${fired.length ? `<h3 style="color:#f1f5f9;margin-bottom:12px;">Detection Rule Findings (${fired.length})</h3>
${fired.map(r=>`<div class="rule-row"><div class="rule-title">${r.title} — ${ruleHits[r.id]} hit${ruleHits[r.id]>1?'s':''}</div>
<div class="rule-mitre">${r.mitre}</div> <div style="color:#64748b;font-size:12px;margin-top:4px;">${r.desc}</div></div>`).join('')}` : ''}

<h3 style="color:#f1f5f9;margin:24px 0 12px;">Log Events (${Math.min(filteredLogs.length, 200)} shown)</h3>
<table>
<thead><tr><th>Timestamp</th><th>Severity</th><th>Host</th><th>User</th><th>IP</th><th>Category</th><th>MITRE</th><th>Message</th></tr></thead>
<tbody>
${filteredLogs.slice(0,200).map(l=>`<tr>
  <td>${_fmtTime(l.ts)}</td>
  <td class="${l.level}">${l.level}</td>
  <td>${_esc(l.host)}</td>
  <td>${_esc(l.user)}</td>
  <td>${_esc(l.ip)}</td>
  <td>${_esc(l.category)}</td>
  <td>${l.mitre?`<span class="mitre">${l.mitre}</span>`:''}</td>
  <td>${_esc(l.msg)}</td>
</tr>`).join('')}
</tbody>
</table>
</body>
</html>`;

    _download('kss-log-report.html', html, 'text/html');
    window.NotificationManager.success('HTML Report Exported', 'Open the downloaded file in any browser.');

    function _esc(s) {
      return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }
  }

  function _download(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════════════════════════════════════
  function _fmtTime(ts) {
    const d = new Date(ts);
    if (isNaN(d)) return ts || '';
    return d.toLocaleString('en-GB', {
      year:'numeric', month:'2-digit', day:'2-digit',
      hour:'2-digit', minute:'2-digit', second:'2-digit', hour12: false
    }).replace(',', '');
  }

  function _updateSourceLabel(text) {
    const el = document.getElementById('la-source-label');
    if (el) el.textContent = text;
  }

  function _countBy(arr, fn) {
    const counts = {};
    arr.forEach(item => {
      const key = fn(item);
      if (key) counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }

  function _groupBy(arr, fn) {
    const groups = {};
    arr.forEach(item => {
      const key = fn(item);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }

  function _timeBucket(ts, seconds) {
    const d = new Date(ts);
    if (isNaN(d)) return '0';
    return Math.floor(d.getTime() / (seconds * 1000));
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SEARCH ENGINE REGISTRATION
  // ══════════════════════════════════════════════════════════════════════════
  function _registerSearch() {
    if (!window.SearchEngine) return;
    window.SearchEngine.register('Log Analyzer', [
      { title: 'Log Analyzer',       meta: 'SIEM workbench — upload and analyse log files', route: 'siem', keywords: 'siem logs log analyzer events' },
      { title: 'Upload Logs',        meta: 'Import Windows, Linux, Apache, Nginx, Firewall logs', route: 'siem', keywords: 'upload import log file drag drop' },
      { title: 'Detection Rules',    meta: 'Brute force, lateral movement, persistence detection', route: 'siem', keywords: 'detection rules brute force lateral movement' },
      { title: 'Visualizations',     meta: 'Charts, timeline, MITRE heatmap', route: 'siem', keywords: 'charts graphs timeline mitre visualization' },
      { title: 'Reports & Export',   meta: 'Executive summary, IOC export, HTML report', route: 'siem', keywords: 'reports export ioc json html executive summary' },
      { title: 'Windows Event Logs', meta: 'Windows security event analysis', route: 'siem', keywords: 'windows event log 4625 4624 4720 4740' },
      { title: 'Linux Auth Logs',    meta: 'SSH, sudo, user management analysis', route: 'siem', keywords: 'linux ssh auth sshd sudo brute force' },
      { title: 'Firewall Logs',      meta: 'Network traffic and firewall events', route: 'siem', keywords: 'firewall network traffic block allow' },
      { title: 'MITRE ATT&CK',      meta: 'Technique mapping and coverage', route: 'siem', keywords: 'mitre attack technique tactic ttp coverage' },
    ]);
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  return { register };

})();

window.LogAnalyzer = LogAnalyzer;

// Auto-register on script load — same pattern as portfolio.js and company.js
if (window.Router) {
  LogAnalyzer.register();
} else {
  console.error('[LogAnalyzer] Router not found. Ensure router.js loads before log-analyzer.js.');
}
