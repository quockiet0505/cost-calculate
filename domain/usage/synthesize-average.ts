import { CanonicalUsageInterval } from "./canonical-usage";
import { normalizeIntervals } from "./normalize/normalize-intervals";
import { applyControlledLoadBehaviour } from "./controlled-load/apply-cl";
import { applySolarExport } from "./solar/apply-solar";

export function synthesizeFromAverage(
  avgKwh: number,
  avgCL: number
): { usageSeries: CanonicalUsageInterval[] } {

  const intervalMinutes = 30;
  const intervals: CanonicalUsageInterval[] = [];
  const base = getBillingAnchorDate();

  for (let m = 0; m < 12; m++) {
    const d = new Date(base);
    d.setUTCMonth(d.getUTCMonth() + m);

    const days = new Date(
      d.getUTCFullYear(),
      d.getUTCMonth() + 1,
      0
    ).getDate();

    const intervalsPerDay = (24 * 60) / intervalMinutes;
    const perInterval = avgKwh / (days * intervalsPerDay);
    const perIntervalCL = avgCL / (days * intervalsPerDay);

    for (let day = 1; day <= days; day++) {
      let cursor = new Date(Date.UTC(
        d.getUTCFullYear(),
        d.getUTCMonth(),
        day, 0, 0, 0
      ));

      for (let i = 0; i < intervalsPerDay; i++) {
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

  let usageSeries = normalizeIntervals(intervals, "Australia/Sydney");
  usageSeries = applyControlledLoadBehaviour(usageSeries);
  usageSeries = applySolarExport(usageSeries);

  return { usageSeries };
}

function getBillingAnchorDate(): Date {
  const now = new Date();
  return new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    1, 0, 0, 0
  ));
}
