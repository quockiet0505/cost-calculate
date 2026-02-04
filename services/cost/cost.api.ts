import { api } from "encore.dev/api";

import { fetchPlanDetail } from "../cdr/cdr.http";
import { mapCdrPlanToCanonical } from "../cdr/cdr.mapper";

import { simulateUsage12Months } from "../../domain/usage/synthesize";
import {
  calculateSupplyCharge,
  calculateSingleRateUsageCharge,
  calculateTouUsageCharge,
  calculateSolarFit,
  calculateControlledLoadUsageCharge,
  calculateControlledLoadSupplyCharge,
  calculateDemandCharge,
  calculateFees,
  applyDiscounts,
  aggregateCostResults
} from "../../domain/pricing";

import { safeNumber } from "../../utils/number";
import { sanitizeMonthlyBreakdown } from "../../utils/sanitize";

// import { aggregateCostResults } from "./cost.service";
import { CostRequest, CostResponse } from "./cost.types";

export const cost = api(
  { method: "POST", path: "/energy/cost", expose: true },
  async (req: CostRequest): Promise<CostResponse> => {
    const { retailer, planId, usage } = req;

    if (!retailer || !planId) {
      throw new Error("retailer and planId are required");
    }

    // 1. Fetch + canonicalize plan
    const planRes = await fetchPlanDetail(retailer, planId);
    const plan = mapCdrPlanToCanonical(planRes.data);

    // 2. Simulate usage (Model 1 or 2)
    const { usageSeries } = simulateUsage12Months(usage);

    // 3. Pricing (Phase 1 + 2)
    const supply = calculateSupplyCharge({ plan, usageSeries });

    const usageChargeSingle = calculateSingleRateUsageCharge({ plan, usageSeries });
    const usageChargeTou = calculateTouUsageCharge({ plan, usageSeries });

    //  choose higher-fidelity result automatically
    const usageCost =
      usageChargeTou.total > 0 ? usageChargeTou : usageChargeSingle;

    const solar = calculateSolarFit({ plan, usageSeries });

    const controlledLoadUsage =
      calculateControlledLoadUsageCharge({ plan, usageSeries });

    const controlledLoadSupply =
      calculateControlledLoadSupplyCharge({ plan, usageSeries });

    const demand = calculateDemandCharge({ plan, usageSeries });

    const base = aggregateCostResults({
      supply,
      usage: usageCost,
      solar,
      controlledLoadUsage,
      controlledLoadSupply,
      demand,
    });

    // 4. Fees + Discounts
    const fees = safeNumber(
      calculateFees({
        plan,
        baseTotal: base.annualBaseTotal,
      })
    );

    const totals = applyDiscounts({
      plan,
      baseTotal: base.annualBaseTotal + fees,
      usageTotal: usageCost.total,
    });

    return {
      retailer,
      planId,
      baseTotal: safeNumber(totals.baseTotal),
      bestCaseTotal: safeNumber(totals.bestCaseTotal),
      monthlyBreakdown: sanitizeMonthlyBreakdown(base.monthlyBreakdown),
    };
  }
);
