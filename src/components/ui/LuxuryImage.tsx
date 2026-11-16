import { useState } from 'react';
import { BRAND_CONFIG } from '../../config/brand';

interface LuxuryImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}

export function LuxuryImage({
  src,
  alt,
  className = '',
  loading = 'lazy',
}: LuxuryImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-[#E6DDD0] text-[#77716A] p-6 text-center ${className}`}
      >
        <span className="font-display text-lg tracking-wide text-[#171717]">
          {BRAND_CONFIG.wordmark}
        </span>
        <span className="mt-1 text-xs text-[#77716A] max-w-[18ch]">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
