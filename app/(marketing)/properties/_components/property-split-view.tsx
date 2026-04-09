"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Home } from "lucide-react";

import type { Property } from "@/lib/types/property.type";
import { PropertyCard } from "./property-card";
import { PropertyMapView } from "./property-map-view";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface PropertySplitViewProps {
  properties: Property[];
  paginated: Property[];
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  initialSelectedId?: string | null;
}

export function PropertySplitView({
  properties,
  paginated,
  totalPages,
  currentPage,
  onPageChange,
  initialSelectedId,
}: PropertySplitViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId ?? null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const cardsContainerRef = useRef<HTMLDivElement | null>(null);

  const handleCardClick = useCallback((id: string) => {
    setSelectedId(id);
    // Scroll card into view within the cards container
    const cardElement = cardRefs.current[id];
    const container = cardsContainerRef.current;
    if (cardElement && container) {
      const scrollTop = container.scrollTop;
      const cardOffsetTop = cardElement.offsetTop;
      const cardHeight = cardElement.offsetHeight;
      const containerHeight = container.clientHeight;

      // Calculate if card is visible
      const cardTop = cardOffsetTop - scrollTop;
      const cardBottom = cardTop + cardHeight;

      if (cardTop < 0 || cardBottom > containerHeight) {
        // Scroll to center the card in the container
        const targetScroll = cardOffsetTop - containerHeight / 2 + cardHeight / 2;
        container.scrollTo({
          top: Math.max(0, targetScroll),
          behavior: "smooth",
        });
      }
    }
  }, []);

  const handleMarkerClick = useCallback((id: string) => {
    setSelectedId(id);
    // Scroll to card within the cards container if it's in the current page
    const cardElement = cardRefs.current[id];
    const container = cardsContainerRef.current;
    if (cardElement && container) {
      const cardOffsetTop = cardElement.offsetTop;
      const cardHeight = cardElement.offsetHeight;
      const containerHeight = container.clientHeight;

      // Scroll to center the card in the container
      const targetScroll = cardOffsetTop - containerHeight / 2 + cardHeight / 2;
      container.scrollTo({
        top: Math.max(0, targetScroll),
        behavior: "smooth",
      });
    }
  }, []);

  const handlePropertySelect = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  // Clear selection when page changes
  useEffect(() => {
    setSelectedId(null);
  }, [currentPage]);

  // Scroll to the initially-selected card when mounting from map view
  useEffect(() => {
    if (!initialSelectedId) return;
    setSelectedId(initialSelectedId);
    requestAnimationFrame(() => {
      const el = cardRefs.current[initialSelectedId];
      const container = cardsContainerRef.current;
      if (el && container) {
        const targetScroll = el.offsetTop - container.clientHeight / 2 + el.offsetHeight / 2;
        container.scrollTo({ top: Math.max(0, targetScroll), behavior: "smooth" });
      }
    });
  }, [initialSelectedId]);

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
      {/* Cards Section - Left Side */}
      <div className="flex flex-1 flex-col lg:max-w-[50%]">
        <div
          ref={cardsContainerRef}
          className="flex-1 overflow-y-auto rounded-xl border border-border/60 bg-card/70 p-4 shadow-sm lg:h-[70vh]"
        >
          <AnimatePresence mode="popLayout">
            {paginated.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border/60 bg-muted/40 p-10 text-center"
              >
                <Home className="h-10 w-10 text-muted-foreground" />
                <h3 className="text-lg font-semibold">No properties found</h3>
                <p className="max-w-md text-sm text-muted-foreground">
                  Try adjusting your search criteria to see more results.
                </p>
              </motion.div>
            ) : (
              <motion.div
                layout
                className="grid grid-cols-1 gap-4"
              >
                {paginated.map((property) => (
                  <motion.div
                    key={property.id}
                    ref={(el) => {
                      cardRefs.current[property.id] = el;
                    }}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    onMouseEnter={() => handleCardClick(property.id)}
                    className={`
                      transition-all duration-200
                      ${
                        selectedId === property.id
                          ? "ring-2 ring-primary ring-offset-2"
                          : "hover:ring-2 hover:ring-primary/50 hover:ring-offset-1"
                      }
                    `}
                  >
                    <PropertyCard
                      property={property}
                      href={`/properties/${property.id}`}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Pagination - Only for cards */}
        {totalPages > 1 && (
          <Pagination className="pt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href={`?page=${Math.max(1, currentPage - 1)}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onPageChange(Math.max(1, currentPage - 1));
                  }}
                />
              </PaginationItem>

              {Array.from({ length: totalPages }).map((_, index) => {
                const pageNumber = index + 1;
                const isActive = pageNumber === currentPage;

                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      href={`?page=${pageNumber}`}
                      isActive={isActive}
                      onClick={(e) => {
                        e.preventDefault();
                        onPageChange(pageNumber);
                      }}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              <PaginationItem>
                <PaginationNext
                  href={`?page=${Math.min(totalPages, currentPage + 1)}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onPageChange(Math.min(totalPages, currentPage + 1));
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>

      {/* Map Section - Right Side - Sticky */}
      <div className="flex-1 lg:sticky lg:top-4 lg:self-start lg:max-w-[50%]">
        <PropertyMapView
          properties={properties}
          selectedId={selectedId}
          onMarkerClick={handleMarkerClick}
          onPropertySelect={handlePropertySelect}
        />
      </div>
    </div>
  );
}
