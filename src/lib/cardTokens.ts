import { Product, ProductVariant } from '../types/ecommerce';

export type CardSurfaceTheme = 'light' | 'ivory' | 'dark' | 'wine';
export type CardVariant = 'editorial' | 'featured' | 'compact';

export type PromotionalCategory =
  | 'new-arrivals'
  | 'best-sellers'
  | 'exclusive-collections'
  | 'limited-editions'
  | 'seasonal-collections'
  | 'special-offers'
  | 'featured-products';

export const BURGUNDY_ROYALE_TOKENS = {
  colors: {
    primaryBurgundy: '#35151F',
    deepBurgundy: '#240D14',
    royalWine: '#8B2635',
    champagneGold: '#D6B88C',
    warmIvory: '#F5EEE5',
    softWhite: '#FFFFFF',
    mutedTextLight: '#6D595E',
    mutedTextDark: '#DCCBB4',
    borderLight: 'rgba(53, 21, 31, 0.14)',
    borderDark: 'rgba(214, 184, 140, 0.28)',
  },
  radii: {
    outer: '18px',
    media: '12px',
    control: '10px',
  },
  spacing: {
    cardPaddingDesktop: '14px',
    cardPaddingMobile: '10px',
    metaGap: '10px',
  },
  typography: {
    titleClamp: 'clamp(1.0625rem, 1.4vw, 1.3125rem)',
    priceClamp: 'clamp(0.875rem, 1vw, 0.95rem)',
    kickerClamp: '0.6875rem',
  },
} as const;

export interface DerivedProductCardState {
  isOutOfStock: boolean;
  isLowStock: boolean;
  totalAvailableStock: number;
  hasDiscount: boolean;
  discountPercent: number;
  uniqueColors: [string, string][];
  inStockVariants: ProductVariant[];
  availableSizes: string[];
  primaryStatusLabel: string | null;
  availabilityText: string;
}

export function deriveProductCardState(product: Product): DerivedProductCardState {
  const availableVariants = product.variants.filter((v) => v.stock - v.reserved > 0);
  const totalAvailableStock = product.variants.reduce(
    (sum, v) => sum + Math.max(0, v.stock - v.reserved),
    0
  );

  const isOutOfStock = totalAvailableStock <= 0;
  const isLowStock = !isOutOfStock && totalAvailableStock <= 6;

  const hasDiscount =
    typeof product.compareAtPriceCents === 'number' &&
    product.compareAtPriceCents > product.priceCents &&
    product.priceCents > 0;

  const discountPercent = hasDiscount
    ? Math.max(
        1,
        Math.round(
          ((product.compareAtPriceCents! - product.priceCents) /
            product.compareAtPriceCents!) *
            100
        )
      )
    : 0;

  const uniqueColors = Array.from(
    new Map(product.variants.map((v) => [v.colorName, v.colorHex])).entries()
  );

  const availableSizes = Array.from(new Set(availableVariants.map((v) => v.size)));

  let primaryStatusLabel: string | null = null;
  if (isOutOfStock) {
    primaryStatusLabel = 'Archive Waitlist';
  } else if (hasDiscount) {
    primaryStatusLabel = `Private Offer · -${discountPercent}%`;
  } else if (product.editionLabel) {
    primaryStatusLabel = product.editionLabel;
  } else if (product.isNewArrival) {
    primaryStatusLabel = 'New Arrival';
  } else if (product.isBestSeller) {
    primaryStatusLabel = 'Signature Piece';
  }

  let availabilityText = 'Available in atelier stock';
  if (isOutOfStock) {
    availabilityText = 'Currently sold out';
  } else if (isLowStock) {
    availabilityText = `Limited · ${totalAvailableStock} left`;
  } else if (availableSizes.length > 0) {
    availabilityText = `Sizes ${availableSizes.join(' · ')}`;
  }

  return {
    isOutOfStock,
    isLowStock,
    totalAvailableStock,
    hasDiscount,
    discountPercent,
    uniqueColors,
    inStockVariants: availableVariants,
    availableSizes,
    primaryStatusLabel,
    availabilityText,
  };
}
