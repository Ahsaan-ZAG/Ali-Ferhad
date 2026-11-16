import { useCallback, useEffect, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { canTransitionFulfillmentStatus, formatMoney } from '../lib/commerce';
import {
  AuditLogEntry,
  Coupon,
  FulfillmentStatus,
  NewsletterSubscriber,
  Order,
  Product,
  ProductCategory,
  ProductGender,
  SiteSettings,
} from '../types/ecommerce';

type AdminTab = 'overview' | 'products' | 'inventory' | 'orders' | 'customers' | 'marketing' | 'settings';

interface AdminPayload {
  metrics: {
    totalOrders: number;
    pendingOrders: number;
    totalRevenueCents: number;
    totalProducts: number;
    lowStockCount: number;
    subscribersCount: number;
  };
  lowStockVariants: {
    productId: string;
    productName: string;
    sku: string;
    colorName: string;
    size: string;
    stock: number;
  }[];
  products: Product[];
  orders: Order[];
  coupons: Coupon[];
  subscribers: NewsletterSubscriber[];
  customers: {
    email: string;
    name: string;
    ordersCount: number;
    totalSpentCents: number;
    lastOrderAt: string;
  }[];
  auditLogs: AuditLogEntry[];
  settings: SiteSettings;
}

const IMAGE_CHOICES = [
  { label: 'Ivory Cashmere Coat', url: '/src/assets/images/product_coat_ivory_1794838444893.jpg' },
  { label: 'Charcoal Wool Blazer', url: '/src/assets/images/product_blazer_charcoal_1794838444370.jpg' },
  { label: 'Taupe Silk Dress', url: '/src/assets/images/product_silk_dress_taupe_1794838444725.jpg' },
  { label: 'Espresso Merino Knit', url: '/src/assets/images/product_knit_espresso_1794838445397.jpg' },
  { label: 'Sand Storm Trench', url: '/src/assets/images/product_trench_sand_1794838446020.jpg' },
  { label: 'Stone Wide Trousers', url: '/src/assets/images/product_trouser_stone_1794838445480.jpg' },
];

const STATUS_OPTIONS: FulfillmentStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
];

export function AdminPage() {
  const { user, isAdmin, getIdToken, signInWithGoogle, refreshCatalog, showToast, currency } = useStore();
  const [previewAdmin, setPreviewAdmin] = useState(false);
  const [tab, setTab] = useState<AdminTab>('overview');
  const [data, setData] = useState<AdminPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Create Product Form State
  const [newProd, setNewProd] = useState({
    name: '',
    subtitle: '',
    description: '',
    materialDetails: '100% Virgin Wool',
    careInstructions: 'Specialist dry clean only',
    fitNotes: 'Relaxed architectural tailoring',
    priceDollars: '980',
    category: 'Outerwear' as ProductCategory,
    gender: 'Women' as ProductGender,
    collectionSlug: 'autumn-architecture',
    imageUrl: IMAGE_CHOICES[0].url,
    colorName: 'Warm Ivory',
    colorHex: '#F3EFE7',
    size: 'M',
    stock: '10',
  });

  // Create Coupon Form State
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed_cents',
    value: '15',
    minSubtotalDollars: '500',
    maxUses: '100',
  });

  const buildHeaders = useCallback(async () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = await getIdToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else if (previewAdmin) {
      headers['x-demo-admin'] = 'true';
    }
    return headers;
  }, [getIdToken, previewAdmin]);

  const loadAdmin = useCallback(async () => {
    if (!isAdmin && !previewAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const headers = await buildHeaders();
      const res = await fetch('/api/admin/overview', { headers });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Admin access required.');
      } else {
        setData(json);
      }
    } catch {
      setError('Failed to fetch atelier operations data.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, previewAdmin, buildHeaders]);

  useEffect(() => {
    void loadAdmin();
  }, [loadAdmin]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const headers = await buildHeaders();
    const slug = newProd.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const sku = `MF-${slug.slice(0, 6).toUpperCase()}-${newProd.size}`;

    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        slug: `${slug}-${Date.now().toString().slice(-4)}`,
        name: newProd.name,
        subtitle: newProd.subtitle,
        description: newProd.description,
        materialDetails: newProd.materialDetails,
        careInstructions: newProd.careInstructions,
        fitNotes: newProd.fitNotes,
        priceCents: Math.round(Number(newProd.priceDollars) * 100),
        currency: 'USD',
        category: newProd.category,
        gender: newProd.gender,
        collectionSlug: newProd.collectionSlug,
        tags: [newProd.category.toLowerCase()],
        isNewArrival: true,
        isBestSeller: false,
        status: 'active',
        images: [{ url: newProd.imageUrl, alt: newProd.name, colorName: newProd.colorName }],
        variants: [
          {
            sku,
            colorName: newProd.colorName,
            colorHex: newProd.colorHex,
            size: newProd.size,
            stock: Number(newProd.stock) || 5,
            reserved: 0,
          },
        ],
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      showToast(json.error || 'Failed to create garment.', 'error');
    } else {
      showToast(`Created "${json.product.name}".`, 'success');
      setNewProd({ ...newProd, name: '', subtitle: '', description: '' });
      void loadAdmin();
      void refreshCatalog();
    }
  };

  const handleArchiveProduct = async (id: string, name: string) => {
    if (!window.confirm(`Archive "${name}" from the active storefront?`)) return;
    const headers = await buildHeaders();
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE', headers });
    if (res.ok) {
      showToast('Garment archived.', 'neutral');
      void loadAdmin();
      void refreshCatalog();
    }
  };

  const handleStockUpdate = async (productId: string, sku: string, stock: number) => {
    const headers = await buildHeaders();
    const res = await fetch('/api/admin/inventory', {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ productId, sku, stock }),
    });
    if (res.ok) {
      showToast(`Updated ${sku} stock to ${stock}.`, 'success');
      void loadAdmin();
      void refreshCatalog();
    }
  };

  const handleOrderTransition = async (orderId: string, status: FulfillmentStatus) => {
    const headers = await buildHeaders();
    const res = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status, note: `Updated via Atelier Operations.` }),
    });
    const json = await res.json();
    if (!res.ok) {
      showToast(json.error || 'Invalid status transition.', 'error');
    } else {
      showToast(`Order updated to ${status}.`, 'success');
      void loadAdmin();
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const headers = await buildHeaders();
    const res = await fetch('/api/admin/coupons', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        code: newCoupon.code,
        description: newCoupon.description,
        discountType: newCoupon.discountType,
        value:
          newCoupon.discountType === 'percentage'
            ? Number(newCoupon.value)
            : Number(newCoupon.value) * 100,
        minSubtotalCents: Number(newCoupon.minSubtotalDollars) * 100,
        maxUses: Number(newCoupon.maxUses),
        active: true,
        expiresAt: '2027-12-31T23:59:59.000Z',
      }),
    });
    if (res.ok) {
      showToast('Privilege code created.', 'success');
      setNewCoupon({ ...newCoupon, code: '', description: '' });
      void loadAdmin();
    }
  };

  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!data) return;
    const formData = new FormData(e.currentTarget);
    const headers = await buildHeaders();
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        announcementText: String(formData.get('announcementText') || ''),
        freeShippingThresholdCents: Number(formData.get('freeThresholdDollars') || 1000) * 100,
      }),
    });
    if (res.ok) {
      showToast('Storefront settings saved.', 'success');
      void loadAdmin();
      void refreshCatalog();
    }
  };

  if (!isAdmin && !previewAdmin) {
    return (
      <div className="bg-[#F3EFE7] min-h-screen py-20 px-4">
        <div className="max-w-xl mx-auto bg-[#FAF8F4] border border-[#D8D0C5] p-8 sm:p-10 space-y-6 text-center">
          <p className="text-xs uppercase tracking-[0.14em] text-[#77716A]">
            Restricted Operations
          </p>
          <h1 className="editorial-section-title text-[#111111]">Atelier Admin</h1>
          <p className="text-sm text-[#77716A]">
            {user
              ? `Signed in as ${user.email}. Administrator authorization is required to manage inventory and orders.`
              : 'Sign in with an authorized administrator Google account, or enter the local development preview workbench.'}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            {!user && (
              <button
                type="button"
                onClick={signInWithGoogle}
                className="bg-[#111111] text-[#F5F1EA] px-6 py-3 text-xs uppercase tracking-[0.1em]"
              >
                Sign In with Google
              </button>
            )}
            <button
              type="button"
              onClick={() => setPreviewAdmin(true)}
              data-testid="enter-admin-preview"
              className="border border-[#111111] text-[#111111] px-6 py-3 text-xs uppercase tracking-[0.1em] hover:bg-[#E6DDD0]"
            >
              Open Operations Preview
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F3EFE7] min-h-screen py-10 md:py-14">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#D8D0C5] pb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[#77716A]">
              Retail Operations Console
            </p>
            <h1 className="editorial-section-title text-[#111111] mt-1">
              Atelier Management
            </h1>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ['overview', 'Overview'],
                ['products', 'Products'],
                ['inventory', 'Inventory'],
                ['orders', 'Orders'],
                ['customers', 'Customers'],
                ['marketing', 'Coupons & Dispatches'],
                ['settings', 'Settings'],
              ] as [AdminTab, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`px-3.5 py-2 text-xs border transition-colors whitespace-nowrap ${
                  tab === key
                    ? 'bg-[#111111] text-[#F5F1EA] border-[#111111]'
                    : 'bg-[#FAF8F4] text-[#171717] border-[#D8D0C5] hover:border-[#111111]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-4 border border-[#B53A35] bg-[#FAF8F4] text-sm text-[#B53A35]">
            {error}
          </div>
        )}

        {loading && !data ? (
          <p className="text-sm text-[#77716A]">Loading database operations...</p>
        ) : (
          data && (
            <>
              {/* OVERVIEW */}
              {tab === 'overview' && (
                <div className="space-y-10">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {[
                      { label: 'Total Orders', value: data.metrics.totalOrders },
                      { label: 'Pending Action', value: data.metrics.pendingOrders },
                      { label: 'Gross Revenue', value: formatMoney(data.metrics.totalRevenueCents, currency) },
                      { label: 'Active Garments', value: data.metrics.totalProducts },
                      { label: 'Low Stock SKUs', value: data.metrics.lowStockCount },
                      { label: 'Subscribers', value: data.metrics.subscribersCount },
                    ].map((kpi) => (
                      <div key={kpi.label} className="bg-[#FAF8F4] border border-[#D8D0C5] p-5">
                        <p className="text-[11px] uppercase tracking-[0.1em] text-[#77716A]">{kpi.label}</p>
                        <p className="font-display text-3xl text-[#111111] mt-2 tabular-nums">
                          {kpi.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-[#FAF8F4] border border-[#D8D0C5] p-6 space-y-4">
                      <h2 className="font-display text-2xl text-[#111111]">Low Stock Alerts</h2>
                      {data.lowStockVariants.length === 0 ? (
                        <p className="text-xs text-[#77716A]">All garment variants have healthy stock levels.</p>
                      ) : (
                        <div className="divide-y divide-[#D8D0C5] text-xs">
                          {data.lowStockVariants.map((v) => (
                            <div key={v.sku} className="py-2.5 flex items-center justify-between">
                              <div>
                                <p className="font-medium text-[#111111]">{v.productName}</p>
                                <p className="text-[#77716A]">
                                  {v.sku} · {v.colorName} · Size {v.size}
                                </p>
                              </div>
                              <span className="text-[#A66A19] font-medium tabular-nums">
                                {v.stock} left
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="bg-[#FAF8F4] border border-[#D8D0C5] p-6 space-y-4">
                      <h2 className="font-display text-2xl text-[#111111]">Recent Audit Log</h2>
                      <div className="divide-y divide-[#D8D0C5] text-xs max-h-72 overflow-y-auto">
                        {data.auditLogs.map((log) => (
                          <div key={log.id} className="py-2.5 space-y-0.5">
                            <div className="flex justify-between">
                              <span className="font-medium text-[#111111]">{log.action}</span>
                              <span className="text-[#77716A] tabular-nums">
                                {new Date(log.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-[#77716A]">
                              {log.details} ({log.actorEmail})
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PRODUCTS */}
              {tab === 'products' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <form
                    onSubmit={handleCreateProduct}
                    className="lg:col-span-5 bg-[#FAF8F4] border border-[#D8D0C5] p-6 space-y-4 h-fit"
                  >
                    <h2 className="font-display text-2xl text-[#111111]">Add Catalog Garment</h2>
                    <input
                      required
                      placeholder="Garment Name"
                      value={newProd.name}
                      onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                      className="w-full bg-[#FFFFFF] border border-[#D8D0C5] px-3 py-2 text-xs"
                    />
                    <input
                      required
                      placeholder="Short Subtitle"
                      value={newProd.subtitle}
                      onChange={(e) => setNewProd({ ...newProd, subtitle: e.target.value })}
                      className="w-full bg-[#FFFFFF] border border-[#D8D0C5] px-3 py-2 text-xs"
                    />
                    <textarea
                      required
                      rows={3}
                      placeholder="Editorial Description (min 10 chars)"
                      value={newProd.description}
                      onChange={(e) => setNewProd({ ...newProd, description: e.target.value })}
                      className="w-full bg-[#FFFFFF] border border-[#D8D0C5] px-3 py-2 text-xs"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        required
                        type="number"
                        placeholder="Price USD"
                        value={newProd.priceDollars}
                        onChange={(e) => setNewProd({ ...newProd, priceDollars: e.target.value })}
                        className="bg-[#FFFFFF] border border-[#D8D0C5] px-3 py-2 text-xs"
                      />
                      <select
                        value={newProd.category}
                        onChange={(e) => setNewProd({ ...newProd, category: e.target.value as ProductCategory })}
                        className="bg-[#FFFFFF] border border-[#D8D0C5] px-3 py-2 text-xs"
                      >
                        <option value="Outerwear">Outerwear</option>
                        <option value="Tailoring">Tailoring</option>
                        <option value="Dresses">Dresses</option>
                        <option value="Knitwear">Knitwear</option>
                        <option value="Trousers">Trousers</option>
                      </select>
                      <select
                        value={newProd.gender}
                        onChange={(e) => setNewProd({ ...newProd, gender: e.target.value as ProductGender })}
                        className="bg-[#FFFFFF] border border-[#D8D0C5] px-3 py-2 text-xs"
                      >
                        <option value="Women">Women</option>
                        <option value="Men">Men</option>
                        <option value="Unisex">Unisex</option>
                      </select>
                      <select
                        value={newProd.imageUrl}
                        onChange={(e) => setNewProd({ ...newProd, imageUrl: e.target.value })}
                        className="bg-[#FFFFFF] border border-[#D8D0C5] px-3 py-2 text-xs"
                      >
                        {IMAGE_CHOICES.map((img) => (
                          <option key={img.url} value={img.url}>
                            {img.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        required
                        placeholder="Color Name"
                        value={newProd.colorName}
                        onChange={(e) => setNewProd({ ...newProd, colorName: e.target.value })}
                        className="bg-[#FFFFFF] border border-[#D8D0C5] px-3 py-2 text-xs"
                      />
                      <input
                        required
                        placeholder="Size (e.g. M)"
                        value={newProd.size}
                        onChange={(e) => setNewProd({ ...newProd, size: e.target.value })}
                        className="bg-[#FFFFFF] border border-[#D8D0C5] px-3 py-2 text-xs"
                      />
                      <input
                        required
                        type="number"
                        placeholder="Stock"
                        value={newProd.stock}
                        onChange={(e) => setNewProd({ ...newProd, stock: e.target.value })}
                        className="bg-[#FFFFFF] border border-[#D8D0C5] px-3 py-2 text-xs"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-[#111111] text-[#F5F1EA] py-3 text-xs uppercase tracking-wider"
                    >
                      Publish Garment
                    </button>
                  </form>

                  <div className="lg:col-span-7 bg-[#FAF8F4] border border-[#D8D0C5] p-6 space-y-4">
                    <h2 className="font-display text-2xl text-[#111111]">
                      Catalog Records ({data.products.length})
                    </h2>
                    <div className="divide-y divide-[#D8D0C5] text-xs">
                      {data.products.map((p) => (
                        <div key={p.id} className="py-3.5 flex items-center justify-between gap-4">
                          <div>
                            <p className="font-medium text-[#111111] text-sm">
                              {p.name}{' '}
                              {p.status === 'archived' && (
                                <span className="text-[#B53A35] text-xs">(Archived)</span>
                              )}
                            </p>
                            <p className="text-[#77716A] tabular-nums">
                              {p.category} · {formatMoney(p.priceCents, currency)} · {p.salesCount} sold
                            </p>
                          </div>
                          {p.status !== 'archived' && (
                            <button
                              type="button"
                              onClick={() => handleArchiveProduct(p.id, p.name)}
                              className="border border-[#D8D0C5] px-3 py-1.5 hover:border-[#B53A35] hover:text-[#B53A35]"
                            >
                              Archive
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* INVENTORY */}
              {tab === 'inventory' && (
                <div className="bg-[#FAF8F4] border border-[#D8D0C5] p-6 space-y-4 overflow-x-auto">
                  <h2 className="font-display text-2xl text-[#111111]">Variant Stock Matrix</h2>
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#D8D0C5] text-[#77716A]">
                        <th className="py-2.5">Garment</th>
                        <th className="py-2.5">SKU</th>
                        <th className="py-2.5">Color / Size</th>
                        <th className="py-2.5">Stock</th>
                        <th className="py-2.5">Adjust</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D8D0C5]">
                      {data.products
                        .filter((p) => p.status === 'active')
                        .flatMap((p) =>
                          p.variants.map((v) => (
                            <tr key={v.sku}>
                              <td className="py-3 font-medium text-[#111111]">{p.name}</td>
                              <td className="py-3 tabular-nums text-[#77716A]">{v.sku}</td>
                              <td className="py-3">
                                {v.colorName} · {v.size}
                              </td>
                              <td className="py-3 tabular-nums font-medium">{v.stock}</td>
                              <td className="py-3 flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleStockUpdate(p.id, v.sku, Math.max(0, v.stock - 1))}
                                  className="px-2 py-1 border border-[#D8D0C5] bg-[#FFFFFF]"
                                >
                                  -1
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStockUpdate(p.id, v.sku, v.stock + 5)}
                                  className="px-2 py-1 border border-[#D8D0C5] bg-[#FFFFFF]"
                                >
                                  +5
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ORDERS */}
              {tab === 'orders' && (
                <div className="bg-[#FAF8F4] border border-[#D8D0C5] p-6 space-y-4 overflow-x-auto">
                  <h2 className="font-display text-2xl text-[#111111]">
                    Customer Orders ({data.orders.length})
                  </h2>
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#D8D0C5] text-[#77716A]">
                        <th className="py-2.5">Reference</th>
                        <th className="py-2.5">Client</th>
                        <th className="py-2.5">Total</th>
                        <th className="py-2.5">Payment</th>
                        <th className="py-2.5">Fulfillment</th>
                        <th className="py-2.5">Transition</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D8D0C5]">
                      {data.orders.map((ord) => (
                        <tr key={ord.id}>
                          <td className="py-3 font-medium tabular-nums">{ord.orderNumber}</td>
                          <td className="py-3">
                            {ord.customerName}
                            <div className="text-[#77716A]">{ord.customerEmail}</div>
                          </td>
                          <td className="py-3 tabular-nums font-medium">
                            {formatMoney(ord.totalCents, currency)}
                          </td>
                          <td className="py-3 capitalize">{ord.paymentStatus}</td>
                          <td className="py-3 capitalize font-medium">{ord.fulfillmentStatus}</td>
                          <td className="py-3">
                            <select
                              aria-label={`Update status for ${ord.orderNumber}`}
                              value={ord.fulfillmentStatus}
                              onChange={(e) =>
                                handleOrderTransition(ord.id, e.target.value as FulfillmentStatus)
                              }
                              className="bg-[#FFFFFF] border border-[#D8D0C5] px-2 py-1 text-xs"
                            >
                              {STATUS_OPTIONS.map((s) => (
                                <option
                                  key={s}
                                  value={s}
                                  disabled={!canTransitionFulfillmentStatus(ord.fulfillmentStatus, s)}
                                >
                                  {s}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* CUSTOMERS */}
              {tab === 'customers' && (
                <div className="bg-[#FAF8F4] border border-[#D8D0C5] p-6 space-y-4">
                  <h2 className="font-display text-2xl text-[#111111]">Client Directory</h2>
                  <div className="divide-y divide-[#D8D0C5] text-xs">
                    {data.customers.map((c) => (
                      <div key={c.email} className="py-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-[#111111]">{c.name}</p>
                          <p className="text-[#77716A]">{c.email}</p>
                        </div>
                        <div className="text-right tabular-nums">
                          <p className="font-medium">{formatMoney(c.totalSpentCents, currency)}</p>
                          <p className="text-[#77716A]">{c.ordersCount} order(s)</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MARKETING */}
              {tab === 'marketing' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-[#FAF8F4] border border-[#D8D0C5] p-6 space-y-5">
                    <h2 className="font-display text-2xl text-[#111111]">Privilege Codes</h2>
                    <form onSubmit={handleCreateCoupon} className="grid grid-cols-2 gap-3 pb-5 border-b border-[#D8D0C5]">
                      <input
                        required
                        placeholder="Code (e.g. WINTER15)"
                        value={newCoupon.code}
                        onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
                        className="bg-[#FFFFFF] border border-[#D8D0C5] px-3 py-2 text-xs uppercase"
                      />
                      <input
                        required
                        placeholder="Description"
                        value={newCoupon.description}
                        onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
                        className="bg-[#FFFFFF] border border-[#D8D0C5] px-3 py-2 text-xs"
                      />
                      <input
                        required
                        type="number"
                        placeholder="Value (% or $)"
                        value={newCoupon.value}
                        onChange={(e) => setNewCoupon({ ...newCoupon, value: e.target.value })}
                        className="bg-[#FFFFFF] border border-[#D8D0C5] px-3 py-2 text-xs"
                      />
                      <button type="submit" className="bg-[#111111] text-[#F5F1EA] px-4 py-2 text-xs">
                        Create Privilege
                      </button>
                    </form>

                    <div className="divide-y divide-[#D8D0C5] text-xs">
                      {data.coupons.map((cpn) => (
                        <div key={cpn.id} className="py-3 flex items-center justify-between">
                          <div>
                            <p className="font-medium text-[#111111]">{cpn.code}</p>
                            <p className="text-[#77716A]">
                              {cpn.description} · Used {cpn.usedCount}/{cpn.maxUses}
                            </p>
                          </div>
                          <span className={cpn.active ? 'text-[#287A4B]' : 'text-[#85817A]'}>
                            {cpn.active ? 'Active' : 'Paused'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#FAF8F4] border border-[#D8D0C5] p-6 space-y-4">
                    <h2 className="font-display text-2xl text-[#111111]">
                      Newsletter Subscribers ({data.subscribers.length})
                    </h2>
                    <div className="divide-y divide-[#D8D0C5] text-xs">
                      {data.subscribers.map((sub) => (
                        <div key={sub.id} className="py-2.5 flex justify-between">
                          <span>{sub.email}</span>
                          <span className="text-[#77716A] capitalize">{sub.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SETTINGS */}
              {tab === 'settings' && (
                <form
                  onSubmit={handleSaveSettings}
                  className="bg-[#FAF8F4] border border-[#D8D0C5] p-6 max-w-xl space-y-4"
                >
                  <h2 className="font-display text-2xl text-[#111111]">Storefront Settings</h2>
                  <div>
                    <label htmlFor="set-announcement" className="block text-xs text-[#77716A] mb-1">
                      Top Announcement Banner
                    </label>
                    <input
                      id="set-announcement"
                      name="announcementText"
                      defaultValue={data.settings.announcementText}
                      className="w-full bg-[#FFFFFF] border border-[#D8D0C5] px-3 py-2.5 text-xs"
                    />
                  </div>
                  <div>
                    <label htmlFor="set-threshold" className="block text-xs text-[#77716A] mb-1">
                      Complimentary Shipping Threshold (USD)
                    </label>
                    <input
                      id="set-threshold"
                      name="freeThresholdDollars"
                      type="number"
                      defaultValue={Math.round(data.settings.freeShippingThresholdCents / 100)}
                      className="w-full bg-[#FFFFFF] border border-[#D8D0C5] px-3 py-2.5 text-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-[#111111] text-[#F5F1EA] px-6 py-3 text-xs uppercase tracking-wider"
                  >
                    Save Storefront Settings
                  </button>
                </form>
              )}
            </>
          )
        )}
      </div>
    </div>
  );
}
