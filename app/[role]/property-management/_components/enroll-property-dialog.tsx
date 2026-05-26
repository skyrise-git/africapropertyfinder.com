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
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore } from "@/hooks/use-app-store";
import { propertyService } from "@/lib/services/property.service";
import type {
  ListingType,
  Property,
  PropertyType,
} from "@/lib/types/property.type";

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

interface ManualForm {
  title: string;
  listingType: ListingType;
  propertyType: PropertyType;
  numBedrooms: number;
  numBathrooms: number;
  address: string;
  city: string;
  state: string;
  country: string;
  rent: number;
  currency: string;
}

const emptyManual: ManualForm = {
  title: "",
  listingType: "rent",
  propertyType: "apartment",
  numBedrooms: 1,
  numBathrooms: 1,
  address: "",
  city: "",
  state: "",
  country: "South Africa",
  rent: 0,
  currency: "ZAR",
};

export function EnrollPropertyDialog({
  onEnrolled,
  variant = "default",
  label = "Add property for management",
  size = "sm",
}: Props) {
  const { user } = useAppStore();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"existing" | "manual">("existing");

  const [props, setProps] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [enrolling, setEnrolling] = useState<string | null>(null);

  const [form, setForm] = useState<ManualForm>(emptyManual);
  const [submitting, setSubmitting] = useState(false);

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

  async function submitManual() {
    if (!user?.uid) {
      toast.error("Sign in required");
      return;
    }
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!form.address.trim() || !form.city.trim()) {
      toast.error("Address and city are required");
      return;
    }
    if (form.listingType === "rent" && form.rent <= 0) {
      toast.error("Rent must be greater than zero");
      return;
    }

    setSubmitting(true);
    try {
      // Create a minimal property; we do not require map coordinates here.
      const id = await propertyService.create({
        userId: user.uid,
        title: form.title.trim(),
        listingType: form.listingType,
        propertyType: form.propertyType,
        numBedrooms: Number(form.numBedrooms) || 0,
        numBathrooms: Number(form.numBathrooms) || 0,
        furnishing: "unfurnished",
        rent: form.listingType === "rent" ? Number(form.rent) || 0 : undefined,
        paymentFrequency: form.listingType === "rent" ? "monthly" : undefined,
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim() || form.city.trim(),
        country: form.country.trim() || "South Africa",
        location: { latitude: 0, longitude: 0 },
        contactName: user.name || user.email || "",
        preferredContactMethod: ["email"],
        contactInfo: { email: user.email || "" },
        images: [],
      });

      await propertyService.enableManagement(id);
      toast.success("Property created and enrolled in management");
      onEnrolled?.(id);
      setForm(emptyManual);
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setSubmitting(false);
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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add property for management</DialogTitle>
          <DialogDescription>
            Pick one of your existing properties or enter the details manually.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as "existing" | "manual")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing">Pick existing</TabsTrigger>
            <TabsTrigger value="manual">Add new manually</TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-3 py-2">
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
                <div className="space-y-2 p-6 text-center text-sm text-muted-foreground">
                  <p>
                    No eligible properties. Either you have none yet, or all of
                    yours are already under management.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setTab("manual")}
                  >
                    Add a new one manually
                  </Button>
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
          </TabsContent>

          <TabsContent value="manual" className="space-y-3 py-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="title">Property title *</Label>
                <Input
                  id="title"
                  placeholder="e.g. 12 Acacia Lane, Sandton"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="listingType">Listing type</Label>
                <Select
                  value={form.listingType}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, listingType: v as ListingType }))
                  }
                >
                  <SelectTrigger id="listingType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rent">Rent</SelectItem>
                    <SelectItem value="sale">Sale</SelectItem>
                    <SelectItem value="student-housing">
                      Student housing
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="propertyType">Property type</Label>
                <Select
                  value={form.propertyType}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, propertyType: v as PropertyType }))
                  }
                >
                  <SelectTrigger id="propertyType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="townhouse">Townhouse</SelectItem>
                    <SelectItem value="condo">Condo</SelectItem>
                    <SelectItem value="studio">Studio</SelectItem>
                    <SelectItem value="room">Room</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="beds">Bedrooms</Label>
                <Input
                  id="beds"
                  type="number"
                  min={0}
                  value={form.numBedrooms}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      numBedrooms: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="baths">Bathrooms</Label>
                <Input
                  id="baths"
                  type="number"
                  min={0}
                  value={form.numBathrooms}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      numBathrooms: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  placeholder="Street address"
                  value={form.address}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, address: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, city: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="state">State / Province</Label>
                <Input
                  id="state"
                  value={form.state}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, state: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={form.country}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, country: e.target.value }))
                  }
                />
              </div>
              {form.listingType === "rent" ? (
                <>
                  <div>
                    <Label htmlFor="rent">Monthly rent *</Label>
                    <Input
                      id="rent"
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.rent}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          rent: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={form.currency}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, currency: v }))
                      }
                    >
                      <SelectTrigger id="currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ZAR">ZAR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="ZWL">ZWL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : null}
            </div>
            <p className="text-muted-foreground text-xs">
              Tip: you can fill in the full listing later (photos, amenities,
              etc.) from the Properties page. We just need the basics here to
              start managing it.
            </p>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
          {tab === "manual" ? (
            <Button onClick={submitManual} disabled={submitting}>
              {submitting ? "Saving…" : "Create &amp; enroll"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
