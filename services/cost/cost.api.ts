import { api } from "encore.dev/api";

import { fetchPlanDetail } from "../cdr/cdr.http";
import { mapCdrPlanToCanonical } from "../cdr/cdr.mapper";

import { simulateUsage12Months } from "../../domain/usage/synthesize";
import {
  calculateSupplyCharge,
  calculateUsageCharge,
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

// define cost api
export const cost = api(
  { method: "POST", path: "/energy/cost", expose: true },
  async (req: CostRequest): Promise<CostResponse> => {

    const { retailer, planId, usage } = req;
    if (!retailer || !planId) {
      throw new Error("retailer and planId are required");
    }

    const planRes = await fetchPlanDetail(retailer, planId);
    const plan = mapCdrPlanToCanonical(planRes.data);

    const { usageSeries } = simulateUsage12Months(usage);

    const supply = calculateSupplyCharge({ plan, usageSeries });
    const usageCost = calculateUsageCharge({ plan, usageSeries });
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
);
