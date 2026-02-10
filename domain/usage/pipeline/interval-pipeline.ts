import { UsageInput } from "../model/usage.types";
import { CanonicalUsageInterval } from "../model/canonical-usage";

import { normalizeIntervals } from "../normalize/normalize-intervals";
import { detectIntervalMinutes } from "../normalize/interval-utils";
import { fillMissingIntervals } from "../normalize/fill-gaps";

import { deriveLoadTemplate } from "../templates/derive-templates";
import { generateFutureUsage } from "../generators/generate-future";
import { applyHolidayBehaviour } from "../calendar/apply-holiday";
import { applySeasonality } from "../seasonality/apply-seasonality";

import { getLocalParts } from "../../../utils/time";

export function runIntervalPipeline(
  input: UsageInput
): CanonicalUsageInterval[] {

  const timeZone = "Australia/Sydney";

  // 1. Normalize + fill gaps (DST safe)
  let baseSeries: CanonicalUsageInterval[] =
    input.intervals!.map(i => ({
      timestamp_start: i.timestamp_start,
      timestamp_end: i.timestamp_end,
      import_kwh: Number(i.import_kwh || 0),
      export_kwh: Number(i.export_kwh || 0),
      controlled_import_kwh: Number(i.controlled_import_kwh || 0),
    }));

  baseSeries = normalizeIntervals(baseSeries, timeZone);
  const intervalMinutes = detectIntervalMinutes(baseSeries);
  baseSeries = fillMissingIntervals(baseSeries, intervalMinutes);
  baseSeries = normalizeIntervals(baseSeries, timeZone);

  // 2. Derive weekday load templates
  const weeklyTemplate = deriveLoadTemplate(
    baseSeries,
    intervalMinutes
  );

  // 3. Forecast start = local start-of-month
  const first = new Date(baseSeries[0].timestamp_start);
  const { monthKey } = getLocalParts(first, timeZone);
  const [year, month] = monthKey.split("-").map(Number);

  const forecastStart = new Date(Date.UTC(
    year,
    month + 1,
    1,
    0, 0, 0
  ));

  // 4. Generate next 12 months
  let future = generateFutureUsage(
    weeklyTemplate,
    forecastStart,
    12,
    intervalMinutes
  );

  // 5. Holiday behaviour (holiday = Sunday)
  future = applyHolidayBehaviour(future, weeklyTemplate);

  // 6. Seasonal scaling (IMPORT / EXPORT / CL)
  future = applySeasonality(future);

  // 7. Enrich local calendar fields
  return future.map(item => {
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
      endTime: addMinutes(time, intervalMinutes),
    };
  });

  
}

// add minutes to HH:mm
function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(":").map(Number);
  const t = h * 60 + m + mins;

  return `${Math.floor((t % 1440) / 60)
    .toString()
    .padStart(2, "0")}:${(t % 60)
    .toString()
    .padStart(2, "0")}`;
}
