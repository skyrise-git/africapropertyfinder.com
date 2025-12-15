import { redirect } from "next/navigation";
import type { UserRole } from "@/lib/types/user.type";
import { AdminDashboard } from "./_components/admin-dashboard";

interface DashboardPageProps {
  params: {
    role: UserRole;
  };
}

export default function DashboardPage({ params }: DashboardPageProps) {
  const role = params.role;

  if (role !== "admin") {
    redirect("/");
  }

  return <AdminDashboard />;
}
