"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertyFilters } from "./property-filters";
import type { Property } from "@/lib/types/property.type";

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
  fabRef: React.RefObject<HTMLDivElement | null>;
}

export function FilterPanel({
  isOpen,
  onClose,
  properties,
  fabRef,
}: FilterPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ bottom: 0, right: 0 });

  // Calculate position relative to FAB button
  useEffect(() => {
    if (isOpen && fabRef.current) {
      const fabRect = fabRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const panelWidth = Math.min(420, viewportWidth - 32);
      const panelHeight = Math.min(600, viewportHeight - 100);

      // Position above FAB on desktop, adjust for mobile
      const right = viewportWidth - fabRect.right;
      const bottom = viewportHeight - fabRect.top + 16; // 16px gap above FAB

      setPosition({
        bottom: Math.min(bottom, viewportHeight - 32),
        right: Math.max(right, 16),
      });
    }
  }, [isOpen, fabRef]);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Handle outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        fabRef.current &&
        !fabRef.current.contains(target)
      ) {
        onClose();
      }
    };

    // Use a small delay to avoid immediate closing on open
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, fabRef]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          initial={{
            opacity: 0,
            scale: 0.8,
            y: 20,
            x: 0,
          }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
            x: 0,
          }}
          exit={{
            opacity: 0,
            scale: 0.8,
            y: 20,
          }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 300,
            mass: 0.5,
          }}
          style={{
            position: "fixed",
            bottom: `${position.bottom}px`,
            right: `${position.right}px`,
            width: "calc(100vw - 2rem)",
            maxWidth: "420px",
            height: "600px",
            zIndex: 50,
          }}
          className="flex flex-col overflow-hidden rounded-3xl border border-border/50 bg-background/95 shadow-2xl backdrop-blur-xl ring-1 ring-border/20"
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-border/30 bg-gradient-to-br from-background via-background/98 to-background/95 px-6 py-5 backdrop-blur-sm">
            <h2 className="text-xl font-semibold tracking-tight">Filters</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-9 w-9 rounded-full hover:bg-muted/50"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close filters</span>
            </Button>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <PropertyFilters properties={properties} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
