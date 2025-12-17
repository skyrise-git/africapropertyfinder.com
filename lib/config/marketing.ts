export const marketingSite = {
  name: "Africa Property Finder",
  title: "Africa Property Finder",
  description:
    "Your trusted partner for buying, selling, renting, and listing properties. Find your dream home or investment property with Africa Property Finder.",
  tagline:
    "Premium real estate services for buying, selling, renting, and listing properties. Your dream home awaits.",
  url: "https://www.africapropertyfinder.com",
  domain: "africapropertyfinder.com",
  contactEmail: "info@africapropertyfinder.com",
  contactPhone: "+15857332632",
  social: {
    twitter: "https://twitter.com/skyriserealestate",
    github: "https://github.com/skyriserealestate",
    linkedin: "https://www.linkedin.com/company/skyriserealestate",
    youtube: "https://www.youtube.com/@skyriserealestate",
    facebook: "https://www.facebook.com/skyriserealestate",
    instagram: "https://www.instagram.com/skyriserealestate",
  },
  stack: [
    "Expert property listings and market analysis",
    "Professional buying and selling services",
    "Comprehensive rental property management",
    "Real-time property search and filtering",
    "Personalized real estate consultation",
  ],
  highlights: [
    "Expert real estate agents with years of experience",
    "Comprehensive property search with advanced filters",
    "Professional property valuation and market analysis",
    "Seamless buying, selling, and renting process",
    "24/7 customer support and consultation services",
  ],
  quickLinks: [
    {
      label: "Browse available properties",
      href: "/properties",
    },
    {
      label: "List your property",
      href: "/properties/create",
    },
    {
      label: "Contact our team",
      href: "/contact",
    },
  ],
  megaMenu: [
    {
      label: "Properties",
      href: "/properties",
      items: [
        {
          label: "View All",
          href: "/properties",
          icon: "Home",
          description:
            "Browse all available properties with advanced search and filtering options",
          featured: true,
        },
        {
          label: "My Properties",
          href: "/properties/my-properties",
          icon: "Database",
          description:
            "View and manage all your property listings in one place",
          featured: true,
        },
        {
          label: "List A Property",
          href: "/properties/create",
          icon: "Settings",
          description:
            "Create a new property listing and reach thousands of potential buyers and renters",
          featured: true,
        },
        {
          label: "Contact Us",
          href: "/contact",
          icon: "FileCode",
          description:
            "Get in touch with our team for property inquiries and support",
          featured: true,
        },
      ],
    },
    {
      label: "Services",
      href: "#services",
      items: [
        {
          label: "Buy",
          href: "/properties?listingType=sale",
          icon: "ShoppingCart",
          description: "Browse our extensive collection of properties for sale",
          featured: true,
        },
        {
          label: "Rent",
          href: "/properties?listingType=rent",
          icon: "Key",
          description:
            "Find the perfect rental property that fits your needs and budget",
          featured: true,
        },
        {
          label: "Sell",
          href: "/properties?listingType=sale",
          icon: "TrendingUp",
          description:
            "Get the best price for your property with our expert selling services",
          featured: true,
        },
        {
          label: "View All",
          href: "/properties",
          icon: "Home",
          description:
            "Browse all available properties with advanced search and filtering options",
          featured: true,
        },
      ],
    },
  ],
  footer: {
    newsletter: {
      title: "Stay Updated with Real Estate Trends",
      description:
        "Subscribe to our newsletter for market insights and exclusive property listings",
    },
    companyInfo: {
      tagline: "Your trusted partner in real estate.",
      address: "123 Luxury Avenue, Premium City, 12345",
    },
    links: {
      properties: [
        { label: "Buy Property", href: "/properties?listingType=sale" },
        { label: "Rent Property", href: "/properties?listingType=rent" },
        { label: "Sell Property", href: "/properties?listingType=sale" },
        { label: "List Property", href: "/properties/create" },
        { label: "Featured Listings", href: "/properties" },
        { label: "New Developments", href: "/developments" },
      ],
      company: [
        { label: "About Us", href: "/about" },
        { label: "Our Team", href: "/team" },
        { label: "Careers", href: "/careers" },
        { label: "Press & Media", href: "/press" },
        { label: "Contact Us", href: "/contact" },
      ],
      resources: [
        { label: "Market Analysis", href: "/market-analysis" },
        { label: "Investment Guide", href: "/investment-guide" },
        { label: "Buying Guide", href: "/buying-guide" },
        { label: "Property News", href: "/blogs" },
        { label: "FAQs", href: "/#faq" },
      ],
    },
    legal: [
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Sitemap", href: "/sitemap" },
    ],
  },
} as const;

export type MarketingSite = typeof marketingSite;

