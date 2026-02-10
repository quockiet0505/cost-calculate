import { WeeklyLoadTemplate, Weekday } from "../templates/template.types";

const WEEKDAYS: Weekday[] = [
  "MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"
];

/**
 * Scale a WEEKLY SHAPE to match an AVERAGE DAILY kWh.
 * Weekly template is treated as SHAPE only.
 */
export function scaleProfileToDailyKwh(
  template: WeeklyLoadTemplate,
  dailyKwh: number
): WeeklyLoadTemplate {

  //  total weekly import
  let weeklyTotal = 0;
  for (const d of WEEKDAYS) {
    weeklyTotal += template[d].import.reduce((a, b) => a + b, 0);
  }

  if (weeklyTotal <= 0) return template;

  //  average day from template
  const templateDailyAvg = weeklyTotal / 7;

  //  scaling factor
  const factor = dailyKwh / templateDailyAvg;

  //  scale all channels
  const scaled = {} as WeeklyLoadTemplate;

  for (const d of WEEKDAYS) {
    scaled[d] = {
      import: template[d].import.map(v => v * factor),
      export: template[d].export.map(v => v * factor),
      controlledLoad: template[d].controlledLoad.map(v => v * factor),
    };
  }

  return scaled;
}
