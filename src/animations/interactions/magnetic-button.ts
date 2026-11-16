import { ensureGsapRegistered, gsap } from '../core/gsap-config';
import { isFinePointerDesktop } from '../core/animation-context';
import { MOTION_DURATION, MOTION_EASE } from '../core/motion-tokens';

export function bindMagneticButton(
  el: HTMLElement | null,
  strength = 0.22
): () => void {
  if (!el || !isFinePointerDesktop()) return () => {};
  ensureGsapRegistered();

  const xTo = gsap.quickTo(el, 'x', {
    duration: MOTION_DURATION.ui,
    ease: MOTION_EASE.hover,
  });
  const yTo = gsap.quickTo(el, 'y', {
    duration: MOTION_DURATION.ui,
    ease: MOTION_EASE.hover,
  });

  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const relX = e.clientX - (rect.left + rect.width / 2);
    const relY = e.clientY - (rect.top + rect.height / 2);
    // Bounded small offset so targets never jump away from cursor
    const maxOffset = 8;
    const dx = Math.max(-maxOffset, Math.min(maxOffset, relX * strength));
    const dy = Math.max(-maxOffset, Math.min(maxOffset, relY * strength));
    xTo(dx);
    yTo(dy);
  };

  const onLeave = () => {
    xTo(0);
    yTo(0);
  };

  el.addEventListener('pointermove', onMove, { passive: true });
  el.addEventListener('pointerleave', onLeave);

  return () => {
    el.removeEventListener('pointermove', onMove);
    el.removeEventListener('pointerleave', onLeave);
    gsap.set(el, { x: 0, y: 0, clearProps: 'transform' });
  };
}
