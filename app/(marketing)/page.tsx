import { FAQSection } from "@/components/home/faq-section";
import { FeaturesSection } from "@/components/home/features-section";
import { HeroSection } from "@/components/home/hero-section";
import { TestimonialsMarquee } from "@/components/home/testimonials-marquee";
import { faqData } from "@/lib/config";

export default function MarketingHome() {
  return (
    <div className="space-y-0">
      <HeroSection />
      <FeaturesSection />
      <TestimonialsMarquee />
      <FAQSection questions={faqData} />
    </div>
  );
}
