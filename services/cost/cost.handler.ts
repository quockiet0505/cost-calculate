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
import { CostRequest, CostResponse } from "./cost.types";

/**
 * PURE cost calculation handler
 * - No Encore dependency
 * - Safe to test with Vitest
 */
export async function costHandler(
  req: CostRequest
): Promise<CostResponse> {

  const { retailer, planId, usage } = req;

  if (!retailer || !planId) {
    throw new Error("retailer and planId are required");
  }

  // 1. Fetch + canonicalize plan
  const planRes = await fetchPlanDetail(retailer, planId);
  const plan = mapCdrPlanToCanonical(planRes.data);

  // 2. Simulate usage
  const { usageSeries } = simulateUsage12Months(usage);

  // 3. Pricing
  const supply = calculateSupplyCharge({ plan, usageSeries });

  let usageCost;
  const firstTariff = plan.tariffPeriods[0];
  if (firstTariff?.usageCharge?.rateBlockUType === "TIME_OF_USE") {
    usageCost = calculateTouUsageCharge({ plan, usageSeries });
  } else {
    usageCost = calculateSingleRateUsageCharge({ plan, usageSeries });
  }

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
