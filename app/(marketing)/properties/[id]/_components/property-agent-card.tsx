"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Building2, ExternalLink, Phone, Globe, Mail } from "lucide-react";

interface AgentInfo {
  name: string;
  email: string;
  role: string;
  profilePicture?: string;
  brokerage_name?: string;
  phone_display?: string;
  website?: string;
  bio?: string;
  slug?: string | null;
  microsite_enabled?: boolean | null;
}

interface PropertyAgentCardProps {
  userId: string;
}

export function PropertyAgentCard({ userId }: PropertyAgentCardProps) {
  const [agent, setAgent] = useState<AgentInfo | null>(null);

  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      const supabase = createClient();

      const { data: profile } = await supabase
        .from("profiles")
        .select("id,name,email,role,profilePicture")
        .eq("id", userId)
        .single();

      if (!profile || (profile as { role: string }).role !== "agent") return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: agentProfile } = await (supabase as any)
        .from("agent_profiles")
        .select(
          "brokerage_name,phone_display,website,bio,slug,microsite_enabled"
        )
        .eq("user_id", userId)
        .single();

      setAgent({
        name: (profile as { name: string }).name,
        email: (profile as { email: string }).email,
        role: "agent",
        profilePicture: (profile as { profilePicture?: string }).profilePicture,
        brokerage_name: agentProfile?.brokerage_name as string | undefined,
        phone_display: agentProfile?.phone_display as string | undefined,
        website: agentProfile?.website as string | undefined,
        bio: agentProfile?.bio as string | undefined,
        slug: agentProfile?.slug as string | null | undefined,
        microsite_enabled: agentProfile?.microsite_enabled as
          | boolean
          | null
          | undefined,
      });
    };

    load();
  }, [userId]);

  if (!agent) return null;

  return (
    <Card className="border-primary/20">
      <CardContent className="flex items-start gap-4 py-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          {agent.profilePicture ? (
            <img
              src={agent.profilePicture}
              alt={agent.name}
              className="size-12 rounded-full object-cover"
            />
          ) : (
            <Building2 className="size-6" />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{agent.name}</p>
            <Badge variant="secondary" className="text-[10px]">
              Agent
            </Badge>
          </div>
          {agent.brokerage_name && (
            <p className="text-xs text-muted-foreground">
              {agent.brokerage_name}
            </p>
          )}
          {agent.bio && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {agent.bio}
            </p>
          )}
          <div className="flex flex-wrap gap-3 pt-1 text-xs text-muted-foreground">
            {agent.phone_display && (
              <span className="flex items-center gap-1">
                <Phone className="size-3" />
                {agent.phone_display}
              </span>
            )}
            {agent.email && (
              <span className="flex items-center gap-1">
                <Mail className="size-3" />
                {agent.email}
              </span>
            )}
            {agent.website && (
              <a
                href={agent.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <Globe className="size-3" />
                Website
              </a>
            )}
            {agent.microsite_enabled && agent.slug && (
              <Link
                href={`/agents/${agent.slug}`}
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <ExternalLink className="size-3" />
                All listings
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
