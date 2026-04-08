"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { useAppStore } from "@/hooks/use-app-store";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useSupabaseRealtime } from "@/hooks/use-supabase-realtime";
import type {
  Appointment,
  SortOption,
  StatusFilter,
  TourTypeFilter,
} from "./_components/types";
import { AppointmentsFilters } from "./_components/AppointmentsFilters";
import { AppointmentsList } from "./_components/AppointmentsList";

export default function AppointmentsPage() {
  const { user } = useAppStore();
  const router = useRouter();
  const isAuthenticated = useRequireAuth("Please sign in to view your appointments");
  const searchParams = useSearchParams();

  if (!isAuthenticated || !user) {
    return null;
  }

  // Initial filter state from URL
  const qParam = searchParams.get("q") ?? "";
  const statusParam =
    (searchParams.get("status") as StatusFilter | null) ?? "upcoming";
  const tourParam =
    (searchParams.get("tourType") as TourTypeFilter | null) ?? "all";
  const fromParam = searchParams.get("from") ?? "";
  const toParam = searchParams.get("to") ?? "";
  const sortParam =
    (searchParams.get("sort") as SortOption | null) ?? "soonest";

  const [search, setSearch] = useState(qParam);
  const [status, setStatus] = useState<StatusFilter>(statusParam);
  const [tourType, setTourType] = useState<TourTypeFilter>(tourParam);
  const [fromDate, setFromDate] = useState(fromParam);
  const [toDate, setToDate] = useState(toParam);
  const [sort, setSort] = useState<SortOption>(sortParam);

  // Sync filter state to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (search) params.set("q", search);
    else params.delete("q");

    if (status !== "upcoming") params.set("status", status);
    else params.delete("status");

    if (tourType !== "all") params.set("tourType", tourType);
    else params.delete("tourType");

    if (fromDate) params.set("from", fromDate);
    else params.delete("from");

    if (toDate) params.set("to", toDate);
    else params.delete("to");

    if (sort !== "soonest") params.set("sort", sort);
    else params.delete("sort");

    const query = params.toString();
    router.replace(query ? `/appointments?${query}` : "/appointments");
  }, [search, status, tourType, fromDate, toDate, sort, router, searchParams]);

  const { data, loading, error } = useSupabaseRealtime<Appointment>(
    "appointments",
    { enabled: !!user }
  );

  const allAppointments = data ?? [];

  const userAppointments = useMemo(
    () => allAppointments.filter((appt) => appt?.requestedBy?.uid === user?.uid),
    [allAppointments, user?.uid],
  );

  const filteredAppointments = useMemo(() => {
    const now = new Date();
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    const matchesSearch = (appt: Appointment) => {
      if (!search.trim()) return true;
      return appt.propertyTitle
        ?.toLowerCase()
        .includes(search.trim().toLowerCase());
    };

    const matchesTourType = (appt: Appointment) => {
      if (tourType === "all") return true;
      return (appt.tourType || "").toLowerCase() === tourType;
    };

    const parseApptDate = (appt: Appointment) => new Date(appt.date);

    const matchesStatusAndRange = (appt: Appointment) => {
      const apptDate = parseApptDate(appt);
      if (Number.isNaN(apptDate.getTime())) return true;

      if (status === "upcoming" && apptDate < now) return false;
      if (status === "past" && apptDate >= now) return false;

      if (from && apptDate < from) return false;
      if (to && apptDate > to) return false;

      return true;
    };

    const toTimestamp = (appt: Appointment) => {
      const base = new Date(appt.date);
      if (Number.isNaN(base.getTime())) return 0;
      return base.getTime();
    };

    const result = userAppointments
      .filter(matchesSearch)
      .filter(matchesTourType)
      .filter(matchesStatusAndRange)
      .slice()
      .sort((a, b) => {
        const ta = toTimestamp(a);
        const tb = toTimestamp(b);
        if (sort === "soonest") return ta - tb;
        if (sort === "newest") return tb - ta;
        return ta - tb;
      });

    return result;
  }, [userAppointments, search, tourType, status, fromDate, toDate, sort]);

  const hasError = !!error;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto max-w-7xl p-4 md:p-6 space-y-6"
    >
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-light tracking-tight">
          Your Appointments
        </h1>
        <p className="text-sm text-muted-foreground">
          See all the property appointments you&apos;ve scheduled, with quick
          access to each listing.
        </p>
      </div>

      <AppointmentsFilters
        search={search}
        status={status}
        tourType={tourType}
        fromDate={fromDate}
        toDate={toDate}
        sort={sort}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onTourTypeChange={setTourType}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        onSortChange={setSort}
      />

      <AppointmentsList
        appointments={filteredAppointments}
        loading={loading}
        errorMessage={
          hasError ? "Failed to load appointments. Please try again." : null
        }
        bookedAsName={user.name}
      />
    </motion.div>
  );
}


