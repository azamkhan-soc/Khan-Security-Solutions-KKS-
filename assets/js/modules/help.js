/**
 * KHAN SECURITY SOLUTIONS ENTERPRISE
 * Enterprise Help Center & Documentation — Module v1.7.0 (Milestone 17)
 *
 * Offline documentation hub: section overview, Quick Start onboarding
 * checklist, a Documentation reader (reading time, difficulty, category,
 * related articles, code examples, best practices, bookmarks), a 100+
 * item searchable FAQ accordion, step-by-step Tutorials, labeled Video
 * placeholders, a Keyboard Shortcuts reference, a Changelog/Roadmap
 * timeline, and an About panel.
 *
 * [EDUCATIONAL SIMULATION — all content describes this offline portfolio
 *  project itself. Video cards are clearly labeled placeholders; nothing
 *  plays. There is no backend — bookmarks and Quick Start progress persist
 *  locally via StorageManager only.]
 *
 * Integrates with:
 *   window.Router               — route: 'help'
 *   window.SearchEngine         — searchable articles & FAQs
 *   window.NotificationManager  — alerts and feedback
 *   window.StorageManager       — bookmark & onboarding-progress persistence
 *   window.SampleHelpData       — bundled documentation dataset
 */

const HelpCenter = (() => {

  // ── State ──────────────────────────────────────────────────────────────
  let mounted = false;
  let activeTab = 'overview';

  let bookmarks = [];             // article ids
  let qsDone = [];                // quick-start step ids completed

  let docsCategory = 'all';
  let activeArticleId = null;

  const faqFilters = { q: '', cat: 'all' };
  let openFaqIds = new Set();

  let openTutorialId = null;

  // ── Icons ──────────────────────────────────────────────────────────────
  const I = {
    flag: `<path stroke-linecap="round" stroke-linejoin="round" d="M3 3v18M3 4.5c2.5-1.333 5-1.333 7.5 0s5 1.333 7.5 0V13.5c-2.5 1.333-5 1.333-7.5 0s-5-1.333-7.5 0V4.5z"/>`,
    globe: `<path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"/>`,
    compass: `<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>`,
    shield: `<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>`,
    server: `<path stroke-linecap="round" stroke-linejoin="round" d="M21.75 17.25v-.228a4.5 4.5 0 00-.12-1.03l-2.268-9.64a3.375 3.375 0 00-3.285-2.602H7.923a3.375 3.375 0 00-3.285 2.602l-2.268 9.64a4.5 4.5 0 00-.12 1.03v.228m19.5 0a3 3 0 01-3 3H5.25a3 3 0 01-3-3m19.5 0a3 3 0 00-3-3H5.25a3 3 0 00-3 3m16.5 0h.008v.008h-.008v-.008zm-3 0h.008v.008h-.008v-.008z"/>`,
    bug: `<path stroke-linecap="round" stroke-linejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"/>`,
    target: `<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m0 13.5V21m9-9h-2.25m-13.5 0H3m14.485-6.364l-1.591 1.591M6.227 17.773l-1.591 1.591m0-12.728l1.591 1.591m11.546 11.546l1.591 1.591M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"/>`,
    network: `<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75a3 3 0 116 0 3 3 0 01-6 0zM3.75 17.25a3 3 0 116 0 3 3 0 01-6 0zm12 0a3 3 0 116 0 3 3 0 01-6 0zM12 9.75v3m0 0l-4.5 3m4.5-3l4.5 3"/>`,
    search: `<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z"/>`,
    hash: `<path stroke-linecap="round" stroke-linejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5"/>`,
    folder: `<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 015.25 3.75h4.5l2.25 2.25h6.75a2.25 2.25 0 012.25 2.25v1.526"/>`,
    key: `<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"/>`,
    report: `<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"/>`,
    settings: `<path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>`,
    sparkle: `<path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"/>`,
    briefcase: `<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18a48.55 48.55 0 01-12.756 0C4.537 20.436 3.75 19.494 3.75 18.4v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.02-.388.04-.583.06m-16.5-8.006c0-1.081.768-2.015 1.837-2.175a48.114 48.114 0 013.413-.387m0 0V4.5c0-1.036.84-1.875 1.875-1.875h1.5c1.035 0 1.875.84 1.875 1.875v.166m-4.5 0c1.496-.099 3.004-.099 4.5 0"/>`,
    book: `<path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/>`,
    question: `<path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 17.25h.008v.008H12v-.008z"/>`,
    list: `<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>`,
    play: `<path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"/>`,
    keyboard: `<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25A2.25 2.25 0 014.5 6h15a2.25 2.25 0 012.25 2.25v7.5A2.25 2.25 0 0119.5 18h-15a2.25 2.25 0 01-2.25-2.25v-7.5zM6 9.75h.008v.008H6V9.75zm3 0h.008v.008H9V9.75zm3 0h.008v.008H12V9.75zm3 0h.008v.008H15V9.75zm3 0h.008v.008H18V9.75zM6 12.75h.008v.008H6v-.008zm3 0h.008v.008H9v-.008zm3 0h.008v.008H12v-.008zm3 0h.008v.008H15v-.008zm3 0h.008v.008H18v-.008zM7.5 15.75h9v.008h-9v-.008z"/>`,
    clock: `<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>`,
    info: `<path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/>`,
    star: `<path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 21.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/>`,
    chevDown: `<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>`,
    chevLeft: `<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/>`,
    close: `<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>`,
    down: `<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>`,
    check: `<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>`,
  };
  function svg(name, cls = '') { return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">${I[name] || I.question}</svg>`; }
  function esc(s) { const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function _truncate(s, n) { s = String(s); return s.length > n ? s.slice(0, n - 1) + '…' : s; }

  const HD = () => window.SampleHelpData || { SECTIONS: [], ARTICLES: [], FAQS: [], TUTORIALS: [], VIDEOS: [], SHORTCUTS: {}, CHANGELOG: [], ROADMAP: [], ABOUT: {} };

  const QUICK_START_STEPS = [
    { id: 'welcome', title: 'Welcome Tour', desc: 'Get an overview of what this platform is and how it\'s organized.' },
    { id: 'platform-tour', title: 'Platform Tour', desc: 'See how the SOC, SIEM, DFIR, and other modules connect.' },
    { id: 'navigation', title: 'Navigation', desc: 'Learn the sidebar, top bar, and breadcrumbs.' },
    { id: 'search', title: 'Search', desc: 'Try global search to jump straight to any record.' },
    { id: 'tips', title: 'Tips', desc: 'A few habits that make the platform faster to use.' },
  ];

  // ══════════════════════════════════════════════════════════════════════
  // REGISTRATION
  // ══════════════════════════════════════════════════════════════════════
  function register() { window.Router.register('help', { title: 'Help Center', init, render }); }

  function init() {
    _loadPersisted();
    _registerSearch();
  }

  function render() {
    const el = document.getElementById('page-help');
    if (!el) return;
    if (!mounted) {
      el.innerHTML = _buildShell();
      mounted = true;
      _wireAll();
      _renderSectionGrid();
      _renderQuickStart();
    } else {
      _renderQuickStart();
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  // PERSISTENCE
  // ══════════════════════════════════════════════════════════════════════
  function _loadPersisted() {
    bookmarks = window.StorageManager?.lsGet('hp_bookmarks', []) || [];
    qsDone = window.StorageManager?.lsGet('hp_quickstart_done', []) || [];
  }
  function _persist() {
    window.StorageManager?.lsSet('hp_bookmarks', bookmarks);
    window.StorageManager?.lsSet('hp_quickstart_done', qsDone);
  }

  function _registerSearch() {
    const items = [
      ...HD().ARTICLES.map(a => ({ title: a.title, meta: `Docs • ${_sectionLabel(a.sectionId)}`, route: 'help', keywords: `${a.title} ${a.body}`, icon: 'book' })),
      ...HD().FAQS.slice(0, 60).map(f => ({ title: f.q, meta: 'FAQ', route: 'help', keywords: `${f.q} ${f.a}`, icon: 'question' })),
    ];
    window.SearchEngine?.register('Help Center', items);
  }

  function _sectionLabel(id) { return (HD().SECTIONS.find(s => s.id === id) || {}).label || id; }
  function _section(id) { return HD().SECTIONS.find(s => s.id === id); }

  // ══════════════════════════════════════════════════════════════════════
  // SHELL
  // ══════════════════════════════════════════════════════════════════════
  function _buildShell() {
    return `
    <div class="hp-shell">
      <div class="hp-header">
        <div>
          <div class="hp-header-title">Enterprise Help Center</div>
          <div class="hp-header-sub">Documentation, tutorials and platform guidance.</div>
        </div>
        <div class="hp-header-actions">
          <button class="btn btn-primary btn-sm" id="hp-btn-search-docs">${svg('search')} Search Docs</button>
          <button class="btn btn-secondary btn-sm" id="hp-btn-quickstart">${svg('flag')} Quick Start</button>
          <button class="btn btn-secondary btn-sm" id="hp-btn-faq">${svg('question')} FAQ</button>
          <button class="btn btn-ghost btn-sm" id="hp-btn-download-guide">${svg('down')} Download Guide</button>
        </div>
      </div>

      <div class="hp-tabs" role="tablist">
        <div class="hp-tab active" data-tab="overview" role="tab">${svg('compass')} Overview</div>
        <div class="hp-tab" data-tab="docs" role="tab">${svg('book')} Documentation</div>
        <div class="hp-tab" data-tab="faq" role="tab">${svg('question')} FAQ</div>
        <div class="hp-tab" data-tab="tutorials" role="tab">${svg('list')} Tutorials</div>
        <div class="hp-tab" data-tab="videos" role="tab">${svg('play')} Videos</div>
        <div class="hp-tab" data-tab="shortcuts" role="tab">${svg('keyboard')} Shortcuts</div>
        <div class="hp-tab" data-tab="changelog" role="tab">${svg('clock')} Changelog</div>
        <div class="hp-tab" data-tab="about" role="tab">${svg('info')} About</div>
      </div>

      <div class="hp-body">
        <div class="hp-view active" id="hp-view-overview">${_buildOverviewView()}</div>
        <div class="hp-view" id="hp-view-docs">${_buildDocsView()}</div>
        <div class="hp-view" id="hp-view-faq">${_buildFaqView()}</div>
        <div class="hp-view" id="hp-view-tutorials">${_buildTutorialsView()}</div>
        <div class="hp-view" id="hp-view-videos">${_buildVideosView()}</div>
        <div class="hp-view" id="hp-view-shortcuts">${_buildShortcutsView()}</div>
        <div class="hp-view" id="hp-view-changelog">${_buildChangelogView()}</div>
        <div class="hp-view" id="hp-view-about">${_buildAboutView()}</div>
      </div>
    </div>
    `;
  }

  function _wireAll() {
    document.querySelectorAll('#page-help .hp-tab').forEach(t => t.addEventListener('click', () => _switchTab(t.dataset.tab)));
    document.getElementById('hp-btn-search-docs')?.addEventListener('click', () => { _switchTab('docs'); document.getElementById('hp-docs-search')?.focus(); });
    document.getElementById('hp-btn-quickstart')?.addEventListener('click', () => { _switchTab('overview'); document.getElementById('hp-quickstart-anchor')?.scrollIntoView({ behavior: 'smooth' }); });
    document.getElementById('hp-btn-faq')?.addEventListener('click', () => _switchTab('faq'));
    document.getElementById('hp-btn-download-guide')?.addEventListener('click', _downloadGuide);
    _wireDocs();
    _wireFaq();
    _wireTutorials();
    _wireChangelog();
  }

  function _switchTab(tabId) {
    activeTab = tabId;
    document.querySelectorAll('#page-help .hp-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
    document.querySelectorAll('#page-help .hp-view').forEach(v => v.classList.toggle('active', v.id === `hp-view-${tabId}`));
    if (tabId === 'overview') _renderQuickStart();
    if (tabId === 'docs') _renderDocs();
    if (tabId === 'faq') _renderFaqList();
  }

  // ══════════════════════════════════════════════════════════════════════
  // OVERVIEW
  // ══════════════════════════════════════════════════════════════════════
  function _buildOverviewView() {
    return `
      <div class="card hp-glass" id="hp-quickstart-anchor">
        <div class="rp-chart-title" style="display:flex;justify-content:space-between">Quick Start <small id="hp-qs-progress"></small></div>
        <div class="hp-qs-list" id="hp-qs-list"></div>
      </div>
      <div class="card hp-glass" style="margin-top:var(--space-4)">
        <div class="rp-chart-title">Browse by Section</div>
        <div class="hp-sec-grid" id="hp-sec-grid"></div>
      </div>
    `;
  }

  function _renderQuickStart() {
    const list = document.getElementById('hp-qs-list'); if (!list) return;
    list.innerHTML = QUICK_START_STEPS.map((s, i) => {
      const done = qsDone.includes(s.id);
      return `<div class="hp-qs-item ${done ? 'done' : ''}" data-step="${s.id}">
        <div class="hp-qs-num">${done ? '✓' : i + 1}</div>
        <div style="flex:1">
          <div class="hp-qs-title">${esc(s.title)}</div>
          <div class="hp-qs-desc">${esc(s.desc)}</div>
        </div>
      </div>`;
    }).join('');
    document.getElementById('hp-qs-progress').textContent = `${qsDone.length} / ${QUICK_START_STEPS.length} complete`;
    list.querySelectorAll('.hp-qs-item').forEach(item => item.addEventListener('click', () => {
      const id = item.dataset.step;
      if (qsDone.includes(id)) qsDone = qsDone.filter(x => x !== id); else qsDone.push(id);
      _persist();
      _renderQuickStart();
    }));
  }

  function _renderSectionGrid() {
    const el = document.getElementById('hp-sec-grid'); if (!el) return;
    el.innerHTML = HD().SECTIONS.map(s => `
      <div class="card hp-sec-card" data-sec="${s.id}">
        <div class="hp-sec-icon" style="background:${s.color}22;color:${s.color}">${svg(s.icon)}</div>
        <div>
          <div class="hp-sec-name">${esc(s.label)} ${s.comingSoon ? '<span class="hp-soon-badge">Coming Soon</span>' : ''}</div>
          <div class="hp-sec-desc">${esc(s.summary)}</div>
        </div>
      </div>`).join('');
    el.querySelectorAll('.hp-sec-card').forEach(card => card.addEventListener('click', () => {
      docsCategory = card.dataset.sec; activeArticleId = null;
      _switchTab('docs');
    }));
  }

  // ══════════════════════════════════════════════════════════════════════
  // DOCUMENTATION
  // ══════════════════════════════════════════════════════════════════════
  function _buildDocsView() {
    return `
      <div class="hp-docs-layout">
        <div class="hp-docs-nav" id="hp-docs-nav"></div>
        <div id="hp-docs-main">
          <input type="text" class="form-input" id="hp-docs-search" placeholder="Search documentation…" style="max-width:280px;margin-bottom:var(--space-4)" />
          <div class="hp-article-list" id="hp-article-list"></div>
        </div>
      </div>
    `;
  }

  function _wireDocs() {
    document.getElementById('hp-docs-search')?.addEventListener('input', () => _renderDocs());
  }

  function _renderDocs() {
    const nav = document.getElementById('hp-docs-nav'); if (!nav) return;
    const counts = {};
    HD().ARTICLES.forEach(a => { counts[a.sectionId] = (counts[a.sectionId] || 0) + 1; });
    nav.innerHTML = [`<div class="hp-docs-nav-item ${docsCategory === 'all' ? 'active' : ''}" data-cat="all">All Articles <span class="hp-docs-nav-count">${HD().ARTICLES.length}</span></div>`,
      `<div class="hp-docs-nav-item ${docsCategory === 'bookmarks' ? 'active' : ''}" data-cat="bookmarks">${svg('star', 'hp-nav-star')} Bookmarks <span class="hp-docs-nav-count">${bookmarks.length}</span></div>`,
      ...HD().SECTIONS.filter(s => counts[s.id]).map(s => `<div class="hp-docs-nav-item ${docsCategory === s.id ? 'active' : ''}" data-cat="${s.id}">${esc(s.label)} <span class="hp-docs-nav-count">${counts[s.id] || 0}</span></div>`)
    ].join('');
    nav.querySelectorAll('.hp-docs-nav-item').forEach(item => item.addEventListener('click', () => { docsCategory = item.dataset.cat; activeArticleId = null; _renderDocs(); }));

    if (activeArticleId) { _renderReader(); return; }

    const q = (document.getElementById('hp-docs-search')?.value || '').toLowerCase();
    let list = HD().ARTICLES.filter(a => {
      if (docsCategory === 'bookmarks') return bookmarks.includes(a.id);
      if (docsCategory !== 'all' && a.sectionId !== docsCategory) return false;
      if (q && !(`${a.title} ${a.body}`.toLowerCase().includes(q))) return false;
      return true;
    });

    const main = document.getElementById('hp-docs-main');
    // rebuild search box + list without wiping input focus unnecessarily
    const listEl = document.getElementById('hp-article-list');
    if (!listEl) return;
    listEl.innerHTML = list.length ? list.map(a => `
      <div class="card hp-article-card" data-article="${a.id}">
        <div class="hp-article-title">${esc(a.title)} ${bookmarks.includes(a.id) ? svg('star', 'hp-bookmark-btn active') : ''}</div>
        <div class="hp-article-meta">
          <span>${svg('clock')} ${a.minutes} min read</span>
          <span><span class="badge badge-info">${esc(a.difficulty)}</span></span>
          <span>${esc(_sectionLabel(a.sectionId))}</span>
        </div>
      </div>`).join('') : `<div class="empty-state"><div class="empty-state-title">No articles found</div><div class="empty-state-desc">Try a different search term or section.</div></div>`;
    listEl.querySelectorAll('.hp-article-card').forEach(card => card.addEventListener('click', () => { activeArticleId = card.dataset.article; _renderDocs(); }));
  }

  function _renderReader() {
    const listBox = document.getElementById('hp-docs-main');
    const a = HD().ARTICLES.find(x => x.id === activeArticleId);
    if (!a) { activeArticleId = null; _renderDocs(); return; }
    const isBookmarked = bookmarks.includes(a.id);
    listBox.innerHTML = `
      <div class="hp-reader">
        <div class="hp-reader-back" id="hp-reader-back">${svg('chevLeft')} Back to articles</div>
        <div class="card hp-glass">
          <div class="hp-reader-head">
            <div>
              <div class="hp-reader-title">${esc(a.title)}</div>
              <div class="hp-article-meta" style="margin-top:8px">
                <span>${svg('clock')} ${a.minutes} min read</span>
                <span><span class="badge badge-info">${esc(a.difficulty)}</span></span>
                <span><span class="badge badge-neutral">${esc(_sectionLabel(a.sectionId))}</span></span>
              </div>
            </div>
            <div class="hp-bookmark-btn ${isBookmarked ? 'active' : ''}" id="hp-reader-bookmark" title="Bookmark">${svg('star')}</div>
          </div>
          <div class="hp-reader-body" style="margin-top:var(--space-4)">
            <p>${esc(a.body)}</p>
            ${a.code ? `<div class="hp-code-block">${esc(a.code)}</div>` : ''}
            ${a.practices.length ? `<strong style="font-size:var(--text-sm);color:var(--text-primary)">Best Practices</strong><ul class="hp-practices-list">${a.practices.map(p => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}
            ${a.related.length ? `<strong style="font-size:var(--text-sm);color:var(--text-primary);display:block;margin-top:var(--space-4)">Related Articles</strong><div class="hp-related-grid">${a.related.map(id => { const r = HD().ARTICLES.find(x => x.id === id); return r ? `<div class="hp-related-chip" data-article="${r.id}">${esc(r.title)}</div>` : ''; }).join('')}</div>` : ''}
          </div>
        </div>
      </div>`;
    document.getElementById('hp-reader-back')?.addEventListener('click', () => { activeArticleId = null; _renderDocs(); });
    document.getElementById('hp-reader-bookmark')?.addEventListener('click', () => {
      if (bookmarks.includes(a.id)) { bookmarks = bookmarks.filter(x => x !== a.id); window.NotificationManager?.info('Bookmark Removed', `"${a.title}" removed from bookmarks.`); }
      else { bookmarks.push(a.id); window.NotificationManager?.success('Bookmarked', `"${a.title}" added to bookmarks.`); }
      _persist(); _renderReader();
    });
    listBox.querySelectorAll('.hp-related-chip').forEach(chip => chip.addEventListener('click', () => { activeArticleId = chip.dataset.article; _renderReader(); }));
  }

  // ══════════════════════════════════════════════════════════════════════
  // FAQ
  // ══════════════════════════════════════════════════════════════════════
  function _buildFaqView() {
    return `
      <div class="hp-faq-toolbar">
        <input type="text" class="form-input" id="hp-faq-q" placeholder="Search FAQs…" />
        <select class="form-select" id="hp-faq-cat"><option value="all">All Categories</option>${HD().SECTIONS.map(s => `<option value="${s.id}">${esc(s.label)}</option>`).join('')}</select>
      </div>
      <div class="hp-faq-count" id="hp-faq-count"></div>
      <div id="hp-faq-list"></div>
    `;
  }

  function _wireFaq() {
    document.getElementById('hp-faq-q')?.addEventListener('input', e => { faqFilters.q = e.target.value; _renderFaqList(); });
    document.getElementById('hp-faq-cat')?.addEventListener('change', e => { faqFilters.cat = e.target.value; _renderFaqList(); });
  }

  function _renderFaqList() {
    const el = document.getElementById('hp-faq-list'); if (!el) return;
    const list = HD().FAQS.filter(f => {
      if (faqFilters.cat !== 'all' && f.cat !== faqFilters.cat) return false;
      if (faqFilters.q && !(`${f.q} ${f.a}`.toLowerCase().includes(faqFilters.q.toLowerCase()))) return false;
      return true;
    });
    document.getElementById('hp-faq-count').textContent = `${list.length} of ${HD().FAQS.length} FAQs`;
    el.innerHTML = list.length ? list.map(f => `
      <div class="hp-faq-item ${openFaqIds.has(f.id) ? 'open' : ''}" data-faq="${f.id}">
        <div class="hp-faq-q">${esc(f.q)} ${svg('chevDown', 'hp-faq-chevron')}</div>
        <div class="hp-faq-a">${esc(f.a)}</div>
      </div>`).join('') : `<div class="empty-state"><div class="empty-state-title">No FAQs found</div><div class="empty-state-desc">Try a different search term or category.</div></div>`;
    el.querySelectorAll('.hp-faq-q').forEach(q => q.addEventListener('click', () => {
      const item = q.closest('.hp-faq-item'); const id = item.dataset.faq;
      if (openFaqIds.has(id)) openFaqIds.delete(id); else openFaqIds.add(id);
      item.classList.toggle('open');
    }));
  }

  // ══════════════════════════════════════════════════════════════════════
  // TUTORIALS
  // ══════════════════════════════════════════════════════════════════════
  function _buildTutorialsView() {
    return `<div class="hp-tut-grid" id="hp-tut-grid"></div>`;
  }
  function _wireTutorials() {
    const grid = document.getElementById('hp-tut-grid'); if (!grid) return;
    grid.innerHTML = HD().TUTORIALS.map(t => `
      <div class="card hp-tut-card" data-tut="${t.id}">
        <div class="hp-article-title">${esc(t.title)}</div>
        <div class="hp-article-meta" style="margin-top:6px">
          <span>${svg('clock')} ${t.minutes} min</span>
          <span><span class="badge badge-info">${esc(t.difficulty)}</span></span>
        </div>
        <ol class="hp-tut-steps">${t.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
      </div>`).join('');
    grid.querySelectorAll('.hp-tut-card').forEach(card => card.addEventListener('click', () => card.classList.toggle('open')));
  }

  // ══════════════════════════════════════════════════════════════════════
  // VIDEOS
  // ══════════════════════════════════════════════════════════════════════
  function _buildVideosView() {
    return `
      <div class="demo-banner" style="margin-bottom:var(--space-4)"><span class="demo-banner-text">Video training is planned but not yet produced — these are labeled placeholders.</span></div>
      <div class="hp-video-grid">
        ${HD().VIDEOS.map(v => `
          <div class="card hp-video-card">
            <div class="hp-video-thumb">${svg('play')}<span class="hp-video-soon">Coming Soon</span></div>
            <div class="hp-video-body">
              <div class="hp-video-title">${esc(v.title)}</div>
              <div class="hp-video-meta">${esc(v.category)} • ${esc(v.duration)}</div>
            </div>
          </div>`).join('')}
      </div>`;
  }

  // ══════════════════════════════════════════════════════════════════════
  // SHORTCUTS
  // ══════════════════════════════════════════════════════════════════════
  function _buildShortcutsView() {
    const groups = HD().SHORTCUTS;
    return `<div class="hp-shortcut-grid">
      ${Object.entries(groups).map(([group, rows]) => `
        <div class="card hp-glass">
          <div class="hp-shortcut-group-title">${esc(group)}</div>
          ${rows.map(r => `<div class="hp-shortcut-row"><span>${esc(r.desc)}</span><div class="hp-kbd-group">${r.keys.map(k => `<span class="hp-kbd">${esc(k)}</span>`).join('')}</div></div>`).join('')}
        </div>`).join('')}
    </div>`;
  }

  // ══════════════════════════════════════════════════════════════════════
  // CHANGELOG
  // ══════════════════════════════════════════════════════════════════════
  function _buildChangelogView() {
    return `
      <div class="card hp-glass">
        <div class="rp-chart-title">Release History</div>
        <div class="hp-timeline" id="hp-changelog-list"></div>
      </div>
      <div class="card hp-glass" style="margin-top:var(--space-4)">
        <div class="rp-chart-title">Roadmap</div>
        <ul class="hp-roadmap-list" id="hp-roadmap-list"></ul>
      </div>
    `;
  }
  function _wireChangelog() {
    const list = document.getElementById('hp-changelog-list'); if (!list) return;
    list.innerHTML = HD().CHANGELOG.map(c => `
      <div class="hp-timeline-item">
        <div class="hp-timeline-dot"></div>
        <div class="hp-timeline-head">
          <span class="hp-timeline-title">v${esc(c.version)} — ${esc(c.title)}</span>
          <span class="badge badge-neutral">Milestone ${c.milestone}</span>
          <span class="hp-timeline-date">${esc(c.date)}</span>
        </div>
        <ul class="hp-timeline-notes">${c.notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul>
      </div>`).join('');
    const roadmap = document.getElementById('hp-roadmap-list'); if (!roadmap) return;
    roadmap.innerHTML = HD().ROADMAP.map(r => `<li>${esc(r)}</li>`).join('');
  }

  // ══════════════════════════════════════════════════════════════════════
  // ABOUT
  // ══════════════════════════════════════════════════════════════════════
  function _buildAboutView() {
    const a = HD().ABOUT;
    return `
      <div class="hp-about-grid">
        <div class="card hp-about-item"><div class="hp-about-label">Platform Version</div><div class="hp-about-value">v${esc(a.version)}</div></div>
        <div class="card hp-about-item"><div class="hp-about-label">Developer</div><div class="hp-about-value">${esc(a.developer)}</div></div>
        <div class="card hp-about-item"><div class="hp-about-label">Company</div><div class="hp-about-value">${esc(a.company)}</div></div>
        <div class="card hp-about-item"><div class="hp-about-label">License</div><div class="hp-about-value">${esc(a.license)}</div></div>
      </div>
      <div class="card hp-glass" style="margin-top:var(--space-4)">
        <div class="rp-chart-title">Credits</div>
        <ul class="hp-credits-list">${a.credits.map(c => `<li>${esc(c)}</li>`).join('')}</ul>
      </div>
    `;
  }

  // ══════════════════════════════════════════════════════════════════════
  // DOWNLOAD GUIDE
  // ══════════════════════════════════════════════════════════════════════
  function _downloadGuide() {
    const sections = HD().SECTIONS.map(s => `- ${s.label}${s.comingSoon ? ' (Coming Soon)' : ''}: ${s.summary}`).join('\n');
    const articles = HD().ARTICLES.map(a => `\n## ${a.title}\n(${a.minutes} min • ${a.difficulty} • ${_sectionLabel(a.sectionId)})\n${a.body}`).join('\n');
    const content = `KHAN SECURITY SOLUTIONS ENTERPRISE — OFFLINE GUIDE\nGenerated ${new Date().toLocaleString()}\n\nSECTIONS\n${sections}\n\nDOCUMENTATION\n${articles}\n`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const el = document.createElement('a');
    el.href = url; el.download = 'khan-security-solutions-guide.txt';
    document.body.appendChild(el); el.click(); document.body.removeChild(el);
    URL.revokeObjectURL(url);
    window.NotificationManager?.success('Guide Downloaded', 'The offline platform guide has been saved.');
  }

  // ── Public API ─────────────────────────────────────────────────────────
  return { register };

})();

window.HelpCenter = HelpCenter;

if (window.Router) {
  HelpCenter.register();
} else {
  console.error('[HelpCenter] Router not found. Ensure router.js loads before help.js.');
}
