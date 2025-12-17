"use client";

import type {
  SortOption,
  StatusFilter,
  TourTypeFilter,
} from "./types";

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
      <div className="flex-1 min-w-[180px]">
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by property title"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={status}
          onChange={(event) =>
            onStatusChange(event.target.value as StatusFilter)
          }
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="upcoming">Upcoming</option>
          <option value="past">Past</option>
          <option value="all">All</option>
        </select>

        <select
          value={tourType}
          onChange={(event) =>
            onTourTypeChange(event.target.value as TourTypeFilter)
          }
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="all">All tours</option>
          <option value="in-person">In-person</option>
          <option value="video">Video</option>
        </select>

        <select
          value={sort}
          onChange={(event) => onSortChange(event.target.value as SortOption)}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="soonest">Soonest first</option>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="date"
          value={fromDate}
          onChange={(event) => onFromDateChange(event.target.value)}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        />
        <span className="text-xs text-muted-foreground">to</span>
        <input
          type="date"
          value={toDate}
          onChange={(event) => onToDateChange(event.target.value)}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        />
      </div>
    </div>
  );
}


