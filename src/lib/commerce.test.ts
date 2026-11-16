import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCartPricing,
  canTransitionFulfillmentStatus,
  evaluateCoupon,
  filterAndSortProducts,
} from './commerce';
import { Coupon, Product, SiteSettings } from '../types/ecommerce';

const mockSettings: SiteSettings = {
  brandName: 'ALI & FERHAD',
  announcementText: 'Autumn Architecture Collection now available.',
  announcementLink: '/shop',
  freeShippingThresholdCents: 100000,
  standardShippingCents: 2500,
  expressShippingCents: 6500,
  supportEmail: 'concierge@aliandferhad.example',
};

const mockProducts: Product[] = [
  {
    id: 'prod-coat-1',
    slug: 'double-faced-ivory-coat',
    name: 'Double-Faced Cashmere Coat',
    subtitle: 'Architectural unlined overcoat',
    description: 'Hand-finished double-faced cashmere coat.',
    materialDetails: '100% Mongolian cashmere',
    careInstructions: 'Specialist dry clean only',
    fitNotes: 'Relaxed architectural cut',
    priceCents: 185000,
    currency: 'USD',
    category: 'Outerwear',
    gender: 'Women',
    collectionSlug: 'autumn-architecture',
    tags: ['cashmere', 'outerwear'],
    isNewArrival: true,
    isBestSeller: true,
    salesCount: 42,
    status: 'active',
    images: [{ url: '/test.jpg', alt: 'Ivory coat', colorName: 'Warm Ivory' }],
    variants: [
      { sku: 'COAT-IVR-S', colorName: 'Warm Ivory', colorHex: '#F3EFE7', size: 'S', stock: 5, reserved: 0 },
      { sku: 'COAT-IVR-M', colorName: 'Warm Ivory', colorHex: '#F3EFE7', size: 'M', stock: 2, reserved: 1 },
    ],
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'prod-knit-2',
    slug: 'ribbed-merino-turtleneck',
    name: 'Heavy-Gauge Merino Knit',
    subtitle: 'Sculpted fisherman rib',
    description: 'Dense extra-fine merino wool turtleneck.',
    materialDetails: '100% Extra-fine merino wool',
    careInstructions: 'Hand wash cold, dry flat',
    fitNotes: 'True to size',
    priceCents: 58000,
    currency: 'USD',
    category: 'Knitwear',
    gender: 'Unisex',
    collectionSlug: 'tactile-essentials',
    tags: ['merino', 'knitwear'],
    isNewArrival: false,
    isBestSeller: false,
    salesCount: 15,
    status: 'active',
    images: [{ url: '/knit.jpg', alt: 'Espresso knit', colorName: 'Espresso' }],
    variants: [
      { sku: 'KNIT-ESP-M', colorName: 'Espresso', colorHex: '#2B2523', size: 'M', stock: 8, reserved: 0 },
    ],
    createdAt: '2026-09-15T00:00:00.000Z',
    updatedAt: '2026-09-15T00:00:00.000Z',
  },
];

const validCoupon: Coupon = {
  id: 'cpn-1',
  code: 'ATELIER10',
  description: '10% courtesy privilege',
  discountType: 'percentage',
  value: 10,
  minSubtotalCents: 50000,
  maxUses: 100,
  usedCount: 5,
  active: true,
  expiresAt: '2027-12-31T23:59:59.000Z',
};

test('calculateCartPricing ignores browser prices and verifies stock & coupon server-side', () => {
  const result = calculateCartPricing({
    items: [
      { productId: 'prod-coat-1', sku: 'COAT-IVR-M', quantity: 3 }, // only 1 available (stock 2 - reserved 1)
      { productId: 'prod-knit-2', sku: 'KNIT-ESP-M', quantity: 1 },
    ],
    products: mockProducts,
    coupon: validCoupon,
    couponCodeAttempted: 'ATELIER10',
    deliveryMethod: 'standard',
    settings: mockSettings,
    now: new Date('2026-11-16T00:00:00.000Z'),
  });

  assert.equal(result.lines.length, 2);
  assert.equal(result.lines[0].quantity, 1); // clamped to available stock (1)
  assert.equal(result.subtotalCents, 185000 + 58000); // 243000
  assert.equal(result.discountCents, 24300); // 10% of 243000
  assert.equal(result.shippingCents, 0); // free shipping threshold met
  assert.equal(result.totalCents, 243000 - 24300);
  assert.equal(result.errors.length, 1);
});

test('evaluateCoupon rejects expired or under-minimum coupons', () => {
  const expired = evaluateCoupon(
    { ...validCoupon, expiresAt: '2025-01-01T00:00:00.000Z' },
    100000,
    new Date('2026-11-16T00:00:00.000Z')
  );
  assert.equal(expired.valid, false);

  const underMin = evaluateCoupon(validCoupon, 20000, new Date('2026-11-16T00:00:00.000Z'));
  assert.equal(underMin.valid, false);
});

test('fulfillment state machine permits valid transitions and blocks invalid jumps', () => {
  assert.equal(canTransitionFulfillmentStatus('pending', 'confirmed'), true);
  assert.equal(canTransitionFulfillmentStatus('confirmed', 'shipped'), true);
  assert.equal(canTransitionFulfillmentStatus('cancelled', 'shipped'), false);
  assert.equal(canTransitionFulfillmentStatus('delivered', 'pending'), false);
});

test('filterAndSortProducts filters by gender, search, and sorts by price ascending', () => {
  const women = filterAndSortProducts(mockProducts, { gender: 'Women', sort: 'price-asc' });
  assert.equal(women.length, 2); // Women + Unisex
  assert.equal(women[0].id, 'prod-knit-2');

  const cashmereSearch = filterAndSortProducts(mockProducts, { search: 'mongolian' });
  assert.equal(cashmereSearch.length, 1);
  assert.equal(cashmereSearch[0].id, 'prod-coat-1');
});
