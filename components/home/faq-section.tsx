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
  questions: FAQItem[];
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
    <section className="bg-background">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4 text-primary">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-muted-foreground">
            Get answers to common questions about our luxury real estate
            services
          </p>
        </div>
        <div className="">
          <Accordion type="single" collapsible className="w-full space-y-4">
            {questions.map((faq, index) => {
              const Icon = iconMap[faq.iconName as keyof typeof iconMap];
              return (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-card rounded-lg border border-border hover:border-primary transition-colors group data-[state=open]:border-primary"
                >
                  <AccordionTrigger className="px-6 text-left hover:no-underline">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                      <span className="text-foreground group-hover:text-primary transition-colors">
                        {faq.question}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 pl-14 text-muted-foreground">
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
