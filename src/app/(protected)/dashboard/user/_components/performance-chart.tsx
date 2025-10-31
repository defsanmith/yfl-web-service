"use client";

import {
  CartesianGrid,
  Label,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis, YAxis
} from "recharts";

type Point = { count: number; accuracy: number };

export default function PerformanceChart({ data }: { data: Point[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 28, left: 44 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="count" tickLine={false} axisLine={false} tickMargin={12} className="text-muted-foreground">
            <Label value="Forecasts Submitted" position="bottom" offset={14} />
          </XAxis>
          <YAxis tickFormatter={(v) => `${v}%`} domain={[0, 100]} tickLine={false} axisLine={false} tickMargin={8} className="text-muted-foreground">
            <Label value="Accuracy" angle={-90} position="left" offset={18} />
          </YAxis>
          <Tooltip
            formatter={(val: any, name: string) => (name === "Accuracy" ? [`${val}%`, name] : [val, name])}
            labelFormatter={(label) => `Forecasts: ${label}`}
          />
          <Line type="monotone" dataKey="accuracy" name="Accuracy" stroke="currentColor" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} className="text-primary" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
