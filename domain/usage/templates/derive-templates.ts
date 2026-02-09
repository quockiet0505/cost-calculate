
import type { CanonicalUsageInterval } from "../canonical-usage";
import { WeeklyLoadTemplate, Weekday } from "./template.types";
import { getLocalMinutes } from "../../../utils/time";

export function deriveLoadTemplate(
  intervals: CanonicalUsageInterval[],
  intervalMinutes: number
): WeeklyLoadTemplate {

  const bucketsPerDay = Math.floor((24 * 60) / intervalMinutes);

  const sums: Record<string, any> = {};
  const counts: Record<string, number[]> = {};

  for (const i of intervals) {
    if (!i.weekday || !i.startTime) continue;

    const day = i.weekday as Weekday;
    const minute = getLocalMinutes(i.startTime);
    const bucket = Math.floor(minute / intervalMinutes);

    sums[day] ??= {
      import: Array(bucketsPerDay).fill(0),
      export: Array(bucketsPerDay).fill(0),
      controlledLoad: Array(bucketsPerDay).fill(0),
    };

    counts[day] ??= Array(bucketsPerDay).fill(0);

    sums[day].import[bucket] += i.import_kwh ?? 0;
    sums[day].export[bucket] += i.export_kwh ?? 0;
    sums[day].controlledLoad[bucket] += i.controlled_import_kwh ?? 0;
    counts[day][bucket]++;
  }

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
