import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { formatMoney } from '../lib/commerce';
import { Order } from '../types/ecommerce';

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const { getIdToken, currency } = useStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await getIdToken();
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const qs = new URLSearchParams();
      if (params.get('email')) qs.set('email', params.get('email')!);
      if (params.get('confirm')) qs.set('confirm', params.get('confirm')!);

      const res = await fetch(`/api/orders/${id}?${qs.toString()}`, { headers });
      const data = await res.json();
      if (cancelled) return;
      if (!res.ok) {
        setError(data.error || 'Unable to load order.');
      } else {
        setOrder(data.order);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, params, getIdToken]);

  if (error) {
    return (
      <div className="bg-[#F5EEE5] min-h-screen">
        <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-4">
          <h1 className="font-display text-3xl text-[#35151F]">{error}</h1>
          <Link to="/account" className="underline text-sm text-[#8B2635]">
            Return to Account & Order Lookup
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-[#F5EEE5] min-h-screen">
        <div className="max-w-3xl mx-auto px-4 py-24 text-center text-sm text-[#6D595E]">
          Loading verified order record...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F5EEE5] min-h-screen py-12 md:py-20 text-[#35151F]">
      <div className="max-w-4xl mx-auto px-4 sm:px-8 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#35151F]/14 pb-6">
          <div>
            <Link to="/account" className="text-xs text-[#6D595E] hover:text-[#8B2635]">
              ← Back to Account
            </Link>
            <h1 className="editorial-section-title text-[#35151F] mt-2 tabular-nums">
              {order.orderNumber}
            </h1>
          </div>
          <div className="text-xs text-[#6D595E] capitalize">
            Fulfillment: <strong className="text-[#35151F]">{order.fulfillmentStatus}</strong> ·
            Payment: <strong className="text-[#35151F]">{order.paymentStatus}</strong>
          </div>
        </div>

        {/* Timeline */}
        <section className="bg-[#FFFFFF] border border-[#35151F]/14 rounded-[18px] p-6 sm:p-8 space-y-4 shadow-[var(--card-shadow-subtle)]">
          <h2 className="font-display text-2xl text-[#35151F]">Order Timeline</h2>
          <ol className="space-y-4 border-t border-[#35151F]/12 pt-4">
            {order.timeline.map((entry, idx) => (
              <li key={idx} className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 text-xs">
                <div>
                  <span className="font-medium capitalize text-[#35151F]">{entry.status}</span>
                  <span className="text-[#6D595E]"> — {entry.note}</span>
                </div>
                <span className="text-[#6D595E] tabular-nums shrink-0">
                  {new Date(entry.timestamp).toLocaleString()}
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* Items & Totals */}
        <section className="bg-[#FFFFFF] border border-[#35151F]/14 rounded-[18px] p-6 sm:p-8 space-y-6 shadow-[var(--card-shadow-subtle)]">
          <h2 className="font-display text-2xl text-[#35151F]">Garments & Charges</h2>
          <div className="divide-y divide-[#35151F]/12">
            {order.items.map((item) => (
              <div key={item.sku} className="py-3 flex justify-between text-sm">
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

          <div className="border-t border-[#35151F]/12 pt-4 space-y-2 text-sm tabular-nums">
            <div className="flex justify-between text-[#6D595E]">
              <span>Subtotal</span>
              <span>{formatMoney(order.subtotalCents, currency)}</span>
            </div>
            {order.discountCents > 0 && (
              <div className="flex justify-between text-[#287A4B]">
                <span>Privilege ({order.couponCode})</span>
                <span>-{formatMoney(order.discountCents, currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-[#6D595E]">
              <span>Shipping</span>
              <span>
                {order.shippingCents === 0 ? 'Complimentary' : formatMoney(order.shippingCents, currency)}
              </span>
            </div>
            <div className="flex justify-between text-base font-semibold text-[#35151F] pt-2 border-t border-[#35151F]/12">
              <span>Total</span>
              <span>{formatMoney(order.totalCents, currency)}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
