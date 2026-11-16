import { ArrowRight, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
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
import { LineItemLuxuryCard } from '../cards/LineItemLuxuryCard';

export function WishlistDrawer() {
  const {
    isWishlistDrawerOpen,
    setWishlistDrawerOpen,
    products,
    wishlistIds,
    toggleWishlist,
    addToCart,
    currency,
  } = useStore();

  const asideRef = useRef<HTMLElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isWishlistDrawerOpen) return;
    const unlock = lockBodyScroll();
    const untrap = trapFocusInElement(asideRef.current);

    if (!isReducedMotionPreferred()) {
      ensureGsapRegistered();
      if (backdropRef.current) {
        gsap.fromTo(
          backdropRef.current,
          { opacity: 0 },
          { opacity: 1, duration: MOTION_DURATION.ui, ease: MOTION_EASE.hover }
        );
      }
      if (asideRef.current) {
        gsap.fromTo(
          asideRef.current,
          { xPercent: 100 },
          {
            xPercent: 0,
            duration: MOTION_DURATION.standard * 0.75,
            ease: MOTION_EASE.editorial,
            clearProps: 'transform',
          }
        );
      }
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setWishlistDrawerOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      untrap();
      unlock();
    };
  }, [isWishlistDrawerOpen, setWishlistDrawerOpen]);

  if (!isWishlistDrawerOpen) return null;

  const savedProducts = products.filter((p) => wishlistIds.includes(p.id));

  return (
    <div
      ref={backdropRef}
      role="dialog"
      aria-modal="true"
      aria-label="Saved pieces"
      className="fixed inset-0 z-50 flex justify-end bg-[#1D0B11]/60 backdrop-blur-[2px]"
    >
      <div
        className="flex-1"
        onClick={() => setWishlistDrawerOpen(false)}
        aria-hidden="true"
      />
      <aside
        ref={asideRef}
        className="w-full max-w-md bg-[#F5EEE5] text-[#35151F] h-full flex flex-col border-l border-[#35151F]/15 shadow-2xl"
      >
        <div className="px-5 sm:px-6 py-4 border-b border-[#35151F]/12 bg-[#FFFFFF] flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl text-[#35151F]">Saved Pieces</h2>
            <p className="text-xs text-[#6D595E] mt-0.5 tabular-nums">
              {savedProducts.length} silhouette(s) saved
            </p>
          </div>
          <button
            type="button"
            onClick={() => setWishlistDrawerOpen(false)}
            aria-label="Close saved pieces drawer"
            className="text-[#35151F] hover:text-[#8B2635] min-h-[48px] min-w-[48px] rounded-[10px] flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4">
          {savedProducts.length === 0 ? (
            <div className="py-16 px-4 text-center space-y-4 rounded-[18px] bg-[#FFFFFF] border border-[#35151F]/12">
              <p className="font-display text-2xl text-[#35151F]">No saved silhouettes yet</p>
              <p className="text-sm text-[#6D595E] max-w-xs mx-auto">
                Save outerwear, tailoring, or silk pieces while browsing to curate your private shortlist.
              </p>
              <PageTransitionLink
                to="/shop"
                onClick={() => setWishlistDrawerOpen(false)}
                className="inline-flex items-center justify-center min-h-[48px] bg-[#35151F] text-[#F5EEE5] rounded-[12px] px-7 text-xs font-medium uppercase tracking-[0.1em] hover:bg-[#8B2635] transition-colors"
              >
                Explore Catalog
              </PageTransitionLink>
            </div>
          ) : (
            savedProducts.map((product) => {
              const firstAvail = product.variants.find((v) => v.stock - v.reserved > 0);
              const state = deriveProductCardState(product);
              return (
                <LineItemLuxuryCard
                  key={product.id}
                  to={`/products/${product.slug}`}
                  title={product.name}
                  subtitle={product.editionLabel ? `${product.category} · ${product.editionLabel}` : product.category}
                  priceText={formatMoney(product.priceCents, currency)}
                  compareAtText={
                    state.hasDiscount && product.compareAtPriceCents
                      ? formatMoney(product.compareAtPriceCents, currency)
                      : null
                  }
                  imageUrl={product.images[0]?.url ?? ''}
                  imageAlt={product.name}
                  onNavigate={() => setWishlistDrawerOpen(false)}
                  onRemove={() => toggleWishlist(product.id)}
                  removeLabel={`Remove ${product.name} from saved`}
                  actionLabel={firstAvail ? `Move to Bag (${firstAvail.size})` : undefined}
                  onAction={firstAvail ? () => addToCart(product.id, firstAvail.sku, 1) : undefined}
                />
              );
            })
          )}
        </div>

        <div className="p-5 sm:p-6 border-t border-[#35151F]/12 bg-[#FFFFFF]">
          <PageTransitionLink
            to="/wishlist"
            onClick={() => setWishlistDrawerOpen(false)}
            className="w-full min-h-[48px] border border-[#35151F] rounded-[12px] text-[#35151F] px-4 text-xs font-medium uppercase tracking-[0.08em] hover:bg-[#35151F] hover:text-[#F5EEE5] transition-colors flex items-center justify-center gap-2"
          >
            Open Full Wishlist Page <ArrowRight className="w-3.5 h-3.5" />
          </PageTransitionLink>
        </div>
      </aside>
    </div>
  );
}
