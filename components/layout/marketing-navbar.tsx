"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { marketingSite } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/core/theme-toggle";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X, ArrowRight, LogIn, Home } from "lucide-react";
import { MegaMenu } from "@/components/layout/mega-menu";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/hooks/use-app-store";
import { MarketingProfileDropdown } from "@/components/core/marketing-profile-dropdown";

export function MarketingNavbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { user } = useAppStore();

  const marketingNavLinks = user
    ? [
        { label: "Area Safety", href: "/area-safety" },
        { label: "Blogs", href: "/blogs" },
        { label: "Feed", href: "/feed" },
        { label: "Appointments", href: "/appointments" },
        { label: "Services", href: "#services" },
      ]
    : [
        { label: "Area Safety", href: "/area-safety" },
        { label: "Blogs", href: "/blogs" },
        { label: "Feed", href: "/feed" },
        { label: "Services", href: "#services" },
      ];

  const toggleMenu = () => setOpen((prev) => !prev);

  const toggleTheme = () => {
    const current = resolvedTheme || theme;
    setTheme(current === "dark" ? "light" : "dark");
  };

  const propertiesMenu = marketingSite.megaMenu[0];
  const servicesMenu = marketingSite.megaMenu[1];
  const simpleNavLinks = marketingNavLinks.filter(
    (link) => link.href !== "#services"
  );

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center group" title="Go to homepage" aria-label="Go to homepage">
            <Image
              src="/logo-icon.png"
              alt="Africa Property Finder"
              width={68}
              height={68}
              className="h-14 w-14 transition group-hover:scale-105"
              priority
            />
          </Link>

          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList className="gap-1">
              <NavigationMenuItem>
                <MegaMenu
                  label={propertiesMenu.label}
                  href={propertiesMenu.href}
                  items={propertiesMenu.items}
                />
              </NavigationMenuItem>
              {simpleNavLinks.map((item) => (
                <NavigationMenuItem key={item.href}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={item.href}
                      aria-current={pathname === item.href ? "page" : undefined}
                      className={cn(
                        navigationMenuTriggerStyle(),
                        "h-9 text-sm hover:text-foreground",
                        pathname === item.href
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}
                    >
                      {item.label}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
              <NavigationMenuItem>
                <MegaMenu
                  label={servicesMenu.label}
                  href={servicesMenu.href}
                  items={servicesMenu.items}
                />
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          <div className="hidden items-center gap-3 md:flex">
            <ThemeToggle />
            {user ? (
              <>
                <Button size="sm" asChild>
                  <Link
                    href="/properties/create"
                    className="flex items-center gap-1"
                  >
                    <Home className="size-4" />
                    List Property
                  </Link>
                </Button>
                <MarketingProfileDropdown />
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/signin" className="flex items-center gap-1">
                    <LogIn className="size-4" />
                    Sign in
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/signup/agent" className="flex items-center gap-1">
                    Agent Sign Up
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/signup" className="flex items-center gap-1">
                    Get started
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={toggleMenu}
            aria-label="Toggle navigation"
          >
            <AnimatePresence mode="wait" initial={false}>
              {open ? (
                <motion.span
                  key="close"
                  initial={{ opacity: 0, rotate: 90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: -90 }}
                >
                  <X className="size-5" />
                </motion.span>
              ) : (
                <motion.span
                  key="menu"
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                >
                  <Menu className="size-5" />
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </header>

      <MobileMenu
        open={open}
        onClose={() => setOpen(false)}
        navLinks={marketingNavLinks}
        propertiesItems={propertiesMenu.items}
        resourcesItems={servicesMenu.items}
        toggleTheme={toggleTheme}
      />
    </>
  );
}
