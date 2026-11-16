import { HeroSection } from '../components/home/HeroSection';
import { NewArrivals } from '../components/home/NewArrivals';
import { CampaignSection } from '../components/home/CampaignSection';
import { BrandStory } from '../components/home/BrandStory';
import { FeaturedCollections } from '../components/home/FeaturedCollections';
import { ThreeDEditorial } from '../components/home/ThreeDEditorial';
import { BestSellers } from '../components/home/BestSellers';
import { NewsletterSection } from '../components/home/NewsletterSection';

export function HomePage() {
  return (
    <div>
      <HeroSection />
      <NewArrivals />
      <CampaignSection />
      <BrandStory />
      <FeaturedCollections />
      <ThreeDEditorial />
      <BestSellers />
      <NewsletterSection />
    </div>
  );
}
