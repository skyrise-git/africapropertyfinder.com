"use client";

import { useCallback, useEffect, useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Plus } from "lucide-react";
import type { NeighborhoodGuideContent } from "@/lib/types/user.type";
import type { Json } from "@/lib/supabase/database.types";

type GuideRow = {
  id: string;
  slug: string;
  title: string;
  city: string;
  country: string;
  state: string | null;
  description: string | null;
  cover_image: string | null;
  published: boolean;
  content: NeighborhoodGuideContent | Record<string, unknown>;
};

const emptyForm = {
  slug: "",
  title: "",
  city: "",
  country: "",
  state: "",
  description: "",
  cover_image: "",
  published: false,
  lifestyle: "",
  safety_summary: "",
  schoolsJson: "[]",
  transportJson: "[]",
  healthcareJson: "[]",
};

export default function NeighborhoodGuidesAdminPage() {
  const { user } = useAppStore();
  const [rows, setRows] = useState<GuideRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<GuideRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    setLoading(true);
    const { data, error } = await supabase
      .from("neighborhood_guides")
      .select("*")
      .order("createdAt", { ascending: false });
    if (error) {
      toast.error(error.message);
      setRows([]);
    } else {
      setRows((data ?? []) as GuideRow[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user || (user.role !== "admin" && user.role !== "staff")) return;
    void load();
  }, [user, load]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (g: GuideRow) => {
    setEditing(g);
    const c = (g.content ?? {}) as NeighborhoodGuideContent;
    setForm({
      slug: g.slug,
      title: g.title,
      city: g.city,
      country: g.country,
      state: g.state ?? "",
      description: g.description ?? "",
      cover_image: g.cover_image ?? "",
      published: g.published,
      lifestyle: c.lifestyle ?? "",
      safety_summary: c.safety_summary ?? "",
      schoolsJson: JSON.stringify(c.schools ?? [], null, 2),
      transportJson: JSON.stringify(c.transport ?? [], null, 2),
      healthcareJson: JSON.stringify(c.healthcare ?? [], null, 2),
    });
    setOpen(true);
  };

  const save = async () => {
    if (!user?.uid) return;
    if (!form.slug.trim() || !form.title.trim() || !form.city || !form.country) {
      toast.error("Slug, title, city, and country are required.");
      return;
    }
    let schools: unknown;
    let transport: unknown;
    let healthcare: unknown;
    try {
      schools = JSON.parse(form.schoolsJson || "[]");
      transport = JSON.parse(form.transportJson || "[]");
      healthcare = JSON.parse(form.healthcareJson || "[]");
    } catch {
      toast.error("Schools, transport, or healthcare JSON is invalid.");
      return;
    }
    const content: NeighborhoodGuideContent = {
      schools: schools as NeighborhoodGuideContent["schools"],
      transport: transport as NeighborhoodGuideContent["transport"],
      healthcare: healthcare as NeighborhoodGuideContent["healthcare"],
      lifestyle: form.lifestyle || undefined,
      safety_summary: form.safety_summary || undefined,
    };

    setSaving(true);
    const supabase = createClient();
    const basePayload = {
      slug: form.slug.trim().toLowerCase().replace(/\s+/g, "-"),
      title: form.title.trim(),
      city: form.city.trim(),
      country: form.country.trim(),
      state: form.state.trim() || null,
      description: form.description.trim() || null,
      cover_image: form.cover_image.trim() || null,
      published: form.published,
      content: JSON.parse(JSON.stringify(content)) as Json,
      author_id: user.uid,
      updatedAt: new Date().toISOString(),
    };

    const q = editing
      ? supabase
          .from("neighborhood_guides")
          .update(basePayload)
          .eq("id", editing.id)
      : supabase.from("neighborhood_guides").insert({
          ...basePayload,
          createdAt: new Date().toISOString(),
        });

    const { error } = await q;
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? "Guide updated" : "Guide created");
    setOpen(false);
    void load();
  };

  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        You do not have access to this page.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-light tracking-tight">Neighborhood guides</h1>
          <p className="text-sm text-muted-foreground">
            SEO pages for areas; published guides appear on the marketing site.
          </p>
        </div>
        <Button type="button" onClick={openNew}>
          <Plus className="mr-2 size-4" />
          New guide
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-light">All guides</CardTitle>
          <CardDescription>Drafts are only visible here until published.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.title}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {r.city}, {r.country}
                      </TableCell>
                      <TableCell>{r.published ? "Yes" : "No"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(r)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-light">
              {editing ? "Edit guide" : "New guide"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>URL slug</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="sandton-johannesburg"
              />
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input
                  value={form.country}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, country: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Province / state</Label>
              <Input
                value={form.state}
                onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Short description</Label>
              <Textarea
                rows={2}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Cover image URL</Label>
              <Input
                value={form.cover_image}
                onChange={(e) =>
                  setForm((f) => ({ ...f, cover_image: e.target.value }))
                }
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="pub">Published</Label>
              <Switch
                id="pub"
                checked={form.published}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, published: v }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Lifestyle</Label>
              <Textarea
                rows={3}
                value={form.lifestyle}
                onChange={(e) =>
                  setForm((f) => ({ ...f, lifestyle: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Safety summary</Label>
              <Textarea
                rows={2}
                value={form.safety_summary}
                onChange={(e) =>
                  setForm((f) => ({ ...f, safety_summary: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Schools (JSON array)</Label>
              <Textarea
                rows={4}
                className="font-mono text-xs"
                value={form.schoolsJson}
                onChange={(e) =>
                  setForm((f) => ({ ...f, schoolsJson: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Transport (JSON array)</Label>
              <Textarea
                rows={4}
                className="font-mono text-xs"
                value={form.transportJson}
                onChange={(e) =>
                  setForm((f) => ({ ...f, transportJson: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Healthcare (JSON array)</Label>
              <Textarea
                rows={4}
                className="font-mono text-xs"
                value={form.healthcareJson}
                onChange={(e) =>
                  setForm((f) => ({ ...f, healthcareJson: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={saving} onClick={() => void save()}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
