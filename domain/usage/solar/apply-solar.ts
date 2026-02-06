import { CanonicalUsageInterval } from "../canonical-usage";
import { buildDailySolarCurve } from "./solar-curve";

/**
 * Apply solar export using LOCAL time slots
 */
// export function applySolarExport(
//   intervals: CanonicalUsageInterval[]
// ): CanonicalUsageInterval[] {

//   const curve = buildDailySolarCurve();

//   return intervals.map(interval => {
//     if (!interval.startTime || interval.export_kwh <= 0) {
//       return interval;
//     }

//     const [hh, mm] = interval.startTime.split(":").map(Number);
//     const slot = hh * 2 + (mm >= 30 ? 1 : 0);

//     return {
//       ...interval,
//       export_kwh: interval.export_kwh * curve[slot],
//     };
//   });
// }

import { getLocalMinutes } from "../../../utils/time";
import { solarWeightByMinute } from "./solar-curve";

export function applySolarExport(intervals: CanonicalUsageInterval[]) {
  return intervals.map(interval => {
    if (!interval.startTime || interval.export_kwh <= 0) return interval;

    const minute = getLocalMinutes(interval.startTime);
    const weight = solarWeightByMinute(minute);

    return {
      ...interval,
      export_kwh: interval.export_kwh * weight,
    };
  });
}
