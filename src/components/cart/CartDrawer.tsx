import { Heart, Minus, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  isReducedMotionPreferred,
  lockBodyScroll,
  trapFocusInElement,
} from '../../animations/core/animation-context';
import { ensureGsapRegistered, gsap } from '../../animations/core/gsap-config';
import { MOTION_DURATION, MOTION_EASE } from '../../animations/core/motion-tokens';
import { usePageTransition } from '../../animations/components/PageTransitionProvider';
import { PageTransitionLink } from '../../animations/components/PageTransitionLink';
import { useStore } from '../../context/StoreContext';
import { formatMoney } from '../../lib/commerce';
import { LuxuryImage } from '../ui/LuxuryImage';

export function CartDrawer() {
  const {
    isCartDrawerOpen,
    setCartDrawerOpen,
    setWishlistDrawerOpen,
    wishlistIds,
    cartSummary,
    cartLoading,
    currency,
    settings,
    updateCartQuantity,
    removeFromCart,
  } = useStore();
  const { navigateWithTransition } = usePageTransition();

  const [rendered, setRendered] = useState(false);
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const asideRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const reduced = isReducedMotionPreferred();
    if (isCartDrawerOpen) {
      setRendered(true);
    } else if (rendered) {
      if (reduced || !asideRef.current) {
        setRendered(false);
        return;
      }
      ensureGsapRegistered();
      const tl = gsap.timeline({ onComplete: () => setRendered(false) });
      tl.to(asideRef.current, {
        xPercent: 100,
        duration: MOTION_DURATION.ui,
        ease: MOTION_EASE.exit,
      });
      if (backdropRef.current) {
        tl.to(
          backdropRef.current,
          { opacity: 0, duration: MOTION_DURATION.ui, ease: MOTION_EASE.exit },
          0
        );
      }
      return () => {
        tl.kill();
      };
    }
  }, [isCartDrawerOpen, rendered]);

  useEffect(() => {
    if (!rendered || !isCartDrawerOpen) return;
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
            duration: MOTION_DURATION.standard * 0.72,
            ease: MOTION_EASE.editorial,
            clearProps: 'transform',
          }
        );
      }
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCartDrawerOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      untrap();
      unlock();
    };
  }, [rendered, isCartDrawerOpen, setCartDrawerOpen]);

  if (!rendered) return null;

  const remainingForFree = Math.max(
    0,
    settings.freeShippingThresholdCents - cartSummary.subtotalCents
  );

  return (
    <div
      ref={backdropRef}
      role="dialog"
      aria-modal="true"
      aria-label="Shopping bag"
      className="fixed inset-0 z-50 flex justify-end bg-[#1D0B11]/60 backdrop-blur-[2px]"
    >
      <div
        className="flex-1"
        onClick={() => setCartDrawerOpen(false)}
        aria-hidden="true"
      />
      <aside
        ref={asideRef}
        className="w-full max-w-md bg-[#F5EEE5] text-[#35151F] h-full flex flex-col border-l border-[#35151F]/15 shadow-2xl"
      >
        <div className="px-5 sm:px-6 py-4 border-b border-[#35151F]/12 bg-[#FFFFFF] flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl text-[#35151F]">Shopping Bag</h2>
            <p className="text-xs text-[#6D595E] mt-0.5 tabular-nums">
              {cartSummary.lines.reduce((s, l) => s + l.quantity, 0)} piece(s) selected
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setWishlistDrawerOpen(true)}
              aria-label={`Open saved pieces drawer (${wishlistIds.length})`}
              className="px-3 text-xs text-[#6D595E] hover:text-[#8B2635] inline-flex items-center gap-1.5 min-h-[48px] rounded-[10px]"
            >
              <Heart className="w-4 h-4" />
              <span className="tabular-nums font-medium">{wishlistIds.length}</span>
            </button>
            <button
              type="button"
              onClick={() => setCartDrawerOpen(false)}
              aria-label="Close shopping bag"
              className="text-[#35151F] hover:text-[#8B2635] min-h-[48px] min-w-[48px] rounded-[10px] flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Complimentary shipping threshold progress */}
        {cartSummary.lines.length > 0 && (
          <div className="px-5 sm:px-6 py-3 bg-[#EFE4D6] border-b border-[#35151F]/12 text-xs text-[#6D595E]">
            {remainingForFree === 0 ? (
              <span className="text-[#287A4B] font-medium">
                Complimentary insured standard shipping applies to this bag.
              </span>
            ) : (
              <span>
                Add <strong className="text-[#35151F]">{formatMoney(remainingForFree, currency)}</strong> more for complimentary standard shipping.
              </span>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4">
          {cartSummary.lines.length === 0 ? (
            <div className="py-16 px-4 text-center space-y-4 rounded-[18px] bg-[#FFFFFF] border border-[#35151F]/12">
              <p className="font-display text-2xl text-[#35151F]">Your bag is empty</p>
              <p className="text-sm text-[#6D595E] max-w-xs mx-auto">
                Explore the Autumn Architecture and Noir Capsule silhouettes to begin curating your wardrobe.
              </p>
              <PageTransitionLink
                to="/shop"
                onClick={() => setCartDrawerOpen(false)}
                className="inline-flex items-center justify-center min-h-[48px] bg-[#35151F] text-[#F5EEE5] rounded-[12px] px-7 text-xs font-medium uppercase tracking-[0.1em] hover:bg-[#8B2635] transition-colors"
              >
                Explore Catalog
              </PageTransitionLink>
            </div>
          ) : (
            cartSummary.lines.map((line) => (
              <article
                key={line.sku}
                className="flex gap-3.5 p-3 rounded-[16px] bg-[#FFFFFF] border border-[#35151F]/12 shadow-[var(--card-shadow-subtle)]"
              >
                <PageTransitionLink
                  to={`/products/${line.slug}`}
                  imageUrl={line.imageUrl}
                  imageAlt={line.name}
                  onClick={() => setCartDrawerOpen(false)}
                  className="w-20 aspect-[4/5] rounded-[10px] bg-[#EFE4D6] shrink-0 overflow-hidden border border-[#35151F]/10"
                >
                  <LuxuryImage
                    src={line.imageUrl}
                    alt={line.name}
                    className="w-full h-full object-cover object-top"
                  />
                </PageTransitionLink>
                <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <PageTransitionLink
                        to={`/products/${line.slug}`}
                        imageUrl={line.imageUrl}
                        imageAlt={line.name}
                        onClick={() => setCartDrawerOpen(false)}
                        className="font-display text-lg leading-tight text-[#35151F] hover:text-[#8B2635] transition-colors"
                      >
                        {line.name}
                      </PageTransitionLink>
                      <button
                        type="button"
                        onClick={() => removeFromCart(line.sku)}
                        aria-label={`Remove ${line.name} (${line.size})`}
                        className="min-h-[48px] min-w-[48px] -mt-2 -mr-2 flex items-center justify-center text-[#6D595E] hover:text-[#8B2635] transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-[#6D595E] mt-0.5">
                      {line.colorName} · Size {line.size}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="inline-flex items-center border border-[#35151F]/18 rounded-[10px] bg-[#F5EEE5] overflow-hidden">
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(line.sku, line.quantity - 1)}
                        aria-label={`Decrease quantity for ${line.name}`}
                        className="min-h-[48px] min-w-[44px] flex items-center justify-center text-[#35151F] hover:bg-[#EFE4D6] transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2.5 text-xs tabular-nums font-semibold text-[#35151F]">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(line.sku, line.quantity + 1)}
                        disabled={line.quantity >= line.availableStock}
                        aria-label={`Increase quantity for ${line.name}`}
                        className="min-h-[48px] min-w-[44px] flex items-center justify-center text-[#35151F] hover:bg-[#EFE4D6] transition-colors disabled:opacity-40"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-[#35151F]">
                      {formatMoney(line.lineTotalCents, currency)}
                    </span>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        {cartSummary.lines.length > 0 && (
          <div className="p-5 sm:p-6 border-t border-[#35151F]/12 bg-[#FFFFFF] space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#6D595E]">Subtotal</span>
              <span className="font-semibold tabular-nums text-[#35151F]">
                {cartLoading ? 'Calculating...' : formatMoney(cartSummary.subtotalCents, currency)}
              </span>
            </div>
            <p className="text-xs text-[#6D595E]">
              Shipping and privilege codes verified at checkout.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setCartDrawerOpen(false);
                  void navigateWithTransition('/cart');
                }}
                className="min-h-[48px] border border-[#35151F] rounded-[12px] text-[#35151F] px-4 text-xs font-medium uppercase tracking-[0.08em] hover:bg-[#F5EEE5] transition-colors"
              >
                View Bag
              </button>
              <button
                type="button"
                onClick={() => {
                  setCartDrawerOpen(false);
                  void navigateWithTransition('/checkout');
                }}
                className="min-h-[48px] bg-[#35151F] rounded-[12px] text-[#F5EEE5] px-4 text-xs font-medium uppercase tracking-[0.08em] hover:bg-[#8B2635] transition-colors"
              >
                Checkout
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
