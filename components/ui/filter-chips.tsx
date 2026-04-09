"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FilterChip {
  id: string;
  label: string;
  value: string;
  onRemove: () => void;
}

interface FilterChipsProps {
  filters: FilterChip[];
  onClearAll?: () => void;
  className?: string;
}

export function FilterChips({
  filters,
  onClearAll,
  className,
}: FilterChipsProps) {
  if (filters.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)} aria-live="polite">
      <span className="text-xs text-muted-foreground font-medium">
        Active filters:
      </span>

      {filters.map((filter) => (
        <div
          key={filter.id}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium border border-primary/20"
        >
          <span className="text-xs text-muted-foreground">{filter.label}:</span>
          <span>{filter.value}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={filter.onRemove}
            className="h-4 w-4 p-0 hover:bg-primary/20 rounded-full"
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Remove {filter.label} filter</span>
          </Button>
        </div>
      ))}

      {filters.length > 1 && onClearAll && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          Clear all
        </Button>
      )}
    </div>
  );
}
