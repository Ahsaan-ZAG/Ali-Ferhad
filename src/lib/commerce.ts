import {
  CartItemInput,
  CartPricingSummary,
  Coupon,
  CurrencyCode,
  DeliveryMethod,
  FulfillmentStatus,
  Product,
  SiteSettings,
  VerifiedCartLine,
} from '../types/ecommerce';
import { BRAND_CONFIG } from '../config/brand';

export function formatMoney(
  amountCents: number,
  currency: CurrencyCode = 'USD'
): string {
  const meta =
    BRAND_CONFIG.currencies.find((c) => c.code === currency) ??
    BRAND_CONFIG.currencies[0];
  const converted = Math.round((amountCents / 100) * meta.rateFromUsd);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: meta.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(converted);
}

export function evaluateCoupon(
  coupon: Coupon | undefined | null,
  subtotalCents: number,
  now: Date = new Date()
): { valid: boolean; discountCents: number; message: string } {
  if (!coupon) {
    return { valid: false, discountCents: 0, message: 'Privilege code not recognized.' };
  }
  if (!coupon.active) {
    return { valid: false, discountCents: 0, message: 'This privilege code is currently inactive.' };
  }
  if (new Date(coupon.expiresAt).getTime() < now.getTime()) {
    return { valid: false, discountCents: 0, message: 'This privilege code has expired.' };
  }
  if (coupon.usedCount >= coupon.maxUses) {
    return { valid: false, discountCents: 0, message: 'This privilege code has reached its usage limit.' };
  }
  if (subtotalCents < coupon.minSubtotalCents) {
    return {
      valid: false,
      discountCents: 0,
      message: `Requires a minimum subtotal of ${formatMoney(coupon.minSubtotalCents)}.`,
    };
  }

  let discountCents = 0;
  if (coupon.discountType === 'percentage') {
    discountCents = Math.round((subtotalCents * coupon.value) / 100);
  } else {
    discountCents = Math.min(subtotalCents, coupon.value);
  }

  return {
    valid: true,
    discountCents,
    message: `${coupon.code} applied — ${coupon.description}`,
  };
}

export function calculateShippingCents(
  subtotalAfterDiscountCents: number,
  deliveryMethod: DeliveryMethod,
  settings: SiteSettings
): number {
  if (subtotalAfterDiscountCents <= 0) return 0;
  if (deliveryMethod === 'atelier_pickup') return 0;
  if (deliveryMethod === 'express') return settings.expressShippingCents;
  if (subtotalAfterDiscountCents >= settings.freeShippingThresholdCents) return 0;
  return settings.standardShippingCents;
}

export function calculateCartPricing(params: {
  items: CartItemInput[];
  products: Product[];
  coupon?: Coupon | null;
  couponCodeAttempted?: string | null;
  deliveryMethod: DeliveryMethod;
  settings: SiteSettings;
  now?: Date;
}): CartPricingSummary {
  const { items, products, coupon, couponCodeAttempted, deliveryMethod, settings, now } = params;
  const lines: VerifiedCartLine[] = [];
  const errors: string[] = [];

  for (const item of items) {
    if (item.quantity <= 0 || !Number.isInteger(item.quantity)) {
      errors.push(`Invalid quantity requested for SKU ${item.sku}.`);
      continue;
    }

    const product = products.find(
      (p) => p.id === item.productId && p.status === 'active'
    );
    if (!product) {
      errors.push('One of the selected garments is no longer available.');
      continue;
    }

    const variant = product.variants.find((v) => v.sku === item.sku);
    if (!variant) {
      errors.push(`Selected variant (${item.sku}) was not found for ${product.name}.`);
      continue;
    }

    const availableStock = Math.max(0, variant.stock - variant.reserved);
    if (availableStock <= 0) {
      errors.push(`${product.name} (${variant.colorName}, ${variant.size}) is currently out of stock.`);
      continue;
    }

    const clampedQty = Math.min(item.quantity, availableStock, 10);
    if (item.quantity > availableStock) {
      errors.push(
        `Only ${availableStock} unit(s) available for ${product.name} in ${variant.colorName} ${variant.size}.`
      );
    }

    const primaryImage =
      product.images.find((img) => img.colorName === variant.colorName) ??
      product.images[0];

    lines.push({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      sku: variant.sku,
      colorName: variant.colorName,
      colorHex: variant.colorHex,
      size: variant.size,
      imageUrl: primaryImage?.url ?? '',
      unitPriceCents: product.priceCents,
      quantity: clampedQty,
      lineTotalCents: product.priceCents * clampedQty,
      availableStock,
    });
  }

  const subtotalCents = lines.reduce((sum, line) => sum + line.lineTotalCents, 0);

  let discountCents = 0;
  let appliedCouponCode: string | null = null;
  let couponMessage: string | null = null;

  if (couponCodeAttempted && couponCodeAttempted.trim().length > 0) {
    const evalResult = evaluateCoupon(coupon, subtotalCents, now);
    couponMessage = evalResult.message;
    if (evalResult.valid && coupon) {
      discountCents = evalResult.discountCents;
      appliedCouponCode = coupon.code;
    }
  }

  const netSubtotal = Math.max(0, subtotalCents - discountCents);
  const shippingCents = calculateShippingCents(netSubtotal, deliveryMethod, settings);
  const totalCents = netSubtotal + shippingCents;

  return {
    lines,
    subtotalCents,
    discountCents,
    shippingCents,
    totalCents,
    appliedCouponCode,
    couponMessage,
    errors,
  };
}

const VALID_TRANSITIONS: Record<FulfillmentStatus, FulfillmentStatus[]> = {
  pending: ['confirmed', 'processing', 'cancelled'],
  confirmed: ['processing', 'shipped', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'refunded'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: [],
};

export function canTransitionFulfillmentStatus(
  from: FulfillmentStatus,
  to: FulfillmentStatus
): boolean {
  if (from === to) return true;
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export interface ProductQueryParams {
  category?: string;
  gender?: string;
  collection?: string;
  size?: string;
  color?: string;
  tag?: string;
  inStockOnly?: boolean;
  minPriceCents?: number;
  maxPriceCents?: number;
  search?: string;
  sort?: 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'best-selling';
}

export function filterAndSortProducts(
  products: Product[],
  query: ProductQueryParams
): Product[] {
  const qSearch = query.search?.trim().toLowerCase() ?? '';

  const filtered = products.filter((product) => {
    if (product.status !== 'active') return false;

    if (query.category && query.category !== 'All') {
      if (product.category.toLowerCase() !== query.category.toLowerCase()) return false;
    }

    if (query.gender && query.gender !== 'All') {
      const target = query.gender.toLowerCase();
      if (product.gender.toLowerCase() !== target && product.gender !== 'Unisex') {
        return false;
      }
    }

    if (query.collection && query.collection !== 'All') {
      if (product.collectionSlug !== query.collection) return false;
    }

    if (query.tag === 'new-arrival' && !product.isNewArrival) return false;
    if (query.tag && query.tag !== 'new-arrival') {
      const hasTag = product.tags.some(
        (t) => t.toLowerCase() === query.tag!.toLowerCase()
      );
      if (!hasTag) return false;
    }

    if (query.size) {
      const hasSize = product.variants.some(
        (v) => v.size.toLowerCase() === query.size!.toLowerCase() && v.stock - v.reserved > 0
      );
      if (!hasSize) return false;
    }

    if (query.color) {
      const hasColor = product.variants.some(
        (v) => v.colorName.toLowerCase() === query.color!.toLowerCase()
      );
      if (!hasColor) return false;
    }

    if (query.inStockOnly) {
      const anyStock = product.variants.some((v) => v.stock - v.reserved > 0);
      if (!anyStock) return false;
    }

    if (typeof query.minPriceCents === 'number' && product.priceCents < query.minPriceCents) {
      return false;
    }

    if (typeof query.maxPriceCents === 'number' && product.priceCents > query.maxPriceCents) {
      return false;
    }

    if (qSearch.length > 0) {
      const haystack = [
        product.name,
        product.subtitle,
        product.description,
        product.category,
        product.materialDetails,
        ...product.tags,
        ...product.variants.map((v) => v.colorName),
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(qSearch)) return false;
    }

    return true;
  });

  const sorted = [...filtered];
  switch (query.sort) {
    case 'newest':
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case 'price-asc':
      sorted.sort((a, b) => a.priceCents - b.priceCents);
      break;
    case 'price-desc':
      sorted.sort((a, b) => b.priceCents - a.priceCents);
      break;
    case 'best-selling':
      sorted.sort((a, b) => b.salesCount - a.salesCount);
      break;
    case 'featured':
    default:
      sorted.sort((a, b) => {
        if (a.isNewArrival !== b.isNewArrival) return a.isNewArrival ? -1 : 1;
        return b.salesCount - a.salesCount;
      });
      break;
  }

  return sorted;
}
