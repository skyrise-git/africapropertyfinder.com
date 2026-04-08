"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { useAppStore } from "@/hooks/use-app-store";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useSupabaseRealtime } from "@/hooks/use-supabase-realtime";
import { SavedPropertiesList } from "./_components/SavedPropertiesList";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { Property } from "@/lib/types/property.type";
import type { SavedProperty } from "@/lib/types/saved-property.type";

export default function SavedPropertiesPage() {
  const { user } = useAppStore();
  const router = useRouter();
  const isAuthenticated = useRequireAuth(
    "Please sign in to view your saved properties"
  );
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [refreshKey, setRefreshKey] = useState(0);

  // Sync search to URL (only when authenticated)
  useEffect(() => {
    if (!isAuthenticated) return;
    const params = new URLSearchParams(searchParams.toString());
    if (search) params.set("q", search);
    else params.delete("q");
    const query = params.toString();
    router.replace(query ? `/saved-properties?${query}` : "/saved-properties");
  }, [search, router, searchParams, isAuthenticated]);

  // Fetch saved properties
  const {
    data: savedPropertiesData,
    loading: savedLoading,
    error: savedError,
  } = useSupabaseRealtime<SavedProperty>("savedProperties", {
    enabled: !!user,
  });

  // Fetch all properties
  const { data: propertiesData, loading: propertiesLoading } =
    useSupabaseRealtime<Property>("properties", {
      enabled: !!user,
    });

  const savedProperties = savedPropertiesData ?? [];
  const allProperties = propertiesData ?? [];

  // Filter saved properties for current user
  const userSavedProperties = useMemo(
    () => savedProperties.filter((sp) => sp.userId === user?.uid),
    [savedProperties, user?.uid]
  );

  // Filter by search term
  const filteredSavedProperties = useMemo(() => {
    if (!search.trim()) return userSavedProperties;

    const term = search.trim().toLowerCase();
    const propertyMap = new Map(allProperties.map((p) => [p.id, p]));

    return userSavedProperties.filter((sp) => {
      const property = propertyMap.get(sp.propertyId);
      if (!property) return false;

      return (
        property.title.toLowerCase().includes(term) ||
        property.address.toLowerCase().includes(term) ||
        property.city.toLowerCase().includes(term) ||
        property.state.toLowerCase().includes(term)
      );
    });
  }, [userSavedProperties, allProperties, search]);

  const loading = savedLoading || propertiesLoading;
  const hasError = !!savedError;

  const handleUnsave = () => {
    // Trigger a refresh by updating the key
    setRefreshKey((prev) => prev + 1);
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto max-w-7xl p-4 md:p-6 space-y-6"
    >
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-light tracking-tight">
          Saved Properties
        </h1>
        <p className="text-sm text-muted-foreground">
          View and manage all your saved properties in one place.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search saved properties..."
          className="pl-9"
        />
      </div>

      {/* Stats */}
      {!loading && (
        <div className="text-sm text-muted-foreground">
          {filteredSavedProperties.length === 0 ? (
            <span>No saved properties</span>
          ) : (
            <span>
              {filteredSavedProperties.length} saved
              {filteredSavedProperties.length === 1
                ? " property"
                : " properties"}
            </span>
          )}
        </div>
      )}

      <SavedPropertiesList
        savedProperties={filteredSavedProperties}
        properties={allProperties}
        loading={loading}
        errorMessage={
          hasError ? "Failed to load saved properties. Please try again." : null
        }
        userId={user.uid}
        onUnsave={handleUnsave}
        key={refreshKey}
      />
    </motion.div>
  );
}
