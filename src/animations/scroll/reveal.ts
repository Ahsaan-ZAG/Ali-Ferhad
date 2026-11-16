import { ensureGsapRegistered, gsap, ScrollTrigger } from '../core/gsap-config';
import { MOTION_DISTANCE, MOTION_DURATION, MOTION_EASE, MOTION_STAGGER } from '../core/motion-tokens';
import { isReducedMotionPreferred } from '../core/animation-context';

export type RevealVariant = 'fade-up' | 'clip-curtain' | 'line-rise';

export function setupBatchCardReveal(
  selector: string | Element[],
  scope: Element | null
): () => void {
  if (!scope || isReducedMotionPreferred()) return () => {};
  ensureGsapRegistered();

  const mm = gsap.matchMedia();

  mm.add(
    {
      isDesktop: '(min-width: 768px)',
      isMobile: '(max-width: 767px)',
    },
    (context) => {
      const { isMobile } = context.conditions as { isDesktop: boolean; isMobile: boolean };
      const targets =
        typeof selector === 'string'
          ? gsap.utils.toArray<HTMLElement>(selector, scope)
          : (selector as HTMLElement[]);
      if (!targets.length) return;

      const belowFoldTargets = targets.filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.top > window.innerHeight * 0.96;
      });

      const visibleTargets = targets.filter((el) => !belowFoldTargets.includes(el));
      if (visibleTargets.length > 0) {
        gsap.set(visibleTargets, { y: 0, opacity: 1, clearProps: 'transform,opacity' });
      }

      if (!belowFoldTargets.length) return;

      gsap.set(belowFoldTargets, {
        y: isMobile ? 8 : MOTION_DISTANCE.subtleY,
        opacity: 0,
      });

      ScrollTrigger.batch(belowFoldTargets, {
        start: isMobile ? 'top 98%' : 'top 92%',
        once: true,
        onEnter: (batch) => {
          gsap.to(batch, {
            y: 0,
            opacity: 1,
            duration: isMobile ? MOTION_DURATION.ui * 1.15 : MOTION_DURATION.standard,
            stagger: isMobile ? MOTION_STAGGER.tight : MOTION_STAGGER.cards,
            ease: MOTION_EASE.editorial,
            clearProps: 'transform,opacity',
          });
        },
      });
      ScrollTrigger.refresh();
    }
  );

  return () => mm.revert();
}

export function runRevealAnimation(
  el: HTMLElement | null,
  variant: RevealVariant = 'fade-up',
  delay = 0
): () => void {
  if (!el || isReducedMotionPreferred()) {
    if (el) {
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.style.clipPath = 'none';
    }
    return () => {};
  }

  ensureGsapRegistered();
  const ctx = gsap.context(() => {
    if (variant === 'clip-curtain') {
      gsap.fromTo(
        el,
        { clipPath: 'inset(10% 0% 0% 0% round 16px)', opacity: 0.4, scale: 1.04 },
        {
          clipPath: 'inset(0% 0% 0% 0% round 16px)',
          opacity: 1,
          scale: 1,
          duration: MOTION_DURATION.editorial,
          delay,
          ease: MOTION_EASE.editorial,
          clearProps: 'clipPath,transform,opacity',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            once: true,
          },
        }
      );
    } else if (variant === 'line-rise') {
      gsap.fromTo(
        el,
        { y: MOTION_DISTANCE.editorialY, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: MOTION_DURATION.editorial,
          delay,
          ease: MOTION_EASE.editorial,
          clearProps: 'transform,opacity',
          scrollTrigger: {
            trigger: el,
            start: 'top 90%',
            once: true,
          },
        }
      );
    } else {
      gsap.fromTo(
        el,
        { y: MOTION_DISTANCE.subtleY, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: MOTION_DURATION.standard,
          delay,
          ease: MOTION_EASE.entrance,
          clearProps: 'transform,opacity',
          scrollTrigger: {
            trigger: el,
            start: 'top 90%',
            once: true,
          },
        }
      );
    }
  }, el);

  return () => ctx.revert();
}
