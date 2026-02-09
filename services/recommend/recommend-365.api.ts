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

import { simulateFullYear } from "../../domain/usage/usage-engine";
import { getPlan } from "../cdr/plan-repository";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const recommend365 = api(
  { method: "POST", path: "/energy/recommend-365", expose: true },
  async (req: RecommendRequest): Promise<RecommendResponse> => {
    const { retailer, usage } = req;

    const planListResponse = await fetchPlanList(retailer);
    const plans = planListResponse.data?.plans || [];
    if (!plans.length) return { results: [] };

    // GENERATE USAGE (365 DAYS / REAL DATA)
    const { usageSeries } = simulateFullYear(usage);

    const results: RecommendResult[] = [];
    
    console.log(`Starting 365 simulation for ${plans.length} plans...`);

    //(One by One) 
    for (const p of plans) {
      try {
        await delay(200); // Delay 200ms

        // const detailRes = await fetchPlanDetail(retailer, p.planId);
        // const plan = mapCdrPlanToCanonical(detailRes.data);
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

        // 1
        const annualBase = base.annualBaseTotal; 
        const fees = calculateFees({ plan, baseTotal: annualBase });
        const totals = applyDiscounts({ plan, baseTotal: annualBase + fees });

        results.push({
          planId: p.planId,
          displayName: p.displayName,
          annualCost: totals.bestCaseTotal,
          pricing: base,
        });
        
        console.log(` OK: ${p.planId} - $${totals.bestCaseTotal.toFixed(2)}`);

      } catch (e) {
        console.error(` Failed plan ${p.planId} (365)`, e);
      }
    }

    results.sort((a, b) => a.annualCost - b.annualCost);

    return { results: results.slice(0, 3) };
  }
);