import { Check, ChevronDown, Heart, Maximize2, Minus, Plus, Ruler, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageTransitionLink } from '../animations/components/PageTransitionLink';
import {
  isReducedMotionPreferred,
  lockBodyScroll,
  trapFocusInElement,
} from '../animations/core/animation-context';
import { ensureGsapRegistered, gsap } from '../animations/core/gsap-config';
import { MOTION_DURATION, MOTION_EASE, MOTION_STAGGER } from '../animations/core/motion-tokens';
import { setupBatchCardReveal } from '../animations/scroll/reveal';
import { ProductCard } from '../components/product/ProductCard';
import { LuxuryImage } from '../components/ui/LuxuryImage';
import { useStore } from '../context/StoreContext';
import { deriveProductCardState } from '../lib/cardTokens';
import { formatMoney } from '../lib/commerce';
import { Product } from '../types/ecommerce';

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { products, currency, addToCart, toggleWishlist, isWishlisted } = useStore();
  const navigate = useNavigate();

  const [fetchedProduct, setFetchedProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSku, setSelectedSku] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [openAccordion, setOpenAccordion] = useState<'material' | 'care' | 'shipping' | null>('material');
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);

  const mainImgWrapRef = useRef<HTMLDivElement | null>(null);
  const purchasePanelRef = useRef<HTMLDivElement | null>(null);
  const relatedGridRef = useRef<HTMLDivElement | null>(null);
  const sizeGuideRef = useRef<HTMLDivElement | null>(null);
  const zoomModalRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setActiveImageIdx(0);
    setQuantity(1);

    fetch(`/api/products/${slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data?.product) {
          setFetchedProduct(data.product);
          setRelatedProducts(data.related ?? []);
          const firstVar =
            data.product.variants.find((v: { stock: number; reserved: number }) => v.stock - v.reserved > 0) ??
            data.product.variants[0];
          if (firstVar) {
            setSelectedColor(firstVar.colorName);
            setSelectedSku(firstVar.sku);
          }
        } else {
          const fallback = products.find((p) => p.slug === slug) ?? null;
          setFetchedProduct(fallback);
        }
      })
      .catch(() => {
        const fallback = products.find((p) => p.slug === slug) ?? null;
        if (!cancelled) setFetchedProduct(fallback);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug, products]);

  const product = fetchedProduct;

  const colors = useMemo(() => {
    if (!product) return [];
    return Array.from(new Map(product.variants.map((v) => [v.colorName, v.colorHex])).entries());
  }, [product]);

  const variantsForColor = useMemo(() => {
    if (!product) return [];
    return product.variants.filter((v) => v.colorName === selectedColor);
  }, [product, selectedColor]);

  const activeVariant = useMemo(() => {
    if (!product) return undefined;
    return product.variants.find((v) => v.sku === selectedSku) ?? variantsForColor[0];
  }, [product, selectedSku, variantsForColor]);

  const availableStock = activeVariant ? Math.max(0, activeVariant.stock - activeVariant.reserved) : 0;

  // Staggered entrance of product metadata & purchase details
  useEffect(() => {
    if (!product || !purchasePanelRef.current || isReducedMotionPreferred()) return;
    ensureGsapRegistered();
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.pdp-stagger',
        { y: 16, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: MOTION_DURATION.standard,
          stagger: MOTION_STAGGER.tight,
          ease: MOTION_EASE.editorial,
          clearProps: 'transform,opacity',
        }
      );
    }, purchasePanelRef.current);
    return () => ctx.revert();
  }, [product?.id]);

  // Smooth crossfade/scale transition when switching active gallery image
  useEffect(() => {
    if (!mainImgWrapRef.current || isReducedMotionPreferred()) return;
    ensureGsapRegistered();
    const tween = gsap.fromTo(
      mainImgWrapRef.current,
      { opacity: 0.72, scale: 1.02 },
      {
        opacity: 1,
        scale: 1,
        duration: MOTION_DURATION.standard,
        ease: MOTION_EASE.editorial,
        clearProps: 'transform,opacity',
      }
    );
    return () => {
      tween.kill();
    };
  }, [activeImageIdx, product?.id]);

  // Complementary silhouettes batch reveal
  useEffect(() => {
    if (!relatedProducts.length) return;
    return setupBatchCardReveal('.product-card-reveal', relatedGridRef.current);
  }, [relatedProducts]);

  // Modal lifecycle: Escape key, scroll lock, focus trap for Size Guide & Zoom Viewer
  useEffect(() => {
    if (!sizeGuideOpen && !zoomOpen) return;
    const unlock = lockBodyScroll();
    const activeDialog = zoomOpen ? zoomModalRef.current : sizeGuideRef.current;
    const untrap = trapFocusInElement(activeDialog);

    if (activeDialog && !isReducedMotionPreferred()) {
      ensureGsapRegistered();
      gsap.fromTo(
        activeDialog,
        { opacity: 0, scale: 0.97 },
        { opacity: 1, scale: 1, duration: MOTION_DURATION.ui, ease: MOTION_EASE.editorial, clearProps: 'transform,opacity' }
      );
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSizeGuideOpen(false);
        setZoomOpen(false);
      } else if (zoomOpen && product && product.images.length > 1) {
        if (e.key === 'ArrowRight') {
          setActiveImageIdx((idx) => (idx + 1) % product.images.length);
        } else if (e.key === 'ArrowLeft') {
          setActiveImageIdx((idx) => (idx - 1 + product.images.length) % product.images.length);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      unlock();
      untrap();
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [sizeGuideOpen, zoomOpen, product]);

  // Inject Product JSON-LD structured data for SEO
  useEffect(() => {
    if (!product) return;
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      sku: activeVariant?.sku ?? product.id,
      offers: {
        '@type': 'Offer',
        priceCurrency: 'USD',
        price: (product.priceCents / 100).toFixed(2),
        availability:
          availableStock > 0
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
      },
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(ld);
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, [product, activeVariant, availableStock]);

  if (loading && !product) {
    return (
      <div className="bg-[#F5EEE5] min-h-screen">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 animate-pulse">
          <div className="lg:col-span-7 aspect-[4/5] rounded-[20px] bg-[#EFE4D6]" />
          <div className="lg:col-span-5 space-y-4">
            <div className="h-10 w-2/3 rounded bg-[#EFE4D6]" />
            <div className="h-6 w-1/4 rounded bg-[#EFE4D6]" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-[#F5EEE5] min-h-screen">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-24 text-center space-y-4">
          <h1 className="editorial-section-title text-[#35151F]">Garment not found</h1>
          <PageTransitionLink to="/shop" className="inline-block underline text-sm text-[#8B2635]">
            Return to Catalog
          </PageTransitionLink>
        </div>
      </div>
    );
  }

  const cardState = deriveProductCardState(product);
  const wishlisted = isWishlisted(product.id);

  const handleColorSelect = (colorName: string) => {
    setSelectedColor(colorName);
    const matching = product.variants.filter((v) => v.colorName === colorName);
    const firstInStock = matching.find((v) => v.stock - v.reserved > 0) ?? matching[0];
    if (firstInStock) setSelectedSku(firstInStock.sku);
    const matchingImgIdx = product.images.findIndex((i) => i.colorName === colorName);
    if (matchingImgIdx >= 0) setActiveImageIdx(matchingImgIdx);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || product.images.length <= 1) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) >= 42) {
      if (delta < 0) {
        setActiveImageIdx((i) => (i + 1) % product.images.length);
      } else {
        setActiveImageIdx((i) => (i - 1 + product.images.length) % product.images.length);
      }
    }
  };

  return (
    <div className="bg-[#F5EEE5] text-[#35151F]">
      <div className="max-w-[1440px] mx-auto px-3 sm:px-8 py-8 md:py-14">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="text-xs text-[#6D595E] mb-8 flex items-center gap-2">
          <PageTransitionLink to="/" className="hover:text-[#8B2635]">Home</PageTransitionLink>
          <span aria-hidden="true">/</span>
          <PageTransitionLink to={`/shop?category=${product.category}`} className="hover:text-[#8B2635]">
            {product.category}
          </PageTransitionLink>
          <span aria-hidden="true">/</span>
          <span className="text-[#35151F] truncate">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          {/* Left: Product Image Gallery */}
          <div className="lg:col-span-7 space-y-4">
            <div
              className="relative aspect-[4/5] rounded-[20px] bg-[#EFE4D6] border border-[#35151F]/12 overflow-hidden group shadow-[var(--card-shadow-subtle)]"
              data-cursor="view"
              data-cursor-label="Inspect"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div ref={mainImgWrapRef} className="w-full h-full">
                <LuxuryImage
                  src={product.images[activeImageIdx]?.url ?? ''}
                  alt={product.images[activeImageIdx]?.alt ?? product.name}
                  loading="eager"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              {cardState.primaryStatusLabel && (
                <div className="absolute top-4 left-4 px-3 py-1 rounded-[6px] bg-[#35151F]/92 text-[#F5EEE5] border border-[#D6B88C]/35 text-[11px] uppercase tracking-[0.14em] font-medium">
                  {cardState.primaryStatusLabel}
                </div>
              )}
              <button
                type="button"
                onClick={() => setZoomOpen(true)}
                aria-label="Open fullscreen image viewer"
                className="absolute bottom-4 right-4 min-h-[48px] min-w-[48px] flex items-center justify-center rounded-[12px] bg-[#FFFFFF]/95 border border-[#35151F]/20 text-[#35151F] hover:bg-[#35151F] hover:text-[#F5EEE5] transition-colors shadow-sm"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {product.images.map((img, i) => (
                  <button
                    key={`${img.url}-${i}`}
                    type="button"
                    onClick={() => setActiveImageIdx(i)}
                    aria-label={`View image ${i + 1} of ${product.name}`}
                    className={`aspect-[4/5] rounded-[12px] overflow-hidden border transition-all duration-200 ${
                      activeImageIdx === i
                        ? 'border-[#35151F] opacity-100 ring-1 ring-[#35151F]'
                        : 'border-[#35151F]/15 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <LuxuryImage src={img.url} alt={img.alt} className="w-full h-full object-cover object-top" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Contiguous Sticky Purchase Module */}
          <div
            ref={purchasePanelRef}
            className="lg:col-span-5 lg:sticky lg:top-28 space-y-7 bg-[#FFFFFF] border border-[#35151F]/14 rounded-[20px] p-5 sm:p-8 shadow-[var(--card-shadow-subtle)]"
          >
            <div className="pdp-stagger space-y-2 border-b border-[#35151F]/12 pb-6">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[#8B2635]">
                {product.category} · {product.gender}
              </p>
              <h1 className="font-display text-3xl sm:text-4xl text-[#35151F] leading-tight">
                {product.name}
              </h1>
              <p className="text-sm text-[#6D595E]">{product.subtitle}</p>
              <div className="flex items-baseline gap-3 pt-2 tabular-nums">
                <span className="text-2xl font-semibold text-[#35151F]">
                  {formatMoney(product.priceCents, currency)}
                </span>
                {cardState.hasDiscount && product.compareAtPriceCents && (
                  <>
                    <span className="text-base line-through text-[#6D595E]">
                      {formatMoney(product.compareAtPriceCents, currency)}
                    </span>
                    <span className="text-xs font-medium text-[#8B2635] uppercase tracking-[0.08em]">
                      -{cardState.discountPercent}%
                    </span>
                  </>
                )}
              </div>
            </div>

            <p className="pdp-stagger text-sm text-[#35151F]/85 leading-relaxed">
              {product.description}
            </p>

            {/* Color Selector */}
            <div className="pdp-stagger space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6D595E] uppercase tracking-[0.1em]">Color</span>
                <span className="text-[#35151F] font-medium">{selectedColor}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                {colors.map(([name, hex]) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => handleColorSelect(name)}
                    aria-label={`Select color ${name}`}
                    className={`min-h-[48px] min-w-[48px] rounded-[12px] border flex items-center justify-center transition-colors ${
                      selectedColor === name
                        ? 'border-[#35151F] bg-[#F5EEE5]'
                        : 'border-[#35151F]/15 hover:border-[#8B2635]'
                    }`}
                  >
                    <span
                      className="w-6 h-6 rounded-full border border-[#35151F]/25 flex items-center justify-center"
                      style={{ backgroundColor: hex }}
                    >
                      {selectedColor === name && (
                        <Check className="w-3.5 h-3.5 text-[#FFFFFF] mix-blend-difference" />
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Size Selector */}
            <div className="pdp-stagger space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6D595E] uppercase tracking-[0.1em]">Size</span>
                <button
                  type="button"
                  onClick={() => setSizeGuideOpen(true)}
                  className="min-h-[48px] px-1 inline-flex items-center gap-1.5 text-[#35151F] underline underline-offset-4 hover:text-[#8B2635]"
                >
                  <Ruler className="w-3.5 h-3.5" /> Size Guide
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {variantsForColor.map((variant) => {
                  const avail = variant.stock - variant.reserved;
                  const active = selectedSku === variant.sku;
                  return (
                    <button
                      key={variant.sku}
                      type="button"
                      disabled={avail <= 0}
                      onClick={() => {
                        setSelectedSku(variant.sku);
                        setQuantity(1);
                      }}
                      className={`min-h-[48px] rounded-[10px] text-xs font-medium border transition-colors ${
                        avail <= 0
                          ? 'border-[#35151F]/15 text-[#6D595E]/60 line-through bg-[#F5EEE5] cursor-not-allowed'
                          : active
                          ? 'bg-[#35151F] text-[#F5EEE5] border-[#35151F]'
                          : 'bg-[#FFFFFF] text-[#35151F] border-[#35151F]/20 hover:border-[#8B2635]'
                      }`}
                    >
                      {variant.size}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-[#6D595E] tabular-nums">
                {availableStock > 0
                  ? `${availableStock} unit(s) ready in atelier stock (${activeVariant?.sku})`
                  : 'Currently unavailable in this size'}
              </p>
            </div>

            {/* Quantity & Purchase Actions */}
            <div className="pdp-stagger space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center border border-[#35151F]/18 rounded-[12px] bg-[#F5EEE5] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="min-h-[48px] min-w-[44px] flex items-center justify-center text-[#35151F] hover:bg-[#EFE4D6]"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 text-sm tabular-nums font-medium">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(availableStock || 1, q + 1))}
                    disabled={quantity >= availableStock}
                    aria-label="Increase quantity"
                    className="min-h-[48px] min-w-[44px] flex items-center justify-center text-[#35151F] hover:bg-[#EFE4D6] disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  disabled={!activeVariant || availableStock <= 0}
                  onClick={() => activeVariant && addToCart(product.id, activeVariant.sku, quantity)}
                  data-testid="pdp-add-to-bag"
                  className="flex-1 min-h-[48px] bg-[#35151F] text-[#F5EEE5] rounded-[12px] px-6 text-xs font-medium uppercase tracking-[0.1em] hover:bg-[#8B2635] transition-colors disabled:opacity-40"
                >
                  {availableStock > 0 ? 'Add to Bag' : 'Out of Stock'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={!activeVariant || availableStock <= 0}
                  onClick={() => {
                    if (!activeVariant) return;
                    addToCart(product.id, activeVariant.sku, quantity);
                    navigate('/checkout');
                  }}
                  className="min-h-[48px] border border-[#35151F] rounded-[12px] text-[#35151F] px-4 text-xs font-medium uppercase tracking-[0.08em] hover:bg-[#F5EEE5] transition-colors disabled:opacity-40"
                >
                  Buy Now
                </button>
                <button
                  type="button"
                  onClick={() => toggleWishlist(product.id)}
                  className={`min-h-[48px] border rounded-[12px] px-4 text-xs font-medium uppercase tracking-[0.08em] transition-colors inline-flex items-center justify-center gap-2 ${
                    wishlisted
                      ? 'bg-[#35151F] text-[#D6B88C] border-[#35151F]'
                      : 'bg-[#FFFFFF] text-[#35151F] border-[#35151F]/20 hover:border-[#8B2635]'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5" fill={wishlisted ? 'currentColor' : 'none'} />
                  {wishlisted ? 'Saved' : 'Save Piece'}
                </button>
              </div>
            </div>

            {/* Specification Accordions */}
            <div className="pdp-stagger border-t border-[#35151F]/12 pt-2 divide-y divide-[#35151F]/12 text-sm">
              <div>
                <button
                  type="button"
                  aria-expanded={openAccordion === 'material'}
                  onClick={() => setOpenAccordion(openAccordion === 'material' ? null : 'material')}
                  className="w-full min-h-[48px] py-3 flex items-center justify-between text-left text-xs uppercase tracking-[0.1em] text-[#35151F]"
                >
                  <span>Cloth & Composition</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${openAccordion === 'material' ? 'rotate-180' : ''}`} />
                </button>
                {openAccordion === 'material' && (
                  <div className="pb-4 space-y-2 text-xs text-[#6D595E] leading-relaxed">
                    <p><strong className="text-[#35151F]">Material:</strong> {product.materialDetails}</p>
                    <p><strong className="text-[#35151F]">Fit Notes:</strong> {product.fitNotes}</p>
                  </div>
                )}
              </div>

              <div>
                <button
                  type="button"
                  aria-expanded={openAccordion === 'care'}
                  onClick={() => setOpenAccordion(openAccordion === 'care' ? null : 'care')}
                  className="w-full min-h-[48px] py-3 flex items-center justify-between text-left text-xs uppercase tracking-[0.1em] text-[#35151F]"
                >
                  <span>Garment Care</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${openAccordion === 'care' ? 'rotate-180' : ''}`} />
                </button>
                {openAccordion === 'care' && (
                  <p className="pb-4 text-xs text-[#6D595E] leading-relaxed">
                    {product.careInstructions}
                  </p>
                )}
              </div>

              <div>
                <button
                  type="button"
                  aria-expanded={openAccordion === 'shipping'}
                  onClick={() => setOpenAccordion(openAccordion === 'shipping' ? null : 'shipping')}
                  className="w-full min-h-[48px] py-3 flex items-center justify-between text-left text-xs uppercase tracking-[0.1em] text-[#35151F]"
                >
                  <span>Shipping & Returns</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${openAccordion === 'shipping' ? 'rotate-180' : ''}`} />
                </button>
                {openAccordion === 'shipping' && (
                  <p className="pb-4 text-xs text-[#6D595E] leading-relaxed">
                    Complimentary insured standard shipping on orders over $1,000. Unworn garments with original tags may be returned within 14 days of delivery.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 pt-12 border-t border-[#35151F]/12">
            <h2 className="editorial-subheading text-[#35151F] mb-8">
              Complementary Silhouettes
            </h2>
            <div
              ref={relatedGridRef}
              className="grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6"
            >
              {relatedProducts.map((rel) => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Size Guide Modal */}
      {sizeGuideOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Size guide"
          className="fixed inset-0 z-50 bg-[#1D0B11]/65 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSizeGuideOpen(false);
          }}
        >
          <div ref={sizeGuideRef} className="bg-[#FFFFFF] border border-[#35151F]/15 rounded-[20px] max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#35151F]/12 pb-3">
              <h2 className="font-display text-2xl text-[#35151F]">Measurement Guide</h2>
              <button
                type="button"
                onClick={() => setSizeGuideOpen(false)}
                aria-label="Close size guide"
                className="min-h-[48px] min-w-[48px] flex items-center justify-center rounded-[10px] hover:text-[#8B2635]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-[#6D595E]">
              Measurements represent body dimensions in centimeters. Outerwear blocks allow for layering over medium-gauge knitwear.
            </p>
            <table className="w-full text-xs text-left tabular-nums border-collapse">
              <thead>
                <tr className="border-b border-[#35151F]/12 text-[#6D595E]">
                  <th className="py-2">Size</th>
                  <th className="py-2">Chest</th>
                  <th className="py-2">Waist</th>
                  <th className="py-2">Hip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#35151F]/10">
                <tr><td className="py-2.5 font-medium">XS</td><td>82–86</td><td>64–68</td><td>88–92</td></tr>
                <tr><td className="py-2.5 font-medium">S</td><td>86–90</td><td>68–72</td><td>92–96</td></tr>
                <tr><td className="py-2.5 font-medium">M</td><td>90–96</td><td>72–78</td><td>96–102</td></tr>
                <tr><td className="py-2.5 font-medium">L</td><td>96–102</td><td>78–84</td><td>102–108</td></tr>
                <tr><td className="py-2.5 font-medium">XL</td><td>102–108</td><td>84–90</td><td>108–114</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Fullscreen Image Viewer */}
      {zoomOpen && (
        <div
          ref={zoomModalRef}
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged garment view"
          className="fixed inset-0 z-50 bg-[#1D0B11]/95 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setZoomOpen(false);
          }}
        >
          <button
            type="button"
            onClick={() => setZoomOpen(false)}
            aria-label="Close enlarged view"
            className="absolute top-6 right-6 min-h-[48px] min-w-[48px] flex items-center justify-center text-[#F5EEE5] hover:text-[#D6B88C]"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={product.images[activeImageIdx]?.url ?? ''}
            alt={product.name}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-[18px]"
          />
        </div>
      )}
    </div>
  );
}
