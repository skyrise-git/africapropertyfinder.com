"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCountry } from "@/contexts/country-context";
import { Globe, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CountryCode } from "@/lib/utils/country";

export function GeoDetectBanner() {
  const {
    showGeoBanner,
    country,
    countries,
    setCountry,
    dismissGeoBanner,
  } = useCountry();
  const [open, setOpen] = useState(false);

  if (!showGeoBanner) return null;

  return (
    <div className="border-b border-primary/20 bg-primary/5">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 text-xs sm:text-sm">
        <Globe className="size-4 shrink-0 text-primary" />
        <p className="flex-1 text-muted-foreground">
          Showing prices in <strong className="text-slate-700 dark:text-gray-100">{country.name} ({country.currency})</strong>{" "}
          based on your location.
        </p>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="link" size="sm" className="h-auto p-0 text-xs sm:text-sm">
              Change country
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {countries
              .filter((c) => c.code !== country.code)
              .map((c) => (
                <DropdownMenuItem
                  key={c.code}
                  onClick={() => setCountry(c.code as CountryCode)}
                  className="gap-2"
                >
                  <span>{c.flag}</span>
                  <span>{c.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {c.currency}
                  </span>
                </DropdownMenuItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="ghost"
          size="icon"
          onClick={dismissGeoBanner}
          className="size-6 shrink-0"
          aria-label="Dismiss"
        >
          <X className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
