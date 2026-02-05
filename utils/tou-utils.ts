import { getLocalParts } from "./time";

export function findMatchingTouRate(
  rates: any[],
  input: { weekday: string; time: string }
) {
  const { weekday, time } = input;

  for (const r of rates) {
    for (const w of r.timeOfUse || []) {
      if (!w.days.includes(weekday)) continue;

      const start = w.startTime;
      const end = w.endTime;

      if (
        start <= end
          ? time >= start && time < end
          : time >= start || time < end
      ) {
        return r;
      }
    }
  }
  return null;
}
