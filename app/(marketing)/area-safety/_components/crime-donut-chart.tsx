"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface DonutDataItem {
  name: string;
  value: number;
  fill: string;
}

interface CrimeDonutChartProps {
  data: DonutDataItem[];
  size?: number;
}

export function CrimeDonutChart({ data, size = 140 }: CrimeDonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div style={{ width: size, height: size }} className="shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={size * 0.3}
            outerRadius={size * 0.45}
            paddingAngle={2}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value: number, name: string) => [
              value.toLocaleString(),
              name,
            ]}
          />
          <text
            x="50%"
            y="46%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-foreground font-bold"
            style={{ fontSize: size * 0.14 }}
          >
            {total}
          </text>
          <text
            x="50%"
            y="58%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-muted-foreground"
            style={{ fontSize: size * 0.065 }}
          >
            incidents
          </text>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
