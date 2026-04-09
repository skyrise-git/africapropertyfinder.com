import { redirect } from "next/navigation";
import type { UserRole } from "@/lib/types/user.type";
import { AdminDashboard } from "./_components/admin-dashboard";
import { AgentDashboard } from "./_components/agent-dashboard";

interface DashboardPageProps {
  params: Promise<{
    role: UserRole;
  }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { role } = await params;

  if (role !== "admin" && role !== "staff" && role !== "agent") {
    redirect("/");
  }

  if (role === "agent") {
    return <AgentDashboard />;
  }

  return <AdminDashboard />;
}
