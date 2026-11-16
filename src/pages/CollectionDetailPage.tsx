import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AnimatedText } from '../animations/components/AnimatedText';
import { PageTransitionLink } from '../animations/components/PageTransitionLink';
import { ScrollReveal } from '../animations/components/ScrollReveal';
import { setupBatchCardReveal } from '../animations/scroll/reveal';
import { ProductCard } from '../components/product/ProductCard';
import { LuxuryImage } from '../components/ui/LuxuryImage';
import { useStore } from '../context/StoreContext';
import { filterAndSortProducts, ProductQueryParams } from '../lib/commerce';

export function CollectionDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { collections, products } = useStore();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sort, setSort] = useState<ProductQueryParams['sort']>('featured');
  const gridRef = useRef<HTMLDivElement | null>(null);

  const collection = collections.find((c) => c.slug === slug);

  const collectionProducts = useMemo(() => {
    return filterAndSortProducts(products, {
      collection: slug,
      category: selectedCategory,
      sort,
    });
  }, [products, slug, selectedCategory, sort]);

  useEffect(() => {
    if (!collectionProducts.length) return;
    return setupBatchCardReveal('.product-card-reveal', gridRef.current);
  }, [collectionProducts.length, slug, selectedCategory, sort]);

  if (!collection) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-24 text-center space-y-4">
        <h1 className="editorial-section-title text-[#111111]">Collection not found</h1>
        <PageTransitionLink to="/shop" className="inline-block underline text-sm">
          Return to Complete Catalog
        </PageTransitionLink>
      </div>
    );
  }

  const categories = ['All', ...Array.from(new Set(products.filter((p) => p.collectionSlug === slug).map((p) => p.category)))];

  return (
    <div className="bg-[#F5EEE5] min-h-screen">
      {/* Collection Editorial Banner */}
      <section className="bg-[#35151F] text-[#F5EEE5] border-b border-[#D6B88C]/20">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-8 py-14 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-5">
            <ScrollReveal>
              <p className="text-xs uppercase tracking-[0.14em] text-[#D6B88C]">
                {collection.season}
              </p>
            </ScrollReveal>
            <AnimatedText
              lines={[collection.title]}
              as="h1"
              triggerOnScroll={false}
              className="editorial-hero-title text-[#F5EEE5]"
            />
            <ScrollReveal delay={0.08}>
              <p className="text-base text-[#F5EEE5]/85 leading-relaxed max-w-xl">
                {collection.description}
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.14}>
              <p className="text-xs text-[#D6B88C]/80">{collection.editorialNote}</p>
            </ScrollReveal>

            {/* Directional Collection Navigation */}
            {collections.length > 1 && (
              <div className="pt-4 flex flex-wrap items-center gap-4 border-t border-[#D6B88C]/20 text-xs">
                <span className="uppercase tracking-[0.12em] text-[#D6B88C]/75">Editions:</span>
                {collections.map((c) => (
                  <PageTransitionLink
                    key={c.slug}
                    to={`/collections/${c.slug}`}
                    transitionStyle="directional"
                    className={`py-1 border-b transition-colors ${
                      c.slug === slug
                        ? 'text-[#FFFFFF] border-[#D6B88C]'
                        : 'text-[#F5EEE5]/65 border-transparent hover:text-[#D6B88C]'
                    }`}
                  >
                    {c.title}
                  </PageTransitionLink>
                ))}
              </div>
            )}
          </div>
          <div className="lg:col-span-6">
            <ScrollReveal
              variant="clip-curtain"
              className="aspect-[4/3] rounded-[18px] overflow-hidden border border-[#D6B88C]/28 bg-[#240D14]"
            >
              <LuxuryImage
                src={collection.heroImage}
                alt={collection.title}
                loading="eager"
                className="w-full h-full object-cover"
              />
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Collection Product Grid */}
      <section className="max-w-[1440px] mx-auto px-3 sm:px-8 py-12 md:py-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-[#35151F]/14">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`min-h-[48px] px-4 py-2 rounded-[10px] text-xs font-medium border transition-colors ${
                  selectedCategory === cat
                    ? 'bg-[#35151F] text-[#F5EEE5] border-[#35151F]'
                    : 'bg-[#FFFFFF] text-[#35151F] border-[#35151F]/18 hover:border-[#8B2635]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-[#6D595E] tabular-nums">
              {collectionProducts.length} piece(s)
            </span>
            <select
              aria-label="Sort collection garments"
              value={sort}
              onChange={(e) => setSort(e.target.value as ProductQueryParams['sort'])}
              className="min-h-[48px] bg-[#FFFFFF] border border-[#35151F]/18 rounded-[10px] px-3.5 py-2 text-xs text-[#35151F]"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        <div
          ref={gridRef}
          className="grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6 pt-10"
        >
          {collectionProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}

