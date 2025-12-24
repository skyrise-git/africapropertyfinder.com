"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Marquee } from "@/components/ui/marquee";

export function Highlight({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "bg-primary/10 p-1 py-0.5 font-bold text-primary",
        className,
      )}
    >
      {children}
    </span>
  );
}

export interface TestimonialCardProps {
  name: string;
  role: string;
  img?: string;
  description: React.ReactNode;
  className?: string;
  [key: string]: any;
}

export function TestimonialCard({
  description,
  name,
  img,
  role,
  className,
  ...props // Capture the rest of the props
}: TestimonialCardProps) {
  return (
    <div
      className={cn(
        "mb-2 sm:mb-3 md:mb-4 flex w-full cursor-pointer break-inside-avoid flex-col items-center justify-between gap-3 sm:gap-4 md:gap-6 rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4",
        // theme styles
        "border-border bg-card/50 border shadow-sm",
        // hover effect
        "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md",
        className,
      )}
      {...props}
    >
      <div className="text-muted-foreground text-[11px] sm:text-xs md:text-sm font-normal select-none w-full">
        {description}
        <div className="flex flex-row py-0.5 sm:py-1">
          <Star className="size-3 sm:size-3.5 md:size-4 fill-primary text-primary" />
          <Star className="size-3 sm:size-3.5 md:size-4 fill-primary text-primary" />
          <Star className="size-3 sm:size-3.5 md:size-4 fill-primary text-primary" />
          <Star className="size-3 sm:size-3.5 md:size-4 fill-primary text-primary" />
          <Star className="size-3 sm:size-3.5 md:size-4 fill-primary text-primary" />
        </div>
      </div>

      <div className="flex w-full items-center justify-start gap-2 sm:gap-3 md:gap-5 select-none">
        <img
          width={40}
          height={40}
          src={img || ""}
          alt={name}
          className="size-8 sm:size-9 md:size-10 rounded-full ring-1 ring-primary/20 ring-offset-1 sm:ring-offset-2"
        />

        <div>
          <p className="text-foreground font-medium text-xs sm:text-sm md:text-base">{name}</p>
          <p className="text-muted-foreground text-[10px] sm:text-xs font-normal">{role}</p>
        </div>
      </div>
    </div>
  );
}
const testimonials = [
  {
    name: "Sarah Mitchell",
    role: "Home Buyer",
    img: "https://randomuser.me/api/portraits/women/22.jpg",
    description: (
      <p>
        Africa Property Finder made finding our dream home effortless.
        <Highlight>
          Their team found us the perfect property within our budget in just two
          weeks.
        </Highlight>{" "}
        The entire process was smooth and stress-free.
      </p>
    ),
  },
  {
    name: "Michael Chen",
    role: "Property Investor",
    img: "https://randomuser.me/api/portraits/men/33.jpg",
    description: (
      <p>
        I&apos;ve worked with many real estate agencies, but SkyRise stands out.
        <Highlight>
          Their market analysis helped me make profitable investment decisions.
        </Highlight>{" "}
        I&apos;ve purchased three properties through them this year.
      </p>
    ),
  },
  {
    name: "Emily Rodriguez",
    role: "First-Time Home Buyer",
    img: "https://randomuser.me/api/portraits/women/44.jpg",
    description: (
      <p>
        As a first-time buyer, I was nervous about the process.
        <Highlight>
          SkyRise guided me through every step and answered all my questions.
        </Highlight>{" "}
        I couldn&apos;t have asked for a better experience.
      </p>
    ),
  },
  {
    name: "David Thompson",
    role: "Property Seller",
    img: "https://randomuser.me/api/portraits/men/55.jpg",
    description: (
      <p>
        Sold my property above asking price thanks to SkyRise&apos;s expertise.
        <Highlight>
          Their marketing strategy attracted multiple competitive offers.
        </Highlight>{" "}
        The negotiation process was handled professionally and efficiently.
      </p>
    ),
  },
  {
    name: "Jessica Park",
    role: "Rental Property Owner",
    img: "https://randomuser.me/api/portraits/women/67.jpg",
    description: (
      <p>
        SkyRise manages my rental properties flawlessly.
        <Highlight>
          They handle everything from tenant screening to maintenance requests.
        </Highlight>{" "}
        My properties have been consistently occupied with quality tenants.
      </p>
    ),
  },
  {
    name: "Robert Kim",
    role: "Commercial Real Estate Buyer",
    img: "https://randomuser.me/api/portraits/men/78.jpg",
    description: (
      <p>
        Their commercial real estate expertise is unmatched.
        <Highlight>
          They helped me secure a prime location for my business expansion.
        </Highlight>{" "}
        The due diligence process was thorough and transparent.
      </p>
    ),
  },
  {
    name: "Amanda Foster",
    role: "Luxury Home Buyer",
    img: "https://randomuser.me/api/portraits/women/89.jpg",
    description: (
      <p>
        SkyRise understands luxury real estate like no other.
        <Highlight>
          They showed us exclusive properties that weren&apos;t even listed
          publicly.
        </Highlight>{" "}
        The attention to detail and personalized service was exceptional.
      </p>
    ),
  },
  {
    name: "James Wilson",
    role: "Real Estate Investor",
    img: "https://randomuser.me/api/portraits/men/92.jpg",
    description: (
      <p>
        Their investment property recommendations have been spot-on.
        <Highlight>
          I&apos;ve seen a 25% ROI on properties they suggested.
        </Highlight>{" "}
        SkyRise is now my go-to for all real estate investments.
      </p>
    ),
  },
  {
    name: "Lisa Anderson",
    role: "Relocating Professional",
    img: "https://randomuser.me/api/portraits/women/29.jpg",
    description: (
      <p>
        Moving to a new city was overwhelming until I found SkyRise.
        <Highlight>
          They understood my needs and found the perfect neighborhood for my
          family.
        </Highlight>{" "}
        The relocation support made the transition seamless.
      </p>
    ),
  },
  {
    name: "Christopher Lee",
    role: "Property Developer",
    img: "https://randomuser.me/api/portraits/men/45.jpg",
    description: (
      <p>
        SkyRise has been instrumental in our development projects.
        <Highlight>
          Their market insights helped us identify profitable development
          opportunities.
        </Highlight>{" "}
        Their team is knowledgeable, professional, and results-driven.
      </p>
    ),
  },
];

export function TestimonialsMarquee() {
  return (
    <section className="relative mx-auto max-w-6xl px-3 sm:px-4 md:px-5 lg:px-6 py-6 sm:py-8 md:py-10 lg:py-12 xl:py-16 w-full max-w-full overflow-x-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 -left-20 z-10 h-16 w-16 sm:h-24 sm:w-24 md:h-32 md:w-32 lg:h-64 lg:w-64 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -right-20 bottom-20 z-10 h-16 w-16 sm:h-24 sm:w-24 md:h-32 md:w-32 lg:h-64 lg:w-64 rounded-full bg-primary/5 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-foreground mb-1.5 sm:mb-2 md:mb-3 lg:mb-4 text-center text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl leading-[1.2] font-bold tracking-tighter px-1 sm:px-2">
          What Our Users Are Saying
        </h2>
        <h3 className="text-muted-foreground mx-auto mb-4 sm:mb-5 md:mb-6 lg:mb-8 max-w-lg text-center text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-lg font-medium tracking-tight text-balance px-1 sm:px-2">
          Don&apos;t just take our word for it. Here&apos;s what{" "}
          <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            real clients
          </span>{" "}
          are saying about{" "}
          <span className="font-semibold text-primary">
            Africa Property Finder
          </span>
        </h3>
      </motion.div>

      <div className="relative mt-4 sm:mt-5 md:mt-6 max-h-[400px] sm:max-h-[500px] md:max-h-[600px] lg:max-h-[700px] xl:max-h-[800px] overflow-hidden">
        <div className="grid grid-cols-1 gap-2 sm:gap-3 md:gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array(Math.ceil(testimonials.length / 3))
            .fill(0)
            .map((_, i) => (
              <div key={i} className="h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] xl:h-[800px] overflow-hidden">
                <Marquee
                  vertical
                  repeat={3}
                  pauseOnHover
                  className={cn("h-full", {
                    "[--duration:60s]": i === 1,
                    "[--duration:30s]": i === 2,
                    "[--duration:70s]": i === 3,
                    "[--duration:50s]": i === 0,
                  })}
                >
                  {testimonials.slice(i * 3, (i + 1) * 3).map((card, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{
                        delay: Math.random() * 0.8,
                        duration: 1.2,
                      }}
                    >
                      <TestimonialCard {...card} />
                    </motion.div>
                  ))}
                </Marquee>
              </div>
            ))}
        </div>
        <div className="from-background pointer-events-none absolute inset-x-0 bottom-0 h-1/4 w-full bg-gradient-to-t from-20%"></div>
        <div className="from-background pointer-events-none absolute inset-x-0 top-0 h-1/4 w-full bg-gradient-to-b from-20%"></div>
      </div>
    </section>
  );
}
