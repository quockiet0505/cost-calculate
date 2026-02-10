import { WeeklyLoadTemplate, DailyLoadShape, Weekday } from "./template.types";

const WEEKDAYS: Weekday[] = [
  "MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"
];

export function expandDailyToWeekly(
  daily: DailyLoadShape
): WeeklyLoadTemplate {
  const week = {} as WeeklyLoadTemplate;

  for (const day of WEEKDAYS) {
    week[day] = {
      import: [...daily.import],
      export: [...daily.export],
      controlledLoad: [...daily.controlledLoad],
    };
  }

  return week;
}
