import { resolveTariffPeriod } from "./resolve-tariff-period";
import { allocateTieredUsage } from "./core/allocate-tiered-usage";

// calculate single rate usage charge
export function calculateSingleRateUsageCharge({
  plan,
  usageSeries,
}: any) {
  let total = 0;
  const monthly: Record<string, number> = {};

  // iterate usage series
  for (const i of usageSeries) {
    if (i.import_kwh <= 0) continue;

    // find tariff period
    const tp = resolveTariffPeriod(plan.tariffPeriods, i.timestamp_start);
    const tiers = tp.usageCharge?.rates;
    if (!tiers?.length) continue;

    // allocate usage
    const cost = allocateTieredUsage(i.import_kwh, tiers);
    const m = i.timestamp_start.slice(0, 7);

    total += cost;
    monthly[m] = (monthly[m] || 0) + cost;
  }

  return { total, monthly };
}
