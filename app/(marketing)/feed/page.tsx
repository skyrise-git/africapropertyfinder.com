"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { Sparkles, TrendingUp, Heart, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSupabaseRealtime } from "@/hooks/use-supabase-realtime";
import { useAppStore } from "@/hooks/use-app-store";
import { PropertyCard } from "../properties/_components/property-card";
import type { Property } from "@/lib/types/property.type";
import type { SavedProperty } from "@/lib/types/saved-property.type";
import Link from "next/link";

export default function FeedPage() {
  const { user } = useAppStore();
  const { data: properties, loading: propsLoading } = useSupabaseRealtime<Property>("properties");
  const { data: savedProps } = useSupabaseRealtime<SavedProperty>("savedProperties", { enabled: !!user });

  const allProperties = properties ?? [];
  const savedProperties = savedProps ?? [];

  const personalizedFeed = useMemo(() => {
    if (!user || savedProperties.length === 0) return [];

    const savedPropIds = new Set(savedProperties.map(sp => sp.propertyId));
    const savedFullProps = allProperties.filter(p => savedPropIds.has(p.id));

    const preferredCities = new Set(savedFullProps.map(p => p.city));
    const preferredStates = new Set(savedFullProps.map(p => p.state));
    const preferredTypes = new Set(savedFullProps.map(p => p.listingType));

    return allProperties
      .filter(p => !savedPropIds.has(p.id))
      .map(p => {
        let score = 0;
        if (preferredCities.has(p.city)) score += 3;
        if (preferredStates.has(p.state)) score += 2;
        if (preferredTypes.has(p.listingType)) score += 1;
        return { ...p, _score: score };
      })
      .filter(p => p._score > 0)
      .sort((a, b) => b._score - a._score)
      .slice(0, 12);
  }, [user, allProperties, savedProperties]);

  const trendingProperties = useMemo(() => {
    return [...allProperties]
      .filter(p => p.images && p.images.length > 0)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 12);
  }, [allProperties]);

  if (propsLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="space-y-8">
          <div className="h-10 w-64 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-[380px] bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-light text-slate-700 dark:text-gray-100 tracking-tight">
          Your Feed
        </h1>
        <p className="text-slate-400 dark:text-gray-400 text-sm md:text-base max-w-lg">
          {user
            ? "Properties selected for you based on your saved listings and preferences."
            : "Discover trending properties. Sign in to get personalized recommendations."}
        </p>
      </motion.div>

      {/* Personalized section */}
      {user && personalizedFeed.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-medium text-slate-700 dark:text-gray-100">Recommended for You</h2>
            <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
              Based on your favorites
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {personalizedFeed.map((property) => (
              <Link key={property.id} href={`/properties/${property.id}`} className="block">
                <PropertyCard property={property} href={`/properties/${property.id}`} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Sign in prompt for anonymous users */}
      {!user && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary/5 border border-primary/20 rounded-xl p-6 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Heart className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-gray-100">Get personalized recommendations</p>
              <p className="text-xs text-muted-foreground">Sign in and save properties to see listings matched to your preferences.</p>
            </div>
          </div>
          <Button asChild size="sm">
            <Link href="/signin" className="flex items-center gap-1.5">
              <LogIn className="h-3.5 w-3.5" />
              Sign in
            </Link>
          </Button>
        </motion.div>
      )}

      {/* Trending section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-medium text-slate-700 dark:text-gray-100">
            {user && personalizedFeed.length > 0 ? "Also Trending" : "Trending Properties"}
          </h2>
          <Badge variant="outline" className="text-[10px] text-muted-foreground">
            Recently listed
          </Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {trendingProperties.map((property) => (
            <Link key={property.id} href={`/properties/${property.id}`} className="block">
              <PropertyCard property={property} href={`/properties/${property.id}`} />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
