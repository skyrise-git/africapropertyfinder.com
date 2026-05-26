import { EnrollPropertyDialog } from "./_components/enroll-property-dialog";
import { SectionTabs } from "./_components/section-tabs";

export default function PropertyManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 p-4 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-light text-2xl tracking-tight">
            Property management
          </h1>
          <p className="text-muted-foreground text-sm">
            Tenants, leases, rent collection, and maintenance.
          </p>
        </div>
        <EnrollPropertyDialog />
      </header>
      <SectionTabs />
      <div>{children}</div>
    </div>
  );
}
