/**
 * KHAN SECURITY SOLUTIONS ENTERPRISE
 * Storage Manager – IndexedDB + localStorage abstraction layer
 *
 * All persistent data goes through this module.
 * No other module reads/writes storage directly.
 */

const StorageManager = (() => {

  // ── Constants ────────────────────────────────────────────────────────────
  const DB_NAME    = 'KhanSecurityDB';
  const DB_VERSION = 1;
  const LS_PREFIX  = 'kss_'; // localStorage key prefix

  // IndexedDB object stores and their configs
  const STORES = {
    notifications: { keyPath: 'id', autoIncrement: true },
    incidents:     { keyPath: 'id' },
    assets:        { keyPath: 'id' },
    cases:         { keyPath: 'id' },
    iocs:          { keyPath: 'id' },
    logs:          { keyPath: 'id', autoIncrement: true },
    reports:       { keyPath: 'id' },
    notes:         { keyPath: 'id' },
    bookmarks:     { keyPath: 'id' },
    backups:       { keyPath: 'id' },
  };

  let db = null;   // IndexedDB instance
  let ready = false;
  const readyCallbacks = [];

  // ── IndexedDB Initialization ─────────────────────────────────────────────

  /**
   * Opens the IndexedDB database and creates object stores on first run.
   * Returns a Promise that resolves when the DB is ready.
   */
  function init() {
    return new Promise((resolve, reject) => {
      if (ready) { resolve(db); return; }

      if (!window.indexedDB) {
        console.warn('[Storage] IndexedDB not supported. Using localStorage fallback.');
        ready = true;
        resolve(null);
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      // Called when the DB version changes (first time or upgrade)
      request.onupgradeneeded = (event) => {
        const database = event.target.result;
        Object.entries(STORES).forEach(([name, config]) => {
          if (!database.objectStoreNames.contains(name)) {
            database.createObjectStore(name, config);
          }
        });
      };

      request.onsuccess = (event) => {
        db = event.target.result;
        ready = true;
        readyCallbacks.forEach(fn => fn());
        resolve(db);
      };

      request.onerror = (event) => {
        console.error('[Storage] IndexedDB open failed:', event.target.error);
        ready = true; // degrade gracefully
        resolve(null);
      };
    });
  }

  // ── IndexedDB CRUD Operations ─────────────────────────────────────────────

  /**
   * Add or update a record in a store.
   * @param {string} storeName
   * @param {object} record
   * @returns {Promise<any>} – the key of the stored record
   */
  function dbPut(storeName, record) {
    return new Promise((resolve, reject) => {
      if (!db) { reject(new Error('DB not available')); return; }
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(record);
      req.onsuccess = () => resolve(req.result);
      req.onerror  = () => reject(req.error);
    });
  }

  /**
   * Retrieve a single record by key.
   */
  function dbGet(storeName, key) {
    return new Promise((resolve, reject) => {
      if (!db) { resolve(null); return; }
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror  = () => reject(req.error);
    });
  }

  /**
   * Retrieve all records from a store.
   */
  function dbGetAll(storeName) {
    return new Promise((resolve, reject) => {
      if (!db) { resolve([]); return; }
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror  = () => reject(req.error);
    });
  }

  /**
   * Delete a record by key.
   */
  function dbDelete(storeName, key) {
    return new Promise((resolve, reject) => {
      if (!db) { reject(new Error('DB not available')); return; }
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve(true);
      req.onerror  = () => reject(req.error);
    });
  }

  /**
   * Clear all records from a store.
   */
  function dbClear(storeName) {
    return new Promise((resolve, reject) => {
      if (!db) { reject(new Error('DB not available')); return; }
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.clear();
      req.onsuccess = () => resolve(true);
      req.onerror  = () => reject(req.error);
    });
  }

  // ── localStorage API ──────────────────────────────────────────────────────

  /**
   * Store a value in localStorage (JSON-serialised, namespaced).
   */
  function lsSet(key, value) {
    try {
      localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('[Storage] localStorage write failed:', e);
      return false;
    }
  }

  /**
   * Read a value from localStorage.
   * @param {string} key
   * @param {*} defaultValue – returned if key doesn't exist
   */
  function lsGet(key, defaultValue = null) {
    try {
      const raw = localStorage.getItem(LS_PREFIX + key);
      return raw !== null ? JSON.parse(raw) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  }

  /**
   * Remove a key from localStorage.
   */
  function lsRemove(key) {
    localStorage.removeItem(LS_PREFIX + key);
  }

  /**
   * Clear all KSS-prefixed localStorage entries.
   */
  function lsClear() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(LS_PREFIX));
    keys.forEach(k => localStorage.removeItem(k));
  }

  // ── Settings Shortcuts ────────────────────────────────────────────────────
  // Settings are lightweight – localStorage is fine.

  function getSetting(key, defaultValue) {
    return lsGet(`setting_${key}`, defaultValue);
  }

  function setSetting(key, value) {
    return lsSet(`setting_${key}`, value);
  }

  function getAllSettings() {
    const settings = {};
    Object.keys(localStorage)
      .filter(k => k.startsWith(`${LS_PREFIX}setting_`))
      .forEach(k => {
        const shortKey = k.replace(`${LS_PREFIX}setting_`, '');
        try { settings[shortKey] = JSON.parse(localStorage.getItem(k)); }
        catch (_) {}
      });
    return settings;
  }

  // ── Backup / Restore ──────────────────────────────────────────────────────

  /**
   * Export the entire application state to a JSON blob.
   * Caller can trigger a browser download.
   */
  async function exportBackup() {
    const backup = {
      version:   '1.0.0',
      timestamp: new Date().toISOString(),
      source:    'Khan Security Solutions Enterprise',
      settings:  getAllSettings(),
      stores:    {}
    };

    // Export all IndexedDB stores
    for (const storeName of Object.keys(STORES)) {
      try {
        backup.stores[storeName] = await dbGetAll(storeName);
      } catch (_) {
        backup.stores[storeName] = [];
      }
    }

    return JSON.stringify(backup, null, 2);
  }

  /**
   * Import application state from a backup JSON string.
   * Validates structure before writing.
   */
  async function importBackup(jsonString) {
    let data;
    try {
      data = JSON.parse(jsonString);
    } catch (_) {
      throw new Error('Invalid backup file: not valid JSON.');
    }

    if (!data.version || !data.stores) {
      throw new Error('Invalid backup file: missing required fields.');
    }

    // Restore settings
    if (data.settings) {
      Object.entries(data.settings).forEach(([k, v]) => setSetting(k, v));
    }

    // Restore IndexedDB stores
    for (const [storeName, records] of Object.entries(data.stores)) {
      if (!STORES[storeName] || !Array.isArray(records)) continue;
      await dbClear(storeName);
      for (const record of records) {
        try { await dbPut(storeName, record); } catch (_) {}
      }
    }

    return true;
  }

  // ── Storage Usage Stats ───────────────────────────────────────────────────

  async function getStorageStats() {
    let lsUsed = 0;
    Object.keys(localStorage)
      .filter(k => k.startsWith(LS_PREFIX))
      .forEach(k => { lsUsed += (localStorage.getItem(k) || '').length * 2; });

    const stats = {
      localStorageBytes: lsUsed,
      stores: {}
    };

    for (const storeName of Object.keys(STORES)) {
      try {
        const records = await dbGetAll(storeName);
        stats.stores[storeName] = records.length;
      } catch (_) {
        stats.stores[storeName] = 0;
      }
    }

    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      stats.quotaBytes = estimate.quota;
      stats.usedBytes  = estimate.usage;
    }

    return stats;
  }

  // ── Public API ────────────────────────────────────────────────────────────
  return {
    init,
    // IndexedDB
    put:    dbPut,
    get:    dbGet,
    getAll: dbGetAll,
    delete: dbDelete,
    clear:  dbClear,
    // localStorage
    lsSet,
    lsGet,
    lsRemove,
    lsClear,
    // Settings
    getSetting,
    setSetting,
    getAllSettings,
    // Backup
    exportBackup,
    importBackup,
    getStorageStats,
    // State
    get isReady() { return ready; },
  };

})();

// Make globally available
window.StorageManager = StorageManager;
