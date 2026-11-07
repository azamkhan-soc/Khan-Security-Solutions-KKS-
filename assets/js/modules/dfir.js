/**
 * KHAN SECURITY SOLUTIONS ENTERPRISE
 * DFIR Toolkit — Module v0.8.0
 *
 * Offline digital forensics & incident response workbench: case management,
 * incident timeline builder (with IOC/MITRE filtered views), evidence locker
 * with chain-of-custody tracking, memory/disk analysis placeholders, and
 * case export / executive reporting.
 *
 * [EDUCATIONAL SIMULATION — Ships with a bundled synthetic case dataset.
 *  Memory Analysis and Disk Analysis are clearly labeled PLACEHOLDER tools:
 *  they display static simulated findings and do not parse real memory
 *  images or disk images. Cases, notes, evidence, and timeline events you
 *  add are stored locally in this browser only.]
 *
 * Integrates with:
 *   window.Router              — route: 'dfir'
 *   window.SearchEngine        — searchable content
 *   window.NotificationManager — alerts and feedback
 *   window.StorageManager      — case/evidence/timeline persistence (localStorage)
 *   window.SampleDFIR          — bundled sample dataset
 */

const DFIR = (() => {

  // ── State ──────────────────────────────────────────────────────────────
  let mounted       = false;
  let activeTab      = 'overview';
  let activeCaseId    = null;
  let timelineFilter   = 'all';
  let timelineCaseFilter = 'all';

  let customCases    = [];
  let customNotes     = [];
  let customEvidence   = [];
  let customTimeline    = [];

  // ── Icons ──────────────────────────────────────────────────────────────
  const I = {
    shield:   `<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>`,
    folder:   `<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 015.25 3.75h4.5a2.25 2.25 0 011.591.659l1.5 1.5a2.25 2.25 0 001.591.659H18.75A2.25 2.25 0 0121 8.25v1.526"/>`,
    note:     `<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-1.519-2.865a4.5 4.5 0 11-1.594-1.594m3.113 4.459a4.5 4.5 0 003.113-4.459M6 20.25h12A2.25 2.25 0 0020.25 18V9.75l-6-6H6a2.25 2.25 0 00-2.25 2.25v12A2.25 2.25 0 006 20.25z"/>`,
    evidence: `<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/>`,
    link:     `<path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"/>`,
    memory:   `<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21M6.75 6.75h10.5v10.5H6.75V6.75z"/>`,
    disk:     `<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 3.75c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"/>`,
    clock:    `<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>`,
    map:      `<path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"/>`,
    report:   `<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"/>`,
    plus:     `<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>`,
    trash:    `<path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>`,
    warn:     `<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>`,
    close:    `<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>`,
    down:     `<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>`,
    hash:     `<path stroke-linecap="round" stroke-linejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5"/>`,
  };

  function svg(name, cls = '') {
    return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">${I[name] || I.shield}</svg>`;
  }
  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }
  function uid(prefix) { return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`; }

  const SD = () => window.SampleDFIR || { cases: [], timelineEvents: [], evidence: [], caseNotes: [], memoryFindings: {}, diskFindings: {}, mitreLookup: {}, getCase: () => null };

  // Merged accessors (sample + user-added, persisted locally)
  function allCases()    { return [...SD().cases, ...customCases]; }
  function allNotes()    { return [...SD().caseNotes, ...customNotes]; }
  function allEvidence() { return [...SD().evidence, ...customEvidence]; }
  function allTimeline() { return [...SD().timelineEvents, ...customTimeline]; }
  function findCase(id)  { return allCases().find(c => c.id === id) || null; }

  const TYPE_META = {
    general:  { label: 'General',  cls: 'badge-neutral', icon: 'clock' },
    ioc:      { label: 'IOC',      cls: 'badge-danger',  icon: 'hash' },
    mitre:    { label: 'MITRE',    cls: 'badge-info',    icon: 'map' },
    evidence: { label: 'Evidence', cls: 'badge-warning',  icon: 'evidence' },
    note:     { label: 'Note',     cls: 'badge-success', icon: 'note' },
  };

  // ══════════════════════════════════════════════════════════════════════
  // ROUTE REGISTRATION
  // ══════════════════════════════════════════════════════════════════════
  function register() {
    window.Router.register('dfir', { title: 'DFIR Toolkit', init, render });
  }

  function init() {
    _loadCustomData();
    _registerSearch();
  }

  function render() {
    const el = document.getElementById('page-dfir');
    if (!el) return;
    if (!mounted) {
      el.innerHTML = _buildShell();
      mounted = true;
      _wireAll();
    }
    _switchTab(activeTab);
  }

  // ══════════════════════════════════════════════════════════════════════
  // SHELL
  // ══════════════════════════════════════════════════════════════════════
  function _buildShell() {
    return `
    <div class="df-shell">
      <div class="df-header">
        <div class="df-header-left">
          <div class="df-header-icon">${svg('folder')}</div>
          <div>
            <div class="df-header-title">DFIR Toolkit</div>
            <div class="df-header-sub">Digital Forensics &amp; Incident Response workbench</div>
          </div>
        </div>
        <span class="badge badge-warning" style="font-family:var(--font-mono);font-size:10px;">⚠ EDUCATIONAL SIMULATION — LOCAL DATA ONLY</span>
      </div>

      <div class="df-tabs" role="tablist">
        <div class="df-tab active" data-tab="overview" role="tab">${svg('shield')}   Overview</div>
        <div class="df-tab"        data-tab="cases"    role="tab">${svg('folder')}   Cases</div>
        <div class="df-tab"        data-tab="timeline" role="tab">${svg('clock')}    Timeline</div>
        <div class="df-tab"        data-tab="evidence" role="tab">${svg('evidence')} Evidence Locker</div>
        <div class="df-tab"        data-tab="memory"   role="tab">${svg('memory')}   Memory Analysis</div>
        <div class="df-tab"        data-tab="disk"     role="tab">${svg('disk')}     Disk Analysis</div>
        <div class="df-tab"        data-tab="reports"  role="tab">${svg('report')}   Reports</div>
      </div>

      <div class="df-body">
        <div class="df-view active" id="df-view-overview">${_buildOverview()}</div>
        <div class="df-view" id="df-view-cases">${_buildCasesView()}</div>
        <div class="df-view" id="df-view-timeline">${_buildTimelineView()}</div>
        <div class="df-view" id="df-view-evidence">${_buildEvidenceView()}</div>
        <div class="df-view" id="df-view-memory">${_buildMemoryView()}</div>
        <div class="df-view" id="df-view-disk">${_buildDiskView()}</div>
        <div class="df-view" id="df-view-reports">${_buildReportsView()}</div>
      </div>
    </div>

    <div class="df-detail-overlay" id="df-detail-overlay">
      <div class="df-detail-panel" id="df-detail-panel">
        <div class="df-detail-header">
          <div class="df-detail-title" id="df-detail-title">Detail</div>
          <div class="df-detail-close" id="df-detail-close">${svg('close')}</div>
        </div>
        <div id="df-detail-body"></div>
      </div>
    </div>`;
  }

  function _wireAll() {
    document.querySelectorAll('#page-dfir .df-tab').forEach(tab => {
      tab.addEventListener('click', () => _switchTab(tab.dataset.tab));
    });
    document.getElementById('df-detail-close')?.addEventListener('click', _closeDetail);
    document.getElementById('df-detail-overlay')?.addEventListener('click', e => {
      if (e.target.id === 'df-detail-overlay') _closeDetail();
    });
    _wireCases();
    _wireTimeline();
    _wireEvidence();
    _wireReports();
  }

  function _switchTab(tabId) {
    activeTab = tabId;
    document.querySelectorAll('#page-dfir .df-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
    document.querySelectorAll('#page-dfir .df-view').forEach(v => v.classList.toggle('active', v.id === `df-view-${tabId}`));
  }

  // ══════════════════════════════════════════════════════════════════════
  // OVERVIEW
  // ══════════════════════════════════════════════════════════════════════
  function _buildOverview() {
    const open = allCases().filter(c => c.status === 'Open' || c.status === 'Active').length;
    const recent = [...allTimeline()].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 6);
    return `
      <div class="grid grid-stats">
        ${_statCard('Total Cases', allCases().length, `${open} open`, 'var(--color-primary)')}
        ${_statCard('Timeline Events', allTimeline().length, 'Across all cases', 'var(--color-info)')}
        ${_statCard('Evidence Items', allEvidence().length, 'Chain of custody tracked', 'var(--color-warning)')}
        ${_statCard('Case Notes', allNotes().length, 'Investigator entries', 'var(--color-success)')}
      </div>
      <div class="card" style="margin-top:var(--space-5);">
        <div class="card-header"><div class="card-title">Recent Timeline Activity</div></div>
        <div class="card-body" style="padding:0;">
          <table class="data-table">
            <thead><tr><th>Time</th><th>Case</th><th>Type</th><th>Event</th></tr></thead>
            <tbody>
              ${recent.map(e => {
                const c = findCase(e.caseId); const meta = TYPE_META[e.type] || TYPE_META.general;
                return `<tr class="df-row" data-goto-case="${e.caseId}"><td class="mono">${esc(e.timestamp)}</td><td>${c ? esc(c.name) : '—'}</td><td><span class="badge ${meta.cls}">${meta.label}</span></td><td>${esc(e.title)}</td></tr>`;
              }).join('') || `<tr><td colspan="4"><div class="empty-state"><div class="empty-state-desc">No timeline events yet.</div></div></td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
      <div class="empty-state" style="margin-top:var(--space-5);padding:var(--space-4);border:1px dashed var(--border-default);border-radius:var(--radius-lg);">
        <div style="display:flex;gap:var(--space-3);align-items:flex-start;">
          <div style="color:var(--color-warning);flex-shrink:0;">${svg('warn', 'df-inline-icon')}</div>
          <div style="font-size:var(--text-sm);color:var(--text-secondary);text-align:left;">
            This toolkit ships with a synthetic sample case for demonstration. Cases, notes, evidence, and timeline
            events you add are stored only in this browser's local storage — nothing is uploaded anywhere.
          </div>
        </div>
      </div>`;
  }

  function _statCard(label, value, change, color) {
    return `
      <div class="stat-card">
        <div class="stat-card-icon" style="background:${color}22;color:${color};">${svg('shield')}</div>
        <div class="stat-card-info">
          <div class="stat-card-value">${value}</div>
          <div class="stat-card-label">${esc(label)}</div>
          <div class="stat-card-change" style="color:var(--text-tertiary);">${esc(change)}</div>
        </div>
      </div>`;
  }

  // ══════════════════════════════════════════════════════════════════════
  // CASES
  // ══════════════════════════════════════════════════════════════════════
  function _buildCasesView() {
    return `
      <div class="df-toolbar">
        <div style="flex:1;"></div>
        <button class="btn btn-primary" id="df-new-case-btn">${svg('plus')} New Case</button>
      </div>
      <div class="df-case-grid" id="df-case-grid"></div>`;
  }

  function _renderCases() {
    const grid = document.getElementById('df-case-grid');
    if (!grid) return;
    const cases = allCases();
    if (!cases.length) { grid.innerHTML = `<div class="empty-state"><div class="empty-state-desc">No cases yet.</div></div>`; return; }
    const statusCls = { Open: 'badge-danger', Active: 'badge-warning', Closed: 'badge-neutral' };
    grid.innerHTML = cases.map(c => `
      <div class="card df-case-card" data-case="${c.id}">
        <div class="df-case-card-header">
          <div>
            <div class="df-case-name">${esc(c.name)}</div>
            <div class="df-case-meta">Lead: ${esc(c.leadInvestigator)} &middot; Opened ${esc(c.createdDate)}</div>
          </div>
          <div class="ti-tag-row">
            <span class="badge ${statusCls[c.status] || 'badge-neutral'}">${esc(c.status)}</span>
            <span class="badge ${c.severity === 'Critical' ? 'badge-danger' : c.severity === 'High' ? 'badge-high' : 'badge-neutral'}">${esc(c.severity)}</span>
          </div>
        </div>
        <div class="card-body">
          <div class="df-case-desc">${esc(c.description)}</div>
          <div class="df-case-stats">
            <span>${allTimeline().filter(e => e.caseId === c.id).length} timeline events</span>
            <span>${allEvidence().filter(e => e.caseId === c.id).length} evidence items</span>
            <span>${allNotes().filter(n => n.caseId === c.id).length} notes</span>
          </div>
        </div>
      </div>`).join('');
    grid.querySelectorAll('.df-case-card').forEach(card => card.addEventListener('click', () => _openCaseDetail(card.dataset.case)));
  }

  function _wireCases() {
    document.getElementById('df-new-case-btn')?.addEventListener('click', _openNewCaseForm);
    document.querySelectorAll('#page-dfir .df-row[data-goto-case]').forEach(row => {
      row.addEventListener('click', () => { _switchTab('cases'); setTimeout(() => _openCaseDetail(row.dataset.gotoCase), 50); });
    });
    _renderCases();
  }

  function _openNewCaseForm() {
    _openDetail('New Case', `
      <div class="df-form-row"><label class="df-label">Case Name</label><input type="text" class="input" id="df-nc-name" placeholder="e.g. INC-2026-0200 — Description" /></div>
      <div class="df-form-row"><label class="df-label">Lead Investigator</label><input type="text" class="input" id="df-nc-lead" placeholder="e.g. A. Khan" /></div>
      <div class="df-form-row"><label class="df-label">Severity</label>
        <select class="input" id="df-nc-severity"><option>Low</option><option>Medium</option><option selected>High</option><option>Critical</option></select></div>
      <div class="df-form-row"><label class="df-label">Description</label><textarea class="input" id="df-nc-desc" rows="3" placeholder="Brief incident summary…"></textarea></div>
      <button class="btn btn-primary" id="df-nc-save">${svg('plus')} Create Case</button>
    `);
    document.getElementById('df-nc-save')?.addEventListener('click', () => {
      const name = document.getElementById('df-nc-name').value.trim();
      if (!name) { window.NotificationManager?.warning('Name Required', 'Please enter a case name.'); return; }
      const newCase = {
        id: uid('case'), name, status: 'Open',
        severity: document.getElementById('df-nc-severity').value,
        createdDate: new Date().toISOString().slice(0, 10),
        leadInvestigator: document.getElementById('df-nc-lead').value.trim() || 'Unassigned',
        description: document.getElementById('df-nc-desc').value.trim() || '—',
      };
      customCases.push(newCase);
      _saveCustomData();
      _renderCases();
      _closeDetail();
      window.NotificationManager?.success('Case Created', `${newCase.name} added.`);
    });
  }

  function _openCaseDetail(caseId) {
    const c = findCase(caseId);
    if (!c) return;
    activeCaseId = caseId;
    const notes = allNotes().filter(n => n.caseId === caseId).sort((a, b) => new Date(b.date) - new Date(a.date));
    const evid  = allEvidence().filter(e => e.caseId === caseId);
    const events = allTimeline().filter(e => e.caseId === caseId).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    _openDetail(c.name, `
      <div class="ti-tag-row" style="margin-bottom:var(--space-3);">
        <span class="badge ${c.status === 'Closed' ? 'badge-neutral' : 'badge-danger'}">${esc(c.status)}</span>
        <span class="badge badge-neutral">${esc(c.severity)}</span>
        <span class="badge badge-info">Lead: ${esc(c.leadInvestigator)}</span>
      </div>
      <div class="df-case-desc" style="margin-bottom:var(--space-4);">${esc(c.description)}</div>

      <div class="df-detail-sub-title">Timeline (${events.length})</div>
      ${events.map(e => _timelineRowHTML(e)).join('') || '<div style="color:var(--text-tertiary);font-size:var(--text-sm);">No events recorded.</div>'}
      <button class="btn btn-secondary btn-sm" id="df-cd-add-event" style="margin-top:var(--space-2);">${svg('plus')} Add Timeline Event</button>

      <div class="df-detail-sub-title">Case Notes (${notes.length})</div>
      ${notes.map(n => `<div class="df-note"><div class="df-note-meta">${esc(n.author)} &middot; ${esc(n.date)}</div><div class="df-note-text">${esc(n.text)}</div></div>`).join('') || '<div style="color:var(--text-tertiary);font-size:var(--text-sm);">No notes yet.</div>'}
      <div class="df-form-row" style="margin-top:var(--space-3);">
        <textarea class="input" id="df-cd-note-text" rows="2" placeholder="Add a case note…"></textarea>
        <button class="btn btn-secondary btn-sm" id="df-cd-add-note" style="margin-top:var(--space-2);">${svg('plus')} Add Note</button>
      </div>

      <div class="df-detail-sub-title">Evidence (${evid.length})</div>
      ${evid.map(ev => `<div class="ti-detail-link" data-evd="${ev.id}">${svg('evidence', 'df-inline-icon')} ${esc(ev.name)} <span style="color:var(--text-tertiary);">— ${esc(ev.type)}</span></div>`).join('') || '<div style="color:var(--text-tertiary);font-size:var(--text-sm);">No evidence logged.</div>'}
      <button class="btn btn-secondary btn-sm" id="df-cd-add-evidence" style="margin-top:var(--space-2);">${svg('plus')} Log Evidence</button>
    `);

    document.getElementById('df-cd-add-note')?.addEventListener('click', () => {
      const text = document.getElementById('df-cd-note-text').value.trim();
      if (!text) return;
      customNotes.push({ id: uid('note'), caseId, author: 'Current User', date: new Date().toISOString().slice(0, 16).replace('T', ' '), text });
      _saveCustomData();
      window.NotificationManager?.success('Note Added', '');
      _openCaseDetail(caseId);
    });
    document.getElementById('df-cd-add-event')?.addEventListener('click', () => _openNewTimelineEventForm(caseId, () => _openCaseDetail(caseId)));
    document.getElementById('df-cd-add-evidence')?.addEventListener('click', () => _openNewEvidenceForm(caseId, () => _openCaseDetail(caseId)));
    document.querySelectorAll('#df-detail-body .ti-detail-link[data-evd]').forEach(el => el.addEventListener('click', () => _openEvidenceDetail(el.dataset.evd)));
  }

  function _timelineRowHTML(e) {
    const meta = TYPE_META[e.type] || TYPE_META.general;
    return `
      <div class="df-timeline-row">
        <div class="df-timeline-time mono">${esc(e.timestamp)}</div>
        <div class="df-timeline-body">
          <div class="df-timeline-head"><span class="badge ${meta.cls}">${meta.label}</span> <strong>${esc(e.title)}</strong></div>
          <div class="df-timeline-desc">${esc(e.description)}</div>
          ${e.iocValue ? `<div class="df-timeline-tag mono">IOC: ${esc(e.iocValue)}</div>` : ''}
          ${e.mitreId ? `<div class="df-timeline-tag mono">${esc(e.mitreId)} — ${esc((SD().mitreLookup || {})[e.mitreId] || '')}</div>` : ''}
        </div>
      </div>`;
  }

  // ══════════════════════════════════════════════════════════════════════
  // TIMELINE (global — Incident Timeline / Timeline Builder / IOC & MITRE views)
  // ══════════════════════════════════════════════════════════════════════
  function _buildTimelineView() {
    const cases = allCases();
    return `
      <div class="df-toolbar">
        <select class="input" id="df-tl-case" style="max-width:260px;">
          <option value="all">All Cases</option>
          ${cases.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}
        </select>
        <div class="df-filter-chips" id="df-tl-filters">
          <div class="df-chip active" data-type="all">All</div>
          <div class="df-chip" data-type="general">General</div>
          <div class="df-chip" data-type="ioc">IOC Timeline</div>
          <div class="df-chip" data-type="mitre">MITRE Timeline</div>
          <div class="df-chip" data-type="evidence">Evidence</div>
          <div class="df-chip" data-type="note">Notes</div>
        </div>
        <div style="flex:1;"></div>
        <button class="btn btn-primary btn-sm" id="df-tl-add">${svg('plus')} Add Event</button>
      </div>
      <div id="df-tl-list" style="margin-top:var(--space-4);"></div>`;
  }

  function _wireTimeline() {
    document.getElementById('df-tl-case')?.addEventListener('change', e => { timelineCaseFilter = e.target.value; _renderTimeline(); });
    document.querySelectorAll('#df-tl-filters .df-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        timelineFilter = chip.dataset.type;
        document.querySelectorAll('#df-tl-filters .df-chip').forEach(c => c.classList.toggle('active', c === chip));
        _renderTimeline();
      });
    });
    document.getElementById('df-tl-add')?.addEventListener('click', () => {
      const caseId = timelineCaseFilter !== 'all' ? timelineCaseFilter : (allCases()[0]?.id || null);
      if (!caseId) { window.NotificationManager?.warning('No Case', 'Create a case first.'); return; }
      _openNewTimelineEventForm(caseId, _renderTimeline);
    });
    _renderTimeline();
  }

  function _renderTimeline() {
    const list = document.getElementById('df-tl-list');
    if (!list) return;
    let events = [...allTimeline()].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    if (timelineCaseFilter !== 'all') events = events.filter(e => e.caseId === timelineCaseFilter);
    if (timelineFilter !== 'all') events = events.filter(e => e.type === timelineFilter);

    if (!events.length) { list.innerHTML = `<div class="empty-state"><div class="empty-state-desc">No timeline events match this filter.</div></div>`; return; }
    list.innerHTML = `<div class="df-timeline-track">${events.map(e => {
      const c = findCase(e.caseId);
      return `<div class="df-timeline-item">${_timelineRowHTML(e)}<div class="df-timeline-case">${c ? esc(c.name) : ''}</div></div>`;
    }).join('')}</div>`;
  }

  function _openNewTimelineEventForm(caseId, onSaved) {
    const cases = allCases();
    _openDetail('Add Timeline Event', `
      <div class="df-form-row"><label class="df-label">Case</label>
        <select class="input" id="df-te-case">${cases.map(c => `<option value="${c.id}" ${c.id === caseId ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
      <div class="df-form-row"><label class="df-label">Timestamp</label><input type="text" class="input" id="df-te-time" placeholder="YYYY-MM-DD HH:MM" value="${new Date().toISOString().slice(0, 16).replace('T', ' ')}" /></div>
      <div class="df-form-row"><label class="df-label">Event Type</label>
        <select class="input" id="df-te-type"><option value="general">General</option><option value="ioc">IOC</option><option value="mitre">MITRE</option><option value="evidence">Evidence</option><option value="note">Note</option></select></div>
      <div class="df-form-row"><label class="df-label">Title</label><input type="text" class="input" id="df-te-title" placeholder="e.g. Process Injection Detected" /></div>
      <div class="df-form-row"><label class="df-label">Description</label><textarea class="input" id="df-te-desc" rows="3" placeholder="Details…"></textarea></div>
      <div class="df-form-row" id="df-te-ioc-row"><label class="df-label">IOC Value (optional)</label><input type="text" class="input" id="df-te-ioc" placeholder="e.g. 198.51.100.14" /></div>
      <div class="df-form-row" id="df-te-mitre-row"><label class="df-label">MITRE Technique ID (optional)</label><input type="text" class="input" id="df-te-mitre" placeholder="e.g. T1059.001" /></div>
      <button class="btn btn-primary" id="df-te-save">${svg('plus')} Add Event</button>
    `);
    document.getElementById('df-te-save')?.addEventListener('click', () => {
      const title = document.getElementById('df-te-title').value.trim();
      if (!title) { window.NotificationManager?.warning('Title Required', ''); return; }
      customTimeline.push({
        id: uid('ev'), caseId: document.getElementById('df-te-case').value,
        timestamp: document.getElementById('df-te-time').value.trim() || new Date().toISOString().slice(0, 16).replace('T', ' '),
        type: document.getElementById('df-te-type').value, title,
        description: document.getElementById('df-te-desc').value.trim() || '—',
        iocValue: document.getElementById('df-te-ioc').value.trim() || undefined,
        mitreId: document.getElementById('df-te-mitre').value.trim() || undefined,
      });
      _saveCustomData();
      _closeDetail();
      window.NotificationManager?.success('Event Added', 'Timeline event recorded.');
      onSaved?.();
    });
  }

  // ══════════════════════════════════════════════════════════════════════
  // EVIDENCE LOCKER (chain of custody)
  // ══════════════════════════════════════════════════════════════════════
  function _buildEvidenceView() {
    return `
      <p style="color:var(--text-secondary);font-size:var(--text-sm);margin-bottom:var(--space-3);">All evidence items across cases, with full chain-of-custody logs. Click an item for details.</p>
      <div class="card">
        <div class="card-body" style="padding:0;overflow-x:auto;">
          <table class="data-table">
            <thead><tr><th>Name</th><th>Type</th><th>Case</th><th>Collected By</th><th>Date</th><th>Custody Events</th></tr></thead>
            <tbody id="df-evd-tbody"></tbody>
          </table>
        </div>
      </div>`;
  }

  function _renderEvidenceLocker() {
    const tbody = document.getElementById('df-evd-tbody');
    if (!tbody) return;
    const items = allEvidence();
    if (!items.length) { tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-state-desc">No evidence logged yet.</div></div></td></tr>`; return; }
    tbody.innerHTML = items.map(ev => {
      const c = findCase(ev.caseId);
      return `<tr class="ti-row" data-evd="${ev.id}">
        <td>${esc(ev.name)}</td><td><span class="badge badge-neutral">${esc(ev.type)}</span></td>
        <td>${c ? esc(c.name) : '—'}</td><td>${esc(ev.collectedBy)}</td><td class="mono">${esc(ev.collectedDate)}</td>
        <td>${ev.custodyLog.length}</td>
      </tr>`;
    }).join('');
    tbody.querySelectorAll('.ti-row').forEach(tr => tr.addEventListener('click', () => _openEvidenceDetail(tr.dataset.evd)));
  }

  function _wireEvidence() { _renderEvidenceLocker(); }

  function _openNewEvidenceForm(caseId, onSaved) {
    const cases = allCases();
    _openDetail('Log Evidence', `
      <div class="df-form-row"><label class="df-label">Case</label>
        <select class="input" id="df-ne-case">${cases.map(c => `<option value="${c.id}" ${c.id === caseId ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
      <div class="df-form-row"><label class="df-label">Evidence Name</label><input type="text" class="input" id="df-ne-name" placeholder="e.g. WS-042 Memory Capture" /></div>
      <div class="df-form-row"><label class="df-label">Type</label>
        <select class="input" id="df-ne-type"><option>Memory Dump</option><option>Disk Image</option><option>Log File</option><option>Document</option><option>Physical</option></select></div>
      <div class="df-form-row"><label class="df-label">Collected By</label><input type="text" class="input" id="df-ne-by" placeholder="Investigator name" /></div>
      <div class="df-form-row"><label class="df-label">Storage Location</label><input type="text" class="input" id="df-ne-loc" placeholder="e.g. Evidence Server / Case-004/" /></div>
      <button class="btn btn-primary" id="df-ne-save">${svg('plus')} Log Evidence</button>
    `);
    document.getElementById('df-ne-save')?.addEventListener('click', () => {
      const name = document.getElementById('df-ne-name').value.trim();
      if (!name) { window.NotificationManager?.warning('Name Required', ''); return; }
      const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
      const by = document.getElementById('df-ne-by').value.trim() || 'Current User';
      customEvidence.push({
        id: uid('evd'), caseId: document.getElementById('df-ne-case').value, name,
        type: document.getElementById('df-ne-type').value,
        hash: 'sha256:' + Array.from({ length: 64 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join(''),
        collectedBy: by, collectedDate: now,
        location: document.getElementById('df-ne-loc').value.trim() || 'Evidence Server',
        custodyLog: [{ by, date: now, action: 'Collected', notes: 'Initial evidence intake.' }],
      });
      _saveCustomData();
      _closeDetail();
      window.NotificationManager?.success('Evidence Logged', 'Chain of custody initiated.');
      onSaved?.();
    });
  }

  function _openEvidenceDetail(evdId) {
    const ev = allEvidence().find(e => e.id === evdId);
    if (!ev) return;
    const c = findCase(ev.caseId);
    _openDetail(ev.name, `
      <div class="ti-tag-row" style="margin-bottom:var(--space-3);">
        <span class="badge badge-neutral">${esc(ev.type)}</span>
        ${c ? `<span class="badge badge-info">${esc(c.name)}</span>` : ''}
      </div>
      <div class="df-detail-grid">
        <div class="df-detail-field"><div class="df-detail-field-label">Collected By</div><div class="df-detail-field-value">${esc(ev.collectedBy)}</div></div>
        <div class="df-detail-field"><div class="df-detail-field-label">Collected Date</div><div class="df-detail-field-value">${esc(ev.collectedDate)}</div></div>
        <div class="df-detail-field"><div class="df-detail-field-label">Location</div><div class="df-detail-field-value">${esc(ev.location)}</div></div>
      </div>
      <div class="ti-detail-value-box mono" style="word-break:break-all;">${esc(ev.hash)}</div>
      <div class="df-detail-sub-title">Chain of Custody (${ev.custodyLog.length})</div>
      <div class="df-custody-track">
        ${ev.custodyLog.map(entry => `
          <div class="df-custody-item">
            <div class="df-custody-dot"></div>
            <div>
              <div class="df-custody-head"><strong>${esc(entry.action)}</strong> <span style="color:var(--text-tertiary);">by ${esc(entry.by)} — ${esc(entry.date)}</span></div>
              <div class="df-custody-notes">${esc(entry.notes)}</div>
            </div>
          </div>`).join('')}
      </div>
    `);
  }

  // ══════════════════════════════════════════════════════════════════════
  // MEMORY ANALYSIS (PLACEHOLDER)
  // ══════════════════════════════════════════════════════════════════════
  function _buildMemoryView() {
    const m = SD().memoryFindings;
    return `
      <div class="df-placeholder-banner">
        ${svg('warn', 'df-inline-icon')} PLACEHOLDER TOOL — displays static simulated findings from a bundled sample; does not parse real memory images.
      </div>
      <div class="card"><div class="card-header"><div class="card-title">${esc(m.imageName || 'Sample Memory Image')}</div></div>
        <div class="card-body">
          <div class="df-detail-grid">
            <div class="df-detail-field"><div class="df-detail-field-label">Size</div><div class="df-detail-field-value">${esc(m.size || '—')}</div></div>
            <div class="df-detail-field"><div class="df-detail-field-label">Profile</div><div class="df-detail-field-value">${esc(m.profile || '—')}</div></div>
          </div>
        </div>
      </div>
      <div class="card" style="margin-top:var(--space-4);"><div class="card-header"><div class="card-title">Process List</div></div>
        <div class="card-body" style="padding:0;"><table class="data-table"><thead><tr><th>PID</th><th>Name</th><th>PPID</th><th>Note</th></tr></thead>
          <tbody>${(m.processes || []).map(p => `<tr><td class="mono">${p.pid}</td><td class="mono">${esc(p.name)}</td><td class="mono">${p.ppid}</td><td style="color:${p.note.startsWith('Suspicious') ? 'var(--color-danger)' : 'var(--text-tertiary)'};">${esc(p.note)}</td></tr>`).join('')}</tbody></table></div>
      </div>
      <div class="card" style="margin-top:var(--space-4);"><div class="card-header"><div class="card-title">Network Connections</div></div>
        <div class="card-body" style="padding:0;"><table class="data-table"><thead><tr><th>PID</th><th>Local</th><th>Remote</th><th>State</th></tr></thead>
          <tbody>${(m.networkConnections || []).map(n => `<tr><td class="mono">${n.pid}</td><td class="mono">${esc(n.local)}</td><td class="mono">${esc(n.remote)}</td><td>${esc(n.state)}</td></tr>`).join('')}</tbody></table></div>
      </div>
      <div class="card" style="margin-top:var(--space-4);"><div class="card-header"><div class="card-title">Injected / Unbacked Memory Regions</div></div>
        <div class="card-body" style="padding:0;"><table class="data-table"><thead><tr><th>PID</th><th>Region</th><th>Note</th></tr></thead>
          <tbody>${(m.injectedModules || []).map(im => `<tr><td class="mono">${im.pid}</td><td class="mono">${esc(im.module)}</td><td style="color:var(--color-danger);">${esc(im.note)}</td></tr>`).join('')}</tbody></table></div>
      </div>`;
  }

  // ══════════════════════════════════════════════════════════════════════
  // DISK ANALYSIS (PLACEHOLDER)
  // ══════════════════════════════════════════════════════════════════════
  function _buildDiskView() {
    const d = SD().diskFindings;
    return `
      <div class="df-placeholder-banner">
        ${svg('warn', 'df-inline-icon')} PLACEHOLDER TOOL — displays static simulated findings from a bundled sample; does not parse real disk images.
      </div>
      <div class="card"><div class="card-header"><div class="card-title">${esc(d.imageName || 'Sample Disk Image')}</div></div>
        <div class="card-body">
          <div class="df-detail-grid">
            <div class="df-detail-field"><div class="df-detail-field-label">Size</div><div class="df-detail-field-value">${esc(d.size || '—')}</div></div>
            <div class="df-detail-field"><div class="df-detail-field-label">File System</div><div class="df-detail-field-value">${esc(d.fileSystem || '—')}</div></div>
          </div>
        </div>
      </div>
      <div class="card" style="margin-top:var(--space-4);"><div class="card-header"><div class="card-title">Recently Executed</div></div>
        <div class="card-body" style="padding:0;"><table class="data-table"><thead><tr><th>Path</th><th>Last Run</th></tr></thead>
          <tbody>${(d.recentlyExecuted || []).map(f => `<tr><td class="mono">${esc(f.path)}</td><td class="mono">${esc(f.lastRun)}</td></tr>`).join('')}</tbody></table></div>
      </div>
      <div class="card" style="margin-top:var(--space-4);"><div class="card-header"><div class="card-title">Deleted Files</div></div>
        <div class="card-body" style="padding:0;"><table class="data-table"><thead><tr><th>Path</th><th>Deleted At</th><th>Recoverable</th></tr></thead>
          <tbody>${(d.deletedFiles || []).map(f => `<tr><td class="mono">${esc(f.path)}</td><td class="mono">${esc(f.deletedAt)}</td><td>${f.recoverable ? '<span class="badge badge-warning">Yes</span>' : '<span class="badge badge-neutral">No</span>'}</td></tr>`).join('')}</tbody></table></div>
      </div>
      <div class="card" style="margin-top:var(--space-4);"><div class="card-header"><div class="card-title">Persistence Artifacts</div></div>
        <div class="card-body" style="padding:0;"><table class="data-table"><thead><tr><th>Location</th><th>Value</th><th>Note</th></tr></thead>
          <tbody>${(d.persistenceArtifacts || []).map(a => `<tr><td class="mono">${esc(a.location)}</td><td class="mono">${esc(a.value)}</td><td style="color:var(--color-danger);">${esc(a.note)}</td></tr>`).join('')}</tbody></table></div>
      </div>`;
  }

  // ══════════════════════════════════════════════════════════════════════
  // REPORTS (Case Export / Executive Report)
  // ══════════════════════════════════════════════════════════════════════
  function _buildReportsView() {
    const cases = allCases();
    return `
      <div class="card" style="max-width:640px;">
        <div class="card-header"><div class="card-title">Case Export</div></div>
        <div class="card-body">
          <div class="df-form-row"><label class="df-label">Select Case</label>
            <select class="input" id="df-rep-case">${cases.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div>
          <div style="display:flex;gap:var(--space-3);flex-wrap:wrap;">
            <button class="btn btn-secondary" id="df-rep-json">${svg('down')} Export Case (JSON)</button>
            <button class="btn btn-secondary" id="df-rep-exec">${svg('report')} Executive Report (HTML)</button>
          </div>
        </div>
      </div>`;
  }

  function _wireReports() {
    document.getElementById('df-rep-json')?.addEventListener('click', () => {
      const caseId = document.getElementById('df-rep-case').value;
      const c = findCase(caseId);
      const payload = {
        case: c,
        notes: allNotes().filter(n => n.caseId === caseId),
        evidence: allEvidence().filter(e => e.caseId === caseId),
        timeline: allTimeline().filter(e => e.caseId === caseId),
      };
      _download(`${caseId}-export.json`, JSON.stringify(payload, null, 2), 'application/json');
      window.NotificationManager?.success('Exported', 'Case data exported as JSON.');
    });
    document.getElementById('df-rep-exec')?.addEventListener('click', () => {
      const caseId = document.getElementById('df-rep-case').value;
      _exportExecutiveReport(caseId);
    });
  }

  function _download(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function _exportExecutiveReport(caseId) {
    const c = findCase(caseId);
    if (!c) return;
    const notes = allNotes().filter(n => n.caseId === caseId);
    const evid  = allEvidence().filter(e => e.caseId === caseId);
    const events = allTimeline().filter(e => e.caseId === caseId).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Executive Report — ${esc(c.name)}</title>
      <style>body{font-family:-apple-system,sans-serif;max-width:960px;margin:40px auto;color:#0f172a;}
      table{width:100%;border-collapse:collapse;margin:16px 0;} th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:13px;}
      th{background:#f1f5f9;} h1{font-size:22px;} h2{font-size:16px;margin-top:32px;} .warn{background:#fef3c7;padding:10px;border-radius:6px;font-size:12px;}
      .meta{color:#64748b;font-size:13px;}</style></head><body>
      <h1>Executive Incident Report</h1>
      <div class="warn">⚠ Educational simulation — case data is synthetic and stored locally only.</div>
      <h2>${esc(c.name)}</h2>
      <p class="meta">Status: ${esc(c.status)} &middot; Severity: ${esc(c.severity)} &middot; Lead Investigator: ${esc(c.leadInvestigator)} &middot; Opened: ${esc(c.createdDate)}</p>
      <p>${esc(c.description)}</p>
      <h2>Incident Timeline (${events.length} events)</h2>
      <table><tr><th>Time</th><th>Type</th><th>Title</th><th>Description</th></tr>
      ${events.map(e => `<tr><td>${esc(e.timestamp)}</td><td>${esc((TYPE_META[e.type] || {}).label || e.type)}</td><td>${esc(e.title)}</td><td>${esc(e.description)}</td></tr>`).join('')}
      </table>
      <h2>Evidence &amp; Chain of Custody (${evid.length} items)</h2>
      <table><tr><th>Name</th><th>Type</th><th>Collected By</th><th>Date</th><th>Custody Entries</th></tr>
      ${evid.map(ev => `<tr><td>${esc(ev.name)}</td><td>${esc(ev.type)}</td><td>${esc(ev.collectedBy)}</td><td>${esc(ev.collectedDate)}</td><td>${ev.custodyLog.length}</td></tr>`).join('') || '<tr><td colspan="5">No evidence logged.</td></tr>'}
      </table>
      <h2>Investigator Notes (${notes.length})</h2>
      ${notes.map(n => `<p><strong>${esc(n.author)}</strong> <span class="meta">(${esc(n.date)})</span><br>${esc(n.text)}</p>`).join('') || '<p>No notes recorded.</p>'}
      <p class="meta" style="margin-top:24px;">Generated by Khan Security Solutions Enterprise · ${new Date().toLocaleString()}</p>
      </body></html>`;
    _download(`${caseId}-executive-report.html`, html, 'text/html');
    window.NotificationManager?.success('Report Generated', 'Executive report downloaded.');
  }

  // ══════════════════════════════════════════════════════════════════════
  // DETAIL PANEL
  // ══════════════════════════════════════════════════════════════════════
  function _openDetail(title, bodyHtml) {
    document.getElementById('df-detail-title').textContent = title;
    document.getElementById('df-detail-body').innerHTML = bodyHtml;
    document.getElementById('df-detail-overlay').classList.add('open');
  }
  function _closeDetail() { document.getElementById('df-detail-overlay').classList.remove('open'); }

  // ══════════════════════════════════════════════════════════════════════
  // PERSISTENCE
  // ══════════════════════════════════════════════════════════════════════
  function _loadCustomData() {
    if (!window.StorageManager) return;
    customCases    = window.StorageManager.lsGet('dfir_custom_cases', []) || [];
    customNotes     = window.StorageManager.lsGet('dfir_custom_notes', []) || [];
    customEvidence   = window.StorageManager.lsGet('dfir_custom_evidence', []) || [];
    customTimeline    = window.StorageManager.lsGet('dfir_custom_timeline', []) || [];
  }
  function _saveCustomData() {
    window.StorageManager?.lsSet('dfir_custom_cases', customCases);
    window.StorageManager?.lsSet('dfir_custom_notes', customNotes);
    window.StorageManager?.lsSet('dfir_custom_evidence', customEvidence);
    window.StorageManager?.lsSet('dfir_custom_timeline', customTimeline);
  }

  // ══════════════════════════════════════════════════════════════════════
  // GLOBAL SEARCH INTEGRATION
  // ══════════════════════════════════════════════════════════════════════
  function _registerSearch() {
    if (!window.SearchEngine) return;
    window.SearchEngine.register('DFIR Toolkit', [
      { title: 'DFIR Toolkit', meta: 'Cases, timeline, evidence, memory/disk analysis', route: 'dfir', keywords: 'dfir forensics incident response cases timeline evidence chain of custody memory disk' },
      ...SD().cases.map(c => ({ title: c.name, meta: `Case — ${c.status}`, route: 'dfir', keywords: `case ${c.name} ${c.status} ${c.leadInvestigator}` })),
    ]);
  }

  // ── Public API ─────────────────────────────────────────────────────────
  return { register };

})();

window.DFIR = DFIR;

if (window.Router) {
  DFIR.register();
} else {
  console.error('[DFIR] Router not found. Ensure router.js loads before dfir.js.');
}
