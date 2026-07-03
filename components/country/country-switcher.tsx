"use client";

import { Check, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCountry } from "@/contexts/country-context";
import { getCountryDomainConfig } from "@/lib/config/country-domain";
import { cn } from "@/lib/utils";
import type { CountryCode } from "@/lib/utils/country";

type Props = {
  className?: string;
  /** Compact = icon + flag only on mobile, expands on desktop. */
  compact?: boolean;
};

export function CountrySwitcher({ className, compact = false }: Props) {
  const { country, countryCode, countries, setCountry } = useCountry();

  const handleSelectCountry = (code: CountryCode) => {
    setCountry(code);

    const target = getCountryDomainConfig(code);
    const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const targetUrl = new URL(currentPath, target.origin);

    if (window.location.host.toLowerCase() === targetUrl.host.toLowerCase()) {
      return;
    }

    window.location.assign(targetUrl.toString());
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("gap-1.5 px-2", className)}
          aria-label="Change country and currency"
        >
          <Globe className="size-4 text-muted-foreground" />
          <span className="text-base leading-none">{country.flag}</span>
          {!compact && (
            <span className="hidden text-sm font-medium md:inline">
              {country.code}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Country & currency
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {countries.map((c) => {
          const active = c.code === countryCode;
          return (
            <DropdownMenuItem
              key={c.code}
              onClick={() => handleSelectCountry(c.code as CountryCode)}
              className="flex items-center justify-between gap-2"
            >
              <span className="flex items-center gap-2">
                <span className="text-base leading-none">{c.flag}</span>
                <span className="text-sm">{c.name}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {c.currency}
                </span>
                {active && <Check className="size-3.5 text-primary" />}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
