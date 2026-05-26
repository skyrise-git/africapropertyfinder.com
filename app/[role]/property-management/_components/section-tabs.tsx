"use client";

import {
  Banknote,
  BarChart3,
  Bell,
  FileText,
  Home as HomeIcon,
  Receipt,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const sections = [
  { href: "", label: "Overview", icon: HomeIcon },
  { href: "tenants", label: "Tenants", icon: Users },
  { href: "leases", label: "Leases", icon: FileText },
  { href: "invoices", label: "Invoices", icon: Receipt },
  { href: "payments", label: "Payments", icon: Wallet },
  { href: "expenses", label: "Expenses", icon: Wallet },
  { href: "maintenance", label: "Maintenance", icon: Wrench },
  { href: "reminders", label: "Reminders", icon: Bell },
  { href: "reports", label: "Reports", icon: BarChart3 },
  { href: "payouts", label: "Payouts", icon: Banknote },
] as const;

export function SectionTabs() {
  const params = useParams();
  const pathname = usePathname();
  const role = params.role as string;

  return (
    <nav className="flex flex-wrap gap-1 rounded-lg border bg-card p-1">
      {sections.map((s) => {
        const href = `/${role}/property-management${s.href ? `/${s.href}` : ""}`;
        const isActive =
          s.href === ""
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`);
        const Icon = s.icon;
        return (
          <Link
            key={s.label}
            href={href}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            <Icon className="size-4" />
            {s.label}
          </Link>
        );
      })}
    </nav>
  );
}
