/**
 * DDS EXPO — 100% AI-Driven Marketing Agency
 * Main Application Script: Scrollytelling Engine, Frame Sequencer, Sound & Finale Logic
 * Unified Cinematic Stage Architecture
 */

(function () {
  'use strict';

  // --- Configuration ---
  const SCENES = ['hero', 'poster', 'videoedit', 'website', 'leads', 'voice'];
  const TOTAL_FRAMES = 63;
  const MOBILE_BREAKPOINT = 991;

  // Determine mobile vs desktop asset path
  function isMobileViewport() {
    return window.innerWidth <= MOBILE_BREAKPOINT;
  }

  function getSheetPath(scene, sheetIdx, isMobile) {
    const subfolder = isMobile ? 'mobile' : 'desktop';
    return `assets/sprites/${scene}/${subfolder}/sheet${sheetIdx + 1}.jpg`;
  }

  function getFramePath(scene, frameIdx, isMobile) {
    const subfolder = isMobile ? 'mobile' : 'desktop';
    const num = String(frameIdx + 1).padStart(3, '0');
    return `assets/frames/${scene}/${subfolder}/f${num}.jpg`;
  }

  // --- State ---
  const state = {
    isMobile: isMobileViewport(),
    sheets: {}, // scene -> array of sheet Image objects (or null)
    frames: {}, // scene -> array of 63 Image objects (or null)
    lastRenderedFrame: {}, // scene -> frameIdx
    soundMuted: true,
    heroAudioPlayed: false,
    voiceAudioPlayed: false,
    currentActiveScene: 'hero',
    finaleRevealed: false
  };

  // Initialize sheet and frame arrays
  const initialSheetsCount = state.isMobile ? 2 : 4;
  SCENES.forEach(s => {
    state.sheets[s] = new Array(initialSheetsCount).fill(null);
    state.frames[s] = new Array(TOTAL_FRAMES).fill(null);
    state.lastRenderedFrame[s] = -1;
  });

  // --- DOM Elements ---
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundBtnText = document.getElementById('soundBtnText');
  const headerLoaderBar = document.getElementById('headerLoaderBar');
  const voicePlayTriggerBtn = document.getElementById('voicePlayTriggerBtn');
  const soundWaveVisualizer = document.getElementById('soundWaveVisualizer');
  const dialogueHello = document.getElementById('dialogueHello');
  const dialoguePrompt = document.getElementById('dialoguePrompt');
  const navPills = document.querySelectorAll('.nav-pill');
  const hudMarkers = document.querySelectorAll('.hud-step-marker');

  // Canvases & 2D Contexts
  const canvases = {};
  const contexts = {};
  SCENES.forEach(s => {
    const canvas = document.getElementById(`canvas-${s}`);
    if (canvas) {
      canvases[s] = canvas;
      contexts[s] = canvas.getContext('2d', { alpha: false });
    }
  });

  // --- Audio Setup ---
  const heroAudio = new Audio('assets/audio/hero_hi.wav');
  const voiceAudio = new Audio('assets/audio/voice_greeting.wav');
  heroAudio.preload = 'auto';
  voiceAudio.preload = 'auto';

  // --- Sprite Sheet & Frame Loader ---
  const sheetPromises = {};

  function loadSheet(scene, sheetIdx) {
    const isMobile = state.isMobile;
    const key = `${scene}-${isMobile ? 'm' : 'd'}-${sheetIdx}`;
    if (state.sheets[scene] && state.sheets[scene][sheetIdx]) {
      return Promise.resolve(state.sheets[scene][sheetIdx]);
    }
    if (sheetPromises[key]) {
      return sheetPromises[key];
    }
    const p = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        if (!state.sheets[scene]) {
          state.sheets[scene] = new Array(isMobile ? 2 : 4).fill(null);
        }
        state.sheets[scene][sheetIdx] = img;
        delete sheetPromises[key];
        resolve(img);
      };
      img.onerror = () => {
        delete sheetPromises[key];
        resolve(null);
      };
      img.src = getSheetPath(scene, sheetIdx, isMobile);
    });
    sheetPromises[key] = p;
    return p;
  }

  function loadFrame(scene, frameIdx) {
    const framesPerSheet = state.isMobile ? 32 : 16;
    const sheetIdx = Math.floor(frameIdx / framesPerSheet);
    return loadSheet(scene, sheetIdx);
  }

  // Find nearest loaded sheet and corresponding frame so canvas never blanks out
  function getNearestLoadedSheetAndFrame(scene, targetIdx) {
    const isMobile = state.isMobile;
    const totalSheets = isMobile ? 2 : 4;
    const framesPerSheet = isMobile ? 32 : 16;
    const targetSheetIdx = Math.min(totalSheets - 1, Math.floor(targetIdx / framesPerSheet));
    const sheets = state.sheets[scene];
    if (!sheets) return null;

    if (sheets[targetSheetIdx]) {
      return { img: sheets[targetSheetIdx], frameIdx: targetIdx };
    }

    // Trigger background loading of target sheet if not already loading
    loadSheet(scene, targetSheetIdx).then(img => {
      if (img && state.lastRenderedFrame[scene] === targetIdx) {
        renderFrame(scene, targetIdx);
      }
    });

    // Search backward first for closest available sheet
    for (let s = targetSheetIdx - 1; s >= 0; s--) {
      if (sheets[s]) {
        const lastFrameInSheet = Math.min(TOTAL_FRAMES - 1, (s + 1) * framesPerSheet - 1);
        return { img: sheets[s], frameIdx: lastFrameInSheet };
      }
    }

    // Search forward for closest available sheet
    for (let s = targetSheetIdx + 1; s < totalSheets; s++) {
      if (sheets[s]) {
        const firstFrameInSheet = s * framesPerSheet;
        return { img: sheets[s], frameIdx: firstFrameInSheet };
      }
    }

    return null;
  }

  function getNearestLoadedFrame(scene, targetIdx) {
    const res = getNearestLoadedSheetAndFrame(scene, targetIdx);
    return res ? res.img : null;
  }

  // --- Canvas Rendering Logic: Unified Cinematic Stage ---
  function renderFrame(scene, frameIdx) {
    const canvas = canvases[scene];
    const ctx = contexts[scene];
    if (!canvas || !ctx) return;

    const loaded = getNearestLoadedSheetAndFrame(scene, frameIdx);
    if (!loaded) return;

    const { img, frameIdx: actualFrameIdx } = loaded;

    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    if (cw === 0 || ch === 0) return;

    // Scale canvas buffer to physical pixels (capped at 2 for high-DPI rendering performance)
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const targetW = Math.round(cw * dpr);
    const targetH = Math.round(ch * dpr);

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    const isMobile = state.isMobile;
    const cellW = isMobile ? 960 : 1280;
    const cellH = isMobile ? 540 : 720;
    const cols = isMobile ? 8 : 4;
    const framesPerSheet = isMobile ? 32 : 16;

    const cellIdx = actualFrameIdx % framesPerSheet;
    const col = cellIdx % cols;
    const row = Math.floor(cellIdx / cols);

    const cellX = col * cellW;
    const cellY = row * cellH;

    // Source crop: strip top 4px and bottom 4px black video compression artifacts
    const cropY = 4;
    const sWidth = cellW;
    const sHeight = Math.max(1, cellH - (cropY * 2));
    const sx = cellX;
    const sy = cellY + cropY;

    ctx.save();
    ctx.scale(dpr, dpr);

    // Studio ambient lighting gradient fill matching DDS brand space
    const bgGrad = ctx.createLinearGradient(0, 0, cw, ch);
    bgGrad.addColorStop(0, '#FFFFFF');
    bgGrad.addColorStop(0.35, '#F8FBFE');
    bgGrad.addColorStop(1, '#EDF5FA');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, cw, ch);

    const sAspect = sWidth / sHeight;

    if (isMobile) {
      // Mobile: Contained at top of sticky stage (Harsha's rule: animation above text)
      let dw = cw;
      let dh = cw / sAspect;
      let dx = 0;
      let dy = (ch - dh) / 2;
      if (dh > ch) {
        dh = ch;
        dw = ch * sAspect;
        dx = (cw - dw) / 2;
        dy = 0;
      }
      ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dw, dh);
    } else {
      // Desktop: Unified Full-Stage Cinematic Composition
      // Frame fills the stage height while guaranteeing negative space for editorial copy
      let dh = ch;
      let dw = dh * sAspect;
      const minTextSpace = Math.max(460, cw * 0.38);

      if (scene === 'voice') {
        // Voice Agent: Robot on left, negative space on right for voice card & greeting
        let dx = 0;
        let dy = (ch - dh) / 2;
        // Keep right side clear for voice interface
        if (dw > (cw - 440)) {
          dw = Math.max(820, cw - 440);
          dh = dw / sAspect;
          dy = (ch - dh) / 2;
        }
        ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dw, dh);
      } else if (scene === 'leads') {
        // Lead Generation: Robot on left, chart in center, text on right
        let dx = 0;
        let dy = (ch - dh) / 2;
        if (dw > (cw - 440)) {
          dw = Math.max(840, cw - 440);
          dh = dw / sAspect;
          dy = (ch - dh) / 2;
        }
        ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dw, dh);
      } else {
        // Hero, Poster, Videoedit, Website: Robot on right, text on left
        let dx = cw - dw;
        let dy = (ch - dh) / 2;
        // Ensure left editorial zone has ample negative space; robot starts at ~0.33 * dw
        if (dx + (0.33 * dw) < minTextSpace) {
          dw = (cw - minTextSpace) / 0.67;
          dh = dw / sAspect;
          dx = cw - dw;
          dy = (ch - dh) / 2;
        }
        ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dw, dh);
      }
    }

    ctx.restore();
    state.lastRenderedFrame[scene] = frameIdx;
  }

  // --- Preload & Lazy Load Orchestration ---
  async function initPreloader() {
    let loadedCount = 0;
    const totalHeroSheets = state.isMobile ? 2 : 4;

    // 1. Immediately load sheet 0 of all scenes so there is never a blank scene
    const initialPosterPromises = SCENES.map(s => loadSheet(s, 0));
    await Promise.all(initialPosterPromises);

    // Render frame 0 immediately on each canvas
    SCENES.forEach(s => renderFrame(s, 0));

    // 2. Preload all Hero sheets with visual progress bar
    for (let i = 0; i < totalHeroSheets; i++) {
      loadSheet('hero', i).then(img => {
        if (img) loadedCount++;
        const pct = Math.round((loadedCount / totalHeroSheets) * 100);
        if (headerLoaderBar) {
          headerLoaderBar.style.width = `${pct}%`;
        }
        if (i === 0 && img) {
          renderFrame('hero', 0);
        }
      });
    }

    // Hide loader bar once hero is ready
    setTimeout(() => {
      if (headerLoaderBar) {
        headerLoaderBar.style.opacity = '0';
        setTimeout(() => { headerLoaderBar.style.display = 'none'; }, 400);
      }
    }, 1200);

    // 3. Lazy-load other scenes in order of appearance
    const remainingScenes = ['poster', 'videoedit', 'website', 'leads', 'voice'];
    async function lazyLoadRemaining() {
      const totalSheets = state.isMobile ? 2 : 4;
      for (const scene of remainingScenes) {
        for (let s = 1; s < totalSheets; s++) {
          await loadSheet(scene, s);
          await new Promise(r => setTimeout(r, 20));
        }
      }
    }

    setTimeout(lazyLoadRemaining, 300);
  }

  // --- Audio Triggers & Sound Toggle ---
  function updateSoundUI() {
    if (state.soundMuted) {
      soundToggleBtn.classList.remove('is-active');
      soundToggleBtn.classList.add('is-muted');
      if (soundBtnText) soundBtnText.textContent = 'Sound: Off';
    } else {
      soundToggleBtn.classList.remove('is-muted');
      soundToggleBtn.classList.add('is-active');
      if (soundBtnText) soundBtnText.textContent = 'Sound: ON';
    }
  }

  function playHeroAudio() {
    if (state.soundMuted || state.heroAudioPlayed) return;
    heroAudio.currentTime = 0;
    heroAudio.play().then(() => {
      state.heroAudioPlayed = true;
    }).catch(err => {
      console.warn('Audio play prevented by browser policy:', err);
    });
  }

  function playVoiceAudio() {
    if (state.soundMuted || state.voiceAudioPlayed) return;
    voiceAudio.currentTime = 0;
    voiceAudio.play().then(() => {
      state.voiceAudioPlayed = true;
      triggerVoiceVisualizer();
    }).catch(err => {
      console.warn('Audio play prevented by browser policy:', err);
    });
  }

  function triggerVoiceVisualizer() {
    if (soundWaveVisualizer) {
      soundWaveVisualizer.classList.add('is-speaking');
      setTimeout(() => {
        soundWaveVisualizer.classList.remove('is-speaking');
      }, 2400);
    }
    if (dialogueHello) dialogueHello.classList.add('is-visible');
    setTimeout(() => {
      if (dialoguePrompt) dialoguePrompt.classList.add('is-visible');
    }, 400);
  }

  // Sound Toggle click handler
  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', () => {
      state.soundMuted = !state.soundMuted;
      updateSoundUI();

      if (!state.soundMuted) {
        if (state.currentActiveScene === 'hero' && !state.heroAudioPlayed) {
          playHeroAudio();
        } else if (state.currentActiveScene === 'voice' && !state.voiceAudioPlayed) {
          playVoiceAudio();
        }
      } else {
        heroAudio.pause();
        voiceAudio.pause();
      }
    });
  }

  // Voice Card interactive play button
  if (voicePlayTriggerBtn) {
    voicePlayTriggerBtn.addEventListener('click', () => {
      state.soundMuted = false;
      updateSoundUI();
      voiceAudio.currentTime = 0;
      voiceAudio.play().then(() => {
        state.voiceAudioPlayed = true;
        triggerVoiceVisualizer();
      }).catch(err => {
        console.warn('Voice play failed:', err);
      });
    });
  }

  // --- Scroll & Scrollytelling Engine ---
  let isTicking = false;

  function onScroll() {
    if (!isTicking) {
      requestAnimationFrame(updateScrollState);
      isTicking = true;
    }
  }

  function updateScrollState() {
    const vh = window.innerHeight;
    let mostProminentScene = 'hero';
    let maxVisiblePx = -1;

    SCENES.forEach(scene => {
      const section = document.getElementById(scene);
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const visiblePx = Math.max(0, Math.min(rect.bottom, vh) - Math.max(rect.top, 0));

      if (visiblePx > maxVisiblePx) {
        maxVisiblePx = visiblePx;
        mostProminentScene = scene;
      }

      if (rect.bottom < 0 || rect.top > vh) return;

      const scrollTrack = section.offsetHeight - vh;
      if (scrollTrack <= 0) return;

      let progress = -rect.top / scrollTrack;
      progress = Math.max(0, Math.min(1, progress));

      const frameIdx = Math.min(TOTAL_FRAMES - 1, Math.floor(progress * TOTAL_FRAMES));
      renderFrame(scene, frameIdx);
    });

    const finaleSection = document.getElementById('finale');
    if (finaleSection) {
      const fRect = finaleSection.getBoundingClientRect();
      const fVisible = Math.max(0, Math.min(fRect.bottom, vh) - Math.max(fRect.top, 0));
      if (fVisible > maxVisiblePx) {
        mostProminentScene = 'finale';
      }
    }

    state.currentActiveScene = mostProminentScene;
    updateNavAndHUD(mostProminentScene);

    if (mostProminentScene === 'hero' && !state.soundMuted && !state.heroAudioPlayed) {
      playHeroAudio();
    } else if (mostProminentScene === 'voice' && !state.soundMuted && !state.voiceAudioPlayed) {
      playVoiceAudio();
    }

    isTicking = false;
  }

  // --- Navigation & HUD Synchronization ---
  function updateNavAndHUD(activeScene) {
    navPills.forEach(pill => {
      const target = pill.getAttribute('data-nav-scene');
      if (target === activeScene) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });

    hudMarkers.forEach(marker => {
      const target = marker.getAttribute('data-hud');
      if (target === activeScene) {
        marker.classList.add('active');
      } else {
        marker.classList.remove('active');
      }
    });
  }

  // --- Finale Section Sequential Reveal Observer ---
  function initFinaleObserver() {
    const finaleSection = document.getElementById('finale');
    if (!finaleSection) return;

    const brandBlock = document.getElementById('finaleBrandBlock');
    const cardPhone = document.getElementById('cardPhone');
    const cardWebsite = document.getElementById('cardWebsite');
    const cardEmail = document.getElementById('cardEmail');
    const ctaBlock = document.getElementById('finaleCtaBlock');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !state.finaleRevealed) {
          state.finaleRevealed = true;

          // 1. Logo and Brand Tagline
          setTimeout(() => {
            if (brandBlock) brandBlock.classList.add('is-revealed');
          }, 100);

          // 2. Phone Card
          setTimeout(() => {
            if (cardPhone) cardPhone.classList.add('is-revealed');
          }, 450);

          // 3. Website Card
          setTimeout(() => {
            if (cardWebsite) cardWebsite.classList.add('is-revealed');
          }, 700);

          // 4. Email Card
          setTimeout(() => {
            if (cardEmail) cardEmail.classList.add('is-revealed');
          }, 950);

          // 5. Giant WhatsApp CTA
          setTimeout(() => {
            if (ctaBlock) ctaBlock.classList.add('is-revealed');
          }, 1200);
        }
      });
    }, { threshold: 0.15 });

    observer.observe(finaleSection);
  }

  // --- Window Resize & Orientation Handling ---
  let resizeTimeout = null;
  function onResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const currentIsMobile = isMobileViewport();
      if (currentIsMobile !== state.isMobile) {
        state.isMobile = currentIsMobile;
        const totalSheets = state.isMobile ? 2 : 4;
        SCENES.forEach(s => {
          state.sheets[s] = new Array(totalSheets).fill(null);
          state.frames[s] = new Array(TOTAL_FRAMES).fill(null);
        });
        initPreloader();
      }

      SCENES.forEach(s => {
        if (state.lastRenderedFrame[s] >= 0) {
          renderFrame(s, state.lastRenderedFrame[s]);
        }
      });
    }, 150);
  }

  // --- Initialization ---
  window.addEventListener('DOMContentLoaded', () => {
    initPreloader();
    initFinaleObserver();

    // Enable direct dialing on secondary phone click
    const secPhone = document.getElementById('secPhoneLink');
    if (secPhone) {
      secPhone.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = 'tel:+919618231993';
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });

    updateScrollState();
  });

})();
