import { DynamicBreadcrumb } from "@/components/core/dynamic-breadcrumb";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { RoleGuard } from "./_components/role-guard";

export default function RoleLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex h-screen flex-col overflow-hidden">
          <AppHeader />
          <div className="px-4 pt-4">
            <DynamicBreadcrumb />
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 pt-2">
            <main className="flex-1 min-w-0">
              <RoleGuard>{children}</RoleGuard>
            </main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
