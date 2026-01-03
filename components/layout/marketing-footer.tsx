"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { marketingSite } from "@/lib/config";
import {
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Twitter,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function MarketingFooter() {
  const year = new Date().getFullYear();
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter subscription
    console.log("Subscribe:", email);
    setEmail("");
  };

  return (
    <footer className="bg-background border-t">
      {/* Newsletter Section */}
      <div className="border-b">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-foreground">
                {marketingSite.footer.newsletter.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {marketingSite.footer.newsletter.description}
              </p>
            </div>
            <form
              onSubmit={handleSubscribe}
              className="flex gap-2 w-full md:w-auto"
            >
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="min-w-[200px]"
              />
              <Button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Subscribe Now
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="border-b">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-8">
            {/* Company Information */}
            <div className="space-y-4">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/logo.png"
                  alt={marketingSite.title}
                  width={120}
                  height={40}
                  className="h-8 w-auto transition dark:invert dark:brightness-0"
                />
              </Link>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{marketingSite.footer.companyInfo.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0" />
                  <Link
                    href={`tel:${marketingSite.contactPhone.replace(
                      /[^\d+]/g,
                      ""
                    )}`}
                    className="hover:text-foreground transition-colors"
                  >
                    {marketingSite.contactPhone}
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0" />
                  <Link
                    href={`mailto:${marketingSite.contactEmail}`}
                    className="hover:text-foreground transition-colors"
                  >
                    {marketingSite.contactEmail}
                  </Link>
                </div>
              </div>
            </div>

            {/* Properties */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-4">
                Properties
              </h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {marketingSite.footer.links.properties.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Categories */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-4">
                Categories
              </h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {marketingSite.footer.links.categories.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-4">
                Company
              </h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {marketingSite.footer.links.company.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-4">
                Resources
              </h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {marketingSite.footer.links.resources.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Copyright - Left */}
            <p className="text-sm text-muted-foreground order-1 lg:order-none">
              © {year} {marketingSite.name}. All rights reserved.
            </p>

            {/* Social Icons - Center */}
            <nav className="flex items-center justify-center gap-4 order-2 lg:order-none">
              <Link
                href={marketingSite.social.facebook}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </Link>
              <Link
                href={marketingSite.social.twitter}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </Link>
              <Link
                href={marketingSite.social.instagram}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </Link>
              <Link
                href={marketingSite.social.linkedin}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </Link>
            </nav>

            {/* Legal Links - Right */}
            <div className="flex flex-wrap items-center justify-end gap-4 order-3 lg:order-none">
              {marketingSite.footer.legal.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
