import { resolveTariffPeriod } from "./resolve-tariff-period";
import { allocateTieredUsage } from "./core/allocate-tiered-usage";
import { findMatchingTouRate } from "../../utils/tou-utils";

export function calculateControlledLoadUsageCharge({
  plan,
  usageSeries,
}: any) {
  let total = 0;
  const monthly: Record<string, number> = {};

  for (const i of usageSeries) {
    if ((i.controlled_import_kwh || 0) <= 0) continue;

    const tp = resolveTariffPeriod(plan.tariffPeriods, i.timestamp_start);
    const cl = tp.controlledLoad;
    if (!cl?.usageCharge) continue;

    let cost = 0;

    if (cl.usageCharge.rateBlockUType === "SINGLE_RATE") {
      const rates = cl.usageCharge.rates || [];
      cost = allocateTieredUsage(i.controlled_import_kwh, rates);
    }

    if (cl.usageCharge.rateBlockUType === "TIME_OF_USE") {
      const r = findMatchingTouRate(
        cl.usageCharge.timeOfUseRates || [],
        new Date(i.timestamp_start)
      );
      if (r?.rates) {
        cost = allocateTieredUsage(i.controlled_import_kwh, r.rates);
      }
    }

    const m = i.timestamp_start.slice(0, 7);
    total += cost;
    monthly[m] = (monthly[m] || 0) + cost;
  }

  return { total, monthly };
}
