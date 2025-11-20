import { DataType } from "@/generated/prisma";

/**
 * Abbreviate large numbers (> 1 million) with K, M, B, T suffixes
 *
 * @param value - The numeric value to abbreviate
 * @param decimals - Number of decimal places (default: 2)
 * @returns Abbreviated string
 *
 * @example
 * ```typescript
 * abbreviateNumber(1234) // "1,234"
 * abbreviateNumber(1234567) // "1.23M"
 * abbreviateNumber(1234567890) // "1.23B"
 * abbreviateNumber(1234567890123) // "1.23T"
 * ```
 */
export function abbreviateNumber(value: number, decimals: number = 2): string {
  const absValue = Math.abs(value);

  if (absValue < 1_000_000) {
    // Less than 1 million - show full number with commas
    return absValue.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  const sign = value < 0 ? "-" : "";

  if (absValue >= 1_000_000_000_000) {
    // Trillions
    return `${sign}${(absValue / 1_000_000_000_000).toFixed(decimals)}T`;
  } else if (absValue >= 1_000_000_000) {
    // Billions
    return `${sign}${(absValue / 1_000_000_000).toFixed(decimals)}B`;
  } else if (absValue >= 1_000_000) {
    // Millions
    return `${sign}${(absValue / 1_000_000).toFixed(decimals)}M`;
  }

  return `${sign}${absValue.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/**
 * Format a numeric value based on the forecast's data type
 *
 * @param value - The numeric value to format
 * @param dataType - The data type of the forecast (NUMBER, CURRENCY, PERCENT, DECIMAL, INTEGER)
 * @param options - Optional formatting options
 * @returns Formatted string with appropriate prefix/suffix
 *
 * @example
 * ```typescript
 * formatMetricValue(1234.56, "CURRENCY") // "$1,234.56"
 * formatMetricValue(0.1234, "PERCENT") // "12.34%"
 * formatMetricValue(1234.5678, "DECIMAL", { decimals: 2 }) // "1,234.57"
 * formatMetricValue(1234.5678, "INTEGER") // "1,235"
 * formatMetricValue(1234.5678, "NUMBER") // "1,234.57"
 * formatMetricValue(1234567, "CURRENCY") // "$1.23M"
 * ```
 */
export function formatMetricValue(
  value: number,
  dataType: DataType | null | undefined,
  options?: {
    decimals?: number;
    showSign?: boolean;
    abbreviate?: boolean;
  }
): string {
  const decimals = options?.decimals ?? 2;
  const showSign = options?.showSign ?? false;
  const abbreviate = options?.abbreviate ?? true; // Abbreviate by default

  // Handle null/undefined data type - default to NUMBER
  const type = dataType || "NUMBER";

  let formattedValue: string;
  const absValue = Math.abs(value);

  switch (type) {
    case "CURRENCY":
      if (abbreviate && absValue >= 1_000_000) {
        formattedValue = `$${abbreviateNumber(absValue, decimals)}`;
      } else {
        formattedValue = `$${absValue.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })}`;
      }
      if (value < 0) {
        formattedValue = `-${formattedValue}`;
      } else if (showSign && value > 0) {
        formattedValue = `+${formattedValue}`;
      }
      break;

    case "PERCENT":
      // Value is stored as decimal (e.g., 0.1234 = 12.34%)
      const percentValue = value * 100;
      formattedValue = `${percentValue.toFixed(decimals)}%`;
      if (showSign && percentValue > 0) {
        formattedValue = `+${formattedValue}`;
      }
      break;

    case "INTEGER":
      if (abbreviate && absValue >= 1_000_000) {
        formattedValue = abbreviateNumber(Math.round(absValue), 0);
      } else {
        formattedValue = Math.round(absValue).toLocaleString();
      }
      if (value < 0) {
        formattedValue = `-${formattedValue}`;
      } else if (showSign && value > 0) {
        formattedValue = `+${formattedValue}`;
      }
      break;

    case "DECIMAL":
    case "NUMBER":
    default:
      if (abbreviate && absValue >= 1_000_000) {
        formattedValue = abbreviateNumber(absValue, decimals);
      } else {
        formattedValue = absValue.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });
      }
      if (value < 0) {
        formattedValue = `-${formattedValue}`;
      } else if (showSign && value > 0) {
        formattedValue = `+${formattedValue}`;
      }
      break;
  }

  return formattedValue;
}

/**
 * Format the actual or predicted value for display based on forecast type and data type
 *
 * @param value - The value to format (string for categorical/binary, number for continuous)
 * @param dataType - The data type of the forecast
 * @returns Formatted string
 *
 * @example
 * ```typescript
 * formatForecastValue("1234.56", "CURRENCY") // "$1,234.56"
 * formatForecastValue("true", null) // "True"
 * formatForecastValue("0.85", "PERCENT") // "85.00%"
 * ```
 */
export function formatForecastValue(
  value: string,
  dataType: DataType | null | undefined
): string {
  // For binary values
  if (value === "true" || value === "false") {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  // For categorical values (non-numeric strings)
  const numValue = parseFloat(value);
  if (isNaN(numValue)) {
    return value;
  }

  // For continuous numeric values
  return formatMetricValue(numValue, dataType);
}

/**
 * Format error metrics (absolute error, error, etc.)
 * Uses the forecast's data type to format errors appropriately
 *
 * @param value - The error value to format
 * @param dataType - The data type of the forecast (to match error formatting with prediction type)
 * @param isPercentage - Whether the value represents a percentage (for error %)
 * @param decimals - Number of decimal places (optional, auto-determined if not specified)
 * @returns Formatted string
 *
 * @example
 * ```typescript
 * formatErrorMetric(1234.56, "CURRENCY") // "$1,234.56"
 * formatErrorMetric(12.34, "NUMBER", true) // "12.34%"
 * formatErrorMetric(0.1234, "PERCENT") // "12.34%"
 * formatErrorMetric(1234567, "CURRENCY") // "$1.23M"
 * ```
 */
export function formatErrorMetric(
  value: number,
  dataType: DataType | null | undefined,
  isPercentage: boolean = false,
  decimals?: number
): string {
  // If it's a percentage error (like absoluteActualErrorPct), format as percentage
  if (isPercentage) {
    const autoDecimals = decimals ?? 2;
    return `${value.toFixed(autoDecimals)}%`;
  }

  // Otherwise, format using the forecast's data type
  // Auto-determine decimal places if not specified
  const autoDecimals = decimals ?? (Math.abs(value) < 1 ? 4 : 2);

  return formatMetricValue(value, dataType, { decimals: autoDecimals });
}

/**
 * Format currency values (always shown as currency regardless of forecast data type)
 * Used for investment amounts, profits, returns, etc.
 *
 * @param value - The currency value to format
 * @param options - Optional formatting options
 * @returns Formatted currency string
 *
 * @example
 * ```typescript
 * formatCurrency(1234.56) // "$1,234.56"
 * formatCurrency(-1234.56) // "-$1,234.56"
 * formatCurrency(1234.56, { showSign: true }) // "+$1,234.56"
 * formatCurrency(1234567) // "$1.23M"
 * ```
 */
export function formatCurrency(
  value: number,
  options?: {
    decimals?: number;
    showSign?: boolean;
    abbreviate?: boolean;
  }
): string {
  return formatMetricValue(value, "CURRENCY", options);
}

/**
 * Format percentage values (always shown as percentage)
 * Used for ROI%, ROE%, confidence, etc.
 *
 * @param value - The percentage value as decimal (e.g., 0.1234 = 12.34%)
 * @param options - Optional formatting options
 * @returns Formatted percentage string
 *
 * @example
 * ```typescript
 * formatPercentage(0.1234) // "12.34%"
 * formatPercentage(0.1234, { decimals: 1 }) // "12.3%"
 * ```
 */
export function formatPercentage(
  value: number,
  options?: {
    decimals?: number;
    showSign?: boolean;
  }
): string {
  return formatMetricValue(value, "PERCENT", options);
}
