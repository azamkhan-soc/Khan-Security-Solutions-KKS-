/**
 * KHAN SECURITY SOLUTIONS ENTERPRISE
 * Enterprise Password & Security Toolkit — Module v1.5.0
 *
 * Offline password & credential security workbench: a real password
 * generator, passphrase generator, live strength/entropy analyzer with
 * dictionary/pattern detection, a configurable policy checker, real
 * cryptographic hash generation (MD5/SHA-1/SHA-256/SHA-512) and
 * verification, an offline breach-demonstration lookup, a labeled vault
 * demo, an MFA method reference guide, and security best-practice tips.
 *
 * [EDUCATIONAL / REFERENCE TOOL — The password generator, strength meter,
 *  entropy calculator, and hash tools are fully functional and run
 *  entirely client-side. The Breach Checker and Vault are clearly labeled
 *  DEMONSTRATION ONLY: the breach checker matches against a small bundled
 *  offline list (never a live API), and the vault does not perform real
 *  encryption — it is a UI demonstration backed by localStorage.]
 *
 * Integrates with:
 *   window.Router              — route: 'password-tools'
 *   window.SearchEngine        — searchable content
 *   window.NotificationManager — alerts and feedback
 *   window.StorageManager      — vault/favorites/history persistence (localStorage)
 *   window.SamplePasswordData  — bundled reference dataset
 */

const PasswordTools = (() => {

  // ── State ──────────────────────────────────────────────────────────────
  let mounted        = false;
  let activeTab        = 'overview';
  let generatedHistory   = [];   // { value, entropy, date }
  let favorites             = []; // saved favorite generated passwords
  let vaultEntries            = [];
  let vaultFilter               = { q: '', folder: 'all', favoritesOnly: false };

  // ── Icons ──────────────────────────────────────────────────────────────
  const I = {
    shield:   `<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>`,
    key:      `<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"/>`,
    dice:     `<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3.75h10.5a3 3 0 013 3v10.5a3 3 0 01-3 3H6.75a3 3 0 01-3-3V6.75a3 3 0 013-3zM8.25 8.25h.008v.008H8.25V8.25zm7.5 0h.008v.008h-.008V8.25zm-3.75 3.75h.008v.008H12v-.008zm-3.75 3.75h.008v.008H8.25v-.008zm7.5 0h.008v.008h-.008v-.008z"/>`,
    gauge:    `<path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18zm0 0V12m0 0l4.5-4.5"/>`,
    check:    `<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>`,
    hash:     `<path stroke-linecap="round" stroke-linejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5"/>`,
    warn:     `<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>`,
    lock:     `<path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/>`,
    fingerprint: `<path stroke-linecap="round" stroke-linejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33"/>`,
    bulb:     `<path stroke-linecap="round" stroke-linejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"/>`,
    report:   `<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"/>`,
    copy:     `<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"/>`,
    refresh:  `<path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/>`,
    star:     `<path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/>`,
    starFilled: `FILL`,
    trash:    `<path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>`,
    plus:     `<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>`,
    down:     `<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>`,
    search:   `<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z"/>`,
    close:    `<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>`,
    eye:      `<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>`,
  };
  function svg(name, cls = '') { return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">${I[name] || I.shield}</svg>`; }
  function esc(s) { const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function uid(prefix) { return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`; }

  const SD = () => window.SamplePasswordData || { WORDLIST: [], COMMON_PASSWORDS: [], BREACH_DEMO_SET: new Set(), KEYBOARD_ROWS: [], CHAR_SETS: { upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', lower: 'abcdefghijklmnopqrstuvwxyz', numbers: '0123456789', symbols: '!@#$%^&*()-_=+[]{};:,.<>?/~' }, SIMILAR_CHARS: 'il1Lo0O', AMBIGUOUS_CHARS: "{}[]()/\\'\"`~,;:.<>", POLICY_TEMPLATES: [], MFA_METHODS: [], SECURITY_TIPS: [] };

  // ══════════════════════════════════════════════════════════════════════
  // ROUTE REGISTRATION
  // ══════════════════════════════════════════════════════════════════════
  function register() { window.Router.register('password-tools', { title: 'Password Tools', init, render }); }
  function init() { _loadPersisted(); _registerSearch(); }
  function render() {
    const el = document.getElementById('page-password-tools');
    if (!el) return;
    if (!mounted) { el.innerHTML = _buildShell(); mounted = true; _wireAll(); _animateStats(); }
    else _refreshStatsStatic();
  }

  // ══════════════════════════════════════════════════════════════════════
  // SHELL
  // ══════════════════════════════════════════════════════════════════════
  function _buildShell() {
    return `
    <div class="pt-shell">
      <div class="pt-header">
        <div>
          <div class="pt-header-title">Enterprise Password &amp; Security Toolkit</div>
          <div class="pt-header-sub">Generate, analyze, and manage credential security — entirely offline.</div>
        </div>
        <span class="badge badge-warning" style="font-family:var(--font-mono);font-size:10px;">⚠ VAULT &amp; BREACH CHECKER ARE DEMONSTRATIONS ONLY</span>
      </div>

      <div class="pt-tabs" role="tablist">
        <div class="pt-tab active" data-tab="overview"  role="tab">${svg('shield')}      Overview</div>
        <div class="pt-tab"        data-tab="generator" role="tab">${svg('key')}         Generator</div>
        <div class="pt-tab"        data-tab="passphrase" role="tab">${svg('dice')}       Passphrase</div>
        <div class="pt-tab"        data-tab="strength"  role="tab">${svg('gauge')}       Strength Analyzer</div>
        <div class="pt-tab"        data-tab="policy"    role="tab">${svg('check')}       Policy Checker</div>
        <div class="pt-tab"        data-tab="hash"      role="tab">${svg('hash')}        Hash Tools</div>
        <div class="pt-tab"        data-tab="breach"    role="tab">${svg('warn')}        Breach Checker</div>
        <div class="pt-tab"        data-tab="vault"     role="tab">${svg('lock')}        Vault Demo</div>
        <div class="pt-tab"        data-tab="mfa"       role="tab">${svg('fingerprint')} MFA &amp; Tips</div>
        <div class="pt-tab"        data-tab="reports"   role="tab">${svg('report')}      Reports</div>
      </div>

      <div class="pt-body">
        <div class="pt-view active" id="pt-view-overview">${_buildOverview()}</div>
        <div class="pt-view" id="pt-view-generator">${_buildGeneratorView()}</div>
        <div class="pt-view" id="pt-view-passphrase">${_buildPassphraseView()}</div>
        <div class="pt-view" id="pt-view-strength">${_buildStrengthView()}</div>
        <div class="pt-view" id="pt-view-policy">${_buildPolicyView()}</div>
        <div class="pt-view" id="pt-view-hash">${_buildHashView()}</div>
        <div class="pt-view" id="pt-view-breach">${_buildBreachView()}</div>
        <div class="pt-view" id="pt-view-vault">${_buildVaultView()}</div>
        <div class="pt-view" id="pt-view-mfa">${_buildMfaView()}</div>
        <div class="pt-view" id="pt-view-reports">${_buildReportsView()}</div>
      </div>
    </div>

    ${_buildVaultModal()}
    ${_buildConfirmModal()}
    `;
  }

  function _wireAll() {
    document.querySelectorAll('#page-password-tools .pt-tab').forEach(tab => tab.addEventListener('click', () => _switchTab(tab.dataset.tab)));
    _wireGenerator(); _wirePassphrase(); _wireStrength(); _wirePolicy(); _wireHash(); _wireBreach();
    _wireVault(); _wireVaultModal(); _wireConfirmModal(); _wireReports();
  }

  function _switchTab(tabId) {
    activeTab = tabId;
    document.querySelectorAll('#page-password-tools .pt-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
    document.querySelectorAll('#page-password-tools .pt-view').forEach(v => v.classList.toggle('active', v.id === `pt-view-${tabId}`));
    if (tabId === 'overview') _refreshStatsStatic();
  }

  // ══════════════════════════════════════════════════════════════════════
  // OVERVIEW / DASHBOARD
  // ══════════════════════════════════════════════════════════════════════
  function _buildOverview() {
    return `
      <div class="grid grid-stats pt-stats" id="pt-stats"></div>
      <div class="pt-tool-grid">
        ${_toolCard('key', 'Password Generator', 'Create strong random passwords with full character-class control.', 'generator')}
        ${_toolCard('dice', 'Passphrase Generator', 'Diceware-style multi-word passphrases with entropy estimates.', 'passphrase')}
        ${_toolCard('gauge', 'Strength Analyzer', 'Live entropy, crack-time, and pattern-weakness analysis.', 'strength')}
        ${_toolCard('check', 'Policy Checker', 'Validate a password against configurable enterprise policies.', 'policy')}
        ${_toolCard('hash', 'Hash Tools', 'Generate and verify MD5 / SHA-1 / SHA-256 / SHA-512 hashes.', 'hash')}
        ${_toolCard('warn', 'Breach Checker', 'Offline demonstration lookup against a bundled sample dataset.', 'breach')}
        ${_toolCard('lock', 'Password Vault Demo', 'A labeled demonstration vault with folders, tags, and favorites.', 'vault')}
        ${_toolCard('fingerprint', 'MFA &amp; Security Tips', 'Compare MFA methods and browse security best practices.', 'mfa')}
      </div>`;
  }
  function _toolCard(icon, title, desc, tab) {
    return `<div class="card pt-tool-card" data-goto="${tab}">
      <div class="pt-tool-card-icon">${svg(icon)}</div>
      <div class="pt-tool-card-title">${title}</div>
      <div class="pt-tool-card-desc">${desc}</div>
    </div>`;
  }
  function _statCard(label, value, icon, color) {
    return `<div class="stat-card">
      <div class="stat-card-icon" style="background:${color}22;color:${color};">${svg(icon)}</div>
      <div class="stat-card-info">
        <div class="stat-card-value ai-count" data-target="${parseInt(value, 10) || 0}" data-suffix="${String(value).replace(/^-?\d+/, '')}">0</div>
        <div class="stat-card-label">${esc(label)}</div>
      </div>
    </div>`;
  }
  function _computeStats() {
    const strong = generatedHistory.filter(h => h.entropy >= 60).length;
    const weak = generatedHistory.filter(h => h.entropy < 36).length;
    const avgEntropy = generatedHistory.length ? Math.round(generatedHistory.reduce((s, h) => s + h.entropy, 0) / generatedHistory.length) : 0;
    return { generated: generatedHistory.length, strong, weak, avgEntropy, vault: vaultEntries.length, favorites: favorites.length };
  }
  function _animateStats() {
    const s = _computeStats();
    const box = document.getElementById('pt-stats');
    if (!box) return;
    box.innerHTML = [
      _statCard('Generated Passwords', s.generated, 'key', 'var(--color-primary)'),
      _statCard('Strong Passwords', s.strong, 'check', 'var(--color-success)'),
      _statCard('Weak Passwords', s.weak, 'warn', 'var(--color-danger)'),
      _statCard('Average Entropy', s.avgEntropy + ' bits', 'gauge', 'var(--color-info)'),
      _statCard('Vault Entries', s.vault, 'lock', '#a78bfa'),
      _statCard('Saved Favorites', s.favorites, 'star', 'var(--color-warning)'),
    ].join('');
    box.querySelectorAll('.ai-count').forEach(el => {
      const target = parseInt(el.dataset.target, 10) || 0;
      const suffix = el.dataset.suffix || '';
      let current = 0; const step = Math.max(1, Math.ceil(target / 24));
      const timer = setInterval(() => { current = Math.min(target, current + step); el.textContent = current + suffix; if (current >= target) clearInterval(timer); }, 20);
    });
    document.querySelectorAll('#page-password-tools .pt-tool-card').forEach(card => card.addEventListener('click', () => _switchTab(card.dataset.goto)));
  }
  function _refreshStatsStatic() {
    const s = _computeStats();
    const box = document.getElementById('pt-stats');
    if (!box) return;
    const values = [s.generated, s.strong, s.weak, s.avgEntropy + ' bits', s.vault, s.favorites];
    box.querySelectorAll('.ai-count').forEach((el, idx) => { el.textContent = values[idx]; });
  }

  // ══════════════════════════════════════════════════════════════════════
  // CORE CRYPTO HELPERS (real, client-side)
  // ══════════════════════════════════════════════════════════════════════
  function _secureRandomInt(max) {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] % max;
  }

  async function _sha(algo, text) {
    const enc = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest(algo, enc);
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Compact, public-domain-algorithm MD5 implementation (Web Crypto has no MD5).
  function _md5(input) {
    function rotl(x, c) { return (x << c) | (x >>> (32 - c)); }
    function toHex(num) {
      let s = '', n;
      for (let i = 0; i < 4; i++) { n = (num >>> (i * 8)) & 255; s += n.toString(16).padStart(2, '0'); }
      return s;
    }
    const K = [];
    for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) | 0;
    const S = [7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22, 5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20, 4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23, 6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];
    const bytes = new TextEncoder().encode(input);
    const bitLen = bytes.length * 8;
    let padded = [...bytes, 0x80];
    while (padded.length % 64 !== 56) padded.push(0);
    for (let i = 0; i < 8; i++) padded.push((bitLen / Math.pow(2, i * 8)) & 0xff);

    let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
    for (let chunkStart = 0; chunkStart < padded.length; chunkStart += 64) {
      const M = [];
      for (let i = 0; i < 16; i++) {
        M[i] = padded[chunkStart + i * 4] | (padded[chunkStart + i * 4 + 1] << 8) | (padded[chunkStart + i * 4 + 2] << 16) | (padded[chunkStart + i * 4 + 3] << 24);
      }
      let [A, B, C, D] = [a0, b0, c0, d0];
      for (let i = 0; i < 64; i++) {
        let F, g;
        if (i < 16) { F = (B & C) | (~B & D); g = i; }
        else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
        else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
        else { F = C ^ (B | ~D); g = (7 * i) % 16; }
        F = (F + A + K[i] + M[g]) | 0;
        A = D; D = C; C = B;
        B = (B + rotl(F, S[i])) | 0;
      }
      a0 = (a0 + A) | 0; b0 = (b0 + B) | 0; c0 = (c0 + C) | 0; d0 = (d0 + D) | 0;
    }
    return toHex(a0) + toHex(b0) + toHex(c0) + toHex(d0);
  }

  async function _computeHash(type, text) {
    if (type === 'MD5') return _md5(text);
    if (type === 'SHA1') return _sha('SHA-1', text);
    if (type === 'SHA256') return _sha('SHA-256', text);
    if (type === 'SHA512') return _sha('SHA-512', text);
    return '';
  }

  // ══════════════════════════════════════════════════════════════════════
  // ENTROPY / STRENGTH ANALYSIS (shared by generator, strength tab, policy)
  // ══════════════════════════════════════════════════════════════════════
  function _poolSize(pw) {
    let pool = 0;
    if (/[a-z]/.test(pw)) pool += 26;
    if (/[A-Z]/.test(pw)) pool += 26;
    if (/[0-9]/.test(pw)) pool += 10;
    if (/[^a-zA-Z0-9]/.test(pw)) pool += 33;
    return pool || 1;
  }
  function _entropyBits(pw) {
    if (!pw) return 0;
    return Math.round(pw.length * Math.log2(_poolSize(pw)) * 100) / 100;
  }
  function _crackTimeSeconds(entropyBits, guessesPerSecond) {
    return Math.pow(2, entropyBits) / guessesPerSecond / 2;
  }
  function _humanizeSeconds(sec) {
    if (!isFinite(sec)) return 'effectively never';
    if (sec < 1) return 'instantly';
    const units = [['second', 60], ['minute', 60], ['hour', 24], ['day', 365], ['year', 100], ['century', Infinity]];
    let value = sec, unitName = 'second';
    for (const [name, size] of units) {
      unitName = name;
      if (value < size) break;
      value /= size;
    }
    if (unitName === 'century' && value > 1e6) return 'longer than the age of the universe';
    return `~${value < 10 ? value.toFixed(1) : Math.round(value)} ${unitName}${value >= 2 ? 's' : ''}`;
  }
  function _strengthBand(entropy) {
    if (entropy < 28) return { label: 'Very Weak', cls: 'critical', pct: 15 };
    if (entropy < 36) return { label: 'Weak', cls: 'high', pct: 35 };
    if (entropy < 60) return { label: 'Moderate', cls: 'medium', pct: 55 };
    if (entropy < 80) return { label: 'Strong', cls: 'low', pct: 80 };
    return { label: 'Very Strong', cls: 'success', pct: 100 };
  }
  function _detectDictionary(pw) {
    const lower = pw.toLowerCase();
    const stripped = lower.replace(/[\d!@#$%^&*()\-_=+.]+$/g, '');
    const list = SD().COMMON_PASSWORDS;
    return list.some(w => lower === w || stripped === w || lower.includes(w));
  }
  function _detectRepeated(pw) { return /(.)\1{2,}/.test(pw); }
  function _detectSequential(pw) {
    const lower = pw.toLowerCase();
    for (let i = 0; i < lower.length - 2; i++) {
      const a = lower.charCodeAt(i), b = lower.charCodeAt(i + 1), c = lower.charCodeAt(i + 2);
      if (b === a + 1 && c === b + 1) return true;
      if (b === a - 1 && c === b - 1) return true;
    }
    return false;
  }
  function _detectKeyboardPattern(pw) {
    const lower = pw.toLowerCase();
    return SD().KEYBOARD_ROWS.some(row => {
      for (let i = 0; i <= row.length - 3; i++) {
        const frag = row.slice(i, i + 3);
        if (lower.includes(frag) || lower.includes([...frag].reverse().join(''))) return true;
      }
      return false;
    });
  }
  function _analyzePassword(pw) {
    const entropy = _entropyBits(pw);
    const band = _strengthBand(entropy);
    const dictionary = _detectDictionary(pw);
    const repeated = _detectRepeated(pw);
    const sequential = _detectSequential(pw);
    const keyboard = _detectKeyboardPattern(pw);
    const recommendations = [];
    if (pw.length < 12) recommendations.push('Use at least 12 characters — length is the single biggest factor in password strength.');
    if (dictionary) recommendations.push('Avoid common or previously-leaked passwords and their simple variations.');
    if (repeated) recommendations.push('Avoid repeating the same character multiple times in a row.');
    if (sequential) recommendations.push('Avoid sequential runs like "abc" or "321".');
    if (keyboard) recommendations.push('Avoid keyboard-walk patterns like "qwerty" or "asdf".');
    if (!/[^a-zA-Z0-9]/.test(pw)) recommendations.push('Add symbols to increase the character pool and entropy.');
    if (!recommendations.length) recommendations.push('This password looks solid — no common weaknesses detected.');
    return { entropy, band, dictionary, repeated, sequential, keyboard, recommendations };
  }

  // ══════════════════════════════════════════════════════════════════════
  // PASSWORD GENERATOR
  // ══════════════════════════════════════════════════════════════════════
  function _buildGeneratorView() {
    return `
      <div class="pt-gen-grid">
        <div class="card">
          <div class="card-header"><div class="card-title">Password Generator</div></div>
          <div class="card-body">
            <div class="pt-form-row">
              <label class="pt-label">Length: <span id="pt-gen-length-val">16</span></label>
              <input type="range" id="pt-gen-length" min="8" max="128" value="16" style="width:100%;" />
            </div>
            <div class="pt-checkbox-grid">
              <label class="nt-checkbox"><input type="checkbox" id="pt-gen-upper" checked/> Uppercase (A-Z)</label>
              <label class="nt-checkbox"><input type="checkbox" id="pt-gen-lower" checked/> Lowercase (a-z)</label>
              <label class="nt-checkbox"><input type="checkbox" id="pt-gen-numbers" checked/> Numbers (0-9)</label>
              <label class="nt-checkbox"><input type="checkbox" id="pt-gen-symbols" checked/> Symbols (!@#$…)</label>
              <label class="nt-checkbox"><input type="checkbox" id="pt-gen-exclude-similar"/> Exclude similar characters (il1Lo0O)</label>
              <label class="nt-checkbox"><input type="checkbox" id="pt-gen-exclude-ambiguous"/> Exclude ambiguous symbols ({}[]()etc.)</label>
            </div>
            <div class="pt-form-row">
              <label class="pt-label">Generate Multiple: <span id="pt-gen-count-val">1</span></label>
              <input type="range" id="pt-gen-count" min="1" max="10" value="1" style="width:100%;" />
            </div>
            <button class="btn btn-primary" id="pt-gen-generate">${svg('refresh')} Generate</button>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">Result</div></div>
          <div class="card-body">
            <div id="pt-gen-results"></div>
          </div>
        </div>
      </div>`;
  }

  function _genCharset() {
    const d = SD().CHAR_SETS;
    let set = '';
    if (document.getElementById('pt-gen-upper').checked) set += d.upper;
    if (document.getElementById('pt-gen-lower').checked) set += d.lower;
    if (document.getElementById('pt-gen-numbers').checked) set += d.numbers;
    if (document.getElementById('pt-gen-symbols').checked) set += d.symbols;
    if (document.getElementById('pt-gen-exclude-similar').checked) set = [...set].filter(c => !SD().SIMILAR_CHARS.includes(c)).join('');
    if (document.getElementById('pt-gen-exclude-ambiguous').checked) set = [...set].filter(c => !SD().AMBIGUOUS_CHARS.includes(c)).join('');
    return [...new Set(set)].join('');
  }
  function _generateOne(length, charset) {
    if (!charset.length) return '';
    let out = '';
    for (let i = 0; i < length; i++) out += charset[_secureRandomInt(charset.length)];
    return out;
  }

  function _wireGenerator() {
    const lenEl = document.getElementById('pt-gen-length'), lenVal = document.getElementById('pt-gen-length-val');
    lenEl?.addEventListener('input', () => lenVal.textContent = lenEl.value);
    const cntEl = document.getElementById('pt-gen-count'), cntVal = document.getElementById('pt-gen-count-val');
    cntEl?.addEventListener('input', () => cntVal.textContent = cntEl.value);
    document.getElementById('pt-gen-generate')?.addEventListener('click', _runGenerate);
    _runGenerate();
  }

  function _runGenerate() {
    const charset = _genCharset();
    const box = document.getElementById('pt-gen-results');
    if (!charset.length) {
      box.innerHTML = `<div class="empty-state"><div class="empty-state-desc">Select at least one character type.</div></div>`;
      return;
    }
    const length = parseInt(document.getElementById('pt-gen-length').value, 10);
    const count = parseInt(document.getElementById('pt-gen-count').value, 10);
    const results = Array.from({ length: count }, () => _generateOne(length, charset));

    box.innerHTML = results.map((pw, idx) => {
      const entropy = _entropyBits(pw);
      const band = _strengthBand(entropy);
      return `
      <div class="pt-result-row">
        <div class="pt-result-value mono" id="pt-gen-value-${idx}">${esc(pw)}</div>
        <div class="pt-result-actions">
          <span class="badge badge-${band.cls === 'success' ? 'success' : band.cls === 'low' ? 'success' : band.cls === 'medium' ? 'medium' : band.cls === 'high' ? 'high' : 'danger'}">${band.label}</span>
          <button class="btn-icon pt-copy-btn" data-value="${esc(pw)}" title="Copy">${svg('copy')}</button>
          <button class="btn-icon pt-fav-btn" data-value="${esc(pw)}" title="Save Favorite">${svg('star')}</button>
        </div>
      </div>`;
    }).join('');

    results.forEach(pw => generatedHistory.push({ value: pw, entropy: _entropyBits(pw), date: new Date().toISOString() }));
    _savePersisted();
    _refreshStatsStatic();
    window.NotificationManager?.success('Password Generated', `${count} password${count > 1 ? 's' : ''} generated.`);

    box.querySelectorAll('.pt-copy-btn').forEach(btn => btn.addEventListener('click', () => _copyText(btn.dataset.value, 'Password copied')));
    box.querySelectorAll('.pt-fav-btn').forEach(btn => btn.addEventListener('click', () => _saveFavorite(btn.dataset.value)));
  }

  function _saveFavorite(value) {
    favorites.push({ id: uid('fav'), value, entropy: _entropyBits(value), date: new Date().toISOString().slice(0, 10) });
    _savePersisted();
    _refreshStatsStatic();
    window.NotificationManager?.success('Saved', 'Password saved to favorites.');
  }

  // ══════════════════════════════════════════════════════════════════════
  // PASSPHRASE GENERATOR
  // ══════════════════════════════════════════════════════════════════════
  function _buildPassphraseView() {
    return `
      <div class="pt-gen-grid">
        <div class="card">
          <div class="card-header"><div class="card-title">Passphrase Generator</div></div>
          <div class="card-body">
            <div class="pt-form-row">
              <label class="pt-label">Word Count: <span id="pt-pp-count-val">5</span></label>
              <input type="range" id="pt-pp-count" min="4" max="12" value="5" style="width:100%;" />
            </div>
            <div class="pt-form-row">
              <label class="pt-label">Separator</label>
              <select class="input" id="pt-pp-sep">
                <option value="-">Dash ( - )</option>
                <option value=" ">Space</option>
                <option value="_">Underscore ( _ )</option>
                <option value="random">Random symbol each time</option>
              </select>
            </div>
            <label class="nt-checkbox"><input type="checkbox" id="pt-pp-number" checked/> Append a random number</label>
            <label class="nt-checkbox"><input type="checkbox" id="pt-pp-capitalize" checked/> Capitalize each word</label>
            <button class="btn btn-primary" id="pt-pp-generate" style="margin-top:var(--space-3);">${svg('refresh')} Generate Passphrase</button>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">Result</div></div>
          <div class="card-body"><div id="pt-pp-results"></div></div>
        </div>
      </div>`;
  }

  function _wirePassphrase() {
    const cntEl = document.getElementById('pt-pp-count'), cntVal = document.getElementById('pt-pp-count-val');
    cntEl?.addEventListener('input', () => cntVal.textContent = cntEl.value);
    document.getElementById('pt-pp-generate')?.addEventListener('click', _runPassphrase);
    _runPassphrase();
  }

  function _runPassphrase() {
    const words = SD().WORDLIST;
    const count = parseInt(document.getElementById('pt-pp-count').value, 10);
    const sepChoice = document.getElementById('pt-pp-sep').value;
    const addNumber = document.getElementById('pt-pp-number').checked;
    const capitalize = document.getElementById('pt-pp-capitalize').checked;
    const randomSyms = '-_.+=#*';

    const chosen = Array.from({ length: count }, () => words[_secureRandomInt(words.length)]);
    const parts = chosen.map(w => capitalize ? w[0].toUpperCase() + w.slice(1) : w);
    let phrase = '';
    parts.forEach((p, idx) => {
      phrase += p;
      if (idx < parts.length - 1) phrase += sepChoice === 'random' ? randomSyms[_secureRandomInt(randomSyms.length)] : sepChoice;
    });
    if (addNumber) phrase += (sepChoice === ' ' ? ' ' : sepChoice === 'random' ? randomSyms[_secureRandomInt(randomSyms.length)] : sepChoice) + _secureRandomInt(9000 + 1000);

    const entropyPerWord = Math.log2(words.length);
    const totalEntropy = Math.round(entropyPerWord * count * 100) / 100;
    const band = _strengthBand(totalEntropy);

    const box = document.getElementById('pt-pp-results');
    box.innerHTML = `
      <div class="pt-result-row">
        <div class="pt-result-value mono">${esc(phrase)}</div>
        <div class="pt-result-actions">
          <span class="badge badge-${band.cls === 'success' ? 'success' : band.cls === 'low' ? 'success' : band.cls === 'medium' ? 'medium' : band.cls === 'high' ? 'high' : 'danger'}">${band.label}</span>
          <button class="btn-icon pt-copy-btn" data-value="${esc(phrase)}" title="Copy">${svg('copy')}</button>
          <button class="btn-icon pt-fav-btn" data-value="${esc(phrase)}" title="Save Favorite">${svg('star')}</button>
        </div>
      </div>
      <div class="pt-entropy-note">Entropy estimate: <strong>${totalEntropy} bits</strong> (~${entropyPerWord.toFixed(1)} bits/word × ${count} words from a ${words.length}-word list).</div>`;

    generatedHistory.push({ value: phrase, entropy: totalEntropy, date: new Date().toISOString() });
    _savePersisted(); _refreshStatsStatic();
    window.NotificationManager?.success('Password Generated', 'Passphrase generated.');

    box.querySelectorAll('.pt-copy-btn').forEach(btn => btn.addEventListener('click', () => _copyText(btn.dataset.value, 'Passphrase copied')));
    box.querySelectorAll('.pt-fav-btn').forEach(btn => btn.addEventListener('click', () => _saveFavorite(btn.dataset.value)));
  }

  // ══════════════════════════════════════════════════════════════════════
  // STRENGTH ANALYZER (+ entropy calculator + crack time)
  // ══════════════════════════════════════════════════════════════════════
  function _buildStrengthView() {
    return `
      <div class="card" style="max-width:720px;">
        <div class="card-header"><div class="card-title">Password Strength &amp; Entropy Analyzer</div></div>
        <div class="card-body">
          <div class="pt-form-row">
            <label class="pt-label">Password to Analyze</label>
            <div class="pt-reveal-row">
              <input type="password" class="input mono" id="pt-str-input" placeholder="Type a password to analyze…" />
              <button class="btn-icon" id="pt-str-toggle" title="Show/Hide">${svg('eye')}</button>
            </div>
          </div>
        </div>
      </div>
      <div id="pt-str-result" style="margin-top:var(--space-4);"></div>`;
  }

  function _wireStrength() {
    const input = document.getElementById('pt-str-input');
    input?.addEventListener('input', () => _runStrengthAnalysis(input.value));
    document.getElementById('pt-str-toggle')?.addEventListener('click', () => {
      input.type = input.type === 'password' ? 'text' : 'password';
    });
  }

  function _runStrengthAnalysis(pw) {
    const box = document.getElementById('pt-str-result');
    if (!pw) { box.innerHTML = ''; return; }
    const a = _analyzePassword(pw);
    const crackOffline = _crackTimeSeconds(a.entropy, 1e10); // fast offline hash cracking rig
    const crackOnline = _crackTimeSeconds(a.entropy, 100); // throttled online login (~100/sec)

    box.innerHTML = `
      <div class="card">
        <div class="card-body">
          <div class="pt-meter-track"><div class="pt-meter-fill pt-meter-${a.band.cls}" style="width:${a.band.pct}%;"></div></div>
          <div class="pt-meter-label pt-meter-text-${a.band.cls}">${a.band.label} — ${a.entropy} bits of entropy</div>
          <div class="ai-detail-grid" style="margin-top:var(--space-4);">
            <div class="ai-detail-field"><div class="ai-detail-field-label">Crack Time (offline, fast rig)</div><div class="ai-detail-field-value">${_humanizeSeconds(crackOffline)}</div></div>
            <div class="ai-detail-field"><div class="ai-detail-field-label">Crack Time (online, throttled)</div><div class="ai-detail-field-value">${_humanizeSeconds(crackOnline)}</div></div>
            <div class="ai-detail-field"><div class="ai-detail-field-label">Length</div><div class="ai-detail-field-value">${pw.length} characters</div></div>
            <div class="ai-detail-field"><div class="ai-detail-field-label">Character Pool</div><div class="ai-detail-field-value">${_poolSize(pw)} possible characters</div></div>
          </div>
          <div class="pt-flag-row">
            ${_flagBadge('Dictionary Word', a.dictionary)}
            ${_flagBadge('Repeated Characters', a.repeated)}
            ${_flagBadge('Sequential Characters', a.sequential)}
            ${_flagBadge('Keyboard Pattern', a.keyboard)}
          </div>
          <div class="ai-detail-sub-title">Recommendations</div>
          <ul class="pt-rec-list">${a.recommendations.map(r => `<li>${esc(r)}</li>`).join('')}</ul>
        </div>
      </div>`;
  }
  function _flagBadge(label, triggered) {
    return `<span class="badge ${triggered ? 'badge-danger' : 'badge-success'}">${triggered ? '⚠ ' : '✓ '}${esc(label)}</span>`;
  }

  // ══════════════════════════════════════════════════════════════════════
  // POLICY CHECKER
  // ══════════════════════════════════════════════════════════════════════
  function _buildPolicyView() {
    const d = SD();
    return `
      <div class="pt-gen-grid">
        <div class="card">
          <div class="card-header"><div class="card-title">Password Policy Checker</div></div>
          <div class="card-body">
            <div class="pt-form-row">
              <label class="pt-label">Policy Template</label>
              <select class="input" id="pt-pol-template">${d.POLICY_TEMPLATES.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select>
            </div>
            <div id="pt-pol-desc" class="pt-entropy-note"></div>
            <div class="pt-form-row" style="margin-top:var(--space-4);">
              <label class="pt-label">Password to Check</label>
              <input type="text" class="input mono" id="pt-pol-input" placeholder="Type a password…" />
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">Policy Result</div></div>
          <div class="card-body"><div id="pt-pol-result"></div></div>
        </div>
      </div>`;
  }

  function _wirePolicy() {
    const sel = document.getElementById('pt-pol-template');
    sel?.addEventListener('change', () => { _updatePolicyDesc(); _runPolicyCheck(); });
    document.getElementById('pt-pol-input')?.addEventListener('input', _runPolicyCheck);
    _updatePolicyDesc();
  }
  function _updatePolicyDesc() {
    const p = SD().POLICY_TEMPLATES.find(x => x.id === document.getElementById('pt-pol-template').value);
    document.getElementById('pt-pol-desc').textContent = p ? p.description : '';
  }
  function _runPolicyCheck() {
    const p = SD().POLICY_TEMPLATES.find(x => x.id === document.getElementById('pt-pol-template').value);
    const pw = document.getElementById('pt-pol-input').value;
    const box = document.getElementById('pt-pol-result');
    if (!pw || !p) { box.innerHTML = ''; return; }
    const checks = [
      { label: `Minimum length (${p.minLength})`, pass: pw.length >= p.minLength },
      { label: 'Contains uppercase', pass: !p.requireUpper || /[A-Z]/.test(pw) },
      { label: 'Contains lowercase', pass: !p.requireLower || /[a-z]/.test(pw) },
      { label: 'Contains number', pass: !p.requireNumber || /[0-9]/.test(pw) },
      { label: 'Contains symbol', pass: !p.requireSymbol || /[^a-zA-Z0-9]/.test(pw) },
      { label: 'Not a common/breached password', pass: !p.blockCommon || !_detectDictionary(pw) },
    ];
    const allPass = checks.every(c => c.pass);
    box.innerHTML = `
      <div class="badge ${allPass ? 'badge-success' : 'badge-danger'}" style="font-size:var(--text-sm);padding:6px 12px;margin-bottom:var(--space-3);display:inline-block;">${allPass ? 'Policy Compliant' : 'Policy Violation'}</div>
      ${checks.map(c => `<div class="pt-check-row">${svg(c.pass ? 'check' : 'close', c.pass ? 'pt-check-pass' : 'pt-check-fail')} ${esc(c.label)}</div>`).join('')}
      ${p.maxAgeDays ? `<div class="pt-entropy-note" style="margin-top:var(--space-3);">Policy requires rotation every ${p.maxAgeDays} days.</div>` : ''}`;
  }

  // ══════════════════════════════════════════════════════════════════════
  // HASH TOOLS (generate / verify / compare)
  // ══════════════════════════════════════════════════════════════════════
  function _buildHashView() {
    return `
      <div class="card" style="max-width:760px;">
        <div class="card-header"><div class="card-title">Hash Generator</div></div>
        <div class="card-body">
          <div class="pt-form-row"><label class="pt-label">Input Text</label><textarea class="input mono" id="pt-hash-input" rows="2" placeholder="Text to hash…"></textarea></div>
          <button class="btn btn-primary" id="pt-hash-generate">${svg('hash')} Generate Hashes</button>
          <div id="pt-hash-results" style="margin-top:var(--space-4);"></div>
        </div>
      </div>
      <div class="card" style="max-width:760px;margin-top:var(--space-4);">
        <div class="card-header"><div class="card-title">Hash Verifier / Compare</div></div>
        <div class="card-body">
          <div class="pt-form-row"><label class="pt-label">Text</label><input type="text" class="input mono" id="pt-verify-text" placeholder="Original text…" /></div>
          <div class="pt-form-row"><label class="pt-label">Algorithm</label>
            <select class="input" id="pt-verify-algo"><option>MD5</option><option>SHA1</option><option selected>SHA256</option><option>SHA512</option></select>
          </div>
          <div class="pt-form-row"><label class="pt-label">Hash to Compare Against</label><input type="text" class="input mono" id="pt-verify-hash" placeholder="Paste a hash…" /></div>
          <button class="btn btn-secondary" id="pt-verify-run">${svg('check')} Verify</button>
          <div id="pt-verify-result" style="margin-top:var(--space-3);"></div>
        </div>
      </div>`;
  }

  function _wireHash() {
    document.getElementById('pt-hash-generate')?.addEventListener('click', _runHashGenerate);
    document.getElementById('pt-verify-run')?.addEventListener('click', _runHashVerify);
  }

  async function _runHashGenerate() {
    const text = document.getElementById('pt-hash-input').value;
    const box = document.getElementById('pt-hash-results');
    if (!text) { box.innerHTML = `<div class="empty-state"><div class="empty-state-desc">Enter text to hash.</div></div>`; return; }
    box.innerHTML = `<div class="empty-state"><div class="empty-state-desc">Computing…</div></div>`;
    const algos = ['MD5', 'SHA1', 'SHA256', 'SHA512'];
    const hashes = await Promise.all(algos.map(a => _computeHash(a, text)));
    box.innerHTML = algos.map((a, i) => `
      <div class="pt-hash-row">
        <div class="pt-hash-algo">${a}</div>
        <div class="pt-hash-value mono">${esc(hashes[i])}</div>
        <button class="btn-icon pt-copy-btn" data-value="${esc(hashes[i])}" title="Copy">${svg('copy')}</button>
      </div>`).join('');
    box.querySelectorAll('.pt-copy-btn').forEach(btn => btn.addEventListener('click', () => _copyText(btn.dataset.value, `${btn.closest('.pt-hash-row').querySelector('.pt-hash-algo').textContent} hash copied`)));
    window.NotificationManager?.success('Hashes Generated', `${algos.length} hash values computed.`);
  }

  async function _runHashVerify() {
    const text = document.getElementById('pt-verify-text').value;
    const algo = document.getElementById('pt-verify-algo').value;
    const target = document.getElementById('pt-verify-hash').value.trim().toLowerCase();
    const box = document.getElementById('pt-verify-result');
    if (!text || !target) { box.innerHTML = `<div class="empty-state"><div class="empty-state-desc">Enter both text and a hash to compare.</div></div>`; return; }
    const computed = (await _computeHash(algo, text)).toLowerCase();
    const match = computed === target;
    box.innerHTML = `<div class="badge ${match ? 'badge-success' : 'badge-danger'}" style="font-size:var(--text-sm);padding:6px 12px;">${match ? '✓ Hashes Match' : '✗ Hashes Do Not Match'}</div>
      <div class="pt-entropy-note" style="margin-top:var(--space-2);">Computed: <span class="mono">${esc(computed)}</span></div>`;
  }

  // ══════════════════════════════════════════════════════════════════════
  // BREACH CHECKER (offline demonstration only)
  // ══════════════════════════════════════════════════════════════════════
  function _buildBreachView() {
    return `
      <div class="card" style="max-width:640px;">
        <div class="card-header"><div class="card-title">Password Breach Checker</div></div>
        <div class="card-body">
          <div class="pt-placeholder-banner">${svg('warn', 'pt-inline-icon')} DEMONSTRATION ONLY — checks against a small bundled offline list. Never contacts any online breach API.</div>
          <div class="pt-form-row"><label class="pt-label">Password to Check</label><input type="text" class="input mono" id="pt-breach-input" placeholder="Type a password…" /></div>
          <button class="btn btn-primary" id="pt-breach-run">${svg('warn')} Check</button>
          <div id="pt-breach-result" style="margin-top:var(--space-4);"></div>
        </div>
      </div>`;
  }
  function _wireBreach() {
    document.getElementById('pt-breach-run')?.addEventListener('click', _runBreachCheck);
    document.getElementById('pt-breach-input')?.addEventListener('keydown', e => { if (e.key === 'Enter') _runBreachCheck(); });
  }
  function _runBreachCheck() {
    const pw = document.getElementById('pt-breach-input').value;
    const box = document.getElementById('pt-breach-result');
    if (!pw) { box.innerHTML = ''; return; }
    const lower = pw.toLowerCase();
    const d = SD();
    let status, cls, msg;
    if (d.BREACH_DEMO_SET.has(lower)) {
      status = 'Compromised (Demo)'; cls = 'badge-danger'; msg = 'This exact password appears in the bundled offline demo breach corpus. In real life, change it immediately and enable MFA.';
    } else if (d.COMMON_PASSWORDS.includes(lower)) {
      status = 'Previously Seen'; cls = 'badge-warning'; msg = 'This password is on a common/weak password list — even if not in the demo breach set, avoid it.';
    } else if (_entropyBits(pw) < 36) {
      status = 'Weak'; cls = 'badge-warning'; msg = 'This password is not in the demo dataset, but its low entropy makes it easy to guess or brute-force.';
    } else {
      status = 'Safe (Demo)'; cls = 'badge-success'; msg = 'Not found in the offline demo dataset and has reasonable entropy. This does not guarantee safety against real-world breaches.';
    }
    box.innerHTML = `<div class="badge ${cls}" style="font-size:var(--text-sm);padding:6px 12px;">${status}</div>
      <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-top:var(--space-3);line-height:1.6;">${msg}</p>`;
    window.NotificationManager?.info('Breach Check Complete', status);
  }

  // ══════════════════════════════════════════════════════════════════════
  // VAULT DEMO
  // ══════════════════════════════════════════════════════════════════════
  const VAULT_FOLDERS = ['Personal', 'Work', 'Finance', 'Social', 'Servers'];
  function _buildVaultView() {
    return `
      <div class="pt-placeholder-banner">${svg('lock', 'pt-inline-icon')} DEMONSTRATION ONLY — entries are stored in plain localStorage for UI demo purposes; this is not real encrypted vault storage.</div>
      <div class="ai-filter-bar" style="margin-bottom:var(--space-3);">
        <div class="ti-search-box" style="flex:1;min-width:200px;">${svg('search', 'pt-inline-icon')}<input type="text" id="pt-vault-search" placeholder="Search vault entries…" /></div>
        <select class="input ai-filter-select" id="pt-vault-folder"><option value="all">All Folders</option>${VAULT_FOLDERS.map(f => `<option>${f}</option>`).join('')}</select>
        <label class="nt-checkbox"><input type="checkbox" id="pt-vault-fav-only"/> Favorites only</label>
        <button class="btn btn-primary btn-sm" id="pt-vault-add">${svg('plus')} Add Entry</button>
      </div>
      <div id="pt-vault-list" class="pt-vault-grid"></div>`;
  }
  function _wireVault() {
    document.getElementById('pt-vault-search')?.addEventListener('input', e => { vaultFilter.q = e.target.value; _renderVault(); });
    document.getElementById('pt-vault-folder')?.addEventListener('change', e => { vaultFilter.folder = e.target.value; _renderVault(); });
    document.getElementById('pt-vault-fav-only')?.addEventListener('change', e => { vaultFilter.favoritesOnly = e.target.checked; _renderVault(); });
    document.getElementById('pt-vault-add')?.addEventListener('click', () => _openVaultModal(null));
    _renderVault();
  }
  function _renderVault() {
    const box = document.getElementById('pt-vault-list');
    if (!box) return;
    const q = vaultFilter.q.trim().toLowerCase();
    const rows = vaultEntries.filter(v => {
      if (vaultFilter.folder !== 'all' && v.folder !== vaultFilter.folder) return false;
      if (vaultFilter.favoritesOnly && !v.favorite) return false;
      if (q && !`${v.name} ${v.username} ${(v.tags || []).join(' ')}`.toLowerCase().includes(q)) return false;
      return true;
    });
    if (!rows.length) { box.innerHTML = `<div class="empty-state"><div class="empty-state-desc">No vault entries yet. Click "Add Entry" to create one (demo only).</div></div>`; return; }
    box.innerHTML = rows.map(v => `
      <div class="card pt-vault-card">
        <div class="pt-vault-card-header">
          <div>
            <div class="pt-vault-name">${esc(v.name)}</div>
            <div class="pt-vault-meta">${esc(v.username)} &middot; ${esc(v.folder)}</div>
          </div>
          <button class="btn-icon pt-vault-fav" data-id="${v.id}" title="Toggle favorite" style="color:${v.favorite ? 'var(--color-warning)' : 'var(--text-tertiary)'};">${svg('star')}</button>
        </div>
        <div class="card-body">
          <div class="pt-vault-pw-row">
            <span class="mono pt-vault-pw" data-id="${v.id}" data-value="${esc(v.password)}">${'•'.repeat(Math.min(v.password.length, 14))}</span>
            <button class="btn-icon pt-vault-toggle" data-id="${v.id}" title="Show/Hide">${svg('eye')}</button>
            <button class="btn-icon pt-copy-btn" data-value="${esc(v.password)}" title="Copy">${svg('copy')}</button>
          </div>
          <div class="ti-tag-row" style="margin-top:var(--space-2);">${(v.tags || []).map(t => `<span class="badge badge-neutral">${esc(t)}</span>`).join('')}</div>
          <div style="display:flex;gap:var(--space-2);margin-top:var(--space-3);">
            <button class="btn btn-secondary btn-sm pt-vault-del" data-id="${v.id}">${svg('trash')} Delete</button>
          </div>
        </div>
      </div>`).join('');

    box.querySelectorAll('.pt-vault-fav').forEach(btn => btn.addEventListener('click', () => _toggleVaultFavorite(btn.dataset.id)));
    box.querySelectorAll('.pt-vault-toggle').forEach(btn => btn.addEventListener('click', () => {
      const span = box.querySelector(`.pt-vault-pw[data-id="${btn.dataset.id}"]`);
      const isHidden = span.textContent.startsWith('•');
      span.textContent = isHidden ? span.dataset.value : '•'.repeat(Math.min(span.dataset.value.length, 14));
    }));
    box.querySelectorAll('.pt-copy-btn').forEach(btn => btn.addEventListener('click', () => _copyText(btn.dataset.value, 'Password copied')));
    box.querySelectorAll('.pt-vault-del').forEach(btn => btn.addEventListener('click', () => _confirmDeleteVault(btn.dataset.id)));
  }
  function _toggleVaultFavorite(id) {
    const v = vaultEntries.find(x => x.id === id);
    if (!v) return;
    v.favorite = !v.favorite;
    _savePersisted(); _renderVault(); _refreshStatsStatic();
  }

  function _buildVaultModal() {
    return `
    <div class="ai-modal-overlay" id="pt-vault-modal-overlay">
      <div class="ai-modal">
        <div class="ai-modal-header"><div class="ai-modal-title">Add Vault Entry (Demo)</div><div class="ai-detail-close" id="pt-vault-modal-close">${svg('close')}</div></div>
        <div class="ai-modal-body">
          <div class="ai-form-row"><label class="ai-label">Name *</label><input type="text" class="input" id="pt-vault-form-name" placeholder="e.g. Corporate Email" /></div>
          <div class="ai-form-grid">
            <div class="ai-form-row"><label class="ai-label">Username</label><input type="text" class="input" id="pt-vault-form-user" /></div>
            <div class="ai-form-row"><label class="ai-label">Password</label><input type="text" class="input mono" id="pt-vault-form-pass" /></div>
            <div class="ai-form-row"><label class="ai-label">Folder</label><select class="input" id="pt-vault-form-folder">${VAULT_FOLDERS.map(f => `<option>${f}</option>`).join('')}</select></div>
            <div class="ai-form-row"><label class="ai-label">Tags (comma-separated)</label><input type="text" class="input" id="pt-vault-form-tags" /></div>
          </div>
          <div class="ai-form-error" id="pt-vault-form-error"></div>
        </div>
        <div class="ai-modal-footer"><button class="btn btn-secondary" id="pt-vault-form-cancel">Cancel</button><button class="btn btn-primary" id="pt-vault-form-save">Save</button></div>
      </div>
    </div>`;
  }
  function _wireVaultModal() {
    document.getElementById('pt-vault-modal-close')?.addEventListener('click', _closeVaultModal);
    document.getElementById('pt-vault-form-cancel')?.addEventListener('click', _closeVaultModal);
    document.getElementById('pt-vault-modal-overlay')?.addEventListener('click', e => { if (e.target.id === 'pt-vault-modal-overlay') _closeVaultModal(); });
    document.getElementById('pt-vault-form-save')?.addEventListener('click', _saveVaultForm);
  }
  function _openVaultModal() {
    ['name', 'user', 'pass', 'tags'].forEach(f => document.getElementById(`pt-vault-form-${f}`).value = '');
    document.getElementById('pt-vault-form-error').textContent = '';
    document.getElementById('pt-vault-modal-overlay').classList.add('open');
  }
  function _closeVaultModal() { document.getElementById('pt-vault-modal-overlay').classList.remove('open'); }
  function _saveVaultForm() {
    const name = document.getElementById('pt-vault-form-name').value.trim();
    if (!name) { document.getElementById('pt-vault-form-error').textContent = 'Name is required.'; return; }
    vaultEntries.push({
      id: uid('vault'), name, username: document.getElementById('pt-vault-form-user').value.trim(),
      password: document.getElementById('pt-vault-form-pass').value || _generateOne(16, SD().CHAR_SETS.upper + SD().CHAR_SETS.lower + SD().CHAR_SETS.numbers),
      folder: document.getElementById('pt-vault-form-folder').value,
      tags: document.getElementById('pt-vault-form-tags').value.split(',').map(t => t.trim()).filter(Boolean),
      favorite: false,
    });
    _savePersisted(); _closeVaultModal(); _renderVault(); _refreshStatsStatic();
    window.NotificationManager?.success('Saved', `${name} added to the demo vault.`);
  }

  let pendingVaultDeleteId = null;
  function _buildConfirmModal() {
    return `
    <div class="ai-modal-overlay" id="pt-confirm-overlay">
      <div class="ai-modal ai-modal-sm">
        <div class="ai-modal-header"><div class="ai-modal-title">Delete Vault Entry</div><div class="ai-detail-close" id="pt-confirm-close">${svg('close')}</div></div>
        <div class="ai-modal-body"><p style="color:var(--text-secondary);font-size:var(--text-sm);">This cannot be undone.</p></div>
        <div class="ai-modal-footer"><button class="btn btn-secondary" id="pt-confirm-cancel">Cancel</button><button class="btn btn-danger" id="pt-confirm-delete">Delete</button></div>
      </div>
    </div>`;
  }
  function _wireConfirmModal() {
    document.getElementById('pt-confirm-close')?.addEventListener('click', _closeConfirm);
    document.getElementById('pt-confirm-cancel')?.addEventListener('click', _closeConfirm);
    document.getElementById('pt-confirm-overlay')?.addEventListener('click', e => { if (e.target.id === 'pt-confirm-overlay') _closeConfirm(); });
    document.getElementById('pt-confirm-delete')?.addEventListener('click', () => {
      if (!pendingVaultDeleteId) return;
      vaultEntries = vaultEntries.filter(v => v.id !== pendingVaultDeleteId);
      _savePersisted(); _closeConfirm(); _renderVault(); _refreshStatsStatic();
      window.NotificationManager?.success('Deleted', 'Vault entry removed.');
    });
  }
  function _confirmDeleteVault(id) { pendingVaultDeleteId = id; document.getElementById('pt-confirm-overlay').classList.add('open'); }
  function _closeConfirm() { document.getElementById('pt-confirm-overlay').classList.remove('open'); pendingVaultDeleteId = null; }

  // ══════════════════════════════════════════════════════════════════════
  // MFA GUIDE + SECURITY TIPS
  // ══════════════════════════════════════════════════════════════════════
  function _buildMfaView() {
    const d = SD();
    const secColor = { 'Very High': 'var(--color-success)', High: 'var(--color-primary)', Medium: 'var(--color-warning)', Low: 'var(--color-danger)' };
    return `
      <div class="ai-detail-sub-title" style="margin-top:0;">Multi-Factor Authentication Methods</div>
      <div class="pt-mfa-grid">
        ${d.MFA_METHODS.map(m => `
          <div class="card pt-mfa-card">
            <div class="pt-mfa-card-header">
              <div class="pt-mfa-name">${esc(m.name)}</div>
              <span class="badge" style="background:${secColor[m.security]}22;color:${secColor[m.security]};">${esc(m.security)}</span>
            </div>
            <div class="card-body">
              <div class="pt-mfa-category">${esc(m.category)}</div>
              <p style="font-size:var(--text-sm);color:var(--text-secondary);line-height:1.5;margin:var(--space-2) 0;">${esc(m.description)}</p>
              <div class="pt-mfa-pros-cons">
                <div><strong>Pros:</strong> ${m.pros.map(esc).join(', ')}</div>
                <div><strong>Cons:</strong> ${m.cons.map(esc).join(', ')}</div>
              </div>
            </div>
          </div>`).join('')}
      </div>
      <div class="ai-detail-sub-title">Security Best-Practice Tips</div>
      <div class="pt-tips-grid">
        ${d.SECURITY_TIPS.map(t => `
          <div class="card pt-tip-card">
            <span class="badge badge-info">${esc(t.category)}</span>
            <div class="pt-tip-title">${esc(t.title)}</div>
            <div class="pt-tip-desc">${esc(t.description)}</div>
          </div>`).join('')}
      </div>`;
  }

  // ══════════════════════════════════════════════════════════════════════
  // REPORTS / EXPORT
  // ══════════════════════════════════════════════════════════════════════
  function _buildReportsView() {
    return `
      <div class="card" style="max-width:640px;">
        <div class="card-header"><div class="card-title">Export</div></div>
        <div class="card-body">
          <div style="display:flex;flex-wrap:wrap;gap:var(--space-3);">
            <button class="btn btn-secondary" id="pt-export-csv">${svg('down')} Generated History (CSV)</button>
            <button class="btn btn-secondary" id="pt-export-json">${svg('down')} Generated History (JSON)</button>
            <button class="btn btn-secondary" id="pt-export-policy">${svg('down')} Password Policy (JSON)</button>
            <button class="btn btn-secondary" id="pt-export-report">${svg('report')} Security Report (HTML)</button>
          </div>
        </div>
      </div>`;
  }
  function _wireReports() {
    document.getElementById('pt-export-csv')?.addEventListener('click', () => {
      const header = ['value', 'entropy', 'date'];
      const csv = [header.join(','), ...generatedHistory.map(h => header.map(k => `"${String(h[k]).replace(/"/g, '""')}"`).join(','))].join('\n');
      _download('password-history.csv', csv, 'text/csv');
      window.NotificationManager?.success('Exported', 'Generated password history exported as CSV.');
    });
    document.getElementById('pt-export-json')?.addEventListener('click', () => {
      _download('password-history.json', JSON.stringify(generatedHistory, null, 2), 'application/json');
      window.NotificationManager?.success('Exported', 'Generated password history exported as JSON.');
    });
    document.getElementById('pt-export-policy')?.addEventListener('click', () => {
      _download('password-policy.json', JSON.stringify(SD().POLICY_TEMPLATES, null, 2), 'application/json');
      window.NotificationManager?.success('Exported', 'Password policy templates exported.');
    });
    document.getElementById('pt-export-report')?.addEventListener('click', _exportSecurityReport);
  }
  function _download(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  function _exportSecurityReport() {
    const s = _computeStats();
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Password Security Report</title>
      <style>body{font-family:-apple-system,sans-serif;max-width:900px;margin:40px auto;color:#0f172a;}
      table{width:100%;border-collapse:collapse;margin:16px 0;} th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:13px;} th{background:#f1f5f9;}
      h1{font-size:22px;} .warn{background:#fef3c7;padding:10px;border-radius:6px;font-size:12px;}</style></head><body>
      <h1>Khan Security Solutions — Password Security Report</h1>
      <div class="warn">⚠ Educational tool — vault and breach checker are offline demonstrations only.</div>
      <p><strong>${s.generated}</strong> passwords generated this session, <strong>${s.strong}</strong> strong, <strong>${s.weak}</strong> weak. Average entropy: <strong>${s.avgEntropy} bits</strong>.
      Vault contains <strong>${s.vault}</strong> demo entries; <strong>${s.favorites}</strong> favorites saved.</p>
      <p style="color:#64748b;font-size:11px;margin-top:24px;">Generated by Khan Security Solutions Enterprise · ${new Date().toLocaleString()}</p>
      </body></html>`;
    _download('password-security-report.html', html, 'text/html');
    window.NotificationManager?.success('Exported', 'Security report generated.');
  }

  // ══════════════════════════════════════════════════════════════════════
  // SHARED HELPERS
  // ══════════════════════════════════════════════════════════════════════
  function _copyText(text, msg) {
    navigator.clipboard?.writeText(text).then(() => window.NotificationManager?.info(msg || 'Copied', '')).catch(() => {
      const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
      window.NotificationManager?.info(msg || 'Copied', '');
    });
  }

  // ══════════════════════════════════════════════════════════════════════
  // PERSISTENCE
  // ══════════════════════════════════════════════════════════════════════
  function _loadPersisted() {
    if (!window.StorageManager) return;
    generatedHistory = window.StorageManager.lsGet('pt_generated_history', []) || [];
    favorites = window.StorageManager.lsGet('pt_favorites', []) || [];
    vaultEntries = window.StorageManager.lsGet('pt_vault_entries', []) || [];
  }
  function _savePersisted() {
    // Cap history length to keep storage lean
    if (generatedHistory.length > 200) generatedHistory = generatedHistory.slice(-200);
    window.StorageManager?.lsSet('pt_generated_history', generatedHistory);
    window.StorageManager?.lsSet('pt_favorites', favorites);
    window.StorageManager?.lsSet('pt_vault_entries', vaultEntries);
  }

  // ══════════════════════════════════════════════════════════════════════
  // SEARCH (global)
  // ══════════════════════════════════════════════════════════════════════
  function _registerSearch() {
    if (!window.SearchEngine) return;
    window.SearchEngine.register('Password Tools', [
      { title: 'Password & Security Toolkit', meta: 'Generator, strength, hash, MFA, vault', route: 'password-tools', keywords: 'password hash entropy mfa vault policy generator passphrase breach' },
      { title: 'Password Generator', meta: 'Create strong random passwords', route: 'password-tools', keywords: 'password generator random' },
      { title: 'Passphrase Generator', meta: 'Diceware-style word passphrases', route: 'password-tools', keywords: 'passphrase diceware words' },
      { title: 'Password Strength Analyzer', meta: 'Entropy and crack-time analysis', route: 'password-tools', keywords: 'strength entropy crack time analyzer' },
      { title: 'Password Policy Checker', meta: 'Validate against enterprise policy templates', route: 'password-tools', keywords: 'policy checker compliance nist pci' },
      { title: 'Hash Tools', meta: 'MD5, SHA1, SHA256, SHA512 generator and verifier', route: 'password-tools', keywords: 'hash md5 sha1 sha256 sha512 verify' },
      { title: 'Breach Checker', meta: 'Offline breach demonstration lookup', route: 'password-tools', keywords: 'breach checker compromised leaked' },
      { title: 'Password Vault Demo', meta: 'Folders, tags, favorites — demonstration only', route: 'password-tools', keywords: 'vault folders tags favorites demo' },
      { title: 'MFA Guide', meta: 'Compare multi-factor authentication methods', route: 'password-tools', keywords: 'mfa authenticator fido2 passkeys hardware key' },
    ]);
  }

  // ── Public API ─────────────────────────────────────────────────────────
  return { register };

})();

window.PasswordTools = PasswordTools;

if (window.Router) {
  PasswordTools.register();
} else {
  console.error('[PasswordTools] Router not found. Ensure router.js loads before password-tools.js.');
}
