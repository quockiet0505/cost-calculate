// model 2
import { UsageInput } from "../model/usage.types";
import { CanonicalUsageInterval } from "../model/canonical-usage";

import { synthesizeFromAverage } from "../synthesize/synthesize-average";
import { deriveLoadTemplate } from "../templates/derive-templates";
import { generateFutureUsage } from "../generators/generate-future";
import { applyHolidayBehaviour } from "../calendar/apply-holiday";

import { getLocalParts } from "../../../utils/time";

export function runAveragePipeline(
  input: UsageInput
): CanonicalUsageInterval[] {

  const timeZone = "Australia/Sydney";

  const now = new Date();
  const baseMonth = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    1
  ));

  const baseSeries = synthesizeFromAverage(
    input.averageMonthlyKwh ?? 0,
    input.averageMonthlyControlledKwh ?? 0,
    { start: baseMonth, months: 12 }
  );

  const intervalMinutes = 30;
  const weeklyTemplate = deriveLoadTemplate(baseSeries, intervalMinutes);

  const future = generateFutureUsage(
    weeklyTemplate,
    baseMonth,
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
