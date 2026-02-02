import { UsageInput } from "../../domain/usage/usage.types"

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
  monthlyBreakdown: Record<string, any>;
}
