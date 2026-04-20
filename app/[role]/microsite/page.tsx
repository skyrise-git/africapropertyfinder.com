"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/hooks/use-app-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useUploadThing } from "@/lib/utils/uploadthing";
import { ExternalLink, ImageIcon, Loader2 } from "lucide-react";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export default function AgentMicrositeSettingsPage() {
  const { user } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState("");
  const [tagline, setTagline] = useState("");
  const [bannerImage, setBannerImage] = useState("");
  const [micrositeEnabled, setMicrositeEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  const { startUpload, isUploading } = useUploadThing("imageUploader", {
    onClientUploadComplete: (res) => {
      const url = res?.[0]?.url;
      if (url) {
        setBannerImage(url);
        toast.success("Banner uploaded");
      }
    },
    onUploadError: (e) => {
      toast.error(e.message);
    },
  });

  useEffect(() => {
    if (!user?.uid || user.role !== "agent") return;
    const supabase = createClient();
    void (async () => {
      const { data, error } = await supabase
        .from("agent_profiles")
        .select(
          "slug,tagline,banner_image,microsite_enabled"
        )
        .eq("user_id", user.uid)
        .maybeSingle();

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      if (data) {
        const row = data as Record<string, unknown>;
        setSlug((row.slug as string) ?? "");
        setTagline((row.tagline as string) ?? "");
        setBannerImage((row.banner_image as string) ?? "");
        setMicrositeEnabled(Boolean(row.microsite_enabled));
      }
      setLoading(false);
    })();
  }, [user?.uid, user?.role]);

  if (!user || user.role !== "agent") {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        This page is only available to agents.
      </div>
    );
  }

  const save = async () => {
    const s = slug.trim().toLowerCase();
    if (micrositeEnabled && s && !SLUG_RE.test(s)) {
      toast.error(
        "Use a lowercase URL slug with letters, numbers, and hyphens only."
      );
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("agent_profiles").upsert(
      {
        user_id: user.uid,
        slug: s || null,
        tagline: tagline.trim() || null,
        banner_image: bannerImage || null,
        microsite_enabled: micrositeEnabled && !!s,
        updatedAt: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Micro-site settings saved");
  };

  const publicUrl =
    typeof window !== "undefined" && slug
      ? `${window.location.origin}/agents/${slug}`
      : "";

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-4 sm:p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-light tracking-tight text-slate-700 dark:text-gray-100">
          My micro-site
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Publish a branded page with your listings. The same listings still
          appear in the main search.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-light">Visibility</CardTitle>
          <CardDescription>
            Turn on only after you choose a URL slug. Visitors only see your page
            when it is enabled.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <Label htmlFor="ms-en">Publish micro-site</Label>
          <Switch
            id="ms-en"
            checked={micrositeEnabled}
            onCheckedChange={setMicrositeEnabled}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-light">URL & copy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="slug">URL slug</Label>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="truncate">…/agents/</span>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                placeholder="your-name-realty"
                className="max-w-xs font-mono text-sm"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tag">Tagline</Label>
            <Textarea
              id="tag"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Short line under your name"
              rows={2}
            />
          </div>
          {publicUrl && micrositeEnabled && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/agents/${slug.trim().toLowerCase()}`} target="_blank">
                <ExternalLink className="mr-2 size-4" />
                Open public page
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-light">Banner image</CardTitle>
          <CardDescription>Wide image shown at the top of your page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            id="banner-upload"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void startUpload([f]);
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={isUploading}
              onClick={() => document.getElementById("banner-upload")?.click()}
            >
              {isUploading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <ImageIcon className="mr-2 size-4" />
              )}
              Upload banner
            </Button>
            {bannerImage && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setBannerImage("")}
              >
                Remove
              </Button>
            )}
          </div>
          {bannerImage && (
            <p className="break-all text-xs text-muted-foreground">{bannerImage}</p>
          )}
        </CardContent>
      </Card>

      <Button onClick={() => void save()} disabled={saving}>
        {saving ? "Saving…" : "Save settings"}
      </Button>
    </div>
  );
}
