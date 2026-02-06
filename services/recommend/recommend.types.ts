import { UsageInput } from "../../domain/usage/usage.types";
import { ExplainItem } from "../../domain/explain/explain.types"; 

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

  explains?: ExplainItem[];
  // internal only
  pricing?: any;
}

// response for recommend calculation
export interface RecommendResponse {
  results: RecommendResult[];
}
