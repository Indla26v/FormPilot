import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import InteractiveDemo from '@/components/InteractiveDemo';
import FeaturesGrid from '@/components/FeaturesGrid';
import ProductShowcase from '@/components/ProductShowcase';
import SpecsGuide from '@/components/SpecsGuide';
import SetupGuide from '@/components/SetupGuide';
import ComparisonSection from '@/components/ComparisonSection';
import FaqSection from '@/components/FaqSection';
import QuickLinksSection from '@/components/QuickLinksSection';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <Navbar />
      <HeroSection />
      <InteractiveDemo />
      <FeaturesGrid />
      <ProductShowcase />
      <SpecsGuide />
      <SetupGuide />
      <ComparisonSection />
      <FaqSection />
      <QuickLinksSection />
      <Footer />
    </main>
  );
}
