import { ArrowRight } from 'lucide-react';
import { PageTransitionLink } from '../../animations/components/PageTransitionLink';
import { PromotionalCategory } from '../../lib/cardTokens';
import { LuxuryImage } from '../ui/LuxuryImage';

export interface PromotionalFeatureCardProps {
  kind: PromotionalCategory;
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  to: string;
  imageUrl: string;
  imageAlt: string;
  metaNote?: string;
  layout?: 'split' | 'editorial-overlay' | 'spotlight';
}

const KIND_STYLES: Record<
  PromotionalCategory,
  {
    surface: string;
    border: string;
    eyebrowColor: string;
    titleColor: string;
    bodyColor: string;
    metaColor: string;
    ctaClass: string;
    accentBar: string;
  }
> = {
  'new-arrivals': {
    surface: 'bg-[#FFFFFF]',
    border: 'border-[#35151F]/15 hover:border-[#8B2635]/50',
    eyebrowColor: 'text-[#8B2635]',
    titleColor: 'text-[#35151F]',
    bodyColor: 'text-[#6D595E]',
    metaColor: 'text-[#35151F]',
    ctaClass:
      'bg-[#35151F] text-[#F5EEE5] hover:bg-[#8B2635] border border-[#35151F]',
    accentBar: 'bg-[#8B2635]',
  },
  'best-sellers': {
    surface: 'bg-[#FAF6F0]',
    border: 'border-[#D6B88C]/55 hover:border-[#35151F]/50',
    eyebrowColor: 'text-[#35151F]',
    titleColor: 'text-[#35151F]',
    bodyColor: 'text-[#6D595E]',
    metaColor: 'text-[#8B2635]',
    ctaClass:
      'bg-[#FFFFFF] text-[#35151F] border border-[#35151F]/30 hover:bg-[#35151F] hover:text-[#F5EEE5]',
    accentBar: 'bg-[#D6B88C]',
  },
  'exclusive-collections': {
    surface: 'bg-[#35151F]',
    border: 'border-[#D6B88C]/35 hover:border-[#D6B88C]/75',
    eyebrowColor: 'text-[#D6B88C]',
    titleColor: 'text-[#FFFFFF]',
    bodyColor: 'text-[#F5EEE5]/82',
    metaColor: 'text-[#D6B88C]',
    ctaClass:
      'bg-[#F5EEE5] text-[#35151F] hover:bg-[#D6B88C] border border-[#F5EEE5]',
    accentBar: 'bg-[#D6B88C]',
  },
  'limited-editions': {
    surface: 'bg-[#240D14]',
    border: 'border-[#D6B88C]/35 hover:border-[#D6B88C]/80',
    eyebrowColor: 'text-[#D6B88C]',
    titleColor: 'text-[#F5EEE5]',
    bodyColor: 'text-[#F5EEE5]/78',
    metaColor: 'text-[#D6B88C]',
    ctaClass:
      'bg-transparent text-[#F5EEE5] border border-[#D6B88C]/60 hover:bg-[#D6B88C] hover:text-[#35151F]',
    accentBar: 'bg-[#D6B88C]',
  },
  'seasonal-collections': {
    surface: 'bg-[#FFFFFF]',
    border: 'border-[#35151F]/15 hover:border-[#35151F]/45',
    eyebrowColor: 'text-[#6D595E]',
    titleColor: 'text-[#35151F]',
    bodyColor: 'text-[#6D595E]',
    metaColor: 'text-[#8B2635]',
    ctaClass:
      'bg-[#35151F] text-[#F5EEE5] hover:bg-[#240D14] border border-[#35151F]',
    accentBar: 'bg-[#35151F]',
  },
  'special-offers': {
    surface: 'bg-[#8B2635]',
    border: 'border-[#D6B88C]/45 hover:border-[#F5EEE5]/75',
    eyebrowColor: 'text-[#F5EEE5]',
    titleColor: 'text-[#FFFFFF]',
    bodyColor: 'text-[#F5EEE5]/88',
    metaColor: 'text-[#D6B88C]',
    ctaClass:
      'bg-[#FFFFFF] text-[#35151F] hover:bg-[#F5EEE5] border border-[#FFFFFF]',
    accentBar: 'bg-[#D6B88C]',
  },
  'featured-products': {
    surface: 'bg-[#35151F]',
    border: 'border-[#D6B88C]/40 hover:border-[#D6B88C]/80',
    eyebrowColor: 'text-[#D6B88C]',
    titleColor: 'text-[#FFFFFF]',
    bodyColor: 'text-[#F5EEE5]/82',
    metaColor: 'text-[#D6B88C]',
    ctaClass:
      'bg-[#D6B88C] text-[#35151F] hover:bg-[#F5EEE5] border border-[#D6B88C]',
    accentBar: 'bg-[#D6B88C]',
  },
};

export function PromotionalFeatureCard({
  kind,
  eyebrow,
  title,
  description,
  ctaLabel,
  to,
  imageUrl,
  imageAlt,
  metaNote,
  layout = 'spotlight',
}: PromotionalFeatureCardProps) {
  const s = KIND_STYLES[kind];

  if (layout === 'editorial-overlay') {
    return (
      <div
        data-testid={`promo-card-${kind}`}
        className={`promo-card-reveal relative min-h-[420px] sm:min-h-[500px] md:min-h-[580px] rounded-[18px] overflow-hidden border flex items-end ${s.surface} ${s.border} transition-all duration-300`}
      >
        <div className="absolute inset-0">
          <LuxuryImage
            src={imageUrl}
            alt={imageAlt}
            className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-[1.02]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-[#1D0A10]/95 via-[#35151F]/55 to-transparent"
          />
        </div>

        <div className="relative z-10 w-full p-6 sm:p-10 md:p-14">
          <div className="max-w-2xl space-y-4">
            <div className="flex items-center gap-3">
              <span className={`h-[1px] w-8 ${s.accentBar}`} />
              <p className={`text-xs uppercase tracking-[0.16em] font-medium ${s.eyebrowColor}`}>
                {eyebrow}
              </p>
            </div>
            <h2 className="editorial-section-title text-[#FFFFFF]">{title}</h2>
            <p className="text-sm sm:text-base text-[#F5EEE5]/85 leading-relaxed max-w-xl">
              {description}
            </p>
            {metaNote && (
              <p className={`text-xs uppercase tracking-[0.12em] ${s.metaColor}`}>
                {metaNote}
              </p>
            )}
            <div className="pt-2">
              <PageTransitionLink
                to={to}
                imageUrl={imageUrl}
                imageAlt={imageAlt}
                className={`inline-flex items-center justify-center gap-2.5 min-h-[48px] rounded-[10px] px-6 py-3 text-xs font-medium uppercase tracking-[0.1em] transition-colors ${s.ctaClass}`}
              >
                <span>{ctaLabel}</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </PageTransitionLink>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (layout === 'split') {
    return (
      <article
        data-testid={`promo-card-${kind}`}
        className={`promo-card-reveal group rounded-[18px] border overflow-hidden grid grid-cols-1 md:grid-cols-12 items-stretch ${s.surface} ${s.border} transition-all duration-300 shadow-[0_8px_24px_-10px_rgba(53,21,31,0.08)]`}
      >
        <div className="md:col-span-5 p-3 pb-0 md:p-3.5">
          <div className="aspect-[4/3] md:aspect-[4/5] h-full rounded-[12px] overflow-hidden bg-[#240D14]">
            <LuxuryImage
              src={imageUrl}
              alt={imageAlt}
              className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
            />
          </div>
        </div>
        <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className={`h-[1px] w-6 ${s.accentBar}`} />
              <p className={`text-[11px] uppercase tracking-[0.14em] font-medium ${s.eyebrowColor}`}>
                {eyebrow}
              </p>
            </div>
            <h3 className={`font-display text-2xl sm:text-3xl leading-[1.1] ${s.titleColor}`}>
              {title}
            </h3>
            <p className={`text-sm leading-relaxed ${s.bodyColor}`}>{description}</p>
            {metaNote && (
              <p className={`text-xs font-medium tracking-wide pt-1 ${s.metaColor}`}>
                {metaNote}
              </p>
            )}
          </div>
          <div>
            <PageTransitionLink
              to={to}
              imageUrl={imageUrl}
              imageAlt={imageAlt}
              className={`inline-flex items-center justify-center gap-2 min-h-[48px] rounded-[10px] px-5 py-3 text-xs font-medium uppercase tracking-[0.09em] transition-colors ${s.ctaClass}`}
            >
              <span>{ctaLabel}</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </PageTransitionLink>
          </div>
        </div>
      </article>
    );
  }

  // Default: 'spotlight' vertical architectural card
  return (
    <article
      data-testid={`promo-card-${kind}`}
      className={`promo-card-reveal group rounded-[18px] border p-3 sm:p-3.5 flex flex-col justify-between transition-all duration-300 shadow-[0_8px_24px_-10px_rgba(53,21,31,0.1)] ${s.surface} ${s.border}`}
    >
      <div>
        <div className="relative aspect-[4/3] rounded-[12px] overflow-hidden bg-[#240D14]">
          <LuxuryImage
            src={imageUrl}
            alt={imageAlt}
            className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.035]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-[#1D0A10]/65 via-transparent to-transparent"
          />
          {metaNote && (
            <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-[#F5EEE5]">
              <span className="text-[#D6B88C] font-medium truncate">{metaNote}</span>
            </div>
          )}
        </div>

        <div className="px-1.5 sm:px-2 pt-4 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <span className={`h-[1px] w-5 ${s.accentBar}`} />
            <p className={`text-[11px] uppercase tracking-[0.14em] font-medium ${s.eyebrowColor}`}>
              {eyebrow}
            </p>
          </div>
          <h3 className={`font-display text-2xl sm:text-[26px] leading-[1.12] ${s.titleColor}`}>
            {title}
          </h3>
          <p className={`text-sm leading-relaxed ${s.bodyColor}`}>{description}</p>
        </div>
      </div>

      <div className="px-1.5 sm:px-2 pt-5 pb-1">
        <PageTransitionLink
          to={to}
          imageUrl={imageUrl}
          imageAlt={imageAlt}
          className={`w-full min-h-[48px] rounded-[10px] px-4 py-3 text-xs font-medium uppercase tracking-[0.09em] transition-colors flex items-center justify-between gap-2 ${s.ctaClass}`}
        >
          <span>{ctaLabel}</span>
          <ArrowRight className="w-4 h-4 shrink-0" />
        </PageTransitionLink>
      </div>
    </article>
  );
}
