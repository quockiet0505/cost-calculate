import { api } from "encore.dev/api";

import { fetchPlanList, fetchPlanDetail } from "../cdr/cdr.http";
import { mapCdrPlanToCanonical } from "../cdr/cdr.mapper";

import { simulateUsage12Months } from "../../domain/usage/synthesize";
import { calculateSupplyCharge, calculateTouUsageCharge } from "../../domain/pricing";
import { aggregateCostResults } from "../cost/cost.service";

import {
  RecommendRequest,
  RecommendResponse,
  RecommendResult
} from "./recommend.types";

export const recommend = api(
  { method: "POST", path: "/energy/recommend", expose: true },
  async (req: RecommendRequest): Promise<RecommendResponse> => {
    const { retailer, usage } = req;

    const planListResponse = await fetchPlanList(retailer);

    const plans = planListResponse.data?.plans || planListResponse.data || [];


    const results: RecommendResult[] = [];

    for (const p of plans) {
      const detailRes = await fetchPlanDetail(retailer, p.planId);
      const plan = mapCdrPlanToCanonical(detailRes.data);

      const { usageSeries } = simulateUsage12Months(usage);

      const supply = calculateSupplyCharge({ plan, usageSeries });
      const usageCost = calculateTouUsageCharge({ plan, usageSeries });

      const base = aggregateCostResults({
        supply,
        usage: usageCost,
        solar: { total: 0, monthly: {} }
      });

      results.push({
        planId: p.planId,
        displayName: p.displayName,
        annualCost: base.annualBaseTotal
      });
    }

    return {
      results: results
        .sort((a, b) => a.annualCost - b.annualCost)
        .slice(0, 3)
    };
  }
);
