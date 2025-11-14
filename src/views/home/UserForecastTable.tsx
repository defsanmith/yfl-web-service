"use client";

import { Badge } from "@/components/ui/badge";

type Forecast = {
  id: string;
  title: string;
  status?: string | null;
  estimatedEffortHours?: number | null;
  organization?: { name?: string | null } | null;
  category?: { name?: string | null; color?: string | null } | null;
};

export default function UserForecastTable({
  forecasts,
  total,
  page,
  totalPages,
}: {
  forecasts: Forecast[];
  total?: number;
  page?: number;
  totalPages?: number;
}) {
  // 🧭 Defensive de-duplication
  const uniqueForecasts: Forecast[] = Array.from(
    new Map((forecasts ?? []).map((f) => [f.id, f])).values()
  );

  // 🧩 Optional console warning for dev only
  if (process.env.NODE_ENV !== "production") {
    const ids = (forecasts ?? []).map((f) => f.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (dupes.length) {
      console.warn(
        "Duplicate forecast IDs passed to UserForecastTable:",
        Array.from(new Set(dupes))
      );
    }
  }

  // 🧭 Handle empty state
  if (!uniqueForecasts?.length) {
    return (
      <div className="rounded-md border p-6 text-center text-muted-foreground">
        No forecasts yet. Create your first one to see it here.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">
        Showing {uniqueForecasts.length}{" "}
        {uniqueForecasts.length === 1 ? "forecast" : "forecasts"}
        {typeof total === "number" ? ` • ${total} total` : ""}
        {typeof page === "number" && typeof totalPages === "number"
          ? ` • Page ${page} of ${totalPages}`
          : ""}
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-2">#</th>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Organization</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Effort (hrs)</th>
            </tr>
          </thead>
          <tbody>
            {uniqueForecasts.map((f, i) => (
              <tr key={f.id} className="border-t hover:bg-muted/30">
                <td className="px-4 py-2 text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </td>
                <td className="px-4 py-2 font-medium">{f.title}</td>
                <td className="px-4 py-2">{f.organization?.name ?? "—"}</td>
                <td className="px-4 py-2">
                  {f.category?.name ? (
                    <Badge
                      className="text-xs"
                      style={
                        f.category.color
                          ? { backgroundColor: f.category.color, color: "white" }
                          : undefined
                      }
                    >
                      {f.category.name}
                    </Badge>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-2">
                  {f.status ? (
                    <Badge
                      variant={
                        ["done", "completed", "complete"].includes(
                          f.status.toLowerCase()
                        )
                          ? "default"
                          : "secondary"
                      }
                      className="capitalize"
                    >
                      {f.status.toLowerCase()}
                    </Badge>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  {typeof f.estimatedEffortHours === "number"
                    ? f.estimatedEffortHours
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-muted-foreground text-right">
        Page {page ?? 1}
        {totalPages ? ` of ${totalPages}` : ""}
      </div>
    </div>
  );
}
