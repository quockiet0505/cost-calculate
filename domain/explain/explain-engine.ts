import { ExplainItem } from "./explain.types";
import { EXPLAIN_RULES } from "./explain.rules";
import { explainAssumptions } from "./explain-assumptions";
import { ModelAssumptions } from "../usage/model/assumptions.types";


export function explainPlan({
  base,
  baseline,
  assumptions,
}: {
  base: any;
  baseline: any;
  assumptions?: ModelAssumptions;
}): ExplainItem[] {

  const explains: ExplainItem[] = [];

  const b = baseline.componentTotals;
  const c = base.componentTotals;

  // v1 – Cost-based explain

  // Supply
  const supplyDiff = b.supply - c.supply;
  if (supplyDiff > EXPLAIN_RULES.SUPPLY_THRESHOLD) {
    explains.push({
      reason: "LOW_SUPPLY",
      impact: supplyDiff,
      message: "Lower daily supply charge",
    });
  }

  // Usage
  const usageDiff = b.usage - c.usage;
  if (usageDiff > EXPLAIN_RULES.USAGE_THRESHOLD) {
    explains.push({
      reason: "LOW_USAGE",
      impact: usageDiff,
      message: "Lower usage rates for your consumption",
    });
  }

  // Solar FIT
  const solarDiff = c.solar - b.solar;
  if (solarDiff > EXPLAIN_RULES.SOLAR_THRESHOLD) {
    explains.push({
      reason: "HIGH_SOLAR_FIT",
      impact: solarDiff,
      message: "Higher solar feed-in credits",
    });
  }

  // Demand
  const demandDiff = b.demand - c.demand;
  if (demandDiff > EXPLAIN_RULES.DEMAND_THRESHOLD) {
    explains.push({
      reason: "LOW_DEMAND",
      impact: demandDiff,
      message: "Lower demand charges based on your usage pattern",
    });
  }

  // v2 – Assumption-based explain
  if (assumptions) {
    explains.push(...explainAssumptions(assumptions));
  }  

  // Sort & cap
  return explains
    .sort((a, b) => b.impact - a.impact)
    .slice(0, EXPLAIN_RULES.MAX_ITEMS);
}
