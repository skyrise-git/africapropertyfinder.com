export const marketingSite = {
  name: "SkyRise Real Estate",
  title: "SkyRise Real Estate",
  description:
    "Your trusted partner for buying, selling, renting, and listing properties. Find your dream home or investment property with SkyRise Real Estate.",
  tagline:
    "Premium real estate services for buying, selling, renting, and listing properties. Your dream home awaits.",
  url: "https://skyriserealestate.com",
  domain: "skyriserealestate.com",
  contactEmail: "info@skyriserealestate.com",
  contactPhone: "+15857332632",
  social: {
    twitter: "https://twitter.com/skyriserealestate",
    github: "https://github.com/skyriserealestate",
    linkedin: "https://www.linkedin.com/company/skyriserealestate",
    youtube: "https://www.youtube.com/@skyriserealestate",
    facebook: "https://www.facebook.com/skyriserealestate",
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
      href: "/blogs",
    },
    {
      label: "List your property",
      href: "/list-property",
    },
    {
      label: "Contact our team",
      href: "/contact",
    },
  ],
  megaMenu: [
    {
      label: "Services",
      href: "#services",
      items: [
        {
          label: "List Property",
          href: "/list-property",
          icon: "Home",
          description:
            "List your property with us and reach thousands of potential buyers and renters",
          featured: true,
        },
        {
          label: "Buy",
          href: "/buy",
          icon: "ShoppingCart",
          description: "Browse our extensive collection of properties for sale",
          featured: true,
        },
        {
          label: "Rent",
          href: "/rent",
          icon: "Key",
          description:
            "Find the perfect rental property that fits your needs and budget",
          featured: true,
        },
        {
          label: "Sell",
          href: "/sell",
          icon: "TrendingUp",
          description:
            "Get the best price for your property with our expert selling services",
          featured: true,
        },
      ],
    },
  ],
} as const;

export type MarketingSite = typeof marketingSite;

