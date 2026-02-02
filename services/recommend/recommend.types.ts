import { UsageInput } from "../../domain/usage/usage.types";

export interface RecommendRequest {
  retailer: string;
  usage: UsageInput;
}

export interface RecommendResult {
  planId: string;
  displayName: string;
  annualCost: number;
}


export interface RecommendResponse {
  results: RecommendResult[];
}
