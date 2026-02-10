import { isPublicHoliday } from "./holidays.au";
import { WeeklyLoadTemplate } from "../templates/template.types";
import { CanonicalUsageInterval } from '../model/canonical-usage';


export function applyHolidayBehaviour(
  intervals: CanonicalUsageInterval[],
  template: WeeklyLoadTemplate
): CanonicalUsageInterval[] {

  const result: CanonicalUsageInterval[] = [];

  for (const interval of intervals) {
    if (!interval.localDate || !interval.startTime) {
      result.push(interval);
      continue;
    }

    // local-date based holiday check
    if (!isPublicHoliday(interval.localDate)) {
      result.push(interval);
      continue;
    }

    const sunday = template["SUN"];
    if (!sunday) {
      result.push(interval);
      continue;
    }

    // local half-hour slot
    const [hh, mm] = interval.startTime.split(":").map(Number);
    const slot = hh * 2 + (mm >= 30 ? 1 : 0);

    result.push({
      ...interval,
      import_kwh: sunday.import[slot],
      export_kwh: sunday.export[slot],
      controlled_import_kwh: sunday.controlledLoad[slot],
      weekday: "SUN",
    });
  }

  return result;
}
