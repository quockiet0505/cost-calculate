import { getLocalParts } from "./time";

/**
 * Find matching TOU rate for a timestamp in plan timezone
 */
// export function findMatchingTouRate(
//   rates: any[],
//   date: Date,
//   timeZone = "UTC"
// ) {
//   const { weekday, time } = getLocalParts(date, timeZone);

//   for (const r of rates) {
//     for (const w of r.timeOfUse || []) {
//       if (!w.days.includes(weekday)) continue;

//       const start = w.startTime;
//       const end = w.endTime;

//       let inRange = false;

//       // normal window
//       if (start <= end) {
//         inRange = time >= start && time < end;
//       } else {
//         // wrap-midnight window
//         inRange = time >= start || time < end;
//       }

//       if (inRange) return r;
//     }
//   }

//   return null;
// }

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
