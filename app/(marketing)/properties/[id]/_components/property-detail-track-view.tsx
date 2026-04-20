"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/hooks/use-app-store";
import {
  getOrCreateSessionId,
  shouldRecordPropertyView,
} from "@/lib/utils/view-session";

type Props = {
  propertyId: string;
};

export function PropertyDetailTrackView({ propertyId }: Props) {
  const user = useAppStore((s) => s.user);
  const sent = useRef(false);

  useEffect(() => {
    if (!propertyId || sent.current) return;
    if (!shouldRecordPropertyView(propertyId)) return;
    sent.current = true;

    const supabase = createClient();
    const sessionId = getOrCreateSessionId();

    void supabase.from("property_views").insert({
      property_id: propertyId,
      viewer_id: user?.uid ?? null,
      session_id: sessionId,
    });
  }, [propertyId, user?.uid]);

  return null;
}
