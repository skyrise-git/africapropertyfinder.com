export interface FAQItem {
  question: string;
  answer: string;
  iconName: string;
}

export const faqData: readonly FAQItem[] = [
  {
    question: "How do I list my property with Africa Property Finder?",
    answer:
      "You can list your property by clicking the 'List Property' button in our navigation menu or contacting us directly. Our team will guide you through the process, including property valuation, photography, and marketing strategy.",
    iconName: "Home",
  },
  {
    question: "What are your commission rates?",
    answer:
      "Our commission rates are competitive and vary based on the property type and value. We offer flexible pricing structures tailored to your needs. Contact us for a personalized quote.",
    iconName: "DollarSign",
  },
  {
    question: "How long does it take to sell a property?",
    answer:
      "The average time to sell a property varies depending on market conditions, location, and pricing. Typically, well-priced properties in desirable locations sell within 30-90 days. Our team works efficiently to ensure a quick and smooth transaction.",
    iconName: "Calendar",
  },
  {
    question: "Do you help with property rentals?",
    answer:
      "Yes! We offer comprehensive rental services including property management, tenant screening, lease agreements, and maintenance coordination. Browse our rental listings or contact us to list your rental property.",
    iconName: "Key",
  },
  {
    question: "What areas do you serve?",
    answer:
      "Africa Property Finder serves clients across multiple regions. Use our property search feature to explore available listings in your desired area, or contact us to learn more about our service coverage.",
    iconName: "MapPin",
  },
  {
    question: "How do I schedule a property viewing?",
    answer:
      "You can schedule a viewing directly through our website by clicking on any property listing and selecting 'Schedule Viewing', or contact us via phone or email. We'll coordinate a convenient time for you.",
    iconName: "Search",
  },
  {
    question: "What documents do I need to buy a property?",
    answer:
      "To purchase a property, you'll typically need proof of income, bank statements, pre-approval letter from a lender, identification documents, and proof of funds for down payment. Our team will guide you through all required documentation.",
    iconName: "FileText",
  },
  {
    question: "Do you offer property investment consulting?",
    answer:
      "Yes, we provide expert investment consulting services to help you identify profitable real estate opportunities. Our team analyzes market trends, property values, and potential returns to guide your investment decisions.",
    iconName: "Building2",
  },
] as const;

