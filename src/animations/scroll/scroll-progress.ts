import { ensureGsapRegistered, gsap } from '../core/gsap-config';
import { isReducedMotionPreferred } from '../core/animation-context';

export function setupScrollProgressBar(barEl: HTMLElement | null): () => void {
  if (!barEl) return () => {};
  ensureGsapRegistered();

  if (isReducedMotionPreferred()) {
    barEl.style.transform = 'scaleX(0)';
    return () => {};
  }

  const ctx = gsap.context(() => {
    gsap.fromTo(
      barEl,
      { scaleX: 0 },
      {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: document.documentElement,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.15,
        },
      }
    );
  });

  return () => ctx.revert();
}
