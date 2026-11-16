import { SlidersHorizontal, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageTransitionLink } from '../animations/components/PageTransitionLink';
import {
  isReducedMotionPreferred,
  lockBodyScroll,
  trapFocusInElement,
} from '../animations/core/animation-context';
import { ensureGsapRegistered, gsap } from '../animations/core/gsap-config';
import { MOTION_DURATION, MOTION_EASE } from '../animations/core/motion-tokens';
import { setupBatchCardReveal } from '../animations/scroll/reveal';
import { ProductCard, ProductCardSkeleton } from '../components/product/ProductCard';
import { useStore } from '../context/StoreContext';
import { filterAndSortProducts, ProductQueryParams } from '../lib/commerce';

const CATEGORIES = ['All', 'Outerwear', 'Tailoring', 'Dresses', 'Knitwear', 'Trousers'];
const GENDERS = ['All', 'Women', 'Men', 'Unisex'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL'];

export function ShopPage() {
  const { products, collections, catalogLoading } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const gridRef = useRef<HTMLDivElement | null>(null);
  const drawerPanelRef = useRef<HTMLDivElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);

  const category = searchParams.get('category') || 'All';
  const gender = searchParams.get('gender') || 'All';
  const collection = searchParams.get('collection') || 'All';
  const size = searchParams.get('size') || '';
  const color = searchParams.get('color') || '';
  const tag = searchParams.get('tag') || '';
  const inStockOnly = searchParams.get('inStock') === 'true';
  const maxPrice = searchParams.get('maxPrice') || '';
  const sort = (searchParams.get('sort') || 'featured') as ProductQueryParams['sort'];

  const allColors = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of products) {
      for (const v of p.variants) {
        map.set(v.colorName, v.colorHex);
      }
    }
    return Array.from(map.entries());
  }, [products]);

  const filteredProducts = useMemo(() => {
    return filterAndSortProducts(products, {
      category,
      gender,
      collection,
      size: size || undefined,
      color: color || undefined,
      tag: tag || undefined,
      inStockOnly,
      maxPriceCents: maxPrice ? Number(maxPrice) * 100 : undefined,
      sort,
    });
  }, [products, category, gender, collection, size, color, tag, inStockOnly, maxPrice, sort]);

  // Batch reveal product cards cleanly whenever filter results change
  const filterSignature = `${category}|${gender}|${collection}|${size}|${color}|${tag}|${inStockOnly}|${maxPrice}|${sort}|${filteredProducts.length}`;
  useEffect(() => {
    if (catalogLoading || filteredProducts.length === 0) return;
    return setupBatchCardReveal('.product-card-reveal', gridRef.current);
  }, [catalogLoading, filterSignature, filteredProducts.length]);

  const handleCloseFilters = useCallback(() => {
    if (isReducedMotionPreferred() || !drawerPanelRef.current) {
      setMobileFiltersOpen(false);
      return;
    }
    ensureGsapRegistered();
    gsap.to(drawerPanelRef.current, {
      xPercent: -100,
      duration: MOTION_DURATION.ui,
      ease: MOTION_EASE.exit,
      onComplete: () => setMobileFiltersOpen(false),
    });
    if (backdropRef.current) {
      gsap.to(backdropRef.current, {
        opacity: 0,
        duration: MOTION_DURATION.ui,
      });
    }
  }, []);

  useEffect(() => {
    if (!mobileFiltersOpen) return;
    const unlock = lockBodyScroll();
    const untrap = trapFocusInElement(drawerPanelRef.current);

    if (!isReducedMotionPreferred()) {
      ensureGsapRegistered();
      if (drawerPanelRef.current) {
        gsap.fromTo(
          drawerPanelRef.current,
          { xPercent: -100 },
          { xPercent: 0, duration: MOTION_DURATION.standard, ease: MOTION_EASE.editorial, clearProps: 'transform' }
        );
      }
      if (backdropRef.current) {
        gsap.fromTo(
          backdropRef.current,
          { opacity: 0 },
          { opacity: 1, duration: MOTION_DURATION.standard }
        );
      }
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCloseFilters();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      unlock();
      untrap();
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileFiltersOpen, handleCloseFilters]);

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'All') {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next, { replace: true });
  };

  const clearAllFilters = () => {
    setSearchParams({}, { replace: true });
  };

  const hasActiveFilters =
    category !== 'All' ||
    gender !== 'All' ||
    collection !== 'All' ||
    Boolean(size) ||
    Boolean(color) ||
    Boolean(tag) ||
    inStockOnly ||
    Boolean(maxPrice);

  const FilterPanel = (
    <div className="space-y-8 text-sm">
      <div>
        <h3 className="text-xs uppercase tracking-[0.12em] text-[#8B2635] font-medium mb-3">Category</h3>
        <div className="flex flex-col gap-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => updateParam('category', c)}
              className={`text-left py-2 min-h-[48px] flex items-center transition-colors ${
                category === c
                  ? 'text-[#35151F] font-semibold underline underline-offset-4 decoration-[#8B2635]'
                  : 'text-[#6D595E] hover:text-[#35151F]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs uppercase tracking-[0.12em] text-[#8B2635] font-medium mb-3">Department</h3>
        <div className="flex flex-wrap gap-2">
          {GENDERS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => updateParam('gender', g)}
              className={`min-h-[48px] px-3.5 py-2 rounded-[10px] text-xs font-medium border transition-colors ${
                gender === g
                  ? 'bg-[#35151F] text-[#F5EEE5] border-[#35151F]'
                  : 'bg-[#FFFFFF] text-[#35151F] border-[#35151F]/18 hover:border-[#8B2635]'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs uppercase tracking-[0.12em] text-[#8B2635] font-medium mb-3">Collection</h3>
        <select
          aria-label="Filter by collection"
          value={collection}
          onChange={(e) => updateParam('collection', e.target.value)}
          className="w-full min-h-[48px] bg-[#FFFFFF] border border-[#35151F]/18 rounded-[10px] px-3 py-2 text-xs text-[#35151F]"
        >
          <option value="All">All Collections</option>
          {collections.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <h3 className="text-xs uppercase tracking-[0.12em] text-[#8B2635] font-medium mb-3">Size</h3>
        <div className="grid grid-cols-3 gap-1.5">
          {SIZES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => updateParam('size', size === s ? null : s)}
              className={`min-h-[48px] px-3 py-2 rounded-[10px] text-xs font-medium border transition-colors ${
                size === s
                  ? 'bg-[#35151F] text-[#F5EEE5] border-[#35151F]'
                  : 'bg-[#FFFFFF] text-[#35151F] border-[#35151F]/18 hover:border-[#8B2635]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs uppercase tracking-[0.12em] text-[#8B2635] font-medium mb-3">Color</h3>
        <div className="flex flex-col gap-1">
          {allColors.map(([name, hex]) => (
            <button
              key={name}
              type="button"
              onClick={() => updateParam('color', color === name ? null : name)}
              className={`min-h-[48px] flex items-center gap-2.5 text-xs text-left py-1 ${
                color === name ? 'text-[#35151F] font-semibold' : 'text-[#6D595E] hover:text-[#35151F]'
              }`}
            >
              <span
                className="w-3.5 h-3.5 rounded-full border border-[#35151F]/35 shrink-0"
                style={{ backgroundColor: hex }}
              />
              <span>{name}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs uppercase tracking-[0.12em] text-[#8B2635] font-medium mb-3">Maximum Price</h3>
        <select
          aria-label="Filter by maximum price"
          value={maxPrice}
          onChange={(e) => updateParam('maxPrice', e.target.value || null)}
          className="w-full min-h-[48px] bg-[#FFFFFF] border border-[#35151F]/18 rounded-[10px] px-3 py-2 text-xs text-[#35151F]"
        >
          <option value="">Any Price</option>
          <option value="700">Up to $700</option>
          <option value="1200">Up to $1,200</option>
          <option value="2000">Up to $2,000</option>
        </select>
      </div>

      <label className="min-h-[48px] flex items-center gap-2.5 text-xs text-[#35151F] cursor-pointer">
        <input
          type="checkbox"
          checked={inStockOnly}
          onChange={(e) => updateParam('inStock', e.target.checked ? 'true' : null)}
          className="accent-[#35151F] w-4 h-4"
        />
        <span>In stock only</span>
      </label>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearAllFilters}
          className="w-full min-h-[48px] py-2.5 rounded-[10px] text-xs font-medium border border-[#35151F] text-[#35151F] hover:bg-[#35151F] hover:text-[#F5EEE5] transition-colors"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <div className="bg-[#F5EEE5] min-h-screen">
      <div className="max-w-[1440px] mx-auto px-3 sm:px-8 py-10 md:py-16">
        {/* Breadcrumbs & Editorial Header */}
        <nav aria-label="Breadcrumb" className="text-xs text-[#6D595E] mb-6 flex items-center gap-2">
          <PageTransitionLink to="/" className="hover:text-[#35151F]">Home</PageTransitionLink>
          <span aria-hidden="true">/</span>
          <span className="text-[#35151F]">Shop</span>
          {category !== 'All' && (
            <>
              <span aria-hidden="true">/</span>
              <span className="text-[#8B2635] font-medium">{category}</span>
            </>
          )}
        </nav>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#35151F]/14">
          <div className="space-y-2">
            <h1 className="editorial-section-title text-[#35151F]">
              {tag === 'new-arrival'
                ? 'New Arrivals'
                : gender !== 'All'
                ? `${gender} Wardrobe`
                : category !== 'All'
                ? category
                : 'Complete Catalog'}
            </h1>
            <p className="text-sm text-[#6D595E] tabular-nums">
              {filteredProducts.length} garment{filteredProducts.length === 1 ? '' : 's'} available
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden min-h-[48px] inline-flex items-center gap-2 border border-[#35151F]/20 rounded-[12px] bg-[#FFFFFF] px-4 py-2.5 text-xs font-medium text-[#35151F] hover:border-[#8B2635]"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
            </button>

            <label htmlFor="shop-sort" className="sr-only">
              Sort garments
            </label>
            <select
              id="shop-sort"
              value={sort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="min-h-[48px] bg-[#FFFFFF] border border-[#35151F]/20 rounded-[12px] px-4 py-2.5 text-xs text-[#35151F]"
            >
              <option value="featured">Sort: Featured</option>
              <option value="newest">Sort: Newest</option>
              <option value="best-selling">Sort: Most Requested</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Main Filter + Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 pt-8 sm:pt-10">
          <aside className="hidden lg:block lg:col-span-3 pr-6 border-r border-[#35151F]/14">
            {FilterPanel}
          </aside>

          <div className="lg:col-span-9">
            {catalogLoading ? (
              <div className="grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5 lg:gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-20 text-center border border-[#35151F]/14 rounded-[18px] bg-[#FFFFFF] p-8 space-y-4 shadow-[0_8px_24px_-10px_rgba(53,21,31,0.08)]">
                <h2 className="font-display text-3xl text-[#35151F]">
                  No garments match these selections
                </h2>
                <p className="text-sm text-[#6D595E] max-w-md mx-auto">
                  Try widening your size, color, or price filters to inspect the full seasonal delivery.
                </p>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="min-h-[48px] bg-[#35151F] text-[#F5EEE5] rounded-[12px] px-6 py-3 text-xs font-medium uppercase tracking-wide hover:bg-[#8B2635] transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div
                ref={gridRef}
                className="grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5 lg:gap-6"
              >
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFiltersOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filter catalog"
          className="fixed inset-0 z-50 flex lg:hidden"
        >
          <div
            ref={backdropRef}
            className="fixed inset-0 bg-[#1D0A10]/60"
            onClick={handleCloseFilters}
          />
          <div
            ref={drawerPanelRef}
            className="relative z-10 w-80 max-w-full bg-[#F5EEE5] h-full overflow-y-auto p-6 border-r border-[#35151F]/16"
          >
            <div className="flex items-center justify-between border-b border-[#35151F]/14 pb-4 mb-6">
              <h2 className="font-display text-2xl text-[#35151F]">Filter Catalog</h2>
              <button
                type="button"
                onClick={handleCloseFilters}
                aria-label="Close filters"
                className="min-h-[48px] min-w-[48px] flex items-center justify-center text-[#35151F]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {FilterPanel}
          </div>
        </div>
      )}
    </div>
  );
}

