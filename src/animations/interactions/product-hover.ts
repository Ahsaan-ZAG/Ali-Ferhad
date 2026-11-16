import { MOTION_DURATION, MOTION_EASE } from '../core/motion-tokens';
import { gsap } from '../core/gsap-config';
import { isReducedMotionPreferred } from '../core/animation-context';

export function animateQuickAddDrawer(el: HTMLElement | null): () => void {
  if (!el || isReducedMotionPreferred()) return () => {};
  const tween = gsap.fromTo(
    el,
    { y: 8, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: MOTION_DURATION.ui,
      ease: MOTION_EASE.editorial,
      clearProps: 'transform,opacity',
    }
  );
  return () => {
    tween.kill();
  };
}

export function animateWishlistPulse(el: HTMLElement | null): void {
  if (!el || isReducedMotionPreferred()) return;
  gsap.killTweensOf(el);
  gsap.fromTo(
    el,
    { scale: 0.92 },
    {
      scale: 1.16,
      duration: 0.18,
      ease: 'power2.out',
      yoyo: true,
      repeat: 1,
      clearProps: 'transform',
    }
  );
}

export function animateQuickAddSuccess(el: HTMLElement | null): () => void {
  if (!el || isReducedMotionPreferred()) return () => {};
  const tween = gsap.fromTo(
    el,
    { opacity: 0, y: 6 },
    {
      opacity: 1,
      y: 0,
      duration: 0.24,
      ease: MOTION_EASE.entrance,
      clearProps: 'transform,opacity',
    }
  );
  return () => tween.kill();
}

export function animateCardTapFeedback(el: HTMLElement | null): void {
  if (!el || isReducedMotionPreferred()) return;
  gsap.killTweensOf(el, 'scale');
  gsap.fromTo(
    el,
    { scale: 0.988 },
    {
      scale: 1,
      duration: 0.22,
      ease: 'power2.out',
      clearProps: 'transform',
    }
  );
}
