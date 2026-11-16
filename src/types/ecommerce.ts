export type CurrencyCode = 'USD' | 'EUR' | 'GBP';

export type ProductCategory =
  | 'Outerwear'
  | 'Tailoring'
  | 'Dresses'
  | 'Knitwear'
  | 'Trousers';

export type ProductGender = 'Women' | 'Men' | 'Unisex';

export type ProductStatus = 'active' | 'draft' | 'archived';

export interface ProductImage {
  url: string;
  alt: string;
  colorName?: string;
}

export interface ProductVariant {
  sku: string;
  colorName: string;
  colorHex: string;
  size: string;
  stock: number;
  reserved: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  materialDetails: string;
  careInstructions: string;
  fitNotes: string;
  priceCents: number;
  compareAtPriceCents?: number;
  editionLabel?: string;
  currency: CurrencyCode;
  category: ProductCategory;
  gender: ProductGender;
  collectionSlug: string;
  tags: string[];
  isNewArrival: boolean;
  isBestSeller: boolean;
  salesCount: number;
  status: ProductStatus;
  images: ProductImage[];
  variants: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface Collection {
  id: string;
  slug: string;
  title: string;
  season: string;
  subtitle: string;
  description: string;
  editorialNote: string;
  heroImage: string;
  featured: boolean;
  sortOrder: number;
}

export interface CartItemInput {
  productId: string;
  sku: string;
  quantity: number;
}

export interface VerifiedCartLine {
  productId: string;
  slug: string;
  name: string;
  sku: string;
  colorName: string;
  colorHex: string;
  size: string;
  imageUrl: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
  availableStock: number;
}

export type DeliveryMethod = 'standard' | 'express' | 'atelier_pickup';

export type PaymentMethod = 'cod' | 'card_sandbox' | 'invoice';

export type PaymentStatus = 'pending' | 'authorized' | 'paid' | 'failed' | 'refunded';

export type FulfillmentStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface ShippingAddress {
  recipientName: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed_cents';
  value: number;
  minSubtotalCents: number;
  maxUses: number;
  usedCount: number;
  active: boolean;
  expiresAt: string;
}

export interface OrderTimelineEntry {
  status: string;
  note: string;
  timestamp: string;
  actor: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string | null;
  customerEmail: string;
  customerName: string;
  shippingAddress: ShippingAddress;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  items: VerifiedCartLine[];
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  currency: CurrencyCode;
  couponCode: string | null;
  idempotencyKey: string;
  timeline: OrderTimelineEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  status: 'subscribed' | 'unsubscribed';
  subscribedAt: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  actorUid: string;
  actorEmail: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details: string;
  createdAt: string;
}

export interface SiteSettings {
  brandName: string;
  announcementText: string;
  announcementLink: string;
  freeShippingThresholdCents: number;
  standardShippingCents: number;
  expressShippingCents: number;
  supportEmail: string;
}

export interface CartPricingSummary {
  lines: VerifiedCartLine[];
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  appliedCouponCode: string | null;
  couponMessage: string | null;
  errors: string[];
}
