"use client";

import { Sofa } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FurnishingStatsCardProps {
  stats: { label: string; value: number }[];
  popularFurnishing: string | null;
}

export function FurnishingStatsCard({
  stats,
  popularFurnishing,
}: FurnishingStatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Furnishing Popularity
        </CardTitle>
        <Sofa className="size-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {popularFurnishing ? (
          <p className="mb-4 text-sm text-muted-foreground">
            Most in-demand:{" "}
            <span className="font-semibold capitalize">
              {popularFurnishing.replace("-", " ")}
            </span>
          </p>
        ) : (
          <p className="mb-4 text-sm text-muted-foreground">
            No furnishing data available yet.
          </p>
        )}

        <div className="space-y-2">
          {stats.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-4 text-sm"
            >
              <span className="capitalize">{item.label.replace("-", " ")}</span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${Math.min(item.value * 15, 100)}%`,
                    }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {item.value}
                </span>
              </div>
            </div>
          ))}

          {!stats.length && (
            <p className="text-xs text-muted-foreground">
              Once properties are added, you&apos;ll see which furnishing types
              perform best here.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
