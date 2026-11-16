import { ensureGsapRegistered, gsap } from '../core/gsap-config';
import { MOTION_DURATION, MOTION_EASE } from '../core/motion-tokens';
import { RouteTransitionDescriptor } from './route-transition';

export function animatePageExit(
  container: HTMLElement | null,
  descriptor: RouteTransitionDescriptor,
  reducedMotion: boolean
): Promise<void> {
  if (!container || reducedMotion) {
    return Promise.resolve();
  }

  ensureGsapRegistered();

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    // Safety cap: never block navigation indefinitely
    const safetyTimer = window.setTimeout(finish, 420);

    const toVars: gsap.TweenVars =
      descriptor.style === 'directional'
        ? {
            opacity: 0,
            x: descriptor.direction === 'forward' ? -20 : 20,
            duration: 0.24,
            ease: MOTION_EASE.exit,
          }
        : {
            opacity: 0,
            y: -8,
            duration: Math.min(0.24, MOTION_DURATION.ui),
            ease: MOTION_EASE.exit,
          };

    gsap.to(container, {
      ...toVars,
      onComplete: () => {
        window.clearTimeout(safetyTimer);
        finish();
      },
    });
  });
}
