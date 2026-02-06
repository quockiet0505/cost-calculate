// import { UsageInput } from "./usage.types";
// import { CanonicalUsageInterval } from "./canonical-usage";

// import { synthesizeFromAverage } from "./synthesize-average";

// /**
//  * Recommend-grade usage simulation
//  * - INTERVAL extract average  -> simulate 12 months
//  * - AVERAGE -> simulate 12 months
//  */
// export function simulateUsageForRecommend(
//   input: UsageInput
// ): { usageSeries: CanonicalUsageInterval[] } {

//   let avgKwh = 0;
//   let avgCL = 0;

//   if (input.mode === "INTERVAL" && input.intervals?.length) {
//     const metrics = extractAverageFromIntervals(input.intervals);
//     avgKwh = metrics.import;
//     avgCL = metrics.controlled;
//   }

//   if (input.mode === "AVERAGE") {
//     avgKwh = input.averageMonthlyKwh ?? 0;
//     avgCL = input.averageMonthlyControlledKwh ?? 0;
//   }

//   return synthesizeFromAverage(avgKwh, avgCL);
// }

// //  helpers

// function extractAverageFromIntervals(intervals: any[]) {
//   let totalImport = 0;
//   let totalControlled = 0;

//   for (const i of intervals) {
//     totalImport += Number(i.import_kwh || 0);
//     totalControlled += Number(i.controlled_import_kwh || 0);
//   }

//   const start = new Date(intervals[0].timestamp_start).getTime();
//   const end = new Date(intervals[intervals.length - 1].timestamp_end).getTime();
//   const days = Math.max(1, (end - start) / (1000 * 3600 * 24));

//   return {
//     import: (totalImport / days) * 30.42,
//     controlled: (totalControlled / days) * 30.42,
//   };
// }

import { UsageInput } from "./usage.types";
import { CanonicalUsageInterval } from "./canonical-usage";
import { normalizeIntervals } from "./normalize/normalize-intervals";
import { applyControlledLoadBehaviour } from "./controlled-load/apply-cl";
import { applySolarExport } from "./solar/apply-solar";

/**
 * Recommend-grade usage simulation
 * - Uses SEASONAL SAMPLING (4 weeks) instead of full year to boost performance 13x.
 */
export function simulateUsageForRecommend(
  input: UsageInput
): { usageSeries: CanonicalUsageInterval[], extrapolationFactor: number } {

  let avgKwh = 0;
  let avgCL = 0;

  // 1. Extract metrics
  if (input.mode === "INTERVAL" && input.intervals?.length) {
    const metrics = extractAverageFromIntervals(input.intervals);
    avgKwh = metrics.import;
    avgCL = metrics.controlled;
  } else {
    avgKwh = input.averageMonthlyKwh ?? 0;
    avgCL = input.averageMonthlyControlledKwh ?? 0;
  }

  // 2. Generate only 28 days (1 week per season)
  const usageSeries = synthesizeSeasonalSample(avgKwh, avgCL);

  // 3. Return series + factor to scale up to 365 days
  // Factor = 365 days / 28 days sample approx 13.03
  return { 
    usageSeries, 
    extrapolationFactor: 365 / 28 
  };
}

// Create 4 representative weeks ---
function synthesizeSeasonalSample(avgKwh: number, avgCL: number): CanonicalUsageInterval[] {
  const intervalMinutes = 30;
  const intervals: CanonicalUsageInterval[] = [];
  
  // Sample months: Jan (Summer), Apr (Autumn), Jul (Winter), Oct (Spring)
  const sampleMonths = [0, 3, 6, 9]; 
  const daysPerSample = 7; 
  const currentYear = new Date().getUTCFullYear();

  // Distribute monthly Avg to 30-min intervals (assuming 30 days/month flat)
  const intervalsPerMonth = 30 * 48; 
  const perInterval = avgKwh / intervalsPerMonth;
  const perIntervalCL = avgCL / intervalsPerMonth;

  for (const month of sampleMonths) {
    for (let day = 1; day <= daysPerSample; day++) {
       // Create date at UTC 00:00
       let cursor = new Date(Date.UTC(currentYear, month, day, 0, 0, 0));
       const endOfDay = new Date(cursor);
       endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

       while (cursor < endOfDay) {
         const next = new Date(cursor);
         next.setUTCMinutes(next.getUTCMinutes() + intervalMinutes);
         
         intervals.push({
           timestamp_start: cursor.toISOString(),
           timestamp_end: next.toISOString(),
           import_kwh: perInterval,
           export_kwh: 0,
           controlled_import_kwh: perIntervalCL
         });
         cursor = next;
       }
    }
  }

  // Normalize & Apply Behaviours
  let series = normalizeIntervals(intervals, "Australia/Sydney");
  series = applyControlledLoadBehaviour(series);
  series = applySolarExport(series); // Optional: Simulate solar curve

  return series;
}

// Helper (Keep existing)
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
    import: (totalImport / days) * 30.42,
    controlled: (totalControlled / days) * 30.42,
  };
}