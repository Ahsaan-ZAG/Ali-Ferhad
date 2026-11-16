import { ArrowRight } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { AnimatedText } from '../../animations/components/AnimatedText';
import { PageTransitionLink } from '../../animations/components/PageTransitionLink';
import { ScrollReveal } from '../../animations/components/ScrollReveal';
import { setupBatchCardReveal } from '../../animations/scroll/reveal';
import { useStore } from '../../context/StoreContext';
import { PromotionalFeatureCard } from '../cards/PromotionalFeatureCard';
import { ProductCard } from '../product/ProductCard';

export function BestSellers() {
  const { products } = useStore();
  const gridRef = useRef<HTMLDivElement | null>(null);
  const bestSellers = [...products]
    .filter((p) => p.isBestSeller || p.salesCount > 0)
    .sort((a, b) => b.salesCount - a.salesCount)
    .slice(0, 4);

  useEffect(() => {
    if (!bestSellers.length) return;
    return setupBatchCardReveal('.product-card-reveal', gridRef.current);
  }, [bestSellers.length]);

  return (
    <section className="bg-[#FAF6F0] text-[#35151F] py-16 md:py-24 border-b border-[#35151F]/12">
      <div className="max-w-[1440px] mx-auto px-3 sm:px-8 space-y-10 md:space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-[#35151F]/14">
          <div className="space-y-3">
            <ScrollReveal>
              <p className="text-xs uppercase tracking-[0.14em] text-[#8B2635] font-medium">
                Client Favorites · Verified Sales Order
              </p>
            </ScrollReveal>
            <AnimatedText
              lines={['Most Requested Pieces']}
              as="h2"
              className="editorial-section-title text-[#35151F]"
            />
          </div>
          <ScrollReveal delay={0.08}>
            <PageTransitionLink
              to="/shop?sort=best-selling"
              className="inline-flex items-center gap-2 min-h-[48px] px-4 text-xs font-medium uppercase tracking-[0.1em] text-[#35151F] border border-[#35151F]/20 rounded-[10px] hover:bg-[#35151F] hover:text-[#F5EEE5] transition-colors whitespace-nowrap shrink-0"
            >
              View All Products <ArrowRight className="w-3.5 h-3.5" />
            </PageTransitionLink>
          </ScrollReveal>
        </div>

        {/* Best Sellers Split Editorial Feature */}
        <PromotionalFeatureCard
          kind="best-sellers"
          layout="split"
          eyebrow="Best Sellers · Permanent Wardrobe"
          title="Most Requested Atelier Icons"
          description="Enduring silhouettes ordered most frequently by private clients—five-gauge merino knitwear, unlined cashmere outerwear, and super 130s virgin wool suiting."
          metaNote="Verified Atelier Client Ranking"
          ctaLabel="Shop Most Requested"
          to="/shop?sort=best-selling"
          imageUrl="/src/assets/images/collection_tactile_essentials_1794843181616.jpg"
          imageAlt="Tactile Essentials knitwear, gabardine, and champagne metal hardware"
        />

        <div
          ref={gridRef}
          className="grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6"
        >
          {bestSellers.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
