
import { UsageInput } from "../usage.types";
import { CanonicalUsageInterval } from "../canonical-usage";
import { normalizeIntervals } from "../normalize/normalize-intervals";
import { applyControlledLoadBehaviour } from "../controlled-load/apply-cl";
import { applySolarExport } from "../solar/apply-solar";


export function simulateSeasonal4W(
  input: UsageInput
): { usageSeries: CanonicalUsageInterval[]; extrapolationFactor: number } {

  const { dailyKwh, dailyCL } = getDailyAverages(input);

  const SEASON_MONTHS = [0, 3, 6, 9]; // Jan, Apr, Jul, Oct
  const DAYS_PER_SEASON = 7;
  const YEAR = 2023; // non-leap reference year

  const intervals: CanonicalUsageInterval[] = [];
  const kwhPerInterval = dailyKwh / 48;
  const clPerInterval = dailyCL / 48;

  for (const month of SEASON_MONTHS) {
    for (let d = 0; d < DAYS_PER_SEASON; d++) {
      const day = 15 + d; // middle of month
      let cursor = new Date(Date.UTC(YEAR, month, day, 0, 0, 0));
      const endOfDay = new Date(Date.UTC(YEAR, month, day + 1, 0, 0, 0));

      while (cursor < endOfDay) {
        const next = new Date(cursor.getTime() + 30 * 60000);
        intervals.push({
          timestamp_start: cursor.toISOString(),
          timestamp_end: next.toISOString(),
          import_kwh: kwhPerInterval,
          export_kwh: 0,
          controlled_import_kwh: clPerInterval,
        });
        cursor = next;
      }
    }
  }

  return {
    usageSeries: processBehaviors(
      intervals,
      input.averageMonthlyControlledKwh ?? 0
    ),
    extrapolationFactor: 365 / 28, // 4 weeks simulated
  };
}


export function simulateFullYear(
  input: UsageInput
): { usageSeries: CanonicalUsageInterval[]; extrapolationFactor: number } {

  // INTERVAL DATA 
  if (input.mode === "INTERVAL" && input.intervals?.length) {
    const series = normalizeIntervals(
      input.intervals.map(i => ({
        timestamp_start: i.timestamp_start,
        timestamp_end: i.timestamp_end,
        import_kwh: Number(i.import_kwh || 0),
        export_kwh: Number(i.export_kwh || 0),
        controlled_import_kwh: Number(i.controlled_import_kwh || 0),
      })),
      "Australia/Sydney"
    );
    return { usageSeries: series, extrapolationFactor: 1 };
  }

  // AVERAGE simulate full year
  const { dailyKwh, dailyCL } = getDailyAverages(input);
  const intervals: CanonicalUsageInterval[] = [];
  const YEAR = 2023;

  let cursor = new Date(Date.UTC(YEAR, 0, 1, 0, 0, 0));
  const endOfYear = new Date(Date.UTC(YEAR + 1, 0, 1, 0, 0, 0));

  const kwhPerInterval = dailyKwh / 48;
  const clPerInterval = dailyCL / 48;

  while (cursor < endOfYear) {
    const next = new Date(cursor.getTime() + 30 * 60000);
    intervals.push({
      timestamp_start: cursor.toISOString(),
      timestamp_end: next.toISOString(),
      import_kwh: kwhPerInterval,
      export_kwh: 0,
      controlled_import_kwh: clPerInterval,
    });
    cursor = next;
  }

  return {
    usageSeries: processBehaviors(
      intervals,
      input.averageMonthlyControlledKwh ?? 0
    ),
    extrapolationFactor: 1,
  };
}

// HELPERS

function getDailyAverages(input: UsageInput) {
  if (input.mode === "INTERVAL" && input.intervals?.length) {
    const metrics = extractAverageFromIntervals(input.intervals);
    return {
      dailyKwh: metrics.dailyImport,
      dailyCL: metrics.dailyControlled,
    };
  }

  const monthlyKwh = input.averageMonthlyKwh ?? 0;
  const monthlyCL = input.averageMonthlyControlledKwh ?? 0;

  return {
    dailyKwh: (monthlyKwh * 12) / 365,
    dailyCL: (monthlyCL * 12) / 365,
  };
}

function extractAverageFromIntervals(intervals: any[]) {
  let totalImport = 0;
  let totalControlled = 0;

  for (const i of intervals) {
    totalImport += Number(i.import_kwh || 0);
    totalControlled += Number(i.controlled_import_kwh || 0);
  }

  const start = new Date(intervals[0].timestamp_start).getTime();
  const end = new Date(intervals[intervals.length - 1].timestamp_end).getTime();
  const days = Math.max(1, (end - start) / (1000 * 3600 * 24));

  return {
    dailyImport: totalImport / days,
    dailyControlled: totalControlled / days,
  };
}


function processBehaviors(
  intervals: CanonicalUsageInterval[],
  avgMonthlyCL: number
) {
  let series = normalizeIntervals(intervals, "Australia/Sydney");
  series = applyControlledLoadBehaviour(series, avgMonthlyCL);
  series = applySolarExport(series);
  return series;
}
