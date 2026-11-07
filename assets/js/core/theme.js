/**
 * KHAN SECURITY SOLUTIONS ENTERPRISE
 * Theme Engine
 *
 * Manages: theme switching, persistence, system preference detection.
 * All themes are defined in variables.css via [data-theme="X"].
 */

const ThemeEngine = (() => {

  const THEMES = [
    { id: 'dark',          label: 'Dark',          icon: '🌙' },
    { id: 'light',         label: 'Light',          icon: '☀️' },
    { id: 'cyber',         label: 'Cyber',          icon: '⚡' },
    { id: 'blue',          label: 'Blue',           icon: '🔵' },
    { id: 'green',         label: 'Green',          icon: '🟢' },
    { id: 'high-contrast', label: 'High Contrast',  icon: '◐' },
  ];

  const STORAGE_KEY = 'theme';
  const DEFAULT_THEME = 'dark';

  let currentTheme = DEFAULT_THEME;
  const listeners = [];

  /**
   * Apply a theme by setting the data-theme attribute on <html>.
   * Updates internal state and notifies listeners.
   */
  function apply(themeId) {
    if (!THEMES.find(t => t.id === themeId)) {
      console.warn(`[ThemeEngine] Unknown theme: "${themeId}". Falling back to dark.`);
      themeId = DEFAULT_THEME;
    }

    document.documentElement.setAttribute('data-theme', themeId);
    currentTheme = themeId;
    StorageManager.setSetting(STORAGE_KEY, themeId);

    // Notify all registered listeners
    listeners.forEach(fn => fn(themeId));
  }

  /**
   * Toggle between dark and light themes quickly.
   */
  function toggle() {
    apply(currentTheme === 'light' ? 'dark' : 'light');
  }

  /**
   * Initialise the theme engine.
   * Reads saved preference or falls back to system preference.
   */
  function init() {
    const saved = StorageManager.getSetting(STORAGE_KEY);

    if (saved && THEMES.find(t => t.id === saved)) {
      apply(saved);
    } else {
      // Detect system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      apply(prefersDark ? 'dark' : 'light');
    }

    // Watch for system preference changes (only when using system default)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!StorageManager.getSetting(STORAGE_KEY)) {
        apply(e.matches ? 'dark' : 'light');
      }
    });
  }

  /**
   * Register a callback to be called whenever the theme changes.
   */
  function onChange(fn) {
    listeners.push(fn);
  }

  // ── Public API ────────────────────────────────────────────────────────────
  return {
    init,
    apply,
    toggle,
    onChange,
    get current() { return currentTheme; },
    get themes()  { return [...THEMES]; },
  };

})();

window.ThemeEngine = ThemeEngine;
