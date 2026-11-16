import { useEffect, useRef, useState } from 'react';
import { isFinePointerDesktop } from '../core/animation-context';
import { ensureGsapRegistered, gsap } from '../core/gsap-config';
import { CursorMode, resolveCursorMode } from '../interactions/custom-cursor';

export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<CursorMode>('default');
  const [label, setLabel] = useState('');
  const [visible, setVisible] = useState(false);
  const dotRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const check = () => setEnabled(isFinePointerDesktop());
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!enabled || !dotRef.current) return;
    ensureGsapRegistered();

    const el = dotRef.current;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.18, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.18, ease: 'power3.out' });

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') {
        setVisible(false);
        return;
      }
      setVisible(true);
      xTo(e.clientX);
      yTo(e.clientY);
      const next = resolveCursorMode(e.target);
      setMode((prev) => (prev === next.mode ? prev : next.mode));
      setLabel((prev) => (prev === next.label ? prev : next.label));
    };

    const onLeave = () => setVisible(false);

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);

    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, [enabled]);

  if (!enabled) return null;

  const isPillLabel = mode === 'view' || mode === 'drag';
  const sizeClass = isPillLabel
    ? 'px-3 py-1 bg-[#111111] text-[#F5F1EA] border border-[#B8A58C]/60 text-[10px] uppercase tracking-[0.12em]'
    : mode === 'image'
    ? 'w-8 h-8 border border-[#B8A58C] bg-[#FAF8F4]/25'
    : mode === 'link' || mode === 'button'
    ? 'w-5 h-5 border border-[#111111] bg-[#B8A58C]/35'
    : 'w-2.5 h-2.5 bg-[#111111]/75';

  return (
    <div
      ref={dotRef}
      aria-hidden="true"
      data-testid="editorial-custom-cursor"
      data-cursor-mode={mode}
      className={`fixed top-0 left-0 z-[80] pointer-events-none -translate-x-1/2 -translate-y-1/2 rounded-full transition-[opacity,width,height,background-color] duration-200 flex items-center justify-center ${sizeClass} ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {isPillLabel && <span>{label}</span>}
    </div>
  );
}
