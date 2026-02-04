import { UsageInput } from "../../domain/usage/usage.types";

// request for recommend calculation
export interface RecommendRequest {
  retailer: string;
  usage: UsageInput;
}

// result for each recommended plan
export interface RecommendResult {
  planId: string;
  displayName: string;
  annualCost: number;
}

// response for recommend calculation
export interface RecommendResponse {
  results: RecommendResult[];
}
