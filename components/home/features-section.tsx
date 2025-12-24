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
        "group border-primary/10 bg-background hover:border-primary/30 relative flex h-full cursor-pointer flex-col justify-between overflow-hidden rounded-lg sm:rounded-xl border px-3 sm:px-4 md:px-5 lg:px-6 pt-3 sm:pt-4 md:pt-5 lg:pt-6 pb-5 sm:pb-6 md:pb-8 lg:pb-10 shadow-md transition-all duration-500 w-full min-w-0",
        className
      )}
    >
      <div className="absolute top-0 -right-1/2 z-0 size-full cursor-pointer bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] bg-[size:24px_24px] text-primary/10 pointer-events-none"></div>

      <div className="text-primary/5 group-hover:text-primary/10 absolute right-1 bottom-2 sm:bottom-3 scale-[5] sm:scale-[6] transition-all duration-700 group-hover:scale-[5.2] sm:group-hover:scale-[6.2] pointer-events-none">
        {icon}
      </div>

      <div className="relative z-10 flex h-full flex-col justify-between w-full min-w-0">
        <div className="w-full min-w-0">
          <div className="bg-primary/10 text-primary shadow-primary/10 group-hover:bg-primary/20 group-hover:shadow-primary/20 mb-2 sm:mb-3 md:mb-4 flex h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 items-center justify-center rounded-full shadow transition-all duration-500 shrink-0">
            {icon}
          </div>
          <h3 className="mb-1 sm:mb-1.5 md:mb-2 text-sm sm:text-base md:text-lg lg:text-xl font-semibold tracking-tight text-foreground break-words leading-tight">
            {title}
          </h3>
          <p className="text-muted-foreground text-[11px] sm:text-xs md:text-sm leading-relaxed break-words line-clamp-3 sm:line-clamp-none">
            {description}
          </p>
        </div>
        <div className="text-primary mt-2 sm:mt-3 md:mt-4 flex items-center text-[10px] sm:text-xs md:text-sm font-medium shrink-0">
          <span className="mr-0.5 sm:mr-1">Learn more</span>
          <ArrowRight className="size-3 sm:size-3.5 md:size-4 transition-all duration-500 group-hover:translate-x-2" />
        </div>
      </div>
      <div className="from-primary to-primary/30 absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r blur-2xl transition-all duration-500 group-hover:blur-lg pointer-events-none" />
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
    <section className="w-full max-w-full overflow-x-hidden">
      <div className="container mx-auto max-w-4xl px-3 sm:px-4 md:px-5 lg:px-6 xl:px-8 py-6 sm:py-8 md:py-10 lg:py-12 xl:py-16 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4 sm:mb-6 md:mb-8 lg:mb-12 text-center w-full"
        >
          <h2 className="text-foreground mb-1.5 sm:mb-2 md:mb-3 lg:mb-4 text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-bold tracking-tight px-1 sm:px-2 break-words leading-tight">
            Why Choose Africa Property Finder?
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-xs sm:text-sm md:text-base lg:text-lg px-1 sm:px-2 break-words leading-snug sm:leading-relaxed">
            Comprehensive real estate services designed to meet all your
            property needs, from buying and selling to rental management.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 gap-2 sm:gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-6 w-full"
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
                "col-span-1",
                feature.size === "large"
                  ? "lg:col-span-4"
                  : feature.size === "medium"
                  ? "lg:col-span-3"
                  : "lg:col-span-2",
                "h-full w-full"
              )}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
