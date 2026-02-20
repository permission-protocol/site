/**
 * Permission Protocol - Main JavaScript
 * - Demo interaction
 * - PostHog event tracking
 * - Scroll depth tracking
 */

(function() {
  'use strict';

  // ============================================
  // Mobile Navigation
  // ============================================
  
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');
  const navOverlay = document.getElementById('nav-overlay');

  function toggleNav() {
    const isActive = navLinks.classList.toggle('active');
    navToggle.classList.toggle('active', isActive);
    navOverlay.classList.toggle('active', isActive);
    document.body.style.overflow = isActive ? 'hidden' : '';
  }

  function closeNav() {
    navLinks.classList.remove('active');
    navToggle.classList.remove('active');
    navOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (navToggle) {
    navToggle.addEventListener('click', toggleNav);
  }

  if (navOverlay) {
    navOverlay.addEventListener('click', closeNav);
  }

  // Close nav when clicking a link
  if (navLinks) {
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeNav);
    });
  }

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
  // Demo Interaction (v2 - Toggle tabs)
  // ============================================
  
  const demoTabs = document.querySelectorAll('.demo-tab');
  const stateRejected = document.getElementById('state-rejected');
  const stateApproved = document.getElementById('state-approved');

  function switchDemoState(state) {
    if (!stateRejected || !stateApproved) return;
    
    // Update tabs
    demoTabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.state === state);
    });
    
    // Update states
    stateRejected.style.display = state === 'rejected' ? 'block' : 'none';
    stateApproved.style.display = state === 'approved' ? 'block' : 'none';
    
    // Track
    track('demo_interaction', { state: state });
  }

  demoTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      switchDemoState(this.dataset.state);
    });
  });

  // ============================================
  // Scroll Depth Tracking
  // ============================================
  
  const sections = [
    { id: 'structural-claim', name: 'Structural Claim' },
    { id: 'authorization-requirements', name: 'Authorization Requirements' },
    { id: 'enforcement-demo', name: 'Enforcement Demo' },
    { id: 'diagnostic', name: 'ICP Diagnostic' },
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
