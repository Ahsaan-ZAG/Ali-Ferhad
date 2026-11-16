import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { AnimatedText } from '../../animations/components/AnimatedText';
import { PageTransitionLink } from '../../animations/components/PageTransitionLink';
import { ScrollReveal } from '../../animations/components/ScrollReveal';
import { setupScrollLinkedValue } from '../../animations/scroll/parallax';
import type { StudyModeId } from '../../three/EditorialSculptureCanvas';

const EditorialSculptureCanvas = lazy(() =>
  import('../../three/EditorialSculptureCanvas').then((m) => ({
    default: m.EditorialSculptureCanvas,
  }))
);

const STUDY_COPY: Record<
  StudyModeId,
  {
    eyebrow: string;
    heading: string;
    body: string;
    linkLabel: string;
    linkTo: string;
    linkImg: string;
  }
> = {
  drape: {
    eyebrow: 'Spatial Material Study · 01',
    heading: 'The Draped Form.',
    body: 'Before a pattern is cut in wool or mulberry silk, Ali & Ferhad studies how bias tension, fluid folds, and brushed titanium hardware balance weight around the body. Drag across the 3D form or switch finishes below.',
    linkLabel: 'Bias-Cut Silk Dress →',
    linkTo: '/products/bias-cut-mulberry-silk-slip-dress',
    linkImg: '/src/assets/images/product_silk_dress_taupe_1794838444725.jpg',
  },
  clasp: {
    eyebrow: 'Hardware Architecture · 02',
    heading: 'Sculpted Bag & Clasp.',
    body: 'Engineered from beveled champagne titanium and saddlery leather curves, our custom turn-lock hardware pairs geometric clarity with tactile precision—designed to anchor tailored outerwear.',
    linkLabel: 'Storm Gabardine Trench →',
    linkTo: '/products/storm-gabardine-belted-trench',
    linkImg: '/src/assets/images/product_trench_sand_1794838446020.jpg',
  },
  eyewear: {
    eyebrow: 'Optical Silhouette · 03',
    heading: 'Architectural Eyewear.',
    body: 'Contoured beveled rims meet a dual brushed-titanium nose bridge and smoked optical lenses. Inspect the sculpted temple geometry and light refraction across three house surface treatments.',
    linkLabel: 'Atelier Tailoring Collection →',
    linkTo: '/collections/autumn-architecture',
    linkImg: '/src/assets/images/editorial_atelier_silhouette_1794843182133.jpg',
  },
};

export function ThreeDEditorial() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const scrollProgressRef = useRef<number>(0);
  const [activeStudy, setActiveStudy] = useState<StudyModeId>('drape');

  useEffect(() => {
    return setupScrollLinkedValue(sectionRef.current, (p) => {
      scrollProgressRef.current = p;
    });
  }, []);

  const info = STUDY_COPY[activeStudy];

  return (
    <section
      ref={sectionRef}
      data-testid="three-editorial-section"
      className="bg-[#35151F] text-[#F5EEE5] py-16 md:py-24 border-b border-[#D6B88C]/20"
    >
      <div className="max-w-[1440px] mx-auto px-3 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6">
            <ScrollReveal>
              <p className="text-xs uppercase tracking-[0.14em] text-[#D6B88C]">
                {info.eyebrow}
              </p>
            </ScrollReveal>
            <AnimatedText
              key={activeStudy}
              lines={[info.heading]}
              as="h2"
              triggerOnScroll={false}
              className="editorial-section-title text-[#F5EEE5]"
            />
            <ScrollReveal delay={0.08}>
              <p className="text-base text-[#F5EEE5]/82 leading-relaxed">
                {info.body}
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.14}>
              <div className="pt-3 border-t border-[#D6B88C]/25 grid grid-cols-2 gap-6 text-xs">
                <div>
                  <p className="text-[#D6B88C]/75">Interactive Gesture</p>
                  <p className="mt-1 text-[#F5EEE5]">Drag to orbit · Switch studies</p>
                </div>
                <div>
                  <p className="text-[#D6B88C]/75">Related Piece</p>
                  <PageTransitionLink
                    to={info.linkTo}
                    imageUrl={info.linkImg}
                    imageAlt={info.heading}
                    className="mt-1 inline-block text-[#D6B88C] hover:underline"
                  >
                    {info.linkLabel}
                  </PageTransitionLink>
                </div>
              </div>
            </ScrollReveal>
          </div>

          <div className="lg:col-span-7 bg-[#1D0A10] border border-[#D6B88C]/28 rounded-[18px] overflow-hidden shadow-[0_18px_42px_-14px_rgba(14,4,8,0.48)]">
            <Suspense
              fallback={
                <div className="h-[460px] md:h-[540px] flex items-center justify-center text-xs text-[#D6B88C]">
                  Preparing 3D studio study...
                </div>
              }
            >
              <EditorialSculptureCanvas
                scrollProgressRef={scrollProgressRef}
                studyMode={activeStudy}
                onStudyChange={setActiveStudy}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  );
}
