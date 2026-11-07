/**
 * KHAN SECURITY SOLUTIONS ENTERPRISE
 * Enterprise AI Security Assistant — Module v1.9.0 (Milestone 19)
 *
 * [EDUCATIONAL SIMULATION — OFFLINE DEMONSTRATION ONLY. No external AI API
 *  is ever called. Every response is assembled locally from curated
 *  templates, simple keyword/intent matching, and live counts read from
 *  this platform's own modules. Every assistant reply is labeled
 *  "Demonstration Mode (Offline AI Simulation)".]
 *
 * Layout: left sidebar (conversation history, pinned, saved prompts,
 * recent questions, favourite responses) + main chat panel (welcome
 * screen, message thread with markdown-style rendering, typing/thinking
 * indicator, input bar with slash-command autocomplete). Header actions:
 * New Conversation, Clear Chat, Export Conversation, Example Questions,
 * Knowledge Base (+ a Settings entry point).
 *
 * Integrates with:
 *   window.Router               — route: 'ai-assistant'
 *   window.SearchEngine         — searchable KB cards, prompts & the module itself
 *   window.NotificationManager  — Conversation Saved / Exported / Prompt Loaded / Chat Cleared
 *   window.StorageManager       — conversations, saved prompts, favourites, settings (localStorage)
 *   window.SampleAIData         — bundled offline dataset
 *   Reads (best-effort, if loaded) SampleIncidentData, SampleIOCData,
 *   SampleThreatIntel, SampleCaseData, SampleAssetData, SampleReportsData
 *   for live cross-module counts used inside simulated responses.
 */

const AIAssistant = (() => {

  // ── State ──────────────────────────────────────────────────────────────
  let mounted = false;

  let conversations = [];      // { id, title, pinned, messages: [{id,role,text,ts,favorite}], createdAt, updatedAt }
  let activeConvId = null;
  let savedPrompts = [];       // array of strings
  let favorites = [];          // { id, conversationId, messageId, text, ts }
  let settings = { typingSpeed: 'normal', responseLength: 'standard', showSuggestions: true, autoSave: true };

  let recentQuestions = [];    // derived, last 8 user messages across all convos
  let kbDetailId = null;       // knowledge base card currently expanded in modal
  let exportFormat = 'Markdown';
  let cmdMenuOpen = false;
  let cmdMenuIndex = 0;

  // ── Icons ──────────────────────────────────────────────────────────────
  const I = {
    sparkle: `<path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"/>`,
    plus: `<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>`,
    trash: `<path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>`,
    down: `<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>`,
    question: `<path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 17.25h.008v.008H12v-.008z"/>`,
    book: `<path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/>`,
    settings: `<path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>`,
    search: `<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z"/>`,
    star: `<path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 21.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/>`,
    pin: `<path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>`,
    send: `<path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/>`,
    copy: `<path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.75a2.25 2.25 0 011.907-2.185 48.208 48.208 0 011.927-.184"/>`,
    refresh: `<path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/>`,
    close: `<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>`,
    chevDown: `<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>`,
    chevLeft: `<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/>`,
    target: `<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m0 13.5V21m9-9h-2.25m-13.5 0H3m14.485-6.364l-1.591 1.591M6.227 17.773l-1.591 1.591m0-12.728l1.591 1.591m11.546 11.546l1.591 1.591M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"/>`,
    shield: `<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>`,
    check: `<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>`,
    bug: `<path stroke-linecap="round" stroke-linejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"/>`,
    key: `<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"/>`,
    flag: `<path stroke-linecap="round" stroke-linejoin="round" d="M3 3v18M3 4.5c2.5-1.333 5-1.333 7.5 0s5 1.333 7.5 0V13.5c-2.5 1.333-5 1.333-7.5 0s-5-1.333-7.5 0V4.5z"/>`,
    globe: `<path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"/>`,
    server: `<path stroke-linecap="round" stroke-linejoin="round" d="M21.75 17.25v-.228a4.5 4.5 0 00-.12-1.03l-2.268-9.64a3.375 3.375 0 00-3.285-2.602H7.923a3.375 3.375 0 00-3.285 2.602l-2.268 9.64a4.5 4.5 0 00-.12 1.03v.228m19.5 0a3 3 0 01-3 3H5.25a3 3 0 01-3-3m19.5 0a3 3 0 00-3-3H5.25a3 3 0 00-3 3m16.5 0h.008v.008h-.008v-.008zm-3 0h.008v.008h-.008v-.008z"/>`,
    user: `<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>`,
  };
  function svg(name, cls = '') { return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">${I[name] || I.sparkle}</svg>`; }
  function esc(s) { const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function _truncate(s, n) { s = String(s); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
  function _uid(prefix) { return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`; }

  const AD = () => window.SampleAIData || { EXAMPLE_QUESTIONS: [], SMART_COMMANDS: [], PROMPT_LIBRARY: [], KNOWLEDGE_BASE: [], MITRE_LIBRARY: {}, CURATED_RESPONSES: {}, INTENTS: [], SAMPLE_QA: [] };

  // ══════════════════════════════════════════════════════════════════════
  // REGISTRATION
  // ══════════════════════════════════════════════════════════════════════
  function register() { window.Router.register('ai-assistant', { title: 'AI Assistant', init, render }); }

  function init() {
    _loadPersisted();
    _registerSearch();
  }

  function render() {
    const el = document.getElementById('page-ai-assistant');
    if (!el) return;
    if (!mounted) {
      el.innerHTML = _buildShell();
      mounted = true;
      _wireAll();
      if (!activeConvId && conversations.length) activeConvId = conversations[0].id;
      _renderSidebar();
      _renderChat();
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  // PERSISTENCE
  // ══════════════════════════════════════════════════════════════════════
  function _loadPersisted() {
    conversations = window.StorageManager?.lsGet('ai_conversations', []) || [];
    savedPrompts = window.StorageManager?.lsGet('ai_saved_prompts', []) || [];
    favorites = window.StorageManager?.lsGet('ai_favorites', []) || [];
    settings = { ...settings, ...(window.StorageManager?.lsGet('ai_settings', {}) || {}) };
    _rebuildRecentQuestions();
  }
  function _persistConversations() { window.StorageManager?.lsSet('ai_conversations', conversations); }
  function _persistPrompts() { window.StorageManager?.lsSet('ai_saved_prompts', savedPrompts); }
  function _persistFavorites() { window.StorageManager?.lsSet('ai_favorites', favorites); }
  function _persistSettings() { window.StorageManager?.lsSet('ai_settings', settings); }

  function _rebuildRecentQuestions() {
    const all = [];
    conversations.forEach(c => c.messages.filter(m => m.role === 'user').forEach(m => all.push({ text: m.text, ts: m.ts })));
    all.sort((a, b) => b.ts - a.ts);
    recentQuestions = all.slice(0, 8);
  }

  function _registerSearch() {
    const items = [
      { title: 'Enterprise AI Security Assistant', meta: 'AI Copilot • Demonstration', route: 'ai-assistant', keywords: 'AI Copilot assistant MITRE incident threat report IOC case chat', icon: 'sparkle' },
      ...AD().KNOWLEDGE_BASE.map(k => ({ title: k.title, meta: `Knowledge Base • ${k.category}`, route: 'ai-assistant', keywords: `${k.title} ${k.summary}`, icon: k.icon })),
    ];
    window.SearchEngine?.register('AI Assistant', items);
  }

  // ══════════════════════════════════════════════════════════════════════
  // SHELL
  // ══════════════════════════════════════════════════════════════════════
  function _buildShell() {
    return `
    <div class="aia-shell">
      <div class="aia-header">
        <div>
          <div class="aia-header-title">${svg('sparkle')} Enterprise AI Security Assistant <span class="aia-demo-badge">Demonstration Mode</span></div>
          <div class="aia-header-sub">Offline AI-powered cybersecurity assistant for SOC analysts, incident responders, and security managers.</div>
        </div>
        <div class="aia-header-actions">
          <button class="btn btn-primary btn-sm" id="aia-btn-new">${svg('plus')} New Conversation</button>
          <button class="btn btn-secondary btn-sm" id="aia-btn-clear">${svg('trash')} Clear Chat</button>
          <button class="btn btn-secondary btn-sm" id="aia-btn-export">${svg('down')} Export Conversation</button>
          <button class="btn btn-secondary btn-sm" id="aia-btn-examples">${svg('question')} Example Questions</button>
          <button class="btn btn-secondary btn-sm" id="aia-btn-kb">${svg('book')} Knowledge Base</button>
          <button class="btn-icon btn-sm" id="aia-btn-settings" title="Assistant Settings">${svg('settings')}</button>
        </div>
      </div>

      <div class="aia-layout">
        <div class="card aia-sidebar">
          <div class="aia-sidebar-search"><input type="text" class="form-input" id="aia-conv-search" placeholder="Search conversations…" /></div>
          <div class="aia-sidebar-group" data-group="pinned"><div class="aia-sidebar-group-title">${svg('chevDown')} Pinned Conversations</div><div class="aia-sidebar-group-body" id="aia-group-pinned"></div></div>
          <div class="aia-sidebar-group" data-group="history"><div class="aia-sidebar-group-title">${svg('chevDown')} Conversation History</div><div class="aia-sidebar-group-body" id="aia-group-history"></div></div>
          <div class="aia-sidebar-group" data-group="prompts"><div class="aia-sidebar-group-title">${svg('chevDown')} Saved Prompts</div><div class="aia-sidebar-group-body" id="aia-group-prompts"></div></div>
          <div class="aia-sidebar-group" data-group="recent"><div class="aia-sidebar-group-title">${svg('chevDown')} Recent Questions</div><div class="aia-sidebar-group-body" id="aia-group-recent"></div></div>
          <div class="aia-sidebar-group" data-group="favorites"><div class="aia-sidebar-group-title">${svg('chevDown')} Favourite Responses</div><div class="aia-sidebar-group-body" id="aia-group-favorites"></div></div>
        </div>

        <div class="card aia-main">
          <div class="aia-messages" id="aia-messages"></div>
          <div class="aia-input-bar">
            <div class="aia-input-row">
              <textarea id="aia-input" rows="1" placeholder="Ask about incidents, IOCs, MITRE techniques, or type / for commands…"></textarea>
              <div class="aia-send-btn" id="aia-send-btn" title="Send">${svg('send')}</div>
            </div>
            <div class="aia-input-hint">
              <span>Type <code>/</code> for smart commands · Enter to send · Shift+Enter for a new line</span>
              <span class="aia-demo-badge">Offline AI Simulation</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    ${_buildKbModal()}
    ${_buildLibraryModal()}
    ${_buildExportModal()}
    ${_buildSettingsModal()}
    `;
  }

  function _wireAll() {
    document.getElementById('aia-btn-new')?.addEventListener('click', _newConversation);
    document.getElementById('aia-btn-clear')?.addEventListener('click', _clearChat);
    document.getElementById('aia-btn-export')?.addEventListener('click', _openExportModal);
    document.getElementById('aia-btn-examples')?.addEventListener('click', _openLibraryModal);
    document.getElementById('aia-btn-kb')?.addEventListener('click', _openKbModal);
    document.getElementById('aia-btn-settings')?.addEventListener('click', _openSettingsModal);

    document.getElementById('aia-conv-search')?.addEventListener('input', _renderSidebar);
    document.querySelectorAll('#page-aia-assistant .aia-sidebar-group-title').forEach(t => t.addEventListener('click', () => t.closest('.aia-sidebar-group').classList.toggle('collapsed')));

    const input = document.getElementById('aia-input');
    input?.addEventListener('input', () => { _autoGrow(input); _handleCmdMenu(input); });
    input?.addEventListener('keydown', _handleInputKeydown);
    document.getElementById('aia-send-btn')?.addEventListener('click', _handleSend);

    _wireKbModal();
    _wireLibraryModal();
    _wireExportModal();
    _wireSettingsModal();
  }

  function _autoGrow(el) { el.style.height = 'auto'; el.style.height = Math.min(140, el.scrollHeight) + 'px'; }

  // ══════════════════════════════════════════════════════════════════════
  // CONVERSATIONS
  // ══════════════════════════════════════════════════════════════════════
  function _getActiveConv() { return conversations.find(c => c.id === activeConvId) || null; }

  function _newConversation() {
    const conv = { id: _uid('conv'), title: 'New Conversation', pinned: false, messages: [], createdAt: Date.now(), updatedAt: Date.now() };
    conversations.unshift(conv);
    activeConvId = conv.id;
    if (settings.autoSave) _persistConversations();
    _renderSidebar();
    _renderChat();
  }

  function _clearChat() {
    const conv = _getActiveConv();
    if (!conv) { window.NotificationManager?.info('Nothing to Clear', 'Start a conversation first.'); return; }
    conv.messages = [];
    conv.updatedAt = Date.now();
    if (settings.autoSave) _persistConversations();
    _rebuildRecentQuestions();
    _renderSidebar();
    _renderChat();
    window.NotificationManager?.success('Chat Cleared', 'The current conversation has been cleared.');
  }

  function _switchConv(id) { activeConvId = id; _renderSidebar(); _renderChat(); }

  function _deleteConv(id) {
    conversations = conversations.filter(c => c.id !== id);
    if (activeConvId === id) activeConvId = conversations[0]?.id || null;
    if (settings.autoSave) _persistConversations();
    _rebuildRecentQuestions();
    _renderSidebar();
    _renderChat();
  }

  function _togglePin(id) {
    const conv = conversations.find(c => c.id === id); if (!conv) return;
    conv.pinned = !conv.pinned;
    if (settings.autoSave) _persistConversations();
    _renderSidebar();
  }

  function _renderSidebar() {
    const q = (document.getElementById('aia-conv-search')?.value || '').toLowerCase();
    const matches = (c) => !q || c.title.toLowerCase().includes(q) || c.messages.some(m => m.text.toLowerCase().includes(q));

    const pinned = conversations.filter(c => c.pinned && matches(c));
    const history = conversations.filter(c => !c.pinned && matches(c));

    document.getElementById('aia-group-pinned').innerHTML = pinned.length ? pinned.map(_convItemHtml).join('') : `<div class="aia-sidebar-empty">No pinned conversations.</div>`;
    document.getElementById('aia-group-history').innerHTML = history.length ? history.map(_convItemHtml).join('') : `<div class="aia-sidebar-empty">No conversations yet.</div>`;
    document.getElementById('aia-group-prompts').innerHTML = savedPrompts.length ? savedPrompts.map((p, i) => `<div class="aia-prompt-chip" data-prompt-idx="${i}">${esc(_truncate(p, 60))}</div>`).join('') : `<div class="aia-sidebar-empty">No saved prompts. Save one from the Prompt Library.</div>`;
    document.getElementById('aia-group-recent').innerHTML = recentQuestions.length ? recentQuestions.map(r => `<div class="aia-recent-chip" data-recent="${esc(r.text)}">${esc(_truncate(r.text, 60))}</div>`).join('') : `<div class="aia-sidebar-empty">Ask something to get started.</div>`;
    document.getElementById('aia-group-favorites').innerHTML = favorites.length ? favorites.map(f => `<div class="aia-fav-chip" data-fav-conv="${f.conversationId}">${esc(_truncate(f.text, 60))}</div>`).join('') : `<div class="aia-sidebar-empty">Star a response to save it here.</div>`;

    document.querySelectorAll('.aia-conv-item').forEach(item => {
      item.addEventListener('click', (e) => { if (e.target.closest('.aia-conv-actions')) return; _switchConv(item.dataset.conv); });
    });
    document.querySelectorAll('.aia-pin-icon').forEach(el => el.addEventListener('click', (e) => { e.stopPropagation(); _togglePin(el.dataset.conv); }));
    document.querySelectorAll('.aia-del-icon').forEach(el => el.addEventListener('click', (e) => { e.stopPropagation(); _deleteConv(el.dataset.conv); }));
    document.querySelectorAll('.aia-prompt-chip').forEach(el => el.addEventListener('click', () => _sendMessage(savedPrompts[parseInt(el.dataset.promptIdx, 10)])));
    document.querySelectorAll('.aia-recent-chip').forEach(el => el.addEventListener('click', () => _sendMessage(el.dataset.recent)));
    document.querySelectorAll('.aia-fav-chip').forEach(el => el.addEventListener('click', () => _switchConv(el.dataset.favConv)));
  }

  function _convItemHtml(c) {
    return `<div class="aia-conv-item ${c.id === activeConvId ? 'active' : ''}" data-conv="${c.id}">
      <span class="aia-conv-title">${esc(c.title)}</span>
      <div class="aia-conv-actions">
        <span class="aia-pin-icon ${c.pinned ? 'pinned' : ''}" data-conv="${c.id}" title="Pin">${svg('pin')}</span>
        <span class="aia-del-icon" data-conv="${c.id}" title="Delete">${svg('trash')}</span>
      </div>
    </div>`;
  }

  // ══════════════════════════════════════════════════════════════════════
  // CHAT RENDERING
  // ══════════════════════════════════════════════════════════════════════
  function _renderChat() {
    const box = document.getElementById('aia-messages'); if (!box) return;
    const conv = _getActiveConv();
    if (!conv || conv.messages.length === 0) { box.innerHTML = _buildWelcome(); _wireWelcome(); return; }
    box.innerHTML = conv.messages.map(_messageHtml).join('');
    _wireMessageActions();
    box.scrollTop = box.scrollHeight;
  }

  function _buildWelcome() {
    const showEx = settings.showSuggestions;
    return `<div class="aia-welcome">
      <div class="aia-welcome-icon">${svg('sparkle')}</div>
      <div class="aia-welcome-title">How can I help with security today?</div>
      <div class="aia-welcome-sub">Ask about incidents, IOCs, MITRE ATT&CK techniques, executive reporting, or SOC workflows. Everything runs offline against this platform's own demonstration data.</div>
      ${showEx ? `<div class="aia-example-grid" id="aia-welcome-examples">${AD().EXAMPLE_QUESTIONS.map(q => `<div class="aia-example-chip" data-q="${esc(q)}">${esc(q)}</div>`).join('')}</div>` : ''}
    </div>`;
  }
  function _wireWelcome() {
    document.querySelectorAll('#aia-welcome-examples .aia-example-chip').forEach(chip => chip.addEventListener('click', () => _sendMessage(chip.dataset.q)));
  }

  function _messageHtml(m) {
    const time = new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (m.role === 'user') {
      return `<div class="aia-msg user" data-msg="${m.id}">
        <div class="aia-msg-avatar">${svg('user')}</div>
        <div class="aia-msg-body">
          <div class="aia-bubble">${_renderMarkdown(m.text)}</div>
          <div class="aia-msg-meta">${time}</div>
        </div>
      </div>`;
    }
    return `<div class="aia-msg assistant" data-msg="${m.id}">
      <div class="aia-msg-avatar">${svg('sparkle')}</div>
      <div class="aia-msg-body">
        <div class="aia-bubble">${_renderMarkdown(m.text)}</div>
        <div class="aia-msg-meta">
          ${time} · <span class="aia-demo-badge" style="padding:1px 6px">Demonstration Mode (Offline AI Simulation)</span>
          <div class="aia-msg-actions">
            <span class="aia-act-copy" data-msg="${m.id}" title="Copy">${svg('copy')}</span>
            <span class="aia-act-regen" data-msg="${m.id}" title="Regenerate response (Demo)">${svg('refresh')}</span>
            <span class="aia-act-fav ${m.favorite ? 'active' : ''}" data-msg="${m.id}" title="Bookmark">${svg('star')}</span>
          </div>
        </div>
      </div>
    </div>`;
  }

  function _wireMessageActions() {
    document.querySelectorAll('.aia-act-copy').forEach(el => el.addEventListener('click', () => _copyMessage(el.dataset.msg)));
    document.querySelectorAll('.aia-act-regen').forEach(el => el.addEventListener('click', () => _regenerateMessage(el.dataset.msg)));
    document.querySelectorAll('.aia-act-fav').forEach(el => el.addEventListener('click', () => _toggleFavorite(el.dataset.msg)));
  }

  function _copyMessage(msgId) {
    const conv = _getActiveConv(); if (!conv) return;
    const msg = conv.messages.find(m => m.id === msgId); if (!msg) return;
    navigator.clipboard?.writeText(msg.text).then(() => window.NotificationManager?.success('Copied', 'Response copied to clipboard.'));
  }

  function _toggleFavorite(msgId) {
    const conv = _getActiveConv(); if (!conv) return;
    const msg = conv.messages.find(m => m.id === msgId); if (!msg) return;
    msg.favorite = !msg.favorite;
    if (msg.favorite) favorites.unshift({ id: _uid('fav'), conversationId: conv.id, messageId: msg.id, text: msg.text, ts: Date.now() });
    else favorites = favorites.filter(f => f.messageId !== msgId);
    _persistFavorites();
    if (settings.autoSave) _persistConversations();
    _renderSidebar();
    _renderChat();
  }

  function _regenerateMessage(msgId) {
    const conv = _getActiveConv(); if (!conv) return;
    const idx = conv.messages.findIndex(m => m.id === msgId); if (idx < 1) return;
    const priorUser = [...conv.messages.slice(0, idx)].reverse().find(m => m.role === 'user');
    if (!priorUser) return;
    const box = document.getElementById('aia-messages');
    _showThinking(box);
    setTimeout(() => {
      _hideThinking(box);
      const variants = ["Here's an updated take:\n\n", 'Regenerated response:\n\n', ''];
      const text = _pickRandom(variants) + _generateResponse(priorUser.text);
      conv.messages[idx] = { ...conv.messages[idx], text, ts: Date.now(), favorite: false };
      if (settings.autoSave) _persistConversations();
      _renderChat();
    }, _thinkingDelay());
  }

  function _pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  // ══════════════════════════════════════════════════════════════════════
  // SENDING / SIMULATED RESPONSE ENGINE
  // ══════════════════════════════════════════════════════════════════════
  function _handleSend() {
    const input = document.getElementById('aia-input');
    const text = (input.value || '').trim();
    if (!text) return;
    input.value = ''; _autoGrow(input); cmdMenuOpen = false; _renderCmdMenu();
    _sendMessage(text);
  }

  function _handleInputKeydown(e) {
    if (cmdMenuOpen) {
      const rows = document.querySelectorAll('.aia-cmd-row');
      if (e.key === 'ArrowDown') { e.preventDefault(); cmdMenuIndex = Math.min(rows.length - 1, cmdMenuIndex + 1); _renderCmdMenu(); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); cmdMenuIndex = Math.max(0, cmdMenuIndex - 1); _renderCmdMenu(); return; }
      if (e.key === 'Tab' || (e.key === 'Enter' && rows.length)) { e.preventDefault(); _applyCmdSelection(); return; }
      if (e.key === 'Escape') { cmdMenuOpen = false; _renderCmdMenu(); return; }
    }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); _handleSend(); }
  }

  function _handleCmdMenu(input) {
    const val = input.value;
    if (val.startsWith('/') && !val.includes(' ')) { cmdMenuOpen = true; cmdMenuIndex = 0; _renderCmdMenu(val.slice(1).toLowerCase()); }
    else { cmdMenuOpen = false; _renderCmdMenu(); }
  }

  function _renderCmdMenu(filter = '') {
    const bar = document.querySelector('.aia-input-bar');
    let menu = document.getElementById('aia-cmd-menu');
    if (!cmdMenuOpen) { menu?.remove(); return; }
    const matches = AD().SMART_COMMANDS.filter(c => c.cmd.slice(1).startsWith(filter));
    if (!matches.length) { menu?.remove(); return; }
    if (!menu) { menu = document.createElement('div'); menu.id = 'aia-cmd-menu'; menu.className = 'aia-cmd-menu'; bar.appendChild(menu); }
    menu.innerHTML = matches.map((c, i) => `<div class="aia-cmd-row ${i === cmdMenuIndex ? 'active' : ''}" data-cmd="${c.cmd}"><code>${c.cmd}</code><span>${esc(c.desc)}</span></div>`).join('');
    menu.querySelectorAll('.aia-cmd-row').forEach(row => row.addEventListener('click', () => { document.getElementById('aia-input').value = row.dataset.cmd + ' '; cmdMenuOpen = false; _renderCmdMenu(); document.getElementById('aia-input').focus(); }));
  }
  function _applyCmdSelection() {
    const rows = document.querySelectorAll('.aia-cmd-row');
    if (!rows.length) return;
    const cmd = rows[cmdMenuIndex]?.dataset.cmd || rows[0].dataset.cmd;
    document.getElementById('aia-input').value = cmd + ' ';
    cmdMenuOpen = false; _renderCmdMenu();
    document.getElementById('aia-input').focus();
  }

  function _thinkingDelay() { return { slow: 1600, normal: 900, fast: 400 }[settings.typingSpeed] || 900; }

  function _sendMessage(text) {
    if (!text || !text.trim()) return;
    let conv = _getActiveConv();
    if (!conv) { conv = { id: _uid('conv'), title: 'New Conversation', pinned: false, messages: [], createdAt: Date.now(), updatedAt: Date.now() }; conversations.unshift(conv); activeConvId = conv.id; }
    if (conv.messages.length === 0) conv.title = _truncate(text, 42);

    const userMsg = { id: _uid('msg'), role: 'user', text, ts: Date.now(), favorite: false };
    conv.messages.push(userMsg);
    conv.updatedAt = Date.now();
    recentQuestions.unshift({ text, ts: Date.now() });
    recentQuestions = recentQuestions.slice(0, 8);
    if (settings.autoSave) _persistConversations();
    _renderSidebar();
    _renderChat();

    const box = document.getElementById('aia-messages');
    _showThinking(box);
    setTimeout(() => {
      _hideThinking(box);
      const responseText = _generateResponse(text);
      const asstMsg = { id: _uid('msg'), role: 'assistant', text: responseText, ts: Date.now(), favorite: false };
      conv.messages.push(asstMsg);
      conv.updatedAt = Date.now();
      if (settings.autoSave) _persistConversations();
      _renderChat();
    }, _thinkingDelay());
  }

  function _showThinking(box) {
    if (!box) return;
    const el = document.createElement('div');
    el.className = 'aia-thinking'; el.id = 'aia-thinking-indicator';
    el.innerHTML = `<span class="aia-thinking-dot"></span><span class="aia-thinking-dot"></span><span class="aia-thinking-dot"></span>`;
    box.appendChild(el); box.scrollTop = box.scrollHeight;
  }
  function _hideThinking() { document.getElementById('aia-thinking-indicator')?.remove(); }

  // ── Response generation ──────────────────────────────────────────────
  function _liveOrFallback(fn, fallback) { try { const v = fn(); return (v === null || v === undefined || Number.isNaN(v)) ? fallback : v; } catch (e) { return fallback; } }

  function _liveStats() {
    const kpi = (window.SampleReportsData && window.SampleReportsData.KPI) || {};
    const incidents = window.SampleIncidentData?.incidents;
    const openIncidents = _liveOrFallback(() => incidents ? incidents.filter(i => i.status !== 'Resolved' && i.status !== 'Closed').length : null, kpi.openIncidents ?? 14);
    const criticalIncidents = _liveOrFallback(() => incidents ? incidents.filter(i => /critical/i.test(i.severity || '')).length : null, Math.max(1, Math.round(openIncidents * 0.3)));
    const topIncidentCategory = _liveOrFallback(() => {
      if (!incidents || !incidents.length) return null;
      const counts = {}; incidents.forEach(i => { counts[i.category] = (counts[i.category] || 0) + 1; });
      return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    }, 'Phishing');
    return {
      securityScore: kpi.securityScore ?? 78,
      riskIndex: kpi.riskIndex ?? 32,
      criticalAssets: _liveOrFallback(() => window.SampleAssetData?.assets?.filter(a => /critical/i.test(a.criticality || '')).length, kpi.criticalAssets ?? 37),
      totalAssets: _liveOrFallback(() => window.SampleAssetData?.assets?.length, kpi.totalAssets ?? 642),
      openIncidents, criticalIncidents, topIncidentCategory,
      iocCount: _liveOrFallback(() => window.SampleIOCData?.iocs?.length, kpi.threatIntelIOCs ?? 1284),
      actorCount: _liveOrFallback(() => window.SampleThreatIntel?.actors?.length, 12),
      caseCount: _liveOrFallback(() => window.SampleCaseData?.cases?.length, kpi.activeCases ?? 22),
    };
  }

  function _resolveTokens(text) {
    const s = _liveStats();
    return text.replace(/\{\{(\w+)\}\}/g, (m, key) => (key in s ? s[key] : m));
  }

  function _matchMitreId(text) {
    const m = text.toUpperCase().match(/T\d{4}(\.\d{3})?/);
    return m ? m[0].split('.')[0] : null;
  }

  function _mitreResponse(id) {
    const lib = AD().MITRE_LIBRARY;
    const entry = lib[id];
    if (!entry) {
      const examples = Object.keys(lib).slice(0, 5).join(', ');
      return `**MITRE ATT&CK Lookup — Offline Demonstration**\n\nI don't have technique **${id}** in this offline reference library. Try one of: ${examples}.`;
    }
    return `**${id} — ${entry.name}**\n\n- **Tactic:** ${entry.tactic}\n- **Summary:** ${entry.desc}\n\nThis is a simulated explanation from the offline MITRE reference bundled with this demo.`;
  }

  function _scoreKeywords(text, keywords) {
    const lower = text.toLowerCase();
    return keywords.reduce((score, kw) => score + (lower.includes(kw.toLowerCase()) ? kw.split(' ').length : 0), 0);
  }

  function _generateResponse(rawText) {
    const text = rawText.trim();

    // Smart / slash commands
    if (text.startsWith('/')) return _handleSmartCommand(text);

    // Exact curated welcome-example match
    const curated = AD().CURATED_RESPONSES[text] || Object.entries(AD().CURATED_RESPONSES).find(([q]) => q.toLowerCase() === text.toLowerCase())?.[1];
    if (curated) return _resolveTokens(curated);

    // MITRE technique id anywhere in the message
    const mitreId = _matchMitreId(text);
    if (mitreId) return _mitreResponse(mitreId);

    // Score against defined intents
    let best = null, bestScore = 0;
    AD().INTENTS.forEach(intent => {
      if (!intent.response) return;
      const score = _scoreKeywords(text, intent.keywords);
      if (score > bestScore) { bestScore = score; best = intent; }
    });
    if (best) return _resolveTokens(best.response);

    // Fall back to nearest sample Q&A pair by shared significant words
    const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    let bestQA = null, bestQAScore = 0;
    AD().SAMPLE_QA.forEach(qa => {
      const qWords = qa.prompt.toLowerCase().split(/\W+/);
      const score = words.filter(w => qWords.includes(w)).length;
      if (score > bestQAScore) { bestQAScore = score; bestQA = qa; }
    });
    if (bestQA && bestQAScore > 0) return bestQA.response;

    // Generic fallback
    return `**Offline AI Simulation**\n\nI wasn't able to match that to a supported task with high confidence. Try one of the example questions, a smart command like \`/summary\` or \`/mitre T1059\`, or browse the Knowledge Base and Prompt Library for ideas.\n\n- ${AD().EXAMPLE_QUESTIONS.slice(0, 4).join('\n- ')}`;
  }

  function _handleSmartCommand(raw) {
    const [cmdRaw, ...rest] = raw.trim().split(/\s+/);
    const cmd = cmdRaw.toLowerCase();
    const arg = rest.join(' ').trim();
    const s = _liveStats();

    switch (cmd) {
      case '/summary':
        return `**Cross-Module Summary — Offline Demonstration**\n\n| Metric | Value |\n|---|---|\n| Security Score | ${s.securityScore} / 100 |\n| Open Incidents | ${s.openIncidents} |\n| Critical Assets | ${s.criticalAssets} / ${s.totalAssets} |\n| Tracked IOCs | ${s.iocCount} |\n| Active Cases | ${s.caseCount} |\n| Risk Index | ${s.riskIndex} / 100 |`;
      case '/incidents':
        return `**Open Incidents — Offline Demonstration**\n\n${s.openIncidents} open incidents are tracked, ${s.criticalIncidents} of which are critical. Top category: **${s.topIncidentCategory}**.\n\nOpen **Incident Response** to review individual records.`;
      case '/assets':
        return `**Critical Assets — Offline Demonstration**\n\n${s.criticalAssets} of ${s.totalAssets} tracked assets are marked Critical criticality. Open **Asset Inventory** filtered by criticality for details.`;
      case '/iocs':
        return `**Indicators of Compromise — Offline Demonstration**\n\n${s.iocCount} indicators are tracked in IOC Manager across hash, IP, domain, and URL types.`;
      case '/cases':
        return `**Active Cases — Offline Demonstration**\n\n${s.caseCount} cases are currently tracked in Case Manager, each with a task board and evidence list.`;
      case '/reports': {
        const reports = window.SampleReportsData?.REPORTS || [];
        const recent = reports.slice(0, 5).map(r => `- ${r.name} (${r.status})`).join('\n');
        return `**Recent Reports — Offline Demonstration**\n\n${recent || 'No reports available yet — try generating one in the Reporting Center.'}`;
      }
      case '/help':
        return `**Help Center — Offline Demonstration**\n\nOpen the **Help Center** from the sidebar for documentation, a 100+ item FAQ, tutorials, and keyboard shortcuts.`;
      case '/search':
        return arg
          ? `**Search — Offline Demonstration**\n\nUse the global search (top bar) for "${arg}" — it checks every module including cases, incidents, IOCs, assets, reports, and documentation.`
          : `**Search — Offline Demonstration**\n\nType \`/search <term>\` or use the global search icon in the top bar to look across every module at once.`;
      case '/settings':
        _openSettingsModal();
        return `**Assistant Settings — Offline Demonstration**\n\nOpening the Assistant Settings panel now.`;
      case '/mitre':
        return arg ? _mitreResponse(_matchMitreId(arg) || arg.toUpperCase()) : `**MITRE ATT&CK Lookup — Offline Demonstration**\n\nUsage: \`/mitre T1059\`. Try: ${Object.keys(AD().MITRE_LIBRARY).slice(0, 5).join(', ')}.`;
      case '/threats':
        return `**Threat Intelligence Summary — Offline Demonstration**\n\n${s.actorCount} threat actor profiles are tracked, each mapped to campaigns and MITRE ATT&CK techniques. Open **Threat Intelligence** for details.`;
      default:
        return `**Unknown Command — Offline Demonstration**\n\n\`${cmd}\` isn't a recognized smart command. Available commands: ${AD().SMART_COMMANDS.map(c => `\`${c.cmd}\``).join(', ')}.`;
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  // MARKDOWN-STYLE RENDERING
  // ══════════════════════════════════════════════════════════════════════
  function _mdInline(s) {
    s = esc(s);
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    return s;
  }
  function _renderTable(lines) {
    const parseRow = (l) => l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
    if (lines.length < 2) return '';
    const header = parseRow(lines[0]);
    const rows = lines.slice(2).map(parseRow);
    return `<table class="aia-table"><thead><tr>${header.map(h => `<th>${_mdInline(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${_mdInline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }
  function _renderMarkdown(raw) {
    const lines = String(raw).split('\n');
    let html = ''; let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (line.trim().startsWith('```')) {
        const codeLines = []; i++;
        while (i < lines.length && !lines[i].trim().startsWith('```')) { codeLines.push(lines[i]); i++; }
        i++;
        html += `<pre class="aia-code-block"><code>${esc(codeLines.join('\n'))}</code></pre>`;
        continue;
      }
      if (line.trim().startsWith('|')) {
        const tableLines = [];
        while (i < lines.length && lines[i].trim().startsWith('|')) { tableLines.push(lines[i]); i++; }
        html += _renderTable(tableLines);
        continue;
      }
      if (/^[-*]\s+/.test(line.trim())) {
        const items = [];
        while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) { items.push(lines[i].trim().replace(/^[-*]\s+/, '')); i++; }
        html += `<ul class="aia-list">${items.map(it => `<li>${_mdInline(it)}</li>`).join('')}</ul>`;
        continue;
      }
      if (/^\d+\.\s+/.test(line.trim())) {
        const items = [];
        while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) { items.push(lines[i].trim().replace(/^\d+\.\s+/, '')); i++; }
        html += `<ol class="aia-list">${items.map(it => `<li>${_mdInline(it)}</li>`).join('')}</ol>`;
        continue;
      }
      if (line.trim() === '') { i++; continue; }
      const paraLines = [];
      while (i < lines.length && lines[i].trim() !== '' && !lines[i].trim().startsWith('```') && !lines[i].trim().startsWith('|') && !/^[-*]\s+/.test(lines[i].trim()) && !/^\d+\.\s+/.test(lines[i].trim())) {
        paraLines.push(lines[i]); i++;
      }
      html += `<p>${paraLines.map(_mdInline).join('<br>')}</p>`;
    }
    return html;
  }

  // ══════════════════════════════════════════════════════════════════════
  // KNOWLEDGE BASE MODAL
  // ══════════════════════════════════════════════════════════════════════
  function _buildKbModal() {
    return `<div class="modal-overlay aia-modal-lg" id="aia-kb-modal">
      <div class="modal">
        <div class="modal-header"><span class="modal-title">Knowledge Base</span><button class="modal-close" id="aia-kb-close">${svg('close')}</button></div>
        <div class="modal-body">
          <input type="text" class="form-input aia-kb-search" id="aia-kb-search" placeholder="Search MITRE, NIST, Zero Trust, Cloud Security…" />
          <div id="aia-kb-content"></div>
        </div>
      </div>
    </div>`;
  }
  function _openKbModal() { kbDetailId = null; document.getElementById('aia-kb-modal').classList.add('open'); _renderKbContent(); }
  function _wireKbModal() {
    document.getElementById('aia-kb-close')?.addEventListener('click', () => document.getElementById('aia-kb-modal').classList.remove('open'));
    document.getElementById('aia-kb-search')?.addEventListener('input', _renderKbContent);
  }
  function _renderKbContent() {
    const box = document.getElementById('aia-kb-content'); if (!box) return;
    if (kbDetailId) {
      const card = AD().KNOWLEDGE_BASE.find(k => k.id === kbDetailId);
      if (!card) { kbDetailId = null; return _renderKbContent(); }
      box.innerHTML = `<div class="aia-kb-back" id="aia-kb-back">${svg('chevLeft')} Back to Knowledge Base</div>
        <div class="aia-kb-icon">${svg(card.icon)}</div>
        <div class="aia-kb-cat">${esc(card.category)}</div>
        <h3 style="margin:4px 0 10px;color:var(--text-primary)">${esc(card.title)}</h3>
        <div class="aia-kb-detail">${esc(card.body)}</div>`;
      document.getElementById('aia-kb-back')?.addEventListener('click', () => { kbDetailId = null; _renderKbContent(); });
      return;
    }
    const q = (document.getElementById('aia-kb-search')?.value || '').toLowerCase();
    const list = AD().KNOWLEDGE_BASE.filter(k => !q || `${k.title} ${k.summary} ${k.category}`.toLowerCase().includes(q));
    box.innerHTML = `<div class="aia-kb-grid">${list.map(k => `
      <div class="aia-kb-card" data-kb="${k.id}">
        <div class="aia-kb-icon">${svg(k.icon)}</div>
        <div class="aia-kb-cat">${esc(k.category)}</div>
        <div class="aia-kb-title">${esc(k.title)}</div>
        <div class="aia-kb-summary">${esc(_truncate(k.summary, 90))}</div>
      </div>`).join('') || `<div class="empty-state"><div class="empty-state-title">No matches</div></div>`}</div>`;
    box.querySelectorAll('.aia-kb-card').forEach(card => card.addEventListener('click', () => { kbDetailId = card.dataset.kb; _renderKbContent(); }));
  }

  // ══════════════════════════════════════════════════════════════════════
  // EXAMPLE QUESTIONS / PROMPT LIBRARY MODAL
  // ══════════════════════════════════════════════════════════════════════
  function _buildLibraryModal() {
    return `<div class="modal-overlay aia-modal-lg" id="aia-lib-modal">
      <div class="modal">
        <div class="modal-header"><span class="modal-title">Example Questions & Prompt Library</span><button class="modal-close" id="aia-lib-close">${svg('close')}</button></div>
        <div class="modal-body" id="aia-lib-content"></div>
      </div>
    </div>`;
  }
  function _openLibraryModal() {
    document.getElementById('aia-lib-modal').classList.add('open');
    const box = document.getElementById('aia-lib-content');
    box.innerHTML = `
      <div class="aia-lib-group">
        <div class="aia-lib-group-title">Example Questions</div>
        ${AD().EXAMPLE_QUESTIONS.map(q => `<div class="aia-lib-prompt" data-q="${esc(q)}"><span>${esc(q)}</span>${svg('star', 'aia-lib-save')}</div>`).join('')}
      </div>
      ${AD().PROMPT_LIBRARY.map(g => `<div class="aia-lib-group"><div class="aia-lib-group-title">${esc(g.category)}</div>${g.prompts.map(p => `<div class="aia-lib-prompt" data-q="${esc(p)}"><span>${esc(p)}</span>${svg('star', 'aia-lib-save')}</div>`).join('')}</div>`).join('')}
    `;
    box.querySelectorAll('.aia-lib-prompt').forEach(row => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('.aia-lib-save')) return;
        document.getElementById('aia-lib-modal').classList.remove('open');
        _sendMessage(row.dataset.q);
        window.NotificationManager?.success('Prompt Loaded', 'Your selected prompt has been sent.');
      });
    });
    box.querySelectorAll('.aia-lib-save').forEach(star => star.addEventListener('click', (e) => {
      e.stopPropagation();
      const prompt = e.target.closest('.aia-lib-prompt').dataset.q;
      if (!savedPrompts.includes(prompt)) { savedPrompts.unshift(prompt); _persistPrompts(); _renderSidebar(); window.NotificationManager?.success('Prompt Saved', 'Added to Saved Prompts.'); }
    }));
  }
  function _wireLibraryModal() { document.getElementById('aia-lib-close')?.addEventListener('click', () => document.getElementById('aia-lib-modal').classList.remove('open')); }

  // ══════════════════════════════════════════════════════════════════════
  // EXPORT MODAL
  // ══════════════════════════════════════════════════════════════════════
  function _buildExportModal() {
    return `<div class="modal-overlay" id="aia-export-modal">
      <div class="modal" style="max-width:440px">
        <div class="modal-header"><span class="modal-title">Export Conversation</span><button class="modal-close" id="aia-export-close">${svg('close')}</button></div>
        <div class="modal-body">
          <div class="aia-export-grid" id="aia-export-grid">
            ${['Markdown', 'JSON', 'HTML', 'PDF'].map(f => `<div class="aia-export-opt ${f === exportFormat ? 'selected' : ''}" data-fmt="${f}">${svg('down')}<div style="margin-top:6px;font-size:var(--text-sm)">${f}${f === 'PDF' ? ' (Placeholder)' : ''}</div></div>`).join('')}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary btn-sm" id="aia-export-cancel">Cancel</button>
          <button class="btn btn-primary btn-sm" id="aia-export-confirm">${svg('down')} Export</button>
        </div>
      </div>
    </div>`;
  }
  function _openExportModal() {
    const conv = _getActiveConv();
    if (!conv || !conv.messages.length) { window.NotificationManager?.info('Nothing to Export', 'Start a conversation first.'); return; }
    document.getElementById('aia-export-modal').classList.add('open');
  }
  function _wireExportModal() {
    document.getElementById('aia-export-close')?.addEventListener('click', () => document.getElementById('aia-export-modal').classList.remove('open'));
    document.getElementById('aia-export-cancel')?.addEventListener('click', () => document.getElementById('aia-export-modal').classList.remove('open'));
    document.querySelectorAll('#aia-export-grid .aia-export-opt').forEach(opt => opt.addEventListener('click', () => {
      exportFormat = opt.dataset.fmt;
      document.querySelectorAll('#aia-export-grid .aia-export-opt').forEach(o => o.classList.toggle('selected', o === opt));
    }));
    document.getElementById('aia-export-confirm')?.addEventListener('click', _exportConversation);
  }
  function _exportConversation() {
    const conv = _getActiveConv(); if (!conv) return;
    const lines = conv.messages.map(m => `${m.role === 'user' ? 'You' : 'Assistant'} (${new Date(m.ts).toLocaleString()}):\n${m.text}\n`);
    let content, mime, ext;
    if (exportFormat === 'JSON') { content = JSON.stringify(conv, null, 2); mime = 'application/json'; ext = 'json'; }
    else if (exportFormat === 'HTML') { content = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(conv.title)}</title></head><body style="font-family:sans-serif;max-width:680px;margin:40px auto"><h1>${esc(conv.title)}</h1>${conv.messages.map(m => `<p><strong>${m.role === 'user' ? 'You' : 'Assistant'}:</strong> ${esc(m.text)}</p>`).join('')}</body></html>`; mime = 'text/html'; ext = 'html'; }
    else if (exportFormat === 'PDF') { content = `[PDF PLACEHOLDER — no real PDF renderer in this offline demo]\n\n${conv.title}\n\n${lines.join('\n')}`; mime = 'text/plain'; ext = 'pdf.txt'; }
    else { content = `# ${conv.title}\n\n${lines.join('\n')}`; mime = 'text/markdown'; ext = 'md'; }
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${conv.id}.${ext}`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    document.getElementById('aia-export-modal').classList.remove('open');
    window.NotificationManager?.success('Conversation Exported', `Exported as ${exportFormat}.`);
  }

  // ══════════════════════════════════════════════════════════════════════
  // SETTINGS MODAL
  // ══════════════════════════════════════════════════════════════════════
  function _buildSettingsModal() {
    return `<div class="modal-overlay" id="aia-settings-modal">
      <div class="modal" style="max-width:460px">
        <div class="modal-header"><span class="modal-title">Assistant Settings</span><button class="modal-close" id="aia-settings-close">${svg('close')}</button></div>
        <div class="modal-body">
          <div class="aia-settings-row">
            <div><div class="aia-settings-label">Typing Speed</div><div class="aia-settings-desc">How long the "thinking" indicator shows before a response appears.</div></div>
            <select class="form-select" id="aia-set-typing" style="max-width:120px">
              <option value="slow">Slow</option><option value="normal">Normal</option><option value="fast">Fast</option>
            </select>
          </div>
          <div class="aia-settings-row">
            <div><div class="aia-settings-label">Response Length</div><div class="aia-settings-desc">Preferred verbosity for simulated responses.</div></div>
            <select class="form-select" id="aia-set-length" style="max-width:120px">
              <option value="concise">Concise</option><option value="standard">Standard</option><option value="detailed">Detailed</option>
            </select>
          </div>
          <div class="aia-settings-row">
            <div><div class="aia-settings-label">Show Suggestions</div><div class="aia-settings-desc">Show example questions on the welcome screen.</div></div>
            <label class="aia-switch"><input type="checkbox" id="aia-set-suggestions" /><span class="aia-switch-track"></span></label>
          </div>
          <div class="aia-settings-row">
            <div><div class="aia-settings-label">Auto Save</div><div class="aia-settings-desc">Automatically persist conversations after every message.</div></div>
            <label class="aia-switch"><input type="checkbox" id="aia-set-autosave" /><span class="aia-switch-track"></span></label>
          </div>
          <div class="aia-settings-row">
            <div><div class="aia-settings-label">Conversation History</div><div class="aia-settings-desc">Permanently clear all saved conversations on this device.</div></div>
            <button class="btn btn-danger btn-sm" id="aia-set-clear-history">${svg('trash')} Clear All</button>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary btn-sm" id="aia-settings-cancel">Close</button>
          <button class="btn btn-primary btn-sm" id="aia-settings-save">${svg('check')} Save Settings</button>
        </div>
      </div>
    </div>`;
  }
  function _openSettingsModal() {
    document.getElementById('aia-set-typing').value = settings.typingSpeed;
    document.getElementById('aia-set-length').value = settings.responseLength;
    document.getElementById('aia-set-suggestions').checked = settings.showSuggestions;
    document.getElementById('aia-set-autosave').checked = settings.autoSave;
    document.getElementById('aia-settings-modal').classList.add('open');
  }
  function _wireSettingsModal() {
    document.getElementById('aia-settings-close')?.addEventListener('click', () => document.getElementById('aia-settings-modal').classList.remove('open'));
    document.getElementById('aia-settings-cancel')?.addEventListener('click', () => document.getElementById('aia-settings-modal').classList.remove('open'));
    document.getElementById('aia-set-clear-history')?.addEventListener('click', () => {
      conversations = []; activeConvId = null; recentQuestions = [];
      _persistConversations();
      document.getElementById('aia-settings-modal').classList.remove('open');
      _renderSidebar(); _renderChat();
      window.NotificationManager?.success('Chat Cleared', 'All conversation history has been removed.');
    });
    document.getElementById('aia-settings-save')?.addEventListener('click', () => {
      settings.typingSpeed = document.getElementById('aia-set-typing').value;
      settings.responseLength = document.getElementById('aia-set-length').value;
      settings.showSuggestions = document.getElementById('aia-set-suggestions').checked;
      settings.autoSave = document.getElementById('aia-set-autosave').checked;
      _persistSettings();
      if (settings.autoSave) _persistConversations();
      document.getElementById('aia-settings-modal').classList.remove('open');
      window.NotificationManager?.success('Knowledge Updated', 'Assistant settings have been saved.');
    });
  }

  // ── Public API ─────────────────────────────────────────────────────────
  return { register };

})();

window.AIAssistant = AIAssistant;

if (window.Router) {
  AIAssistant.register();
} else {
  console.error('[AIAssistant] Router not found. Ensure router.js loads before aia-assistant.js.');
}
