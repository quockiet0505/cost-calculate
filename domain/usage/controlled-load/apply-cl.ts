import { getLocalMinutes } from "../../../utils/time";
import { isControlledLoadActiveMinute } from "./cl-windows";
import { CanonicalUsageInterval } from "../canonical-usage";

export function applyControlledLoadBehaviour(intervals: CanonicalUsageInterval[]) {
  return intervals.map(interval => {
    if (!interval.startTime) return interval;

    const minute = getLocalMinutes(interval.startTime);

    if (!isControlledLoadActiveMinute(minute)) {
      return {
        ...interval,
        controlled_import_kwh: 0,
      };
    }

    return interval;
  });
}
