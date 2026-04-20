"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Property } from "@/lib/types/property.type";
import { PropertyCard } from "@/app/(marketing)/properties/_components/property-card";
import { AgentSubscribeForm } from "./_components/agent-subscribe-form";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Building2, Globe, Mail, Phone } from "lucide-react";

type AgentRow = {
  user_id: string;
  brokerage_name: string | null;
  bio: string | null;
  banner_image: string | null;
  tagline: string | null;
  website: string | null;
  phone_display: string | null;
  service_areas: unknown;
  microsite_enabled: boolean | null;
  slug: string | null;
};

type ProfileRow = {
  id: string;
  name: string | null;
  email: string | null;
  profilePicture: string | null;
};

export default function AgentMicrositePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [agent, setAgent] = useState<AgentRow | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    if (!slug) return;
    const supabase = createClient();

    void (async () => {
      const { data: ap, error } = await supabase
        .from("agent_profiles")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error || !ap) {
        setInvalid(true);
        setLoading(false);
        return;
      }

      const row = ap as AgentRow;
      if (!row.microsite_enabled || !row.slug) {
        setInvalid(true);
        setLoading(false);
        return;
      }

      const { data: prof } = await supabase
        .from("profiles")
        .select("id,name,email,profilePicture")
        .eq("id", row.user_id)
        .single();

      const { data: props } = await supabase
        .from("properties")
        .select("*")
        .eq("userId", row.user_id)
        .order("createdAt", { ascending: false })
        .limit(60);

      setAgent(row);
      setProfile(prof as ProfileRow);
      setProperties(((props ?? []) as unknown) as Property[]);
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl space-y-8 p-4 md:p-6">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (invalid || !agent || !profile) {
    return (
      <div className="container mx-auto max-w-lg py-20 text-center">
        <h1 className="text-xl font-light">Micro-site not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This agent page is unavailable or has not been published.
        </p>
        <Button asChild className="mt-6">
          <Link href="/properties">Browse properties</Link>
        </Button>
      </div>
    );
  }

  const displayName = profile.name || "Agent";
  const activeProps = properties.filter(
    (p) => (p.status ?? "active") === "active"
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="relative h-48 w-full overflow-hidden bg-muted md:h-64">
        {agent.banner_image ? (
          <Image
            src={agent.banner_image}
            alt=""
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <Building2 className="size-16 text-primary/40" />
          </div>
        )}
      </div>

      <div className="container mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div className="flex shrink-0 -mt-16 md:-mt-20">
            <div className="relative size-28 overflow-hidden rounded-full border-4 border-background bg-muted shadow-lg md:size-32">
              {profile.profilePicture ? (
                <Image
                  src={profile.profilePicture}
                  alt={displayName}
                  fill
                  className="object-cover"
                  sizes="128px"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Building2 className="size-12 text-primary/50" />
                </div>
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-2 pt-2 md:pt-4">
            <h1 className="text-2xl font-light tracking-tight text-slate-700 dark:text-gray-100 md:text-3xl">
              {displayName}
            </h1>
            {agent.brokerage_name && (
              <p className="text-sm text-muted-foreground">
                {agent.brokerage_name}
              </p>
            )}
            {agent.tagline && (
              <p className="text-sm font-medium text-primary">{agent.tagline}</p>
            )}
            {agent.bio && (
              <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                {agent.bio}
              </p>
            )}
            <div className="flex flex-wrap gap-4 pt-2 text-sm text-muted-foreground">
              {agent.phone_display && (
                <span className="flex items-center gap-1.5">
                  <Phone className="size-4 shrink-0" />
                  {agent.phone_display}
                </span>
              )}
              {profile.email && (
                <a
                  href={`mailto:${profile.email}`}
                  className="flex items-center gap-1.5 hover:text-primary"
                >
                  <Mail className="size-4 shrink-0" />
                  Email
                </a>
              )}
              {agent.website && (
                <a
                  href={agent.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-primary"
                >
                  <Globe className="size-4 shrink-0" />
                  Website
                </a>
              )}
            </div>
            <p className="pt-2 text-xs text-muted-foreground">
              <Link href="/properties" className="text-primary hover:underline">
                Browse all properties
              </Link>{" "}
              on Africa Property Finder
            </p>
          </div>
        </div>

        <AgentSubscribeForm agentId={profile.id} agentName={displayName} />

        <section className="space-y-4">
          <h2 className="text-lg font-light tracking-tight text-slate-700 dark:text-gray-100">
            Listings ({activeProps.length})
          </h2>
          {activeProps.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No active listings at the moment.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {activeProps.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
