import { resolveTariffPeriod } from "./resolve-tariff-period";
import { allocateTieredUsage } from "./core/allocate-tiered-usage";
import { findMatchingTouRate } from "../../utils/tou-utils";

// calculate controlled load usage charge
export function calculateControlledLoadUsageCharge({
  plan,
  usageSeries,
}: any) {
  let total = 0;
  const monthly: Record<string, number> = {};

  // iterate usage series
  for (const i of usageSeries) {
    if ((i.controlled_import_kwh || 0) <= 0) continue;

    // find tariff period
    const tp = resolveTariffPeriod(plan.tariffPeriods, i.timestamp_start);

    // get controlled load pricing
    const cl = tp.controlledLoad;
    if (!cl?.usageCharge) continue;

    let cost = 0;

    // single rate
    if (cl.usageCharge.rateBlockUType === "SINGLE_RATE") {
      const rates = cl.usageCharge.rates || [];
      // allocate usage
      cost = allocateTieredUsage(i.controlled_import_kwh, rates);
    }

    // time of use
    if (cl.usageCharge.rateBlockUType === "TIME_OF_USE") {
      // find matching TOU rate
      const r = findMatchingTouRate(
        cl.usageCharge.timeOfUseRates || [],
        new Date(i.timestamp_start)
      );
      if (r?.rates) {
        // allocate usage
        cost = allocateTieredUsage(i.controlled_import_kwh, r.rates);
      }
    }

    // accumulate totals
    const m = i.timestamp_start.slice(0, 7);
    total += cost;
    monthly[m] = (monthly[m] || 0) + cost;
  }

  return { total, monthly };
}
