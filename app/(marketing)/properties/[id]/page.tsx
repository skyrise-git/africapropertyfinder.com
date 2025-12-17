"use client";

import { useParams } from "next/navigation";
import { motion } from "motion/react";
import { useFirebaseRealtime } from "@/hooks/use-firebase-realtime";
import type { Property } from "@/lib/types/property.type";
import { PropertyHeader } from "./_components/property-header";
import { PropertyGallery } from "./_components/property-gallery";
import { PropertyContactAndSchedule } from "./_components/property-contact-and-schedule";
import { PropertyTabsAndSidebar } from "./_components/property-tabs-and-sidebar";
import { PropertyDetailLoading } from "./_components/property-detail-loading";
import { PropertyDetailError } from "./_components/property-detail-error";

export default function PropertyDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data, loading, error } = useFirebaseRealtime<Property>(
    `properties/${id}`,
    { asArray: false }
  );

  const property = data ? ({ ...data, id } as Property) : null;

  const handleShare = async () => {
    if (!property) return;

    const shareData = {
      title: property.title,
      text: `Check out this property: ${property.title}`,
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error sharing:", err);
    }
  };

  if (loading) {
    return <PropertyDetailLoading />;
  }

  if (error || !property) {
    return <PropertyDetailError message={error?.message} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto max-w-7xl p-4 md:p-6 space-y-6"
    >
      <PropertyHeader property={property} onShare={handleShare} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <PropertyGallery property={property} />
        </div>
        <PropertyContactAndSchedule property={property} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <PropertyTabsAndSidebar property={property} />
      </div>
    </motion.div>
  );
}
