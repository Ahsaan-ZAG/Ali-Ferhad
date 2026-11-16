import { addDoc, collection, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { LogOut, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { formatMoney } from '../lib/commerce';
import { db } from '../lib/firebase';
import { Order } from '../types/ecommerce';

interface SavedAddress {
  id: string;
  recipientName: string;
  line1: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
}

export function AccountPage() {
  const { user, isAdmin, getIdToken, signInWithGoogle, signOut, currency, showToast } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [lookupOrderNum, setLookupOrderNum] = useState('');
  const [lookupEmail, setLookupEmail] = useState('');
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupResult, setLookupResult] = useState<Order | null>(null);

  const [newAddress, setNewAddress] = useState({
    recipientName: '',
    line1: '',
    city: '',
    postalCode: '',
    country: 'United States',
    phone: '',
  });
  const [addingAddress, setAddingAddress] = useState(false);

  const loadAccountData = useCallback(async () => {
    if (!user) return;
    try {
      const token = await getIdToken();
      if (token) {
        const res = await fetch('/api/orders', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders ?? []);
        }
      }
      const addrSnap = await getDocs(collection(db, 'users', user.uid, 'addresses'));
      setAddresses(
        addrSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<SavedAddress, 'id'>),
        }))
      );
    } catch (err) {
      console.error('Failed loading account records:', err);
    }
  }, [user, getIdToken]);

  useEffect(() => {
    void loadAccountData();
  }, [loadAccountData]);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'addresses'), {
        userId: user.uid,
        ...newAddress,
        updatedAt: new Date(),
      });
      setAddingAddress(false);
      setNewAddress({
        recipientName: '',
        line1: '',
        city: '',
        postalCode: '',
        country: 'United States',
        phone: '',
      });
      showToast('Shipping address saved.', 'success');
      void loadAccountData();
    } catch {
      showToast('Unable to save address.', 'error');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'addresses', id));
    void loadAccountData();
  };

  const handleOrderLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    setLookupResult(null);
    try {
      const res = await fetch(
        `/api/orders?orderNumber=${encodeURIComponent(lookupOrderNum.trim())}&email=${encodeURIComponent(lookupEmail.trim())}`
      );
      const data = await res.json();
      if (!res.ok) {
        setLookupError(data.error || 'No matching order found.');
      } else if (data.orders?.[0]) {
        setLookupResult(data.orders[0]);
      }
    } catch {
      setLookupError('Lookup request failed.');
    }
  };

  return (
    <div className="bg-[#F5EEE5] min-h-screen py-12 md:py-20 text-[#35151F]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 space-y-14">
        <div className="pb-8 border-b border-[#35151F]/14 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[#8B2635]">Client Portal</p>
            <h1 className="editorial-section-title text-[#35151F] mt-1">
              {user ? `Welcome, ${user.displayName || user.email}` : 'Account & Order Tracking'}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {isAdmin && (
              <Link
                to="/admin"
                className="inline-flex items-center min-h-[48px] bg-[#35151F] text-[#F5EEE5] rounded-[12px] px-5 text-xs uppercase tracking-wider hover:bg-[#8B2635] transition-colors"
              >
                Atelier Operations
              </Link>
            )}
            {user ? (
              <button
                type="button"
                onClick={signOut}
                className="inline-flex items-center gap-2 min-h-[48px] border border-[#35151F]/25 rounded-[12px] bg-[#FFFFFF] px-5 text-xs text-[#35151F] hover:border-[#35151F]"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            ) : (
              <button
                type="button"
                onClick={signInWithGoogle}
                className="min-h-[48px] bg-[#35151F] text-[#F5EEE5] rounded-[12px] px-6 text-xs font-medium uppercase tracking-[0.1em] hover:bg-[#8B2635] transition-colors"
              >
                Sign In with Google
              </button>
            )}
          </div>
        </div>

        {user && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Order History */}
            <div className="lg:col-span-7 space-y-5">
              <h2 className="font-display text-2xl text-[#35151F]">Your Orders</h2>
              {orders.length === 0 ? (
                <div className="p-8 rounded-[18px] border border-[#35151F]/14 bg-[#FFFFFF] text-sm text-[#6D595E]">
                  No orders are linked to {user.email} yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <Link
                      key={order.id}
                      to={`/account/orders/${order.id}`}
                      className="block p-5 rounded-[16px] border border-[#35151F]/14 bg-[#FFFFFF] hover:border-[#8B2635] transition-colors shadow-[var(--card-shadow-subtle)]"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-[#35151F] tabular-nums">
                          {order.orderNumber}
                        </span>
                        <span className="tabular-nums font-semibold text-[#35151F]">
                          {formatMoney(order.totalCents, currency)}
                        </span>
                      </div>
                      <p className="text-xs text-[#6D595E] mt-1 capitalize">
                        Status: {order.fulfillmentStatus} · Payment: {order.paymentStatus} ·{' '}
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Saved Addresses */}
            <div className="lg:col-span-5 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl text-[#35151F]">Saved Addresses</h2>
                <button
                  type="button"
                  onClick={() => setAddingAddress((v) => !v)}
                  className="min-h-[48px] inline-flex items-center gap-1 text-xs underline underline-offset-4 text-[#35151F] hover:text-[#8B2635]"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Address
                </button>
              </div>

              {addingAddress && (
                <form onSubmit={handleAddAddress} className="p-5 rounded-[16px] border border-[#35151F]/14 bg-[#FFFFFF] space-y-3">
                  <input
                    required
                    placeholder="Recipient name"
                    value={newAddress.recipientName}
                    onChange={(e) => setNewAddress({ ...newAddress, recipientName: e.target.value })}
                    className="w-full min-h-[44px] bg-[#F5EEE5]/60 border border-[#35151F]/20 rounded-[10px] px-3 text-xs"
                  />
                  <input
                    required
                    placeholder="Street address"
                    value={newAddress.line1}
                    onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })}
                    className="w-full min-h-[44px] bg-[#F5EEE5]/60 border border-[#35151F]/20 rounded-[10px] px-3 text-xs"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      required
                      placeholder="City"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      className="min-h-[44px] bg-[#F5EEE5]/60 border border-[#35151F]/20 rounded-[10px] px-3 text-xs"
                    />
                    <input
                      required
                      placeholder="Postal code"
                      value={newAddress.postalCode}
                      onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                      className="min-h-[44px] bg-[#F5EEE5]/60 border border-[#35151F]/20 rounded-[10px] px-3 text-xs"
                    />
                  </div>
                  <input
                    required
                    placeholder="Phone"
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                    className="w-full min-h-[44px] bg-[#F5EEE5]/60 border border-[#35151F]/20 rounded-[10px] px-3 text-xs"
                  />
                  <button type="submit" className="min-h-[48px] bg-[#35151F] text-[#F5EEE5] rounded-[10px] px-5 text-xs hover:bg-[#8B2635] transition-colors">
                    Save Address
                  </button>
                </form>
              )}

              <div className="space-y-3">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="p-4 rounded-[16px] border border-[#35151F]/14 bg-[#FFFFFF] flex items-start justify-between text-xs shadow-[var(--card-shadow-subtle)]"
                  >
                    <div>
                      <p className="font-medium text-[#35151F]">{addr.recipientName}</p>
                      <p className="text-[#6D595E]">{addr.line1}</p>
                      <p className="text-[#6D595E]">
                        {addr.city}, {addr.postalCode} · {addr.country}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteAddress(addr.id)}
                      aria-label={`Delete address ${addr.line1}`}
                      className="min-h-[48px] min-w-[48px] flex items-center justify-center text-[#6D595E] hover:text-[#8B2635]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Guest Order Lookup */}
        <section className="bg-[#FFFFFF] border border-[#35151F]/14 rounded-[20px] p-6 sm:p-10 max-w-2xl space-y-5 shadow-[var(--card-shadow-subtle)]">
          <div>
            <h2 className="font-display text-2xl text-[#35151F]">Direct Order Lookup</h2>
            <p className="text-xs text-[#6D595E] mt-1">
              Track any guest or demo order using its reference (e.g. MF-2026-1042) and email (julian.mercer@example.com).
            </p>
          </div>
          <form onSubmit={handleOrderLookup} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              required
              type="text"
              aria-label="Order reference number"
              value={lookupOrderNum}
              onChange={(e) => setLookupOrderNum(e.target.value)}
              placeholder="Order # (e.g. MF-2026-1042)"
              className="min-h-[48px] bg-[#F5EEE5]/60 border border-[#35151F]/20 rounded-[12px] px-3.5 text-xs"
            />
            <input
              required
              type="email"
              aria-label="Order email address"
              value={lookupEmail}
              onChange={(e) => setLookupEmail(e.target.value)}
              placeholder="Order email"
              className="min-h-[48px] bg-[#F5EEE5]/60 border border-[#35151F]/20 rounded-[12px] px-3.5 text-xs"
            />
            <button
              type="submit"
              className="min-h-[48px] bg-[#35151F] text-[#F5EEE5] rounded-[12px] px-4 text-xs font-medium uppercase tracking-wider hover:bg-[#8B2635] transition-colors"
            >
              Locate Order
            </button>
          </form>

          {lookupError && <p className="text-xs text-[#8B2635]">{lookupError}</p>}

          {lookupResult && (
            <div className="p-4 rounded-[14px] border border-[#35151F]/14 bg-[#F5EEE5] flex items-center justify-between text-xs">
              <div>
                <p className="font-medium text-[#35151F]">{lookupResult.orderNumber}</p>
                <p className="text-[#6D595E] capitalize">
                  Status: {lookupResult.fulfillmentStatus} · Total {formatMoney(lookupResult.totalCents, currency)}
                </p>
              </div>
              <Link
                to={`/account/orders/${lookupResult.id}?email=${encodeURIComponent(lookupEmail.trim())}`}
                className="underline font-medium text-[#35151F] hover:text-[#8B2635]"
              >
                View Timeline →
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
