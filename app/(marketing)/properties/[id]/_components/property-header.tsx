"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowLeft, Heart, Share2, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAppStore } from "@/hooks/use-app-store";
import { useSupabaseRealtime } from "@/hooks/use-supabase-realtime";
import { propertyService } from "@/lib/services/property.service";
import { savedPropertyService } from "@/lib/services/saved-property.service";
import { toast } from "sonner";
import type { Property } from "@/lib/types/property.type";
import type { SavedProperty } from "@/lib/types/saved-property.type";

type PropertyHeaderProps = {
  property: Property;
  onShare: () => void;
};

export function PropertyHeader({ property, onShare }: PropertyHeaderProps) {
  const router = useRouter();
  const { user } = useAppStore();
  const isOwner = user?.uid === property.userId;

  // Get all saved properties for the current user
  const { data: savedPropertiesData } = useSupabaseRealtime<SavedProperty>(
    "savedProperties",
    { enabled: !!user }
  );

  const savedProperties = savedPropertiesData ?? [];

  // Check if current property is saved
  const isSaved = useMemo(() => {
    if (!user) return false;
    return savedProperties.some(
      (sp) => sp.userId === user.uid && sp.propertyId === property.id
    );
  }, [savedProperties, user, property.id]);

  const handleToggleSave = async () => {
    if (!user) {
      // Store current URL to redirect back after signin
      const currentUrl = window.location.pathname + window.location.search;
      router.push(`/signin?redirect=${encodeURIComponent(currentUrl)}`);
      toast.error("Please sign in to save properties");
      return;
    }

    try {
      if (isSaved) {
        await savedPropertyService.unsave(user.uid, property.id);
        toast.success("Property removed from saved");
      } else {
        await savedPropertyService.save({
          userId: user.uid,
          propertyId: property.id,
        });
        toast.success("Property saved successfully");
      }
    } catch (error) {
      console.error("Error toggling save:", error);
      toast.error(
        isSaved
          ? "Failed to unsave property"
          : "Failed to save property. Please try again."
      );
    }
  };

  const handleDelete = async () => {
    try {
      await propertyService.delete(property.id);
      toast.success("Property deleted successfully");
      router.push("/properties/my-properties");
    } catch (error) {
      console.error("Error deleting property:", error);
      toast.error("Failed to delete property. Please try again.");
    }
  };

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
        {isOwner && (
          <>
            <Link href={`/properties/${property.id}/edit`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </Link>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    your property listing.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
        {!isOwner && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleSave}
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
          </>
        )}
      </div>
    </motion.div>
  );
}
