import { ArrowRight, Check, Heart, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  isReducedMotionPreferred,
  lockBodyScroll,
  trapFocusInElement,
} from '../../animations/core/animation-context';
import { ensureGsapRegistered, gsap } from '../../animations/core/gsap-config';
import { MOTION_DURATION, MOTION_EASE } from '../../animations/core/motion-tokens';
import { PageTransitionLink } from '../../animations/components/PageTransitionLink';
import { useStore } from '../../context/StoreContext';
import { deriveProductCardState } from '../../lib/cardTokens';
import { formatMoney } from '../../lib/commerce';
import { LuxuryImage } from '../ui/LuxuryImage';

export function QuickViewModal() {
  const {
    quickViewProduct,
    closeQuickView,
    currency,
    addToCart,
    toggleWishlist,
    isWishlisted,
  } = useStore();

  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSku, setSelectedSku] = useState('');
  const panelRef = useRef<HTMLDivElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!quickViewProduct) return;
    const firstAvail =
      quickViewProduct.variants.find((v) => v.stock - v.reserved > 0) ??
      quickViewProduct.variants[0];
    if (firstAvail) {
      setSelectedColor(firstAvail.colorName);
      setSelectedSku(firstAvail.sku);
    }
  }, [quickViewProduct]);

  useEffect(() => {
    if (!quickViewProduct) return;
    const unlock = lockBodyScroll();
    const untrap = trapFocusInElement(panelRef.current);

    if (!isReducedMotionPreferred()) {
      ensureGsapRegistered();
      if (backdropRef.current) {
        gsap.fromTo(
          backdropRef.current,
          { opacity: 0 },
          { opacity: 1, duration: MOTION_DURATION.ui, ease: MOTION_EASE.hover }
        );
      }
      if (panelRef.current) {
        gsap.fromTo(
          panelRef.current,
          { opacity: 0, y: 18, scale: 0.985 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: MOTION_DURATION.standard * 0.72,
            ease: MOTION_EASE.editorial,
            clearProps: 'transform,opacity',
          }
        );
      }
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeQuickView();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      untrap();
      unlock();
    };
  }, [quickViewProduct, closeQuickView]);

  const colors = useMemo(() => {
    if (!quickViewProduct) return [];
    return Array.from(
      new Map(quickViewProduct.variants.map((v) => [v.colorName, v.colorHex])).entries()
    );
  }, [quickViewProduct]);

  const variantsForColor = useMemo(() => {
    if (!quickViewProduct) return [];
    return quickViewProduct.variants.filter((v) => v.colorName === selectedColor);
  }, [quickViewProduct, selectedColor]);

  const activeVariant = useMemo(() => {
    if (!quickViewProduct) return undefined;
    return (
      quickViewProduct.variants.find((v) => v.sku === selectedSku) ?? variantsForColor[0]
    );
  }, [quickViewProduct, selectedSku, variantsForColor]);

  if (!quickViewProduct) return null;

  const state = deriveProductCardState(quickViewProduct);
  const available = activeVariant
    ? Math.max(0, activeVariant.stock - activeVariant.reserved)
    : 0;
  const wishlisted = isWishlisted(quickViewProduct.id);

  return (
    <div
      ref={backdropRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Quick view ${quickViewProduct.name}`}
      data-testid="quick-view-modal"
      className="fixed inset-0 z-50 bg-[#1D0B11]/70 backdrop-blur-[3px] flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={(e) => {
        if (e.target === backdropRef.current) closeQuickView();
      }}
    >
      <div
        ref={panelRef}
        className="bg-[#FFFFFF] text-[#35151F] border border-[#35151F]/16 rounded-[22px] max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 overflow-hidden shadow-2xl my-auto"
      >
        <div className="md:col-span-6 p-3 pb-0 md:p-4 bg-[#F5EEE5]">
          <div className="relative aspect-[4/5] h-full rounded-[14px] bg-[#EFE4D6] overflow-hidden border border-[#35151F]/10">
            <LuxuryImage
              src={quickViewProduct.images[0]?.url ?? ''}
              alt={quickViewProduct.name}
              loading="eager"
              className="w-full h-full object-cover object-top"
            />
            {state.primaryStatusLabel && (
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-[6px] bg-[#35151F]/92 text-[#F5EEE5] border border-[#D6B88C]/30 text-[10px] uppercase tracking-[0.14em] font-medium">
                {state.primaryStatusLabel}
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-6 p-5 sm:p-8 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#8B2635]">
                  {quickViewProduct.category} · {quickViewProduct.gender}
                </p>
                <h2 className="font-display text-2xl sm:text-3xl text-[#35151F] mt-1">
                  {quickViewProduct.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeQuickView}
                aria-label="Close quick view"
                className="text-[#35151F] hover:text-[#8B2635] min-h-[48px] min-w-[48px] -mt-1 -mr-1 rounded-[12px] border border-[#35151F]/12 flex items-center justify-center shrink-0 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-baseline gap-2.5 tabular-nums">
              <span className="text-xl font-semibold text-[#35151F]">
                {formatMoney(quickViewProduct.priceCents, currency)}
              </span>
              {state.hasDiscount && quickViewProduct.compareAtPriceCents && (
                <>
                  <span className="text-sm line-through text-[#6D595E]">
                    {formatMoney(quickViewProduct.compareAtPriceCents, currency)}
                  </span>
                  <span className="text-xs font-medium text-[#8B2635] uppercase tracking-[0.08em]">
                    Save {state.discountPercent}%
                  </span>
                </>
              )}
            </div>

            <p className="text-xs sm:text-sm text-[#6D595E] leading-relaxed">
              {quickViewProduct.description}
            </p>

            {/* Color Selection */}
            <div className="space-y-2 pt-1">
              <p className="text-xs text-[#6D595E]">
                Color: <span className="text-[#35151F] font-medium">{selectedColor}</span>
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {colors.map(([name, hex]) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      setSelectedColor(name);
                      const match = quickViewProduct.variants.find(
                        (v) => v.colorName === name && v.stock - v.reserved > 0
                      );
                      if (match) setSelectedSku(match.sku);
                    }}
                    aria-label={`Select color ${name}`}
                    className={`min-h-[48px] min-w-[48px] rounded-[12px] border flex items-center justify-center transition-colors ${
                      selectedColor === name
                        ? 'border-[#35151F] bg-[#F5EEE5]'
                        : 'border-[#35151F]/15 bg-[#FFFFFF]'
                    }`}
                  >
                    <span
                      className="w-6 h-6 rounded-full border border-[#35151F]/25 flex items-center justify-center"
                      style={{ backgroundColor: hex }}
                    >
                      {selectedColor === name && (
                        <Check className="w-3 h-3 text-[#FFFFFF] mix-blend-difference" />
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Size Selection */}
            <div className="space-y-2">
              <p className="text-xs text-[#6D595E]">Size</p>
              <div className="grid grid-cols-4 gap-2">
                {variantsForColor.map((variant) => {
                  const stock = variant.stock - variant.reserved;
                  const active = selectedSku === variant.sku;
                  return (
                    <button
                      key={variant.sku}
                      type="button"
                      disabled={stock <= 0}
                      onClick={() => setSelectedSku(variant.sku)}
                      className={`min-h-[48px] rounded-[10px] text-xs font-medium border transition-colors ${
                        stock <= 0
                          ? 'border-[#35151F]/15 text-[#6D595E]/60 line-through bg-[#F5EEE5] cursor-not-allowed'
                          : active
                          ? 'bg-[#35151F] text-[#F5EEE5] border-[#35151F]'
                          : 'bg-[#FFFFFF] text-[#35151F] border-[#35151F]/20 hover:border-[#8B2635]'
                      }`}
                    >
                      {variant.size}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-[#35151F]/12">
            <div className="flex gap-2.5">
              <button
                type="button"
                disabled={!activeVariant || available <= 0}
                onClick={() => {
                  if (!activeVariant) return;
                  addToCart(quickViewProduct.id, activeVariant.sku, 1);
                }}
                className="flex-1 min-h-[48px] bg-[#35151F] text-[#F5EEE5] rounded-[12px] px-5 text-xs font-medium uppercase tracking-[0.1em] hover:bg-[#8B2635] transition-colors disabled:opacity-40"
              >
                {available > 0 ? 'Add to Bag' : 'Out of Stock'}
              </button>
              <button
                type="button"
                onClick={() => toggleWishlist(quickViewProduct.id)}
                aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                className={`min-h-[48px] min-w-[48px] border rounded-[12px] flex items-center justify-center transition-colors ${
                  wishlisted
                    ? 'bg-[#35151F] text-[#D6B88C] border-[#35151F]'
                    : 'bg-[#FFFFFF] text-[#35151F] border-[#35151F]/20 hover:border-[#8B2635]'
                }`}
              >
                <Heart
                  className="w-4 h-4"
                  fill={wishlisted ? 'currentColor' : 'none'}
                />
              </button>
            </div>

            <PageTransitionLink
              to={`/products/${quickViewProduct.slug}`}
              onClick={closeQuickView}
              className="min-h-[48px] inline-flex items-center gap-2 text-xs font-medium text-[#35151F] underline underline-offset-4 hover:text-[#8B2635] transition-colors"
            >
              View Full Garment Details <ArrowRight className="w-3.5 h-3.5" />
            </PageTransitionLink>
          </div>
        </div>
      </div>
    </div>
  );
}
