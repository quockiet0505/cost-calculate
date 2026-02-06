export type ExplainReason =
  | "LOW_SUPPLY"
  | "LOW_USAGE"
  | "GOOD_TOU_FIT"
  | "HIGH_SOLAR_FIT"
  | "LOW_DEMAND"
  | "DISCOUNT_APPLIED";

export interface ExplainItem {
  reason: ExplainReason;
  impact: number;      // $ saved (+ means cheaper)
  message: string;     // human-readable
}
