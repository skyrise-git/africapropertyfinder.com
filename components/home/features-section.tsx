"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Home,
  TrendingUp,
  Key,
  BarChart3,
  Shield,
  Search,
} from "lucide-react";

interface FeatureItemProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  className?: string;
  size?: "small" | "medium" | "large";
}

const FeatureItem = ({
  title,
  description,
  icon,
  className,
  size = "small",
}: FeatureItemProps) => {
  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, damping: 25 },
    },
  };

  return (
    <motion.div
      variants={variants}
      className={cn(
        "group border-primary/10 bg-background hover:border-primary/30 relative flex h-full cursor-pointer flex-col justify-between overflow-hidden rounded-xl border px-6 pt-6 pb-10 shadow-md transition-all duration-500",
        className
      )}
    >
      <div className="absolute top-0 -right-1/2 z-0 size-full cursor-pointer bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] bg-[size:24px_24px] text-primary/10"></div>

      <div className="text-primary/5 group-hover:text-primary/10 absolute right-1 bottom-3 scale-[6] transition-all duration-700 group-hover:scale-[6.2]">
        {icon}
      </div>

      <div className="relative z-10 flex h-full flex-col justify-between">
        <div>
          <div className="bg-primary/10 text-primary shadow-primary/10 group-hover:bg-primary/20 group-hover:shadow-primary/20 mb-4 flex h-12 w-12 items-center justify-center rounded-full shadow transition-all duration-500">
            {icon}
          </div>
          <h3 className="mb-2 text-xl font-semibold tracking-tight text-foreground">
            {title}
          </h3>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        <div className="text-primary mt-4 flex items-center text-sm font-medium">
          <span className="mr-1">Learn more</span>
          <ArrowRight className="size-4 transition-all duration-500 group-hover:translate-x-2" />
        </div>
      </div>
      <div className="from-primary to-primary/30 absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r blur-2xl transition-all duration-500 group-hover:blur-lg" />
    </motion.div>
  );
};

const features = [
  {
    title: "Property Search & Discovery",
    description:
      "Browse thousands of properties with advanced filters. Find your perfect home or investment property with our comprehensive search tools.",
    icon: <Search className="size-6" />,
    size: "large" as const,
  },
  {
    title: "Buy Properties",
    description:
      "Expert guidance through every step of the buying process. From property viewing to closing, we make it seamless.",
    icon: <Home className="size-6" />,
    size: "small" as const,
  },
  {
    title: "Sell Properties",
    description:
      "Maximize your property value with professional marketing, staging advice, and negotiation expertise.",
    icon: <TrendingUp className="size-6" />,
    size: "medium" as const,
  },
  {
    title: "Rental Services",
    description:
      "Comprehensive rental solutions including property management, tenant screening, and lease agreements.",
    icon: <Key className="size-6" />,
    size: "medium" as const,
  },
  {
    title: "Market Analysis",
    description:
      "Get detailed market insights and property valuations to make informed real estate decisions.",
    icon: <BarChart3 className="size-6" />,
    size: "small" as const,
  },
  {
    title: "Trusted Expertise",
    description:
      "Work with experienced real estate professionals committed to your success. 24/7 support and personalized service.",
    icon: <Shield className="size-6" />,
    size: "large" as const,
  },
];

export function FeaturesSection() {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  };

  return (
    <section className="container mx-auto max-w-6xl px-4 py-12 md:py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-12 text-center"
      >
        <h2 className="text-foreground mb-4 text-4xl font-bold tracking-tight md:text-5xl">
          Why Choose Africa Property Finder?
        </h2>
        <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
          Comprehensive real estate services designed to meet all your property
          needs, from buying and selling to rental management.
        </p>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-6"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        {features.map((feature, i) => (
          <FeatureItem
            key={i}
            title={feature.title}
            description={feature.description}
            icon={feature.icon}
            size={feature.size}
            className={cn(
              feature.size === "large"
                ? "col-span-4"
                : feature.size === "medium"
                  ? "col-span-3"
                  : "col-span-2",
              "h-full"
            )}
          />
        ))}
      </motion.div>
    </section>
  );
}

