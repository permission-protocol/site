/**
 * Permission Protocol - Main JavaScript v5
 * - Animated ReceiptFlowDemo
 * - PostHog event tracking (pp_ prefix)
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
    if (window.location.hostname === 'localhost') {
      console.log('[Track]', event, properties);
    }
  }

  // ============================================
  // ReceiptFlowDemo - Animated Terminal
  // ============================================
  
  const demoTerminal = document.getElementById('demo-terminal');
  const demoPlayBtn = document.getElementById('demo-play');
  const demoReplayBtn = document.getElementById('demo-replay');
  const statusRequest = document.getElementById('status-request');
  const statusReceipt = document.getElementById('status-receipt');
  const statusDeploy = document.getElementById('status-deploy');
  
  let demoPlayed = false;
  let demoRunning = false;
  let demoTimeout = null;
  
  // Check sessionStorage for autoplay
  const hasPlayedThisSession = sessionStorage.getItem('pp_demo_played') === 'true';
  
  // Animation script (exact sequence from spec)
  const demoScript = [
    // Step 1: Initial verify - BLOCKED
    { 
      delay: 0, 
      action: 'clear'
    },
    { 
      delay: 100, 
      action: 'type', 
      text: '$ pp verify --capability deploy:main --env prod',
      class: 'dimmed'
    },
    { delay: 800, action: 'newline' },
    { delay: 1000, action: 'type', text: '403 RECEIPT_REQUIRED', class: 'status-rejected' },
    { delay: 200, action: 'newline' },
    { 
      delay: 400, 
      action: 'blocked',
      text: 'DEPLOY BLOCKED'
    },
    { delay: 100, action: 'status', request: '—', receipt: 'ABSENT', deploy: 'BLOCKED' },
    
    // Step 2: Create request
    { delay: 1500, action: 'newline' },
    { delay: 200, action: 'newline' },
    { 
      delay: 100, 
      action: 'type', 
      text: '$ pp request create --capability deploy:main --env prod',
      class: 'dimmed'
    },
    { delay: 800, action: 'newline' },
    { delay: 600, action: 'type', text: 'request_id=req_7f3d9a2c' },
    { delay: 100, action: 'status', request: 'PENDING', receipt: 'ABSENT', deploy: 'BLOCKED' },
    
    // Step 3: Approve
    { delay: 1200, action: 'newline' },
    { delay: 200, action: 'newline' },
    { 
      delay: 100, 
      action: 'type', 
      text: '$ pp approve req_7f3d9a2c --risk accepted',
      class: 'dimmed'
    },
    { delay: 800, action: 'newline' },
    { delay: 600, action: 'type', text: 'APPROVED', class: 'status-approved' },
    { delay: 100, action: 'status', request: 'APPROVED', receipt: 'ABSENT', deploy: 'BLOCKED' },
    
    // Step 4: Fetch receipt
    { delay: 1000, action: 'newline' },
    { delay: 200, action: 'newline' },
    { 
      delay: 100, 
      action: 'type', 
      text: '$ pp receipt fetch req_7f3d9a2c',
      class: 'dimmed'
    },
    { delay: 800, action: 'newline' },
    { delay: 600, action: 'type', text: 'signed_receipt=pp_rcpt_7f3d...' },
    { delay: 100, action: 'status', request: 'APPROVED', receipt: 'PRESENT', deploy: 'BLOCKED' },
    
    // Step 5: Verify again - SUCCESS
    { delay: 1200, action: 'newline' },
    { delay: 200, action: 'newline' },
    { 
      delay: 100, 
      action: 'type', 
      text: '$ pp verify --capability deploy:main --env prod --receipt pp_rcpt_7f3d...',
      class: 'dimmed'
    },
    { delay: 800, action: 'newline' },
    { delay: 600, action: 'type', text: '200 VERIFIED', class: 'status-approved' },
    { delay: 100, action: 'status', request: 'APPROVED', receipt: 'PRESENT', deploy: 'ALLOWED' },
    
    // Step 6: Deploy
    { delay: 800, action: 'newline' },
    { delay: 200, action: 'newline' },
    { 
      delay: 100, 
      action: 'type', 
      text: 'deploying... ok',
      class: 'dimmed'
    },
    { delay: 500, action: 'complete' }
  ];
  
  function updateStatus(request, receipt, deploy) {
    if (statusRequest) {
      statusRequest.textContent = request;
      statusRequest.className = 'status-value ' + (request === 'PENDING' ? 'pending' : request === 'APPROVED' ? 'approved' : '');
    }
    if (statusReceipt) {
      statusReceipt.textContent = receipt;
      statusReceipt.className = 'status-value ' + (receipt === 'PRESENT' ? 'present' : 'absent');
    }
    if (statusDeploy) {
      statusDeploy.textContent = deploy;
      statusDeploy.className = 'status-value ' + (deploy === 'ALLOWED' ? 'allowed' : deploy === 'BLOCKED' ? 'blocked' : '');
    }
  }
  
  function runDemo() {
    if (!demoTerminal || demoRunning) return;
    
    demoRunning = true;
    demoPlayed = true;
    sessionStorage.setItem('pp_demo_played', 'true');
    
    // Track demo view
    track('pp_demo_view');
    
    // Hide play, show nothing (will show replay at end)
    if (demoPlayBtn) demoPlayBtn.style.display = 'none';
    if (demoReplayBtn) demoReplayBtn.style.display = 'none';
    
    // Reset terminal
    demoTerminal.innerHTML = '';
    updateStatus('—', '—', '—');
    
    let currentLine = null;
    let totalDelay = 0;
    
    demoScript.forEach((step, index) => {
      totalDelay += step.delay;
      
      demoTimeout = setTimeout(() => {
        switch (step.action) {
          case 'clear':
            demoTerminal.innerHTML = '';
            currentLine = null;
            break;
            
          case 'type':
            currentLine = document.createElement('div');
            currentLine.className = 'terminal-line' + (step.class ? ' ' + step.class : '');
            currentLine.textContent = step.text;
            demoTerminal.appendChild(currentLine);
            break;
            
          case 'blocked':
            currentLine = document.createElement('div');
            currentLine.className = 'terminal-line';
            const blockedSpan = document.createElement('span');
            blockedSpan.className = 'deploy-blocked';
            blockedSpan.textContent = step.text;
            currentLine.appendChild(blockedSpan);
            demoTerminal.appendChild(currentLine);
            break;
            
          case 'newline':
            currentLine = document.createElement('div');
            currentLine.className = 'terminal-line';
            currentLine.innerHTML = '&nbsp;';
            demoTerminal.appendChild(currentLine);
            break;
            
          case 'status':
            updateStatus(step.request, step.receipt, step.deploy);
            break;
            
          case 'complete':
            demoRunning = false;
            if (demoReplayBtn) demoReplayBtn.style.display = 'block';
            track('pp_demo_complete');
            break;
        }
        
        // Auto-scroll terminal
        demoTerminal.scrollTop = demoTerminal.scrollHeight;
        
      }, totalDelay);
    });
  }
  
  function resetDemo() {
    // Clear any pending timeouts
    if (demoTimeout) clearTimeout(demoTimeout);
    demoRunning = false;
    
    // Reset UI
    if (demoTerminal) {
      demoTerminal.innerHTML = '<div class="terminal-line dimmed">$ pp verify --capability deploy:main --env prod</div><div class="terminal-line">&nbsp;</div><div class="terminal-cursor">_</div>';
    }
    updateStatus('—', '—', '—');
    
    if (demoPlayBtn) demoPlayBtn.style.display = 'block';
    if (demoReplayBtn) demoReplayBtn.style.display = 'none';
  }
  
  // Button handlers
  if (demoPlayBtn) {
    demoPlayBtn.addEventListener('click', runDemo);
  }
  
  if (demoReplayBtn) {
    demoReplayBtn.addEventListener('click', () => {
      resetDemo();
      setTimeout(runDemo, 100);
    });
  }
  
  // Autoplay on scroll into view (once per session)
  if (demoTerminal && !hasPlayedThisSession) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !demoPlayed && !demoRunning) {
          observer.unobserve(entry.target);
          setTimeout(runDemo, 500); // Small delay for effect
        }
      });
    }, { threshold: 0.5 });
    
    observer.observe(demoTerminal);
  } else if (demoTerminal && hasPlayedThisSession) {
    // Show replay button if already played this session
    if (demoPlayBtn) demoPlayBtn.style.display = 'block';
  }

  // ============================================
  // Scroll Depth Tracking
  // ============================================
  
  const sections = [
    { id: 'why-now', name: 'Why Now' },
    { id: 'control-vs-authority', name: 'Control vs Authority' },
    { id: 'enforcement-demo', name: 'Enforcement Demo' },
    { id: 'trust-boundary', name: 'Trust Boundary' },
    { id: 'receipt-example', name: 'Receipt Example' },
    { id: 'diagnostic', name: 'ICP Diagnostic' },
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
      if (rect.top < viewportHeight * 0.75 && rect.bottom > 0) {
        viewedSections.add(section.id);
        track('pp_section_viewed', { section: section.name, section_id: section.id });
      }
    });
  }

  let scrollTimeout;
  window.addEventListener('scroll', function() {
    if (scrollTimeout) return;
    scrollTimeout = setTimeout(function() {
      scrollTimeout = null;
      checkSectionVisibility();
    }, 100);
  });

  checkSectionVisibility();

  // ============================================
  // CTA Click Tracking
  // ============================================
  
  document.addEventListener('click', function(e) {
    const trackEl = e.target.closest('[data-track]');
    if (trackEl) {
      const trackId = trackEl.getAttribute('data-track');
      track(trackId, { href: trackEl.href || null });
    }
  });

  // ============================================
  // Page View Tracking
  // ============================================
  
  track('pp_page_view', { 
    page: window.location.pathname,
    referrer: document.referrer || null
  });

  // ============================================
  // Time on Page
  // ============================================
  
  const pageLoadTime = Date.now();
  
  window.addEventListener('beforeunload', function() {
    const timeOnPage = Math.round((Date.now() - pageLoadTime) / 1000);
    track('pp_page_exit', {
      page: window.location.pathname,
      time_on_page_seconds: timeOnPage,
      sections_viewed: Array.from(viewedSections)
    });
  });

  // ============================================
  // Fallback for no-JS (static diagram)
  // ============================================
  // The HTML includes a static initial state that works without JS

})();
