import { PromotionalFeatureCard } from '../cards/PromotionalFeatureCard';

export function CampaignSection() {
  return (
    <section className="bg-[#240D14] text-[#F5EEE5] py-12 md:py-20 border-b border-[#D6B88C]/20">
      <div className="max-w-[1440px] mx-auto px-3 sm:px-8">
        <PromotionalFeatureCard
          kind="exclusive-collections"
          layout="editorial-overlay"
          eyebrow="Exclusive Collection · Evening Study 2026"
          title="Silence in structure and shadow."
          description="The Noir & Taupe Capsule distills outerwear and evening tailoring to clean lines, weighted hems, and matte-against-lustre cloth."
          metaNote="Atelier Exclusive · Small-Batch Tailoring"
          ctaLabel="Explore Noir Capsule"
          to="/collections/noir-capsule"
          imageUrl="/src/assets/images/campaign_autumn_film_1794838443354.jpg"
          imageAlt="Two models in sculpted black cashmere coats standing in a dark architectural courtyard"
        />
      </div>
    </section>
  );
}
