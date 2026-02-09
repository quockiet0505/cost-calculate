import { api } from "encore.dev/api";
import { fetchPlanDetail } from "../cdr/cdr.http";
import { mapCdrPlanToCanonical } from "../cdr/cdr.mapper";
// import { simulateUsageForBilling } from "../../domain/usage/simulate-billing";
import { simulateUsage } from "../../domain/usage/engine/usage-engine";

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

import { getPlan } from "../cdr/plan-repository";
// temp
import { getMockPlan } from "../mock/mock-plan";


export const cost = api(
  { method: "POST", path: "/energy/cost", expose: true },
  async (req: CostRequest): Promise<CostResponse> => {

    const { retailer, planId, usage } = req;

    if (!retailer || !planId) {
      throw new Error("retailer and planId are required");
    }

    //Fetch plan
    // const planRes = await fetchPlanDetail(retailer, planId);
    // const plan = mapCdrPlanToCanonical(planRes.data);
    // const plan = await getPlan(retailer, planId);
    const plan = getMockPlan();

    // Prepare usage series
    const  usageSeries  = simulateUsage(usage);

    //  Pricing
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

    //  Fees + discounts
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


