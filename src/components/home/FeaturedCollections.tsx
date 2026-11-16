import { useEffect, useRef } from 'react';
import { AnimatedText } from '../../animations/components/AnimatedText';
import { ScrollReveal } from '../../animations/components/ScrollReveal';
import { setupBatchCardReveal } from '../../animations/scroll/reveal';
import { useStore } from '../../context/StoreContext';
import { CollectionEditorialCard } from '../cards/CollectionEditorialCard';
import { PromotionalFeatureCard } from '../cards/PromotionalFeatureCard';

export function FeaturedCollections() {
  const { collections, products } = useStore();
  const gridRef = useRef<HTMLDivElement | null>(null);
  const promoGridRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!collections.length) return;
    const cleanCols = setupBatchCardReveal('.collection-chapter-card', gridRef.current);
    const cleanPromos = setupBatchCardReveal('.promo-card-reveal', promoGridRef.current);
    return () => {
      cleanCols();
      cleanPromos();
    };
  }, [collections.length]);

  return (
    <section
      id="featured-collections"
      className="bg-[#F5EEE5] text-[#35151F] py-16 md:py-24 border-b border-[#35151F]/12"
    >
      <div className="max-w-[1440px] mx-auto px-3 sm:px-8 space-y-14">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-[#35151F]/14">
          <div className="space-y-3">
            <ScrollReveal>
              <p className="text-xs uppercase tracking-[0.14em] text-[#8B2635] font-medium">
                Curated Chapters
              </p>
            </ScrollReveal>
            <AnimatedText
              lines={['Featured Collections']}
              as="h2"
              className="editorial-section-title text-[#35151F]"
            />
          </div>
          <ScrollReveal delay={0.08}>
            <p className="text-sm text-[#6D595E] max-w-sm leading-relaxed">
              Three focused studies in proportion, monochrome layering, and natural fibre density.
            </p>
          </ScrollReveal>
        </div>

        {/* Collection Editorial Cards */}
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
          {collections.map((col, idx) => {
            const pieceCount = products.filter((p) => p.collectionSlug === col.slug).length;
            return (
              <CollectionEditorialCard
                key={col.id}
                collection={col}
                index={idx}
                variant={idx === 1 ? 'campaign-dark' : 'editorial-light'}
                pieceCount={pieceCount}
              />
            );
          })}
        </div>

        {/* Distinct Promotional Card Quartet: Limited Editions, Special Offers, Seasonal Collections, Featured Products */}
        <div className="pt-4 space-y-6">
          <div className="flex items-center justify-between border-b border-[#35151F]/12 pb-4">
            <p className="text-xs uppercase tracking-[0.14em] text-[#8B2635] font-medium">
              Atelier Privileges &amp; Seasonal Studies
            </p>
            <p className="text-xs text-[#6D595E] hidden sm:block">
              Curated releases &amp; private client privileges
            </p>
          </div>

          <div
            ref={promoGridRef}
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6"
          >
            <PromotionalFeatureCard
              kind="limited-editions"
              layout="spotlight"
              eyebrow="Limited Editions"
              title="Numbered Cashmere Runs"
              description="Hand-linked 620gsm Inner Mongolian cashmere coats crafted in small, unrepeated seasonal batches."
              metaNote="Limited Quantities Remaining"
              ctaLabel="View Limited Pieces"
              to="/products/double-faced-ivory-cashmere-coat"
              imageUrl="/src/assets/images/product_coat_ivory_1794838444893.jpg"
              imageAlt="Double-faced ivory cashmere coat limited edition"
            />
            <PromotionalFeatureCard
              kind="special-offers"
              layout="spotlight"
              eyebrow="Special Offers"
              title="Private Client Privilege"
              description="Enjoy 10% courtesy savings on tailored suiting & trench acquisitions using code ATELIER10 at checkout."
              metaNote="Code: ATELIER10 · Over $500"
              ctaLabel="Shop Privilege Pieces"
              to="/shop?category=Tailoring"
              imageUrl="/src/assets/images/product_blazer_charcoal_1794838444370.jpg"
              imageAlt="Virgin wool architectural blazer special privilege offer"
            />
            <PromotionalFeatureCard
              kind="seasonal-collections"
              layout="spotlight"
              eyebrow="Seasonal Collection"
              title="Autumn Architecture ’26"
              description="High-twist virgin wool trousers and structured outer shells designed for effortless transitional layering."
              metaNote="Autumn / Winter 2026"
              ctaLabel="Enter Chapter"
              to="/collections/autumn-architecture"
              imageUrl="/src/assets/images/product_charcoal_trousers_1794843181748.jpg"
              imageAlt="Autumn Architecture tailored charcoal trousers"
            />
            <PromotionalFeatureCard
              kind="featured-products"
              layout="spotlight"
              eyebrow="Featured Silhouette"
              title="Storm Gabardine Trench"
              description="Organic long-staple cotton gabardine paired with carved buffalo horn buttons and brushed champagne clasps."
              metaNote="Now $1,480 · Was $1,680"
              ctaLabel="Inspect Piece"
              to="/products/storm-gabardine-belted-trench"
              imageUrl="/src/assets/images/product_trench_sand_1794838446020.jpg"
              imageAlt="Storm gabardine belted trench coat featured product"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
