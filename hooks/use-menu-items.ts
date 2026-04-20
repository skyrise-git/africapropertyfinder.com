import {
  Home,
  Settings,
  Briefcase,
  Users,
  Clock,
  FileText,
  MessageSquare,
  Building2,
  CalendarDays,
  Shield,
  LineChart,
  Contact,
  Globe,
  Mail,
  Map,
} from "lucide-react";
import type { UserRole } from "@/lib/types/user.type";

export type NavigationItem = {
  title: string;
  url: string;
  icon: React.ElementType;
  roles: UserRole[];
};

export function useMenuItems() {
  const navigationItems: NavigationItem[] = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
      roles: ["admin", "staff", "agent"],
    },
    {
      title: "Properties",
      url: "/properties",
      icon: Building2,
      roles: ["admin", "staff", "agent"],
    },
    {
      title: "Appointments",
      url: "/appointments",
      icon: CalendarDays,
      roles: ["admin", "staff", "agent"],
    },
    {
      title: "My Leads",
      url: "/leads",
      icon: Contact,
      roles: ["agent"],
    },
    {
      title: "My micro-site",
      url: "/microsite",
      icon: Globe,
      roles: ["agent"],
    },
    {
      title: "Area safety",
      url: "/area-safety",
      icon: Shield,
      roles: ["admin", "staff"],
    },
    {
      title: "Price estimates",
      url: "/price-estimates",
      icon: LineChart,
      roles: ["admin", "staff"],
    },
    {
      title: "Staffs",
      url: "/staffs",
      icon: Briefcase,
      roles: ["admin"],
    },
    {
      title: "Users",
      url: "/users",
      icon: Users,
      roles: ["admin"],
    },
    {
      title: "Contacts",
      url: "/contacts",
      icon: MessageSquare,
      roles: ["admin", "staff"],
    },
    {
      title: "Subscribers",
      url: "/subscribers",
      icon: Mail,
      roles: ["admin", "staff"],
    },
    {
      title: "Neighborhood guides",
      url: "/neighborhood-guides",
      icon: Map,
      roles: ["admin", "staff"],
    },
    {
      title: "Attendance",
      url: "/attendance",
      icon: Clock,
      roles: ["admin", "staff"],
    },
    {
      title: "Blogs",
      url: "/blogs",
      icon: FileText,
      roles: ["admin"],
    },
  ];

  const settingsItems = [
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
  ];

  return {
    navigationItems,
    settingsItems,
  };
}
