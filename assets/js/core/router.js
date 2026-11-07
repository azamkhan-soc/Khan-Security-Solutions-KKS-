/**
 * KHAN SECURITY SOLUTIONS ENTERPRISE
 * SPA Router
 *
 * Hash-based client-side router. No server required.
 * Modules register routes; router handles transitions.
 */

const Router = (() => {

  // ── State ──────────────────────────────────────────────────────────────────
  const routes    = new Map();   // routeId → { title, init, render, cleanup }
  let currentRoute = null;
  let previousRoute = null;
  const listeners  = [];

  // ── Route Registration ─────────────────────────────────────────────────────

  /**
   * Register a route.
   * @param {string}   id       – Unique route identifier (matches page-view id and nav-item data-route)
   * @param {object}   config
   * @param {string}   config.title   – Page title suffix
   * @param {function} config.init    – Called once when route first loads (optional)
   * @param {function} config.render  – Called every time route is navigated to (optional)
   * @param {function} config.cleanup – Called when leaving the route (optional)
   */
  function register(id, config = {}) {
    routes.set(id, {
      title:   config.title   || id,
      init:    config.init    || null,
      render:  config.render  || null,
      cleanup: config.cleanup || null,
      initialised: false,
    });
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  /**
   * Navigate to a route.
   * @param {string} routeId
   * @param {object} params – Optional parameters passed to render()
   */
  async function navigate(routeId, params = {}) {
    const route = routes.get(routeId);

    if (!route) {
      console.warn(`[Router] Unknown route: "${routeId}"`);
      navigate('dashboard');  // fallback
      return;
    }

    // Run cleanup on previous route
    if (currentRoute) {
      const prev = routes.get(currentRoute);
      if (prev?.cleanup) {
        try { prev.cleanup(); } catch (e) { console.error('[Router] Cleanup error:', e); }
      }
      previousRoute = currentRoute;
    }

    currentRoute = routeId;

    // Update hash without triggering another navigation
    const expectedHash = `#${routeId}`;
    if (window.location.hash !== expectedHash) {
      history.replaceState(null, '', expectedHash);
    }

    // Hide all page views
    document.querySelectorAll('.page-view').forEach(el => el.classList.remove('active'));

    // Show the target page view
    const pageEl = document.getElementById(`page-${routeId}`);
    if (pageEl) {
      pageEl.classList.add('active');
    } else {
      console.warn(`[Router] No page element found: #page-${routeId}`);
    }

    // Update sidebar active state
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.route === routeId);
    });

    // Update breadcrumb
    _updateBreadcrumb(route.title);

    // Update page title
    document.title = `${route.title} | Khan Security Solutions`;

    // Init route (first visit only)
    if (!route.initialised && route.init) {
      try {
        await route.init();
        route.initialised = true;
      } catch (e) {
        console.error(`[Router] Init error for "${routeId}":`, e);
      }
    }

    // Render route
    if (route.render) {
      try {
        await route.render(params);
      } catch (e) {
        console.error(`[Router] Render error for "${routeId}":`, e);
      }
    }

    // Scroll to top
    const mainRegion = document.querySelector('.main-region');
    if (mainRegion) mainRegion.scrollTop = 0;

    // Notify listeners
    listeners.forEach(fn => fn(routeId, previousRoute, params));
  }

  /**
   * Go back to the previous route.
   */
  function back() {
    if (previousRoute) navigate(previousRoute);
    else navigate('dashboard');
  }

  // ── Hash Handling ──────────────────────────────────────────────────────────

  function _handleHash() {
    const hash = window.location.hash.replace('#', '').trim();
    const routeId = hash && routes.has(hash) ? hash : 'dashboard';
    navigate(routeId);
  }

  // ── Breadcrumb ─────────────────────────────────────────────────────────────

  function _updateBreadcrumb(title) {
    const bc = document.getElementById('breadcrumb');
    if (!bc) return;
    bc.innerHTML = `
      <span class="topbar-breadcrumb-item">KSS Enterprise</span>
      <span class="topbar-breadcrumb-sep">›</span>
      <span class="topbar-breadcrumb-item current">${_escape(title)}</span>
    `;
  }

  // ── Listeners ──────────────────────────────────────────────────────────────

  /** Register a callback fired on every navigation. fn(newRoute, prevRoute, params) */
  function onChange(fn) { listeners.push(fn); }

  // ── Init ───────────────────────────────────────────────────────────────────

  function init() {
    window.addEventListener('hashchange', _handleHash);
    _handleHash(); // Navigate to initial hash or dashboard
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  function _escape(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  return {
    register,
    navigate,
    back,
    onChange,
    init,
    get current()  { return currentRoute; },
    get previous() { return previousRoute; },
    get routes()   { return [...routes.keys()]; },
  };

})();

window.Router = Router;
