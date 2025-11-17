import { FAQSection } from "@/components/home/faq-section";
import { TestimonialsMarquee } from "@/components/home/testimonials-marquee";
import { faqData } from "@/lib/config";

export default function MarketingHome() {
  return (
    <div className="space-y-0">
      <TestimonialsMarquee />
      <FAQSection questions={faqData} />
    </div>
  );
}
