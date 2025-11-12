"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronsUpDown, MoreHorizontal } from "lucide-react";

// ---- Types ---------------------------------------------------------------

export type UpcomingForecast = {
  id: string;
  title: string;
  type?: string | null; // "Binary", "Continuous", etc.
  status: "In Progress" | "Completed" | "Due Soon" | string;
  org?: string | null;
  prediction?: number | null;
  reviewer?: string | null;
};

type Props = {
  data: UpcomingForecast[];
  pageSize?: number;
  hrefBase?: string; // e.g. "/forecasts"
  newHref?: string;  // e.g. "/forecasts/new"
};

type BadgeVariant = "default" | "secondary" | "outline";

function StatusPill({ status }: { status: string }) {
  let variant: BadgeVariant = "outline";
  if (status === "Completed") variant = "default";
  else if (status === "In Progress" || status === "Due Soon") variant = "secondary";
  return (
    <Badge variant={variant} className="rounded-full">
      {status}
    </Badge>
  );
}

// ---- Component -----------------------------------------------------------

export default function UpcomingForecastsTable({
  data,
  pageSize = 10,
  hrefBase = "/forecasts",
}: Props) {
  const router = useRouter();

  // Make sure state is declared BEFORE it's used anywhere
  const [tab, setTab] = useState<"all" | "inprogress" | "completed" | "bytype">(
    "all"
  );

  const [cols, setCols] = useState({
    title: true,
    type: true,
    status: true,
    org: true,
    prediction: true,
    reviewer: true,
  });

  const [typeFilter, setTypeFilter] = useState("");

  const filtered = useMemo(() => {
    let rows = data;
    if (tab === "inprogress") {
      rows = rows.filter(
        (r) => r.status === "In Progress" || r.status === "Due Soon"
      );
    } else if (tab === "completed") {
      rows = rows.filter((r) => r.status === "Completed");
    } else if (tab === "bytype" && typeFilter) {
      const t = typeFilter.toLowerCase();
      rows = rows.filter((r) => (r.type ?? "").toLowerCase() === t);
    }
    return rows;
  }, [data, tab, typeFilter]);

  // simple paging (no stray braces)
  const [page, setPage] = useState(1);
  const start = (page - 1) * pageSize;
  const pageData = filtered.slice(start, start + pageSize);

  return (
    <Card className="shadow-sm">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Tabs
            value={tab}
            onValueChange={(v) => {
              setTab(v as typeof tab);
              setPage(1);
            }}
          >
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="inprogress">In Progress</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="bytype">By Type</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  Customize Columns <ChevronsUpDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={cols.title}
                  onCheckedChange={() => setCols((c) => ({ ...c, title: !c.title }))}
                >
                  Title
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={cols.type}
                  onCheckedChange={() => setCols((c) => ({ ...c, type: !c.type }))}
                >
                  Type
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={cols.status}
                  onCheckedChange={() => setCols((c) => ({ ...c, status: !c.status }))}
                >
                  Status
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={cols.org}
                  onCheckedChange={() => setCols((c) => ({ ...c, org: !c.org }))}
                >
                  Organization
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={cols.prediction}
                  onCheckedChange={() =>
                    setCols((c) => ({ ...c, prediction: !c.prediction }))
                  }
                >
                  Prediction
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={cols.reviewer}
                  onCheckedChange={() =>
                    setCols((c) => ({ ...c, reviewer: !c.reviewer }))
                  }
                >
                  Reviewer
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* <Button size="sm" onClick={() => router.push(newHref)}>
              + New Forecast
            </Button> */}
          </div>
        </div>

        {tab === "bytype" ? (
          <div className="mt-3 flex items-center gap-2">
            <input
              className="w-full max-w-xs rounded-md border px-3 py-2"
              placeholder='Filter type (e.g., "Binary")'
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
            />
            <Button variant="ghost" size="sm" onClick={() => setTypeFilter("")}>
              Clear
            </Button>
          </div>
        ) : null}

        <Separator className="my-4" />

        <Table>
          <TableCaption className="text-left">Forecast summary</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">#</TableHead>
              {cols.title && <TableHead>Title</TableHead>}
              {cols.type && <TableHead>Type</TableHead>}
              {cols.status && <TableHead>Status</TableHead>}
              {cols.org && <TableHead>Organization</TableHead>}
              {cols.prediction && <TableHead className="text-right">Prediction</TableHead>}
              {cols.reviewer && <TableHead>Reviewer</TableHead>}
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {pageData.map((f, idx) => (
              <TableRow
                key={f.id}
                className="cursor-pointer"
                onClick={() => router.push(`${hrefBase}/${f.id}`)}
              >
                <TableCell className="text-muted-foreground">
                  {String(start + idx + 1).padStart(2, "0")}
                </TableCell>

                {cols.title && (
                  <TableCell className="font-medium">{f.title}</TableCell>
                )}

                {cols.type && (
                  <TableCell>
                    {f.type ? (
                      <Badge variant="outline" className="rounded-full">
                        {f.type}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                )}

                {cols.status && (
                  <TableCell>
                    <StatusPill status={f.status} />
                  </TableCell>
                )}

                {cols.org && <TableCell>{f.org ?? "—"}</TableCell>}

                {cols.prediction && (
                  <TableCell className="text-right">
                    {typeof f.prediction === "number"
                      ? f.prediction.toLocaleString()
                      : "—"}
                  </TableCell>
                )}

                {cols.reviewer && <TableCell>{f.reviewer ?? "—"}</TableCell>}

                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`${hrefBase}/${f.id}`);
                    }}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="mt-3 flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={start + pageSize >= filtered.length}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
