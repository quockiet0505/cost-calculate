// domain/usage/templates/derive-templates.ts

import { WeeklyLoadTemplate, Weekday } from "./template.types";
import { getWeekday } from "../generators/weekday-utils";
import { getHalfHourIndex } from "../normalize/interval-utils";

interface UsageInterval {
  timestamp_start: string;
  import_kwh?: number;
  export_kwh?: number;
  controlled_import_kwh?: number;
}

export function deriveLoadTemplate(
  intervals: UsageInterval[]
): WeeklyLoadTemplate {
  // accumulator
  const sums: any = {};
  const counts: any = {};

  for (const i of intervals) {
    const date = new Date(i.timestamp_start);
     // extract thứ day of week
    const day: Weekday = getWeekday(date);
     // extract half-hour slots
    const slot = getHalfHourIndex(date);

    sums[day] ??= {
      import: Array(48).fill(0),
      export: Array(48).fill(0),
      controlledLoad: Array(48).fill(0),
    };

    counts[day] ??= Array(48).fill(0);

    sums[day].import[slot] += i.import_kwh ?? 0;
    sums[day].export[slot] += i.export_kwh ?? 0;
    sums[day].controlledLoad[slot] += i.controlled_import_kwh ?? 0;
    counts[day][slot]++;
  }

  // average
  const template: any = {};

  for (const day of Object.keys(sums) as Weekday[]) {
    template[day] = {
      import: sums[day].import.map((v: number, idx: number) =>
        counts[day][idx] ? v / counts[day][idx] : 0
      ),
      export: sums[day].export.map((v: number, idx: number) =>
        counts[day][idx] ? v / counts[day][idx] : 0
      ),
      controlledLoad: sums[day].controlledLoad.map(
        (v: number, idx: number) =>
          counts[day][idx] ? v / counts[day][idx] : 0
      ),
    };
  }

  return template;
}
