import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Users",
  description: "Manage all users in the system.",
};

export default function UsersLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
