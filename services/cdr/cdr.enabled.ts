
import { CDR_BRANDS } from "./cdr.brands";

export const ENABLED_CDR_RETAILERS = [
  "energyaustralia",
  // "agl",
] as const;

export type EnabledRetailer =
  typeof ENABLED_CDR_RETAILERS[number];

// helper
export function getEnabledBrands() {
  return ENABLED_CDR_RETAILERS.map(
    key => CDR_BRANDS[key]
  );
}
