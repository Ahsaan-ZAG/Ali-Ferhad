import { ArrowRight, Check, Eye, Heart, Plus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  animateCardTapFeedback,
  animateQuickAddDrawer,
  animateQuickAddSuccess,
  animateWishlistPulse,
} from '../../animations/interactions/product-hover';
import { PageTransitionLink } from '../../animations/components/PageTransitionLink';
import { useStore } from '../../context/StoreContext';
import { CardVariant, deriveProductCardState } from '../../lib/cardTokens';
import { formatMoney } from '../../lib/commerce';
import { Product } from '../../types/ecommerce';
import { LuxuryImage } from '../ui/LuxuryImage';

export interface ProductLuxuryCardProps {
  product: Product;
  darkSurface?: boolean;
  variant?: CardVariant;
  featuredLabel?: string;
}

export function ProductCardSkeleton({ darkSurface = false }: { darkSurface?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-[18px] border p-2.5 sm:p-3.5 animate-pulse ${
        darkSurface
          ? 'bg-[#2A1018] border-[#D6B88C]/20'
          : 'bg-[#FFFFFF] border-[#35151F]/10'
      }`}
    >
      <div
        className={`aspect-[4/5] rounded-[12px] ${
          darkSurface ? 'bg-[#3D1B25]' : 'bg-[#EAE0D2]'
        }`}
      />
      <div className="pt-3.5 space-y-2.5">
        <div
          className={`h-3 w-1/2 rounded ${
            darkSurface ? 'bg-[#3D1B25]' : 'bg-[#EAE0D2]'
          }`}
        />
        <div
          className={`h-5 w-4/5 rounded ${
            darkSurface ? 'bg-[#3D1B25]' : 'bg-[#EAE0D2]'
          }`}
        />
        <div
          className={`h-4 w-1/3 rounded ${
            darkSurface ? 'bg-[#3D1B25]' : 'bg-[#EAE0D2]'
          }`}
        />
        <div
          className={`h-12 w-full rounded-[10px] ${
            darkSurface ? 'bg-[#3D1B25]' : 'bg-[#EAE0D2]'
          }`}
        />
      </div>
    </div>
  );
}

export function ProductLuxuryCard({
  product,
  darkSurface = false,
  variant = 'editorial',
  featuredLabel,
}: ProductLuxuryCardProps) {
  const { currency, addToCart, toggleWishlist, isWishlisted, openQuickView } = useStore();
  const [hovered, setHovered] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [addedSize, setAddedSize] = useState<string | null>(null);
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  const cardRef = useRef<HTMLElement | null>(null);
  const quickDrawerRef = useRef<HTMLDivElement | null>(null);
  const successRef = useRef<HTMLDivElement | null>(null);
  const wishlistBtnRef = useRef<HTMLButtonElement | null>(null);
  const resetTimerRef = useRef<number | null>(null);

  const wishlisted = isWishlisted(product.id);
  const derived = deriveProductCardState(product);

  const primaryImg = product.images[activeImgIndex] ?? product.images[0];
  const secondaryImg = product.images.length > 1 ? product.images[1] : undefined;

  const statusTag = featuredLabel ?? derived.primaryStatusLabel;

  useEffect(() => {
    if (quickAddOpen) {
      return animateQuickAddDrawer(quickDrawerRef.current);
    }
  }, [quickAddOpen]);

  useEffect(() => {
    if (addedSize) {
      return animateQuickAddSuccess(successRef.current);
    }
  }, [addedSize]);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
    };
  }, []);

  const handleWishlist = () => {
    animateWishlistPulse(wishlistBtnRef.current);
    toggleWishlist(product.id);
  };

  const handleSelectSize = (sku: string, size: string) => {
    addToCart(product.id, sku, 1);
    setQuickAddOpen(false);
    setAddedSize(size);
    if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
    resetTimerRef.current = window.setTimeout(() => {
      setAddedSize(null);
    }, 1800);
  };

  const isFeatured = variant === 'featured';

  const cardSurfaceClass = darkSurface
    ? 'luxury-card-dark bg-[#2A1018] text-[#F5EEE5]'
    : isFeatured
    ? 'luxury-card-light bg-[#FAF6F0] text-[#35151F] border-[#8B2635]/28'
    : 'luxury-card-light bg-[#FFFFFF] text-[#35151F]';

  const selectedStateClass = quickAddOpen
    ? darkSurface
      ? 'ring-1 ring-[#D6B88C]/70 border-[#D6B88C]/70'
      : 'ring-1 ring-[#8B2635]/45 border-[#8B2635]/60'
    : '';

  return (
    <article
      ref={cardRef}
      data-testid={`product-card-${product.slug}`}
      data-state={derived.isOutOfStock ? 'out-of-stock' : quickAddOpen ? 'selecting-size' : addedSize ? 'added' : 'default'}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onPointerDown={() => animateCardTapFeedback(cardRef.current)}
      className={`product-card-reveal group flex flex-col justify-between p-2.5 sm:p-3.5 ${cardSurfaceClass} ${selectedStateClass}`}
    >
      <div>
        {/* 4:5 Portrait Image Stage */}
        <div
          className={`relative aspect-[4/5] rounded-[12px] overflow-hidden border transition-colors ${
            darkSurface
              ? 'bg-[#210B12] border-[#D6B88C]/20'
              : 'bg-[#F5EEE5] border-[#35151F]/10'
          }`}
          data-cursor="view"
          data-cursor-label="View"
        >
          <PageTransitionLink
            to={`/products/${product.slug}`}
            imageUrl={primaryImg?.url}
            imageAlt={primaryImg?.alt ?? product.name}
            onFocus={() => secondaryImg && setHovered(true)}
            onBlur={() => setHovered(false)}
            className="block w-full h-full relative focus-visible:outline-none"
          >
            <LuxuryImage
              src={primaryImg?.url ?? ''}
              alt={primaryImg?.alt ?? product.name}
              className={`w-full h-full object-cover object-top transition-all duration-700 ease-out ${
                derived.isOutOfStock
                  ? 'opacity-65 grayscale-[20%]'
                  : hovered && secondaryImg && activeImgIndex === 0
                  ? 'opacity-0 scale-[1.03]'
                  : 'opacity-100 group-hover:scale-[1.035]'
              }`}
            />
            {secondaryImg && activeImgIndex === 0 && !derived.isOutOfStock && (
              <LuxuryImage
                src={secondaryImg.url}
                alt={secondaryImg.alt ?? product.name}
                className={`absolute inset-0 w-full h-full object-cover object-top transition-all duration-700 ease-out ${
                  hovered ? 'opacity-100 scale-[1.035]' : 'opacity-0 scale-100'
                }`}
              />
            )}
          </PageTransitionLink>

          {/* Subtle Editorial Status Label (Non-Pill, Bottom-Left Clear of Faces & Wishlist) */}
          {statusTag && (
            <div className="absolute bottom-3.5 left-2.5 right-2.5 pointer-events-none">
              <span
                data-testid={`card-status-${product.slug}`}
                className={`inline-block max-w-full truncate rounded-[6px] px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[8.5px] sm:text-[10px] font-medium uppercase tracking-[0.03em] sm:tracking-[0.11em] border shadow-sm ${
                  derived.isOutOfStock
                    ? 'bg-[#F5EEE5]/95 text-[#35151F] border-[#35151F]/25'
                    : derived.hasDiscount
                    ? 'bg-[#8B2635] text-[#FFFFFF] border-[#8B2635]'
                    : darkSurface
                    ? 'bg-[#35151F]/92 text-[#D6B88C] border-[#D6B88C]/40'
                    : 'bg-[#35151F]/92 text-[#F5EEE5] border-[#35151F]'
                }`}
              >
                {statusTag}
              </span>
            </div>
          )}

          {/* Top-Right Wishlist Button (48x48px Minimum Accessible Touch Target) */}
          <button
            ref={wishlistBtnRef}
            type="button"
            onClick={handleWishlist}
            aria-pressed={wishlisted}
            aria-label={
              wishlisted
                ? `Remove ${product.name} from wishlist`
                : `Save ${product.name} to wishlist`
            }
            data-testid={`wishlist-btn-${product.slug}`}
            className={`absolute top-2 right-2 w-12 h-12 rounded-[10px] flex items-center justify-center border transition-colors ${
              wishlisted
                ? 'bg-[#8B2635] text-[#FFFFFF] border-[#8B2635]'
                : darkSurface
                ? 'bg-[#35151F]/92 text-[#F5EEE5] border-[#D6B88C]/35 hover:border-[#D6B88C] hover:bg-[#35151F]'
                : 'bg-[#FFFFFF]/94 text-[#35151F] border-[#35151F]/15 hover:border-[#8B2635] hover:text-[#8B2635]'
            }`}
          >
            <Heart
              className="w-[18px] h-[18px]"
              fill={wishlisted ? 'currentColor' : 'none'}
              strokeWidth={1.7}
            />
          </button>

          {/* Subtle Gallery Indicator Strip when secondary photography exists */}
          {product.images.length > 1 && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-2.5 bottom-1.5 flex items-center gap-1"
            >
              {product.images.slice(0, 3).map((_, idx) => {
                const isActive =
                  (hovered && activeImgIndex === 0 && idx === 1) ||
                  (!hovered && idx === activeImgIndex);
                return (
                  <span
                    key={idx}
                    className={`h-[2px] flex-1 rounded-full transition-colors duration-300 ${
                      isActive ? 'bg-[#D6B88C]' : 'bg-[#FFFFFF]/45'
                    }`}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Structured Product Typography & Hierarchy */}
        <div className="pt-3.5 px-0.5 space-y-2">
          {/* Category + Swatches Row */}
          <div className="flex items-center justify-between gap-2">
            <p
              className={`text-[11px] uppercase tracking-[0.11em] truncate ${
                darkSurface ? 'text-[#D6B88C]' : 'text-[#6D595E]'
              }`}
            >
              {product.category}
            </p>
            <div
              className="flex items-center gap-1.5 shrink-0"
              role="img"
              aria-label={`Available colors: ${derived.uniqueColors.map(([c]) => c).join(', ')}`}
            >
              {derived.uniqueColors.map(([name, hex], i) => (
                <span
                  key={name}
                  title={name}
                  onMouseEnter={() => {
                    const matchIdx = product.images.findIndex((img) => img.colorName === name);
                    if (matchIdx >= 0) setActiveImgIndex(matchIdx);
                  }}
                  onMouseLeave={() => setActiveImgIndex(0)}
                  className={`w-3 h-3 rounded-full border inline-block transition-transform ${
                    i === 0 ? 'ring-1 ring-offset-1 ring-[#D6B88C]/70' : ''
                  } ${darkSurface ? 'border-[#D6B88C]/50' : 'border-[#35151F]/35'}`}
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </div>

          {/* Product Name */}
          <h3 className="min-h-[2.75rem]">
            <PageTransitionLink
              to={`/products/${product.slug}`}
              imageUrl={primaryImg?.url}
              imageAlt={primaryImg?.alt ?? product.name}
              className={`group/title inline-flex items-start gap-1.5 font-display text-[clamp(1.0625rem,1.4vw,1.3125rem)] leading-[1.2] hover:underline underline-offset-4 ${
                darkSurface ? 'text-[#F5EEE5]' : 'text-[#35151F]'
              }`}
            >
              <span>{product.name}</span>
              <ArrowRight className="w-3.5 h-3.5 mt-1 opacity-0 -translate-x-1 group-hover/title:opacity-75 group-hover/title:translate-x-0 transition-all duration-200 shrink-0 hidden sm:inline-block" />
            </PageTransitionLink>
          </h3>

          {/* Pricing + Availability Row */}
          <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
            <div className="flex items-baseline gap-2 tabular-nums">
              <span
                className={`text-sm sm:text-[15px] font-semibold ${
                  derived.hasDiscount
                    ? darkSurface
                      ? 'text-[#D6B88C]'
                      : 'text-[#8B2635]'
                    : darkSurface
                    ? 'text-[#F5EEE5]'
                    : 'text-[#35151F]'
                }`}
              >
                {formatMoney(product.priceCents, currency)}
              </span>
              {derived.hasDiscount && product.compareAtPriceCents && (
                <span
                  className={`text-xs line-through ${
                    darkSurface ? 'text-[#D6B88C]/60' : 'text-[#6D595E]'
                  }`}
                >
                  {formatMoney(product.compareAtPriceCents, currency)}
                </span>
              )}
            </div>

            <span
              className={`text-[11px] truncate ${
                derived.isOutOfStock
                  ? darkSurface
                    ? 'text-[#D6B88C]/75'
                    : 'text-[#8B2635]'
                  : derived.isLowStock
                  ? darkSurface
                    ? 'text-[#D6B88C]'
                    : 'text-[#8B2635]'
                  : darkSurface
                  ? 'text-[#F5EEE5]/70'
                  : 'text-[#6D595E]'
              }`}
            >
              {derived.availabilityText}
            </span>
          </div>
        </div>
      </div>

      {/* Dedicated Non-Hover Card Action Bar (Always Accessible & >=48px Touch Targets) */}
      <div className="pt-3.5 px-0.5">
        {quickAddOpen ? (
          <div
            ref={quickDrawerRef}
            data-testid={`quick-add-drawer-${product.slug}`}
            className={`rounded-[12px] border p-2.5 space-y-2 ${
              darkSurface
                ? 'bg-[#240D14] border-[#D6B88C]/40'
                : 'bg-[#FAF6F0] border-[#35151F]/20'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={`text-[11px] uppercase tracking-[0.1em] font-medium ${
                  darkSurface ? 'text-[#D6B88C]' : 'text-[#35151F]'
                }`}
              >
                Select Size
              </span>
              <button
                type="button"
                onClick={() => setQuickAddOpen(false)}
                aria-label={`Close size selector for ${product.name}`}
                className={`min-h-[48px] min-w-[48px] -my-2 -mr-1 rounded-[10px] flex items-center justify-center transition-colors ${
                  darkSurface
                    ? 'text-[#F5EEE5]/80 hover:text-[#D6B88C]'
                    : 'text-[#6D595E] hover:text-[#35151F]'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {product.variants.slice(0, 4).map((v) => {
                const avail = v.stock - v.reserved;
                return (
                  <button
                    key={v.sku}
                    type="button"
                    disabled={avail <= 0}
                    onClick={() => handleSelectSize(v.sku, v.size)}
                    data-testid={`quick-add-size-${product.slug}-${v.size}`}
                    aria-label={
                      avail > 0
                        ? `Add ${product.name} size ${v.size} to bag`
                        : `${product.name} size ${v.size} out of stock`
                    }
                    className={`min-h-[48px] px-2 rounded-[10px] text-xs font-medium border transition-colors ${
                      avail <= 0
                        ? darkSurface
                          ? 'border-[#D6B88C]/15 text-[#F5EEE5]/35 line-through cursor-not-allowed'
                          : 'border-[#35151F]/10 text-[#6D595E]/55 bg-[#F5EEE5]/70 line-through cursor-not-allowed'
                        : darkSurface
                        ? 'border-[#D6B88C]/35 bg-[#35151F] text-[#F5EEE5] hover:bg-[#D6B88C] hover:text-[#35151F]'
                        : 'border-[#35151F]/20 bg-[#FFFFFF] text-[#35151F] hover:bg-[#35151F] hover:text-[#F5EEE5] hover:border-[#35151F]'
                    }`}
                  >
                    {v.size}
                  </button>
                );
              })}
            </div>
          </div>
        ) : addedSize ? (
          <div
            ref={successRef}
            role="status"
            data-testid={`quick-add-success-${product.slug}`}
            className="min-h-[48px] rounded-[10px] bg-[#35151F] text-[#F5EEE5] border border-[#D6B88C]/40 px-3 flex items-center justify-center gap-2 text-xs font-medium tracking-wide"
          >
            <Check className="w-4 h-4 text-[#D6B88C] shrink-0" />
            <span className="truncate">Added ({addedSize})</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={derived.isOutOfStock}
              onClick={() => setQuickAddOpen(true)}
              data-testid={`quick-add-btn-${product.slug}`}
              className={`flex-1 min-h-[48px] px-2.5 rounded-[10px] text-[11px] sm:text-xs font-medium uppercase tracking-[0.07em] border transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
                derived.isOutOfStock
                  ? darkSurface
                    ? 'border-[#D6B88C]/15 text-[#F5EEE5]/40 cursor-not-allowed'
                    : 'border-[#35151F]/12 bg-[#F5EEE5] text-[#6D595E] cursor-not-allowed'
                  : darkSurface
                  ? 'border-[#D6B88C]/40 bg-[#35151F] text-[#F5EEE5] hover:bg-[#D6B88C] hover:text-[#35151F]'
                  : 'border-[#35151F]/20 bg-[#FAF6F0] text-[#35151F] hover:bg-[#35151F] hover:text-[#F5EEE5] hover:border-[#35151F]'
              }`}
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span>{derived.isOutOfStock ? 'Unavailable' : 'Quick Add'}</span>
            </button>

            <button
              type="button"
              onClick={() => openQuickView(product)}
              aria-label={`Quick view ${product.name}`}
              data-testid={`quick-view-btn-${product.slug}`}
              className={`min-h-[48px] min-w-[48px] rounded-[10px] border flex items-center justify-center transition-colors shrink-0 ${
                darkSurface
                  ? 'border-[#D6B88C]/35 bg-[#240D14] text-[#D6B88C] hover:bg-[#D6B88C] hover:text-[#35151F]'
                  : 'border-[#35151F]/20 bg-[#FFFFFF] text-[#35151F] hover:border-[#8B2635] hover:text-[#8B2635]'
              }`}
            >
              <Eye className="w-4 h-4" strokeWidth={1.65} />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
