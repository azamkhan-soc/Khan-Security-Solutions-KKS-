/**
 * KHAN SECURITY SOLUTIONS ENTERPRISE
 * Global Search Engine
 *
 * Modules register their searchable content.
 * One search queries everything. Triggered by Ctrl+K or '/'.
 */

const SearchEngine = (() => {

  // ── State ──────────────────────────────────────────────────────────────────
  const providers = new Map();   // category → [{ title, meta, route, params, keywords }]
  let isOpen = false;
  let activeIndex = -1;
  let currentQuery = '';

  // ── DOM Refs ───────────────────────────────────────────────────────────────
  let overlay = null;
  let input   = null;
  let results = null;

  // ── Provider Registration ──────────────────────────────────────────────────

  /**
   * Register a searchable data source.
   * @param {string} category  – Display label (e.g. "Navigation", "Incidents")
   * @param {Array}  items     – Array of { title, meta, route, params, keywords }
   *
   * Call this whenever data changes to keep search current.
   */
  function register(category, items) {
    providers.set(category, items.map(item => ({
      title:    item.title    || '',
      meta:     item.meta     || '',
      route:    item.route    || null,
      params:   item.params   || {},
      keywords: (item.keywords || item.title || '').toLowerCase(),
      icon:     item.icon     || null,
    })));
  }

  // ── Search Logic ───────────────────────────────────────────────────────────

  /**
   * Run a search query. Returns grouped results.
   */
  function search(query) {
    query = (query || '').trim().toLowerCase();
    if (!query) return [];

    const grouped = [];

    for (const [category, items] of providers) {
      const matches = items.filter(item =>
        item.keywords.includes(query) ||
        item.title.toLowerCase().includes(query) ||
        item.meta.toLowerCase().includes(query)
      );

      if (matches.length > 0) {
        grouped.push({ category, items: matches.slice(0, 6) });
      }
    }

    return grouped;
  }

  // ── Open / Close ───────────────────────────────────────────────────────────

  function open() {
    if (!overlay) return;
    isOpen = true;
    activeIndex = -1;
    overlay.classList.add('open');
    setTimeout(() => input?.focus(), 50);
    document.body.style.overflow = 'hidden';
  }

  function close() {
    if (!overlay) return;
    isOpen = false;
    overlay.classList.remove('open');
    if (input) input.value = '';
    if (results) results.innerHTML = '';
    currentQuery = '';
    document.body.style.overflow = '';
  }

  function toggle() {
    isOpen ? close() : open();
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  function _render(query) {
    if (!results) return;
    currentQuery = query;

    if (!query.trim()) {
      results.innerHTML = _renderRecentAndNav();
      _attachResultListeners();
      return;
    }

    const grouped = search(query);

    if (grouped.length === 0) {
      results.innerHTML = `
        <div class="empty-state" style="padding: var(--space-10) var(--space-4);">
          <div class="empty-state-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z"/>
            </svg>
          </div>
          <div class="empty-state-title" style="font-size: var(--text-base)">No results for "${_escape(query)}"</div>
          <div class="empty-state-desc">Try a different keyword or module name.</div>
        </div>`;
      return;
    }

    results.innerHTML = grouped.map(group => `
      <div class="search-result-section">
        <div class="search-result-section-label">${_escape(group.category)}</div>
        ${group.items.map(item => `
          <div class="search-result-item" data-route="${item.route || ''}" data-title="${_escape(item.title)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z"/>
            </svg>
            <div class="search-result-text">
              <div class="search-result-title">${_highlight(item.title, query)}</div>
              ${item.meta ? `<div class="search-result-meta">${_escape(item.meta)}</div>` : ''}
            </div>
            ${item.route ? `
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--text-tertiary)">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
              </svg>` : ''}
          </div>
        `).join('')}
      </div>
    `).join('');

    _attachResultListeners();
  }

  function _renderRecentAndNav() {
    // Navigation shortcuts shown when search is empty
    const navItems = providers.get('Navigation') || [];
    if (navItems.length === 0) return '<div style="padding: var(--space-8); text-align: center; color: var(--text-tertiary); font-size: var(--text-sm);">Start typing to search…</div>';

    return `
      <div class="search-result-section">
        <div class="search-result-section-label">Quick Navigation</div>
        ${navItems.slice(0, 8).map(item => `
          <div class="search-result-item" data-route="${item.route || ''}" data-title="${_escape(item.title)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zm0 9.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zm9.75-9.75A2.25 2.25 0 0115.75 3.75H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zm0 9.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/>
            </svg>
            <div class="search-result-text">
              <div class="search-result-title">${_escape(item.title)}</div>
              ${item.meta ? `<div class="search-result-meta">${_escape(item.meta)}</div>` : ''}
            </div>
          </div>
        `).join('')}
      </div>`;
  }

  function _attachResultListeners() {
    results?.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const route = item.dataset.route;
        if (route) {
          Router.navigate(route);
          close();
        }
      });
    });
  }

  // ── Keyboard Navigation ────────────────────────────────────────────────────

  function _handleKeydown(e) {
    if (!isOpen) return;

    const items = results?.querySelectorAll('.search-result-item') || [];

    switch (e.key) {
      case 'Escape':
        close();
        break;
      case 'ArrowDown':
        e.preventDefault();
        activeIndex = Math.min(activeIndex + 1, items.length - 1);
        _updateFocus(items);
        break;
      case 'ArrowUp':
        e.preventDefault();
        activeIndex = Math.max(activeIndex - 1, -1);
        _updateFocus(items);
        break;
      case 'Enter':
        if (activeIndex >= 0 && items[activeIndex]) {
          items[activeIndex].click();
        }
        break;
    }
  }

  function _updateFocus(items) {
    items.forEach((el, i) => el.classList.toggle('focused', i === activeIndex));
    if (activeIndex >= 0 && items[activeIndex]) {
      items[activeIndex].scrollIntoView({ block: 'nearest' });
    }
  }

  // ── Init ───────────────────────────────────────────────────────────────────

  function init() {
    overlay = document.getElementById('search-overlay');
    input   = document.getElementById('search-panel-input');
    results = document.getElementById('search-panel-results');

    if (!overlay || !input) return;

    // Input handler – debounced
    let debounceTimer;
    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => _render(input.value), 120);
    });

    // Keyboard handler
    document.addEventListener('keydown', (e) => {
      // Global open shortcut: Ctrl+K or /
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
        return;
      }
      _handleKeydown(e);
    });

    // Close on overlay click (not panel click)
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    // Close button
    document.getElementById('search-close-btn')?.addEventListener('click', close);

    // Register navigation routes as default search items
    _registerNavItems();
  }

  /** Pre-register all navigation items for instant navigation via search */
  function _registerNavItems() {
    register('Navigation', [
      { title: 'Dashboard',            meta: 'SOC Overview & metrics',          route: 'dashboard',          keywords: 'home overview soc main' },
      { title: 'Portfolio',            meta: 'Professional cybersecurity portfolio', route: 'portfolio',     keywords: 'resume skills projects about' },
      { title: 'Company',              meta: 'Khan Security Solutions website',  route: 'company',           keywords: 'about services team contact' },
      { title: 'SIEM Log Analyzer',    meta: 'Parse and investigate security logs', route: 'siem',          keywords: 'logs siem events windows linux' },
      { title: 'Malware Analysis',     meta: 'Static file analysis sandbox',    route: 'malware',           keywords: 'malware analysis sandbox hash file' },
      { title: 'Threat Intelligence',  meta: 'IOC lookup and threat feeds',     route: 'threat-intel',      keywords: 'ioc threat intelligence feed' },
      { title: 'Network Tools',        meta: 'IP lookup, port scanner, WHOIS',  route: 'network-tools',     keywords: 'network ip port scan whois dns' },
      { title: 'DFIR Toolkit',         meta: 'Digital forensics & incident response', route: 'dfir',        keywords: 'forensics dfir incident evidence' },
      { title: 'Vulnerability Manager', meta: 'CVE tracking and risk scoring',  route: 'vuln-manager',      keywords: 'vulnerability cve cvss risk patch' },
      { title: 'Asset Inventory',      meta: 'Managed devices and endpoints',   route: 'asset-inventory',   keywords: 'assets devices endpoints inventory' },
      { title: 'Incident Response',    meta: 'IR workflow and playbooks',       route: 'incident-response', keywords: 'incident response playbook ir' },
      { title: 'Phishing Analyzer',    meta: 'Email and URL phishing analysis', route: 'phishing',          keywords: 'phishing email url analysis header' },
      { title: 'IOC Manager',          meta: 'Manage indicators of compromise', route: 'ioc-manager',       keywords: 'ioc hash ip domain indicator' },
      { title: 'Case Manager',         meta: 'Investigation case tracking',     route: 'case-manager',      keywords: 'case investigation ticket tracking' },
      { title: 'Password Tools',       meta: 'Password strength and analysis',  route: 'password-tools',    keywords: 'password strength entropy hash crack' },
      { title: 'Reports',              meta: 'Generate and export reports',     route: 'reports',           keywords: 'report export pdf csv generate' },
      { title: 'Settings',             meta: 'Theme, preferences, backup',      route: 'settings',          keywords: 'settings theme dark light preferences' },
      { title: 'Help Center',          meta: 'Documentation and tutorials',     route: 'help',              keywords: 'help docs tutorial keyboard shortcuts' },
    ]);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  function _escape(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }

  function _highlight(text, query) {
    if (!query) return _escape(text);
    const escaped = _escape(text);
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return escaped.replace(new RegExp(`(${escapedQuery})`, 'gi'),
      '<mark style="background:var(--color-primary-glow);color:var(--color-primary-light);border-radius:2px;padding:0 2px">$1</mark>');
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  return {
    init,
    register,
    search,
    open, close, toggle,
    get isOpen() { return isOpen; },
  };

})();

window.SearchEngine = SearchEngine;
