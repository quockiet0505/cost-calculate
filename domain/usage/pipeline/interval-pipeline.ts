// model 1
import { UsageInput } from "../model/usage.types";
import { CanonicalUsageInterval } from "../model/canonical-usage";

import { normalizeIntervals } from "../normalize/normalize-intervals";
import { detectIntervalMinutes } from "../normalize/interval-utils";
import { fillMissingIntervals } from "../normalize/fill-gaps";

import { deriveLoadTemplate } from "../templates/derive-templates";
import { generateFutureUsage } from "../generators/generate-future";
import { applyHolidayBehaviour } from "../calendar/apply-holiday";

import { getLocalParts } from "../../../utils/time";

export function runIntervalPipeline(
  input: UsageInput
): CanonicalUsageInterval[] {

  const timeZone = "Australia/Sydney";

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

  const weeklyTemplate = deriveLoadTemplate(baseSeries, intervalMinutes);

  const first = new Date(baseSeries[0].timestamp_start);
  const { monthKey } = getLocalParts(first, timeZone);
  const [y, m] = monthKey.split("-").map(Number);

  const forecastStart = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));

  const future = generateFutureUsage(
    weeklyTemplate,
    forecastStart,
    12,
    intervalMinutes
  );

  const holidayAdjusted = applyHolidayBehaviour(future, weeklyTemplate);

  return holidayAdjusted.map(item => {
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

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(":").map(Number);
  const t = h * 60 + m + mins;
  return `${Math.floor((t % 1440) / 60)
    .toString()
    .padStart(2, "0")}:${(t % 60).toString().padStart(2, "0")}`;
}
