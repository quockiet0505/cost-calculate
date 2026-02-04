import { UsageInput } from "../../domain/usage/usage.types"

// request for cost calculation
export interface CostRequest {
  retailer: string;
  planId: string;
  usage: UsageInput;
}

// response for cost calculation
export interface CostResponse {
  retailer: string;
  planId: string;
  baseTotal: number;
  bestCaseTotal: number;
  monthlyBreakdown: Record<string, any>;
}
