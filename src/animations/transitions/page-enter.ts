import { ensureGsapRegistered, gsap, refreshScrollTriggers } from '../core/gsap-config';
import { MOTION_DISTANCE, MOTION_DURATION, MOTION_EASE } from '../core/motion-tokens';
import { RouteTransitionDescriptor } from './route-transition';

export function animatePageEnter(
  container: HTMLElement | null,
  descriptor: RouteTransitionDescriptor,
  reducedMotion: boolean
): gsap.core.Tween | gsap.core.Timeline | null {
  if (!container) return null;
  ensureGsapRegistered();

  if (reducedMotion) {
    gsap.set(container, { opacity: 1, y: 0, x: 0, clearProps: 'transform,opacity' });
    refreshScrollTriggers();
    return null;
  }

  const fromVars: gsap.TweenVars =
    descriptor.style === 'directional'
      ? { opacity: 0, x: descriptor.direction === 'forward' ? 28 : -28 }
      : descriptor.style === 'editorial-fade'
      ? { opacity: 0, y: MOTION_DISTANCE.subtleY }
      : { opacity: 0, y: 10 };

  const tween = gsap.fromTo(container, fromVars, {
    opacity: 1,
    x: 0,
    y: 0,
    duration:
      descriptor.style === 'editorial-fade'
        ? MOTION_DURATION.standard
        : MOTION_DURATION.pageTransition,
    ease: MOTION_EASE.editorial,
    clearProps: 'transform,opacity',
    onComplete: () => {
      refreshScrollTriggers();
    },
  });

  return tween;
}
