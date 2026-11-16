import { ArrowRight } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { AnimatedText } from '../../animations/components/AnimatedText';
import { PageTransitionLink } from '../../animations/components/PageTransitionLink';
import { ScrollReveal } from '../../animations/components/ScrollReveal';
import { setupEditorialPinnedStory } from '../../animations/scroll/pinned-sections';
import { LuxuryImage } from '../ui/LuxuryImage';

export function BrandStory() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const mediaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return setupEditorialPinnedStory(sectionRef.current, mediaRef.current, '.story-beat');
  }, []);

  return (
    <section
      ref={sectionRef}
      className="bg-[#FFFFFF] text-[#35151F] py-16 md:py-28 border-b border-[#35151F]/12"
    >
      <div className="max-w-[1440px] mx-auto px-3 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          <div className="lg:col-span-6">
            <ScrollReveal variant="clip-curtain">
              <div
                ref={mediaRef}
                className="aspect-[4/3] rounded-[18px] overflow-hidden border border-[#35151F]/14 bg-[#EAE0D2] shadow-[0_8px_24px_-10px_rgba(53,21,31,0.1)]"
              >
                <LuxuryImage
                  src="/src/assets/images/editorial_atelier_silhouette_1794843182133.jpg"
                  alt="Ali & Ferhad atelier form draped in ivory silk and charcoal wool alongside precision brushed titanium eyewear"
                  className="w-full h-full object-cover"
                />
              </div>
            </ScrollReveal>
          </div>

          <div className="lg:col-span-6 space-y-6 lg:pl-8">
            <p className="story-beat text-xs uppercase tracking-[0.14em] text-[#8B2635] font-medium">
              Ali &amp; Ferhad Atelier
            </p>
            <AnimatedText
              lines={['Cut for movement,', 'finished to endure.']}
              as="h2"
              className="editorial-section-title text-[#35151F]"
            />
            <p className="story-beat text-base text-[#35151F]/85 leading-relaxed">
              Every silhouette begins with cloth weight and seam balance rather than seasonal ornament. We work in small batches using undyed ivory cashmere, high-twist virgin wool, and 30-momme mulberry silk—allowing drape, proportion, and hand-finishing to speak plainly.
            </p>
            <p className="story-beat text-sm text-[#6D595E] leading-relaxed">
              No synthetic shortcuts, no loud insignia, and no fabricated scarcity—only garments conceived to remain relevant in a working wardrobe for years.
            </p>
            <div className="story-beat pt-3">
              <PageTransitionLink
                to="/about"
                className="inline-flex items-center gap-2 min-h-[48px] px-5 border border-[#35151F]/22 rounded-[10px] text-xs font-medium uppercase tracking-[0.1em] text-[#35151F] hover:bg-[#35151F] hover:text-[#F5EEE5] transition-colors"
              >
                Discover Our Story <ArrowRight className="w-3.5 h-3.5" />
              </PageTransitionLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
