import { api } from "encore.dev/api";

import { fetchPlanDetail } from "../cdr/cdr.http";
import { mapCdrPlanToCanonical } from "../cdr/cdr.mapper";

import { simulateUsage12Months } from "../../domain/usage/synthesize";
import {
  calculateSupplyCharge,
  calculateSingleRateUsageCharge,
  calculateTouUsageCharge,
  calculateSolarFit,
  calculateFees,
  applyDiscounts
} from "../../domain/pricing";

import { aggregateCostResults } from "./cost.service";
import { CostRequest, CostResponse } from "./cost.types";

function safeNumber(n: unknown): number {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

function sanitizeMonthlyBreakdown(mb: Record<string, { supply?: number; usage?: number; solar?: number }>): Record<string, { supply: number; usage: number; solar: number }> {
  const out: Record<string, { supply: number; usage: number; solar: number }> = {};
  for (const [month, vals] of Object.entries(mb || {})) {
    out[month] = {
      supply: safeNumber(vals?.supply),
      usage: safeNumber(vals?.usage),
      solar: safeNumber(vals?.solar),
    };
  }
  return out;
}

export const cost = api(
  { method: "POST", path: "/energy/cost", expose: true },
  async (req: CostRequest): Promise<CostResponse> => {
    const { retailer, planId, usage } = req;

    if (!retailer || !planId) {
     throw new Error("retailer and planId are required for cost calculation");
   }   

    //  Fetch + canonicalize plan
    const planRes = await fetchPlanDetail(retailer, planId);
    const plan = mapCdrPlanToCanonical(planRes.data);


    //  Simulate usage
    const { usageSeries } = simulateUsage12Months(usage);

    //  Pricing
    const supply = calculateSupplyCharge({ plan, usageSeries });

    const usageCost =
      plan.tariffPeriods[0]?.usageCharge?.rateBlockUType === "TIME_OF_USE"
        ? calculateTouUsageCharge({ plan, usageSeries })
        : calculateSingleRateUsageCharge({ plan, usageSeries });

    const solar = calculateSolarFit({ plan, usageSeries });

    const base = aggregateCostResults({
      supply,
      usage: usageCost,
      solar
    });

    //  Fees + discounts
    const fees = safeNumber(
      calculateFees({
        plan,
        baseTotal: safeNumber(base.annualBaseTotal),
      })
    );

    const totals = applyDiscounts({
      plan,
      baseTotal: safeNumber(base.annualBaseTotal) + fees
    });

    //  RETURN 
    const baseTotal = safeNumber(totals.baseTotal);
    const bestCaseTotal = safeNumber(totals.bestCaseTotal);
    const monthlyBreakdown = sanitizeMonthlyBreakdown(base.monthlyBreakdown || {});

    return {
      retailer,
      planId,
      baseTotal,
      bestCaseTotal,
      monthlyBreakdown
    };
  }
);

