"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Calendar,
  DollarSign,
  Key,
  Home,
  Phone,
  FileText,
  MapPin,
  Search,
  Building2,
} from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
  iconName: string;
}

interface FAQSectionProps {
  questions: readonly FAQItem[];
}

// Icon mapping object
const iconMap = {
  Calendar,
  DollarSign,
  Key,
  Home,
  Phone,
  FileText,
  MapPin,
  Search,
  Building2,
} as const;

export const FAQSection = ({ questions }: FAQSectionProps) => {
  return (
    <section className="bg-background py-6 sm:py-8 md:py-10 lg:py-12 xl:py-16 w-full max-w-full overflow-x-hidden">
      <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-5 lg:px-6 w-full">
        <div className="text-center mb-4 sm:mb-6 md:mb-8 lg:mb-12 xl:mb-16">
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-light mb-1.5 sm:mb-2 md:mb-3 lg:mb-4 text-slate-700 dark:text-gray-100 px-1 sm:px-2 break-words">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-muted-foreground px-1 sm:px-2 break-words">
            Get answers to common questions about our luxury real estate
            services
          </p>
        </div>
        <div className="">
          <Accordion type="single" collapsible className="w-full space-y-2 sm:space-y-2.5 md:space-y-3 lg:space-y-4">
            {questions.map((faq, index) => {
              const Icon = iconMap[faq.iconName as keyof typeof iconMap];
              return (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-card rounded-md sm:rounded-lg border border-border hover:border-primary transition-colors group data-[state=open]:border-primary"
                >
                  <AccordionTrigger className="px-2.5 sm:px-3 md:px-4 lg:px-6 text-left hover:no-underline py-2 sm:py-2.5 md:py-3 lg:py-4">
                    <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 lg:gap-3">
                      <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 lg:h-5 lg:w-5 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                      <span className="text-[11px] sm:text-xs md:text-sm lg:text-base text-foreground group-hover:text-primary transition-colors text-left break-words">
                        {faq.question}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-2.5 sm:px-3 md:px-4 lg:px-6 pb-2 sm:pb-3 md:pb-4 pl-6 sm:pl-7 md:pl-8 lg:pl-14 text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground leading-snug sm:leading-relaxed break-words">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </div>
    </section>
  );
};
