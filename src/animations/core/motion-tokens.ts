/**
 * Centralized luxury editorial motion tokens.
 * All GSAP timelines, CSS transitions, and scroll choreography draw from these presets.
 */

export const MOTION_DURATION = {
  micro: 0.15,        // 150ms — micro-interactions, icon toggles, swatches
  ui: 0.24,           // 240ms — buttons, dropdowns, drawer items
  standard: 0.58,     // 580ms — standard card & section reveals
  editorial: 0.85,    // 850ms — editorial typography & image reveals
  hero: 1.15,         // 1150ms — homepage hero choreography window
  pageTransition: 0.56, // 560ms — curtain / image reveal transitions
  curtainReveal: 0.64,
} as const;

export const MOTION_EASE = {
  entrance: 'power3.out',
  editorial: 'expo.out',
  imageExpansion: 'power4.inOut',
  navigation: 'power3.inOut',
  exit: 'power2.in',
  hover: 'power2.out',
  cssHover: 'cubic-bezier(0.16, 1, 0.3, 1)',
} as const;

export const MOTION_STAGGER = {
  tight: 0.045,
  cards: 0.08,
  navigation: 0.055,
  editorial: 0.11,
} as const;

export const MOTION_DISTANCE = {
  subtleY: 16,
  editorialY: 28,
  parallaxDesktop: 48,
  parallaxTablet: 20,
} as const;

export const BREAKPOINTS = {
  mobileMax: 767,
  tabletMax: 1023,
  desktopMin: 1024,
} as const;
