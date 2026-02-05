import { CanonicalUsageInterval } from "../canonical-usage";
import { isControlledLoadActive } from "./cl-windows";

/**
 * Apply controlled load windows using LOCAL time
 */
export function applyControlledLoadBehaviour(
  intervals: CanonicalUsageInterval[]
): CanonicalUsageInterval[] {

  return intervals.map(interval => {
    if (!interval.startTime) return interval;

    const [hh, mm] = interval.startTime.split(":").map(Number);
    const slot = hh * 2 + (mm >= 30 ? 1 : 0);

    if (!isControlledLoadActive(slot)) {
      return {
        ...interval,
        controlled_import_kwh: 0,
      };
    }

    return interval;
  });
}
