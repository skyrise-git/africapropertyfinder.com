import { CalendarRange, Clock, MapPin, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SortOption, StatusFilter, TourTypeFilter } from "./types";

type AppointmentsFiltersProps = {
  search: string;
  status: StatusFilter;
  tourType: TourTypeFilter;
  fromDate: string;
  toDate: string;
  sort: SortOption;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: StatusFilter) => void;
  onTourTypeChange: (value: TourTypeFilter) => void;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onSortChange: (value: SortOption) => void;
};

export function AppointmentsFilters({
  search,
  status,
  tourType,
  fromDate,
  toDate,
  sort,
  onSearchChange,
  onStatusChange,
  onTourTypeChange,
  onFromDateChange,
  onToDateChange,
  onSortChange,
}: AppointmentsFiltersProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
      {/* Search */}
      <div className="flex-1 min-w-[200px]">
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by property title"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {/* Status + tour type chips */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-full bg-muted/60 p-1">
          <Button
            type="button"
            size="sm"
            variant={status === "upcoming" ? "default" : "ghost"}
            className="rounded-full px-3 text-xs"
            onClick={() => onStatusChange("upcoming")}
          >
            <Clock className="mr-1 h-3 w-3" />
            Upcoming
          </Button>
          <Button
            type="button"
            size="sm"
            variant={status === "past" ? "default" : "ghost"}
            className="rounded-full px-3 text-xs"
            onClick={() => onStatusChange("past")}
          >
            Past
          </Button>
          <Button
            type="button"
            size="sm"
            variant={status === "all" ? "default" : "ghost"}
            className="rounded-full px-3 text-xs"
            onClick={() => onStatusChange("all")}
          >
            All
          </Button>
        </div>

        <div className="inline-flex rounded-full bg-muted/60 p-1">
          <Button
            type="button"
            size="sm"
            variant={tourType === "all" ? "default" : "ghost"}
            className="rounded-full px-3 text-xs"
            onClick={() => onTourTypeChange("all")}
          >
            All tours
          </Button>
          <Button
            type="button"
            size="sm"
            variant={tourType === "in-person" ? "default" : "ghost"}
            className="rounded-full px-3 text-xs"
            onClick={() => onTourTypeChange("in-person")}
          >
            <MapPin className="mr-1 h-3 w-3" />
            In person
          </Button>
          <Button
            type="button"
            size="sm"
            variant={tourType === "video" ? "default" : "ghost"}
            className="rounded-full px-3 text-xs"
            onClick={() => onTourTypeChange("video")}
          >
            <Video className="mr-1 h-3 w-3" />
            Video
          </Button>
        </div>
      </div>

      {/* Sort + date range */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-full bg-muted/60 p-1">
          <Button
            type="button"
            size="sm"
            variant={sort === "soonest" ? "default" : "ghost"}
            className="rounded-full px-3 text-xs"
            onClick={() => onSortChange("soonest")}
          >
            Soonest first
          </Button>
          <Button
            type="button"
            size="sm"
            variant={sort === "newest" ? "default" : "ghost"}
            className="rounded-full px-3 text-xs"
            onClick={() => onSortChange("newest")}
          >
            Newest first
          </Button>
          <Button
            type="button"
            size="sm"
            variant={sort === "oldest" ? "default" : "ghost"}
            className="rounded-full px-3 text-xs"
            onClick={() => onSortChange("oldest")}
          >
            Oldest first
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border border-input bg-background px-2 py-1 text-xs">
            <CalendarRange className="h-3 w-3 text-muted-foreground" />
            <input
              type="date"
              value={fromDate}
              onChange={(event) => onFromDateChange(event.target.value)}
              className="h-5 border-0 bg-transparent text-xs focus-visible:outline-none"
            />
          </div>
          <span className="text-xs text-muted-foreground">to</span>
          <div className="flex items-center gap-1 rounded-md border border-input bg-background px-2 py-1 text-xs">
            <CalendarRange className="h-3 w-3 text-muted-foreground" />
            <input
              type="date"
              value={toDate}
              onChange={(event) => onToDateChange(event.target.value)}
              className="h-5 border-0 bg-transparent text-xs focus-visible:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}


