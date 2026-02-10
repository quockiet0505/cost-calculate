import { UsageInput } from "../../domain/usage/model/usage.types";
import { ExplainItem } from "../../domain/explain/explain.types";

export interface CostRequest {
  retailer: string;
  planId: string;
  usage: UsageInput;
}

export interface CostResponse {
  retailer: string;
  planId: string;

  baseTotal: number;
  bestCaseTotal: number;

  // Model 1 OR Model 2
  monthlyBreakdown?: Record<string, any>;

  // Model 2 only
  expectedRange?: {
    min: number;
    max: number;
  };

  sensitivity?: {
    type: "SHIFT_OFF_PEAK";
    ratio: number;
    baseTotal: number;
    shiftedTotal: number;
    delta: number;
  };

  // v1 + v2 explains
  explains?: ExplainItem[];

  //  NEW – Model 2 context
  modelAssumptions?: {
    profileUsed: string;
    climateZone: string;
    occupancy: string;
    solar: string;
    confidence: "LOW" | "MEDIUM" | "HIGH";
  };
}
