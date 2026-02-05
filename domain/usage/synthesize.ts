import { deriveLoadTemplate } from "./templates/derive-templates";
import { generateFutureUsage } from "./generators/generate-future";
import { UsageInput } from "./usage.types";
import { CanonicalUsageInterval } from "./canonical-usage";

import { applySolarExport } from "./solar/apply-solar";
import { applyControlledLoadBehaviour } from "./controlled-load/apply-cl";
import { applySeasonality } from "./seasonality/apply-seasonality";
import { applyHolidayBehaviour } from "./calendar/apply-holiday";

import { normalizeIntervals } from "./normalize/normalize-intervals";

// Simulate 12 months of usage based on input model
export function simulateUsage12Months(
  input: UsageInput,
): { usageSeries: CanonicalUsageInterval[] } {

  /**
   * MODEL 1: INTERVAL INPUT (GROUND TRUTH)
   */

  // 1. Canonicalize input intervals
  if (input.mode === "INTERVAL" && input.intervals?.length) {

    let usageSeries: CanonicalUsageInterval[] =
      input.intervals.map(i => ({
        timestamp_start: i.timestamp_start,
        timestamp_end: i.timestamp_end,
        import_kwh: i.import_kwh,
        export_kwh: i.export_kwh ?? 0,
        controlled_import_kwh: i.controlled_import_kwh ?? 0,
      }));
  
    //  STEP 1: normalize UTC -> LOCAL (Model 1 core)
    const timeZone = "Australia/Sydney"; // Model 1 assumption
    usageSeries = normalizeIntervals(usageSeries, timeZone);
  
    //  STEP 2: derive template AFTER normalize
    const template = deriveLoadTemplate(usageSeries);
  
    //  STEP 3: behaviours (LOCAL based)
    usageSeries = applyHolidayBehaviour(usageSeries, template);
    usageSeries = applySeasonality(usageSeries);
    // usageSeries = applySolarExport(usageSeries);
    usageSeries = applyControlledLoadBehaviour(usageSeries);
  
    return { usageSeries };
  }
  

  /**
   * MODEL 2: AVERAGE INPUT (SYNTHETIC)
   * - Generate intervals
   * - Apply CL window
   * - Apply solar curve
   */
  if (input.mode === "AVERAGE") {
    return synthesizeFromAverage(input);
  }
  throw new Error("Unsupported usage input");
}

// synthesize usage from average monthly kWh
function synthesizeFromAverage(
  input: UsageInput
): { usageSeries: CanonicalUsageInterval[] } {

  // extract averages for import + controlled load
  const avg = input.averageMonthlyKwh ?? 0;
  const avgCL = input.averageMonthlyControlledKwh ?? 0;

  // build 12 months of half-hourly intervals
  const intervals: CanonicalUsageInterval[] = [];

  // base date
  const base = getBillingAnchorDate();

  // iterate months
  for (let m = 0; m < 12; m++) {
    const d = new Date(base);
    d.setUTCMonth(d.getUTCMonth() + m);

    const month = d.getUTCMonth() + 1;
    const days = new Date(d.getUTCFullYear(), month, 0).getDate();

    // distribute evenly across month
    const perInterval = avg / (days * 48);
    const perIntervalCL = avgCL / (days * 48);

    // iterate days + slots
    for (let day = 1; day <= days; day++) {
      for (let slot = 0; slot < 48; slot++) {
        const start = new Date(Date.UTC(
          d.getUTCFullYear(),
          d.getUTCMonth(),
          day,
          Math.floor(slot / 2),
          slot % 2 ? 30 : 0
        ));
        const end = new Date(start);
        end.setUTCMinutes(end.getUTCMinutes() + 30);

        intervals.push({
          timestamp_start: start.toISOString(),
          timestamp_end: end.toISOString(),
          import_kwh: perInterval,
          export_kwh: 0,
          controlled_import_kwh: perIntervalCL,
        });
      }
    }
  }

  // apply synthetic behaviours ONLY here
  let usageSeries = applyControlledLoadBehaviour(intervals);
  usageSeries = applySolarExport(usageSeries);

  // after
  // seasonality, DST, holiday, EV profile 
  
  return { usageSeries };
}

// get current month
function getBillingAnchorDate(): Date {
  const now = new Date();
  return new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    1, 0, 0, 0
  ));
}
