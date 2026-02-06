
import { api } from "encore.dev/api";

import { fetchPlanList, fetchPlanDetail } from "../cdr/cdr.http";
import { mapCdrPlanToCanonical } from "../cdr/cdr.mapper";

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
} from "../../domain/pricing";

import {
  RecommendRequest,
  RecommendResponse,
  RecommendResult,
} from "./recommend.types";

import { CanonicalUsageInterval } from "../../domain/usage/canonical-usage";
import { normalizeIntervals } from "../../domain/usage/normalize/normalize-intervals";
import { explainPlan } from "../../domain/explain/explain-engine";

import { simulateUsageForRecommend } from "../../domain/usage/simulate-recommend";

/**
 * RECOMMEND API (Optimized Production Version)
 *
 * Performance Strategy:
 * 1. Seasonal Sampling: Simulate only 28 days (4 weeks) instead of 365 days.
 * 2. Parallelism: Process all plans concurrently.
 * 3. Pre-sorting: Sort tariff periods once per plan to avoid re-sorting in loops.
 * 4. Annualization: Scale energy costs up to a year BEFORE adding fixed fees.
 */

export const recommend = api(
  { method: "POST", path: "/energy/recommend", expose: true },
  async (req: RecommendRequest): Promise<RecommendResponse> => {
    const { retailer, usage } = req;

    //  Fetch all plans
    const planListResponse = await fetchPlanList(retailer);
    const plans = planListResponse.data?.plans || [];

    if (!plans.length) {
      return { results: [] };
    }

    //  BUILD USAGE SERIES & DETERMINE SCALING FACTOR
    let usageSeries: CanonicalUsageInterval[];
    
    // Scaling factor: If we simulate 28 days, we must multiply result by (365/28) ~13.03
    let extrapolationFactor = 1; 

    if (usage.mode === "AVERAGE") {
      // AVERAGE -> Use Seasonal Sampling (Fast)
      const sim = simulateUsageForRecommend(usage);
      usageSeries = sim.usageSeries;
      extrapolationFactor = sim.extrapolationFactor; 
    } else {
      // INTERVAL input
      const normalized = normalizeIntervals(
        usage.intervals!.map((i) => ({
          timestamp_start: i.timestamp_start,
          timestamp_end: i.timestamp_end,
          import_kwh: i.import_kwh,
          export_kwh: i.export_kwh ?? 0,
          controlled_import_kwh: i.controlled_import_kwh ?? 0,
        })),
        "Australia/Sydney"
      );

      if (!hasAtLeast12Months(normalized)) {
        // Data < 12 months -> Forecast using Seasonal Sampling
        const sim = simulateUsageForRecommend({
          mode: "INTERVAL",
          intervals: normalized,
        });
        usageSeries = sim.usageSeries;
        extrapolationFactor = sim.extrapolationFactor;
      } else {
        // Data >= 12 months -> Use Real Data (Billing Grade)
        usageSeries = normalized;
        extrapolationFactor = 1; // No scaling needed
      }
    }

    //  PRICE EACH PLAN (PARALLEL EXECUTION)
    const results = await Promise.all(
      plans.map(async (p: any) => {
        const detailRes = await fetchPlanDetail(retailer, p.planId);
        const plan = mapCdrPlanToCanonical(detailRes.data);

        // A. Calculate Raw Energy Costs (Sampled or Full)
        const supply = calculateSupplyCharge({ plan, usageSeries });
        const usageCost = calculateUsageCharge({ plan, usageSeries });
        const solar = calculateSolarFit({ plan, usageSeries });

        const controlledLoadUsage =
          calculateControlledLoadUsageCharge({ plan, usageSeries });

        const controlledLoadSupply =
          calculateControlledLoadSupplyCharge({ plan, usageSeries });

        const demand = calculateDemandCharge({ plan, usageSeries });

        const baseSample = aggregateCostResults({
          supply,
          usage: usageCost,
          solar,
          controlledLoadUsage,
          controlledLoadSupply,
          demand,
        });

       
        const annualBaseTotal = baseSample.annualBaseTotal * extrapolationFactor;

        const fees = calculateFees({
          plan,
          baseTotal: annualBaseTotal,
        });

        const totals = applyDiscounts({
          plan,
          baseTotal: annualBaseTotal + fees,
        });

        return {
          planId: p.planId,
          displayName: p.displayName,
          annualCost: totals.bestCaseTotal, // Correct Annual Cost
          pricing: baseSample, // Keep sample for explain logic (internal)
        };
      })
    );

    //  Rank plans (Cheapest first)
    results.sort((a, b) => a.annualCost - b.annualCost);

    //  Explain (Best vs Baseline)
    if (results.length >= 2) {
      const best = results[0];
      const baseline = results[Math.floor(results.length / 2)];

      if (best.pricing && baseline.pricing) {
        best.explains = explainPlan({
          base: best.pricing,
          baseline: baseline.pricing,
        });
      }
    }

    // Return Top 3
    return {
      results: results.slice(0, 3).map((r) => ({
        planId: r.planId,
        displayName: r.displayName,
        annualCost: r.annualCost,
        explains: r.explains,
      })),
    };
  }
);

/**
 * Helper: Check if intervals cover ~12 months
 */
function hasAtLeast12Months(intervals: CanonicalUsageInterval[]): boolean {
  if (!intervals.length) return false;

  const start = new Date(intervals[0].timestamp_start);
  const end = new Date(intervals[intervals.length - 1].timestamp_end);

  const months =
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (end.getUTCMonth() - start.getUTCMonth());

  return months >= 11;
}