"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { motion } from "motion/react";
import { mutate } from "@atechhub/firebase";
import { getArrFromObj } from "@ashirbad/js-core";
import { useAppStore } from "@/hooks/use-app-store";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, Home, Smartphone } from "lucide-react";

type Appointment = {
  id?: string;
  propertyId: string;
  propertyTitle?: string;
  date: string;
  time: string;
  tourType?: "in-person" | "video" | string;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  requestedBy?: {
    uid?: string;
    name?: string;
    email?: string;
  } | null;
};

export default function AppointmentsPage() {
  const { user } = useAppStore();
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push("/signin");
      return;
    }

    const fetchAppointments = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await mutate({
          action: "get",
          path: "appointments",
        });

        const arr = getArrFromObj<Appointment>(data || {});

        const userAppointments = arr.filter((appt) => {
          return appt?.requestedBy?.uid === user.uid;
        });

        userAppointments.sort((a, b) => {
          const aTime = new Date(a.date).getTime();
          const bTime = new Date(b.date).getTime();
          return aTime - bTime;
        });

        setAppointments(userAppointments);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to fetch appointments", err);
        setError("Failed to load appointments. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    void fetchAppointments();
  }, [user, router]);

  if (!user) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto max-w-7xl p-4 md:p-6 space-y-6"
    >
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Your Appointments
        </h1>
        <p className="text-sm text-muted-foreground">
          See all the property appointments you&apos;ve scheduled, with quick
          access to each listing.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      ) : appointments.length === 0 ? (
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
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment, index) => {
            const apptDate = new Date(appointment.date);
            const displayDate = Number.isNaN(apptDate.getTime())
              ? appointment.date
              : format(apptDate, "PPP");

            const isVideo = appointment.tourType === "video";

            return (
              <Card key={appointment.id ?? index} className="border-muted">
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
                      {user.name ? (
                        <span className="font-medium">{user.name}</span>
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
          })}
        </div>
      )}
    </motion.div>
  );
}


