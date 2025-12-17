import { FAQSection } from "@/components/home/faq-section";
import { faqData } from "@/lib/config";

export default function FAQPage() {
  return (
    <div className="container mx-auto max-w-6xl p-4 md:p-6">
      <FAQSection questions={faqData} />
    </div>
  );
}
