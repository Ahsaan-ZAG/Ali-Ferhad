import { useEffect, useRef } from 'react';
import { setupScrollProgressBar } from '../scroll/scroll-progress';

export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return setupScrollProgressBar(barRef.current);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-50 h-[2px] bg-transparent pointer-events-none"
    >
      <div
        ref={barRef}
        data-testid="scroll-progress-bar"
        className="h-full w-full bg-[#B8A58C] origin-left scale-x-0"
      />
    </div>
  );
}
