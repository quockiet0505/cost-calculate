import { CanonicalUsageInterval } from '../model/canonical-usage';
import { getLocalMinutes } from "../../../utils/time";
import { isControlledLoadActiveMinute } from "./cl-windows";

export function applyControlledLoadBehaviour(
  intervals: CanonicalUsageInterval[],
  avgMonthlyCL: number
): CanonicalUsageInterval[] {

  if (!avgMonthlyCL || avgMonthlyCL <= 0) return intervals;

  // calculate number of unique days in the intervals
  const days = new Set(intervals.map(i => i.localDate)).size;

  //  sum of CL for the period
  const totalCL = (avgMonthlyCL / 30.42) * days;

  //  find all active CL intervals
  const active = intervals.filter(i => {
    if (!i.startTime) return false;
    return isControlledLoadActiveMinute(
      getLocalMinutes(i.startTime)
    );
  });

  if (active.length === 0) {
    console.warn("[CL] No active CL window found");
    return intervals;
  }

  const perIntervalCL = totalCL / active.length;

  return intervals.map(i => {
    if (!i.startTime) return { ...i, controlled_import_kwh: 0 };

    const minute = getLocalMinutes(i.startTime);
    const inWindow = isControlledLoadActiveMinute(minute);

    return {
      ...i,
      controlled_import_kwh: inWindow ? perIntervalCL : 0,
    };
  });
}
