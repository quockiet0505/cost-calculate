import { CanonicalUsageInterval } from "../canonical-usage";
import { SEASONALITY } from "./seasonality.data";

// month key type
type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

// claim number as month key
function toMonthKey(n: number): Month {
  const clamped = Math.min(12, Math.max(1, n));
  return clamped as Month;
}

export function applySeasonality(
  intervals: CanonicalUsageInterval[]
): CanonicalUsageInterval[] {
  return intervals.map((interval) => {
    // parse date from timestamp
    const date = new Date(interval.timestamp_start);

    // month index: 1–12
    const month = toMonthKey(date.getUTCMonth() + 1);

    // lookup seasonal multipliers (fallback = 1)
    const importFactor =
      SEASONALITY.import[month] ?? 1;

    const exportFactor =
      SEASONALITY.export[month] ?? 1;

    const clFactor =
      SEASONALITY.controlledLoad[month] ?? 1;

    return {
      ...interval,

      // scale energy values
      import_kwh:
        interval.import_kwh * importFactor,

      export_kwh:
        interval.export_kwh * exportFactor,

      controlled_import_kwh:
        interval.controlled_import_kwh * clFactor,
    };
  });
}
