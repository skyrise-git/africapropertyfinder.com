"use client";

import { Building2, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppStore } from "@/hooks/use-app-store";
import { propertyService } from "@/lib/services/property.service";
import type { Property } from "@/lib/types/property.type";

interface Props {
  /** When the user enrolls a property, this fires with the property id. */
  onEnrolled?: (propertyId: string) => void;
  /** Visual variant used in the trigger button. */
  variant?: "default" | "outline" | "ghost";
  /** Label override for the trigger button. */
  label?: string;
  /** Trigger size. */
  size?: "sm" | "default" | "lg" | "icon";
}

export function EnrollPropertyDialog({
  onEnrolled,
  variant = "default",
  label = "Add property for management",
  size = "sm",
}: Props) {
  const { user } = useAppStore();
  const [open, setOpen] = useState(false);
  const [props, setProps] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [enrolling, setEnrolling] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !user?.uid) return;
    setLoading(true);
    propertyService
      .getByUserId(user.uid)
      .then(setProps)
      .catch((err) => toast.error((err as Error).message))
      .finally(() => setLoading(false));
  }, [open, user?.uid]);

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    return props.filter((p) => {
      if (p.is_under_management) return false;
      if (!t) return true;
      return (
        p.title.toLowerCase().includes(t) ||
        p.city?.toLowerCase().includes(t) ||
        p.address?.toLowerCase().includes(t)
      );
    });
  }, [props, search]);

  async function enroll(p: Property) {
    setEnrolling(p.id);
    try {
      await propertyService.enableManagement(p.id);
      toast.success("Property enrolled in management");
      setProps((prev) =>
        prev.map((x) =>
          x.id === p.id ? { ...x, is_under_management: true } : x,
        ),
      );
      onEnrolled?.(p.id);
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to enroll");
    } finally {
      setEnrolling(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={size} variant={variant}>
          <Plus className="mr-2 size-4" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add property for management</DialogTitle>
          <DialogDescription>
            Pick a property you own to enroll into the property management
            module. You can still keep its public listing live.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search title, city, address…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <ScrollArea className="h-72 rounded-md border">
            {loading ? (
              <div className="p-4 text-sm text-muted-foreground">
                Loading your properties…
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No eligible properties. Either you have none yet, or all of
                yours are already under management.
              </div>
            ) : (
              <ul className="divide-y">
                {filtered.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 p-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Building2 className="size-4 text-muted-foreground" />
                        <span className="truncate font-medium text-sm">
                          {p.title}
                        </span>
                        <Badge variant="secondary" className="capitalize">
                          {p.listingType}
                        </Badge>
                      </div>
                      <div className="truncate text-muted-foreground text-xs">
                        {p.address}, {p.city}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => enroll(p)}
                      disabled={enrolling === p.id}
                    >
                      {enrolling === p.id ? "Enrolling…" : "Enroll"}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
