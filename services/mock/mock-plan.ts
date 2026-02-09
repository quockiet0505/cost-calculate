import raw from "./plan.mock.json";
import { mapCdrPlanToCanonical } from "../cdr/cdr.mapper";

export function getMockPlan() {
  return mapCdrPlanToCanonical(raw.data);
}
