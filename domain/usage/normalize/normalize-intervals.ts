import { CanonicalUsageInterval } from '../model/canonical-usage';
import { getLocalParts } from "../../../utils/time";


export function normalizeIntervals(
  intervals: CanonicalUsageInterval[],
  timeZone: string
): CanonicalUsageInterval[] {
  return intervals.map((i) => {
    const start = new Date(i.timestamp_start);
    const end = new Date(i.timestamp_end);

    const startLocal = getLocalParts(start, timeZone);
    const endLocal = getLocalParts(end, timeZone);

    return {
      ...i,

      // canonical local fields
      localDate: startLocal.dateKey,
      localMonth: startLocal.monthKey,
      weekday: startLocal.weekday,
      startTime: startLocal.time,
      endTime: endLocal.time,
    };
  });
}
