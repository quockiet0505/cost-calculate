import { UsageInput } from "./usage.types";
import { CanonicalUsageInterval } from "./canonical-usage";

import { normalizeIntervals } from "./normalize/normalize-intervals";
import { detectIntervalMinutes } from "./normalize/interval-utils";
import { fillMissingIntervals } from "./normalize/fill-gaps";

import { synthesizeFromAverage } from "./synthesize-average";

import { deriveLoadTemplate } from "./templates/derive-templates";
import { generateFutureUsage } from "./generators/generate-future";
import { applyHolidayBehaviour } from "./calendar/apply-holiday";

// time helpers
import { getLocalParts } from "../../utils/time";

export function simulateUsageForBilling(
  input: UsageInput
): { usageSeries: CanonicalUsageInterval[] } {

  const timeZone = "Australia/Sydney";

  let baseSeries: CanonicalUsageInterval[];
  let intervalMinutes = 30;

  // STEP 1: build base series
  if (input.mode === "INTERVAL" && input.intervals?.length) {
    baseSeries = input.intervals.map(i => ({
      timestamp_start: i.timestamp_start,
      timestamp_end: i.timestamp_end,
      import_kwh: Number(i.import_kwh || 0),
      export_kwh: Number(i.export_kwh || 0),
      controlled_import_kwh: Number(i.controlled_import_kwh || 0),
    } as CanonicalUsageInterval));

    baseSeries = normalizeIntervals(baseSeries, timeZone);
    intervalMinutes = detectIntervalMinutes(baseSeries);
    baseSeries = fillMissingIntervals(baseSeries, intervalMinutes);
    baseSeries = normalizeIntervals(baseSeries, timeZone);
  }

  else if (input.mode === "AVERAGE") {
    // base month for average mode (current local month)
    const now = new Date();
    const baseMonthStart = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      1,
      0, 0, 0
    ));

    // synthesize EXACT 12 calendar months
    baseSeries = synthesizeFromAverage(
      input.averageMonthlyKwh ?? 0,
      input.averageMonthlyControlledKwh ?? 0,
      {
        start: baseMonthStart,
        months: 12,
      }
    );

    intervalMinutes = 30;
  }

  else {
    throw new Error("Unsupported usage input");
  }

  // STEP 2: derive weekly template
  const weeklyTemplate = deriveLoadTemplate(
    baseSeries,
    intervalMinutes
  );

  // STEP 3: forecast start = local start-of-month from base data
  const first = new Date(baseSeries[0].timestamp_start);
  const { monthKey } = getLocalParts(first, timeZone);

  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);

  const forecastStart = new Date(Date.UTC(
    year,
    month - 1,
    1,
    0, 0, 0
  ));

  // STEP 4: generate 12 months (calendar-aligned)
  const rawUsageSeries = generateFutureUsage(
    weeklyTemplate,
    forecastStart,
    12,
    intervalMinutes
  );

  // after generateFutureUsage
  const holidayAdjusted = applyHolidayBehaviour(
    rawUsageSeries,
    weeklyTemplate
  );


  // STEP 5: enrich for pricing
  const usageSeries = rawUsageSeries.map(item => {
    const { weekday, time, dateKey, monthKey } = getLocalParts(
      new Date(item.timestamp_start),
      timeZone
    );

    return {
      ...item,
      localDate: dateKey,
      localMonth: monthKey,
      weekday,
      startTime: time,
      endTime: getEndTime(time, intervalMinutes),

      importKwh: item.import_kwh,
      kwh: item.import_kwh,
      exportKwh: item.export_kwh,
      controlledImportKwh: item.controlled_import_kwh,
      controlledLoadKwh: item.controlled_import_kwh,
      controlledLoadImportKwh: item.controlled_import_kwh
    };
  });

  return { usageSeries };
}

// add minutes to HH:mm
function getEndTime(startTime: string, durationMinutes: number): string {
  const [hh, mm] = startTime.split(":").map(Number);
  const total = hh * 60 + mm + durationMinutes;

  const h = Math.floor((total % 1440) / 60);
  const m = total % 60;

  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}