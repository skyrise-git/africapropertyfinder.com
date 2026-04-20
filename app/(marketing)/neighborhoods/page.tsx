"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin } from "lucide-react";

type Guide = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  city: string;
  country: string;
  cover_image: string | null;
};

export default function NeighborhoodsIndexPage() {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    void supabase
      .from("neighborhood_guides")
      .select("id,slug,title,description,city,country,cover_image")
      .eq("published", true)
      .order("country")
      .order("city")
      .then(({ data, error }) => {
        if (!error && data) setGuides(data as Guide[]);
        setLoading(false);
      });
  }, []);

  const filtered = guides.filter((g) => {
    const t = q.trim().toLowerCase();
    if (!t) return true;
    return (
      g.title.toLowerCase().includes(t) ||
      g.city.toLowerCase().includes(t) ||
      g.country.toLowerCase().includes(t)
    );
  });

  return (
    <div className="container mx-auto max-w-7xl space-y-8 px-4 py-10 md:px-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-light tracking-tight text-slate-700 dark:text-gray-100">
          Neighborhood guides
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Explore schools, transport, lifestyle, and safety context for areas we
          cover. Pair this with listings in the same city.
        </p>
      </div>

      <Input
        placeholder="Search by city or country…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="max-w-md"
      />

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((g) => (
            <Link key={g.id} href={`/neighborhoods/${g.slug}`}>
              <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
                <div className="relative aspect-[16/10] bg-muted">
                  {g.cover_image ? (
                    <Image
                      src={g.cover_image}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width:768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <MapPin className="size-10 opacity-40" />
                    </div>
                  )}
                </div>
                <CardContent className="space-y-1 p-4">
                  <h2 className="font-medium text-slate-700 dark:text-gray-100">
                    {g.title}
                  </h2>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="size-3" />
                    {g.city}, {g.country}
                  </p>
                  {g.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {g.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">No guides match your search.</p>
      )}
    </div>
  );
}
