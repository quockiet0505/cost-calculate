import { CanonicalUsageInterval } from "../canonical-usage";
import { SEASONALITY } from "./seasonality.data";

type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

function toMonthKey(n: number): Month {
  return Math.min(12, Math.max(1, n)) as Month;
}

export function applySeasonality(
  intervals: CanonicalUsageInterval[]
): CanonicalUsageInterval[] {
  return intervals.map(interval => {
    if (!interval.localMonth) return interval;

    const month = toMonthKey(Number(interval.localMonth.slice(5, 7)));

    return {
      ...interval,
      import_kwh:
        interval.import_kwh * (SEASONALITY.import[month] ?? 1),
      export_kwh:
        interval.export_kwh * (SEASONALITY.export[month] ?? 1),
      controlled_import_kwh:
        interval.controlled_import_kwh *
        (SEASONALITY.controlledLoad[month] ?? 1),
    };
  });
}
