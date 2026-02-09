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
import { RecommendRequest, RecommendResponse, RecommendResult } from "./recommend.types";
import { explainPlan } from "../../domain/explain/explain-engine";

import { simulateSeasonal4W } from "../../domain/usage/usage-engine";
import { getPlan } from "../cdr/plan-repository";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const recommend4w = api(
  { method: "POST", path: "/energy/recommend-4w", expose: true },
  async (req: RecommendRequest): Promise<RecommendResponse> => {
    const { retailer, usage } = req;

    const planListResponse = await fetchPlanList(retailer);
    const plans = planListResponse.data?.plans || [];
    if (!plans.length) return { results: [] };

    //  GENERATE USAGE (4 MÙA)
    const { usageSeries, extrapolationFactor } = simulateSeasonal4W(usage);

    const results: RecommendResult[] = [];
    const BATCH_SIZE = 1; 

    for (let i = 0; i < plans.length; i += BATCH_SIZE) {
      if (i > 0) await delay(300); 

      const chunk = plans.slice(i, i + BATCH_SIZE);
      const chunkResults = await Promise.all(
        chunk.map(async (p: any) => {
          try {
          //   const detailRes = await fetchPlanDetail(retailer, p.planId);
          //   const plan = mapCdrPlanToCanonical(detailRes.data);
          const plan = await getPlan(retailer, p.planId);

            const supply = calculateSupplyCharge({ plan, usageSeries });
            const usageCost = calculateUsageCharge({ plan, usageSeries });
            const solar = calculateSolarFit({ plan, usageSeries });
            const clUsage = calculateControlledLoadUsageCharge({ plan, usageSeries });
            const clSupply = calculateControlledLoadSupplyCharge({ plan, usageSeries });
            const demand = calculateDemandCharge({ plan, usageSeries });

            const base = aggregateCostResults({
              supply, usage: usageCost, solar,
              controlledLoadUsage: clUsage, controlledLoadSupply: clSupply, demand,
            });

            // NHÂN HỆ SỐ 13.03
            const annualBase = base.annualBaseTotal * extrapolationFactor;
            const fees = calculateFees({ plan, baseTotal: annualBase });
            const totals = applyDiscounts({ plan, baseTotal: annualBase + fees });

            console.log(` OK: ${p.planId} - $${totals.bestCaseTotal.toFixed(2)}`);

            return {
              planId: p.planId,
              displayName: p.displayName,
              annualCost: totals.bestCaseTotal,
              pricing: base,
            };

            
          } catch (e) {
            console.error(`Failed plan ${p.planId} (4w)`, e);
            return null;
          }
        })
      );
      results.push(...chunkResults.filter((r): r is RecommendResult => r !== null));
    }

    results.sort((a, b) => a.annualCost - b.annualCost);

    if (results.length >= 2) {
      const best = results[0];
      const baseline = results[Math.floor(results.length / 2)];
      if (best.pricing && baseline.pricing) {
        best.explains = explainPlan({ base: best.pricing, baseline: baseline.pricing });
      }
    }

    return { results: results.slice(0, 3).map(r => ({ ...r, pricing: undefined })) };
  }
);