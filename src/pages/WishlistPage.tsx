import { useEffect, useRef } from 'react';
import { PageTransitionLink } from '../animations/components/PageTransitionLink';
import { setupBatchCardReveal } from '../animations/scroll/reveal';
import { ProductCard } from '../components/product/ProductCard';
import { useStore } from '../context/StoreContext';

export function WishlistPage() {
  const { products, wishlistIds } = useStore();
  const gridRef = useRef<HTMLDivElement | null>(null);

  const savedProducts = products.filter((p) => wishlistIds.includes(p.id));

  useEffect(() => {
    if (!savedProducts.length) return;
    return setupBatchCardReveal('.product-card-reveal', gridRef.current);
  }, [savedProducts.length]);

  return (
    <div className="bg-[#F5EEE5] min-h-screen py-12 md:py-20">
      <div className="max-w-[1440px] mx-auto px-3 sm:px-8">
        <div className="pb-8 border-b border-[#35151F]/14 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[#8B2635] font-medium">
              Personal Curation
            </p>
            <h1 className="editorial-section-title text-[#35151F] mt-2">Saved Pieces</h1>
          </div>
          <p className="text-xs text-[#6D595E] tabular-nums">
            {savedProducts.length} saved garment(s)
          </p>
        </div>

        {savedProducts.length === 0 ? (
          <div className="my-12 py-16 px-6 rounded-[18px] bg-[#FFFFFF] border border-[#35151F]/14 text-center space-y-4 max-w-xl mx-auto shadow-[0_8px_24px_-10px_rgba(53,21,31,0.08)]">
            <h2 className="font-display text-3xl text-[#35151F]">
              Your saved wardrobe is empty
            </h2>
            <p className="text-sm text-[#6D595E] max-w-md mx-auto">
              Select the heart control on any silhouette across the storefront to curate pieces here for future reference.
            </p>
            <PageTransitionLink
              to="/shop"
              className="inline-flex items-center justify-center min-h-[48px] bg-[#35151F] text-[#F5EEE5] rounded-[12px] px-7 py-3.5 text-xs font-medium uppercase tracking-[0.1em] hover:bg-[#8B2635] transition-colors"
            >
              Browse Catalog
            </PageTransitionLink>
          </div>
        ) : (
          <div
            ref={gridRef}
            className="grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6 pt-10"
          >
            {savedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
