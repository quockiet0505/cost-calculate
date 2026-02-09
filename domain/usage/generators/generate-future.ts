import { WeeklyLoadTemplate } from "../templates/template.types";
import { getWeekday } from "./weekday-utils";
import { emitDayIntervals } from "./interval-emitter";
import { CanonicalUsageInterval } from "../canonical-usage";

// Generate future usage from template (no seasonality yet)
export function generateFutureUsage(
  template: WeeklyLoadTemplate,
  startDate: Date,
  months: number,
  intervalMinutes: number
): CanonicalUsageInterval[] {

  const result: CanonicalUsageInterval[] = [];
  const cursor = new Date(startDate);

  // local calendar end (exclusive)
  const end = new Date(startDate);
  end.setMonth(end.getMonth() + months);

  while (cursor < end) {
    const weekday = getWeekday(cursor);
    const shape = template[weekday];

    if (shape) {
      const dayIntervals = emitDayIntervals(
        cursor,
        intervalMinutes,
        shape
      );
      result.push(...dayIntervals);
    }

    // move by local day
    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
}
