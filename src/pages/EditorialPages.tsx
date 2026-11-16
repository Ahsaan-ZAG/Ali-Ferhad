import { useState } from 'react';
import { AnimatedText } from '../animations/components/AnimatedText';
import { MagneticButton } from '../animations/components/MagneticButton';
import { PageTransitionLink } from '../animations/components/PageTransitionLink';
import { ScrollReveal } from '../animations/components/ScrollReveal';
import { LuxuryImage } from '../components/ui/LuxuryImage';
import { BRAND_CONFIG } from '../config/brand';
import { useStore } from '../context/StoreContext';

export function AboutPage() {
  return (
    <div className="bg-[#F5EEE5] min-h-screen py-14 md:py-24 text-[#35151F]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 space-y-16">
        <div className="max-w-3xl space-y-6">
          <ScrollReveal>
            <p className="text-xs uppercase tracking-[0.14em] text-[#8B2635]">House Philosophy</p>
          </ScrollReveal>
          <AnimatedText
            lines={['Proportion before', 'ornament.']}
            as="h1"
            triggerOnScroll={false}
            className="editorial-hero-title text-[#35151F]"
          />
          <ScrollReveal delay={0.1}>
            <p className="text-base md:text-lg text-[#35151F]/85 leading-relaxed">
              {BRAND_CONFIG.statement}
            </p>
          </ScrollReveal>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <ScrollReveal
              variant="clip-curtain"
              className="aspect-[4/5] rounded-[20px] overflow-hidden border border-[#35151F]/14 bg-[#EFE4D6] shadow-[var(--card-shadow-subtle)]"
            >
              <LuxuryImage
                src="/src/assets/images/editorial_atelier_silhouette_1794843182133.jpg"
                alt="Ali & Ferhad architectural dress form and eyewear atelier study"
                loading="eager"
                className="w-full h-full object-cover object-top"
              />
            </ScrollReveal>
            <ScrollReveal
              variant="clip-curtain"
              delay={0.08}
              className="aspect-[4/5] rounded-[20px] overflow-hidden border border-[#35151F]/14 bg-[#EFE4D6] sm:mt-8 shadow-[var(--card-shadow-subtle)]"
            >
              <LuxuryImage
                src="/src/assets/images/brand_atelier_craft_1794838443518.jpg"
                alt="Atelier pattern table with bolts of unbleached wool and brass shears"
                loading="eager"
                className="w-full h-full object-cover object-top"
              />
            </ScrollReveal>
          </div>
          <div className="lg:col-span-5 space-y-6">
            <ScrollReveal>
              <h2 className="editorial-subheading text-[#35151F]">
                Three principles guide every silhouette
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.08}>
              <div className="space-y-4 text-sm text-[#6D595E] leading-relaxed">
                <p>
                  <strong className="text-[#35151F]">01. Cloth honesty:</strong> We select natural fibres—double-faced cashmere, virgin wool flannel, organic cotton gabardine, and 30-momme mulberry silk—where drape emerges from weave density rather than synthetic stiffness.
                </p>
                <p>
                  <strong className="text-[#35151F]">02. Architectural precision:</strong> Hand-linked seams, brushed titanium closures, and breathable cupro linings allow outer coats and tailoring to move effortlessly with time.
                </p>
                <p>
                  <strong className="text-[#35151F]">03. Quiet permanence:</strong> Pieces are designed to pair effortlessly across seasons rather than chase fleeting seasonal graphics.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.14}>
              <MagneticButton className="inline-block">
                <PageTransitionLink
                  to="/shop"
                  className="inline-flex items-center justify-center min-h-[48px] bg-[#35151F] text-[#F5EEE5] rounded-[12px] px-7 text-xs uppercase tracking-[0.1em] hover:bg-[#8B2635] transition-colors"
                >
                  Explore the Catalog
                </PageTransitionLink>
              </MagneticButton>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ContactPage() {
  const { showToast } = useStore();
  const [sent, setSent] = useState(false);

  const handleInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    showToast('Client concierge inquiry recorded.', 'success');
  };

  return (
    <div className="bg-[#F5EEE5] min-h-screen py-14 md:py-24 text-[#35151F]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5 space-y-6">
          <ScrollReveal>
            <p className="text-xs uppercase tracking-[0.14em] text-[#8B2635]">Client Care</p>
          </ScrollReveal>
          <AnimatedText
            lines={['Concierge & Inquiries']}
            as="h1"
            triggerOnScroll={false}
            className="editorial-section-title text-[#35151F]"
          />
          <ScrollReveal delay={0.08}>
            <p className="text-sm text-[#6D595E] leading-relaxed">
              For sizing guidance, private fitting appointments, or order assistance, contact our team at{' '}
              <span className="text-[#35151F] font-medium">{BRAND_CONFIG.supportEmail}</span>.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.14}>
            <div id="returns" className="pt-6 border-t border-[#35151F]/14 space-y-2 text-xs text-[#6D595E] leading-relaxed">
              <h2 className="text-sm font-medium text-[#35151F]">Shipping &amp; Returns Policy</h2>
              <p>
                Complimentary insured standard courier shipping applies to orders over $1,000. Unworn garments with original tags attached may be returned within 14 days of delivery.
              </p>
            </div>
          </ScrollReveal>
        </div>

        <ScrollReveal delay={0.1} className="lg:col-span-7 bg-[#FFFFFF] border border-[#35151F]/14 rounded-[20px] p-6 sm:p-10 shadow-[var(--card-shadow-subtle)]">
          {sent ? (
            <div className="py-12 space-y-3">
              <h2 className="font-display text-3xl text-[#35151F]">Inquiry Received</h2>
              <p className="text-sm text-[#6D595E]">
                Our concierge team reviews messages Monday through Friday and will respond shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleInquiry} className="space-y-4">
              <h2 className="font-display text-2xl text-[#35151F]">Send a Message</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  required
                  placeholder="Your Name"
                  className="min-h-[48px] bg-[#F5EEE5]/50 border border-[#35151F]/20 rounded-[12px] px-3.5 text-sm"
                />
                <input
                  required
                  type="email"
                  placeholder="Email Address"
                  className="min-h-[48px] bg-[#F5EEE5]/50 border border-[#35151F]/20 rounded-[12px] px-3.5 text-sm"
                />
              </div>
              <input
                required
                placeholder="Subject (Sizing, Order Reference, Press)"
                className="w-full min-h-[48px] bg-[#F5EEE5]/50 border border-[#35151F]/20 rounded-[12px] px-3.5 text-sm"
              />
              <textarea
                required
                rows={4}
                placeholder="How may we assist?"
                className="w-full bg-[#F5EEE5]/50 border border-[#35151F]/20 rounded-[12px] p-3.5 text-sm"
              />
              <MagneticButton className="inline-block">
                <button
                  type="submit"
                  className="min-h-[48px] bg-[#35151F] text-[#F5EEE5] rounded-[12px] px-7 text-xs uppercase tracking-[0.1em] hover:bg-[#8B2635] transition-colors"
                >
                  Send Inquiry
                </button>
              </MagneticButton>
            </form>
          )}
        </ScrollReveal>
      </div>
    </div>
  );
}

export function LegalPage({ type }: { type: 'privacy' | 'terms' }) {
  return (
    <div className="bg-[#F5EEE5] min-h-screen py-14 md:py-24 text-[#35151F]">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 space-y-6">
        <ScrollReveal>
          <p className="text-xs uppercase tracking-[0.14em] text-[#8B2635]">Legal Notice</p>
        </ScrollReveal>
        <AnimatedText
          lines={[type === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions']}
          as="h1"
          triggerOnScroll={false}
          className="editorial-section-title text-[#35151F]"
        />
        <ScrollReveal delay={0.08}>
          <div className="space-y-4 text-sm text-[#6D595E] leading-relaxed bg-[#FFFFFF] border border-[#35151F]/14 rounded-[18px] p-6 sm:p-8">
            {type === 'privacy' ? (
              <>
                <p>
                  We collect only the contact, shipping, and preference information required to fulfill garment orders, maintain your saved wishlist, and send requested seasonal dispatches.
                </p>
                <p>
                  Raw payment card numbers and security codes are never collected or stored by our servers. You may unsubscribe from dispatches or request deletion of your account records at any time via {BRAND_CONFIG.supportEmail}.
                </p>
              </>
            ) : (
              <>
                <p>
                  All garment prices, privilege codes, and inventory availability are verified server-side prior to order confirmation.
                </p>
                <p>
                  Demo orders and sandbox payment adapters included in this storefront evaluation environment do not process live financial charges.
                </p>
              </>
            )}
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
