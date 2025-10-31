"use client";

import dynamic from "next/dynamic";

// Dynamically load the Recharts component on the client
const PerformanceChart = dynamic(() => import("./performance-chart"), {
  ssr: false,
});

export default function ChartClient({
  data,
}: {
  data: { count: number; accuracy: number }[];
}) {
  return <PerformanceChart data={data} />;
}