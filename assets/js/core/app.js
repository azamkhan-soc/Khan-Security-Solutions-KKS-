/**
 * KHAN SECURITY SOLUTIONS ENTERPRISE
 * Application Bootstrap (app.js)
 *
 * Entry point. Initialises all core systems in the correct order.
 * Registers all routes. Mounts sidebar and topbar interactivity.
 */

(async function KSSApp() {

  // ── 0. Dependency guard ──────────────────────────────────────────────────
  // If any core script failed to load (wrong path, 404, case-mismatch on a
  // case-sensitive filesystem, etc.) fail loudly with an on-screen message
  // instead of throwing a silent ReferenceError that leaves the loading
  // screen stuck forever.
  const REQUIRED_GLOBALS = {
    StorageManager:      'assets/js/core/storage.js',
    ThemeEngine:          'assets/js/core/theme.js',
    NotificationManager:  'assets/js/core/notifications.js',
    Router:               'assets/js/core/router.js',
    SearchEngine:          'assets/js/core/search.js',
  };

  const missing = Object.entries(REQUIRED_GLOBALS)
    .filter(([globalName]) => typeof window[globalName] === 'undefined')
    .map(([globalName, path]) => `${globalName} (expected from ${path})`);

  if (missing.length > 0) {
    _showBootError(missing);
    return; // stop here — do not attempt to use undefined globals
  }

  // ── 1. Storage (must come first – other systems depend on it) ──────────────
  await StorageManager.init();

  // ── 2. Theme ───────────────────────────────────────────────────────────────
  try {
    ThemeEngine.init();

    // ── 3. Render the shell HTML ───────────────────────────────────────────────
    _mountShell();

    // ── 4. Notification system ─────────────────────────────────────────────────
    NotificationManager.init();

    // ── 5. Search engine ───────────────────────────────────────────────────────
    SearchEngine.init();

    // ── 6. Register all routes ─────────────────────────────────────────────────
    _registerRoutes();

    // ── 7. Wire up sidebar and topbar interactions ─────────────────────────────
    _mountSidebarEvents();
    _mountTopbarEvents();

    // ── 8. Start clock ─────────────────────────────────────────────────────────
    _startClock();

    // ── 9. Load user profile from settings ────────────────────────────────────
    _loadUserProfile();

    // ── 10. Start router (reads hash, navigates to initial page) ───────────────
    Router.init();

    // ── 11. Auto-save heartbeat ────────────────────────────────────────────────
    _startAutoSave();

    // ── 12. Welcome notification ───────────────────────────────────────────────
    setTimeout(() => {
      NotificationManager.success(
        'Platform Ready',
        'Khan Security Solutions Enterprise is running in offline mode.',
        { source: 'System' }
      );
    }, 1200);

  } catch (err) {
    console.error('[KSSApp] Bootstrap failed:', err);
    _showBootError([`Unexpected error during startup: ${err.message}`]);
    return;
  } finally {
    // ── 13. Hide loading screen ────────────────────────────────────────────────
    // ALWAYS runs, even if something above throws, so the user is never stuck
    // staring at a frozen loading screen.
    setTimeout(() => {
      const loading = document.getElementById('app-loading');
      if (loading) {
        loading.classList.add('fade-out');
        setTimeout(() => loading.remove(), 500);
      }
    }, 800);
  }

})();

/**
 * Displays a readable, on-screen error message when core scripts fail to
 * load or initialise — instead of leaving a blank screen + console error.
 */
function _showBootError(reasons) {
  const loading = document.getElementById('app-loading');
  if (loading) loading.remove();

  const root = document.getElementById('app-root') || document.body;
  const msg = document.createElement('div');
  msg.style.cssText = `
    position: fixed; inset: 0; background: #0a0c10; color: #f1f5f9;
    display: flex; align-items: center; justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    padding: 40px; z-index: 99999;
  `;
  msg.innerHTML = `
    <div style="max-width: 560px;">
      <h1 style="font-size: 22px; margin-bottom: 12px; color:#f87171;">
        Application Failed to Start
      </h1>
      <p style="color:#94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
        One or more required scripts did not load. This usually means
        <code style="background:#161b27;padding:2px 6px;border-radius:4px;">index.html</code>
        is not being opened from the root of the
        <code style="background:#161b27;padding:2px 6px;border-radius:4px;">khan-security-enterprise</code>
        folder, or a file was renamed/moved.
      </p>
      <ul style="color:#fca5a5; font-size: 13px; font-family: 'JetBrains Mono', monospace; line-height: 1.8; padding-left: 18px;">
        ${reasons.map(r => `<li>${r}</li>`).join('')}
      </ul>
      <p style="color:#64748b; font-size: 13px; margin-top: 16px;">
        Fix: keep the full folder structure intact and open
        <code style="background:#161b27;padding:2px 6px;border-radius:4px;">index.html</code>
        directly from inside <code style="background:#161b27;padding:2px 6px;border-radius:4px;">khan-security-enterprise/</code>.
      </p>
    </div>
  `;
  root.appendChild(msg);
}

// =============================================================================
// SHELL RENDER
// Injects sidebar, topbar, page views, and overlays into #app-root
// =============================================================================

function _mountShell() {
  const root = document.getElementById('app-root');
  if (!root) return;

  root.innerHTML = `

    <!-- ═══ SIDEBAR ═══════════════════════════════════════════════════════ -->
    <aside class="sidebar-region" role="navigation" aria-label="Main navigation">
      <nav class="sidebar">

        <!-- Header / Brand -->
        <div class="sidebar-header">
          <div class="sidebar-logo" aria-label="Khan Security Solutions">KS</div>
          <div class="sidebar-brand">
            <div class="sidebar-brand-name">KSS Enterprise</div>
            <div class="sidebar-brand-sub">v1.0.0 · Offline</div>
          </div>
        </div>

        <!-- Search -->
        <div class="sidebar-search">
          <div class="sidebar-search-input" id="sidebar-search-trigger"
               role="button" tabindex="0" aria-label="Open global search (Ctrl+K)">
            <svg class="sidebar-search-icon" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <span class="sidebar-search-text">Search…</span>
            <span class="sidebar-search-kbd">⌃K</span>
          </div>
        </div>

        <!-- Navigation -->
        <div class="sidebar-nav" role="list">

          <!-- MAIN -->
          <div class="nav-section">
            <div class="nav-section-label">Main</div>

            <div class="nav-item" data-route="dashboard" data-tooltip="Dashboard" role="listitem" tabindex="0">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                <path stroke-linecap="round" stroke-linejoin="round"
                      d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zm0 9.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zm9.75-9.75A2.25 2.25 0 0115.75 3.75H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zm0 9.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/>
              </svg>
              <span class="nav-label">Dashboard</span>
            </div>

            <div class="nav-item" data-route="portfolio" data-tooltip="Portfolio" role="listitem" tabindex="0">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                <path stroke-linecap="round" stroke-linejoin="round"
                      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
              </svg>
              <span class="nav-label">Portfolio</span>
            </div>

            <div class="nav-item" data-route="company" data-tooltip="Company" role="listitem" tabindex="0">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                <path stroke-linecap="round" stroke-linejoin="round"
                      d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"/>
              </svg>
              <span class="nav-label">Company</span>
            </div>
          </div>

          <!-- CYBER WORKBENCH -->
          <div class="nav-section">
            <div class="nav-section-label">Cyber Workbench</div>

            <div class="nav-item" data-route="siem" data-tooltip="SIEM" role="listitem" tabindex="0">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                <path stroke-linecap="round" stroke-linejoin="round"
                      d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776"/>
              </svg>
              <span class="nav-label">Log Analyzer</span>
            </div>

            <div class="nav-item" data-route="malware" data-tooltip="Malware Analysis" role="listitem" tabindex="0">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                <path stroke-linecap="round" stroke-linejoin="round"
                      d="M12 12.75c1.148 0 2.278.08 3.383.237 1.037.146 1.866.966 1.866 2.013 0 3.728-2.35 6.75-3.75 6.75s-3.75-3.022-3.75-6.75c0-1.047.83-1.867 1.866-2.013A24.204 24.204 0 0112 12.75zm0 0c2.883 0 5.647.508 8.207 1.44a23.91 23.91 0 01-1.152 6.06M12 12.75c-2.883 0-5.647.508-8.208 1.44a23.91 23.91 0 001.153 6.06M12 12.75a2.25 2.25 0 002.248-2.354M12 12.75a2.25 2.25 0 01-2.248-2.354M12 8.25c.995 0 1.971-.08 2.922-.236.403-.066.74-.358.795-.762a3.778 3.778 0 00-.399-2.25M12 8.25c-.995 0-1.97-.08-2.921-.236-.403-.066-.74-.358-.795-.762a3.778 3.778 0 01.4-2.25m0 0a3.728 3.728 0 013.48 0m0 0a3.728 3.728 0 003.48-2.963m-.001 0c0-.337.228-.645.545-.77"/>
              </svg>
              <span class="nav-label">Malware Analysis</span>
            </div>

            <div class="nav-item" data-route="threat-intel" data-tooltip="Threat Intelligence" role="listitem" tabindex="0">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                <path stroke-linecap="round" stroke-linejoin="round"
                      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>
              </svg>
              <span class="nav-label">Threat Intel</span>
            </div>

            <div class="nav-item" data-route="network-tools" data-tooltip="Network Tools" role="listitem" tabindex="0">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                <path stroke-linecap="round" stroke-linejoin="round"
                      d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"/>
              </svg>
              <span class="nav-label">Network Tools</span>
            </div>

            <div class="nav-item" data-route="dfir" data-tooltip="DFIR Toolkit" role="listitem" tabindex="0">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                <path stroke-linecap="round" stroke-linejoin="round"
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803zM13.5 10.5h-6"/>
              </svg>
              <span class="nav-label">DFIR Toolkit</span>
            </div>

            <div class="nav-item" data-route="vuln-manager" data-tooltip="Vulnerability Manager" role="listitem" tabindex="0">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                <path stroke-linecap="round" stroke-linejoin="round"
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
              </svg>
              <span class="nav-label">Vuln Manager</span>
            </div>

            <div class="nav-item" data-route="asset-inventory" data-tooltip="Asset Inventory" role="listitem" tabindex="0">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                <path stroke-linecap="round" stroke-linejoin="round"
                      d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"/>
              </svg>
              <span class="nav-label">Asset Inventory</span>
            </div>

            <div class="nav-item" data-route="incident-response" data-tooltip="Incident Response" role="listitem" tabindex="0">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                <path stroke-linecap="round" stroke-linejoin="round"
                      d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/>
              </svg>
              <span class="nav-label">Incident Response</span>
            </div>

            <div class="nav-item" data-route="phishing" data-tooltip="Phishing Analyzer" role="listitem" tabindex="0">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                <path stroke-linecap="round" stroke-linejoin="round"
                      d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m8.839 2.51l-4.66-2.51m0 0l-1.023-.55a2.25 2.25 0 00-2.134 0l-1.022.55m0 0l-4.661 2.51m16.5 1.615a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V8.844a2.25 2.25 0 011.183-1.98l7.5-4.04a2.25 2.25 0 012.134 0l7.5 4.04a2.25 2.25 0 011.183 1.98V19.5z"/>
              </svg>
              <span class="nav-label">Phishing Analyzer</span>
            </div>

            <div class="nav-item" data-route="ioc-manager" data-tooltip="IOC Manager" role="listitem" tabindex="0">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                <path stroke-linecap="round" stroke-linejoin="round"
                      d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5"/>
              </svg>
              <span class="nav-label">IOC Manager</span>
            </div>

            <div class="nav-item" data-route="case-manager" data-tooltip="Case Manager" role="listitem" tabindex="0">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                <path stroke-linecap="round" stroke-linejoin="round"
                      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
              </svg>
              <span class="nav-label">Case Manager</span>
            </div>

            <div class="nav-item" data-route="password-tools" data-tooltip="Password Tools" role="listitem" tabindex="0">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                <path stroke-linecap="round" stroke-linejoin="round"
                      d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"/>
              </svg>
              <span class="nav-label">Password Tools</span>
            </div>
          </div>

          <!-- PLATFORM -->
          <div class="nav-section">
            <div class="nav-section-label">Platform</div>

            <div class="nav-item" data-route="ai-assistant" data-tooltip="AI Security Assistant" role="listitem" tabindex="0">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"/>
              </svg>
              <span class="nav-label">AI Assistant</span>
            </div>

            <div class="nav-item" data-route="reports" data-tooltip="Reports" role="listitem" tabindex="0">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                <path stroke-linecap="round" stroke-linejoin="round"
                      d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"/>
              </svg>
              <span class="nav-label">Reports</span>
            </div>

            <div class="nav-item" data-route="settings" data-tooltip="Settings" role="listitem" tabindex="0">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                <path stroke-linecap="round" stroke-linejoin="round"
                      d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <span class="nav-label">Settings</span>
            </div>

            <div class="nav-item" data-route="help" data-tooltip="Help Center" role="listitem" tabindex="0">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                <path stroke-linecap="round" stroke-linejoin="round"
                      d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"/>
              </svg>
              <span class="nav-label">Help Center</span>
            </div>
          </div>
        </div><!-- /sidebar-nav -->

        <!-- Footer / User -->
        <div class="sidebar-footer">
          <div class="sidebar-user-avatar" id="sidebar-avatar">K</div>
          <div class="sidebar-user-info">
            <div class="sidebar-user-name" id="sidebar-user-name">Loading…</div>
            <div class="sidebar-user-role" id="sidebar-user-role">SOC Analyst</div>
          </div>
          <button class="sidebar-collapse-btn" id="sidebar-collapse-btn"
                  aria-label="Collapse sidebar" title="Collapse sidebar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/>
            </svg>
          </button>
        </div>

      </nav>
    </aside>

    <!-- ═══ TOP BAR ════════════════════════════════════════════════════════ -->
    <header class="topbar-region" role="banner">
      <div class="topbar">
        <div class="topbar-left">
          <!-- Breadcrumb -->
          <nav class="topbar-breadcrumb" id="breadcrumb" aria-label="Breadcrumb">
            <span class="topbar-breadcrumb-item">KSS Enterprise</span>
            <span class="topbar-breadcrumb-sep">›</span>
            <span class="topbar-breadcrumb-item current">Dashboard</span>
          </nav>

          <!-- Global Search -->
          <div class="topbar-search" style="margin-left: var(--space-4)">
            <svg class="topbar-search-icon" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input class="topbar-search-input" id="topbar-search-input"
                   type="text" placeholder="Search everything…"
                   aria-label="Search (Ctrl+K)" readonly
                   onclick="SearchEngine.open()" />
            <span class="topbar-search-kbd">⌃K</span>
          </div>
        </div>

        <div class="topbar-right">

          <!-- System Status -->
          <div class="topbar-status" title="All systems operational">
            <div class="topbar-status-dot"></div>
            <span class="topbar-status-text">Offline Mode</span>
          </div>

          <!-- Clock -->
          <div class="topbar-clock" aria-live="polite" aria-label="Current time">
            <div class="topbar-time" id="topbar-time">00:00:00</div>
            <div class="topbar-date" id="topbar-date">—</div>
          </div>

          <!-- Theme Toggle -->
          <button class="topbar-btn" id="theme-toggle-btn"
                  aria-label="Toggle theme" data-tooltip="Toggle theme">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round"
                    d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/>
            </svg>
          </button>

          <!-- Fullscreen -->
          <button class="topbar-btn" id="fullscreen-btn"
                  aria-label="Toggle fullscreen" data-tooltip="Fullscreen">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round"
                    d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"/>
            </svg>
          </button>

          <!-- Demo Mode -->
          <button class="topbar-btn" id="demo-mode-btn"
                  aria-label="Demo mode" data-tooltip="Demo Mode">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round"
                    d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"/>
            </svg>
          </button>

          <!-- Notifications -->
          <button class="topbar-btn" id="notification-btn"
                  aria-label="Notifications" data-tooltip="Notifications">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round"
                    d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/>
            </svg>
            <span class="badge" id="notification-badge" style="display:none">0</span>
          </button>

          <!-- User Menu -->
          <div class="topbar-user dropdown" id="user-menu-trigger">
            <div class="topbar-user-avatar" id="topbar-avatar">K</div>
            <span class="topbar-user-name" id="topbar-user-name">Khan</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" style="color:var(--text-tertiary)">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>
            </svg>
            <!-- Dropdown -->
            <div class="dropdown-menu" id="user-dropdown">
              <div class="dropdown-item" onclick="Router.navigate('portfolio')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
                </svg>
                View Portfolio
              </div>
              <div class="dropdown-item" onclick="Router.navigate('settings')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                Settings
              </div>
              <div class="dropdown-divider"></div>
              <div class="dropdown-item" onclick="Router.navigate('help')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                        d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"/>
                </svg>
                Help & Docs
              </div>
            </div>
          </div>
        </div><!-- /topbar-right -->
      </div><!-- /topbar -->
    </header>

    <!-- ═══ MAIN CONTENT ═══════════════════════════════════════════════════ -->
    <main class="main-region" id="main-region" role="main">

      <!-- ── PAGE VIEWS (one per route) ───────────────────────────────── -->
      <div class="page-view" id="page-dashboard">   <!-- Dashboard module renders here --></div>
      <div class="page-view" id="page-portfolio">   <!-- Portfolio module --></div>
      <div class="page-view" id="page-company">     <!-- Company module --></div>
      <div class="page-view" id="page-siem">        <!-- SIEM Log Analyzer --></div>
      <div class="page-view" id="page-malware">     <!-- Malware Analysis --></div>
      <div class="page-view" id="page-threat-intel"><!-- Threat Intelligence --></div>
      <div class="page-view" id="page-network-tools"><!-- Network Tools --></div>
      <div class="page-view" id="page-dfir">        <!-- DFIR Toolkit --></div>
      <div class="page-view" id="page-vuln-manager"><!-- Vulnerability Manager --></div>
      <div class="page-view" id="page-asset-inventory"><!-- Asset Inventory --></div>
      <div class="page-view" id="page-incident-response"><!-- Incident Response --></div>
      <div class="page-view" id="page-phishing">    <!-- Phishing Analyzer --></div>
      <div class="page-view" id="page-ioc-manager"> <!-- IOC Manager --></div>
      <div class="page-view" id="page-case-manager"><!-- Case Manager --></div>
      <div class="page-view" id="page-password-tools"><!-- Password Tools --></div>
      <div class="page-view" id="page-ai-assistant"><!-- AI Security Assistant --></div>
      <div class="page-view" id="page-reports">     <!-- Reports --></div>
      <div class="page-view" id="page-settings">    <!-- Settings --></div>
      <div class="page-view" id="page-help">        <!-- Help Center --></div>

    </main><!-- /main-region -->

    <!-- ═══ NOTIFICATION PANEL ════════════════════════════════════════════ -->
    <aside class="notification-panel" id="notification-panel"
           role="complementary" aria-label="Notifications">
      <div class="notification-panel-header">
        <div class="notification-panel-title">Notifications</div>
        <div style="display:flex;gap:var(--space-2)">
          <button class="btn btn-ghost btn-sm" onclick="NotificationManager.markAllRead()">
            Mark all read
          </button>
          <button class="btn btn-ghost btn-sm" onclick="NotificationManager.clearAll()">
            Clear all
          </button>
        </div>
      </div>
      <div class="notification-list" id="notification-list"></div>
    </aside>

    <!-- ═══ GLOBAL SEARCH OVERLAY ══════════════════════════════════════════ -->
    <div class="search-overlay" id="search-overlay" role="dialog"
         aria-modal="true" aria-label="Global search">
      <div class="search-panel">
        <div class="search-panel-input-row">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" style="color:var(--text-tertiary);flex-shrink:0">
            <path stroke-linecap="round" stroke-linejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input class="search-panel-input" id="search-panel-input"
                 type="text" placeholder="Search modules, tools, incidents…"
                 aria-label="Search everything" autocomplete="off" />
          <button class="btn btn-secondary btn-sm" id="search-close-btn">Esc</button>
        </div>
        <div class="search-panel-results" id="search-panel-results"></div>
        <div class="search-panel-footer">
          <div class="search-hint">
            <kbd>↑↓</kbd> navigate
          </div>
          <div class="search-hint">
            <kbd>↵</kbd> open
          </div>
          <div class="search-hint">
            <kbd>Esc</kbd> close
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ TOAST CONTAINER ════════════════════════════════════════════════ -->
    <div class="toast-container" id="toast-container" aria-live="polite" aria-atomic="false"></div>

    <!-- ═══ DEMO MODE BANNER (hidden by default) ════════════════════════════ -->
    <div class="demo-banner" id="demo-banner" style="display:none; position:fixed; bottom:0; left:0; right:0; z-index:var(--z-sticky)">
      <div class="demo-banner-text">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round"
                d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"/>
        </svg>
        <strong>DEMO MODE ACTIVE</strong> — All data is simulated for demonstration purposes
      </div>
      <button class="btn btn-secondary btn-sm" id="demo-exit-btn">Exit Demo</button>
    </div>

  `;
}

// =============================================================================
// SIDEBAR EVENTS
// =============================================================================

function _mountSidebarEvents() {
  // Collapse toggle
  document.getElementById('sidebar-collapse-btn')?.addEventListener('click', () => {
    const shell = document.getElementById('app-shell');
    shell?.classList.toggle('sidebar-collapsed');
    const isCollapsed = shell?.classList.contains('sidebar-collapsed');
    StorageManager.setSetting('sidebar_collapsed', isCollapsed);
  });

  // Restore collapsed state
  if (StorageManager.getSetting('sidebar_collapsed')) {
    document.getElementById('app-shell')?.classList.add('sidebar-collapsed');
  }

  // Navigate on nav-item click
  document.querySelectorAll('.nav-item[data-route]').forEach(item => {
    item.addEventListener('click', () => Router.navigate(item.dataset.route));
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        Router.navigate(item.dataset.route);
      }
    });
  });

  // Sidebar search trigger
  document.getElementById('sidebar-search-trigger')?.addEventListener('click', () => {
    SearchEngine.open();
  });
}

// =============================================================================
// TOPBAR EVENTS
// =============================================================================

function _mountTopbarEvents() {
  // Theme toggle
  document.getElementById('theme-toggle-btn')?.addEventListener('click', () => {
    ThemeEngine.toggle();
    NotificationManager.info('Theme Changed', `Switched to ${ThemeEngine.current} theme.`);
  });

  // Fullscreen
  document.getElementById('fullscreen-btn')?.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  });

  // Notifications panel
  document.getElementById('notification-btn')?.addEventListener('click', () => {
    NotificationManager.togglePanel();
  });

  // User dropdown toggle
  const userTrigger = document.getElementById('user-menu-trigger');
  const userDropdown = document.getElementById('user-dropdown');
  userTrigger?.addEventListener('click', (e) => {
    e.stopPropagation();
    userDropdown?.classList.toggle('open');
  });
  document.addEventListener('click', () => {
    userDropdown?.classList.remove('open');
  });

  // Demo mode
  let demoActive = false;
  document.getElementById('demo-mode-btn')?.addEventListener('click', () => {
    demoActive = !demoActive;
    const banner = document.getElementById('demo-banner');
    if (banner) banner.style.display = demoActive ? 'flex' : 'none';
    NotificationManager.info(
      demoActive ? 'Demo Mode Activated' : 'Demo Mode Deactivated',
      demoActive ? 'All data is simulated.' : ''
    );
  });

  document.getElementById('demo-exit-btn')?.addEventListener('click', () => {
    demoActive = false;
    const banner = document.getElementById('demo-banner');
    if (banner) banner.style.display = 'none';
  });
}

// =============================================================================
// CLOCK
// =============================================================================

function _startClock() {
  const timeEl = document.getElementById('topbar-time');
  const dateEl = document.getElementById('topbar-date');

  function tick() {
    const now = new Date();
    if (timeEl) timeEl.textContent = now.toLocaleTimeString('en-GB', { hour12: false });
    if (dateEl) dateEl.textContent = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  tick();
  setInterval(tick, 1000);
}

// =============================================================================
// USER PROFILE
// =============================================================================

function _loadUserProfile() {
  const name = StorageManager.getSetting('user_name') || 'Khan';
  const role = StorageManager.getSetting('user_role') || 'SOC Analyst';
  const initial = name.charAt(0).toUpperCase();

  const els = {
    'sidebar-avatar':     el => el.textContent = initial,
    'sidebar-user-name':  el => el.textContent = name,
    'sidebar-user-role':  el => el.textContent = role,
    'topbar-avatar':      el => el.textContent = initial,
    'topbar-user-name':   el => el.textContent = name.split(' ')[0],
  };

  Object.entries(els).forEach(([id, fn]) => {
    const el = document.getElementById(id);
    if (el) fn(el);
  });
}

// =============================================================================
// ROUTE REGISTRATION
// Placeholder renders for each route – modules will be implemented in M2+
// =============================================================================

function _registerRoutes() {

  // ── Dashboard is now a full module: assets/js/modules/dashboard.js
  //    self-registers the 'dashboard' route when it loads (same pattern as
  //    AI Assistant), so no placeholder registration happens here anymore.

  // ── All other routes: lightweight placeholder stubs ─────────────────────────
  const stubs = [



    { id: 'settings',         title: 'Settings',              desc: '', isSettings: true },
  ];

  stubs.forEach(({ id, title, desc, isSettings }) => {
    Router.register(id, {
      title,
      render() {
        const el = document.getElementById(`page-${id}`);
        if (el && !el.dataset.rendered) {
          el.dataset.rendered = '1';
          el.innerHTML = isSettings
            ? _settingsStub()
            : _placeholderPage(title, desc);
        }
        if (isSettings) _initSettingsStub();
      }
    });
  });
}

// ── Stub page templates ────────────────────────────────────────────────────────

function _placeholderPage(title, desc, extra = '') {
  return `
    <div style="max-width: 900px; margin: 0 auto;">
      <div style="margin-bottom: var(--space-6)">
        <h1 style="font-size: var(--text-3xl); font-weight: var(--weight-bold); margin-bottom: var(--space-2)">${title}</h1>
        <p style="color: var(--text-tertiary); font-size: var(--text-sm)">${desc}</p>
      </div>
      ${extra}
      <div class="card" style="margin-top: var(--space-6)">
        <div class="card-body">
          <div class="empty-state">
            <div class="empty-state-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round"
                      d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"/>
              </svg>
            </div>
            <div class="empty-state-title">Module Coming Soon</div>
            <div class="empty-state-desc">${desc || 'This module will be implemented in a future milestone.'}</div>
          </div>
        </div>
      </div>
    </div>`;
}

function _statCard(label, value, sub, color) {
  return `
    <div class="stat-card">
      <div class="stat-card-icon" style="background: ${color}22; color: ${color}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
          <path stroke-linecap="round" stroke-linejoin="round"
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/>
        </svg>
      </div>
      <div class="stat-card-info">
        <div class="stat-card-value" style="color: ${color}">${value}</div>
        <div class="stat-card-label">${label}</div>
        <div class="stat-card-change" style="color: var(--text-tertiary)">${sub}</div>
      </div>
    </div>`;
}

// ── Minimal Settings stub (functional theme switcher available immediately) ────
function _settingsStub() {
  return `
    <div style="max-width: 760px; margin: 0 auto;">
      <div style="margin-bottom: var(--space-6)">
        <h1 style="font-size: var(--text-3xl); font-weight: var(--weight-bold); margin-bottom: var(--space-2)">Settings</h1>
        <p style="color: var(--text-tertiary); font-size: var(--text-sm)">Application preferences and configuration. Full settings panel coming in Milestone 9.</p>
      </div>

      <!-- Theme -->
      <div class="card" style="margin-bottom: var(--space-4)">
        <div class="card-header">
          <div class="card-title">Appearance</div>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label class="form-label">Theme</label>
            <div style="display: flex; gap: var(--space-3); flex-wrap: wrap;" id="theme-picker">
              ${ThemeEngine.themes.map(t => `
                <button class="btn ${ThemeEngine.current === t.id ? 'btn-primary' : 'btn-secondary'}"
                        onclick="_applyTheme('${t.id}')" id="theme-btn-${t.id}">
                  ${t.icon} ${t.label}
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- User Profile -->
      <div class="card" style="margin-bottom: var(--space-4)">
        <div class="card-header">
          <div class="card-title">User Profile</div>
        </div>
        <div class="card-body">
          <div class="grid grid-2" style="gap: var(--space-4)">
            <div class="form-group">
              <label class="form-label" for="setting-name">Display Name</label>
              <input class="form-input" id="setting-name" type="text"
                     value="${StorageManager.getSetting('user_name') || ''}"
                     placeholder="Your name" />
            </div>
            <div class="form-group">
              <label class="form-label" for="setting-role">Role / Title</label>
              <input class="form-input" id="setting-role" type="text"
                     value="${StorageManager.getSetting('user_role') || ''}"
                     placeholder="e.g. SOC Analyst" />
            </div>
          </div>
          <div style="margin-top: var(--space-4)">
            <button class="btn btn-primary" onclick="_saveProfileSettings()">Save Profile</button>
          </div>
        </div>
      </div>

      <!-- Storage Info -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">Storage</div>
        </div>
        <div class="card-body" id="storage-stats">
          <p style="color: var(--text-tertiary); font-size: var(--text-sm)">Loading storage information…</p>
        </div>
      </div>
    </div>`;
}

function _initSettingsStub() {
  StorageManager.getStorageStats().then(stats => {
    const el = document.getElementById('storage-stats');
    if (!el) return;
    const lsKb = (stats.localStorageBytes / 1024).toFixed(1);
    const usedMb = stats.usedBytes ? (stats.usedBytes / 1024 / 1024).toFixed(2) : '—';
    const quotaMb = stats.quotaBytes ? (stats.quotaBytes / 1024 / 1024).toFixed(0) : '—';
    el.innerHTML = `
      <div class="grid grid-3" style="gap: var(--space-4)">
        <div>
          <div style="font-size: var(--text-xl); font-weight: var(--weight-bold); font-family: var(--font-mono)">${lsKb} KB</div>
          <div style="font-size: var(--text-sm); color: var(--text-tertiary)">localStorage used</div>
        </div>
        <div>
          <div style="font-size: var(--text-xl); font-weight: var(--weight-bold); font-family: var(--font-mono)">${usedMb} MB</div>
          <div style="font-size: var(--text-sm); color: var(--text-tertiary)">IndexedDB used</div>
        </div>
        <div>
          <div style="font-size: var(--text-xl); font-weight: var(--weight-bold); font-family: var(--font-mono)">${quotaMb} MB</div>
          <div style="font-size: var(--text-sm); color: var(--text-tertiary)">Storage quota</div>
        </div>
      </div>`;
  }).catch(() => {});
}

// Global helpers called from inline onclick attributes
window._applyTheme = function(id) {
  ThemeEngine.apply(id);
  document.querySelectorAll('[id^="theme-btn-"]').forEach(btn => {
    btn.className = 'btn btn-secondary';
  });
  const activeBtn = document.getElementById(`theme-btn-${id}`);
  if (activeBtn) activeBtn.className = 'btn btn-primary';
  NotificationManager.success('Theme Applied', `Switched to ${id} theme.`);
};

window._saveProfileSettings = function() {
  const name = document.getElementById('setting-name')?.value?.trim();
  const role = document.getElementById('setting-role')?.value?.trim();
  if (name) StorageManager.setSetting('user_name', name);
  if (role) StorageManager.setSetting('user_role', role);
  _loadUserProfile();
  NotificationManager.success('Profile Saved', 'Your profile settings have been updated.');
};

// =============================================================================
// AUTO-SAVE HEARTBEAT
// =============================================================================
function _startAutoSave() {
  setInterval(() => {
    StorageManager.setSetting('last_active', new Date().toISOString());
  }, 30000); // every 30 seconds
}
