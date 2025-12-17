"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Calendar, Clock, Home, Smartphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Appointment } from "./types";

type AppointmentCardProps = {
  appointment: Appointment;
  bookedAsName?: string | null;
};

export function AppointmentCard({
  appointment,
  bookedAsName,
}: AppointmentCardProps) {
  const apptDate = new Date(appointment.date);
  const displayDate = Number.isNaN(apptDate.getTime())
    ? appointment.date
    : format(apptDate, "PPP");

  const isVideo = appointment.tourType === "video";

  return (
    <Card className="border-muted">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="text-base md:text-lg">
            {appointment.propertyTitle || "Property appointment"}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {displayDate}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {appointment.time}
            </span>
          </div>
        </div>
        <Badge variant={isVideo ? "secondary" : "default"}>
          <span className="inline-flex items-center gap-1">
            {isVideo ? (
              <Smartphone className="h-3 w-3" />
            ) : (
              <Home className="h-3 w-3" />
            )}
            {isVideo ? "Video tour" : "In-person tour"}
          </span>
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {(appointment.contactName ||
          appointment.contactEmail ||
          appointment.contactPhone) && (
          <>
            <div className="space-y-1 text-sm">
              {appointment.contactName && (
                <p className="font-medium">
                  Agent: {appointment.contactName}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3">
                {appointment.contactPhone && (
                  <Link
                    href={`tel:${appointment.contactPhone}`}
                    className="text-primary hover:underline"
                  >
                    {appointment.contactPhone}
                  </Link>
                )}
                {appointment.contactEmail && (
                  <Link
                    href={`mailto:${appointment.contactEmail}`}
                    className="text-primary hover:underline"
                  >
                    {appointment.contactEmail}
                  </Link>
                )}
              </div>
            </div>
            <Separator />
          </>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            Booked as{" "}
            {bookedAsName ? (
              <span className="font-medium">{bookedAsName}</span>
            ) : (
              "guest"
            )}
          </div>
          {appointment.propertyId && (
            <Button size="sm" asChild>
              <Link href={`/properties/${appointment.propertyId}`}>
                View property
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


