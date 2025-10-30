import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// ---- Mock prisma client (the only external I/O here) ----
vi.mock("@/lib/prisma", () => {
  return {
    default: {
      forecast: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    },
  };
});


import prisma from "@/lib/prisma";

// Import *after* the mock so the module under test sees the mocked prisma
import {
  createForecast,
  deleteForecast,
  getForecastById,
  getForecasts,
  updateForecast
} from "@/services/forecasts";

type ForecastType = "BINARY" | "CATEGORICAL";

const nowReal = new Date();
const fixedNow = new Date("2030-01-01T12:00:00.000Z");

beforeAll(() => {
  // Freeze time for deterministic tests that compare dates
  vi.useFakeTimers();
  vi.setSystemTime(fixedNow);
});

afterAll(() => {
  vi.useRealTimers();
});

beforeEach(() => {
  vi.clearAllMocks();
});

/* --- GET FORECAST BY ID --- */

describe("getForecastById", () => {
  it("returns forecast with organization", async () => {
    (prisma.forecast.findUnique as any).mockResolvedValue({
      id: "f1",
      title: "Inflation Q4",
      organizationId: "org1",
      organization: { id: "org1", name: "Org" },
    });

    const res = await getForecastById("f1");
    expect(prisma.forecast.findUnique).toHaveBeenCalledWith({
      where: { id: "f1" },
      include: { organization: { select: { id: true, name: true } } },
    });
    expect(res?.id).toBe("f1");
    expect(res?.organization?.name).toBe("Org");
  });
});

/* --- GET ALL FORECAST INFO --- */

describe("getForecasts", () => {
  it("builds where/orderBy/skip/take correctly and returns paging info", async () => {
    (prisma.forecast.findMany as any).mockResolvedValue([{ id: "a" }, { id: "b" }]);
    (prisma.forecast.count as any).mockResolvedValue(42);

    const result = await getForecasts({
      organizationId: "org1",
      page: 2,
      limit: 10,
      search: "inflation",
      type: "BINARY" as ForecastType,
      sortBy: "createdAt",
      sortOrder: "desc",
    });

    expect(prisma.forecast.findMany).toHaveBeenCalledWith({
      where: {
        organizationId: "org1",
        type: "BINARY",
        title: { contains: "inflation", mode: "insensitive" },
      },
      orderBy: { createdAt: "desc" },
      skip: 10, // (page-1)*limit
      take: 10,
      include: { organization: { select: { id: true, name: true } } },
    });
    expect(prisma.forecast.count).toHaveBeenCalledWith({
      where: {
        organizationId: "org1",
        type: "BINARY",
        title: { contains: "inflation", mode: "insensitive" },
      },
    });

    expect(result.forecasts).toHaveLength(2);
    expect(result.total).toBe(42);
    expect(result.page).toBe(2);
    expect(result.limit).toBe(10);
    expect(result.totalPages).toBe(Math.ceil(42 / 10));
  });

  it("omits optional filters when not provided", async () => {
    (prisma.forecast.findMany as any).mockResolvedValue([]);
    (prisma.forecast.count as any).mockResolvedValue(0);

    await getForecasts({
      organizationId: "orgX",
    });

    expect(prisma.forecast.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: "orgX" },
        orderBy: { createdAt: "desc" },
        skip: 0,
        take: 10,
      }),
    );
  });
});

describe("createForecast", () => {
  it("passes correct data and converts dueDate to Date", async () => {
    const input = {
      title: "GDP 2030",
      description: "Forecast GDP",
      type: "BINARY" as ForecastType,
      dueDate: "2030-06-01T00:00:00.000Z",
      organizationId: "org1",
      options: undefined,
    };

    (prisma.forecast.create as any).mockResolvedValue({
      id: "new-id",
      ...input,
      dueDate: new Date(input.dueDate),
      organization: { id: "org1", name: "Org" },
    });

    const res = await createForecast(input as any);

    expect(prisma.forecast.create).toHaveBeenCalledWith({
      data: {
        title: "GDP 2030",
        description: "Forecast GDP",
        type: "BINARY",
        dueDate: new Date("2030-06-01T00:00:00.000Z"),
        organizationId: "org1",
        options: undefined,
      },
      include: { organization: { select: { id: true, name: true } } },
    });
    expect(res.id).toBe("new-id");
  });
});

describe("updateForecast", () => {
  it("updates record and converts dueDate", async () => {
    (prisma.forecast.update as any).mockResolvedValue({
      id: "f1",
      title: "Updated",
      description: "Desc",
      organization: { id: "org1", name: "Org" },
    });

    const res = await updateForecast({
      id: "f1",
      title: "Updated",
      description: "Desc",
      type: "CATEGORICAL" as ForecastType,
      dueDate: "2031-01-01T00:00:00.000Z",
      options: ["A", "B"],
    } as any);

    expect(prisma.forecast.update).toHaveBeenCalledWith({
      where: { id: "f1" },
      data: {
        title: "Updated",
        description: "Desc",
        type: "CATEGORICAL",
        dueDate: new Date("2031-01-01T00:00:00.000Z"),
        options: ["A", "B"],
      },
      include: { organization: { select: { id: true, name: true } } },
    });
    expect(res.id).toBe("f1");
  });
});

describe("deleteForecast", () => {
  it("calls prisma.delete with ID", async () => {
    (prisma.forecast.delete as any).mockResolvedValue({ id: "dead" });
    const res = await deleteForecast("dead");
    expect(prisma.forecast.delete).toHaveBeenCalledWith({ where: { id: "dead" } });
    expect(res.id).toBe("dead");
  });
});
