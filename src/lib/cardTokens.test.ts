import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveProductCardState } from './cardTokens';
import { Product } from '../types/ecommerce';

const baseProduct: Product = {
  id: 'p-test',
  slug: 'test-coat',
  name: 'Atelier Wool Coat',
  subtitle: 'Tailored coat',
  description: 'Fine coat',
  materialDetails: '100% Cashmere',
  careInstructions: 'Dry clean',
  fitNotes: 'Relaxed fit',
  priceCents: 120000,
  currency: 'USD',
  category: 'Outerwear',
  gender: 'Women',
  collectionSlug: 'autumn-architecture',
  tags: ['cashmere'],
  isNewArrival: true,
  isBestSeller: false,
  salesCount: 10,
  status: 'active',
  images: [{ url: '/test.jpg', alt: 'Coat' }],
  variants: [
    { sku: 'SKU-S', colorName: 'Burgundy', colorHex: '#35151F', size: 'S', stock: 5, reserved: 1 },
    { sku: 'SKU-M', colorName: 'Burgundy', colorHex: '#35151F', size: 'M', stock: 4, reserved: 0 },
    { sku: 'SKU-L', colorName: 'Ivory', colorHex: '#F5EEE5', size: 'L', stock: 2, reserved: 2 },
  ],
  createdAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-01T00:00:00.000Z',
};

test('deriveProductCardState calculates stock, sizes, and colors accurately', () => {
  const state = deriveProductCardState(baseProduct);
  assert.equal(state.isOutOfStock, false);
  assert.equal(state.totalAvailableStock, 8);
  assert.deepEqual(state.availableSizes, ['S', 'M']);
  assert.equal(state.uniqueColors.length, 2);
  assert.equal(state.primaryStatusLabel, 'New Arrival');
});

test('deriveProductCardState computes discount percentage and label', () => {
  const discounted: Product = {
    ...baseProduct,
    priceCents: 112000,
    compareAtPriceCents: 140000,
  };
  const state = deriveProductCardState(discounted);
  assert.equal(state.hasDiscount, true);
  assert.equal(state.discountPercent, 20);
  assert.equal(state.primaryStatusLabel, 'Private Offer · -20%');
});

test('deriveProductCardState detects sold out and low stock states', () => {
  const lowStock: Product = {
    ...baseProduct,
    editionLabel: 'Limited Edition',
    variants: [
      { sku: 'SKU-S', colorName: 'Burgundy', colorHex: '#35151F', size: 'S', stock: 3, reserved: 0 },
    ],
  };
  const lowState = deriveProductCardState(lowStock);
  assert.equal(lowState.isLowStock, true);
  assert.equal(lowState.availabilityText, 'Limited · 3 left');
  assert.equal(lowState.primaryStatusLabel, 'Limited Edition');

  const soldOut: Product = {
    ...baseProduct,
    variants: [
      { sku: 'SKU-S', colorName: 'Burgundy', colorHex: '#35151F', size: 'S', stock: 2, reserved: 2 },
    ],
  };
  const outState = deriveProductCardState(soldOut);
  assert.equal(outState.isOutOfStock, true);
  assert.equal(outState.primaryStatusLabel, 'Archive Waitlist');
});
