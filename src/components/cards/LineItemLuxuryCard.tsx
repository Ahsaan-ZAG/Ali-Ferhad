import { ArrowRight, Trash2 } from 'lucide-react';
import { PageTransitionLink } from '../../animations/components/PageTransitionLink';
import { LuxuryImage } from '../ui/LuxuryImage';

interface LineItemLuxuryCardProps {
  title: string;
  subtitle: string;
  priceText: string;
  compareAtText?: string | null;
  imageUrl: string;
  imageAlt: string;
  to: string;
  darkSurface?: boolean;
  onNavigate?: () => void;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  onRemove?: () => void;
  removeLabel?: string;
  children?: React.ReactNode;
}

export function LineItemLuxuryCard({
  title,
  subtitle,
  priceText,
  compareAtText,
  imageUrl,
  imageAlt,
  to,
  darkSurface = false,
  onNavigate,
  actionLabel,
  onAction,
  actionDisabled = false,
  onRemove,
  removeLabel,
  children,
}: LineItemLuxuryCardProps) {
  return (
    <article
      className={`rounded-[16px] border p-3 flex gap-3.5 transition-colors ${
        darkSurface
          ? 'bg-[#2A1018] border-[#D6B88C]/25 hover:border-[#D6B88C]/60 text-[#F5EEE5]'
          : 'bg-[#FFFFFF] border-[#35151F]/14 hover:border-[#8B2635]/45 text-[#35151F]'
      }`}
    >
      <PageTransitionLink
        to={to}
        imageUrl={imageUrl}
        imageAlt={imageAlt}
        onClick={onNavigate}
        className={`w-20 sm:w-24 aspect-[4/5] rounded-[10px] shrink-0 overflow-hidden border ${
          darkSurface ? 'bg-[#210B12] border-[#D6B88C]/20' : 'bg-[#F5EEE5] border-[#35151F]/10'
        }`}
      >
        <LuxuryImage
          src={imageUrl}
          alt={imageAlt}
          className="w-full h-full object-cover object-top"
        />
      </PageTransitionLink>

      <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p
              className={`text-[11px] uppercase tracking-[0.11em] truncate ${
                darkSurface ? 'text-[#D6B88C]' : 'text-[#6D595E]'
              }`}
            >
              {subtitle}
            </p>
            <PageTransitionLink
              to={to}
              imageUrl={imageUrl}
              imageAlt={imageAlt}
              onClick={onNavigate}
              className={`font-display text-lg sm:text-xl leading-snug hover:underline underline-offset-4 block ${
                darkSurface ? 'text-[#F5EEE5]' : 'text-[#35151F]'
              }`}
            >
              {title}
            </PageTransitionLink>
          </div>

          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              aria-label={removeLabel ?? `Remove ${title}`}
              className={`min-h-[48px] min-w-[48px] -mt-1.5 -mr-1.5 rounded-[10px] flex items-center justify-center transition-colors shrink-0 ${
                darkSurface
                  ? 'text-[#F5EEE5]/70 hover:text-[#D6B88C]'
                  : 'text-[#6D595E] hover:text-[#8B2635]'
              }`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-baseline gap-2 tabular-nums">
            <span
              className={`text-sm font-semibold ${
                darkSurface ? 'text-[#D6B88C]' : 'text-[#35151F]'
              }`}
            >
              {priceText}
            </span>
            {compareAtText && (
              <span
                className={`text-xs line-through ${
                  darkSurface ? 'text-[#F5EEE5]/50' : 'text-[#6D595E]'
                }`}
              >
                {compareAtText}
              </span>
            )}
          </div>

          {actionLabel && onAction && (
            <button
              type="button"
              disabled={actionDisabled}
              onClick={onAction}
              className={`min-h-[48px] px-3.5 rounded-[10px] text-xs font-medium tracking-wide transition-colors inline-flex items-center gap-1.5 disabled:opacity-40 ${
                darkSurface
                  ? 'bg-[#35151F] border border-[#D6B88C]/40 text-[#F5EEE5] hover:bg-[#D6B88C] hover:text-[#35151F]'
                  : 'bg-[#35151F] text-[#F5EEE5] hover:bg-[#8B2635]'
              }`}
            >
              <span>{actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {children}
      </div>
    </article>
  );
}
