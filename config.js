/**
 * DDS EXPO — Scrollytelling Configuration
 * Central configuration for scenes, frame counts, chapter thresholds, heights, and coordinates.
 */

const DDS_CONFIG = {
  // Global settings
  lerpFactor: 0.15,
  cursorLerp: 0.18,
  mobileBreakpoint: 768,

  // Design tokens & colors
  colors: {
    paper: '#FFFFFF',
    mist: '#F3F6FE',
    navy: '#012970',
    inkSoft: '#41507A',
    royal: '#4154F1',
    sky: '#2DB6FA',
    hairline: 'rgba(1, 41, 112, 0.12)',
  },

  // Preloader configuration
  preloader: {
    initialHeroFrames: 24, // Hero frames 1–24 loaded before page reveal
    totalInitialCount: 24,
  },

  // 7 Pinned Robot Scenes Configuration
  scenes: {
    hero: {
      id: 'hero',
      chapterIndex: '01',
      totalScenes: '07',
      label: 'MEET YOUR AI TEAM',
      frameCount: 63,
      desktopPath: 'assets/frames/hero/frame_{index}.webp',
      mobilePath: 'assets/frames/hero-mobile/frame_{index}.webp',
      height: '500vh',
      aspectRatio: 16 / 9,
      chapters: [
        {
          id: 'hero-ch1',
          start: 0.0,
          end: 0.18,
          align: 'left',
        },
        {
          id: 'hero-ch2',
          start: 0.25,
          end: 0.44,
          align: 'left',
        },
        {
          id: 'hero-ch3',
          start: 0.52,
          end: 0.72,
          align: 'left',
        },
        {
          id: 'hero-ch4',
          start: 0.80,
          end: 1.0,
          align: 'left',
        },
      ],
      fadeToWhiteStart: 0.96, // Over the last 4%, canvas fades to solid --paper
    },

    work: {
      id: 'work',
      chapterIndex: '02',
      totalScenes: '07',
      label: 'CONTINUOUS EXECUTION',
      frameCount: 63,
      desktopPath: 'assets/frames/work/frame_{index}.webp',
      mobilePath: 'assets/frames/work-mobile/frame_{index}.webp',
      height: '400vh',
      aspectRatio: 16 / 9,
      chapters: [
        {
          id: 'work-ch1',
          start: 0.10,
          end: 0.45,
          align: 'left',
        },
        {
          id: 'work-ch2',
          start: 0.55,
          end: 0.92,
          align: 'left',
        },
      ],
    },

    exploded: {
      id: 'exploded',
      chapterIndex: '03',
      totalScenes: '07',
      label: 'PRECISION HARDWARE',
      frameCount: 63,
      desktopPath: 'assets/frames/exploded/frame_{index}.webp',
      mobilePath: 'assets/frames/exploded-mobile/frame_{index}.webp',
      height: '400vh',
      aspectRatio: 16 / 9,
      title: 'Every click, engineered.',
      calloutsThreshold: 0.65, // Fade in callouts after 65% progress
      callouts: [
        {
          id: 'callout-keys',
          label: 'KEYS',
          desc: 'Every stroke intentional',
          anchorX: 28, // % from left of canvas frame
          anchorY: 26, // % from top of canvas frame
          lineLength: 70, // px
          lineAngle: -35, // deg
          cardOffsetX: -140, // px
          cardOffsetY: -50,
          delay: 0.0,
        },
        {
          id: 'callout-shell',
          label: 'SHELL',
          desc: 'Lightweight by design',
          anchorX: 26,
          anchorY: 74,
          lineLength: 60,
          lineAngle: 30,
          cardOffsetX: -140,
          cardOffsetY: 40,
          delay: 0.15,
        },
        {
          id: 'callout-signal',
          label: 'SIGNAL',
          desc: 'Zero-lag execution',
          anchorX: 84,
          anchorY: 46,
          lineLength: 75,
          lineAngle: -145,
          cardOffsetX: 30,
          cardOffsetY: -50,
          delay: 0.30,
        },
        {
          id: 'callout-sensor',
          label: 'SENSOR',
          desc: 'Pixel-perfect targeting',
          anchorX: 83,
          anchorY: 76,
          lineLength: 65,
          lineAngle: 140,
          cardOffsetX: 30,
          cardOffsetY: 35,
          delay: 0.45,
        },
      ],
    },

    analytics: {
      id: 'analytics',
      chapterIndex: '04',
      totalScenes: '07',
      label: 'HOLOGRAPHIC INSIGHTS',
      frameCount: 63,
      desktopPath: 'assets/frames/analytics/frame_{index}.webp',
      mobilePath: 'assets/frames/analytics-mobile/frame_{index}.webp',
      height: '400vh',
      aspectRatio: 16 / 9,
      chapters: [
        {
          id: 'analytics-ch1',
          start: 0.10,
          end: 0.45,
          align: 'left',
        },
        {
          id: 'analytics-ch2',
          start: 0.55,
          end: 0.90,
          align: 'left',
        },
      ],
    },

    orbit: {
      id: 'orbit',
      chapterIndex: '05',
      totalScenes: '07',
      label: 'CONTENT ECOSYSTEM',
      frameCount: 63,
      desktopPath: 'assets/frames/orbit/frame_{index}.webp',
      mobilePath: 'assets/frames/orbit-mobile/frame_{index}.webp',
      height: '400vh',
      aspectRatio: 16 / 9,
      chapters: [
        {
          id: 'orbit-ch1',
          start: 0.10,
          end: 0.45,
          align: 'left',
        },
        {
          id: 'orbit-ch2',
          start: 0.55,
          end: 0.90,
          align: 'left',
        },
      ],
    },

    sitebuilder: {
      id: 'sitebuilder',
      chapterIndex: '06',
      totalScenes: '07',
      label: 'AUTONOMOUS ARCHITECTURE',
      frameCount: 63,
      desktopPath: 'assets/frames/sitebuilder/frame_{index}.webp',
      mobilePath: 'assets/frames/sitebuilder-mobile/frame_{index}.webp',
      height: '400vh',
      aspectRatio: 16 / 9,
      chapters: [
        {
          id: 'sitebuilder-ch1',
          start: 0.10,
          end: 0.45,
          align: 'left',
        },
        {
          id: 'sitebuilder-ch2',
          start: 0.55,
          end: 0.90,
          align: 'left',
        },
      ],
    },

    automation: {
      id: 'automation',
      chapterIndex: '07',
      totalScenes: '07',
      label: 'CONVERSATIONAL INTELLIGENCE',
      frameCount: 63,
      desktopPath: 'assets/frames/automation/frame_{index}.webp',
      mobilePath: 'assets/frames/automation-mobile/frame_{index}.webp',
      height: '400vh',
      aspectRatio: 16 / 9,
      chapters: [
        {
          id: 'automation-ch1',
          start: 0.10,
          end: 0.45,
          align: 'left',
        },
        {
          id: 'automation-ch2',
          start: 0.55,
          end: 0.90,
          align: 'left',
        },
      ],
    },
  },

  // Folder statistics for reporting
  folderStats: {
    hero: { count: 63, desktopSizeMB: 1.31, mobileSizeMB: 0.62 },
    work: { count: 63, desktopSizeMB: 2.47, mobileSizeMB: 1.17 },
    exploded: { count: 63, desktopSizeMB: 2.41, mobileSizeMB: 1.19 },
    analytics: { count: 63, desktopSizeMB: 1.74, mobileSizeMB: 0.85 },
    orbit: { count: 63, desktopSizeMB: 1.34, mobileSizeMB: 0.65 },
    sitebuilder: { count: 63, desktopSizeMB: 1.66, mobileSizeMB: 0.85 },
    automation: { count: 63, desktopSizeMB: 2.14, mobileSizeMB: 1.06 },
  },
};

// Make accessible to browser window
if (typeof window !== 'undefined') {
  window.DDS_CONFIG = DDS_CONFIG;
}
