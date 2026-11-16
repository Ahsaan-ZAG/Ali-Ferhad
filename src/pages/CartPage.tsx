import { Minus, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { PageTransitionLink } from '../animations/components/PageTransitionLink';
import { LuxuryImage } from '../components/ui/LuxuryImage';
import { useStore } from '../context/StoreContext';
import { formatMoney } from '../lib/commerce';
import { DeliveryMethod } from '../types/ecommerce';

export function CartPage() {
  const {
    cartSummary,
    cartLoading,
    currency,
    couponCode,
    setCouponCode,
    deliveryMethod,
    setDeliveryMethod,
    updateCartQuantity,
    removeFromCart,
  } = useStore();
  const [couponInput, setCouponInput] = useState(couponCode);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponCode(couponInput.trim().toUpperCase());
  };

  return (
    <div className="bg-[#F5EEE5] min-h-screen py-12 md:py-20 text-[#35151F]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
        <div className="pb-8 border-b border-[#35151F]/14 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[#8B2635]">
              Order Summary
            </p>
            <h1 className="editorial-section-title text-[#35151F] mt-2">Shopping Bag</h1>
          </div>
          <PageTransitionLink
            to="/shop"
            className="min-h-[48px] inline-flex items-center text-xs underline underline-offset-4 text-[#35151F] hover:text-[#8B2635]"
          >
            Continue Shopping
          </PageTransitionLink>
        </div>

        {cartSummary.lines.length === 0 ? (
          <div className="py-20 px-6 mt-10 text-center space-y-4 rounded-[20px] bg-[#FFFFFF] border border-[#35151F]/14 shadow-[var(--card-shadow-subtle)]">
            <h2 className="font-display text-3xl text-[#35151F]">Your shopping bag is empty</h2>
            <p className="text-sm text-[#6D595E]">
              Select garments from our catalog to calculate shipping and privilege eligibility.
            </p>
            <PageTransitionLink
              to="/shop"
              className="inline-flex items-center justify-center min-h-[48px] bg-[#35151F] text-[#F5EEE5] rounded-[12px] px-7 text-xs uppercase tracking-[0.1em] hover:bg-[#8B2635] transition-colors"
            >
              Explore Catalog
            </PageTransitionLink>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pt-10">
            {/* Items */}
            <div className="lg:col-span-8 space-y-4">
              {cartSummary.lines.map((line) => (
                <article
                  key={line.sku}
                  className="p-4 sm:p-5 rounded-[18px] bg-[#FFFFFF] border border-[#35151F]/14 shadow-[var(--card-shadow-subtle)] flex gap-4 sm:gap-5"
                >
                  <PageTransitionLink
                    to={`/products/${line.slug}`}
                    imageUrl={line.imageUrl}
                    imageAlt={line.name}
                    className="w-24 sm:w-28 aspect-[4/5] rounded-[12px] bg-[#EFE4D6] shrink-0 overflow-hidden border border-[#35151F]/10"
                  >
                    <LuxuryImage src={line.imageUrl} alt={line.name} className="w-full h-full object-cover object-top" />
                  </PageTransitionLink>
                  <div className="flex-1 min-w-0 flex flex-col justify-between gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <PageTransitionLink
                          to={`/products/${line.slug}`}
                          imageUrl={line.imageUrl}
                          imageAlt={line.name}
                          className="font-display text-xl sm:text-2xl text-[#35151F] hover:text-[#8B2635] transition-colors block"
                        >
                          {line.name}
                        </PageTransitionLink>
                        <p className="text-xs text-[#6D595E] mt-1">
                          {line.colorName} · Size {line.size} · Unit {formatMoney(line.unitPriceCents, currency)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(line.sku)}
                        aria-label={`Remove ${line.name}`}
                        className="min-h-[48px] min-w-[48px] -mt-2 -mr-2 flex items-center justify-center text-[#6D595E] hover:text-[#8B2635] transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="inline-flex items-center border border-[#35151F]/18 rounded-[10px] bg-[#F5EEE5] overflow-hidden">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(line.sku, line.quantity - 1)}
                          aria-label={`Decrease quantity of ${line.name}`}
                          className="min-h-[48px] min-w-[48px] flex items-center justify-center hover:bg-[#EFE4D6]"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-4 text-xs tabular-nums font-semibold">{line.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(line.sku, line.quantity + 1)}
                          disabled={line.quantity >= line.availableStock}
                          aria-label={`Increase quantity of ${line.name}`}
                          className="min-h-[48px] min-w-[48px] flex items-center justify-center hover:bg-[#EFE4D6] disabled:opacity-40"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-base font-semibold tabular-nums text-[#35151F]">
                        {formatMoney(line.lineTotalCents, currency)}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Summary Sidebar */}
            <aside className="lg:col-span-4 bg-[#FFFFFF] border border-[#35151F]/14 rounded-[20px] p-6 sm:p-8 space-y-6 h-fit shadow-[var(--card-shadow-subtle)]">
              <h2 className="font-display text-2xl text-[#35151F]">Bag Summary</h2>

              <form onSubmit={handleApplyCoupon} className="space-y-2">
                <label htmlFor="cart-coupon" className="block text-xs text-[#6D595E]">
                  Privilege Code (e.g., ATELIER10)
                </label>
                <div className="flex gap-2">
                  <input
                    id="cart-coupon"
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Enter code"
                    className="flex-1 min-h-[48px] bg-[#F5EEE5]/60 border border-[#35151F]/20 rounded-[12px] px-3.5 text-xs uppercase text-[#35151F]"
                  />
                  <button
                    type="submit"
                    className="min-h-[48px] bg-[#35151F] text-[#F5EEE5] rounded-[12px] px-5 text-xs font-medium hover:bg-[#8B2635] transition-colors"
                  >
                    Apply
                  </button>
                </div>
                {cartSummary.couponMessage && (
                  <p className={`text-xs ${cartSummary.appliedCouponCode ? 'text-[#287A4B]' : 'text-[#8B2635]'}`}>
                    {cartSummary.couponMessage}
                  </p>
                )}
              </form>

              <div className="space-y-2">
                <label htmlFor="cart-delivery" className="block text-xs text-[#6D595E]">
                  Shipping Estimate
                </label>
                <select
                  id="cart-delivery"
                  value={deliveryMethod}
                  onChange={(e) => setDeliveryMethod(e.target.value as DeliveryMethod)}
                  className="w-full min-h-[48px] bg-[#F5EEE5]/60 border border-[#35151F]/20 rounded-[12px] px-3.5 text-xs text-[#35151F]"
                >
                  <option value="standard">Insured Standard Courier</option>
                  <option value="express">Express Air Courier ($65)</option>
                  <option value="atelier_pickup">Atelier Private Collection (Complimentary)</option>
                </select>
              </div>

              <div className="space-y-2.5 pt-4 border-t border-[#35151F]/12 text-sm tabular-nums">
                <div className="flex justify-between text-[#6D595E]">
                  <span>Subtotal</span>
                  <span>{formatMoney(cartSummary.subtotalCents, currency)}</span>
                </div>
                {cartSummary.discountCents > 0 && (
                  <div className="flex justify-between text-[#287A4B]">
                    <span>Privilege ({cartSummary.appliedCouponCode})</span>
                    <span>-{formatMoney(cartSummary.discountCents, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#6D595E]">
                  <span>Shipping</span>
                  <span>
                    {cartSummary.shippingCents === 0
                      ? 'Complimentary'
                      : formatMoney(cartSummary.shippingCents, currency)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-semibold text-[#35151F] pt-3 border-t border-[#35151F]/12">
                  <span>Total</span>
                  <span>{cartLoading ? 'Verifying...' : formatMoney(cartSummary.totalCents, currency)}</span>
                </div>
              </div>

              <PageTransitionLink
                to="/checkout"
                className="flex items-center justify-center w-full min-h-[48px] bg-[#35151F] text-[#F5EEE5] rounded-[12px] text-xs font-medium uppercase tracking-[0.1em] hover:bg-[#8B2635] transition-colors"
              >
                Proceed to Checkout
              </PageTransitionLink>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
