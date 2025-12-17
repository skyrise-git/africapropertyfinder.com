"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowLeft, Heart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Property } from "@/lib/types/property.type";

type PropertyHeaderProps = {
  property: Property;
  isSaved: boolean;
  onToggleSave: () => void;
  onShare: () => void;
};

export function PropertyHeader({
  property,
  isSaved,
  onToggleSave,
  onShare,
}: PropertyHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-between gap-4 flex-wrap"
    >
      <div className="flex items-center gap-4 flex-wrap">
        <Link href="/properties">
          <Button variant="ghost" size="sm" className="group">
            <ArrowLeft className="h-4 w-4 mr-2 transition-transform duration-300 group-hover:-translate-x-1" />
            Back to Properties
          </Button>
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold">{property.title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleSave}
          className="gap-2"
        >
          <Heart
            className={`h-4 w-4 transition-colors ${
              isSaved ? "fill-red-500 text-red-500" : ""
            }`}
          />
          {isSaved ? "Saved" : "Save"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onShare}
          className="gap-2"
        >
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </div>
    </motion.div>
  );
}


