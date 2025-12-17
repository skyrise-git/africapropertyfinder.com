import {
  Home,
  Settings,
  Briefcase,
  Users,
  Clock,
  FileText,
  MessageSquare,
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
