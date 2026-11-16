import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  AuditLogEntry,
  CartItemInput,
  Collection,
  Coupon,
  DeliveryMethod,
  FulfillmentStatus,
  Order,
  PaymentMethod,
  Product,
  ShippingAddress,
  SiteSettings,
} from '../types/ecommerce';
import {
  calculateCartPricing,
  canTransitionFulfillmentStatus,
  filterAndSortProducts,
  ProductQueryParams,
} from '../lib/commerce';
import { createInitialSeedState, StoreState } from './seed';
import { getPaymentAdapter } from './paymentAdapter';

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

class StoreRepository {
  private state: StoreState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): StoreState {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw) as StoreState;
        if (parsed && Array.isArray(parsed.products) && Array.isArray(parsed.collections)) {
          const freshSeed = createInitialSeedState();
          const seedById = new Map(freshSeed.products.map((p) => [p.id, p]));
          let mutated = false;

          if (parsed.settings?.brandName === 'MAISON FORMA') {
            const seedCollectionImages = new Map(
              freshSeed.collections.map((c) => [c.id, c.heroImage])
            );
            parsed.settings = {
              ...parsed.settings,
              brandName: freshSeed.settings.brandName,
              announcementText: freshSeed.settings.announcementText,
              supportEmail: freshSeed.settings.supportEmail,
            };
            parsed.products = parsed.products.map((p) => {
              const seedP = seedById.get(p.id);
              return seedP
                ? {
                    ...p,
                    images: seedP.images,
                    compareAtPriceCents: p.compareAtPriceCents ?? seedP.compareAtPriceCents,
                    editionLabel: p.editionLabel ?? seedP.editionLabel,
                  }
                : p;
            });
            parsed.collections = parsed.collections.map((c) => ({
              ...c,
              heroImage: seedCollectionImages.get(c.id) ?? c.heroImage,
            }));
            mutated = true;
          } else {
            parsed.products = parsed.products.map((p) => {
              const seedP = seedById.get(p.id);
              if (!seedP) return p;
              const needsPatch =
                (seedP.compareAtPriceCents && !p.compareAtPriceCents) ||
                (seedP.editionLabel && !p.editionLabel);
              if (!needsPatch) return p;
              mutated = true;
              return {
                ...p,
                compareAtPriceCents: p.compareAtPriceCents ?? seedP.compareAtPriceCents,
                editionLabel: p.editionLabel ?? seedP.editionLabel,
              };
            });
          }

          if (mutated) {
            this.persist(parsed);
          }
          return parsed;
        }
      }
    } catch (err) {
      console.error('Failed to read store file, reinitializing seed state:', err);
    }
    const seed = createInitialSeedState();
    this.persist(seed);
    return seed;
  }

  private persist(nextState: StoreState = this.state): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(nextState, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist store state:', err);
    }
  }

  private appendAudit(entry: Omit<AuditLogEntry, 'id' | 'createdAt'>) {
    this.state.auditLogs.unshift({
      id: `aud-${crypto.randomUUID().slice(0, 8)}`,
      createdAt: new Date().toISOString(),
      ...entry,
    });
    if (this.state.auditLogs.length > 250) {
      this.state.auditLogs = this.state.auditLogs.slice(0, 250);
    }
  }

  getSettings(): SiteSettings {
    return this.state.settings;
  }

  updateSettings(patch: Partial<SiteSettings>, actor: { uid: string; email: string }): SiteSettings {
    this.state.settings = { ...this.state.settings, ...patch };
    this.appendAudit({
      actorUid: actor.uid,
      actorEmail: actor.email,
      action: 'UPDATE_SETTINGS',
      resourceType: 'settings',
      resourceId: 'global',
      details: 'Updated storefront settings.',
    });
    this.persist();
    return this.state.settings;
  }

  listProducts(query: ProductQueryParams, includeArchived = false): Product[] {
    if (includeArchived) {
      return [...this.state.products].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    return filterAndSortProducts(this.state.products, query);
  }

  getProductBySlug(slug: string): Product | undefined {
    return this.state.products.find((p) => p.slug === slug && p.status !== 'archived');
  }

  getProductById(id: string): Product | undefined {
    return this.state.products.find((p) => p.id === id);
  }

  createProduct(
    input: Omit<Product, 'id' | 'salesCount' | 'createdAt' | 'updatedAt'>,
    actor: { uid: string; email: string }
  ): Product {
    const now = new Date().toISOString();
    const product: Product = {
      ...input,
      id: `prod-${crypto.randomUUID().slice(0, 8)}`,
      salesCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    this.state.products.unshift(product);
    this.appendAudit({
      actorUid: actor.uid,
      actorEmail: actor.email,
      action: 'CREATE_PRODUCT',
      resourceType: 'product',
      resourceId: product.id,
      details: `Created garment "${product.name}".`,
    });
    this.persist();
    return product;
  }

  updateProduct(
    id: string,
    patch: Partial<Product>,
    actor: { uid: string; email: string }
  ): Product | null {
    const idx = this.state.products.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const updated: Product = {
      ...this.state.products[idx],
      ...patch,
      id,
      updatedAt: new Date().toISOString(),
    };
    this.state.products[idx] = updated;
    this.appendAudit({
      actorUid: actor.uid,
      actorEmail: actor.email,
      action: 'UPDATE_PRODUCT',
      resourceType: 'product',
      resourceId: id,
      details: `Updated garment "${updated.name}".`,
    });
    this.persist();
    return updated;
  }

  updateVariantStock(
    productId: string,
    sku: string,
    stock: number,
    actor: { uid: string; email: string }
  ): Product | null {
    const product = this.state.products.find((p) => p.id === productId);
    if (!product) return null;
    const variant = product.variants.find((v) => v.sku === sku);
    if (!variant) return null;
    variant.stock = Math.max(0, Math.floor(stock));
    product.updatedAt = new Date().toISOString();
    this.appendAudit({
      actorUid: actor.uid,
      actorEmail: actor.email,
      action: 'UPDATE_INVENTORY',
      resourceType: 'variant',
      resourceId: sku,
      details: `Adjusted stock for ${sku} to ${variant.stock}.`,
    });
    this.persist();
    return product;
  }

  archiveProduct(id: string, actor: { uid: string; email: string }): boolean {
    const product = this.state.products.find((p) => p.id === id);
    if (!product) return false;
    product.status = 'archived';
    product.updatedAt = new Date().toISOString();
    this.appendAudit({
      actorUid: actor.uid,
      actorEmail: actor.email,
      action: 'ARCHIVE_PRODUCT',
      resourceType: 'product',
      resourceId: id,
      details: `Archived garment "${product.name}".`,
    });
    this.persist();
    return true;
  }

  listCollections(): Collection[] {
    return [...this.state.collections].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  getCollectionBySlug(slug: string): Collection | undefined {
    return this.state.collections.find((c) => c.slug === slug);
  }

  findCoupon(code?: string | null): Coupon | undefined {
    if (!code) return undefined;
    const normalized = code.trim().toUpperCase();
    return this.state.coupons.find((c) => c.code.toUpperCase() === normalized);
  }

  listCoupons(): Coupon[] {
    return [...this.state.coupons];
  }

  createCoupon(input: Omit<Coupon, 'id' | 'usedCount'>, actor: { uid: string; email: string }): Coupon {
    const coupon: Coupon = {
      ...input,
      id: `cpn-${crypto.randomUUID().slice(0, 8)}`,
      code: input.code.trim().toUpperCase(),
      usedCount: 0,
    };
    this.state.coupons.unshift(coupon);
    this.appendAudit({
      actorUid: actor.uid,
      actorEmail: actor.email,
      action: 'CREATE_COUPON',
      resourceType: 'coupon',
      resourceId: coupon.id,
      details: `Created privilege code ${coupon.code}.`,
    });
    this.persist();
    return coupon;
  }

  toggleCoupon(id: string, active: boolean, actor: { uid: string; email: string }): Coupon | null {
    const coupon = this.state.coupons.find((c) => c.id === id);
    if (!coupon) return null;
    coupon.active = active;
    this.appendAudit({
      actorUid: actor.uid,
      actorEmail: actor.email,
      action: 'TOGGLE_COUPON',
      resourceType: 'coupon',
      resourceId: id,
      details: `Set privilege code ${coupon.code} active=${active}.`,
    });
    this.persist();
    return coupon;
  }

  validateCart(params: {
    items: CartItemInput[];
    couponCode?: string | null;
    deliveryMethod: DeliveryMethod;
  }) {
    const coupon = this.findCoupon(params.couponCode);
    return calculateCartPricing({
      items: params.items,
      products: this.state.products,
      coupon,
      couponCodeAttempted: params.couponCode,
      deliveryMethod: params.deliveryMethod,
      settings: this.state.settings,
    });
  }

  async createOrder(params: {
    items: CartItemInput[];
    couponCode?: string | null;
    deliveryMethod: DeliveryMethod;
    paymentMethod: PaymentMethod;
    customerEmail: string;
    customerName: string;
    shippingAddress: ShippingAddress;
    userId: string | null;
    idempotencyKey: string;
  }): Promise<{ order: Order; duplicate: boolean }> {
    // Prevent duplicate order creation using idempotency key
    const existing = this.state.orders.find(
      (o) => o.idempotencyKey === params.idempotencyKey
    );
    if (existing) {
      return { order: existing, duplicate: true };
    }

    const coupon = this.findCoupon(params.couponCode);
    const pricing = calculateCartPricing({
      items: params.items,
      products: this.state.products,
      coupon,
      couponCodeAttempted: params.couponCode,
      deliveryMethod: params.deliveryMethod,
      settings: this.state.settings,
    });

    if (pricing.lines.length === 0) {
      throw new Error('No purchasable items in shopping bag.');
    }

    if (pricing.errors.length > 0) {
      throw new Error(pricing.errors[0]);
    }

    const now = new Date().toISOString();
    const nextNum = 1043 + this.state.orders.length;
    const orderNumber = `MF-2026-${nextNum}`;

    const adapter = getPaymentAdapter(params.paymentMethod);
    const paymentResult = await adapter.authorizeOrCapture({
      orderNumber,
      amountCents: pricing.totalCents,
      currency: 'USD',
      customerEmail: params.customerEmail,
    });

    // Atomically decrement variant stock & increment salesCount
    for (const line of pricing.lines) {
      const product = this.state.products.find((p) => p.id === line.productId);
      const variant = product?.variants.find((v) => v.sku === line.sku);
      if (!product || !variant || variant.stock - variant.reserved < line.quantity) {
        throw new Error(`Insufficient inventory for ${line.name} (${line.size}).`);
      }
      variant.stock -= line.quantity;
      product.salesCount += line.quantity;
      product.updatedAt = now;
    }

    if (pricing.appliedCouponCode && coupon) {
      coupon.usedCount += 1;
    }

    const order: Order = {
      id: `ord-${crypto.randomUUID().slice(0, 8)}`,
      orderNumber,
      userId: params.userId,
      customerEmail: params.customerEmail.trim().toLowerCase(),
      customerName: params.customerName.trim(),
      shippingAddress: params.shippingAddress,
      deliveryMethod: params.deliveryMethod,
      paymentMethod: params.paymentMethod,
      paymentStatus: paymentResult.paymentStatus,
      fulfillmentStatus: 'confirmed',
      items: pricing.lines,
      subtotalCents: pricing.subtotalCents,
      discountCents: pricing.discountCents,
      shippingCents: pricing.shippingCents,
      totalCents: pricing.totalCents,
      currency: 'USD',
      couponCode: pricing.appliedCouponCode,
      idempotencyKey: params.idempotencyKey,
      timeline: [
        {
          status: 'confirmed',
          note: `Order placed. ${paymentResult.note}`,
          timestamp: now,
          actor: params.customerEmail,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    this.state.orders.unshift(order);
    this.appendAudit({
      actorUid: params.userId ?? 'guest',
      actorEmail: params.customerEmail,
      action: 'CREATE_ORDER',
      resourceType: 'order',
      resourceId: order.id,
      details: `Order ${order.orderNumber} created (${pricing.lines.length} items, ${order.totalCents} cents).`,
    });
    this.persist();
    return { order, duplicate: false };
  }

  listOrders(filter?: { userId?: string; email?: string }): Order[] {
    let orders = [...this.state.orders];
    if (filter?.userId || filter?.email) {
      orders = orders.filter(
        (o) =>
          (filter.userId && o.userId === filter.userId) ||
          (filter.email && o.customerEmail.toLowerCase() === filter.email.toLowerCase())
      );
    }
    return orders.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getOrderByIdOrNumber(idOrNumber: string): Order | undefined {
    return this.state.orders.find(
      (o) => o.id === idOrNumber || o.orderNumber.toUpperCase() === idOrNumber.toUpperCase()
    );
  }

  updateOrderStatus(
    id: string,
    nextStatus: FulfillmentStatus,
    note: string,
    actor: { uid: string; email: string }
  ): Order {
    const order = this.state.orders.find((o) => o.id === id);
    if (!order) {
      throw new Error('Order not found.');
    }
    if (!canTransitionFulfillmentStatus(order.fulfillmentStatus, nextStatus)) {
      throw new Error(
        `Invalid transition from ${order.fulfillmentStatus} to ${nextStatus}.`
      );
    }

    const now = new Date().toISOString();
    order.fulfillmentStatus = nextStatus;
    if (nextStatus === 'refunded') {
      order.paymentStatus = 'refunded';
    } else if (nextStatus === 'delivered' && order.paymentMethod === 'cod') {
      order.paymentStatus = 'paid';
    }

    // Restock if cancelled or refunded from non-cancelled state
    if (nextStatus === 'cancelled' || nextStatus === 'refunded') {
      for (const item of order.items) {
        const prod = this.state.products.find((p) => p.id === item.productId);
        const variant = prod?.variants.find((v) => v.sku === item.sku);
        if (variant) {
          variant.stock += item.quantity;
        }
      }
    }

    order.timeline.push({
      status: nextStatus,
      note: note.trim() || `Status updated to ${nextStatus}.`,
      timestamp: now,
      actor: actor.email,
    });
    order.updatedAt = now;

    this.appendAudit({
      actorUid: actor.uid,
      actorEmail: actor.email,
      action: 'UPDATE_ORDER_STATUS',
      resourceType: 'order',
      resourceId: order.id,
      details: `Transitioned ${order.orderNumber} to ${nextStatus}.`,
    });
    this.persist();
    return order;
  }

  subscribeNewsletter(email: string): { status: 'created' | 'already_subscribed' | 'resubscribed'; subscriberId: string } {
    const normalized = email.trim().toLowerCase();
    const now = new Date().toISOString();
    const existing = this.state.subscribers.find(
      (s) => s.email.toLowerCase() === normalized
    );
    if (existing) {
      if (existing.status === 'subscribed') {
        return { status: 'already_subscribed', subscriberId: existing.id };
      }
      existing.status = 'subscribed';
      existing.updatedAt = now;
      this.persist();
      return { status: 'resubscribed', subscriberId: existing.id };
    }
    const sub = {
      id: `sub-${crypto.randomUUID().slice(0, 8)}`,
      email: normalized,
      status: 'subscribed' as const,
      subscribedAt: now,
      updatedAt: now,
    };
    this.state.subscribers.unshift(sub);
    this.persist();
    return { status: 'created', subscriberId: sub.id };
  }

  unsubscribeNewsletter(email: string): boolean {
    const normalized = email.trim().toLowerCase();
    const existing = this.state.subscribers.find(
      (s) => s.email.toLowerCase() === normalized
    );
    if (!existing) return false;
    existing.status = 'unsubscribed';
    existing.updatedAt = new Date().toISOString();
    this.persist();
    return true;
  }

  listSubscribers() {
    return [...this.state.subscribers];
  }

  getAdminDashboardSummary() {
    const activeProducts = this.state.products.filter((p) => p.status === 'active');
    const lowStockVariants = activeProducts.flatMap((p) =>
      p.variants
        .filter((v) => v.stock - v.reserved <= 3)
        .map((v) => ({
          productId: p.id,
          productName: p.name,
          sku: v.sku,
          colorName: v.colorName,
          size: v.size,
          stock: v.stock - v.reserved,
        }))
    );

    const paidOrActiveOrders = this.state.orders.filter(
      (o) => o.fulfillmentStatus !== 'cancelled' && o.fulfillmentStatus !== 'refunded'
    );
    const totalRevenueCents = paidOrActiveOrders.reduce((s, o) => s + o.totalCents, 0);
    const pendingOrdersCount = this.state.orders.filter(
      (o) => o.fulfillmentStatus === 'pending' || o.fulfillmentStatus === 'confirmed' || o.fulfillmentStatus === 'processing'
    ).length;

    // Derive customer directory from orders
    const customerMap = new Map<string, { email: string; name: string; ordersCount: number; totalSpentCents: number; lastOrderAt: string }>();
    for (const order of this.state.orders) {
      const prev = customerMap.get(order.customerEmail);
      if (prev) {
        prev.ordersCount += 1;
        prev.totalSpentCents += order.totalCents;
        if (order.createdAt > prev.lastOrderAt) prev.lastOrderAt = order.createdAt;
      } else {
        customerMap.set(order.customerEmail, {
          email: order.customerEmail,
          name: order.customerName,
          ordersCount: 1,
          totalSpentCents: order.totalCents,
          lastOrderAt: order.createdAt,
        });
      }
    }

    return {
      metrics: {
        totalOrders: this.state.orders.length,
        pendingOrders: pendingOrdersCount,
        totalRevenueCents,
        totalProducts: activeProducts.length,
        lowStockCount: lowStockVariants.length,
        subscribersCount: this.state.subscribers.filter((s) => s.status === 'subscribed').length,
      },
      lowStockVariants,
      recentOrders: this.state.orders.slice(0, 8),
      customers: Array.from(customerMap.values()),
      auditLogs: this.state.auditLogs.slice(0, 30),
    };
  }
}

export const storeRepo = new StoreRepository();
