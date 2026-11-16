import { ensureGsapRegistered, gsap } from '../core/gsap-config';
import { createResponsiveMotionContext } from '../core/animation-context';
import { MOTION_DISTANCE } from '../core/motion-tokens';

export function setupImageParallax(
  triggerEl: HTMLElement | null,
  imageEl: HTMLElement | null,
  options?: { desktopShift?: number; scaleFrom?: number; scaleTo?: number }
): () => void {
  if (!triggerEl || !imageEl) return () => {};
  ensureGsapRegistered();

  const shift = options?.desktopShift ?? MOTION_DISTANCE.parallaxDesktop;
  const scaleFrom = options?.scaleFrom ?? 1.06;
  const scaleTo = options?.scaleTo ?? 1;

  const mm = createResponsiveMotionContext(({ isDesktop, isTablet, reducedMotion }) => {
    if (reducedMotion || (!isDesktop && !isTablet)) {
      gsap.set(imageEl, { y: 0, scale: 1, clearProps: 'transform' });
      return;
    }

    const distance = isDesktop ? shift : Math.round(shift * 0.45);
    gsap.fromTo(
      imageEl,
      { y: -distance / 2, scale: scaleFrom },
      {
        y: distance / 2,
        scale: scaleTo,
        ease: 'none',
        scrollTrigger: {
          trigger: triggerEl,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.7,
        },
      }
    );
  }, triggerEl);

  return () => mm.revert();
}

/**
 * Scrubbed 3D progress callback that updates a mutable ref rather than React state
 * so WebGL render loops read scroll velocity smoothly with zero 60Hz re-renders.
 */
export function setupScrollLinkedValue(
  triggerEl: HTMLElement | null,
  onProgress: (progress: number) => void
): () => void {
  if (!triggerEl) return () => {};
  ensureGsapRegistered();

  const mm = createResponsiveMotionContext(({ reducedMotion }) => {
    if (reducedMotion) {
      onProgress(0);
      return;
    }
    gsap.to(
      {},
      {
        scrollTrigger: {
          trigger: triggerEl,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
          onUpdate: (self) => onProgress(self.progress),
        },
      }
    );
  }, triggerEl);

  return () => mm.revert();
}
