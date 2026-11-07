/**
 * KHAN SECURITY SOLUTIONS ENTERPRISE
 * Company Module (company.js) — v0.3.0
 *
 * Renders the Khan Security Solutions company website within the platform.
 * Pages: Home, About, Services, Industries, Solutions, Technologies
 *
 * Integration points used:
 *   window.Router            — route registration
 *   window.SearchEngine      — search content registration
 *   window.NotificationManager — contact form feedback
 *   window.StorageManager    — contact draft persistence
 *   window.CompanyData       — all content (assets/data/company-data.js)
 *
 * Pattern: identical to portfolio.js — self-registers on script load.
 */

const CompanyModule = (() => {

  // ── Data accessor ──────────────────────────────────────────────────────────
  function D() {
    if (!window.CompanyData) throw new Error('[Company] CompanyData missing. Ensure assets/data/company-data.js loads before company.js.');
    return window.CompanyData;
  }

  // ── State ──────────────────────────────────────────────────────────────────
  let mounted = false;
  let revealObserver = null;
  let activeSection = 'co-home';
  let threatFeedInterval = null;
  let activeServiceFilter = 'All';
  let activeTechFilter = 'All';

  // ── SVG Icon Library ───────────────────────────────────────────────────────
  const PATHS = {
    shield:     `<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>`,
    target:     `<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>`,
    eye:        `<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>`,
    lock:       `<path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/>`,
    mail:       `<path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>`,
    monitor:    `<path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"/>`,
    cloud:      `<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z"/>`,
    network:    `<path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"/>`,
    identity:   `<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>`,
    terminal:   `<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z"/>`,
    star:       `<path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/>`,
    book:       `<path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/>`,
    bulb:       `<path stroke-linecap="round" stroke-linejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"/>`,
    check:      `<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>`,
    info:       `<path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/>`,
    warn:       `<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>`,
    arrow:      `<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>`,
    fire:       `<path stroke-linecap="round" stroke-linejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z"/>`,
    cpu:        `<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z"/>`,
    docs:       `<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>`,
    send:       `<path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/>`,
    search:     `<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z"/>`,
    radar:      `<path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z"/><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z"/>`,
    assets:     `<path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/>`,
    automation: `<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/>`,
    checklist:  `<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>`,
    endpoint:   `<path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"/>`,
    intel:      `<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>`,
    support:    `<path stroke-linecap="round" stroke-linejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5.25 0a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/>`,
    cert:       `<path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443"/>`,
    dashboard:  `<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zm0 9.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zm9.75-9.75A2.25 2.25 0 0115.75 3.75H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zm0 9.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/>`,
    sentinel:   `<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>`,
    splunk:     `<path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/>`,
    bug:        `<path stroke-linecap="round" stroke-linejoin="round" d="M12 12.75c1.148 0 2.278.08 3.383.237 1.037.146 1.866.966 1.866 2.013 0 3.728-2.35 6.75-3.75 6.75s-3.75-3.022-3.75-6.75c0-1.047.83-1.867 1.866-2.013A24.204 24.204 0 0112 12.75zm0 0c2.883 0 5.647.508 8.207 1.44a23.91 23.91 0 01-1.152 6.06M12 12.75c-2.883 0-5.647.508-8.208 1.44a23.91 23.91 0 001.153 6.06M12 12.75a2.25 2.25 0 002.248-2.354M12 12.75a2.25 2.25 0 01-2.248-2.354M12 8.25c.995 0 1.971-.08 2.922-.236.403-.066.74-.358.795-.762a3.778 3.778 0 00-.399-2.25M12 8.25c-.995 0-1.97-.08-2.921-.236-.403-.066-.74-.358-.795-.762a3.778 3.778 0 01.4-2.25m0 0a3.728 3.728 0 013.48 0m0 0a3.728 3.728 0 003.48-2.963"/>`,
    phish:      `<path stroke-linecap="round" stroke-linejoin="round" d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m8.839 2.51l-4.66-2.51m0 0l-1.023-.55a2.25 2.25 0 00-2.134 0l-1.022.55m0 0l-4.661 2.51m16.5 1.615a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V8.844a2.25 2.25 0 011.183-1.98l7.5-4.04a2.25 2.25 0 012.134 0l7.5 4.04a2.25 2.25 0 011.183 1.98V19.5z"/>`,
    risk:       `<path stroke-linecap="round" stroke-linejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5"/>`,
    training:   `<path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342"/>`,
    offline:    `<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/>`,
    forensics:  `<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803zM13.5 10.5h-6"/>`,
    finance:    `<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"/>`,
    health:     `<path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>`,
    'search-threat': `<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z"/>`,
    smb:        `<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"/>`,
    enterprise: `<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M12 3.75h.008v.008H12V3.75zm-.375 0a.375.375 0 11.75 0 .375.375 0 01-.75 0z"/>`,
  };

  function icon(name, cls = '') {
    const path = PATHS[name] || PATHS.shield;
    return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">${path}</svg>`;
  }

  function esc(str) {
    const d = document.createElement('div');
    d.textContent = str == null ? '' : String(str);
    return d.innerHTML;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ROUTE REGISTRATION
  // ══════════════════════════════════════════════════════════════════════════
  function register() {
    window.Router.register('company', {
      title: 'Company',
      init,
      render,
    });
  }

  function init() {
    try { D(); } catch (e) { console.error(e.message); return; }
    _registerSearchContent();
  }

  function render() {
    const el = document.getElementById('page-company');
    if (!el) return;

    if (!mounted) {
      el.innerHTML = _buildHTML();
      mounted = true;
      _wireInteractions();
      _setupScrollReveal();
      _startThreatFeed();
    } else {
      _setupScrollReveal();
    }
  }

  function cleanup() {
    if (threatFeedInterval) {
      clearInterval(threatFeedInterval);
      threatFeedInterval = null;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MASTER HTML BUILDER
  // ══════════════════════════════════════════════════════════════════════════
  function _buildHTML() {
    return (
      _buildSubNav() +
      _buildHome() +
      _buildAbout() +
      _buildServices() +
      _buildIndustries() +
      _buildSolutions() +
      _buildTechnologies() +
      _buildCTA()
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SUB-NAVIGATION
  // ══════════════════════════════════════════════════════════════════════════
  function _buildSubNav() {
    const links = [
      ['co-home',         'Home'],
      ['co-about',        'About'],
      ['co-services',     'Services'],
      ['co-industries',   'Industries'],
      ['co-solutions',    'Solutions'],
      ['co-technologies', 'Technologies'],
    ];
    return `
    <nav class="co-subnav" aria-label="Company sections">
      <div class="co-subnav-inner" id="co-subnav-inner">
        ${links.map(([id, label], i) => `
          <span class="co-subnav-link${i === 0 ? ' active' : ''}" data-target="${id}">${esc(label)}</span>
        `).join('')}
      </div>
    </nav>`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // HOME / HERO SECTION
  // ══════════════════════════════════════════════════════════════════════════
  function _buildHome() {
    const d = D();
    const b = d.brand;

    // Simulated threat events for the live feed display
    const events = [
      { type: 'CRITICAL', loc: 'Mumbai, IN', msg: 'Ransomware C2 beacon detected', cls: '' },
      { type: 'ALERT',    loc: 'London, UK', msg: 'Spearphishing campaign identified', cls: 'warn' },
      { type: 'INFO',     loc: 'Singapore',  msg: 'IOC matched — blocked at perimeter', cls: 'info' },
    ];

    return `
    <section class="co-hero" id="co-home">
      <div class="co-hero-canvas" aria-hidden="true">
        <div class="co-hero-grid"></div>
        <div class="co-orb co-orb-1"></div>
        <div class="co-orb co-orb-2"></div>
        <div class="co-orb co-orb-3"></div>
      </div>

      <div class="co-hero-content">
        <div class="co-hero-text">
          <div class="co-hero-kicker">
            <span class="co-hero-kicker-dot"></span>
            Cybersecurity Consulting & Operations
          </div>

          <h1 class="co-hero-headline">
            <span class="co-gradient-text">${esc(b.name)}</span><br>
            Securing What Matters Most
          </h1>

          <p class="co-hero-sub">${esc(b.tagline)}</p>

          <div class="co-hero-actions">
            <button class="btn btn-primary btn-lg" onclick="document.getElementById('co-services').scrollIntoView({behavior:'smooth'})">
              ${icon('shield')} Explore Services
            </button>
            <button class="btn btn-secondary btn-lg" onclick="window.Router.navigate('portfolio')">
              ${icon('docs')} View Portfolio
            </button>
            <button class="btn btn-secondary btn-lg" onclick="window.Router.navigate('dashboard')">
              ${icon('monitor')} Cyber Workbench
            </button>
          </div>

          <div class="co-hero-stats">
            ${d.stats.map(s => `
              <div>
                <div class="co-hero-stat-value">${esc(s.value)}</div>
                <div class="co-hero-stat-label">${esc(s.label)}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="co-hero-visual" aria-hidden="true">
          <div class="co-threat-display">
            <div class="co-threat-header">
              <span class="co-threat-title">Global Threat Monitor</span>
              <span class="co-threat-live">
                <span class="status-dot online pulse" style="width:6px;height:6px;"></span>
                SIMULATED · EDUCATIONAL
              </span>
            </div>

            ${_buildWorldMap()}

            <div class="co-threat-feed" id="co-threat-feed">
              ${events.map(e => `
                <div class="co-threat-event ${e.cls}">
                  <span class="co-threat-event-type">${esc(e.type)}</span>
                  <span class="co-threat-event-loc">${esc(e.loc)}</span>
                  <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(e.msg)}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    </section>`;
  }

  function _buildWorldMap() {
    // Simplified SVG world map — outline only, no external resources
    // Threat dots placed at approximate real-world coordinates
    const threatDots = [
      { cx: 160, cy: 100, cls: '' },      // Europe
      { cx: 240, cy: 115, cls: 'warn' },  // Middle East
      { cx: 290, cy: 130, cls: 'info' },  // South Asia
      { cx: 360, cy: 110, cls: '' },      // East Asia
      { cx: 80,  cy: 80,  cls: 'warn' },  // North America
      { cx: 100, cy: 140, cls: 'info' },  // South America
    ];

    return `
    <svg class="co-world-map" viewBox="0 0 440 220" aria-hidden="true">
      <!-- Simplified continent shapes using paths -->
      <!-- North America -->
      <path d="M30 50 L90 40 L110 60 L100 90 L80 110 L60 130 L40 120 L20 100 Z" class="co-map-country highlighted" opacity="0.4"/>
      <!-- South America -->
      <path d="M80 130 L110 120 L120 160 L110 190 L85 200 L70 175 L75 145 Z" class="co-map-country" opacity="0.3"/>
      <!-- Europe -->
      <path d="M145 45 L175 38 L190 55 L180 75 L160 80 L140 70 Z" class="co-map-country highlighted" opacity="0.4"/>
      <!-- Africa -->
      <path d="M150 80 L185 75 L195 130 L175 175 L155 170 L140 130 L145 90 Z" class="co-map-country" opacity="0.3"/>
      <!-- Asia -->
      <path d="M185 38 L310 35 L340 60 L350 90 L320 100 L280 95 L240 80 L200 65 Z" class="co-map-country highlighted" opacity="0.4"/>
      <!-- South Asia -->
      <path d="M250 80 L295 78 L300 115 L270 120 L245 100 Z" class="co-map-country" opacity="0.3"/>
      <!-- SE Asia / Oceania -->
      <path d="M320 100 L370 100 L390 130 L360 145 L330 135 L315 115 Z" class="co-map-country" opacity="0.3"/>
      <path d="M370 150 L400 145 L405 165 L380 168 Z" class="co-map-country" opacity="0.25"/>
      <!-- Grid overlay -->
      <line x1="0" y1="110" x2="440" y2="110" stroke="var(--border-subtle)" stroke-width="0.5"/>
      <line x1="220" y1="0" x2="220" y2="220" stroke="var(--border-subtle)" stroke-width="0.5"/>
      <!-- Threat dots -->
      ${threatDots.map((d, i) => `
        <circle class="co-threat-dot ${d.cls}" cx="${d.cx}" cy="${d.cy}" r="4"
                style="animation-delay:${(i * 0.4).toFixed(1)}s"/>
      `).join('')}
    </svg>`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ABOUT SECTION
  // ══════════════════════════════════════════════════════════════════════════
  function _buildAbout() {
    const d = D();
    const b = d.brand;

    return `
    <section id="co-about">
      <div class="co-section">
        <div class="co-section-header co-reveal">
          <span class="co-eyebrow">Who We Are</span>
          <h2 class="co-section-title">About Khan Security Solutions</h2>
          <p class="co-section-desc">A cybersecurity practice built on genuine expertise, certified knowledge, and an uncompromising commitment to client security.</p>
        </div>

        <div class="co-about-grid">
          <div style="display:flex;flex-direction:column;gap:var(--space-5);">
            <div class="co-mission-card co-reveal">
              <div class="co-mission-icon">${icon('target')}</div>
              <div class="co-mission-label">Mission</div>
              <p class="co-mission-text">${esc(b.mission)}</p>
            </div>
            <div class="co-mission-card co-reveal">
              <div class="co-mission-icon" style="background:var(--color-accent-glow);color:var(--color-accent-light);">${icon('star')}</div>
              <div class="co-mission-label" style="color:var(--color-accent-light);">Vision</div>
              <p class="co-mission-text">${esc(b.vision)}</p>
            </div>
          </div>

          <div>
            <div style="font-size:var(--text-xs);font-weight:var(--weight-semibold);text-transform:uppercase;letter-spacing:0.08em;color:var(--text-tertiary);margin-bottom:var(--space-4);">Core Values</div>
            <div class="co-values-grid">
              ${d.values.map(v => `
                <div class="co-value-card co-reveal">
                  <div class="co-value-title">${esc(v.title)}</div>
                  <div class="co-value-desc">${esc(v.desc)}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- Timeline -->
      <div class="co-section co-section-alt" style="padding-top:var(--space-12);padding-bottom:var(--space-12);">
        <div class="co-section-header co-reveal">
          <span class="co-eyebrow">Journey</span>
          <h2 class="co-section-title">Our Story</h2>
          <p class="co-section-desc">From foundational IT operations to certified cybersecurity practice — building expertise the right way.</p>
        </div>
        <div class="co-timeline">
          ${d.timeline.map(t => `
            <div class="co-timeline-item">
              <div class="co-timeline-dot"></div>
              <div class="co-timeline-card">
                <span class="co-timeline-year">${esc(t.year)}</span>
                <div class="co-timeline-title">${esc(t.title)}</div>
                <div class="co-timeline-desc">${esc(t.desc)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Why Choose -->
      <div class="co-section">
        <div class="co-section-header co-reveal">
          <span class="co-eyebrow">Why KSS</span>
          <h2 class="co-section-title">Why Choose Khan Security Solutions</h2>
          <p class="co-section-desc">What makes our approach different from commodity security providers.</p>
        </div>
        <div class="co-why-grid">
          ${d.whyChoose.map(w => `
            <div class="co-why-card co-reveal">
              <div class="co-why-icon">${icon(w.icon)}</div>
              <div class="co-why-title">${esc(w.title)}</div>
              <p class="co-why-desc">${esc(w.desc)}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </section>`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SERVICES SECTION
  // ══════════════════════════════════════════════════════════════════════════
  function _buildServices() {
    const d = D();
    return `
    <section class="co-section co-section-alt" id="co-services">
      <div class="co-section-header co-reveal">
        <span class="co-eyebrow">What We Do</span>
        <h2 class="co-section-title">Services</h2>
        <p class="co-section-desc">A comprehensive portfolio of cybersecurity services — from continuous monitoring to one-time assessments — tailored to your needs.</p>
      </div>

      <div class="co-filter-bar" id="co-service-filters">
        ${d.serviceCategories.map(cat => `
          <button class="co-filter-btn${cat === 'All' ? ' active' : ''}" data-category="${esc(cat)}">${esc(cat)}</button>
        `).join('')}
      </div>

      <div class="co-services-grid" id="co-services-grid">
        ${d.services.map(s => _buildServiceCard(s)).join('')}
      </div>

      ${_buildFutureServices()}
    </section>`;
  }

  function _buildFutureServices() {
    const d = D();
    if (!d.futureServices || !d.futureServices.length) return '';
    return `
    <div style="margin-top: var(--space-16);">
      <div class="co-section-header co-reveal">
        <span class="co-eyebrow" style="background:var(--color-accent-glow);border-color:rgba(124,58,237,0.35);color:var(--color-accent-light);">
          Future Roadmap
        </span>
        <h2 class="co-section-title" style="font-size:var(--text-3xl);">Future Managed Security Services</h2>
        <p class="co-section-desc">
          The following capabilities are planned commercial offerings as Khan Security Solutions expands into a full managed security services provider.
          <br><em style="color:var(--text-tertiary);font-size:var(--text-sm);">These are planned future services — not currently available.</em>
        </p>
      </div>

      <div class="co-future-grid">
        ${d.futureServices.map(fs => `
          <div class="co-future-card co-reveal">
            <div class="co-future-card-icon">${icon(fs.icon || 'shield')}</div>
            <div class="co-future-card-title">${esc(fs.title)}</div>
            <p class="co-future-card-desc">${esc(fs.desc)}</p>
            <span class="co-future-badge">Planned</span>
          </div>
        `).join('')}
      </div>
    </div>`;
  }

  function _buildServiceCard(s) {
    return `
    <div class="co-service-card co-reveal" data-category="${esc(s.category)}">
      <div class="co-service-card-top">
        <div class="co-service-icon">${icon(s.icon || 'shield')}</div>
        <div>
          <div class="co-service-category">${esc(s.category)}</div>
          <div class="co-service-title">${esc(s.title)}</div>
        </div>
      </div>
      <p class="co-service-tagline">${esc(s.tagline)}</p>
      <p class="co-service-desc">${esc(s.description)}</p>
      <div class="co-service-features">
        ${s.features.map(f => `<span class="co-feature-chip">${esc(f)}</span>`).join('')}
      </div>
      <div class="co-service-footer">
        <span class="co-service-pricing">${esc(s.pricing)}</span>
        <button class="btn btn-secondary btn-sm" onclick="window.NotificationManager && window.NotificationManager.info('${esc(s.title)}', 'Contact us to discuss this service in detail.')">
          Learn More
        </button>
      </div>
    </div>`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // INDUSTRIES SECTION
  // ══════════════════════════════════════════════════════════════════════════
  function _buildIndustries() {
    const d = D();
    return `
    <section class="co-section" id="co-industries">
      <div class="co-section-header co-reveal">
        <span class="co-eyebrow">Sectors We Protect</span>
        <h2 class="co-section-title">Industries</h2>
        <p class="co-section-desc">Every industry faces a unique threat landscape. Our services are tailored to the specific risks, regulations, and operational realities of each sector.</p>
      </div>

      <div class="co-industries-grid">
        ${d.industries.map(ind => `
          <div class="co-industry-card co-reveal">
            <div class="co-industry-header">
              <div class="co-industry-header-left">
                <div class="co-industry-icon">${icon(ind.icon || 'shield')}</div>
                <div class="co-industry-title">${esc(ind.title)}</div>
              </div>
              <span class="co-risk-badge ${ind.riskLevel}">
                ${esc(ind.riskLevel.charAt(0).toUpperCase() + ind.riskLevel.slice(1))} Risk
              </span>
            </div>
            <p class="co-industry-summary">${esc(ind.summary)}</p>
            <div class="co-industry-threats">
              <div class="co-industry-threats-label">Key Threats</div>
              ${ind.threats.map(t => `<span class="co-threat-pill">${esc(t)}</span>`).join('')}
            </div>
            <div class="co-industry-services">
              <div class="co-industry-services-label">Recommended Services</div>
              ${ind.recommendedServices.map(s => `
                <span class="co-industry-service-link"
                      onclick="document.getElementById('co-services').scrollIntoView({behavior:'smooth'})">${esc(s)}</span>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </section>`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SECURITY SOLUTIONS SECTION
  // ══════════════════════════════════════════════════════════════════════════
  function _buildSolutions() {
    const d = D();
    return `
    <section class="co-section co-section-alt" id="co-solutions">
      <div class="co-section-header co-reveal">
        <span class="co-eyebrow">Integrated Defences</span>
        <h2 class="co-section-title">Security Solutions</h2>
        <p class="co-section-desc">Purpose-built security capabilities that work together to protect every layer of your organisation.</p>
      </div>

      <div class="co-solutions-grid">
        ${d.solutions.map(s => `
          <div class="co-solution-card co-reveal">
            <div class="co-solution-icon">${icon(s.icon || 'shield')}</div>
            <div class="co-solution-title">${esc(s.title)}</div>
            <p class="co-solution-desc">${esc(s.desc)}</p>
            <ul class="co-solution-features">
              ${s.features.map(f => `<li>${esc(f)}</li>`).join('')}
            </ul>
          </div>
        `).join('')}
      </div>
    </section>`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TECHNOLOGIES SECTION
  // ══════════════════════════════════════════════════════════════════════════
  function _buildTechnologies() {
    const d = D();
    return `
    <section class="co-section" id="co-technologies">
      <div class="co-section-header co-reveal">
        <span class="co-eyebrow">Platforms & Tools</span>
        <h2 class="co-section-title">Technologies We Support</h2>
        <p class="co-section-desc">Security expertise across the leading platforms, tools, and cloud environments.</p>
      </div>

      <div class="co-tech-disclaimer co-reveal">
        ${icon('info')}
        <span>${esc(d.techDisclaimer)}</span>
      </div>

      <div class="co-filter-bar" id="co-tech-filters">
        ${d.techCategories.map(cat => `
          <button class="co-filter-btn${cat === 'All' ? ' active' : ''}" data-tech-category="${esc(cat)}">${esc(cat)}</button>
        `).join('')}
      </div>

      <div class="co-tech-grid" id="co-tech-grid">
        ${d.technologies.map(t => _buildTechCard(t)).join('')}
      </div>
    </section>`;
  }

  function _buildTechCard(t) {
    const abbr = t.name.split(/[\s&/]+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase().slice(0, 3);
    return `
    <div class="co-tech-card co-reveal" data-tech-category="${esc(t.category)}">
      <div class="co-tech-abbr">${esc(abbr)}</div>
      <div class="co-tech-info">
        <div class="co-tech-name" title="${esc(t.name)}">${esc(t.name)}</div>
        <div class="co-tech-category">${esc(t.category)}</div>
      </div>
      <span class="co-tech-level ${esc(t.level)}">${esc(t.level)}</span>
    </div>`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CTA SECTION
  // ══════════════════════════════════════════════════════════════════════════
  function _buildCTA() {
    const d = D();
    return `
    <div class="co-cta-section co-reveal">
      <h2 class="co-cta-title">Ready to Strengthen Your Security Posture?</h2>
      <p class="co-cta-desc">Get in touch to discuss how Khan Security Solutions can protect your organisation. Every engagement starts with a free initial consultation.</p>
      <div class="co-cta-actions">
        <button class="btn btn-primary btn-lg" onclick="window.Router.navigate('portfolio')">
          ${icon('docs')} View Our Portfolio
        </button>
        <button class="btn btn-secondary btn-lg" onclick="window.Router.navigate('dashboard')">
          ${icon('monitor')} Launch Workbench
        </button>
      </div>
    </div>`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // INTERACTIONS
  // ══════════════════════════════════════════════════════════════════════════
  function _wireInteractions() {
    _wireSubNav();
    _wireServiceFilter();
    _wireTechFilter();
  }

  function _wireSubNav() {
    const links = document.querySelectorAll('.co-subnav-link');
    const mainRegion = document.querySelector('.main-region');

    links.forEach(link => {
      link.addEventListener('click', () => {
        const target = document.getElementById(link.dataset.target);
        if (!target || !mainRegion) return;
        const offset = 48;
        mainRegion.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
      });
    });

    // Update active link on scroll
    const sections = ['co-home', 'co-about', 'co-services', 'co-industries', 'co-solutions', 'co-technologies'];
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          links.forEach(l => l.classList.toggle('active', l.dataset.target === id));
        }
      });
    }, { root: mainRegion, threshold: 0.25, rootMargin: '-80px 0px -60% 0px' });

    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) navObserver.observe(el);
    });
  }

  function _wireServiceFilter() {
    const filterBar = document.getElementById('co-service-filters');
    const grid = document.getElementById('co-services-grid');
    if (!filterBar || !grid) return;

    filterBar.addEventListener('click', e => {
      const btn = e.target.closest('.co-filter-btn');
      if (!btn) return;

      const cat = btn.dataset.category;
      activeServiceFilter = cat;

      filterBar.querySelectorAll('.co-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      grid.querySelectorAll('.co-service-card').forEach(card => {
        const matches = cat === 'All' || card.dataset.category === cat;
        card.style.display = matches ? '' : 'none';
      });
    });
  }

  function _wireTechFilter() {
    const filterBar = document.getElementById('co-tech-filters');
    const grid = document.getElementById('co-tech-grid');
    if (!filterBar || !grid) return;

    filterBar.addEventListener('click', e => {
      const btn = e.target.closest('.co-filter-btn');
      if (!btn) return;

      const cat = btn.dataset.techCategory;
      activeTechFilter = cat;

      filterBar.querySelectorAll('.co-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      grid.querySelectorAll('.co-tech-card').forEach(card => {
        const matches = cat === 'All' || card.dataset.techCategory === cat;
        card.style.display = matches ? '' : 'none';
      });
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SCROLL REVEAL
  // ══════════════════════════════════════════════════════════════════════════
  function _setupScrollReveal() {
    if (revealObserver) revealObserver.disconnect();

    const mainRegion = document.querySelector('.main-region');
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { root: mainRegion, threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

    document.querySelectorAll('#page-company .co-reveal:not(.visible)').forEach(el => {
      revealObserver.observe(el);
    });

    // Timeline items
    const tlObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          tlObserver.unobserve(entry.target);
        }
      });
    }, { root: mainRegion, threshold: 0.2 });

    document.querySelectorAll('#page-company .co-timeline-item:not(.visible)').forEach(el => {
      tlObserver.observe(el);
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SIMULATED THREAT FEED
  // Clearly labeled as simulated/educational. Cycles through realistic-looking
  // threat event descriptions to demonstrate SOC monitoring concepts.
  // ══════════════════════════════════════════════════════════════════════════
  const _THREAT_EVENTS = [
    { type: 'CRITICAL', loc: 'Mumbai, IN',     msg: 'Ransomware C2 beacon detected',         cls: '' },
    { type: 'ALERT',    loc: 'London, UK',     msg: 'Spearphishing campaign identified',      cls: 'warn' },
    { type: 'INFO',     loc: 'Singapore, SG',  msg: 'IOC matched — blocked at perimeter',     cls: 'info' },
    { type: 'CRITICAL', loc: 'Frankfurt, DE',  msg: 'Lateral movement detected — SIEM alert', cls: '' },
    { type: 'ALERT',    loc: 'New York, US',   msg: 'BEC attempt — credential harvesting',    cls: 'warn' },
    { type: 'INFO',     loc: 'Tokyo, JP',      msg: 'Threat intelligence IOC updated',        cls: 'info' },
    { type: 'ALERT',    loc: 'Riyadh, SA',     msg: 'Brute-force SSH attempt blocked',        cls: 'warn' },
    { type: 'CRITICAL', loc: 'Toronto, CA',    msg: 'Malware hash matched — quarantined',     cls: '' },
    { type: 'INFO',     loc: 'Sydney, AU',     msg: 'MITRE ATT&CK TTP pattern flagged',       cls: 'info' },
    { type: 'ALERT',    loc: 'Paris, FR',      msg: 'Suspicious PowerShell execution',        cls: 'warn' },
  ];

  let _threatIndex = 3;

  function _startThreatFeed() {
    const feed = document.getElementById('co-threat-feed');
    if (!feed) return;

    threatFeedInterval = setInterval(() => {
      const el = document.getElementById('co-threat-feed');
      if (!el) { clearInterval(threatFeedInterval); return; }

      const ev = _THREAT_EVENTS[_threatIndex % _THREAT_EVENTS.length];
      _threatIndex++;

      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-GB', { hour12: false });

      const item = document.createElement('div');
      item.className = `co-threat-event ${ev.cls}`;
      item.innerHTML = `
        <span class="co-threat-event-type">${esc(ev.type)}</span>
        <span class="co-threat-event-loc">${esc(ev.loc)}</span>
        <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(ev.msg)}</span>
        <span style="color:var(--text-disabled);font-size:10px;flex-shrink:0;">${timeStr}</span>
      `;

      el.insertBefore(item, el.firstChild);

      // Keep max 4 events visible
      while (el.children.length > 4) el.removeChild(el.lastChild);
    }, 3200);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SEARCH REGISTRATION
  // ══════════════════════════════════════════════════════════════════════════
  function _registerSearchContent() {
    if (!window.SearchEngine) return;
    const d = D();

    const items = [
      { title: 'Company Overview', meta: 'Khan Security Solutions — Who we are', route: 'company', keywords: 'company about kss khan security' },
      { title: 'Our Mission',      meta: d.brand.mission, route: 'company', keywords: 'mission vision values' },
      { title: 'Services',         meta: 'All cybersecurity services', route: 'company', keywords: 'services consulting soc mdr forensics' },
      { title: 'Industries',       meta: 'Sectors we protect', route: 'company', keywords: 'industries healthcare finance education government' },
      { title: 'Security Solutions', meta: 'Integrated defence capabilities', route: 'company', keywords: 'solutions soc cloud identity endpoint' },
      { title: 'Technologies',     meta: 'Supported platforms and tools', route: 'company', keywords: 'technologies splunk sentinel azure crowdstrike' },
    ];

    d.services.forEach(s => {
      items.push({ title: s.title, meta: `${s.category} · Service`, route: 'company', keywords: `service ${s.title} ${s.category} ${s.features.join(' ')}` });
    });

    d.industries.forEach(ind => {
      items.push({ title: ind.title, meta: `${ind.riskLevel} risk industry`, route: 'company', keywords: `industry ${ind.title} ${ind.threats.join(' ')}` });
    });

    if (d.futureServices) {
      d.futureServices.forEach(fs => {
        items.push({ title: fs.title, meta: 'Future managed security service', route: 'company', keywords: `future managed service ${fs.title}` });
      });
    }

    window.SearchEngine.register('Company', items);
  }

  // ── Public API ──────────────────────────────────────────────────────────
  return { register };

})();

window.CompanyModule = CompanyModule;

// Auto-register on script load (matches portfolio.js pattern exactly)
if (window.Router) {
  CompanyModule.register();
} else {
  console.error('[Company] Router not found. Ensure router.js loads before company.js.');
}
