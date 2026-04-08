import { redirect } from "next/navigation";
import type { UserRole } from "@/lib/types/user.type";
import { AdminDashboard } from "./_components/admin-dashboard";

interface DashboardPageProps {
  params: Promise<{
    role: UserRole;
  }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { role } = await params;

  if (role !== "admin" && role !== "staff") {
    redirect("/");
  }

  return <AdminDashboard />;
}
