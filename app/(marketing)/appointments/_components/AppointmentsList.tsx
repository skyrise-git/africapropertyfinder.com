"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Home } from "lucide-react";
import type { Appointment } from "./types";
import { AppointmentCard } from "./AppointmentCard";

type AppointmentsListProps = {
  appointments: Appointment[];
  loading: boolean;
  errorMessage?: string | null;
  bookedAsName?: string | null;
};

export function AppointmentsList({
  appointments,
  loading,
  errorMessage,
  bookedAsName,
}: AppointmentsListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-destructive">{errorMessage}</p>
        </CardContent>
      </Card>
    );
  }

  if (appointments.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-muted-foreground">
            You don&apos;t have any appointments yet.
          </p>
          <Button asChild>
            <Link href="/properties" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Browse properties
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map((appointment) => (
        <AppointmentCard
          key={appointment.id ?? `${appointment.propertyId}-${appointment.date}-${appointment.time}`}
          appointment={appointment}
          bookedAsName={bookedAsName ?? null}
        />
      ))}
    </div>
  );
}


