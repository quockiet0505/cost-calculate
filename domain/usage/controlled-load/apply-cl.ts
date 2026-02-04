// domain/usage/controlled-load/apply-cl.ts

import { CanonicalUsageInterval } from "../canonical-usage";
import { getHalfHourIndex } from "../normalize/interval-utils";
import { isControlledLoadActive } from "./cl-windows";

//  Apply controlled load behaviour to usage intervals

export function applyControlledLoadBehaviour(
  intervals: CanonicalUsageInterval[]
): CanonicalUsageInterval[] {

  const result: CanonicalUsageInterval[] = [];

  for (const interval of intervals) {
    const date = new Date(interval.timestamp_start);
    const slot = getHalfHourIndex(date);

    // CL only allowed in active windows
    if (!isControlledLoadActive(slot)) {
      result.push({
        ...interval,
        controlled_import_kwh: 0,
      });
      continue;
    }

    // inside CL window -> keep value
    result.push(interval);
  }

  return result;
}
