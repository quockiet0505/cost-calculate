import { UsageInput } from "./usage.types";
import { CanonicalUsageInterval } from "./canonical-usage";

import { normalizeIntervals } from "./normalize/normalize-intervals";
import { detectIntervalMinutes } from "./normalize/interval-utils";
import { fillMissingIntervals } from "./normalize/fill-gaps";

import { synthesizeFromAverage } from "./synthesize-average";

/**
 * Billing-grade usage preparation
 * - INTERVAL: use real data (no forecast)
 * - AVERAGE: simulate 12 months
 */
export function simulateUsageForBilling(
  input: UsageInput
): { usageSeries: CanonicalUsageInterval[] } {

  const timeZone = "Australia/Sydney";

  // INTERVAL use real data
  if (input.mode === "INTERVAL" && input.intervals?.length) {
    let usageSeries: CanonicalUsageInterval[] =
      input.intervals.map(i => ({
        timestamp_start: i.timestamp_start,
        timestamp_end: i.timestamp_end,
        import_kwh: i.import_kwh,
        export_kwh: i.export_kwh ?? 0,
        controlled_import_kwh: i.controlled_import_kwh ?? 0,
      }));

    usageSeries = normalizeIntervals(usageSeries, timeZone);

    const intervalMinutes = detectIntervalMinutes(usageSeries);
    usageSeries = fillMissingIntervals(usageSeries, intervalMinutes);

    return { usageSeries };
  }

  // CASE 2: AVERAGE simulate 12 months
  if (input.mode === "AVERAGE") {
    return synthesizeFromAverage(
      input.averageMonthlyKwh ?? 0,
      input.averageMonthlyControlledKwh ?? 0
    );
  }

  throw new Error("Unsupported usage input for billing");
}
