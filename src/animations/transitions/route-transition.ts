export type RouteTransitionStyle =
  | 'curtain'
  | 'image-reveal'
  | 'editorial-fade'
  | 'directional';

export interface ImageRevealPayload {
  imageUrl: string;
  alt: string;
  rect: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

export interface RouteTransitionDescriptor {
  style: RouteTransitionStyle;
  curtainTone: 'charcoal' | 'ivory';
  direction: 'forward' | 'back';
  imagePayload?: ImageRevealPayload;
}

const INFORMATIONAL_PREFIXES = ['/about', '/contact', '/privacy', '/terms'];

/**
 * Pure transition style resolver that pairs each route pairing with a deliberate editorial style.
 * Never forces the same mechanical animation on every route.
 */
export function resolveRouteTransition(params: {
  fromPath: string;
  toPath: string;
  preferredStyle?: RouteTransitionStyle;
  imagePayload?: ImageRevealPayload;
  reducedMotion?: boolean;
}): RouteTransitionDescriptor {
  const { fromPath, toPath, preferredStyle, imagePayload, reducedMotion } = params;

  if (reducedMotion) {
    return {
      style: 'editorial-fade',
      curtainTone: 'ivory',
      direction: 'forward',
    };
  }

  // Genuine image-reveal transition when opening a garment page with captured rect
  if (
    (preferredStyle === 'image-reveal' || toPath.startsWith('/products/')) &&
    imagePayload &&
    imagePayload.rect.width > 0 &&
    imagePayload.rect.height > 0
  ) {
    return {
      style: 'image-reveal',
      curtainTone: 'ivory',
      direction: 'forward',
      imagePayload,
    };
  }

  // Subtle directional continuity between collection chapters
  if (
    preferredStyle === 'directional' ||
    (fromPath.startsWith('/collections/') && toPath.startsWith('/collections/'))
  ) {
    return {
      style: 'directional',
      curtainTone: 'charcoal',
      direction: fromPath.localeCompare(toPath) <= 0 ? 'forward' : 'back',
    };
  }

  // Calm editorial fade for informational / account / utility pages
  if (
    preferredStyle === 'editorial-fade' ||
    INFORMATIONAL_PREFIXES.some((prefix) => toPath.startsWith(prefix)) ||
    toPath.startsWith('/account') ||
    toPath.startsWith('/wishlist') ||
    toPath.startsWith('/cart')
  ) {
    return {
      style: 'editorial-fade',
      curtainTone: 'ivory',
      direction: 'forward',
    };
  }

  // Editorial curtain for major chapter shifts (Home <-> Shop / Collections / Checkout / Admin)
  const goingDark = toPath.startsWith('/collections/') || toPath.startsWith('/admin');
  return {
    style: 'curtain',
    curtainTone: goingDark ? 'charcoal' : 'ivory',
    direction: 'forward',
  };
}
