import { ensureGsapRegistered, gsap } from '../core/gsap-config';
import { createResponsiveMotionContext } from '../core/animation-context';
import { MOTION_EASE } from '../core/motion-tokens';

/**
 * Controlled desktop-only storytelling section pinning.
 * Strictly disabled on tablet/mobile and reduced-motion so native scrolling is never interrupted.
 */
export function setupEditorialPinnedStory(
  sectionEl: HTMLElement | null,
  mediaColumnEl: HTMLElement | null,
  principleItemsSelector: string
): () => void {
  if (!sectionEl || !mediaColumnEl) return () => {};
  ensureGsapRegistered();

  const mm = createResponsiveMotionContext(({ isDesktop, reducedMotion }) => {
    if (!isDesktop || reducedMotion) return;

    const principles = gsap.utils.toArray<HTMLElement>(principleItemsSelector, sectionEl);

    gsap.to(mediaColumnEl, {
      scale: 1.03,
      ease: 'none',
      scrollTrigger: {
        trigger: sectionEl,
        start: 'top 15%',
        end: 'bottom 80%',
        scrub: 0.6,
      },
    });

    if (principles.length > 0) {
      gsap.from(principles, {
        y: 18,
        opacity: 0,
        stagger: 0.14,
        duration: 0.65,
        ease: MOTION_EASE.editorial,
        clearProps: 'transform,opacity',
        scrollTrigger: {
          trigger: sectionEl,
          start: 'top 72%',
          once: true,
        },
      });
    }
  }, sectionEl);

  return () => mm.revert();
}
