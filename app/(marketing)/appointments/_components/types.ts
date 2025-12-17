export type Appointment = {
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

export type StatusFilter = "all" | "upcoming" | "past";
export type TourTypeFilter = "all" | "in-person" | "video";
export type SortOption = "soonest" | "newest" | "oldest";


