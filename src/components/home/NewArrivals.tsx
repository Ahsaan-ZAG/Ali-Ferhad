import { ArrowRight } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { AnimatedText } from '../../animations/components/AnimatedText';
import { PageTransitionLink } from '../../animations/components/PageTransitionLink';
import { ScrollReveal } from '../../animations/components/ScrollReveal';
import { setupBatchCardReveal } from '../../animations/scroll/reveal';
import { useStore } from '../../context/StoreContext';
import { PromotionalFeatureCard } from '../cards/PromotionalFeatureCard';
import { ProductCard, ProductCardSkeleton } from '../product/ProductCard';

export function NewArrivals() {
  const { products, catalogLoading } = useStore();
  const gridRef = useRef<HTMLDivElement | null>(null);
  const arrivals = products.filter((p) => p.isNewArrival).slice(0, 4);

  useEffect(() => {
    if (!arrivals.length) return;
    return setupBatchCardReveal('.product-card-reveal', gridRef.current);
  }, [arrivals.length]);

  return (
    <section className="bg-[#FFFFFF] text-[#35151F] py-16 md:py-24 border-b border-[#35151F]/12">
      <div className="max-w-[1440px] mx-auto px-3 sm:px-8 space-y-10 md:space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-[#35151F]/14">
          <div className="space-y-3">
            <ScrollReveal>
              <p className="text-xs uppercase tracking-[0.14em] text-[#8B2635] font-medium">
                Season 01 · Just Entered
              </p>
            </ScrollReveal>
            <AnimatedText
              lines={['New Arrivals']}
              as="h2"
              className="editorial-section-title text-[#35151F]"
            />
          </div>
          <ScrollReveal delay={0.08}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <p className="text-sm text-[#6D595E] max-w-sm leading-relaxed">
                Recently released coats, structured suiting, and bias-cut silk pieces from the Autumn Architecture delivery.
              </p>
              <PageTransitionLink
                to="/shop?tag=new-arrival"
                className="inline-flex items-center gap-2 min-h-[48px] px-4 text-xs font-medium uppercase tracking-[0.1em] text-[#35151F] border border-[#35151F]/20 rounded-[10px] hover:bg-[#35151F] hover:text-[#F5EEE5] transition-colors whitespace-nowrap shrink-0"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </PageTransitionLink>
            </div>
          </ScrollReveal>
        </div>

        {/* New Arrivals Promotional Lead Card */}
        <PromotionalFeatureCard
          kind="new-arrivals"
          layout="split"
          eyebrow="New Arrivals · Delivery 01"
          title="Sculpted Outerwear & Liquid Silk"
          description="Uncovered edges, double-faced Inner Mongolian cashmere, and bias-cut mulberry charmeuse cut in limited first-edition runs."
          metaNote="Complimentary insured courier over $1,000"
          ctaLabel="Explore New Delivery"
          to="/shop?tag=new-arrival"
          imageUrl="/src/assets/images/product_obsidian_overcoat_1794843180682.jpg"
          imageAlt="Obsidian wool-cashmere tailored overcoat from Ali & Ferhad New Arrivals"
        />

        {catalogLoading && arrivals.length === 0 ? (
          <div className="grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
            {[1, 2, 3, 4].map((n) => (
              <ProductCardSkeleton key={n} />
            ))}
          </div>
        ) : (
          <div
            ref={gridRef}
            className="grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6"
          >
            {arrivals.map((product, idx) => (
              <ProductCard
                key={product.id}
                product={product}
                variant={idx === 0 ? 'featured' : 'editorial'}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
