"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Plus, Home, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useSupabaseRealtime } from "@/hooks/use-supabase-realtime";
import { useAppStore } from "@/hooks/use-app-store";
import { useRequireAuth } from "@/hooks/use-require-auth";
import type { Property } from "@/lib/types/property.type";
import { PropertyCard } from "../_components/property-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function MyPropertiesPage() {
  const router = useRouter();
  const { user } = useAppStore();
  const isAuthenticated = useRequireAuth("Please sign in to view your properties");
  const { data, loading, error } = useSupabaseRealtime<Property>("properties");

  const properties = data ?? [];
  const myProperties = useMemo(
    () => properties.filter((p) => p.userId === user?.uid),
    [properties, user?.uid]
  );

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl space-y-8 p-4 md:p-6">
        <div className="space-y-4 text-center">
          <Skeleton className="mx-auto h-10 w-64" />
          <Skeleton className="mx-auto h-5 w-80" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <Skeleton key={idx} className="h-72" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <div className="rounded-2xl border-2 border-destructive/40 bg-destructive/10 p-8 text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h2 className="text-lg font-semibold text-destructive">
              Something went wrong
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {error.message || "Failed to load properties. Please try again."}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto max-w-7xl space-y-8 p-4 md:p-6"
    >
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex items-center justify-between gap-4 flex-wrap"
      >
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Home className="h-3.5 w-3.5" />
            Your Properties
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
            My Properties
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Manage all your property listings in one place.
          </p>
        </div>
        <Link href="/properties/create">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            List New Property
          </Button>
        </Link>
      </motion.div>

      {myProperties.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-border/60 bg-muted/40 p-12 text-center"
        >
          <Home className="h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No properties yet</h3>
          <p className="max-w-md text-sm text-muted-foreground">
            You haven't listed any properties yet. Create your first property
            listing to get started.
          </p>
          <Link href="/properties/create">
            <Button className="mt-2 gap-2">
              <Plus className="h-4 w-4" />
              List Your First Property
            </Button>
          </Link>
        </motion.div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {myProperties.map((property) => (
            <motion.div
              key={property.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <PropertyCard
                property={property}
                href={`/properties/${property.id}`}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

