import { ForecastType } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import { PredictionMetricsService } from "@/services/prediction-metrics";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  default: {
    forecast: {
      findUnique: vi.fn(),
    },
    prediction: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("PredictionMetricsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Binary Predictions", () => {
    it("should calculate metrics for correct binary prediction with high confidence", async () => {
      const mockForecast = {
        id: "forecast1",
        type: ForecastType.BINARY,
        actualValue: "true",
      };

      const mockPrediction = {
        id: "pred1",
        value: "true",
        confidence: 90, // 0.9 as probability
        equityInvestment: 100,
        debtFinancing: 50,
        estimatedTime: 60, // 1 hour
      };

      vi.mocked(prisma.forecast.findUnique).mockResolvedValue(
        mockForecast as any
      );
      vi.mocked(prisma.prediction.findMany).mockResolvedValue([
        mockPrediction as any,
      ]);
      vi.mocked(prisma.prediction.update).mockResolvedValue({} as any);

      await PredictionMetricsService.recalculateMetricsForForecast("forecast1");

      // Verify update was called with correct metrics
      const updateCall = vi.mocked(prisma.prediction.update).mock.calls[0];
      const metrics = updateCall[0].data;

      // Check basic calculations
      expect(metrics.totalInvestment).toBe(150); // 100 + 50
      expect(metrics.isCorrect).toBe(true);
      expect(metrics.ppVariance).toBeCloseTo(0.1); // |1 - 0.9|
      expect(metrics.brierScore).toBeCloseTo(0.01); // (1 - 0.9)^2
      expect(metrics.roiScore).toBeGreaterThan(0); // Should be positive for low Brier score
    });

    it("should calculate metrics for incorrect binary prediction", async () => {
      const mockForecast = {
        id: "forecast1",
        type: ForecastType.BINARY,
        actualValue: "false",
      };

      const mockPrediction = {
        id: "pred1",
        value: "true",
        confidence: 80, // 0.8 as probability
        equityInvestment: 100,
        debtFinancing: 0,
        estimatedTime: 30,
      };

      vi.mocked(prisma.forecast.findUnique).mockResolvedValue(
        mockForecast as any
      );
      vi.mocked(prisma.prediction.findMany).mockResolvedValue([
        mockPrediction as any,
      ]);
      vi.mocked(prisma.prediction.update).mockResolvedValue({} as any);

      await PredictionMetricsService.recalculateMetricsForForecast("forecast1");

      const updateCall = vi.mocked(prisma.prediction.update).mock.calls[0];
      const metrics = updateCall[0].data;

      expect(metrics.isCorrect).toBe(false);
      expect(metrics.ppVariance).toBeCloseTo(0.8); // |0.8|
      expect(metrics.brierScore).toBeCloseTo(0.64); // (0.8)^2
      expect(metrics.roiScore).toBeLessThan(0); // Should be negative for incorrect
    });

    it("should handle null actualValue for binary prediction", async () => {
      const mockForecast = {
        id: "forecast1",
        type: ForecastType.BINARY,
        actualValue: null,
      };

      const mockPrediction = {
        id: "pred1",
        value: "true",
        confidence: 90,
        equityInvestment: 100,
        debtFinancing: 50,
        estimatedTime: 60,
      };

      vi.mocked(prisma.forecast.findUnique).mockResolvedValue(
        mockForecast as any
      );
      vi.mocked(prisma.prediction.findMany).mockResolvedValue([
        mockPrediction as any,
      ]);
      vi.mocked(prisma.prediction.update).mockResolvedValue({} as any);

      await PredictionMetricsService.recalculateMetricsForForecast("forecast1");

      const updateCall = vi.mocked(prisma.prediction.update).mock.calls[0];
      const metrics = updateCall[0].data;

      expect(metrics.isCorrect).toBeNull();
      expect(metrics.ppVariance).toBeNull();
      expect(metrics.brierScore).toBeNull();
      expect(metrics.roiScore).toBeNull();
    });
  });

  describe("Continuous Predictions", () => {
    it("should calculate metrics for perfect continuous prediction", async () => {
      const mockForecast = {
        id: "forecast1",
        type: ForecastType.CONTINUOUS,
        actualValue: "100",
      };

      const mockPrediction = {
        id: "pred1",
        value: "100",
        equityInvestment: 100,
        debtFinancing: 50,
        estimatedTime: 60,
        confidence: null,
      };

      vi.mocked(prisma.forecast.findUnique).mockResolvedValue(
        mockForecast as any
      );
      vi.mocked(prisma.prediction.findMany).mockResolvedValue([
        mockPrediction as any,
      ]);
      vi.mocked(prisma.prediction.update).mockResolvedValue({} as any);

      await PredictionMetricsService.recalculateMetricsForForecast("forecast1");

      const updateCall = vi.mocked(prisma.prediction.update).mock.calls[0];
      const metrics = updateCall[0].data;

      expect(metrics.error).toBe(0); // 100 - 100
      expect(metrics.highLow).toBe("PERFECT");
      expect(metrics.absoluteError).toBe(0);
      expect(metrics.absoluteActualErrorPct).toBe(0);
      expect(metrics.roiScore).toBe(5); // Perfect score
    });

    it("should calculate metrics for high continuous prediction", async () => {
      const mockForecast = {
        id: "forecast1",
        type: ForecastType.CONTINUOUS,
        actualValue: "100",
      };

      const mockPrediction = {
        id: "pred1",
        value: "110", // 10% higher than actual
        equityInvestment: 100,
        debtFinancing: 50,
        estimatedTime: 60,
        confidence: null,
      };

      vi.mocked(prisma.forecast.findUnique).mockResolvedValue(
        mockForecast as any
      );
      vi.mocked(prisma.prediction.findMany).mockResolvedValue([
        mockPrediction as any,
      ]);
      vi.mocked(prisma.prediction.update).mockResolvedValue({} as any);

      await PredictionMetricsService.recalculateMetricsForForecast("forecast1");

      const updateCall = vi.mocked(prisma.prediction.update).mock.calls[0];
      const metrics = updateCall[0].data;

      expect(metrics.error).toBe(10); // 110 - 100
      expect(metrics.highLow).toBe("HIGH");
      expect(metrics.absoluteError).toBe(10);
      expect(metrics.absoluteActualErrorPct).toBeCloseTo(0.1); // 10/100
    });

    it("should calculate metrics for low continuous prediction", async () => {
      const mockForecast = {
        id: "forecast1",
        type: ForecastType.CONTINUOUS,
        actualValue: "100",
      };

      const mockPrediction = {
        id: "pred1",
        value: "95", // 5% lower than actual
        equityInvestment: 100,
        debtFinancing: 50,
        estimatedTime: 60,
        confidence: null,
      };

      vi.mocked(prisma.forecast.findUnique).mockResolvedValue(
        mockForecast as any
      );
      vi.mocked(prisma.prediction.findMany).mockResolvedValue([
        mockPrediction as any,
      ]);
      vi.mocked(prisma.prediction.update).mockResolvedValue({} as any);

      await PredictionMetricsService.recalculateMetricsForForecast("forecast1");

      const updateCall = vi.mocked(prisma.prediction.update).mock.calls[0];
      const metrics = updateCall[0].data;

      expect(metrics.error).toBe(-5); // 95 - 100
      expect(metrics.highLow).toBe("LOW");
      expect(metrics.absoluteError).toBe(5);
      expect(metrics.absoluteActualErrorPct).toBeCloseTo(0.05); // 5/100
    });

    it("should handle null actualValue for continuous prediction", async () => {
      const mockForecast = {
        id: "forecast1",
        type: ForecastType.CONTINUOUS,
        actualValue: null,
      };

      const mockPrediction = {
        id: "pred1",
        value: "100",
        equityInvestment: 100,
        debtFinancing: 50,
        estimatedTime: 60,
        confidence: null,
      };

      vi.mocked(prisma.forecast.findUnique).mockResolvedValue(
        mockForecast as any
      );
      vi.mocked(prisma.prediction.findMany).mockResolvedValue([
        mockPrediction as any,
      ]);
      vi.mocked(prisma.prediction.update).mockResolvedValue({} as any);

      await PredictionMetricsService.recalculateMetricsForForecast("forecast1");

      const updateCall = vi.mocked(prisma.prediction.update).mock.calls[0];
      const metrics = updateCall[0].data;

      expect(metrics.error).toBeNull();
      expect(metrics.highLow).toBeNull();
      expect(metrics.absoluteError).toBeNull();
      expect(metrics.roiScore).toBeNull();
    });
  });

  describe("Financial Metrics", () => {
    it("should calculate equity and debt metrics correctly", async () => {
      const mockForecast = {
        id: "forecast1",
        type: ForecastType.BINARY,
        actualValue: "true",
      };

      const mockPrediction = {
        id: "pred1",
        value: "true",
        confidence: 100, // Perfect confidence
        equityInvestment: 100,
        debtFinancing: 50,
        estimatedTime: 60,
      };

      vi.mocked(prisma.forecast.findUnique).mockResolvedValue(
        mockForecast as any
      );
      vi.mocked(prisma.prediction.findMany).mockResolvedValue([
        mockPrediction as any,
      ]);
      vi.mocked(prisma.prediction.update).mockResolvedValue({} as any);

      await PredictionMetricsService.recalculateMetricsForForecast("forecast1");

      const updateCall = vi.mocked(prisma.prediction.update).mock.calls[0];
      const metrics = updateCall[0].data;

      // ROI score should be 5 for perfect prediction (brierScore = 0)
      expect(metrics.roiScore).toBe(5);

      // Equity metrics
      expect(metrics.roe).toBe(500); // 100 * 5
      expect(metrics.roePct).toBe(5); // 500 / 100

      // Debt metrics
      expect(metrics.financingGrossProfit).toBe(250); // 50 * 5
      expect(metrics.debtRepayment).toBe(-5); // 50 * -0.1
      expect(metrics.rof).toBe(245); // 250 + (-5)

      // Total metrics
      expect(metrics.netProfitEquityPlusDebt).toBe(745); // 500 + 245
      expect(metrics.roiEquityPlusDebtPct).toBe(7.45); // 745 / 100
      expect(metrics.profitPerHour).toBe(745); // 745 / 1 hour
    });

    it("should handle zero investments", async () => {
      const mockForecast = {
        id: "forecast1",
        type: ForecastType.BINARY,
        actualValue: "true",
      };

      const mockPrediction = {
        id: "pred1",
        value: "true",
        confidence: 100,
        equityInvestment: 0,
        debtFinancing: 0,
        estimatedTime: 60,
      };

      vi.mocked(prisma.forecast.findUnique).mockResolvedValue(
        mockForecast as any
      );
      vi.mocked(prisma.prediction.findMany).mockResolvedValue([
        mockPrediction as any,
      ]);
      vi.mocked(prisma.prediction.update).mockResolvedValue({} as any);

      await PredictionMetricsService.recalculateMetricsForForecast("forecast1");

      const updateCall = vi.mocked(prisma.prediction.update).mock.calls[0];
      const metrics = updateCall[0].data;

      expect(metrics.totalInvestment).toBe(0);
      expect(metrics.roe).toBe(0);
      expect(metrics.roePct).toBeNull();
      expect(metrics.rof).toBe(0);
      expect(metrics.netProfitEquityPlusDebt).toBe(0);
    });
  });
});
