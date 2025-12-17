"use client";

import { useState } from "react";
import { format } from "date-fns";
import { motion } from "motion/react";
import {
  Calendar as CalendarIcon,
  Calendar,
  Clock,
  Home,
  Mail,
  Phone,
  Smartphone,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Property } from "@/lib/types/property.type";

type PropertyContactAndScheduleProps = {
  property: Property;
};

function PropertyContactInfo({ property }: PropertyContactAndScheduleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm text-muted-foreground">Contact Name</div>
            <div className="font-semibold">{property.contactName}</div>
          </div>

          {property.contactInfo.phone && (
            <div>
              <div className="text-sm text-muted-foreground mb-2">Phone</div>
              <a
                href={`tel:${property.contactInfo.phone}`}
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <Phone className="h-4 w-4" />
                {property.contactInfo.phone}
              </a>
            </div>
          )}

          {property.contactInfo.email && (
            <div>
              <div className="text-sm text-muted-foreground mb-2">Email</div>
              <a
                href={`mailto:${property.contactInfo.email}`}
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <Mail className="h-4 w-4" />
                {property.contactInfo.email}
              </a>
            </div>
          )}

          {property.preferredContactMethod.length > 0 && (
            <div>
              <div className="text-sm text-muted-foreground mb-2">
                Preferred Contact Method
              </div>
              <div className="flex flex-wrap gap-2">
                {property.preferredContactMethod.map((method) => (
                  <Badge
                    key={method}
                    variant="secondary"
                    className="capitalize"
                  >
                    {method}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {property.viewingAvailability && (
            <>
              <Separator />
              <div>
                <div className="text-sm text-muted-foreground mb-2">
                  Viewing Availability
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-sm">
                    {property.viewingAvailability}
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function PropertyScheduleViewing({
  property,
}: PropertyContactAndScheduleProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [tourType, setTourType] = useState<"in-person" | "video">("in-person");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Schedule a Viewing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Contact Agent</h3>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {property.contactInfo.email ? (
                  <div className="h-full w-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                ) : (
                  <User className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <div className="font-semibold">{property.contactName}</div>
                <div className="text-sm text-muted-foreground">
                  Listing Agent
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select a date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      format(selectedDate, "PPP")
                    ) : (
                      <span className="text-muted-foreground">Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Select a time</label>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger className="w-full">
                  <Clock className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "09:00 am",
                    "10:00 am",
                    "11:00 am",
                    "12:00 pm",
                    "01:00 pm",
                    "02:00 pm",
                    "03:00 pm",
                    "04:00 pm",
                    "05:00 pm",
                  ].map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tour type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTourType("in-person")}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    tourType === "in-person"
                      ? "border-primary bg-primary/5"
                      : "border-border bg-muted/30"
                  }`}
                >
                  <Home
                    className={`h-5 w-5 ${
                      tourType === "in-person"
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      tourType === "in-person"
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    Tour in person
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setTourType("video")}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    tourType === "video"
                      ? "border-primary bg-primary/5"
                      : "border-border bg-muted/30"
                  }`}
                >
                  <Smartphone
                    className={`h-5 w-5 ${
                      tourType === "video"
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      tourType === "video"
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    Tour via video
                  </span>
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                {tourType === "in-person"
                  ? "Visit the property in person with an agent."
                  : "Schedule a virtual tour via video call with an agent."}
              </p>
            </div>

            <Button
              className="w-full bg-primary hover:bg-primary/90"
              onClick={() => {
                // eslint-disable-next-line no-console
                console.log("Schedule appointment", {
                  date: selectedDate,
                  time: selectedTime,
                  tourType,
                });
              }}
              disabled={!selectedDate || !selectedTime}
            >
              Schedule Appointment
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Tour for free, no strings attached.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function PropertyContactAndSchedule({
  property,
}: PropertyContactAndScheduleProps) {
  return (
    <div className="lg:col-span-1">
      <div className="sticky top-6 space-y-4">
        <PropertyContactInfo property={property} />
        <PropertyScheduleViewing property={property} />
      </div>
    </div>
  );
}
