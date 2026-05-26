import Link from "next/link";

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/tenant" className="font-light text-lg tracking-tight">
            Tenant portal
          </Link>
          <Link
            href="/"
            className="text-muted-foreground text-sm hover:text-foreground"
          >
            Home
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-4 sm:p-6">{children}</main>
    </div>
  );
}
