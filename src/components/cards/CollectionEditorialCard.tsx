import { ArrowRight } from 'lucide-react';
import { PageTransitionLink } from '../../animations/components/PageTransitionLink';
import { Collection } from '../../types/ecommerce';
import { LuxuryImage } from '../ui/LuxuryImage';

interface CollectionEditorialCardProps {
  collection: Collection;
  index: number;
  variant?: 'editorial-light' | 'campaign-dark';
  pieceCount?: number;
}

export function CollectionEditorialCard({
  collection,
  index,
  variant = 'editorial-light',
  pieceCount,
}: CollectionEditorialCardProps) {
  const isDark = variant === 'campaign-dark';
  const indexStr = String(index + 1).padStart(2, '0');

  return (
    <PageTransitionLink
      to={`/collections/${collection.slug}`}
      imageUrl={collection.heroImage}
      imageAlt={collection.title}
      transitionStyle="directional"
      data-testid={`collection-card-${collection.slug}`}
      className={`collection-chapter-card group flex flex-col justify-between overflow-hidden p-3 sm:p-3.5 ${
        isDark
          ? 'luxury-card-dark bg-[#2A1018] text-[#F5EEE5]'
          : 'luxury-card-light bg-[#FFFFFF] text-[#35151F]'
      }`}
    >
      {/* Immersive Campaign Photography Frame with Scrim & Title Overlay */}
      <div className="relative aspect-[4/5] rounded-[12px] overflow-hidden bg-[#240D14]">
        <LuxuryImage
          src={collection.heroImage}
          alt={collection.title}
          className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.045]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#1D0A10]/92 via-[#35151F]/10 to-[#1D0A10]/72"
        />

        {/* Top Champagne Index & Season Lead */}
        <div className="absolute top-3.5 inset-x-4 flex items-center justify-between gap-2 text-[11px] uppercase tracking-[0.14em] text-[#F5EEE5]">
          <span className="text-[#D6B88C] font-medium">
            {indexStr}. {collection.season}
          </span>
          {typeof pieceCount === 'number' && (
            <span className="text-[#F5EEE5]/80 tabular-nums">
              {pieceCount} pieces
            </span>
          )}
        </div>

        {/* Bottom Editorial Title Composition */}
        <div className="absolute inset-x-4 bottom-4 space-y-1.5">
          <div className="h-[1px] w-10 bg-[#D6B88C]/80 transition-all duration-500 group-hover:w-16" />
          <h3 className="font-display text-2xl sm:text-3xl leading-[1.08] text-[#FFFFFF]">
            {collection.title}
          </h3>
        </div>
      </div>

      {/* Balanced Lower Editorial Narrative & Explore Action */}
      <div className="px-1.5 sm:px-2 pt-4 pb-1.5 flex-1 flex flex-col justify-between gap-4">
        <p
          className={`text-sm leading-relaxed ${
            isDark ? 'text-[#F5EEE5]/82' : 'text-[#6D595E]'
          }`}
        >
          {collection.subtitle}
        </p>

        <div
          className={`min-h-[48px] flex items-center justify-between pt-2 border-t ${
            isDark ? 'border-[#D6B88C]/20' : 'border-[#35151F]/12'
          }`}
        >
          <span
            className={`text-xs font-medium uppercase tracking-[0.1em] transition-colors ${
              isDark
                ? 'text-[#D6B88C] group-hover:text-[#FFFFFF]'
                : 'text-[#35151F] group-hover:text-[#8B2635]'
            }`}
          >
            Explore Collection
          </span>
          <span
            className={`w-9 h-9 rounded-[8px] flex items-center justify-center transition-transform duration-300 group-hover:translate-x-1 ${
              isDark
                ? 'bg-[#35151F] text-[#D6B88C]'
                : 'bg-[#F5EEE5] text-[#35151F] group-hover:bg-[#35151F] group-hover:text-[#F5EEE5]'
            }`}
          >
            <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </PageTransitionLink>
  );
}
