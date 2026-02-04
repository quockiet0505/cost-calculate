import { deriveLoadTemplate } from "./templates/derive-templates";
import { generateFutureUsage } from "./generators/generate-future";
import { UsageInput } from "./usage.types";
import { CanonicalUsageInterval } from "./canonical-usage";

import { applySolarExport } from "./solar/apply-solar";
import { applyControlledLoadBehaviour } from "./controlled-load/apply-cl";

export function simulateUsage12Months(
  input: UsageInput
): { usageSeries: CanonicalUsageInterval[] } {

  /**
   * MODEL 1: INTERVAL INPUT (GROUND TRUTH)
   */
  if (input.mode === "INTERVAL" && input.intervals?.length) {
    return {
      usageSeries: input.intervals.map(i => ({
        timestamp_start: i.timestamp_start,
        timestamp_end: i.timestamp_end,
        import_kwh: i.import_kwh,
        export_kwh: i.export_kwh ?? 0,
        controlled_import_kwh: i.controlled_import_kwh ?? 0,
      }))
    };
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



function synthesizeFromAverage(
  input: UsageInput
): { usageSeries: CanonicalUsageInterval[] } {

  const avg = input.averageMonthlyKwh ?? 0;
  const avgCL = input.averageMonthlyControlledKwh ?? 0;

  const intervals: CanonicalUsageInterval[] = [];
  const base = getBillingAnchorDate();

  for (let m = 0; m < 12; m++) {
    const d = new Date(base);
    d.setUTCMonth(d.getUTCMonth() + m);

    const month = d.getUTCMonth() + 1;
    const days = new Date(d.getUTCFullYear(), month, 0).getDate();

    const perInterval = avg / (days * 48);
    const perIntervalCL = avgCL / (days * 48);

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
