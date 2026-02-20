/**
 * Permission Protocol - Main JavaScript
 * - Demo interaction
 * - PostHog event tracking
 * - Scroll depth tracking
 */

(function() {
  'use strict';

  // ============================================
  // PostHog Helpers
  // ============================================
  
  function track(event, properties = {}) {
    if (window.posthog) {
      posthog.capture(event, properties);
    }
    // Also log to console in development
    if (window.location.hostname === 'localhost') {
      console.log('[Track]', event, properties);
    }
  }

  // ============================================
  // Demo Interaction
  // ============================================
  
  const demoStates = {
    initial: {
      lines: [
        { text: '$ deploy --env production', class: 'dimmed' }
      ]
    },
    rejected: {
      lines: [
        { text: '$ deploy --env production', class: 'dimmed' },
        { text: '' },
        { text: '<span class="label">Deploy target:</span> <span class="value">production</span>' },
        { text: '<span class="label">Commit:</span> <span class="value">a81f2c3</span>' },
        { text: '<span class="label">Receipt:</span> <span class="value">not provided</span>' },
        { text: '' },
        { text: '<span class="label">Status:</span> <span class="status-rejected">REJECTED</span>' },
        { text: '<span class="label">Reason:</span> <span class="reason">Missing signed authorization receipt</span>' }
      ]
    },
    approved: {
      lines: [
        { text: '$ deploy --env production --receipt pp_rcpt_7f3d...', class: 'dimmed' },
        { text: '' },
        { text: '<span class="label">Deploy target:</span> <span class="value">production</span>' },
        { text: '<span class="label">Commit:</span> <span class="value">a81f2c3</span>' },
        { text: '<span class="label">Receipt:</span> <span class="value">verified</span>' },
        { text: '<span class="label">Signer:</span> <span class="value">production-authority</span>' },
        { text: '<span class="label">Policy:</span> <span class="value">prod-deploy-v1</span>' },
        { text: '' },
        { text: '<span class="label">Status:</span> <span class="status-approved">APPROVED</span>' }
      ]
    }
  };

  let demoState = 'initial';
  const demoOutput = document.getElementById('demo-output');
  const demoTrigger = document.getElementById('demo-trigger');

  function renderDemo(state, animate = false) {
    const config = demoStates[state];
    if (!config || !demoOutput) return;

    if (animate) {
      // Clear and animate lines one by one
      demoOutput.innerHTML = '';
      config.lines.forEach((line, index) => {
        setTimeout(() => {
          const div = document.createElement('div');
          div.className = 'terminal-line' + (line.class ? ' ' + line.class : '');
          div.innerHTML = line.text || '&nbsp;';
          demoOutput.appendChild(div);
        }, index * 80);
      });
    } else {
      // Render immediately
      demoOutput.innerHTML = config.lines.map(line => {
        const cls = line.class ? ' ' + line.class : '';
        return `<div class="terminal-line${cls}">${line.text || '&nbsp;'}</div>`;
      }).join('');
    }
  }

  if (demoTrigger) {
    demoTrigger.addEventListener('click', function() {
      if (demoState === 'initial' || demoState === 'approved') {
        demoState = 'rejected';
        demoTrigger.textContent = 'Simulate Approved Deploy';
        track('demo_interaction', { action: 'attempt_without_receipt' });
      } else {
        demoState = 'approved';
        demoTrigger.textContent = 'Attempt Production Deploy Without Receipt';
        track('demo_interaction', { action: 'simulate_approved' });
      }
      demoTrigger.classList.toggle('active', demoState === 'rejected');
      renderDemo(demoState, true);
    });
  }

  // ============================================
  // Scroll Depth Tracking
  // ============================================
  
  const sections = [
    { id: 'separation-of-powers', name: 'Core Invariant' },
    { id: 'enforcement-demo', name: 'Enforcement Demo' },
    { id: 'delegation', name: 'Delegation' },
    { id: 'approval-not-authority', name: 'Approval Not Authority' },
    { id: 'deploy-gate', name: 'Deploy Gate' },
    { id: 'designed-for', name: 'Designed For' }
  ];

  const viewedSections = new Set();

  function checkSectionVisibility() {
    const viewportHeight = window.innerHeight;
    
    sections.forEach(section => {
      if (viewedSections.has(section.id)) return;
      
      const el = document.getElementById(section.id);
      if (!el) return;
      
      const rect = el.getBoundingClientRect();
      // Consider section viewed if top half is in viewport
      if (rect.top < viewportHeight * 0.75 && rect.bottom > 0) {
        viewedSections.add(section.id);
        track('section_viewed', { section: section.name, section_id: section.id });
      }
    });
  }

  // Throttle scroll events
  let scrollTimeout;
  window.addEventListener('scroll', function() {
    if (scrollTimeout) return;
    scrollTimeout = setTimeout(function() {
      scrollTimeout = null;
      checkSectionVisibility();
    }, 100);
  });

  // Check on load
  checkSectionVisibility();

  // ============================================
  // CTA Click Tracking
  // ============================================
  
  document.addEventListener('click', function(e) {
    const trackEl = e.target.closest('[data-track]');
    if (trackEl) {
      const trackId = trackEl.getAttribute('data-track');
      track('cta_click', { cta: trackId, href: trackEl.href || null });
    }
  });

  // ============================================
  // Page View Tracking
  // ============================================
  
  track('page_view', { 
    page: window.location.pathname,
    referrer: document.referrer || null
  });

  // ============================================
  // Time on Page
  // ============================================
  
  const pageLoadTime = Date.now();
  
  window.addEventListener('beforeunload', function() {
    const timeOnPage = Math.round((Date.now() - pageLoadTime) / 1000);
    track('page_exit', {
      page: window.location.pathname,
      time_on_page_seconds: timeOnPage,
      sections_viewed: Array.from(viewedSections)
    });
  });

})();
