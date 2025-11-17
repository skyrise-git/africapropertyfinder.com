import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create a new account to get started.",
};

export default function SignUpLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <Image
          src="/logo.png"
          alt="SkyRise Real Estate"
          width={140}
          height={46}
          className="h-10 w-auto dark:hidden"
          priority
        />
        <Image
          src="/white_logo_transparent_background.png"
          alt="SkyRise Real Estate"
          width={140}
          height={46}
          className="hidden h-10 w-auto dark:block"
          priority
        />
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
