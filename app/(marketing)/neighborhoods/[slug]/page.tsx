"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { Property } from "@/lib/types/property.type";
import type { NeighborhoodGuideContent } from "@/lib/types/user.type";
import { PropertyCard } from "@/app/(marketing)/properties/_components/property-card";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, School, Train, HeartPulse, Trees } from "lucide-react";

type Guide = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  city: string;
  country: string;
  state: string | null;
  cover_image: string | null;
  content: NeighborhoodGuideContent | Record<string, unknown>;
};

export default function NeighborhoodGuideDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [guide, setGuide] = useState<Guide | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const supabase = createClient();
    void (async () => {
      const { data, error } = await supabase
        .from("neighborhood_guides")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();

      if (error || !data) {
        setGuide(null);
        setLoading(false);
        return;
      }

      const g = data as Guide;
      setGuide(g);

      const { data: props } = await supabase
        .from("properties")
        .select("*")
        .eq("city", g.city)
        .eq("country", g.country)
        .limit(12);

      setProperties(
        ((props ?? []) as unknown as Property[]).filter(
          (p) => (p.status ?? "active") === "active"
        )
      );
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl space-y-6 px-4 py-10">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="container mx-auto max-w-lg py-20 text-center px-4">
        <h1 className="text-xl font-light">Guide not found</h1>
        <Link href="/neighborhoods" className="mt-4 inline-block text-primary hover:underline">
          Back to neighborhood guides
        </Link>
      </div>
    );
  }

  const c = (guide.content ?? {}) as NeighborhoodGuideContent;
  const schools = c.schools ?? [];
  const transport = c.transport ?? [];
  const healthcare = c.healthcare ?? [];

  return (
    <article className="pb-16">
      <div className="relative h-56 w-full bg-muted md:h-72">
        {guide.cover_image ? (
          <Image
            src={guide.cover_image}
            alt=""
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        ) : null}
      </div>

      <div className="container mx-auto max-w-4xl space-y-8 px-4 py-8 md:px-6">
        <header className="space-y-2">
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <MapPin className="size-4" />
            {guide.city}
            {guide.state ? `, ${guide.state}` : ""}, {guide.country}
          </p>
          <h1 className="text-3xl font-light tracking-tight text-slate-700 dark:text-gray-100">
            {guide.title}
          </h1>
          {guide.description && (
            <p className="text-muted-foreground leading-relaxed">{guide.description}</p>
          )}
        </header>

        {c.lifestyle && (
          <section className="space-y-2">
            <h2 className="flex items-center gap-2 text-lg font-light">
              <Trees className="size-5 text-primary" />
              Lifestyle
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
              {c.lifestyle}
            </p>
          </section>
        )}

        {c.safety_summary && (
          <section className="rounded-lg border border-border/80 bg-muted/30 p-4 text-sm text-muted-foreground">
            {c.safety_summary}
          </section>
        )}

        {schools.length > 0 && (
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-lg font-light">
              <School className="size-5 text-primary" />
              Schools
            </h2>
            <ul className="space-y-2 text-sm">
              {schools.map((s, i) => (
                <li key={i} className="flex flex-wrap gap-2 border-b border-border/50 pb-2 last:border-0">
                  <span className="font-medium">{s.name}</span>
                  {s.type && (
                    <span className="text-muted-foreground">({s.type})</span>
                  )}
                  {s.distance && (
                    <span className="text-muted-foreground">{s.distance}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {transport.length > 0 && (
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-lg font-light">
              <Train className="size-5 text-primary" />
              Transport
            </h2>
            <ul className="space-y-2 text-sm">
              {transport.map((t, i) => (
                <li key={i} className="flex flex-wrap gap-2 border-b border-border/50 pb-2 last:border-0">
                  <span className="font-medium">{t.name}</span>
                  {t.type && (
                    <span className="text-muted-foreground">({t.type})</span>
                  )}
                  {t.distance && (
                    <span className="text-muted-foreground">{t.distance}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {healthcare.length > 0 && (
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-lg font-light">
              <HeartPulse className="size-5 text-primary" />
              Healthcare
            </h2>
            <ul className="space-y-2 text-sm">
              {healthcare.map((h, i) => (
                <li key={i}>
                  <span className="font-medium">{h.name}</span>
                  {h.type && (
                    <span className="text-muted-foreground"> — {h.type}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {properties.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-light">Properties in {guide.city}</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {properties.slice(0, 6).map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
            <Link
              href={`/properties?city=${encodeURIComponent(guide.city)}&country=${encodeURIComponent(guide.country)}`}
              className="inline-block text-sm font-medium text-primary hover:underline"
            >
              View all listings in this area
            </Link>
          </section>
        )}
      </div>
    </article>
  );
}
