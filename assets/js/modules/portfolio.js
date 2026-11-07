/**
 * KHAN SECURITY SOLUTIONS ENTERPRISE
 * Portfolio Module (portfolio.js)
 *
 * Registers the 'portfolio' route with the Router.
 * Renders: Hero, About, Career Objective, Timeline, Skills, Certifications,
 * Projects, Experience, Education, Resume Viewer, Contact.
 *
 * Data source: assets/data/portfolio-data.js (PortfolioData)
 * Never hardcode personal/resume content here — edit portfolio-data.js instead.
 *
 * NOTE: This file is intentionally large (single cohesive module covering an
 * entire page). It is organised into clearly labelled sections rather than
 * split across files, to keep all portfolio rendering logic colocated and
 * easy to maintain as one unit, per the project's "modular but not
 * fragmented" architecture.
 */

const PortfolioModule = (() => {

  // ── Internal accessor for the data file (loaded separately, before this) ──
  function D() {
    if (!window.PortfolioData) {
      throw new Error('[Portfolio] PortfolioData is missing. Ensure assets/data/portfolio-data.js loads before portfolio.js in index.html.');
    }
    return window.PortfolioData;
  }

  let mounted = false;
  let revealObserver = null;

  // ── Icon Library (inline SVG path data, no external requests) ─────────────
  const ICONS = {
    mail:      `<path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>`,
    phone:     `<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/>`,
    location:  `<path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>`,
    linkedin:  `<path d="M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14zM8.34 18.34v-7.4H5.67v7.4h2.67zM7 9.93a1.55 1.55 0 100-3.1 1.55 1.55 0 000 3.1zM18.34 18.34v-4.07c0-2.18-1.16-3.2-2.71-3.2-1.25 0-1.81.69-2.12 1.17v-1h-2.67s.04.79 0 7.1h2.67v-4.13c0-.22.02-.44.08-.6.18-.44.58-.9 1.27-.9.9 0 1.26.68 1.26 1.68v3.95h2.22z"/>`,
    github:    `<path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-1.04-.01-1.88-2.78.61-3.37-1.21-3.37-1.21-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.9 1.56 2.36 1.11 2.93.85.09-.66.35-1.11.64-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.73 0 0 .84-.27 2.75 1.05a9.3 9.3 0 015 0c1.91-1.32 2.75-1.05 2.75-1.05.55 1.42.2 2.47.1 2.73.64.72 1.03 1.63 1.03 2.75 0 3.94-2.35 4.8-4.58 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.26 10.26 0 0022 12.25C22 6.58 17.52 2 12 2z"/>`,
    thm:       `<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>`,
    download:  `<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>`,
    eye:       `<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>`,
    shield:    `<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>`,
    target:    `<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>`,
    chevDown:  `<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>`,
    briefcase: `<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0"/>`,
    academic:  `<path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443"/>`,
    send:      `<path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/>`,
    info:      `<path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/>`,
    file:      `<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>`,
    check:     `<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>`,
  };

  function icon(name, cls = '') {
    return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">${ICONS[name] || ''}</svg>`;
  }

  function escape(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ROUTE REGISTRATION
  // ══════════════════════════════════════════════════════════════════════════
  function register() {
    window.Router.register('portfolio', {
      title: 'Portfolio',
      init,
      render,
    });
  }

  function init() {
    try {
      D(); // validate data file is present; throws clearly if not
    } catch (err) {
      console.error(err.message);
      return;
    }
    _registerSearchContent();
  }

  function render() {
    const el = document.getElementById('page-portfolio');
    if (!el) return;

    if (!mounted) {
      el.innerHTML = _buildHTML();
      mounted = true;
      _wireInteractions();
      _startTypewriter();
      _setupScrollReveal();
      _animateSkillBars();
      _animateStatCounters();
    } else {
      // Returning to an already-rendered page: re-trigger reveal animations
      // for elements scrolled back into view.
      _setupScrollReveal();
    }
  }

  // ── Master HTML Assembly ────────────────────────────────────────────────────
  function _buildHTML() {
    return (
      _buildSubNav() +
      _buildHero() +
      _buildAbout() +
      _buildTimeline() +
      _buildSkills() +
      _buildCertifications() +
      _buildProjects() +
      _buildExperience() +
      _buildEducation() +
      _buildResume() +
      _buildContact()
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SUB-NAVIGATION (sticky in-page jump links)
  // ══════════════════════════════════════════════════════════════════════════
  function _buildSubNav() {
    const links = [
      ['pf-hero', 'Overview'],
      ['pf-about', 'About'],
      ['pf-timeline-section', 'Timeline'],
      ['pf-skills', 'Skills'],
      ['pf-certs', 'Certifications'],
      ['pf-projects', 'Projects'],
      ['pf-experience', 'Experience'],
      ['pf-education', 'Education'],
      ['pf-resume', 'Resume'],
      ['pf-contact', 'Contact'],
    ];
    return `
      <nav class="pf-subnav" aria-label="Portfolio sections">
        <div class="pf-subnav-inner" id="pf-subnav-inner">
          ${links.map(([id, label], i) => `
            <span class="pf-subnav-link${i === 0 ? ' active' : ''}" data-target="${id}">${label}</span>
          `).join('')}
        </div>
      </nav>`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // HERO SECTION
  // ══════════════════════════════════════════════════════════════════════════
  function _buildHero() {
    const d = D();
    const p = d.profile;
    const nameParts = p.name.split(' ');
    const firstName = nameParts[0];
    const restName = nameParts.slice(1).join(' ');

    return `
    <section class="pf-hero" id="pf-hero">
      <div class="pf-hero-bg" aria-hidden="true">${_heroNetworkSVG()}</div>

      <div class="pf-hero-content">
        <div class="pf-hero-text">
          <div class="pf-hero-badges">
            ${d.heroBadges.map(b => `
              <span class="pf-hero-badge ${b.type}"><span class="dot"></span>${escape(b.label)}</span>
            `).join('')}
          </div>

          <h1 class="pf-hero-name">${escape(firstName)} <span class="accent">${escape(restName)}</span></h1>

          <div class="pf-hero-tagline">
            <span id="pf-typewriter"></span><span class="pf-typewriter-cursor" aria-hidden="true"></span>
          </div>

          <p class="pf-hero-summary">${escape(p.subtagline)} · ${escape(p.location)}</p>

          <div class="pf-hero-actions">
            <a class="btn btn-primary btn-lg" href="${d.resume.path}" download="${d.resume.filename}">
              ${icon('download')} Download Resume
            </a>
            <a class="btn btn-secondary btn-lg" href="${p.socials.github}" target="_blank" rel="noopener noreferrer">
              ${icon('github')} Visit GitHub
            </a>
            <a class="btn btn-secondary btn-lg" href="${p.socials.linkedin}" target="_blank" rel="noopener noreferrer">
              ${icon('linkedin')} LinkedIn
            </a>
          </div>

          <div class="pf-hero-stats">
            <div class="pf-hero-stat">
              <div class="pf-hero-stat-value"><span class="pf-stat-counter" data-target="${p.cgpa}" data-decimals="2">0.00</span></div>
              <div class="pf-hero-stat-label">CGPA / ${escape(p.cgpaScale)}</div>
            </div>
            <div class="pf-hero-stat">
              <div class="pf-hero-stat-value"><span class="pf-stat-counter" data-target="${p.certCount}">0</span><span class="suffix">+</span></div>
              <div class="pf-hero-stat-label">Certifications</div>
            </div>
            <div class="pf-hero-stat">
              <div class="pf-hero-stat-value"><span class="pf-stat-counter" data-target="${p.projectCount}">0</span></div>
              <div class="pf-hero-stat-label">SOC Simulations</div>
            </div>
          </div>
        </div>

        <div class="pf-hero-visual">
          <div class="pf-hero-photo-ring">
            <div class="pf-hero-photo">
              <span class="pf-hero-photo-initials">${escape(p.initials)}</span>
            </div>
            <div class="pf-hero-status-pill">
              <span class="status-dot online pulse"></span> Open to opportunities
            </div>
          </div>
          <div class="pf-orbit-badge b1">${icon('shield')} Security+</div>
          <div class="pf-orbit-badge b2">${icon('target')} Blue Team</div>
          <div class="pf-orbit-badge b3">${icon('eye')} Threat Detection</div>
        </div>
      </div>

      <div class="pf-scroll-hint" aria-hidden="true">
        Scroll to explore ${icon('chevDown')}
      </div>
    </section>`;
  }

  /** Deterministic network-graph background — no randomness so it never jumps on re-render. */
  function _heroNetworkSVG() {
    const nodes = [
      [60,80],[180,140],[320,60],[420,180],[180,300],[60,260],
      [380,320],[500,100],[520,280],[260,200],[100,180],[440,40]
    ];
    const links = [[0,1],[1,2],[1,9],[2,3],[3,7],[3,8],[4,9],[4,5],[6,8],[6,9],[9,10],[7,11]];
    const nodeEls = nodes.map(([x, y], i) =>
      `<circle class="pf-hero-node" cx="${x}" cy="${y}" r="2.5" style="animation-delay:${(i * 0.27).toFixed(2)}s"/>`
    ).join('');
    const linkEls = links.map(([a, b]) =>
      `<line class="pf-hero-link" x1="${nodes[a][0]}" y1="${nodes[a][1]}" x2="${nodes[b][0]}" y2="${nodes[b][1]}"/>`
    ).join('');
    return `<svg viewBox="0 0 560 360" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${linkEls}${nodeEls}</svg>`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ABOUT + CAREER OBJECTIVE
  // ══════════════════════════════════════════════════════════════════════════
  function _buildAbout() {
    const d = D();
    return `
    <section class="pf-section" id="pf-about">
      <div class="pf-section-header pf-reveal">
        <span class="pf-eyebrow">Get to know me</span>
        <h2 class="pf-section-title">About Me</h2>
        <p class="pf-section-desc">A summary of my background, focus areas, and what I'm working toward.</p>
      </div>

      <div class="pf-about-grid">
        <div class="pf-about-card pf-reveal">
          <div class="pf-about-card-icon">${icon('shield')}</div>
          <div class="pf-about-card-title">Professional Summary</div>
          <p class="pf-about-card-text">${escape(d.summary)}</p>
        </div>
        <div class="pf-about-card pf-reveal">
          <div class="pf-about-card-icon">${icon('target')}</div>
          <div class="pf-about-card-title">Career Objective</div>
          <p class="pf-about-card-text">${escape(d.careerObjective)}</p>
        </div>
      </div>

      <div class="pf-quick-facts pf-reveal">
        <div class="pf-quick-fact">
          <div class="pf-quick-fact-value">${escape(d.profile.cgpa)}</div>
          <div class="pf-quick-fact-label">CGPA</div>
        </div>
        <div class="pf-quick-fact">
          <div class="pf-quick-fact-value">${d.certifications.length}</div>
          <div class="pf-quick-fact-label">Certifications</div>
        </div>
        <div class="pf-quick-fact">
          <div class="pf-quick-fact-value">${d.projects.length}</div>
          <div class="pf-quick-fact-label">SOC Simulations</div>
        </div>
        <div class="pf-quick-fact">
          <div class="pf-quick-fact-value">${d.experience.length}</div>
          <div class="pf-quick-fact-label">Work Experience</div>
        </div>
      </div>
    </section>`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TIMELINE
  // ══════════════════════════════════════════════════════════════════════════
  function _buildTimeline() {
    const d = D();
    return `
    <section class="pf-section pf-section-tight" id="pf-timeline-section"
              style="background: var(--bg-surface); border-top: 1px solid var(--border-subtle); border-bottom: 1px solid var(--border-subtle);">
      <div class="pf-section-header pf-reveal">
        <span class="pf-eyebrow">Journey</span>
        <h2 class="pf-section-title">Interactive Timeline</h2>
        <p class="pf-section-desc">Key milestones across education, certifications, and work experience.</p>
      </div>

      <div class="pf-timeline">
        ${d.timeline.map(t => `
          <div class="pf-timeline-item" data-type="${t.type}">
            <div class="pf-timeline-dot"></div>
            <div class="pf-timeline-card">
              <span class="pf-timeline-year">${escape(t.year)}</span>
              <div class="pf-timeline-title">${escape(t.title)}</div>
              <div class="pf-timeline-org">${escape(t.org)}</div>
              <div class="pf-timeline-desc">${escape(t.desc)}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </section>`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SKILLS DASHBOARD
  // ══════════════════════════════════════════════════════════════════════════
  function _buildSkills() {
    const d = D();
    const levelLabels = { 1: 'Beginner', 2: 'Familiar', 3: 'Proficient', 4: 'Strong', 5: 'Expert' };

    return `
    <section class="pf-section" id="pf-skills">
      <div class="pf-section-header pf-reveal">
        <span class="pf-eyebrow">Capabilities</span>
        <h2 class="pf-section-title">Skills Dashboard</h2>
        <p class="pf-section-desc">Core competencies built through certifications, labs, and hands-on SOC simulations.</p>
      </div>

      <div class="pf-skills-grid">
        ${d.skillCategories.map(cat => `
          <div class="pf-skill-category pf-reveal">
            <div class="pf-skill-category-title">${escape(cat.category)}</div>
            ${cat.skills.map(s => `
              <div class="pf-skill-row">
                <div class="pf-skill-row-top">
                  <span class="pf-skill-name">${escape(s.name)}</span>
                  <span class="pf-skill-level-label">${levelLabels[s.level] || ''}</span>
                </div>
                <div class="pf-skill-bar-track">
                  <div class="pf-skill-bar-fill" data-level="${s.level}" style="width:0%"></div>
                </div>
              </div>
            `).join('')}
          </div>
        `).join('')}
      </div>

      <p class="pf-skill-note pf-reveal">
        Skill levels reflect self-assessed proficiency based on certifications, coursework, and lab experience — not years of professional employment.
      </p>

      <div class="pf-tools-grid">
        ${d.toolCategories.map(tc => `
          <div class="pf-tool-card pf-reveal">
            <div class="pf-tool-card-title">${escape(tc.category)}</div>
            <div>
              ${tc.tools.map(t => `<span class="pf-tool-chip">${escape(t)}</span>`).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </section>`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CERTIFICATIONS
  // ══════════════════════════════════════════════════════════════════════════
  function _buildCertifications() {
    const d = D();
    const statusLabels = { certified: 'Certified', 'in-progress': 'In Progress', completed: 'Completed' };

    return `
    <section class="pf-section" id="pf-certs" style="background: var(--bg-surface); border-top: 1px solid var(--border-subtle); border-bottom: 1px solid var(--border-subtle);">
      <div class="pf-section-header pf-reveal">
        <span class="pf-eyebrow">Credentials</span>
        <h2 class="pf-section-title">Certifications</h2>
        <p class="pf-section-desc">Industry certifications and professional training completed or in progress.</p>
      </div>

      <div class="pf-cert-grid">
        ${d.certifications.map(c => `
          <div class="pf-cert-card pf-reveal">
            <div class="pf-cert-logo">${escape(_initialsFor(c.issuer))}</div>
            <div class="pf-cert-body">
              <div class="pf-cert-top">
                <div>
                  <div class="pf-cert-name">${escape(c.name)}</div>
                  <div class="pf-cert-issuer">${escape(c.issuer)}${c.date ? ' · ' + escape(c.date) : ''}</div>
                </div>
                <span class="pf-cert-status ${c.status}">${statusLabels[c.status] || c.status}</span>
              </div>
              <p class="pf-cert-desc">${escape(c.description)}</p>
              <div class="pf-cert-skills">
                ${c.skills.map(s => `<span class="pf-tool-chip">${escape(s)}</span>`).join('')}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </section>`;
  }

  function _initialsFor(issuer) {
    return issuer
      .split(/[\s/]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0])
      .join('')
      .toUpperCase();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PROJECTS / SOC SIMULATIONS
  // ══════════════════════════════════════════════════════════════════════════
  function _buildProjects() {
    const d = D();
    return `
    <section class="pf-section" id="pf-projects">
      <div class="pf-section-header pf-reveal">
        <span class="pf-eyebrow">Hands-on work</span>
        <h2 class="pf-section-title">Projects &amp; SOC Simulations</h2>
        <p class="pf-section-desc">
          Lab exercises and simulated enterprise engagements completed through training platforms.
          Clearly labeled as simulations — not production deployments.
        </p>
      </div>

      <div class="pf-projects-grid">
        ${d.projects.map(p => `
          <div class="pf-project-card pf-reveal">
            <span class="pf-project-type">${escape(p.type)}</span>
            <div class="pf-project-title">${escape(p.title)}</div>
            <ul class="pf-project-points">
              ${p.points.map(pt => `<li>${escape(pt)}</li>`).join('')}
            </ul>
            <div class="pf-project-footer">
              ${p.tools.map(t => `<span class="pf-project-tool-chip">${escape(t)}</span>`).join('')}
              ${(p.mitreTechniques || []).map(m => `<span class="pf-mitre-chip">${escape(m)}</span>`).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </section>`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // EXPERIENCE
  // ══════════════════════════════════════════════════════════════════════════
  function _buildExperience() {
    const d = D();
    return `
    <section class="pf-section" id="pf-experience" style="background: var(--bg-surface); border-top: 1px solid var(--border-subtle); border-bottom: 1px solid var(--border-subtle);">
      <div class="pf-section-header pf-reveal">
        <span class="pf-eyebrow">Work History</span>
        <h2 class="pf-section-title">Professional Experience</h2>
        <p class="pf-section-desc">Roles held prior to and alongside cybersecurity training.</p>
      </div>

      <div style="max-width: 800px; margin: 0 auto;">
        ${d.experience.map(e => `
          <div class="pf-exp-card pf-reveal">
            <div class="pf-exp-header">
              <div>
                <div class="pf-exp-title">${escape(e.title)}</div>
                <div class="pf-exp-employer">${icon('briefcase', 'inline-icon')} ${escape(e.employer)}</div>
                <div class="pf-exp-location">${icon('location', 'inline-icon')} ${escape(e.location)}</div>
              </div>
              <span class="pf-exp-period">${escape(e.period)}</span>
            </div>
            <ul class="pf-exp-points">
              ${e.points.map(pt => `<li>${escape(pt)}</li>`).join('')}
            </ul>
          </div>
        `).join('')}
      </div>
    </section>`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // EDUCATION
  // ══════════════════════════════════════════════════════════════════════════
  function _buildEducation() {
    const d = D();
    return `
    <section class="pf-section" id="pf-education">
      <div class="pf-section-header pf-reveal">
        <span class="pf-eyebrow">Academic Background</span>
        <h2 class="pf-section-title">Education</h2>
        <p class="pf-section-desc">Current academic program and specialisation.</p>
      </div>

      <div style="max-width: 800px; margin: 0 auto;">
        ${d.education.map(e => `
          <div class="pf-edu-card pf-reveal">
            <div class="pf-edu-header">
              <div>
                <div class="pf-edu-degree">${icon('academic', 'inline-icon')} ${escape(e.degree)}</div>
                <div class="pf-edu-institution">${escape(e.institution)}</div>
                <div class="pf-edu-detail">${escape(e.detail)}</div>
              </div>
              <span class="pf-edu-period">${escape(e.period)} · ${escape(e.status)}</span>
            </div>
            <div class="pf-edu-cgpa-badge">
              <span class="pf-edu-cgpa-value">${escape(e.cgpa)}</span>
              <span class="pf-edu-cgpa-label">Current CGPA · Expected Graduation ${escape(e.expectedGraduation)}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </section>`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RESUME VIEWER + DOWNLOAD
  // ══════════════════════════════════════════════════════════════════════════
  function _buildResume() {
    const d = D();
    return `
    <section class="pf-section pf-section-tight" id="pf-resume" style="background: var(--bg-surface); border-top: 1px solid var(--border-subtle); border-bottom: 1px solid var(--border-subtle);">
      <div class="pf-section-header pf-reveal">
        <span class="pf-eyebrow">Full Document</span>
        <h2 class="pf-section-title">Resume</h2>
        <p class="pf-section-desc">View the full resume inline or download a copy. Loaded entirely from a local file — no upload required.</p>
      </div>

      <div class="pf-resume-card pf-reveal" style="max-width: 700px; margin: 0 auto;">
        <div class="pf-resume-icon">${icon('file')}</div>
        <h3 style="font-size: var(--text-lg); font-weight: var(--weight-semibold); margin-bottom: var(--space-2);">
          ${escape(d.resume.filename)}
        </h3>
        <p style="font-size: var(--text-sm); color: var(--text-tertiary); margin-bottom: var(--space-6);">
          PDF document · Stored locally · Works fully offline
        </p>

        <div style="display:flex; gap: var(--space-3); justify-content: center; flex-wrap: wrap;">
          <button class="btn btn-primary" id="pf-resume-view-btn">
            ${icon('eye')} View Resume
          </button>
          <a class="btn btn-secondary" href="${d.resume.path}" download="${d.resume.filename}">
            ${icon('download')} Download PDF
          </a>
        </div>

        <div class="pf-resume-frame-wrap" id="pf-resume-frame-wrap">
          <iframe class="pf-resume-frame" id="pf-resume-frame" title="Resume preview" loading="lazy"></iframe>
        </div>
      </div>
    </section>`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CONTACT SECTION
  // ══════════════════════════════════════════════════════════════════════════
  function _buildContact() {
    const d = D();
    const p = d.profile;

    return `
    <section class="pf-section" id="pf-contact">
      <div class="pf-section-header pf-reveal">
        <span class="pf-eyebrow">Get in touch</span>
        <h2 class="pf-section-title">Contact</h2>
        <p class="pf-section-desc">${escape(p.availability)}</p>
      </div>

      <div class="pf-contact-grid">
        <div class="pf-contact-info-card pf-reveal">
          <div class="pf-contact-row">
            <div class="pf-contact-icon">${icon('mail')}</div>
            <div>
              <div class="pf-contact-label">Email</div>
              <div class="pf-contact-value">${escape(p.email)}</div>
            </div>
          </div>
          <div class="pf-contact-row">
            <div class="pf-contact-icon">${icon('phone')}</div>
            <div>
              <div class="pf-contact-label">Phone</div>
              <div class="pf-contact-value">${escape(p.phone)}</div>
            </div>
          </div>
          <div class="pf-contact-row">
            <div class="pf-contact-icon">${icon('location')}</div>
            <div>
              <div class="pf-contact-label">Location</div>
              <div class="pf-contact-value">${escape(p.location)}</div>
            </div>
          </div>

          <div class="pf-social-row">
            <a class="pf-social-btn" href="${p.socials.linkedin}" target="_blank" rel="noopener noreferrer">
              ${icon('linkedin')} LinkedIn
            </a>
            <a class="pf-social-btn" href="${p.socials.github}" target="_blank" rel="noopener noreferrer">
              ${icon('github')} GitHub
            </a>
            <a class="pf-social-btn" href="${p.socials.tryhackme}" target="_blank" rel="noopener noreferrer">
              ${icon('thm')} TryHackMe
            </a>
          </div>
        </div>

        <div class="pf-contact-form-card pf-reveal">
          <h3 style="font-size: var(--text-lg); font-weight: var(--weight-semibold); margin-bottom: var(--space-5);">Send a Message</h3>
          <form id="pf-contact-form" novalidate>
            <div class="pf-form-row" style="margin-bottom: var(--space-4);">
              <div class="form-group">
                <label class="form-label" for="pf-cf-name">Your Name</label>
                <input class="form-input" id="pf-cf-name" type="text" placeholder="Jane Doe" required />
              </div>
              <div class="form-group">
                <label class="form-label" for="pf-cf-email">Your Email</label>
                <input class="form-input" id="pf-cf-email" type="email" placeholder="jane@company.com" required />
              </div>
            </div>
            <div class="form-group" style="margin-bottom: var(--space-4);">
              <label class="form-label" for="pf-cf-subject">Subject</label>
              <input class="form-input" id="pf-cf-subject" type="text" placeholder="Job opportunity / collaboration" />
            </div>
            <div class="form-group" style="margin-bottom: var(--space-4);">
              <label class="form-label" for="pf-cf-message">Message</label>
              <textarea class="form-textarea" id="pf-cf-message" placeholder="Write your message here…" required></textarea>
            </div>
            <button class="btn btn-primary w-full" type="submit" style="justify-content:center;">
              ${icon('send')} Send Message
            </button>
            <div class="pf-form-note">
              ${icon('info')}
              <span>
                This is an offline platform — messages are saved locally as a draft you can copy and send
                via email. No network request is made and no email is sent automatically.
              </span>
            </div>
          </form>
        </div>
      </div>
    </section>`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // INTERACTIONS — wired once after first render
  // ══════════════════════════════════════════════════════════════════════════
  function _wireInteractions() {
    _wireSubNav();
    _wireResumeViewer();
    _wireContactForm();
  }

  /** Sub-nav: smooth scroll + active-link highlighting via IntersectionObserver. */
  function _wireSubNav() {
    const links = document.querySelectorAll('.pf-subnav-link');
    links.forEach(link => {
      link.addEventListener('click', () => {
        const target = document.getElementById(link.dataset.target);
        if (!target) return;
        const offset = 56; // account for sticky topbar
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        const mainRegion = document.querySelector('.main-region');
        if (mainRegion) {
          mainRegion.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
        }
      });
    });

    const sectionIds = Array.from(links).map(l => l.dataset.target);
    const mainRegion = document.querySelector('.main-region');

    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          links.forEach(l => l.classList.toggle('active', l.dataset.target === id));
          const activeLink = document.querySelector(`.pf-subnav-link[data-target="${id}"]`);
          activeLink?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
        }
      });
    }, { root: mainRegion, threshold: 0.3, rootMargin: '-80px 0px -60% 0px' });

    sectionIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) navObserver.observe(el);
    });
  }

  /** Resume viewer: lazy-loads the iframe only when the user clicks "View Resume". */
  function _wireResumeViewer() {
    const btn = document.getElementById('pf-resume-view-btn');
    const wrap = document.getElementById('pf-resume-frame-wrap');
    const frame = document.getElementById('pf-resume-frame');
    if (!btn || !wrap || !frame) return;

    btn.addEventListener('click', () => {
      const isOpen = wrap.classList.contains('open');
      if (isOpen) {
        wrap.classList.remove('open');
        btn.innerHTML = `${icon('eye')} View Resume`;
      } else {
        if (!frame.src) frame.src = D().resume.path;
        wrap.classList.add('open');
        btn.innerHTML = `${icon('eye')} Hide Resume`;
        wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  /** Contact form: saves a local draft via NotificationManager + StorageManager (fully offline). */
  function _wireContactForm() {
    const form = document.getElementById('pf-contact-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('pf-cf-name')?.value?.trim();
      const email = document.getElementById('pf-cf-email')?.value?.trim();
      const subject = document.getElementById('pf-cf-subject')?.value?.trim();
      const message = document.getElementById('pf-cf-message')?.value?.trim();

      if (!name || !email || !message) {
        window.NotificationManager.warning('Missing Information', 'Please fill in your name, email, and message.');
        return;
      }

      const draft = {
        id: `msg_${Date.now()}`,
        name, email, subject, message,
        createdAt: new Date().toISOString(),
      };

      // Persist locally — fully offline, no network call.
      if (window.StorageManager?.isReady) {
        StorageManager.put('notes', { id: draft.id, type: 'contact_draft', ...draft }).catch(() => {});
      }

      window.NotificationManager.success(
        'Message Saved Locally',
        'Your message was saved as a draft. Since this platform runs fully offline, please copy it into your email client to send.',
        { source: 'Portfolio' }
      );

      form.reset();
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TYPEWRITER EFFECT — hero tagline
  // ══════════════════════════════════════════════════════════════════════════
  function _startTypewriter() {
    const el = document.getElementById('pf-typewriter');
    if (!el) return;

    const phrases = [
      'SOC Analyst',
      'Blue Team Defender',
      'Threat Detection Specialist',
      'Incident Response Analyst',
      'Aspiring Detection Engineer',
    ];

    let phraseIndex = 0;
    let charIndex = 0;
    let deleting = false;

    function tick() {
      const current = phrases[phraseIndex];

      if (!deleting) {
        charIndex++;
        el.textContent = current.slice(0, charIndex);
        if (charIndex === current.length) {
          deleting = true;
          setTimeout(tick, 1800); // pause at full phrase
          return;
        }
      } else {
        charIndex--;
        el.textContent = current.slice(0, charIndex);
        if (charIndex === 0) {
          deleting = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
        }
      }

      setTimeout(tick, deleting ? 35 : 65);
    }

    tick();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SCROLL REVEAL — IntersectionObserver fade-up for .pf-reveal elements
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
    }, { root: mainRegion, threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('#page-portfolio .pf-reveal:not(.visible)').forEach(el => revealObserver.observe(el));

    // Timeline items use a slightly different class but the same mechanism
    const timelineObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          timelineObserver.unobserve(entry.target);
        }
      });
    }, { root: mainRegion, threshold: 0.2 });

    document.querySelectorAll('#page-portfolio .pf-timeline-item:not(.visible)').forEach(el => timelineObserver.observe(el));
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SKILL BAR ANIMATION — fills bars to their target % once visible
  // ══════════════════════════════════════════════════════════════════════════
  function _animateSkillBars() {
    const bars = document.querySelectorAll('#page-portfolio .pf-skill-bar-fill');
    if (!bars.length) return;

    const mainRegion = document.querySelector('.main-region');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const level = parseInt(entry.target.dataset.level, 10) || 0;
          const pct = (level / 5) * 100;
          entry.target.style.width = `${pct}%`;
          observer.unobserve(entry.target);
        }
      });
    }, { root: mainRegion, threshold: 0.3 });

    bars.forEach(bar => observer.observe(bar));
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STAT COUNTER ANIMATION — counts up from 0 to target once visible
  // ══════════════════════════════════════════════════════════════════════════
  function _animateStatCounters() {
    const counters = document.querySelectorAll('#page-portfolio .pf-stat-counter');
    if (!counters.length) return;

    const mainRegion = document.querySelector('.main-region');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          _runCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { root: mainRegion, threshold: 0.5 });

    counters.forEach(c => observer.observe(c));
  }

  function _runCounter(el) {
    const target = parseFloat(el.dataset.target);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    if (isNaN(target)) return;

    const duration = 1400;
    const start = performance.now();

    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const value = target * eased;
      el.textContent = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = decimals > 0 ? target.toFixed(decimals) : target.toString();
    }

    requestAnimationFrame(step);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // GLOBAL SEARCH INTEGRATION
  // Registers portfolio content as searchable via the Global Search Engine.
  // ══════════════════════════════════════════════════════════════════════════
  function _registerSearchContent() {
    if (!window.SearchEngine) return;
    const d = D();

    const items = [
      { title: 'About Me', meta: 'Professional summary & career objective', route: 'portfolio', keywords: 'about summary objective bio' },
      { title: 'Skills Dashboard', meta: 'Technical skills and tools', route: 'portfolio', keywords: 'skills competencies tools technical' },
      { title: 'Resume', meta: `${d.resume.filename}`, route: 'portfolio', keywords: 'resume cv download pdf' },
      { title: 'Contact', meta: d.profile.email, route: 'portfolio', keywords: 'contact email phone reach out' },
    ];

    d.certifications.forEach(c => {
      items.push({ title: c.name, meta: `${c.issuer} · Certification`, route: 'portfolio', keywords: `certification ${c.name} ${c.issuer}` });
    });

    d.projects.forEach(p => {
      items.push({ title: p.title, meta: `${p.type} · Project`, route: 'portfolio', keywords: `project ${p.title} ${p.tools.join(' ')}` });
    });

    window.SearchEngine.register('Portfolio', items);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ══════════════════════════════════════════════════════════════════════════
  return {
    register,
  };

})();

window.PortfolioModule = PortfolioModule;

// Auto-register the route as soon as this module loads.
// Router.register() is idempotent-safe (just stores config in a Map), so
// calling it here (rather than waiting for app.js to call it explicitly)
// keeps portfolio.js self-contained per the project's modular architecture.
if (window.Router) {
  PortfolioModule.register();
} else {
  console.error('[Portfolio] Router not found. Ensure router.js loads before portfolio.js.');
}
