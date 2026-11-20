/**
 * DDS EXPO — Main Application Script
 * Vanilla JavaScript implementation for bright scrollytelling experience.
 */

(function () {
  'use strict';

  // Ensure config is loaded
  const CFG = window.DDS_CONFIG || {};
  const LERP_FACTOR = CFG.lerpFactor || 0.15;
  const CURSOR_LERP = CFG.cursorLerp || 0.18;
  const MOBILE_BREAKPOINT = CFG.mobileBreakpoint || 768;

  // State management
  const state = {
    isMobile: window.innerWidth < MOBILE_BREAKPOINT,
    preloaderFinished: false,
    scrollY: window.scrollY || window.pageYOffset,
    lastScrollY: window.scrollY || window.pageYOffset,
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    mouse: { x: window.innerWidth / 2, y: window.innerHeight / 2, targetX: window.innerWidth / 2, targetY: window.innerHeight / 2, isDown: false, isHovering: false, label: 'VIEW' },
    scenes: {},
  };

  /* ==========================================================================
     1. Custom Cursor (Desktop only, pointer: fine)
     ========================================================================== */
  function initCustomCursor() {
    if (state.prefersReducedMotion || !window.matchMedia('(pointer: fine)').matches) {
      document.body.classList.remove('has-custom-cursor');
      return;
    }

    const dot = document.getElementById('cursorDot');
    const ring = document.getElementById('cursorRing');
    const label = document.getElementById('cursorLabel');
    if (!dot || !ring) return;

    let dotX = state.mouse.x;
    let dotY = state.mouse.y;
    let ringX = state.mouse.x;
    let ringY = state.mouse.y;

    window.addEventListener('mousemove', (e) => {
      state.mouse.targetX = e.clientX;
      state.mouse.targetY = e.clientY;
    }, { passive: true });

    window.addEventListener('mousedown', () => {
      ring.classList.add('is-down');
      dot.classList.add('is-down');
      setTimeout(() => {
        ring.classList.remove('is-down');
        dot.classList.remove('is-down');
      }, 120);
    });

    // Delegate hover states for links, buttons, and data-cursor elements
    document.addEventListener('mouseover', (e) => {
      const target = e.target.closest('a, button, [data-cursor], .faq-question, .result-card, .service-card, .testimonial-card, .why-row');
      if (target) {
        state.mouse.isHovering = true;
        const customText = target.getAttribute('data-cursor') || (target.tagName === 'A' ? 'GO' : target.tagName === 'BUTTON' ? 'OPEN' : 'VIEW');
        state.mouse.label = customText;
        ring.classList.add('is-hovering');
        dot.classList.add('is-hovering');
        if (label) label.textContent = customText;
      }
    });

    document.addEventListener('mouseout', (e) => {
      const target = e.target.closest('a, button, [data-cursor], .faq-question, .result-card, .service-card, .testimonial-card, .why-row');
      if (target) {
        state.mouse.isHovering = false;
        ring.classList.remove('is-hovering');
        dot.classList.remove('is-hovering');
      }
    });

    function renderCursor() {
      // Direct positioning for dot
      dotX += (state.mouse.targetX - dotX) * 0.4;
      dotY += (state.mouse.targetY - dotY) * 0.4;
      dot.style.transform = `translate3d(${dotX}px, ${dotY}px, 0) translate(-50%, -50%)`;

      // Smooth lerp for outer ring
      ringX += (state.mouse.targetX - ringX) * CURSOR_LERP;
      ringY += (state.mouse.targetY - ringY) * CURSOR_LERP;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;

      requestAnimationFrame(renderCursor);
    }
    requestAnimationFrame(renderCursor);
  }

  /* ==========================================================================
     2. Asset Loading & Preloader
     ========================================================================== */
  function getFramePath(sceneConfig, index, isMobile) {
    const template = isMobile ? sceneConfig.mobilePath : sceneConfig.desktopPath;
    const formatted = String(index).padStart(4, '0');
    return template.replace('{index}', formatted);
  }

  function loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = src;
      if (img.decode) {
        img.decode().then(() => resolve(img)).catch(() => {
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
        });
      } else {
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
      }
    });
  }

  async function initPreloaderAndHeroLoad() {
    const bar = document.getElementById('preloaderBar');
    const counter = document.getElementById('preloaderCounter');
    const preloader = document.getElementById('preloader');

    const heroCfg = CFG.scenes.hero;
    const initialCount = (CFG.preloader && CFG.preloader.initialHeroFrames) || 24;
    let loadedCount = 0;

    // Initialize scenes state storage
    Object.keys(CFG.scenes).forEach((sceneId) => {
      state.scenes[sceneId] = {
        config: CFG.scenes[sceneId],
        frames: new Array(CFG.scenes[sceneId].frameCount).fill(null),
        canvas: document.getElementById(`canvas-${sceneId}`),
        ctx: null,
        wrapper: document.getElementById(sceneId),
        currentFrame: 0,
        targetFrame: 0,
        lastRenderedFrame: -1,
        progress: 0,
      };
      if (state.scenes[sceneId].canvas) {
        state.scenes[sceneId].ctx = state.scenes[sceneId].canvas.getContext('2d', { alpha: false });
      }
    });

    // Load initial hero frames (1 to 24)
    const heroFramesPromises = [];
    for (let i = 1; i <= initialCount; i++) {
      const path = getFramePath(heroCfg, i, state.isMobile);
      const p = loadImage(path).then((img) => {
        if (img) state.scenes.hero.frames[i - 1] = img;
        loadedCount++;
        const pct = Math.min(100, Math.round((loadedCount / initialCount) * 100));
        if (bar) bar.style.width = `${pct}%`;
        if (counter) counter.textContent = `${String(pct).padStart(3, '0')}%`;
      });
      heroFramesPromises.push(p);
    }

    await Promise.all(heroFramesPromises);

    // Initial draw for hero
    if (state.scenes.hero.frames[0]) {
      renderSceneCanvas(state.scenes.hero, 0);
    }

    // Dismiss preloader
    setTimeout(() => {
      if (preloader) {
        preloader.classList.add('loaded');
        state.preloaderFinished = true;
      }
      // Reveal initial hero chapter
      const heroCh1 = document.getElementById('hero-ch1');
      if (heroCh1) heroCh1.classList.add('active');

      // Continue background loading for the rest of hero, then other scenes
      startBackgroundLoading();
    }, 200);
  }

  // Load the rest of hero frames, then work, exploded, analytics, orbit, sitebuilder, automation in order
  async function startBackgroundLoading() {
    const sceneOrder = ['hero', 'work', 'exploded', 'analytics', 'orbit', 'sitebuilder', 'automation'];

    for (const sceneId of sceneOrder) {
      const sceneData = state.scenes[sceneId];
      if (!sceneData) continue;
      const cfg = sceneData.config;
      const startIndex = sceneId === 'hero' ? 25 : 1;

      for (let i = startIndex; i <= cfg.frameCount; i++) {
        const frameIdx = i - 1;
        if (!sceneData.frames[frameIdx]) {
          const path = getFramePath(cfg, i, state.isMobile);
          const img = await loadImage(path);
          if (img) {
            sceneData.frames[frameIdx] = img;
            // If this scene hasn't drawn its first frame yet and is in view, render it
            if (sceneData.lastRenderedFrame === -1 && i === 1) {
              renderSceneCanvas(sceneData, 0);
            }
          }
        }
      }
    }
  }

  /* ==========================================================================
     3. Canvas Sizing & Rendering Logic
     ========================================================================== */
  function resizeAllCanvases() {
    state.windowWidth = window.innerWidth;
    state.windowHeight = window.innerHeight;
    state.isMobile = window.innerWidth < MOBILE_BREAKPOINT;
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);

    Object.keys(state.scenes).forEach((sceneId) => {
      const s = state.scenes[sceneId];
      if (!s.canvas) return;

      const rect = s.canvas.getBoundingClientRect();
      const newWidth = Math.round(rect.width * state.dpr);
      const newHeight = Math.round(rect.height * state.dpr);

      if (s.canvas.width !== newWidth || s.canvas.height !== newHeight) {
        s.canvas.width = newWidth;
        s.canvas.height = newHeight;
        s.lastRenderedFrame = -1; // Force redraw on resize
      }
    });

    updateExplodedCalloutLines();
  }

  function getNearestLoadedFrame(frames, targetIdx) {
    if (frames[targetIdx]) return frames[targetIdx];
    // Search backward first
    for (let i = targetIdx - 1; i >= 0; i--) {
      if (frames[i]) return frames[i];
    }
    // Search forward
    for (let i = targetIdx + 1; i < frames.length; i++) {
      if (frames[i]) return frames[i];
    }
    return null;
  }

  function renderSceneCanvas(sceneData, frameIdx) {
    const { canvas, ctx, frames, config } = sceneData;
    if (!canvas || !ctx) return;

    const img = getNearestLoadedFrame(frames, frameIdx);
    if (!img) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth || img.width || 1280;
    const ih = img.naturalHeight || img.height || 720;

    // Fill background with pure white --paper
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, cw, ch);

    const isPortrait = ch > cw;

    if (!isPortrait) {
      // LANDSCAPE: Cover Fit
      const scale = Math.max(cw / iw, ch / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      const dx = (cw - dw) / 2;
      const dy = (ch - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);
    } else {
      // PORTRAIT: width-fit scaled up ~35% (safe center crop on the empty
      // sides of the scene), anchored just under the top HUD so there is no
      // large empty block above the video; chapter panel stays clear below.
      const fitW = cw / iw;
      const fitH = ch / ih;
      const scale = Math.min(fitW * 1.35, fitH * 0.5);
      const dw = iw * scale;
      const dh = ih * scale;
      const dx = (cw - dw) / 2;
      const dy = ch * 0.16;
      ctx.drawImage(img, dx, dy, dw, dh);
    }

    // Hero specific fade to white over last 4%
    if (config.id === 'hero' && config.fadeToWhiteStart) {
      if (sceneData.progress >= config.fadeToWhiteStart) {
        const fadePct = Math.min(1, (sceneData.progress - config.fadeToWhiteStart) / (1 - config.fadeToWhiteStart));
        canvas.style.opacity = String(1 - fadePct);
      } else {
        canvas.style.opacity = '1';
      }
    }

    sceneData.lastRenderedFrame = frameIdx;
  }

  /* ==========================================================================
     4. Scrollytelling Pinned Loop
     ========================================================================== */
  function updateScrollytelling() {
    state.scrollY = window.scrollY || window.pageYOffset;

    Object.keys(state.scenes).forEach((sceneId) => {
      const s = state.scenes[sceneId];
      if (!s.wrapper || state.prefersReducedMotion) return;

      const rect = s.wrapper.getBoundingClientRect();
      const totalScrollable = s.wrapper.offsetHeight - window.innerHeight;

      if (totalScrollable <= 0) return;

      // Progress 0 to 1
      const progress = Math.max(0, Math.min(1, -rect.top / totalScrollable));
      s.progress = progress;

      // Target frame
      s.targetFrame = Math.round(progress * (s.config.frameCount - 1));

      // Lerp current frame towards target
      s.currentFrame += (s.targetFrame - s.currentFrame) * LERP_FACTOR;
      const roundedFrame = Math.round(s.currentFrame);

      // Only draw when rounded frame changes or forced
      if (roundedFrame !== s.lastRenderedFrame) {
        renderSceneCanvas(s, roundedFrame);
      }

      // Update bottom 1px royal progress line
      const progressLine = document.getElementById(`progress-${sceneId}`);
      if (progressLine) {
        progressLine.style.transform = `scaleX(${progress})`;
      }

      // Update scene chapters
      if (s.config.chapters) {
        s.config.chapters.forEach((ch) => {
          const el = document.getElementById(ch.id);
          if (el) {
            const isActive = progress >= ch.start && progress <= ch.end;
            if (isActive && !el.classList.contains('active')) {
              el.classList.add('active');
            } else if (!isActive && el.classList.contains('active')) {
              el.classList.remove('active');
            }
          }
        });
      }

      // Exploded callouts threshold
      if (sceneId === 'exploded' && s.config.calloutsThreshold) {
        const showCallouts = progress >= s.config.calloutsThreshold;
        const calloutsContainer = document.getElementById('explodedCallouts');
        const svgLines = document.getElementById('calloutSvgLines');

        if (svgLines) {
          if (showCallouts) {
            svgLines.classList.add('is-visible');
          } else {
            svgLines.classList.remove('is-visible');
          }
        }

        if (calloutsContainer) {
          const calloutElements = calloutsContainer.querySelectorAll('.exploded-callout');
          calloutElements.forEach((el, idx) => {
            if (showCallouts) {
              setTimeout(() => el.classList.add('is-visible'), idx * 80);
            } else {
              el.classList.remove('is-visible');
            }
          });
        }
      }
    });

    // Handle statement word-by-word reveal
    updateStatementScroll();

    // Loop
    requestAnimationFrame(updateScrollytelling);
  }

  /* ==========================================================================
     5. Section 2 — Statement Word Reveal
     ========================================================================== */
  function initStatementWordReveal() {
    const statementEl = document.getElementById('statementText');
    if (!statementEl) return;

    const rawText = statementEl.textContent.trim();
    const words = rawText.split(/\s+/);
    statementEl.innerHTML = words.map(w => `<span class="statement-word">${w}</span>`).join(' ');
  }

  function updateStatementScroll() {
    const statementSec = document.getElementById('statement');
    if (!statementSec) return;

    const rect = statementSec.getBoundingClientRect();
    const winH = window.innerHeight;

    // When statement comes into view:
    // Start revealing when top reaches 75% of viewport, finish by 30%
    const startPoint = winH * 0.75;
    const endPoint = winH * 0.25;
    const progress = Math.max(0, Math.min(1, (startPoint - rect.top) / (startPoint - endPoint)));

    const words = statementSec.querySelectorAll('.statement-word');
    const totalWords = words.length;

    words.forEach((word, idx) => {
      const wordThreshold = idx / totalWords;
      if (progress >= wordThreshold) {
        // Opacity smoothly increases to 1.0
        word.style.opacity = '1';
        word.style.color = 'var(--navy)';
      } else {
        word.style.opacity = '0.1';
        word.style.color = 'var(--ink-soft)';
      }
    });
  }

  /* ==========================================================================
     6. Section 4 — Exploded Callout SVG Lines
     ========================================================================== */
  function updateExplodedCalloutLines() {
    const svg = document.getElementById('calloutSvgLines');
    const stage = document.querySelector('#exploded .stage');
    if (!svg || !stage) return;

    const stageRect = stage.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${stageRect.width} ${stageRect.height}`);

    const callouts = (CFG.scenes.exploded && CFG.scenes.exploded.callouts) || [];
    let linesHtml = '';

    callouts.forEach((c) => {
      const dotX = (c.anchorX / 100) * stageRect.width;
      const dotY = (c.anchorY / 100) * stageRect.height;
      const cardX = dotX + c.cardOffsetX;
      const cardY = dotY + c.cardOffsetY;

      // Draw hairline connecting dot to card
      linesHtml += `<line x1="${dotX}" y1="${dotY}" x2="${cardX}" y2="${cardY}" />`;
    });

    svg.innerHTML = linesHtml;
  }

  /* ==========================================================================
     7. Section 6 — Counter Animation
     ========================================================================== */
  function initResultsCounters() {
    const counters = document.querySelectorAll('.counter');
    if (!counters.length) return;

    let hasAnimated = false;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasAnimated) {
          hasAnimated = true;
          counters.forEach((c) => {
            const target = parseInt(c.getAttribute('data-target'), 10);
            const prefix = c.getAttribute('data-prefix') || '';
            const duration = 1600;
            const startTime = performance.now();

            function updateCount(time) {
              const elapsed = time - startTime;
              const progress = Math.min(elapsed / duration, 1);
              // Ease-out expo
              const easeVal = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
              const current = Math.round(target * easeVal);
              c.textContent = `${prefix}${current}`;

              if (progress < 1) {
                requestAnimationFrame(updateCount);
              } else {
                c.textContent = `${prefix}${target}`;
              }
            }
            requestAnimationFrame(updateCount);
          });
        }
      });
    }, { threshold: 0.3 });

    const resultsSection = document.getElementById('results');
    if (resultsSection) observer.observe(resultsSection);
  }

  /* ==========================================================================
     8. Section 8 — Services Staggered Rise
     ========================================================================== */
  function initServicesObserver() {
    const cards = document.querySelectorAll('.service-card');
    if (!cards.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          cards.forEach((card, index) => {
            setTimeout(() => {
              card.classList.add('is-visible');
            }, index * 80);
          });
          observer.disconnect();
        }
      });
    }, { threshold: 0.2 });

    const servicesSection = document.getElementById('services');
    if (servicesSection) observer.observe(servicesSection);
  }

  /* ==========================================================================
     9. Section 12 — Testimonials Horizontal Drag & Scroll
     ========================================================================== */
  function initTestimonialsTrack() {
    const track = document.getElementById('testimonialTrack');
    if (!track) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    track.addEventListener('mousedown', (e) => {
      isDown = true;
      track.classList.add('active');
      startX = e.pageX - track.offsetLeft;
      scrollLeft = track.scrollLeft;
    });

    window.addEventListener('mouseup', () => {
      isDown = false;
      track.classList.remove('active');
    });

    track.addEventListener('mouseleave', () => {
      isDown = false;
      track.classList.remove('active');
    });

    track.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - track.offsetLeft;
      const walk = (x - startX) * 1.5;
      track.scrollLeft = scrollLeft - walk;
    });
  }

  /* ==========================================================================
     10. Section 13 — FAQ Accordion (Single item open at once)
     ========================================================================== */
  function initFaqAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');
    if (!faqItems.length) return;

    faqItems.forEach((item) => {
      const questionBtn = item.querySelector('.faq-question');
      const answer = item.querySelector('.faq-answer');
      if (!questionBtn || !answer) return;

      questionBtn.addEventListener('click', () => {
        const isOpen = item.classList.contains('is-open');

        // Close all items
        faqItems.forEach((other) => {
          other.classList.remove('is-open');
          const otherBtn = other.querySelector('.faq-question');
          const otherAns = other.querySelector('.faq-answer');
          if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
          if (otherAns) otherAns.style.maxHeight = null;
        });

        // Toggle clicked
        if (!isOpen) {
          item.classList.add('is-open');
          questionBtn.setAttribute('aria-expanded', 'true');
          answer.style.maxHeight = `${answer.scrollHeight}px`;
        }
      });
    });
  }

  /* ==========================================================================
     11. Fixed Navigation Scroll Behavior
     ========================================================================== */
  function initAnchorScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href');
        if (!href || href === '#') return;
        const targetEl = document.querySelector(href);
        if (targetEl) {
          e.preventDefault();
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  function initNavigation() {
    const nav = document.getElementById('siteNav');
    const toggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    if (!nav) return;

    window.addEventListener('scroll', () => {
      const currentScrollY = window.scrollY || window.pageYOffset;

      // Add border & background after 40px
      if (currentScrollY > 40) {
        nav.classList.add('is-scrolled');
      } else {
        nav.classList.remove('is-scrolled');
      }

      // Hide on scroll down, show on scroll up
      if (currentScrollY > state.lastScrollY && currentScrollY > 120) {
        nav.classList.add('is-hidden');
      } else {
        nav.classList.remove('is-hidden');
      }

      state.lastScrollY = currentScrollY;
    }, { passive: true });

    // Mobile menu toggle
    if (toggle && navLinks) {
      toggle.addEventListener('click', () => {
        navLinks.classList.toggle('is-open');
      });

      navLinks.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
          navLinks.classList.remove('is-open');
        });
      });
    }
  }

  /* ==========================================================================
     12. General Line Reveal Observer (Non-pinned headlines)
     ========================================================================== */
  function initHeadlineReveals() {
    const lineInners = document.querySelectorAll('.section-header .line-inner, .cta-box .line-inner');
    if (!lineInners.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    lineInners.forEach(el => observer.observe(el));

    // Fallback: reveal on scroll position check (covers cases where the
    // observer misses elements, e.g. transformed boxes inside overflow masks)
    const checkReveals = () => {
      lineInners.forEach((el) => {
        if (el.classList.contains('revealed')) return;
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.92 && r.bottom > 0) {
          el.classList.add('revealed');
          observer.unobserve(el);
        }
      });
    };
    window.addEventListener('scroll', checkReveals, { passive: true });
    checkReveals();
  }

  /* ==========================================================================
     13. Reduced Motion Fallback Setup
     ========================================================================== */
  function handleReducedMotionFallback() {
    if (!state.prefersReducedMotion) return;

    Object.keys(state.scenes).forEach((sceneId) => {
      const s = state.scenes[sceneId];
      if (s.canvas) {
        // Just draw the middle frame
        const midIdx = Math.floor(s.config.frameCount / 2);
        loadImage(getFramePath(s.config, midIdx + 1, state.isMobile)).then((img) => {
          if (img) {
            s.frames[midIdx] = img;
            renderSceneCanvas(s, midIdx);
          }
        });
      }
    });
  }

  /* ==========================================================================
     14. Application Initialization
     ========================================================================== */
  function init() {
    initCustomCursor();
    initStatementWordReveal();
    initPreloaderAndHeroLoad();
    initNavigation();
    initAnchorScrolling();
    initResultsCounters();
    initServicesObserver();
    initTestimonialsTrack();
    initFaqAccordion();
    initHeadlineReveals();

    window.addEventListener('resize', resizeAllCanvases);
    resizeAllCanvases();

    if (!state.prefersReducedMotion) {
      requestAnimationFrame(updateScrollytelling);
    } else {
      handleReducedMotionFallback();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
