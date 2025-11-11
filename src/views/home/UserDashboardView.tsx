"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { cn } from "@/lib/utils";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronsUpDown,
  MoreHorizontal,
} from "lucide-react";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// ------------------------------------------------------------------
// Demo data (replace with Prisma/real queries later)
// ------------------------------------------------------------------

const series = [
  { date: "Jun 23", a: 28, b: 14 },
  { date: "Jun 24", a: 10, b: 6 },
  { date: "Jun 25", a: 40, b: 22 },
  { date: "Jun 26", a: 60, b: 40 },
  { date: "Jun 27", a: 12, b: 8 },
  { date: "Jun 28", a: 8, b: 6 },
  { date: "Jun 29", a: 65, b: 28 },
];

const rows = [
  {
    id: "1",
    header: "Cover page",
    type: "Cover page",
    status: "In Process" as const,
    target: 18,
    limit: 5,
    reviewer: "Eddie Lake",
  },
  {
    id: "2",
    header: "Table of contents",
    type: "Table of contents",
    status: "Done" as const,
    target: 29,
    limit: 24,
    reviewer: "Eddie Lake",
  },
  {
    id: "3",
    header: "Executive summary",
    type: "Narrative",
    status: "Done" as const,
    target: 10,
    limit: 13,
    reviewer: "Eddie Lake",
  },
  {
    id: "4",
    header: "Technical approach",
    type: "Narrative",
    status: "Done" as const,
    target: 27,
    limit: 23,
    reviewer: "Jamik Tashpulatov",
  },
];

// Small helper for status badge styles
function StatusBadge({ status }: { status: "Done" | "In Process" }) {
  return (
    <Badge
      variant={status === "Done" ? "default" : "secondary"}
      className={cn(
        "rounded-full px-2.5 py-0.5",
        status === "Done" ? "bg-foreground text-background" : ""
      )}
    >
      <span
        className={cn(
          "inline-flex h-2 w-2 rounded-full mr-2",
          status === "Done" ? "bg-background" : "bg-foreground/60"
        )}
      />
      {status}
    </Badge>
  );
}

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------

type Stat = {
  id: string;
  label: string;
  value: string | number;
  subLabel?: string;
  up?: boolean;
  delta?: string;
};

type UserDashboardViewProps = {
  userName?: string;
  stats?: Stat[];
  // forecasts?: Forecast[]  // keep/add if you actually use it
};

export default function UserDashboardView({
  userName = "",
  stats = [],
}: UserDashboardViewProps) {
  const timeframeTabs = useMemo(
    () => ["Last 3 months", "Last 30 days", "Last 7 days"],
    []
  );

  // console.log("userName prop:", userName);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Welcome{userName ? `, ${userName}` : ""}</h1>
        <p className="text-muted-foreground">
          Track your forecasts, deadlines, and progress here.
        </p>
      </div>

       {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((kpi) => (
          <Card key={kpi.id} className="shadow-sm">
            <CardHeader className="pb-2">
              <div className="text-sm text-muted-foreground flex items-center justify-between">
                <span>{kpi.label}</span>
                {(kpi.delta ?? kpi.up !== undefined) && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium">
                    {kpi.up ? (
                      <ArrowUpRight className="h-4 w-4 text-green-500" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-500" />
                    )}
                    {kpi.delta}
                  </span>
                )}
              </div>
              <CardTitle className="text-3xl font-semibold tracking-tight">{kpi.value}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {kpi.subLabel && <p className="text-xs text-muted-foreground">{kpi.subLabel}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card className="shadow-sm">
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Total Visitors</div>
              <div className="text-xs text-muted-foreground">
                Total for the last 3 months
              </div>
            </div>

            <div className="flex gap-2">
              {timeframeTabs.map((t) => (
                <Button key={t} variant="outline" size="sm" className="rounded-full">
                  {t}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ left: 0, right: 0, top: 20, bottom: 0 }}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="currentColor" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="currentColor" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" axisLine={false} tickLine={false} dy={10} />
              <YAxis hide />
              <Tooltip cursor={{ strokeOpacity: 0.1 }} />
              <Area type="monotone" dataKey="a" stroke="currentColor" fillOpacity={1} fill="url(#g1)" />
              <Area type="monotone" dataKey="b" stroke="currentColor" fillOpacity={1} fill="url(#g2)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabs & Table */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <Tabs defaultValue="outline">
              <TabsList>
                <TabsTrigger value="outline">Outline</TabsTrigger>
                <TabsTrigger value="past">Past Performance <Badge className="ml-2" variant="secondary">3</Badge></TabsTrigger>
                <TabsTrigger value="key">Key Personnel <Badge className="ml-2" variant="secondary">2</Badge></TabsTrigger>
                <TabsTrigger value="docs">Focus Documents</TabsTrigger>
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
                  <DropdownMenuItem>Header</DropdownMenuItem>
                  <DropdownMenuItem>Section Type</DropdownMenuItem>
                  <DropdownMenuItem>Status</DropdownMenuItem>
                  <DropdownMenuItem>Target</DropdownMenuItem>
                  <DropdownMenuItem>Limit</DropdownMenuItem>
                  <DropdownMenuItem>Reviewer</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button size="sm">+ Add Section</Button>
            </div>
          </div>

          <Separator className="my-4" />

          <Table>
            <TableCaption className="text-left">Draft outline for Proposal</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">#</TableHead>
                <TableHead>Header</TableHead>
                <TableHead>Section Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Target</TableHead>
                <TableHead className="text-right">Limit</TableHead>
                <TableHead>Reviewer</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, idx) => (
                <TableRow key={r.id}>
                  <TableCell className="text-muted-foreground">{String(idx + 1).padStart(2, "0")}</TableCell>
                  <TableCell className="font-medium">{r.header}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-full">
                      {r.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="text-right">{r.target}</TableCell>
                  <TableCell className="text-right">{r.limit}</TableCell>
                  <TableCell>{r.reviewer}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
