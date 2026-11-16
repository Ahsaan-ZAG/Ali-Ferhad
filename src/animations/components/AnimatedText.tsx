import { useEffect, useRef } from 'react';
import { isReducedMotionPreferred } from '../core/animation-context';
import { ensureGsapRegistered, gsap } from '../core/gsap-config';
import { MOTION_DURATION, MOTION_EASE, MOTION_STAGGER } from '../core/motion-tokens';

interface AnimatedTextProps {
  lines: string[];
  as?: 'h1' | 'h2' | 'h3' | 'p';
  className?: string;
  triggerOnScroll?: boolean;
  delay?: number;
}

/**
 * Accessible line-by-line editorial reveal without requiring paid SplitText plugins.
 */
export function AnimatedText({
  lines,
  as = 'h2',
  className = '',
  triggerOnScroll = true,
  delay = 0,
}: AnimatedTextProps) {
  const containerRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || isReducedMotionPreferred()) return;
    ensureGsapRegistered();

    const ctx = gsap.context(() => {
      const innerLines = gsap.utils.toArray<HTMLElement>('.anim-line-inner', el);
      if (!innerLines.length) return;

      gsap.fromTo(
        innerLines,
        { yPercent: 105, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: MOTION_DURATION.editorial,
          stagger: MOTION_STAGGER.editorial,
          delay,
          ease: MOTION_EASE.editorial,
          clearProps: 'transform,opacity',
          ...(triggerOnScroll
            ? {
                scrollTrigger: {
                  trigger: el,
                  start: 'top 90%',
                  once: true,
                },
              }
            : {}),
        }
      );
    }, el);

    return () => ctx.revert();
  }, [triggerOnScroll, delay]);

  const Tag = as;
  return (
    <Tag ref={containerRef as never} className={className} aria-label={lines.join(' ')}>
      {lines.map((line, i) => (
        <span key={i} aria-hidden="true" className="block overflow-hidden">
          <span className="anim-line-inner block">{line}</span>
        </span>
      ))}
    </Tag>
  );
}
