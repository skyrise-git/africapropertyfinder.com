"use client";

import { useState } from "react";
import { format } from "date-fns";
import { AnimatePresence, motion } from "motion/react";
import {
  Calendar as CalendarIcon,
  Clock,
  Home,
  Mail,
  Phone,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

function PropertyScheduleViewing({
  property,
}: PropertyContactAndScheduleProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [timeSelection, setTimeSelection] = useState<string>("");
  const [customTime, setCustomTime] = useState<string>("");
  const [tourType, setTourType] = useState<"in-person" | "video">("in-person");
  const effectiveTime = timeSelection === "custom" ? customTime : timeSelection;

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
          <div className="space-y-2">
            <div className="text-sm font-medium">
              {property.contactName || "Contact person"}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {property.contactInfo.phone && (
                <a
                  href={`tel:${property.contactInfo.phone}`}
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Phone className="h-4 w-4" />
                  {property.contactInfo.phone}
                </a>
              )}

              {property.contactInfo.email && (
                <a
                  href={`mailto:${property.contactInfo.email}`}
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  {property.contactInfo.email}
                </a>
              )}
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
              <div className="flex flex-col gap-3 md:flex-row">
                <div className="flex-1 space-y-1">
                  <label className="text-sm font-medium">Select a time</label>
                  <Select
                    value={timeSelection}
                    onValueChange={(value) => {
                      setTimeSelection(value);
                      if (value !== "custom") {
                        setCustomTime("");
                      }
                    }}
                  >
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
                      <SelectItem value="custom">Custom time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <AnimatePresence>
                  {timeSelection === "custom" && (
                    <motion.div
                      key="custom-time-input"
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      className="flex-1 space-y-1"
                    >
                      <label className="text-sm font-medium">
                        Enter a custom time
                      </label>
                      <Input
                        type="time"
                        className="w-full"
                        value={customTime}
                        onChange={(event) => {
                          const value = event.target.value;
                          setCustomTime(value);
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
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
                  time: effectiveTime,
                  tourType,
                });
              }}
              disabled={!selectedDate || !effectiveTime}
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
      <div className="sticky top-6">
        <PropertyScheduleViewing property={property} />
      </div>
    </div>
  );
}
