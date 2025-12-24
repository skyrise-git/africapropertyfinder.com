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
      color: "#22c55e",
    },
    "semi-furnished": {
      label: "Semi-Furnished",
      color: "#0ea5e9",
    },
    unfurnished: {
      label: "Unfurnished",
      color: "#f97316",
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

            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
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
                    {stats.map((entry, index) => {
                      const cfg =
                        chartConfig[entry.label as keyof typeof chartConfig] ??
                        chartConfig.furnished;
                      return (
                        <Cell
                          key={entry.label}
                          fill={
                            cfg.color ??
                            ["#22c55e", "#0ea5e9", "#f97316"][index % 3]
                          }
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      value,
                      chartConfig[name]?.label ?? name,
                    ]}
                  />
                </PieChart>
              </ChartContainer>

              <div className="flex w-full flex-1 flex-col gap-1 text-xs sm:w-auto">
                {stats.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2 rounded-sm shrink-0"
                        style={{
                          backgroundColor:
                            chartConfig[item.label as keyof typeof chartConfig]
                              ?.color ?? "#22c55e",
                        }}
                      />
                      <span className="capitalize truncate">
                        {item.label.replace("-", " ")}
                      </span>
                    </div>
                    <span className="font-mono text-muted-foreground shrink-0">
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
