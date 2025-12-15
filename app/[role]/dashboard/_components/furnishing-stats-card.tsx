"use client";

import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { Sofa } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";

interface FurnishingStatsCardProps {
  stats: { label: string; value: number }[];
  popularFurnishing: string | null;
}

export function FurnishingStatsCard({
  stats,
  popularFurnishing,
}: FurnishingStatsCardProps) {
  const chartConfig: ChartConfig = {
    furnished: {
      label: "Furnished",
      color: "hsl(var(--chart-1))",
    },
    "semi-furnished": {
      label: "Semi-Furnished",
      color: "hsl(var(--chart-2))",
    },
    unfurnished: {
      label: "Unfurnished",
      color: "hsl(var(--chart-3))",
    },
  };

  const hasData = stats.length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Furnishing Popularity
        </CardTitle>
        <Sofa className="size-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {hasData ? (
          <>
            {popularFurnishing && (
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-primary">
                Most in-demand:{" "}
                <span className="font-semibold capitalize">
                  {popularFurnishing.replace("-", " ")}
                </span>
              </p>
            )}

            <div className="flex items-center gap-4">
              <ChartContainer
                config={chartConfig}
                className="h-40 w-40 flex-none"
              >
                <PieChart>
                  <Pie
                    data={stats}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={24}
                    outerRadius={40}
                    paddingAngle={4}
                    strokeWidth={0}
                  >
                    {stats.map((entry) => (
                      <Cell
                        key={entry.label}
                        fill={`var(--color-${entry.label})`}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      value,
                      chartConfig[name]?.label ?? name,
                    ]}
                  />
                </PieChart>
              </ChartContainer>

              <div className="flex flex-1 flex-col gap-1 text-xs">
                {stats.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2 rounded-sm"
                        style={{
                          backgroundColor: `var(--color-${item.label})`,
                        }}
                      />
                      <span className="capitalize">
                        {item.label.replace("-", " ")}
                      </span>
                    </div>
                    <span className="font-mono text-muted-foreground">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            Once properties are added, you&apos;ll see which furnishing types
            perform best here, with a live distribution chart.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
