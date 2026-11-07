/**
 * KHAN SECURITY SOLUTIONS ENTERPRISE
 * Notification Manager
 *
 * Single system for all application notifications.
 * Provides: toast popups, notification panel entries, badge counts.
 * Every module uses NotificationManager.show() — no duplicates.
 */

const NotificationManager = (() => {

  // ── Configuration ─────────────────────────────────────────────────────────
  const TOAST_DURATION = 4500;   // ms before auto-dismiss
  const MAX_TOAST_STACK = 4;     // max toasts visible at once
  const MAX_PANEL_ITEMS = 100;   // max stored notifications

  // ── State ─────────────────────────────────────────────────────────────────
  let notifications = [];  // Full history (panel)
  let unreadCount   = 0;
  let toastQueue    = [];  // Active toasts
  let panelOpen     = false;

  // ── DOM References (resolved after DOMContentLoaded) ──────────────────────
  let toastContainer   = null;
  let notificationList = null;
  let badgeEl          = null;
  let panelEl          = null;

  // ── Icon SVGs per type ─────────────────────────────────────────────────────
  const ICONS = {
    success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>`,
    warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.07 16.5c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>`,
    danger:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>`,
    info:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>`,
    critical:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>`,
  };

  const ICON_COLORS = {
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    danger:  'var(--color-danger)',
    info:    'var(--color-info)',
    critical:'var(--color-danger)',
  };

  // ── Core: Show Notification ────────────────────────────────────────────────

  /**
   * Show a notification.
   * @param {object} options
   * @param {string} options.type      – 'success' | 'warning' | 'danger' | 'info' | 'critical'
   * @param {string} options.title     – Short notification title
   * @param {string} options.message   – Longer description (optional)
   * @param {number} options.duration  – Override auto-dismiss delay (ms)
   * @param {boolean} options.persist  – If true, toast won't auto-dismiss
   * @param {string} options.source    – Module that generated this (e.g. "SIEM")
   * @param {function} options.action  – Optional callback for click action
   */
  function show({ type = 'info', title, message = '', duration, persist = false, source = '', action = null }) {
    const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const timestamp = new Date();

    // Record in history
    const entry = { id, type, title, message, source, timestamp, read: false, action };
    notifications.unshift(entry);
    if (notifications.length > MAX_PANEL_ITEMS) {
      notifications.pop();
    }

    // Persist to IndexedDB (fire and forget)
    if (window.StorageManager?.isReady) {
      StorageManager.put('notifications', {
        id, type, title, message, source,
        timestamp: timestamp.toISOString(),
        read: false
      }).catch(() => {});
    }

    // Update badge
    unreadCount++;
    _updateBadge();

    // Update panel if open
    _renderPanel();

    // Show toast
    _showToast({ id, type, title, message, duration: persist ? 0 : (duration ?? TOAST_DURATION), action });

    return id;
  }

  // ── Convenience Methods ────────────────────────────────────────────────────

  const success  = (title, message, opts = {}) => show({ type: 'success',  title, message, ...opts });
  const warning  = (title, message, opts = {}) => show({ type: 'warning',  title, message, ...opts });
  const error    = (title, message, opts = {}) => show({ type: 'danger',   title, message, ...opts });
  const info     = (title, message, opts = {}) => show({ type: 'info',     title, message, ...opts });
  const critical = (title, message, opts = {}) => show({ type: 'critical', title, message, persist: true, ...opts });

  // ── Toast Display ──────────────────────────────────────────────────────────

  function _showToast({ id, type, title, message, duration, action }) {
    if (!toastContainer) return;

    // Limit stack
    const existing = toastContainer.querySelectorAll('.toast');
    if (existing.length >= MAX_TOAST_STACK) {
      _dismissToast(existing[0]);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.id = `toast_${id}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', type === 'critical' ? 'assertive' : 'polite');

    toast.innerHTML = `
      <div class="toast-icon" style="color: ${ICON_COLORS[type] || 'var(--color-info)'}">
        ${ICONS[type] || ICONS.info}
      </div>
      <div class="toast-content">
        <div class="toast-title">${_escape(title)}</div>
        ${message ? `<div class="toast-message">${_escape(message)}</div>` : ''}
      </div>
      <button class="toast-close" aria-label="Dismiss notification">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    `;

    if (action) {
      toast.style.cursor = 'pointer';
      toast.addEventListener('click', (e) => {
        if (!e.target.closest('.toast-close')) action();
      });
    }

    toast.querySelector('.toast-close').addEventListener('click', (e) => {
      e.stopPropagation();
      _dismissToast(toast);
    });

    toastContainer.appendChild(toast);

    // Auto dismiss
    if (duration > 0) {
      setTimeout(() => _dismissToast(toast), duration);
    }

    return toast;
  }

  function _dismissToast(toast) {
    if (!toast || toast.classList.contains('exiting')) return;
    toast.classList.add('exiting');
    setTimeout(() => toast.remove(), 300);
  }

  // ── Panel Operations ───────────────────────────────────────────────────────

  function openPanel() {
    panelOpen = true;
    if (panelEl) panelEl.classList.add('open');
    markAllRead();
  }

  function closePanel() {
    panelOpen = false;
    if (panelEl) panelEl.classList.remove('open');
  }

  function togglePanel() {
    panelOpen ? closePanel() : openPanel();
  }

  function markAllRead() {
    notifications.forEach(n => { n.read = true; });
    unreadCount = 0;
    _updateBadge();
    _renderPanel();
  }

  function clearAll() {
    notifications = [];
    unreadCount = 0;
    _updateBadge();
    _renderPanel();
    StorageManager.clear('notifications').catch(() => {});
  }

  function _updateBadge() {
    if (!badgeEl) return;
    if (unreadCount > 0) {
      badgeEl.textContent = unreadCount > 99 ? '99+' : unreadCount;
      badgeEl.style.display = '';
    } else {
      badgeEl.style.display = 'none';
    }
  }

  function _renderPanel() {
    if (!notificationList) return;

    if (notifications.length === 0) {
      notificationList.innerHTML = `
        <div class="empty-state" style="padding: var(--space-10) var(--space-4);">
          <div class="empty-state-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/>
            </svg>
          </div>
          <div class="empty-state-title">No notifications</div>
          <div class="empty-state-desc">Activity from all modules will appear here.</div>
        </div>`;
      return;
    }

    notificationList.innerHTML = notifications.slice(0, 50).map(n => `
      <div class="notification-item ${n.read ? '' : 'unread'}" data-id="${n.id}">
        <div class="notification-icon" style="background: ${_typeColor(n.type, 0.12)}; color: ${ICON_COLORS[n.type] || 'var(--color-info)'}">
          ${ICONS[n.type] || ICONS.info}
        </div>
        <div class="notification-content">
          <div class="notification-title">${_escape(n.title)}</div>
          ${n.message ? `<div class="notification-desc">${_escape(n.message)}</div>` : ''}
          <div class="notification-time">${_relativeTime(n.timestamp)}</div>
        </div>
      </div>
    `).join('');
  }

  // ── Init ───────────────────────────────────────────────────────────────────

  function init() {
    toastContainer = document.getElementById('toast-container');
    notificationList = document.getElementById('notification-list');
    badgeEl = document.getElementById('notification-badge');
    panelEl = document.getElementById('notification-panel');

    // Load from IndexedDB
    if (window.StorageManager?.isReady) {
      StorageManager.getAll('notifications').then(stored => {
        if (stored?.length) {
          notifications = stored.map(n => ({
            ...n,
            timestamp: new Date(n.timestamp)
          })).sort((a, b) => b.timestamp - a.timestamp);
          unreadCount = notifications.filter(n => !n.read).length;
          _updateBadge();
          _renderPanel();
        }
      }).catch(() => {});
    }

    // Wire up close-panel on backdrop click
    document.addEventListener('click', (e) => {
      if (panelEl && panelOpen && !panelEl.contains(e.target)) {
        const notifBtn = document.getElementById('notification-btn');
        if (!notifBtn?.contains(e.target)) closePanel();
      }
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  function _escape(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function _typeColor(type, alpha = 1) {
    const map = {
      success:  `rgba(16,185,129,${alpha})`,
      warning:  `rgba(245,158,11,${alpha})`,
      danger:   `rgba(239,68,68,${alpha})`,
      critical: `rgba(239,68,68,${alpha})`,
      info:     `rgba(6,182,212,${alpha})`,
    };
    return map[type] || `rgba(6,182,212,${alpha})`;
  }

  function _relativeTime(date) {
    if (!date) return '';
    const diff = Date.now() - new Date(date).getTime();
    const secs = Math.floor(diff / 1000);
    if (secs < 60)   return 'Just now';
    const mins = Math.floor(secs / 60);
    if (mins < 60)   return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)    return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  return {
    init,
    show,
    success, warning, error, info, critical,
    openPanel, closePanel, togglePanel,
    markAllRead, clearAll,
    get count()       { return notifications.length; },
    get unread()      { return unreadCount; },
    get history()     { return [...notifications]; },
  };

})();

window.NotificationManager = NotificationManager;
