"use client";

import { motion } from "motion/react";
import { Building2, UserCheck, CalendarCheck2, Home } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStatsProps {
  loading: boolean;
  totalActiveProperties: number;
  totalActiveUsers: number;
  totalBookedProperties: number;
  totalProperties: number;
}

const containerVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function DashboardStats({
  loading,
  totalActiveProperties,
  totalActiveUsers,
  totalBookedProperties,
  totalProperties,
}: DashboardStatsProps) {
  const cards = [
    {
      label: "Active Properties",
      value: totalActiveProperties,
      icon: Building2,
      accent: "bg-emerald-500/10 text-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
    },
    {
      label: "Active Users",
      value: totalActiveUsers,
      icon: UserCheck,
      accent: "bg-sky-500/10 text-sky-500",
      bg: "bg-sky-50 dark:bg-sky-500/10",
    },
    {
      label: "Booked Properties",
      value: totalBookedProperties,
      icon: CalendarCheck2,
      accent: "bg-amber-500/10 text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-500/10",
    },
    {
      label: "Total Properties",
      value: totalProperties,
      icon: Home,
      accent: "bg-purple-500/10 text-purple-500",
      bg: "bg-purple-50 dark:bg-purple-500/10",
    },
  ];

  const Wrapper = motion.div;

  if (loading) {
    return (
      <Wrapper
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {cards.map((card) => (
          <motion.div key={card.label} variants={cardVariants}>
            <Card
              className={`relative overflow-hidden border-border/70 shadow-sm ${card.bg}`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.label}
                </CardTitle>
                <div
                  className={`flex size-8 items-center justify-center rounded-xl ${card.accent}`}
                >
                  <card.icon className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </Wrapper>
    );
  }

  return (
    <Wrapper
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {cards.map((card) => (
        <motion.div
          key={card.label}
          variants={cardVariants}
          whileHover={{ y: -4, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card
            className={`relative overflow-hidden border-border/70 shadow-sm ${card.bg}`}
          >
            <div className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full bg-white/60 dark:bg-primary/10" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.label}
              </CardTitle>
              <div
                className={`flex size-8 items-center justify-center rounded-xl ${card.accent}`}
              >
                <card.icon className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </Wrapper>
  );
}
