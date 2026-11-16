import { CheckCircle2, Lock } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LuxuryImage } from '../components/ui/LuxuryImage';
import { useStore } from '../context/StoreContext';
import { formatMoney } from '../lib/commerce';
import { DeliveryMethod, Order, PaymentMethod } from '../types/ecommerce';

export function CheckoutPage() {
  const {
    user,
    getIdToken,
    cartItems,
    cartSummary,
    currency,
    couponCode,
    setCouponCode,
    deliveryMethod,
    setDeliveryMethod,
    clearCart,
    refreshCatalog,
    showToast,
  } = useStore();

  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [stateRegion, setStateRegion] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('United States');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [couponInput, setCouponInput] = useState(couponCode);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  const idempotencyKey = useMemo(
    () => `chk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    []
  );

  useEffect(() => {
    if (user) {
      if (user.email && !customerEmail) setCustomerEmail(user.email);
      if (user.displayName && !customerName) {
        setCustomerName(user.displayName);
        if (!recipientName) setRecipientName(user.displayName);
      }
    }
  }, [user, customerEmail, customerName, recipientName]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const token = await getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          items: cartItems,
          couponCode: couponCode || null,
          deliveryMethod,
          paymentMethod,
          customerEmail,
          customerName,
          idempotencyKey,
          shippingAddress: {
            recipientName: recipientName || customerName,
            line1,
            line2: line2 || undefined,
            city,
            state: stateRegion || undefined,
            postalCode,
            country,
            phone,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Unable to verify checkout details.');
      } else {
        setConfirmedOrder(data.order);
        clearCart();
        void refreshCatalog();
        showToast(`Order ${data.order.orderNumber} confirmed.`, 'success');
      }
    } catch {
      setError('Network interruption during checkout. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedOrder) {
    return (
      <div className="bg-[#F5EEE5] min-h-screen py-14 md:py-24 text-[#35151F]">
        <div className="max-w-3xl mx-auto px-4 sm:px-8">
          <div className="bg-[#FFFFFF] border border-[#35151F]/14 rounded-[20px] p-8 sm:p-12 space-y-8 shadow-[var(--card-shadow-subtle)]">
            <div className="flex items-start gap-4 border-b border-[#35151F]/12 pb-6">
              <CheckCircle2 className="w-7 h-7 text-[#287A4B] shrink-0 mt-1" />
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.14em] text-[#8B2635]">
                  Order Confirmed
                </p>
                <h1 className="font-display text-3xl sm:text-4xl text-[#35151F]">
                  Thank you, {confirmedOrder.customerName}
                </h1>
                <p className="text-sm text-[#6D595E]">
                  Reference <strong className="text-[#35151F] tabular-nums">{confirmedOrder.orderNumber}</strong> · Confirmation prepared for {confirmedOrder.customerEmail}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div>
                <p className="uppercase tracking-[0.1em] text-[#6D595E] mb-1.5">Shipping To</p>
                <p className="text-[#35151F] font-medium">{confirmedOrder.shippingAddress.recipientName}</p>
                <p className="text-[#6D595E]">{confirmedOrder.shippingAddress.line1}</p>
                <p className="text-[#6D595E]">
                  {confirmedOrder.shippingAddress.city}, {confirmedOrder.shippingAddress.postalCode}
                </p>
                <p className="text-[#6D595E]">{confirmedOrder.shippingAddress.country}</p>
              </div>
              <div>
                <p className="uppercase tracking-[0.1em] text-[#6D595E] mb-1.5">Settlement & Status</p>
                <p className="text-[#35151F]">
                  Fulfillment: <span className="capitalize font-medium">{confirmedOrder.fulfillmentStatus}</span>
                </p>
                <p className="text-[#6D595E] mt-1">
                  Payment Status: <span className="capitalize">{confirmedOrder.paymentStatus}</span>
                </p>
                <p className="text-[#6D595E] mt-1">
                  Method: {confirmedOrder.paymentMethod === 'cod' ? 'Cash on Delivery' : confirmedOrder.paymentMethod}
                </p>
              </div>
            </div>

            <div className="border-t border-b border-[#35151F]/12 py-5 space-y-4">
              {confirmedOrder.items.map((item) => (
                <div key={item.sku} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-[#35151F]">{item.name}</p>
                    <p className="text-xs text-[#6D595E]">
                      {item.colorName} · Size {item.size} · Qty {item.quantity}
                    </p>
                  </div>
                  <span className="tabular-nums text-[#35151F]">
                    {formatMoney(item.lineTotalCents, currency)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-sm tabular-nums">
              <div className="flex justify-between text-[#6D595E]">
                <span>Subtotal</span>
                <span>{formatMoney(confirmedOrder.subtotalCents, currency)}</span>
              </div>
              {confirmedOrder.discountCents > 0 && (
                <div className="flex justify-between text-[#287A4B]">
                  <span>Privilege ({confirmedOrder.couponCode})</span>
                  <span>-{formatMoney(confirmedOrder.discountCents, currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#6D595E]">
                <span>Shipping</span>
                <span>
                  {confirmedOrder.shippingCents === 0
                    ? 'Complimentary'
                    : formatMoney(confirmedOrder.shippingCents, currency)}
                </span>
              </div>
              <div className="flex justify-between text-base font-semibold text-[#35151F] pt-2 border-t border-[#35151F]/12">
                <span>Total Verified</span>
                <span>{formatMoney(confirmedOrder.totalCents, currency)}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to={`/account/orders/${confirmedOrder.id}?confirm=${encodeURIComponent(confirmedOrder.idempotencyKey)}`}
                className="inline-flex items-center justify-center min-h-[48px] bg-[#35151F] text-[#F5EEE5] rounded-[12px] px-6 text-xs uppercase tracking-[0.1em] hover:bg-[#8B2635] transition-colors"
              >
                View Order Timeline
              </Link>
              <Link
                to="/shop"
                className="inline-flex items-center justify-center min-h-[48px] border border-[#35151F]/25 rounded-[12px] px-6 text-xs uppercase tracking-[0.1em] text-[#35151F] hover:border-[#35151F]"
              >
                Continue Exploring
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (cartSummary.lines.length === 0) {
    return (
      <div className="bg-[#F5EEE5] min-h-screen py-24 text-center px-4 space-y-4 text-[#35151F]">
        <h1 className="editorial-section-title text-[#35151F]">No items in your bag</h1>
        <p className="text-sm text-[#6D595E]">Add a garment to begin checkout.</p>
        <Link
          to="/shop"
          className="inline-flex items-center justify-center min-h-[48px] bg-[#35151F] text-[#F5EEE5] rounded-[12px] px-7 text-xs uppercase tracking-[0.1em] hover:bg-[#8B2635] transition-colors"
        >
          Explore Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#F5EEE5] min-h-screen py-12 md:py-16 text-[#35151F]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
        <div className="pb-8 border-b border-[#35151F]/14 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[#8B2635]">
              Server-Verified Checkout
            </p>
            <h1 className="editorial-section-title text-[#35151F] mt-1">Checkout</h1>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs text-[#6D595E]">
            <Lock className="w-3.5 h-3.5" /> Totals verified server-side
          </span>
        </div>

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 pt-10">
          {/* Left Form Sections */}
          <div className="lg:col-span-7 space-y-10">
            {error && (
              <div role="alert" className="p-4 rounded-[14px] border border-[#8B2635] bg-[#FFFFFF] text-sm text-[#8B2635]">
                {error}
              </div>
            )}

            {/* 1. Customer Contact */}
            <section className="space-y-4 bg-[#FFFFFF] border border-[#35151F]/14 rounded-[18px] p-5 sm:p-7">
              <h2 className="font-display text-2xl text-[#35151F] border-b border-[#35151F]/12 pb-2">
                01. Client Contact
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="chk-name" className="block text-xs text-[#6D595E] mb-1.5">
                    Full Name *
                  </label>
                  <input
                    id="chk-name"
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Claire Dubois"
                    className="w-full min-h-[48px] bg-[#F5EEE5]/50 border border-[#35151F]/20 rounded-[12px] px-3.5 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="chk-email" className="block text-xs text-[#6D595E] mb-1.5">
                    Email Address *
                  </label>
                  <input
                    id="chk-email"
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="claire@example.com"
                    className="w-full min-h-[48px] bg-[#F5EEE5]/50 border border-[#35151F]/20 rounded-[12px] px-3.5 text-sm"
                  />
                </div>
              </div>
            </section>

            {/* 2. Shipping Address */}
            <section className="space-y-4 bg-[#FFFFFF] border border-[#35151F]/14 rounded-[18px] p-5 sm:p-7">
              <h2 className="font-display text-2xl text-[#35151F] border-b border-[#35151F]/12 pb-2">
                02. Shipping Destination
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="chk-recipient" className="block text-xs text-[#6D595E] mb-1.5">
                    Recipient Name *
                  </label>
                  <input
                    id="chk-recipient"
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Recipient full name"
                    className="w-full min-h-[48px] bg-[#F5EEE5]/50 border border-[#35151F]/20 rounded-[12px] px-3.5 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="chk-line1" className="block text-xs text-[#6D595E] mb-1.5">
                    Street Address *
                  </label>
                  <input
                    id="chk-line1"
                    type="text"
                    required
                    value={line1}
                    onChange={(e) => setLine1(e.target.value)}
                    placeholder="Street number and name"
                    className="w-full min-h-[48px] bg-[#F5EEE5]/50 border border-[#35151F]/20 rounded-[12px] px-3.5 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="chk-line2" className="block text-xs text-[#6D595E] mb-1.5">
                    Apartment / Suite (Optional)
                  </label>
                  <input
                    id="chk-line2"
                    type="text"
                    value={line2}
                    onChange={(e) => setLine2(e.target.value)}
                    className="w-full min-h-[48px] bg-[#F5EEE5]/50 border border-[#35151F]/20 rounded-[12px] px-3.5 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="chk-city" className="block text-xs text-[#6D595E] mb-1.5">
                    City *
                  </label>
                  <input
                    id="chk-city"
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full min-h-[48px] bg-[#F5EEE5]/50 border border-[#35151F]/20 rounded-[12px] px-3.5 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="chk-state" className="block text-xs text-[#6D595E] mb-1.5">
                    State / Region
                  </label>
                  <input
                    id="chk-state"
                    type="text"
                    value={stateRegion}
                    onChange={(e) => setStateRegion(e.target.value)}
                    className="w-full min-h-[48px] bg-[#F5EEE5]/50 border border-[#35151F]/20 rounded-[12px] px-3.5 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="chk-postal" className="block text-xs text-[#6D595E] mb-1.5">
                    Postal Code *
                  </label>
                  <input
                    id="chk-postal"
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full min-h-[48px] bg-[#F5EEE5]/50 border border-[#35151F]/20 rounded-[12px] px-3.5 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="chk-country" className="block text-xs text-[#6D595E] mb-1.5">
                    Country *
                  </label>
                  <input
                    id="chk-country"
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full min-h-[48px] bg-[#F5EEE5]/50 border border-[#35151F]/20 rounded-[12px] px-3.5 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="chk-phone" className="block text-xs text-[#6D595E] mb-1.5">
                    Telephone (for courier coordination) *
                  </label>
                  <input
                    id="chk-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 212 555 0144"
                    className="w-full min-h-[48px] bg-[#F5EEE5]/50 border border-[#35151F]/20 rounded-[12px] px-3.5 text-sm"
                  />
                </div>
              </div>
            </section>

            {/* 3. Delivery Method */}
            <section className="space-y-4 bg-[#FFFFFF] border border-[#35151F]/14 rounded-[18px] p-5 sm:p-7">
              <h2 className="font-display text-2xl text-[#35151F] border-b border-[#35151F]/12 pb-2">
                03. Delivery Method
              </h2>
              <div className="space-y-2.5">
                {[
                  {
                    id: 'standard' as DeliveryMethod,
                    title: 'Insured Standard Courier',
                    note: 'Complimentary over $1,000 · Otherwise $25 (3–5 business days)',
                  },
                  {
                    id: 'express' as DeliveryMethod,
                    title: 'Express Air Courier',
                    note: 'Flat $65 · Priority 1–2 business days in archival garment packaging',
                  },
                  {
                    id: 'atelier_pickup' as DeliveryMethod,
                    title: 'Atelier Private Appointment Pickup',
                    note: 'Complimentary · Prepared for private fitting and collection',
                  },
                ].map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex items-start gap-3 p-4 rounded-[14px] border cursor-pointer transition-colors ${
                      deliveryMethod === opt.id
                        ? 'bg-[#F5EEE5] border-[#35151F]'
                        : 'bg-[#FFFFFF] border-[#35151F]/15 hover:border-[#8B2635]/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value={opt.id}
                      checked={deliveryMethod === opt.id}
                      onChange={() => setDeliveryMethod(opt.id)}
                      className="mt-1 accent-[#35151F]"
                    />
                    <div>
                      <p className="text-sm font-medium text-[#35151F]">{opt.title}</p>
                      <p className="text-xs text-[#6D595E] mt-0.5">{opt.note}</p>
                    </div>
                  </label>
                ))}
              </div>
            </section>

            {/* 4. Payment Adapter */}
            <section className="space-y-4 bg-[#FFFFFF] border border-[#35151F]/14 rounded-[18px] p-5 sm:p-7">
              <h2 className="font-display text-2xl text-[#35151F] border-b border-[#35151F]/12 pb-2">
                04. Payment Method
              </h2>
              <div className="space-y-2.5">
                {[
                  {
                    id: 'cod' as PaymentMethod,
                    title: 'Cash on Delivery',
                    note: 'Settle directly upon verified courier delivery.',
                  },
                  {
                    id: 'card_sandbox' as PaymentMethod,
                    title: 'Card Payment (Development Adapter)',
                    note: 'Tokenized development authorization — raw card numbers and CVV are never collected or stored.',
                  },
                  {
                    id: 'invoice' as PaymentMethod,
                    title: 'Private Client Invoice',
                    note: 'Receive an itemized settlement link from our client concierge.',
                  },
                ].map((pm) => (
                  <label
                    key={pm.id}
                    className={`flex items-start gap-3 p-4 rounded-[14px] border cursor-pointer transition-colors ${
                      paymentMethod === pm.id
                        ? 'bg-[#F5EEE5] border-[#35151F]'
                        : 'bg-[#FFFFFF] border-[#35151F]/15 hover:border-[#8B2635]/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={pm.id}
                      checked={paymentMethod === pm.id}
                      onChange={() => setPaymentMethod(pm.id)}
                      className="mt-1 accent-[#35151F]"
                    />
                    <div>
                      <p className="text-sm font-medium text-[#35151F]">{pm.title}</p>
                      <p className="text-xs text-[#6D595E] mt-0.5">{pm.note}</p>
                    </div>
                  </label>
                ))}
              </div>
            </section>
          </div>

          {/* Right Order Review */}
          <aside className="lg:col-span-5">
            <div className="bg-[#FFFFFF] border border-[#35151F]/14 rounded-[20px] p-6 sm:p-8 space-y-6 lg:sticky lg:top-28 shadow-[var(--card-shadow-subtle)]">
              <h2 className="font-display text-2xl text-[#35151F]">Order Review</h2>

              <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                {cartSummary.lines.map((line) => (
                  <div key={line.sku} className="flex gap-3 p-2.5 rounded-[12px] bg-[#F5EEE5]/60 border border-[#35151F]/10">
                    <div className="w-16 aspect-[4/5] rounded-[8px] bg-[#EFE4D6] shrink-0 overflow-hidden">
                      <LuxuryImage src={line.imageUrl} alt={line.name} className="w-full h-full object-cover object-top" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-lg text-[#35151F] truncate">{line.name}</p>
                      <p className="text-xs text-[#6D595E]">
                        {line.colorName} · Size {line.size} · Qty {line.quantity}
                      </p>
                      <p className="text-xs font-semibold tabular-nums text-[#35151F] mt-1">
                        {formatMoney(line.lineTotalCents, currency)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div className="flex gap-2 pt-4 border-t border-[#35151F]/12">
                <input
                  type="text"
                  aria-label="Privilege code"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Privilege code (e.g. ATELIER10)"
                  className="flex-1 min-h-[48px] bg-[#F5EEE5]/60 border border-[#35151F]/20 rounded-[12px] px-3.5 text-xs uppercase"
                />
                <button
                  type="button"
                  onClick={() => setCouponCode(couponInput.trim().toUpperCase())}
                  className="min-h-[48px] border border-[#35151F] rounded-[12px] px-5 text-xs font-medium hover:bg-[#35151F] hover:text-[#F5EEE5] transition-colors"
                >
                  Apply
                </button>
              </div>
              {cartSummary.couponMessage && (
                <p className={`text-xs ${cartSummary.appliedCouponCode ? 'text-[#287A4B]' : 'text-[#8B2635]'}`}>
                  {cartSummary.couponMessage}
                </p>
              )}

              <div className="space-y-2.5 pt-4 border-t border-[#35151F]/12 text-sm tabular-nums">
                <div className="flex justify-between text-[#6D595E]">
                  <span>Subtotal</span>
                  <span>{formatMoney(cartSummary.subtotalCents, currency)}</span>
                </div>
                {cartSummary.discountCents > 0 && (
                  <div className="flex justify-between text-[#287A4B]">
                    <span>Discount ({cartSummary.appliedCouponCode})</span>
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
                  <span>Total Due</span>
                  <span>{formatMoney(cartSummary.totalCents, currency)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                data-testid="place-order-button"
                className="w-full min-h-[48px] bg-[#35151F] text-[#F5EEE5] rounded-[12px] text-xs font-medium uppercase tracking-[0.1em] hover:bg-[#8B2635] transition-colors disabled:opacity-50"
              >
                {submitting ? 'Verifying & Placing Order...' : 'Confirm & Place Order'}
              </button>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}
