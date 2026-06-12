"use client";

import { useState } from "react";
import { format } from "date-fns";
import { AnimatePresence, motion } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import {
  Calendar as CalendarIcon,
  Clock,
  Home,
  Mail,
  Phone,
  Smartphone,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Property } from "@/lib/types/property.type";
import { useAppStore } from "@/hooks/use-app-store";
import { toast } from "sonner";

type PropertyContactAndScheduleProps = {
  property: Property;
};

// --- Custom hook for scheduling logic ---
function useScheduleViewing(property: Property, onSuccess: () => void) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [timeSelection, setTimeSelection] = useState<string>("");
  const [customTime, setCustomTime] = useState<string>("");
  const [tourType, setTourType] = useState<"in-person" | "video">("in-person");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAppStore();

  const effectiveTime = timeSelection === "custom" ? customTime : timeSelection;

  const resetForm = () => {
    setSelectedDate(undefined);
    setTimeSelection("");
    setCustomTime("");
    setTourType("in-person");
  };

  const scheduleViewing = async () => {
    if (!selectedDate || !effectiveTime) return;
    if (!property.id) {
      toast.error("Property ID missing. Please refresh and try again.");
      return;
    }

    setIsSubmitting(true);
    try {
      const viewingDateISO = selectedDate.toISOString();
      const supabase = createClient();
      const appointmentData = {
        propertyId: property.id,
        propertyTitle: property.title,
        date: viewingDateISO,
        time: effectiveTime,
        tourType,
        contactName: property.contactName ?? null,
        contactEmail: property.contactInfo?.email ?? null,
        contactPhone: property.contactInfo?.phone ?? null,
        requestedBy: user
          ? {
              uid: user.uid,
              name: user.name,
              email: user.email,
            }
          : null,
      };
      const { error } = await supabase.from("appointments").insert(appointmentData);
      if (error) throw new Error(error.message);

      resetForm();
      onSuccess();
    } catch (error) {
      console.error("Failed to schedule viewing:", error);
      toast.error("Failed to schedule viewing. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    selectedDate,
    setSelectedDate,
    timeSelection,
    setTimeSelection,
    customTime,
    setCustomTime,
    tourType,
    setTourType,
    effectiveTime,
    isSubmitting,
    scheduleViewing,
  };
}

// --- Sub-components ---
function ContactInfo({ property }: { property: Property }) {
  return (
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
  );
}

function DatePicker({
  selectedDate,
  onSelect,
}: {
  selectedDate?: Date;
  onSelect: (date?: Date) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Select a date</label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start text-left font-normal">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? format(selectedDate, "PPP") : <span className="text-muted-foreground">Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            mode="single"
            selected={selectedDate}
            onSelect={onSelect}
            disabled={(date) => date < new Date()}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function TimeSelector({
  timeSelection,
  onTimeSelectionChange,
  customTime,
  onCustomTimeChange,
}: {
  timeSelection: string;
  onTimeSelectionChange: (value: string) => void;
  customTime: string;
  onCustomTimeChange: (value: string) => void;
}) {
  const timeOptions = [
    "09:00 am",
    "10:00 am",
    "11:00 am",
    "12:00 pm",
    "01:00 pm",
    "02:00 pm",
    "03:00 pm",
    "04:00 pm",
    "05:00 pm",
  ];

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-3 md:flex-row">
        <div className="flex-1 space-y-1">
          <label className="text-sm font-medium">Select a time</label>
          <Select value={timeSelection} onValueChange={onTimeSelectionChange}>
            <SelectTrigger className="w-full">
              <Clock className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select time" />
            </SelectTrigger>
            <SelectContent>
              {timeOptions.map((time) => (
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
              <label className="text-sm font-medium">Enter a custom time</label>
              <Input type="time" className="w-full" value={customTime} onChange={(e) => onCustomTimeChange(e.target.value)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TourTypeSelector({
  tourType,
  onTourTypeChange,
}: {
  tourType: "in-person" | "video";
  onTourTypeChange: (type: "in-person" | "video") => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Tour type</label>
      <div className="grid grid-cols-2 gap-3">
        {(["in-person", "video"] as const).map((type) => {
          const Icon = type === "in-person" ? Home : Smartphone;
          const label = type === "in-person" ? "Tour in person" : "Tour via video";
          const description =
            type === "in-person"
              ? "Visit the property in person with an agent."
              : "Schedule a virtual tour via video call with an agent.";
          const isActive = tourType === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => onTourTypeChange(type)}
              className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                isActive ? "border-primary bg-primary/5" : "border-border bg-muted/30"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-sm font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-sm text-muted-foreground">
        {tourType === "in-person"
          ? "Visit the property in person with an agent."
          : "Schedule a virtual tour via video call with an agent."}
      </p>
    </div>
  );
}

function SuccessDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="size-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <DialogTitle className="text-center">Appointment Scheduled Successfully!</DialogTitle>
          <DialogDescription className="text-center">
            Thank you for scheduling a viewing. We've received your request and will contact you soon to confirm the details.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center mt-4">
          <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- Main component (now just composition) ---
function PropertyScheduleViewing({ property }: PropertyContactAndScheduleProps) {
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const {
    selectedDate,
    setSelectedDate,
    timeSelection,
    setTimeSelection,
    customTime,
    setCustomTime,
    tourType,
    setTourType,
    effectiveTime,
    isSubmitting,
    scheduleViewing,
  } = useScheduleViewing(property, () => setShowSuccessDialog(true));

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
      <Card>
        <CardHeader>
          <CardTitle>Schedule a Viewing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ContactInfo property={property} />
          <Separator />
          <div className="space-y-5">
            <DatePicker selectedDate={selectedDate} onSelect={setSelectedDate} />
            <TimeSelector
              timeSelection={timeSelection}
              onTimeSelectionChange={setTimeSelection}
              customTime={customTime}
              onCustomTimeChange={setCustomTime}
            />
            <TourTypeSelector tourType={tourType} onTourTypeChange={setTourType} />
            <Button
              className="w-full bg-primary hover:bg-primary/90"
              onClick={scheduleViewing}
              disabled={!selectedDate || !effectiveTime || isSubmitting}
            >
              {isSubmitting ? "Scheduling..." : "Schedule Appointment"}
            </Button>
            <p className="text-xs text-center text-muted-foreground">Tour for free, no strings attached.</p>
          </div>
        </CardContent>
      </Card>
      <SuccessDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog} />
    </motion.div>
  );
}

export function PropertyContactAndSchedule({ property }: PropertyContactAndScheduleProps) {
  return (
    <div className="lg:col-span-1">
      <div className="sticky top-6">
        <PropertyScheduleViewing property={property} />
      </div>
    </div>
  );
}