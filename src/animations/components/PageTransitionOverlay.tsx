import { useEffect, useRef } from 'react';
import { isReducedMotionPreferred } from '../core/animation-context';
import { ensureGsapRegistered, gsap } from '../core/gsap-config';
import { MOTION_DURATION, MOTION_EASE } from '../core/motion-tokens';
import { RouteTransitionDescriptor } from '../transitions/route-transition';

interface PageTransitionOverlayProps {
  phase: 'idle' | 'entering' | 'exiting';
  descriptor: RouteTransitionDescriptor;
}

export function PageTransitionOverlay({ phase, descriptor }: PageTransitionOverlayProps) {
  const curtainRef = useRef<HTMLDivElement | null>(null);
  const imageFloatRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isReducedMotionPreferred()) return;
    ensureGsapRegistered();

    const curtain = curtainRef.current;
    const floater = imageFloatRef.current;

    if (descriptor.style === 'curtain' && curtain) {
      if (phase === 'entering') {
        gsap.killTweensOf(curtain);
        gsap.set(curtain, {
          display: 'block',
          transformOrigin: 'bottom center',
          scaleY: 0,
          opacity: 1,
        });
        gsap.to(curtain, {
          scaleY: 1,
          duration: 0.28,
          ease: MOTION_EASE.navigation,
        });
      } else if (phase === 'exiting') {
        gsap.killTweensOf(curtain);
        gsap.set(curtain, { transformOrigin: 'top center' });
        gsap.to(curtain, {
          scaleY: 0,
          duration: MOTION_DURATION.curtainReveal * 0.72,
          ease: MOTION_EASE.editorial,
          onComplete: () => {
            gsap.set(curtain, { display: 'none' });
          },
        });
      } else {
        gsap.set(curtain, { display: 'none', scaleY: 0 });
      }
      return;
    }

    if (curtain) {
      gsap.set(curtain, { display: 'none', scaleY: 0 });
    }

    if (descriptor.style === 'image-reveal' && descriptor.imagePayload && floater) {
      const { rect } = descriptor.imagePayload;
      if (phase === 'entering') {
        gsap.killTweensOf(floater);
        gsap.set(floater, {
          display: 'block',
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          opacity: 0.96,
          scale: 1,
        });
        const targetWidth = Math.min(window.innerWidth * 0.44, 520);
        const targetHeight = targetWidth * 1.33;
        const targetLeft = Math.max(32, (window.innerWidth - 1340) / 2 + 32);
        const targetTop = 140;

        gsap.to(floater, {
          top: targetTop,
          left: targetLeft,
          width: targetWidth,
          height: targetHeight,
          duration: 0.34,
          ease: MOTION_EASE.imageExpansion,
        });
      } else if (phase === 'exiting') {
        gsap.to(floater, {
          opacity: 0,
          duration: 0.3,
          ease: MOTION_EASE.hover,
          onComplete: () => {
            gsap.set(floater, { display: 'none' });
          },
        });
      } else {
        gsap.set(floater, { display: 'none' });
      }
    } else if (floater) {
      gsap.set(floater, { display: 'none' });
    }
  }, [phase, descriptor]);

  const curtainBg =
    descriptor.curtainTone === 'charcoal' ? 'bg-[#35151F]' : 'bg-[#F5EEE5]';

  return (
    <>
      <div
        ref={curtainRef}
        aria-hidden="true"
        data-testid="page-transition-curtain"
        className={`fixed inset-0 z-[70] pointer-events-none hidden ${curtainBg}`}
      />
      <div
        ref={imageFloatRef}
        aria-hidden="true"
        className="fixed z-[71] pointer-events-none hidden overflow-hidden rounded-[20px] bg-[#EFE4D6] shadow-2xl"
      >
        {descriptor.imagePayload && (
          <img
            src={descriptor.imagePayload.imageUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        )}
      </div>
    </>
  );
}
