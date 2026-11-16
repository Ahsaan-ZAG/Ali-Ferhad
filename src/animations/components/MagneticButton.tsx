import React, { useEffect, useRef } from 'react';
import { bindMagneticButton } from '../interactions/magnetic-button';

interface MagneticButtonProps {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}

/**
 * Subtle fine-pointer magnetic wrapper. Disabled automatically on touch devices & reduced motion.
 */
export function MagneticButton({
  children,
  strength = 0.2,
  className = 'inline-block',
}: MagneticButtonProps) {
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    return bindMagneticButton(ref.current, strength);
  }, [strength]);

  return (
    <span ref={ref} className={className}>
      {children}
    </span>
  );
}
