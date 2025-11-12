import { ForecastType } from "@/generated/prisma";
import prisma from "@/lib/prisma";

/**
 * Service for calculating and updating prediction metrics
 */
export class PredictionMetricsService {
  /**
   * Recalculate metrics for all predictions of a forecast
   * Called whenever a Forecast.actualValue is created or updated
   */
  static async recalculateMetricsForForecast(
    forecastId: string
  ): Promise<void> {
    // Fetch the forecast with actualValue
    const forecast = await prisma.forecast.findUnique({
      where: { id: forecastId },
      select: {
        id: true,
        type: true,
        actualValue: true,
      },
    });

    if (!forecast) {
      throw new Error(`Forecast not found: ${forecastId}`);
    }

    // Fetch all predictions for this forecast
    const predictions = await prisma.prediction.findMany({
      where: { forecastId },
    });

    // Calculate metrics for each prediction
    for (const prediction of predictions) {
      const metrics =
        forecast.type === ForecastType.BINARY
          ? this.calculateBinaryMetrics(forecast, prediction)
          : forecast.type === ForecastType.CONTINUOUS
          ? this.calculateContinuousMetrics(forecast, prediction)
          : null;

      if (metrics) {
        // Update the prediction with calculated metrics
        await prisma.prediction.update({
          where: { id: prediction.id },
          data: metrics,
        });
      }
    }
  }

  /**
   * Calculate metrics for binary predictions
   */
  private static calculateBinaryMetrics(
    forecast: { actualValue: string | null },
    prediction: {
      value: string;
      confidence: number | null;
      equityInvestment: number | null;
      debtFinancing: number | null;
      estimatedTime: number | null;
    }
  ) {
    // Parse values
    const predictedOutcome = prediction.value === "true";
    const actualOutcome =
      forecast.actualValue === null ? null : forecast.actualValue === "true";
    const probability =
      prediction.confidence !== null ? prediction.confidence / 100 : null;
    const equityInvestment = prediction.equityInvestment || 0;
    const debtFinancing = prediction.debtFinancing || 0;
    const estimatedTimeMinutes = prediction.estimatedTime || 0;

    // Shared helpers
    const totalInvestment = equityInvestment + debtFinancing;
    const timeHours = estimatedTimeMinutes / 60;

    // 1) isCorrect
    let isCorrect: boolean | null = null;
    if (actualOutcome !== null) {
      isCorrect = predictedOutcome === actualOutcome;
    }

    // 2) ppVariance (probability variance)
    let ppVariance: number | null = null;
    if (actualOutcome !== null && probability !== null) {
      if (isCorrect === true) {
        ppVariance = Math.abs(1 - probability);
      } else {
        ppVariance = Math.abs(probability);
      }
    }

    // 3) brierScore
    let brierScore: number | null = null;
    if (actualOutcome !== null && probability !== null) {
      if (isCorrect === true) {
        brierScore = Math.pow(1 - probability, 2);
      } else {
        brierScore = Math.pow(ppVariance!, 2);
      }
    }

    // 4) roiScore from Brier
    let roiScore: number | null = null;
    if (brierScore !== null && ppVariance !== null) {
      if (brierScore === 0) {
        roiScore = 5;
      } else if (brierScore === 1) {
        roiScore = -10;
      } else if (brierScore < 0.25) {
        roiScore = ((0.25 - brierScore) * (0.5 / ppVariance)) / 3;
      } else {
        roiScore = (0.25 - brierScore) * (ppVariance * 6);
      }
    }

    // 5) Equity-side metrics
    const roe = roiScore !== null ? equityInvestment * roiScore : null;
    const roePct =
      roe !== null && equityInvestment > 0 ? roe / equityInvestment : null;

    // 6) Debt-side metrics
    const financingGrossProfit =
      roiScore !== null ? debtFinancing * roiScore : null;
    const debtRepayment = debtFinancing * -0.1;
    const rof =
      financingGrossProfit !== null
        ? financingGrossProfit + debtRepayment
        : null;

    let rofPct: number | null = null;
    if (rof !== null && debtFinancing > 0) {
      const rofRatio = rof / debtFinancing;
      rofPct = rofRatio === 0 ? -1 : rofRatio;
    } else if (rof !== null) {
      rofPct = -1;
    }

    // 7) Net profit & ROI
    const netProfitEquityPlusDebt =
      roe !== null && rof !== null ? roe + rof : null;
    const roiEquityPlusDebtPct =
      netProfitEquityPlusDebt !== null && equityInvestment > 0
        ? netProfitEquityPlusDebt / equityInvestment
        : null;

    // 8) Profit per hour
    const profitPerHour =
      netProfitEquityPlusDebt !== null && timeHours > 0
        ? netProfitEquityPlusDebt / timeHours
        : null;

    return {
      totalInvestment,
      isCorrect,
      highLow: null,
      ppVariance,
      error: null,
      brierScore,
      absoluteError: null,
      absoluteActualErrorPct: null,
      absoluteForecastErrorPct: null,
      roiScore,
      roe,
      roePct,
      financingGrossProfit,
      debtRepayment,
      rof,
      rofPct,
      netProfitEquityPlusDebt,
      roiEquityPlusDebtPct,
      profitPerHour,
    };
  }

  /**
   * Calculate metrics for continuous predictions
   */
  private static calculateContinuousMetrics(
    forecast: { actualValue: string | null },
    prediction: {
      value: string;
      equityInvestment: number | null;
      debtFinancing: number | null;
      estimatedTime: number | null;
    }
  ) {
    // Parse values
    const forecastValue = Number(prediction.value);
    const actual =
      forecast.actualValue === null ? null : Number(forecast.actualValue);
    const equityInvestment = prediction.equityInvestment || 0;
    const debtFinancing = prediction.debtFinancing || 0;
    const estimatedTimeMinutes = prediction.estimatedTime || 0;

    // Shared helpers
    const totalInvestment = equityInvestment + debtFinancing;
    const timeHours = estimatedTimeMinutes / 60;

    // 1) error (forecastValue - actual)
    let error: number | null = null;
    if (actual !== null) {
      error = forecastValue - actual;
    }

    // 2) highLow classification
    let highLow: string | null = null;
    if (actual !== null && error !== null) {
      if (error === 0) {
        highLow = "PERFECT";
      } else if (error > 0) {
        highLow = "HIGH";
      } else {
        highLow = "LOW";
      }
    }

    // 3) absoluteError
    let absoluteError: number | null = null;
    if (error !== null) {
      absoluteError = Math.abs(error);
    }

    // 4) absoluteActualErrorPct
    let absoluteActualErrorPct: number | null = null;
    if (actual !== null && actual !== 0 && absoluteError !== null) {
      absoluteActualErrorPct = absoluteError / actual;
    }

    // 5) absoluteForecastErrorPct
    let absoluteForecastErrorPct: number | null = null;
    if (actual !== null && forecastValue !== 0 && absoluteError !== null) {
      absoluteForecastErrorPct = absoluteError / forecastValue;
    }

    // 6) roiScore from % error
    let roiScore: number | null = null;
    const e = absoluteActualErrorPct;

    if (actual !== null && e !== null) {
      if (e === 0) {
        roiScore = 5;
      } else if (e < 0.03) {
        roiScore = 0.51 + ((0.03 - e) / 0.03) * 2.49;
      } else if (e < 0.2) {
        roiScore = -Math.log10(e) / (e * 100);
      } else if (e < 0.25) {
        roiScore = 0;
      } else if (e < 0.55) {
        roiScore = -Math.pow(Math.exp(e), 5) * (e / 9);
      } else {
        roiScore = -1;
      }
    }

    // 7) Equity-side metrics
    const roe = roiScore !== null ? equityInvestment * roiScore : null;
    const roePct =
      roe !== null && equityInvestment > 0 ? roe / equityInvestment : null;

    // 8) Debt-side metrics
    const financingGrossProfit =
      roiScore !== null ? debtFinancing * roiScore : null;
    const debtRepayment = debtFinancing * -0.1;
    const rof =
      financingGrossProfit !== null
        ? financingGrossProfit + debtRepayment
        : null;

    let rofPct: number | null = null;
    if (rof !== null && debtFinancing > 0) {
      const rofRatio = rof / debtFinancing;
      rofPct = rofRatio === 0 ? -1 : rofRatio;
    } else if (rof !== null) {
      rofPct = -1;
    }

    // 9) Net profit & ROI
    const netProfitEquityPlusDebt =
      roe !== null && rof !== null ? roe + rof : null;
    const roiEquityPlusDebtPct =
      netProfitEquityPlusDebt !== null && equityInvestment > 0
        ? netProfitEquityPlusDebt / equityInvestment
        : null;

    // 10) Profit per hour
    const profitPerHour =
      netProfitEquityPlusDebt !== null && timeHours > 0
        ? netProfitEquityPlusDebt / timeHours
        : null;

    return {
      totalInvestment,
      isCorrect: null,
      highLow,
      ppVariance: null,
      error,
      brierScore: null,
      absoluteError,
      absoluteActualErrorPct,
      absoluteForecastErrorPct,
      roiScore,
      roe,
      roePct,
      financingGrossProfit,
      debtRepayment,
      rof,
      rofPct,
      netProfitEquityPlusDebt,
      roiEquityPlusDebtPct,
      profitPerHour,
    };
  }
}
