// api/recommend/recommend.api.ts
import { api } from "encore.dev/api";
import { getBestPlansForPostcode } from "../cdr/cdr.service.ts";
import { runUsagePipeline } from "../../domain/usage/pipeline/usage-pipeline";
import {
  calculateSupplyCharge,
  calculateUsageCharge,
  calculateSolarFit,
  calculateControlledLoadUsageCharge,
  calculateControlledLoadSupplyCharge,
  calculateDemandCharge,
  calculateFees,
  applyDiscounts,
  aggregateCostResults,
  calculateBillingTotals,
} from "../../domain/pricing";
import { safeNumber } from "../../utils/number";

import {
  RecommendRequest,
  RecommendResponse,
  RecommendedPlan,
} from "./recommend.types";

import { deriveRecommendReasons } from "../../domain/explain/recommend-explain";

export const recommend = api<
  RecommendRequest,
  RecommendResponse
>(
  { method: "POST", path: "/energy/recommend", expose: true },
  async (req): Promise<RecommendResponse> => {
    const { postcode, usage } = req;

    //  Get candidate plans
    const plans = await getBestPlansForPostcode(postcode);

    //  Build usage series ONCE
    const series = runUsagePipeline(usage);

    //  PARALLEL pricing
    const pricingTasks = plans.map(async (p) => {
      try {
        const plan = p.plan;

        const supply = calculateSupplyCharge({ plan, usageSeries: series });
        const usageCost = calculateUsageCharge({ plan, usageSeries: series });
        const solar = calculateSolarFit({ plan, usageSeries: series });
        const clUsage = calculateControlledLoadUsageCharge({ plan, usageSeries: series });
        const clSupply = calculateControlledLoadSupplyCharge({ plan, usageSeries: series });
        const demand = calculateDemandCharge({ plan, usageSeries: series });

        const base = aggregateCostResults({
          supply,
          usage: usageCost,
          solar,
          controlledLoadUsage: clUsage,
          controlledLoadSupply: clSupply,
          demand,
        });

        const fees = calculateFees({
          plan,
          baseTotal: base.annualBaseTotal,
        });

        const discounts = applyDiscounts({
          plan,
          baseTotal: base.annualBaseTotal + fees,
          usageTotal: usageCost.total,
        });

        const billing = calculateBillingTotals({
          supply: supply.total,
          usage: usageCost.total,
          controlledLoadUsage: clUsage.total,
          controlledLoadSupply: clSupply.total,
          demand: demand.total,
          solar: solar.total,
          fees,
          discounts: discounts.baseTotal - discounts.bestCaseTotal,
        });

        const result: RecommendedPlan = {
          retailer: p.retailer,
          planId: p.planId,
          finalTotal: safeNumber(billing.finalTotal),
          reasons: deriveRecommendReasons({
            componentTotals: base.componentTotals,
          }),
        };

        return result;
      } catch (err) {
        console.warn("[RECOMMEND] pricing failed", p.planId, err);
        return null;
      }
    });

    const settled = await Promise.allSettled(pricingTasks);

    const results = settled
      .filter(
        (r: any): r is PromiseFulfilledResult<RecommendedPlan> =>
          r.status === "fulfilled" && r.value !== null
      )
      .map((r: any) => r.value);

    //  Sort cheapest first
    results.sort((a: any, b: any) => a.finalTotal - b.finalTotal);

    return {
      postcode,
      count: results.length,
      recommended: results.slice(0, 3),
    };
  }
);
