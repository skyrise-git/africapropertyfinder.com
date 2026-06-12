import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { marketingSite } from "@/lib/config";

interface PolicyContactCardProps {
  description: string;
}

export function PolicyContactCard({ description }: PolicyContactCardProps) {
  const phoneTel = marketingSite.contactPhone.replace(/[^\d+]/g, "");

  return (
    <Card>
      <CardHeader>
        <h2 className="text-2xl font-semibold">Contact Us</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">{description}</p>
        <ul className="space-y-2 list-disc pl-6">
          <li>
            <p>
              By email:{" "}
              <Link
                href={`mailto:${marketingSite.contactEmail}`}
                className="text-primary underline hover:no-underline"
              >
                {marketingSite.contactEmail}
              </Link>
            </p>
          </li>
          <li>
            <p>
              By visiting this page on our website:{" "}
              <Link
                href={marketingSite.url}
                target="_blank"
                rel="external nofollow noopener"
                className="text-primary underline hover:no-underline"
              >
                {marketingSite.url}
              </Link>
            </p>
          </li>
          <li>
            <p>
              By phone:{" "}
              <Link
                href={`tel:${phoneTel}`}
                className="text-primary underline hover:no-underline"
              >
                {marketingSite.contactPhone}
              </Link>
            </p>
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}
