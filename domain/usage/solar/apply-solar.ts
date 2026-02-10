import { CanonicalUsageInterval } from '../model/canonical-usage';
import { buildDailySolarCurve } from "./solar-curve";



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
