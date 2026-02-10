import { WeeklyLoadTemplate } from "../templates/template.types";
import { getWeekday } from "./weekday-utils";
import { emitDayIntervals } from "./interval-emitter";
import { CanonicalUsageInterval } from "../model/canonical-usage";

// Generate future usage from template (no seasonality yet)
export function generateFutureUsage(
  template: WeeklyLoadTemplate,
  startDate: Date,
  months: number,
  intervalMinutes: number
): CanonicalUsageInterval[] {

  const result: CanonicalUsageInterval[] = [];

  for (let m = 0; m < months; m++) {
    const monthStart = new Date(startDate);
    monthStart.setMonth(startDate.getMonth() + m);

    const year = monthStart.getFullYear();
    const month = monthStart.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let d = 0; d < daysInMonth; d++) {
      const day = new Date(year, month, d + 1);
      const weekday = getWeekday(day);
      const shape = template[weekday];

      if (!shape) continue;

      result.push(
        ...emitDayIntervals(day, intervalMinutes, shape)
      );
    }
  }

  return result;
}
