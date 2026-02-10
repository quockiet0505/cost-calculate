export type ExplainReason =
  // v1 – cost driven
  | "LOW_SUPPLY"
  | "LOW_USAGE"
  | "HIGH_SOLAR_FIT"
  | "LOW_DEMAND"
  | "DISCOUNT_APPLIED"

  // v2 – assumption driven
  | "GOOD_TOU_FIT"
  | "ASSUMPTION_PROFILE"
  | "ASSUMPTION_CLIMATE"
  | "ASSUMPTION_SOLAR"
  | "LOW_CONFIDENCE";

export interface ExplainItem {
  reason: ExplainReason;

  /**
   * Monetary impact in AUD
   * >0 = cheaper
   * =0 = informational / assumption
   */
  impact: number;

  /**
   * Human readable explanation
   */
  message: string;
}
