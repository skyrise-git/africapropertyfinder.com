import { FAQSection } from "@/components/home/faq-section";
import { faqData } from "@/lib/config";

export default function MarketingHome() {
  return (
    <div className="space-y-0">
      <FAQSection questions={faqData} />
    </div>
  );
}
