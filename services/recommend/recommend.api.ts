import { api } from "encore.dev/api";

import { fetchPlanList, fetchPlanDetail } from "../cdr/cdr.http";
import { mapCdrPlanToCanonical } from "../cdr/cdr.mapper";

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

import {
  RecommendRequest,
  RecommendResponse,
  RecommendResult
} from "./recommend.types";

import { CanonicalUsageInterval } from "../../domain/usage/canonical-usage";

/**
 * QUICK-COMPARE RECOMMEND API
 * - Uses proxy usage window (1 month)
 * - NOT billing-grade
 * - Purpose: rank plans only
 */

// annualCost here is a proxy (quick-compare), not billing-grade

export const recommend = api(
  { method: "POST", path: "/energy/recommend", expose: true },
  async (req: RecommendRequest): Promise<RecommendResponse> => {
    const { retailer, usage } = req;

    const planListResponse = await fetchPlanList(retailer);
    const plans = planListResponse.data?.plans || [];

    const results: RecommendResult[] = [];

    for (const p of plans) {
      const detailRes = await fetchPlanDetail(retailer, p.planId);
      const plan = mapCdrPlanToCanonical(detailRes.data);

      // 1) BUILD USAGE PROXY (1 MONTH)
      const usageSeries: CanonicalUsageInterval[] =
        usage.mode === "INTERVAL"
          ? usage.intervals!.map(i => ({
              timestamp_start: i.timestamp_start,
              timestamp_end: i.timestamp_end,
              import_kwh: i.import_kwh,
              export_kwh: i.export_kwh ?? 0,
              controlled_import_kwh: i.controlled_import_kwh ?? 0,
            }))
          : buildAverageMonthProxy(usage.averageMonthlyKwh ?? 0,
                                   usage.averageMonthlyControlledKwh ?? 0);

      // 2) PRICING ENGINE (SAME AS COST)
      const supply = calculateSupplyCharge({ plan, usageSeries });

      const usageCost =
        plan.tariffPeriods[0]?.usageCharge?.rateBlockUType === "TIME_OF_USE"
          ? calculateTouUsageCharge({ plan, usageSeries })
          : calculateSingleRateUsageCharge({ plan, usageSeries });

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

      const fees = calculateFees({
        plan,
        baseTotal: base.annualBaseTotal,
      });

      const totals = applyDiscounts({
        plan,
        baseTotal: base.annualBaseTotal + fees,
      });

      // 3) NORMALISE TO ANNUAL (PROXY)
      const annualCost = totals.bestCaseTotal * 12;

      results.push({
        planId: p.planId,
        displayName: p.displayName,
        annualCost,
      });
    }

    return {
      results: results
        .sort((a, b) => a.annualCost - b.annualCost)
        .slice(0, 3),
    };
  }
);


// Helpers


function buildAverageMonthProxy(
  avgMonthlyKwh: number,
  avgMonthlyControlledKwh: number
): CanonicalUsageInterval[] {
  const intervals: CanonicalUsageInterval[] = [];
  const base = new Date(Date.UTC(2026, 0, 1)); // fixed anchor OK for compare
  const days = 30;

  const perInterval = avgMonthlyKwh / (days * 48);
  const perIntervalCL = avgMonthlyControlledKwh / (days * 48);

  for (let day = 1; day <= days; day++) {
    for (let slot = 0; slot < 48; slot++) {
      const start = new Date(Date.UTC(
        base.getUTCFullYear(),
        base.getUTCMonth(),
        day,
        Math.floor(slot / 2),
        slot % 2 ? 30 : 0
      ));
      const end = new Date(start);
      end.setUTCMinutes(end.getUTCMinutes() + 30);

      intervals.push({
        timestamp_start: start.toISOString(),
        timestamp_end: end.toISOString(),
        import_kwh: perInterval,
        export_kwh: 0,
        controlled_import_kwh: perIntervalCL,
      });
    }
  }

  return intervals;
}
