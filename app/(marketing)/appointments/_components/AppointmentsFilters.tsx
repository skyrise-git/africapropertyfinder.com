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
    <div className="space-y-4">
      {/* Search - Full width at top */}
      <div className="w-full">
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by property title"
          className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      {/* Filters Row 1: Status + Tour Type */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status Filter */}
        <div className="inline-flex rounded-full bg-muted/60 p-1">
          <Button
            type="button"
            size="sm"
            variant={status === "upcoming" ? "default" : "ghost"}
            className="rounded-full px-3 text-xs font-medium"
            onClick={() => onStatusChange("upcoming")}
          >
            <Clock className="mr-1.5 h-3.5 w-3.5" />
            Upcoming
          </Button>
          <Button
            type="button"
            size="sm"
            variant={status === "past" ? "default" : "ghost"}
            className="rounded-full px-3 text-xs font-medium"
            onClick={() => onStatusChange("past")}
          >
            Past
          </Button>
          <Button
            type="button"
            size="sm"
            variant={status === "all" ? "default" : "ghost"}
            className="rounded-full px-3 text-xs font-medium"
            onClick={() => onStatusChange("all")}
          >
            All
          </Button>
        </div>

        {/* Tour Type Filter */}
        <div className="inline-flex rounded-full bg-muted/60 p-1">
          <Button
            type="button"
            size="sm"
            variant={tourType === "all" ? "default" : "ghost"}
            className="rounded-full px-3 text-xs font-medium"
            onClick={() => onTourTypeChange("all")}
          >
            All tours
          </Button>
          <Button
            type="button"
            size="sm"
            variant={tourType === "in-person" ? "default" : "ghost"}
            className="rounded-full px-3 text-xs font-medium"
            onClick={() => onTourTypeChange("in-person")}
          >
            <MapPin className="mr-1.5 h-3.5 w-3.5" />
            In person
          </Button>
          <Button
            type="button"
            size="sm"
            variant={tourType === "video" ? "default" : "ghost"}
            className="rounded-full px-3 text-xs font-medium"
            onClick={() => onTourTypeChange("video")}
          >
            <Video className="mr-1.5 h-3.5 w-3.5" />
            Video
          </Button>
        </div>
      </div>

      {/* Filters Row 2: Sort + Date Range */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Sort Options */}
        <div className="inline-flex rounded-full bg-muted/60 p-1">
          <Button
            type="button"
            size="sm"
            variant={sort === "soonest" ? "default" : "ghost"}
            className="rounded-full px-3 text-xs font-medium"
            onClick={() => onSortChange("soonest")}
          >
            Soonest first
          </Button>
          <Button
            type="button"
            size="sm"
            variant={sort === "newest" ? "default" : "ghost"}
            className="rounded-full px-3 text-xs font-medium"
            onClick={() => onSortChange("newest")}
          >
            Newest first
          </Button>
          <Button
            type="button"
            size="sm"
            variant={sort === "oldest" ? "default" : "ghost"}
            className="rounded-full px-3 text-xs font-medium"
            onClick={() => onSortChange("oldest")}
          >
            Oldest first
          </Button>
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-2 text-xs shadow-sm transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <CalendarRange className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              type="date"
              value={fromDate}
              onChange={(event) => onFromDateChange(event.target.value)}
              placeholder="dd/mm/yyyy"
              className="h-5 min-w-[120px] border-0 bg-transparent text-xs focus-visible:outline-none"
            />
          </div>
          <span className="text-xs font-medium text-muted-foreground">to</span>
          <div className="flex items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-2 text-xs shadow-sm transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <CalendarRange className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              type="date"
              value={toDate}
              onChange={(event) => onToDateChange(event.target.value)}
              placeholder="dd/mm/yyyy"
              className="h-5 min-w-[120px] border-0 bg-transparent text-xs focus-visible:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}


