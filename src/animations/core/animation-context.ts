import { BREAKPOINTS } from './motion-tokens';
import { ensureGsapRegistered, gsap } from './gsap-config';

export function isReducedMotionPreferred(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function isFinePointerDesktop(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.innerWidth >= BREAKPOINTS.desktopMin &&
    window.matchMedia('(pointer: fine)').matches &&
    !isReducedMotionPreferred()
  );
}

/**
 * Creates a responsive GSAP matchMedia manager that disables heavy pinning
 * and parallax on touch/mobile viewports or when prefers-reduced-motion is active.
 */
export function createResponsiveMotionContext(
  setup: (env: {
    isDesktop: boolean;
    isTablet: boolean;
    isMobile: boolean;
    reducedMotion: boolean;
  }) => void | (() => void),
  scope?: Element | string | null
) {
  ensureGsapRegistered();
  const mm = gsap.matchMedia(scope ?? undefined);

  mm.add(
    {
      isDesktop: `(min-width: ${BREAKPOINTS.desktopMin}px)`,
      isTablet: `(min-width: ${BREAKPOINTS.mobileMax + 1}px) and (max-width: ${BREAKPOINTS.tabletMax}px)`,
      isMobile: `(max-width: ${BREAKPOINTS.mobileMax}px)`,
      reducedMotion: '(prefers-reduced-motion: reduce)',
    },
    (context) => {
      const cond = (context.conditions ?? {}) as Record<string, boolean>;
      return setup({
        isDesktop: Boolean(cond.isDesktop),
        isTablet: Boolean(cond.isTablet),
        isMobile: Boolean(cond.isMobile),
        reducedMotion: Boolean(cond.reducedMotion),
      });
    }
  );

  return mm;
}

/**
 * Locks body scroll safely while maintaining layout stability and returns an unlock cleanup.
 */
export function lockBodyScroll(): () => void {
  if (typeof document === 'undefined') return () => {};
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  return () => {
    document.body.style.overflow = prevOverflow;
  };
}

/**
 * Focus trap & focus restoration utility for accessible overlays and drawers.
 */
export function trapFocusInElement(container: HTMLElement | null): () => void {
  if (!container || typeof document === 'undefined') return () => {};
  const previousFocus = document.activeElement as HTMLElement | null;

  const focusableSelector =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  const getFocusable = () =>
    Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter(
      (el) => el.offsetParent !== null || el === document.activeElement
    );

  const timer = window.setTimeout(() => {
    const items = getFocusable();
    if (items.length > 0 && !container.contains(document.activeElement)) {
      items[0].focus();
    }
  }, 30);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const items = getFocusable();
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  container.addEventListener('keydown', onKeyDown);
  return () => {
    window.clearTimeout(timer);
    container.removeEventListener('keydown', onKeyDown);
    if (previousFocus && typeof previousFocus.focus === 'function') {
      previousFocus.focus();
    }
  };
}
