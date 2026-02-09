import { CanonicalUsageInterval } from "../canonical-usage";
import { normalizeIntervals } from "../normalize/normalize-intervals";
import { applyControlledLoadBehaviour } from "../controlled-load/apply-cl";
import { applySolarExport } from "../solar/apply-solar";

export type SynthesizeWindow = {
  start: Date;   // local month start
  months: number;
};

export function synthesizeFromAverage(
  avgKwh: number,
  avgCL: number,
  window: SynthesizeWindow
): CanonicalUsageInterval[] {

  const intervalMinutes = 30;
  const intervalsPerDay = (24 * 60) / intervalMinutes;

  const intervals: CanonicalUsageInterval[] = [];

  let cursor = new Date(window.start);

  for (let m = 0; m < window.months; m++) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const dailyImport = avgKwh / daysInMonth;
    const dailyCL = avgCL / daysInMonth;

    for (let d = 0; d < daysInMonth; d++) {
      // local midnight
      let local = new Date(year, month, d + 1, 0, 0, 0);

      for (let i = 0; i < intervalsPerDay; i++) {
        const localEnd = new Date(local.getTime() + intervalMinutes * 60000);

        // convert LOCAL → UTC ISO (engine expects this)
        const utcStart = new Date(
          local.getTime() - local.getTimezoneOffset() * 60000
        );
        const utcEnd = new Date(
          localEnd.getTime() - localEnd.getTimezoneOffset() * 60000
        );

        intervals.push({
          timestamp_start: utcStart.toISOString(),
          timestamp_end: utcEnd.toISOString(),
          import_kwh: dailyImport / intervalsPerDay,
          export_kwh: 0,
          controlled_import_kwh: dailyCL / intervalsPerDay,
        });

        local = localEnd;
      }
    }

    // move to next local month
    cursor = new Date(year, month + 1, 1, 0, 0, 0);
  }

  // normalize + apply behaviours (same as INTERVAL)
  let series = normalizeIntervals(intervals, "Australia/Sydney");
  series = applyControlledLoadBehaviour(series, avgCL);
  series = applySolarExport(series);

  return series;
}
