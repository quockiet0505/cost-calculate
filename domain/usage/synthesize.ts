import { deriveLoadTemplate } from "./templates/derive-templates";
import { generateFutureUsage } from "./generators/generate-future";
import { UsageInput } from "./usage.types";
import { CanonicalUsageInterval } from "./canonical-usage";

import { applySolarExport } from "./solar/apply-solar";
import { applyControlledLoadBehaviour } from "./controlled-load/apply-cl";
import { applySeasonality } from "./seasonality/apply-seasonality";
import { applyHolidayBehaviour } from "./calendar/apply-holiday";

import { normalizeIntervals } from "./normalize/normalize-intervals";
import { detectIntervalMinutes } from "./normalize/interval-utils";
import { fillMissingIntervals } from "./normalize/fill-gaps";

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
  
    // 2. detect resolution
    const intervalMinutes = detectIntervalMinutes(usageSeries);

    // 3. fill gaps BEFORE any behaviour
    usageSeries = fillMissingIntervals(usageSeries, intervalMinutes);

    //  STEP 2: derive template AFTER normalize
    const template = deriveLoadTemplate(
      usageSeries,
      intervalMinutes
    );    

    // generate next 12 months from template
    usageSeries = generateFutureUsage(
      template,
      new Date(usageSeries[0].timestamp_start),
      12,
      intervalMinutes
    );
      
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

  const avg = input.averageMonthlyKwh ?? 0;
  const avgCL = input.averageMonthlyControlledKwh ?? 0;

  const intervalMinutes = 30; // v1 assumption
  const intervals: CanonicalUsageInterval[] = [];

  // generate 12 months of intervals
  const base = getBillingAnchorDate();

  for (let m = 0; m < 12; m++) {
    const d = new Date(base);
    d.setUTCMonth(d.getUTCMonth() + m);

    const days = new Date(
      d.getUTCFullYear(),
      d.getUTCMonth() + 1,
      0
    ).getDate();

    // distribute avg kWh evenly
    const intervalsPerDay = Math.floor((24 * 60) / intervalMinutes);
    const perInterval = avg / (days * intervalsPerDay);
    const perIntervalCL = avgCL / (days * intervalsPerDay);

    // generate intervals for the month
    for (let day = 1; day <= days; day++) {
      const startOfDay = new Date(Date.UTC(
        d.getUTCFullYear(),
        d.getUTCMonth(),
        day, 0, 0, 0
      ));

      const endOfDay = new Date(startOfDay);
      endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

      let cursor = new Date(startOfDay);

      // emit intervals for the day
      while (cursor < endOfDay) {
        const next = new Date(cursor);
        next.setUTCMinutes(next.getUTCMinutes() + intervalMinutes);

        intervals.push({
          timestamp_start: cursor.toISOString(),
          timestamp_end: next.toISOString(),
          import_kwh: perInterval,
          export_kwh: 0,
          controlled_import_kwh: perIntervalCL,
        });

        cursor = next;
      }
    }
  }

  const timeZone = "Australia/Sydney";

  let usageSeries = normalizeIntervals(intervals, timeZone);
  const detectedIntervalMinutes = detectIntervalMinutes(usageSeries);

  usageSeries = fillMissingIntervals(
    usageSeries,
    detectedIntervalMinutes
  );

  usageSeries = applyControlledLoadBehaviour(usageSeries);
  usageSeries = applySolarExport(usageSeries);

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
