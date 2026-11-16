import { ArrowRight } from 'lucide-react';
import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { isReducedMotionPreferred } from '../../animations/core/animation-context';
import { ensureGsapRegistered, gsap } from '../../animations/core/gsap-config';
import { MOTION_DURATION, MOTION_EASE, MOTION_STAGGER } from '../../animations/core/motion-tokens';
import { MagneticButton } from '../../animations/components/MagneticButton';
import { PageTransitionLink } from '../../animations/components/PageTransitionLink';
import { setupScrollLinkedValue } from '../../animations/scroll/parallax';
import { HeroSculptureCanvas } from '../../three/HeroSculptureCanvas';
import { LuxuryImage } from '../ui/LuxuryImage';

export function HeroSection() {
  const containerRef = useRef<HTMLElement | null>(null);
  const scrollProgressRef = useRef<number>(0);

  useGSAP(
    () => {
      const scope = containerRef.current;
      if (!scope || isReducedMotionPreferred()) return;
      ensureGsapRegistered();

      const tl = gsap.timeline({ defaults: { ease: MOTION_EASE.editorial } });

      // 01. Initial background & border poise
      tl.fromTo(
        scope,
        { opacity: 0.92 },
        { opacity: 1, duration: 0.3, ease: MOTION_EASE.hover }
      )
        // 02. Collection label reveal
        .fromTo(
          '.hero-label',
          { y: 12, opacity: 0 },
          { y: 0, opacity: 1, duration: MOTION_DURATION.standard * 0.7, clearProps: 'transform,opacity' },
          0.05
        )
        // 03. Main headline line-by-line mask reveal
        .fromTo(
          '.hero-line-inner',
          { yPercent: 108, opacity: 0 },
          {
            yPercent: 0,
            opacity: 1,
            duration: MOTION_DURATION.editorial,
            stagger: MOTION_STAGGER.editorial,
            clearProps: 'transform,opacity',
          },
          0.12
        )
        // 04. Supporting copy fade & rise
        .fromTo(
          '.hero-copy',
          { y: 16, opacity: 0 },
          { y: 0, opacity: 1, duration: MOTION_DURATION.standard, clearProps: 'transform,opacity' },
          0.28
        )
        // 05. Dual CTAs & metadata strip stagger
        .fromTo(
          '.hero-cta-item',
          { y: 14, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: MOTION_DURATION.standard * 0.85,
            stagger: MOTION_STAGGER.cards,
            clearProps: 'transform,opacity',
          },
          0.36
        )
        // 06. Fashion editorial image rounded clip-path reveal
        .fromTo(
          '.hero-photo-frame',
          { clipPath: 'inset(10% 0% 0% 0% round 16px)', opacity: 0.65, scale: 1.04 },
          {
            clipPath: 'inset(0% 0% 0% 0% round 16px)',
            opacity: 1,
            scale: 1,
            duration: MOTION_DURATION.hero * 0.85,
            clearProps: 'clipPath,transform,opacity',
          },
          0.18
        )
        // 07. 3D sculpture gentle entrance
        .fromTo(
          '.hero-3d-wrap',
          { opacity: 0, scale: 0.92, y: 12 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: MOTION_DURATION.editorial,
            clearProps: 'transform,opacity',
          },
          0.42
        );

      const cleanScroll = setupScrollLinkedValue(scope, (p) => {
        scrollProgressRef.current = p;
      });

      return () => cleanScroll();
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      className="bg-[#F5EEE5] text-[#35151F] border-b border-[#35151F]/14 overflow-hidden"
    >
      <div className="max-w-[1440px] mx-auto px-3 sm:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          {/* Left Editorial Column */}
          <div className="lg:col-span-6 flex flex-col justify-between py-2 lg:py-4">
            <div className="space-y-5 md:space-y-6">
              <p className="hero-label text-xs tracking-[0.14em] uppercase text-[#8B2635] font-medium">
                Ali &amp; Ferhad · Autumn / Winter 2026
              </p>

              <h1
                className="editorial-hero-title text-[#35151F]"
                aria-label="Form beyond the ordinary."
              >
                <span aria-hidden="true" className="block overflow-hidden">
                  <span className="hero-line-inner block">Form beyond</span>
                </span>
                <span aria-hidden="true" className="block overflow-hidden">
                  <span className="hero-line-inner block">the ordinary.</span>
                </span>
              </h1>

              <p className="hero-copy text-base md:text-lg text-[#6D595E] max-w-md leading-relaxed">
                Futuristic minimalism sculpted in Mongolian cashmere, brushed virgin wool, and fluid mulberry silk. Quiet precision designed to move effortlessly through space.
              </p>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2">
                <div className="hero-cta-item">
                  <MagneticButton>
                    <PageTransitionLink
                      to="/collections/autumn-architecture"
                      className="inline-flex items-center gap-3 min-h-[48px] bg-[#35151F] text-[#F5EEE5] rounded-[12px] px-7 py-3.5 text-xs font-medium tracking-[0.08em] uppercase hover:bg-[#8B2635] transition-colors whitespace-nowrap shrink-0"
                    >
                      Explore Collection <ArrowRight className="w-4 h-4" />
                    </PageTransitionLink>
                  </MagneticButton>
                </div>
                <div className="hero-cta-item">
                  <MagneticButton strength={0.14}>
                    <PageTransitionLink
                      to="/shop"
                      className="inline-flex items-center gap-2 min-h-[48px] border border-[#35151F]/25 bg-[#FFFFFF] text-[#35151F] rounded-[12px] px-7 py-3.5 text-xs font-medium tracking-[0.08em] uppercase hover:border-[#8B2635] hover:text-[#8B2635] transition-colors whitespace-nowrap shrink-0"
                    >
                      Shop All Pieces
                    </PageTransitionLink>
                  </MagneticButton>
                </div>
              </div>
            </div>

            <div className="hero-cta-item pt-6 mt-6 lg:mt-8 border-t border-[#35151F]/14 grid grid-cols-3 gap-4 sm:gap-6 max-w-lg text-xs">
              <div>
                <p className="text-[#6D595E]">Materials</p>
                <p className="mt-1 text-[#35151F] font-medium">Natural Fibres</p>
              </div>
              <div>
                <p className="text-[#6D595E]">Silhouettes</p>
                <p className="mt-1 text-[#35151F] font-medium">Unlined Drape</p>
              </div>
              <div>
                <p className="text-[#6D595E]">Dispatch</p>
                <p className="mt-1 text-[#35151F] font-medium">Insured Worldwide</p>
              </div>
            </div>
          </div>

          {/* Right Hybrid Fashion Photo + Kinetic Silk & Titanium 3D Sculpture */}
          <div className="lg:col-span-6 relative min-h-[400px] lg:min-h-[540px] lg:max-h-[600px]">
            <div className="hero-photo-frame relative w-full h-full aspect-[4/5] lg:aspect-auto rounded-[18px] overflow-hidden border border-[#35151F]/14 bg-[#EAE0D2]">
              <LuxuryImage
                src="/src/assets/images/hero_ali_ferhad_editorial_1794843179383.jpg"
                alt="Model wearing Ali & Ferhad ivory wool-cashmere coat and tailored stone trousers inside a travertine gallery"
                loading="eager"
                className="w-full h-full object-cover object-top"
              />
              <div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#35151F]/45 to-transparent pointer-events-none"
              />
            </div>

            {/* Complementary 3D sculptural accent */}
            <div
              className="hero-3d-wrap hidden sm:block absolute -left-8 lg:-left-12 bottom-6 w-48 h-48 lg:w-56 lg:h-56 pointer-events-none"
              aria-hidden="true"
            >
              <HeroSculptureCanvas scrollProgressRef={scrollProgressRef} />
            </div>

            {/* Floating Featured Piece Card */}
            <div className="hero-cta-item absolute bottom-4 right-4 left-4 sm:left-auto rounded-[14px] bg-[#FFFFFF]/95 border border-[#35151F]/16 shadow-[0_12px_28px_-10px_rgba(53,21,31,0.22)]">
              <PageTransitionLink
                to="/products/double-faced-ivory-cashmere-coat"
                imageUrl="/src/assets/images/product_coat_ivory_1794838444893.jpg"
                imageAlt="Double-Faced Cashmere Coat"
                className="min-h-[48px] px-4 py-2.5 flex items-center justify-between gap-4 text-xs text-[#35151F] hover:text-[#8B2635] transition-colors"
              >
                <div className="min-w-0">
                  <span className="block text-[10px] uppercase tracking-[0.12em] text-[#8B2635] font-medium">
                    Limited Edition
                  </span>
                  <span className="font-medium truncate block">
                    Double-Faced Cashmere Coat · $1,850
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </PageTransitionLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
