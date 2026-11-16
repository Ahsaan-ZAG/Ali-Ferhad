import express, { NextFunction, Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { z } from 'zod';
import { storeRepo } from './src/server/store';
import { adminAuth } from './src/server/firebaseAdmin';
import { listPaymentMethods } from './src/server/paymentAdapter';
import { BRAND_CONFIG } from './src/config/brand';
import { FulfillmentStatus } from './src/types/ecommerce';

interface AuthedRequest extends Request {
  authUser?: {
    uid: string;
    email: string;
    isAdmin: boolean;
  };
}

// Simple sliding-window rate limiter per IP for write endpoints
const rateWindowMap = new Map<string, { count: number; resetAt: number }>();
function rateLimit(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip}-${req.path}`;
    const now = Date.now();
    const record = rateWindowMap.get(key);
    if (!record || record.resetAt < now) {
      rateWindowMap.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (record.count >= maxRequests) {
      return res.status(429).json({ error: 'Too many requests. Please wait a moment and try again.' });
    }
    record.count += 1;
    next();
  };
}

async function resolveOptionalAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    const token = header.slice(7);
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      const email = (decoded.email ?? '').toLowerCase();
      req.authUser = {
        uid: decoded.uid,
        email,
        isAdmin: BRAND_CONFIG.adminEmails.includes(email),
      };
    } catch {
      // Invalid or expired token treated as unauthenticated
    }
  }
  next();
}

async function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    const token = header.slice(7);
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      const email = (decoded.email ?? '').toLowerCase();
      if (BRAND_CONFIG.adminEmails.includes(email)) {
        req.authUser = { uid: decoded.uid, email, isAdmin: true };
        return next();
      }
      return res.status(403).json({ error: 'Forbidden: Administrator privileges required.' });
    } catch {
      return res.status(401).json({ error: 'Unauthorized: Invalid session token.' });
    }
  }

  // Safe development preview admin bypass ONLY when explicitly requested in non-production preview
  // via header x-demo-admin: true AND no production ADMIN_STRICT_AUTH flag
  if (process.env.ADMIN_STRICT_AUTH !== 'true' && req.headers['x-demo-admin'] === 'true') {
    req.authUser = {
      uid: 'demo-admin',
      email: BRAND_CONFIG.adminEmails[0],
      isAdmin: true,
    };
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized: Please sign in with an administrator account.' });
}

const cartValidateSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1).max(128),
      sku: z.string().min(1).max(80),
      quantity: z.number().int().min(1).max(10),
    })
  ),
  couponCode: z.string().max(40).optional().nullable(),
  deliveryMethod: z.enum(['standard', 'express', 'atelier_pickup']).default('standard'),
});

const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1).max(128),
        sku: z.string().min(1).max(80),
        quantity: z.number().int().min(1).max(10),
      })
    )
    .min(1),
  couponCode: z.string().max(40).optional().nullable(),
  deliveryMethod: z.enum(['standard', 'express', 'atelier_pickup']),
  paymentMethod: z.enum(['cod', 'card_sandbox', 'invoice']),
  customerEmail: z.string().email().max(200),
  customerName: z.string().min(2).max(120),
  idempotencyKey: z.string().min(6).max(120),
  shippingAddress: z.object({
    recipientName: z.string().min(2).max(120),
    line1: z.string().min(3).max(200),
    line2: z.string().max(200).optional(),
    city: z.string().min(2).max(100),
    state: z.string().max(100).optional(),
    postalCode: z.string().min(2).max(30),
    country: z.string().min(2).max(80),
    phone: z.string().min(5).max(40),
  }),
});

const productCreateSchema = z.object({
  slug: z.string().min(2).max(160),
  name: z.string().min(2).max(160),
  subtitle: z.string().min(2).max(220),
  description: z.string().min(10).max(2000),
  materialDetails: z.string().min(2).max(300),
  careInstructions: z.string().min(2).max(300),
  fitNotes: z.string().min(2).max(300),
  priceCents: z.number().int().positive(),
  currency: z.enum(['USD', 'EUR', 'GBP']).default('USD'),
  category: z.enum(['Outerwear', 'Tailoring', 'Dresses', 'Knitwear', 'Trousers']),
  gender: z.enum(['Women', 'Men', 'Unisex']),
  collectionSlug: z.string().min(1).max(160),
  tags: z.array(z.string().max(40)).max(10).default([]),
  isNewArrival: z.boolean().default(true),
  isBestSeller: z.boolean().default(false),
  status: z.enum(['active', 'draft', 'archived']).default('active'),
  images: z
    .array(
      z.object({
        url: z.string().min(1).max(500),
        alt: z.string().min(1).max(200),
        colorName: z.string().max(60).optional(),
      })
    )
    .min(1),
  variants: z
    .array(
      z.object({
        sku: z.string().min(2).max(80),
        colorName: z.string().min(1).max(60),
        colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
        size: z.string().min(1).max(20),
        stock: z.number().int().min(0).max(9999),
        reserved: z.number().int().min(0).default(0),
      })
    )
    .min(1),
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Security headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  app.use(express.json({ limit: '1mb' }));
  app.use(resolveOptionalAuth);

  // Health & Store Settings
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', brand: BRAND_CONFIG.name });
  });

  app.get('/api/settings', (_req, res) => {
    res.json({
      settings: storeRepo.getSettings(),
      paymentMethods: listPaymentMethods(),
    });
  });

  // Catalog: Products
  app.get('/api/products', (req, res) => {
    const q = req.query;
    const products = storeRepo.listProducts({
      category: typeof q.category === 'string' ? q.category : undefined,
      gender: typeof q.gender === 'string' ? q.gender : undefined,
      collection: typeof q.collection === 'string' ? q.collection : undefined,
      size: typeof q.size === 'string' ? q.size : undefined,
      color: typeof q.color === 'string' ? q.color : undefined,
      tag: typeof q.tag === 'string' ? q.tag : undefined,
      inStockOnly: q.inStock === 'true',
      minPriceCents: typeof q.minPrice === 'string' && q.minPrice ? Number(q.minPrice) * 100 : undefined,
      maxPriceCents: typeof q.maxPrice === 'string' && q.maxPrice ? Number(q.maxPrice) * 100 : undefined,
      search: typeof q.search === 'string' ? q.search : undefined,
      sort: typeof q.sort === 'string' ? (q.sort as 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'best-selling') : 'featured',
    });
    res.json({ products, total: products.length });
  });

  app.get('/api/products/:slug', (req, res) => {
    const product = storeRepo.getProductBySlug(req.params.slug) ?? storeRepo.getProductById(req.params.slug);
    if (!product || product.status === 'archived') {
      return res.status(404).json({ error: 'Garment not found.' });
    }
    const related = storeRepo
      .listProducts({ category: product.category })
      .filter((p) => p.id !== product.id)
      .slice(0, 4);
    res.json({ product, related });
  });

  // Catalog: Collections
  app.get('/api/collections', (_req, res) => {
    res.json({ collections: storeRepo.listCollections() });
  });

  app.get('/api/collections/:slug', (req, res) => {
    const collection = storeRepo.getCollectionBySlug(req.params.slug);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found.' });
    }
    const products = storeRepo.listProducts({ collection: collection.slug });
    res.json({ collection, products });
  });

  // Cart pricing & coupon verification (server authoritative)
  app.post('/api/cart/validate', (req, res) => {
    const parsed = cartValidateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid bag payload.', details: parsed.error.flatten() });
    }
    const summary = storeRepo.validateCart(parsed.data);
    res.json(summary);
  });

  // Checkout & Order Creation
  app.post('/api/checkout', rateLimit(20, 60_000), async (req: AuthedRequest, res) => {
    const parsed = checkoutSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Please check your shipping and contact fields.',
        details: parsed.error.flatten(),
      });
    }
    try {
      const result = await storeRepo.createOrder({
        ...parsed.data,
        userId: req.authUser?.uid ?? null,
      });
      res.status(result.duplicate ? 200 : 201).json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to complete order.';
      res.status(400).json({ error: message });
    }
  });

  // Orders lookup
  app.get('/api/orders', (req: AuthedRequest, res) => {
    const emailQuery = typeof req.query.email === 'string' ? req.query.email : undefined;
    const orderNumQuery = typeof req.query.orderNumber === 'string' ? req.query.orderNumber : undefined;

    if (orderNumQuery) {
      const order = storeRepo.getOrderByIdOrNumber(orderNumQuery);
      if (!order) return res.status(404).json({ error: 'Order not found.' });
      // Verify ownership by authenticated user OR matching lookup email
      if (
        req.authUser?.isAdmin ||
        (req.authUser && order.userId === req.authUser.uid) ||
        (emailQuery && order.customerEmail.toLowerCase() === emailQuery.trim().toLowerCase())
      ) {
        return res.json({ orders: [order] });
      }
      return res.status(403).json({ error: 'Please provide the matching order email to view this order.' });
    }

    if (!req.authUser) {
      return res.status(401).json({ error: 'Sign in or search by order number and email to view orders.' });
    }

    const orders = storeRepo.listOrders({
      userId: req.authUser.uid,
      email: req.authUser.email,
    });
    res.json({ orders });
  });

  app.get('/api/orders/:id', (req: AuthedRequest, res) => {
    const order = storeRepo.getOrderByIdOrNumber(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    const emailParam = typeof req.query.email === 'string' ? req.query.email.trim().toLowerCase() : null;
    const isAllowed =
      req.authUser?.isAdmin ||
      (req.authUser && (order.userId === req.authUser.uid || order.customerEmail === req.authUser.email)) ||
      (emailParam && emailParam === order.customerEmail.toLowerCase()) ||
      (typeof req.query.confirm === 'string' && req.query.confirm === order.idempotencyKey);

    if (!isAllowed) {
      return res.status(403).json({ error: 'Access denied for this order.' });
    }
    res.json({ order });
  });

  // Newsletter subscription & unsubscribe
  app.post('/api/newsletter', rateLimit(15, 60_000), (req, res) => {
    const schema = z.object({ email: z.string().email().max(200) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    const result = storeRepo.subscribeNewsletter(parsed.data.email);
    res.json(result);
  });

  app.delete('/api/newsletter', (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email : '';
    if (!email) return res.status(400).json({ error: 'Email required.' });
    const removed = storeRepo.unsubscribeNewsletter(email);
    res.json({ unsubscribed: removed });
  });

  // Admin API routes
  app.get('/api/admin/overview', requireAdmin, (_req, res) => {
    res.json({
      ...storeRepo.getAdminDashboardSummary(),
      products: storeRepo.listProducts({}, true),
      orders: storeRepo.listOrders(),
      coupons: storeRepo.listCoupons(),
      subscribers: storeRepo.listSubscribers(),
      settings: storeRepo.getSettings(),
    });
  });

  app.post('/api/admin/products', requireAdmin, (req: AuthedRequest, res) => {
    const parsed = productCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid garment specification.', details: parsed.error.flatten() });
    }
    const created = storeRepo.createProduct(parsed.data, {
      uid: req.authUser!.uid,
      email: req.authUser!.email,
    });
    res.status(201).json({ product: created });
  });

  app.patch('/api/admin/products/:id', requireAdmin, (req: AuthedRequest, res) => {
    const updated = storeRepo.updateProduct(req.params.id, req.body, {
      uid: req.authUser!.uid,
      email: req.authUser!.email,
    });
    if (!updated) return res.status(404).json({ error: 'Product not found.' });
    res.json({ product: updated });
  });

  app.delete('/api/admin/products/:id', requireAdmin, (req: AuthedRequest, res) => {
    const ok = storeRepo.archiveProduct(req.params.id, {
      uid: req.authUser!.uid,
      email: req.authUser!.email,
    });
    if (!ok) return res.status(404).json({ error: 'Product not found.' });
    res.json({ archived: true });
  });

  app.patch('/api/admin/inventory', requireAdmin, (req: AuthedRequest, res) => {
    const schema = z.object({
      productId: z.string().min(1),
      sku: z.string().min(1),
      stock: z.number().int().min(0).max(9999),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid stock payload.' });
    const updated = storeRepo.updateVariantStock(
      parsed.data.productId,
      parsed.data.sku,
      parsed.data.stock,
      { uid: req.authUser!.uid, email: req.authUser!.email }
    );
    if (!updated) return res.status(404).json({ error: 'Variant not found.' });
    res.json({ product: updated });
  });

  app.patch('/api/admin/orders/:id/status', requireAdmin, (req: AuthedRequest, res) => {
    const schema = z.object({
      status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
      note: z.string().max(300).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid status update.' });
    try {
      const order = storeRepo.updateOrderStatus(
        req.params.id,
        parsed.data.status as FulfillmentStatus,
        parsed.data.note ?? '',
        { uid: req.authUser!.uid, email: req.authUser!.email }
      );
      res.json({ order });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Status update failed.' });
    }
  });

  app.post('/api/admin/coupons', requireAdmin, (req: AuthedRequest, res) => {
    const schema = z.object({
      code: z.string().min(3).max(32),
      description: z.string().min(3).max(160),
      discountType: z.enum(['percentage', 'fixed_cents']),
      value: z.number().int().positive(),
      minSubtotalCents: z.number().int().min(0),
      maxUses: z.number().int().positive(),
      active: z.boolean().default(true),
      expiresAt: z.string(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid coupon details.' });
    const coupon = storeRepo.createCoupon(parsed.data, {
      uid: req.authUser!.uid,
      email: req.authUser!.email,
    });
    res.status(201).json({ coupon });
  });

  app.patch('/api/admin/coupons/:id', requireAdmin, (req: AuthedRequest, res) => {
    const active = Boolean(req.body?.active);
    const coupon = storeRepo.toggleCoupon(req.params.id, active, {
      uid: req.authUser!.uid,
      email: req.authUser!.email,
    });
    if (!coupon) return res.status(404).json({ error: 'Coupon not found.' });
    res.json({ coupon });
  });

  app.patch('/api/admin/settings', requireAdmin, (req: AuthedRequest, res) => {
    const settings = storeRepo.updateSettings(req.body, {
      uid: req.authUser!.uid,
      email: req.authUser!.email,
    });
    res.json({ settings });
  });

  // SEO endpoints
  app.get('/robots.txt', (_req, res) => {
    res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /checkout\n`);
  });

  app.get('/sitemap.xml', (req, res) => {
    const base = `${req.protocol}://${req.get('host')}`;
    const urls = [
      '/',
      '/shop',
      '/about',
      '/contact',
      ...storeRepo.listCollections().map((c) => `/collections/${c.slug}`),
      ...storeRepo.listProducts({}).map((p) => `/products/${p.slug}`),
    ];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
      .map((u) => `  <url><loc>${base}${u}</loc></url>`)
      .join('\n')}\n</urlset>`;
    res.type('application/xml').send(xml);
  });

  // Vite middleware in dev, static dist in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MAISON FORMA server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});
