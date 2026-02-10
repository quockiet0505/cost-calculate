import { api } from "encore.dev/api";
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
  calculateBillingTotals
} from "../../domain/pricing";

import { safeNumber } from "../../utils/number";
import { sanitizeMonthlyBreakdown } from "../../utils/sanitize";
import { CostRequest, CostResponse } from "./cost.types";
import { getMockPlan } from "../mock/mock-plan";
import { shiftPeakToOffPeak } from "../../domain/transform/shift-peak-to-offpeak";

import { explainPlan } from "../../domain/explain/explain-engine";

export const cost = api(
  { method: "POST", path: "/energy/cost", expose: true },
  async (req: CostRequest): Promise<CostResponse> => {

    const { retailer, planId, usage } = req;
    const plan = getMockPlan();

    // MODEL 2 – AVERAGE (v2)
    if (usage.mode === "AVERAGE") {

      const factors = [
        { name: "LOW", factor: 0.9 },
        { name: "BASE", factor: 1.0 },
        { name: "HIGH", factor: 1.1 },
      ];

      const scenarios = factors.map(f => {
        const series = runUsagePipeline({
          ...usage,
          averageMonthlyKwh: usage.averageMonthlyKwh! * f.factor,
        });

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

        return {
          name: f.name,
          finalTotal: billing.finalTotal,
          grossTotal: billing.grossTotal,
          monthlyBreakdown:
            f.name === "BASE" ? base.monthlyBreakdown : undefined,
          series,
          componentTotals: base.componentTotals,
        };
      });

      const baseScenario = scenarios.find(s => s.name === "BASE")!;
      const lowScenario = scenarios.find(s => s.name === "LOW")!;
      const highScenario = scenarios.find(s => s.name === "HIGH")!;

      // Sensitivity (PEAK → OFF_PEAK)
      const { shifted } = shiftPeakToOffPeak(
        baseScenario.series,
        plan,
        0.2
      );

      const shiftedUsage = calculateUsageCharge({
        plan,
        usageSeries: shifted,
      });

      const shiftedBilling = calculateBillingTotals({
        supply: 0,
        usage: shiftedUsage.total,
        controlledLoadUsage: 0,
        controlledLoadSupply: 0,
        demand: 0,
        solar: 0,
        fees: 0,
        discounts: 0,
      });

      // MODEL 2 v2 assumptions
      const modelAssumptions =
        (baseScenario.series as any).assumptions;


        const explains = explainPlan({
          base: toExplainInput(baseScenario),
          baseline: toExplainInput(lowScenario),
          assumptions: modelAssumptions, 
        });      
        
      return {
        retailer,
        planId,

        // totals
        baseTotal: safeNumber(baseScenario.finalTotal),
        bestCaseTotal: safeNumber(lowScenario.finalTotal),

        // breakdown (BASE only)
        monthlyBreakdown: sanitizeMonthlyBreakdown(
          baseScenario.monthlyBreakdown
        ),

        // expected range
        expectedRange: {
          min: safeNumber(lowScenario.finalTotal),
          max: safeNumber(highScenario.finalTotal),
        },

        // sensitivity
        sensitivity: {
          type: "SHIFT_OFF_PEAK",
          ratio: 0.2,
          baseTotal: safeNumber(baseScenario.finalTotal),
          shiftedTotal: safeNumber(shiftedBilling.finalTotal),
          delta: safeNumber(
            baseScenario.finalTotal - shiftedBilling.finalTotal
          ),
        },

        // explains
        explains,

        // Model 2 v2 metadata
        modelAssumptions,
      };
    }

    // MODEL 1 – INTERVAL
    const series = runUsagePipeline(usage);

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

    const billing = calculateBillingTotals({
      supply: supply.total,
      usage: usageCost.total,
      controlledLoadUsage: clUsage.total,
      controlledLoadSupply: clSupply.total,
      demand: demand.total,
      solar: solar.total,
      fees: 0,
      discounts: 0,
    });

    return {
      retailer,
      planId,
      baseTotal: safeNumber(billing.grossTotal),
      bestCaseTotal: safeNumber(billing.finalTotal),
      monthlyBreakdown: sanitizeMonthlyBreakdown(
        base.monthlyBreakdown
      ),
    };
  }
);

// Helpers
function toExplainInput(base: any) {
  return {
    componentTotals: {
      supply: safeNumber(base.componentTotals?.supply),
      usage: safeNumber(base.componentTotals?.usage),
      solar: safeNumber(base.componentTotals?.solar),
      demand: safeNumber(base.componentTotals?.demand),
    },
  };
}
