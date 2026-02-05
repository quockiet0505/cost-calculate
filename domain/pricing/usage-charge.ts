import { resolveTariffPeriod } from "./resolve-tariff-period";
import { allocateTieredUsageWithPeriod } from "./core/allocate-tiered-usage";
import { TierAccumulator } from "./core/tier-accumulator";
import { getLocalParts } from "../../utils/time";
// calculate single rate usage charge
export function calculateSingleRateUsageCharge({
  plan,
  usageSeries,
}: any) {
  let total = 0;
  const monthly: Record<string, number> = {};
  
  let accumulator = new TierAccumulator();
  // iterate usage series
  for (const i of usageSeries) {
    if (i.import_kwh <= 0) continue;
    // find tariff period
    const tp = resolveTariffPeriod(plan.tariffPeriods, i.timestamp_start);
    const usageCharge = tp.usageCharge;
    if (!usageCharge?.rates?.length) continue;
    
    let timeZone = tp.timeZone || "Australia/Sydney";

    // unique key per tariff period + rate group
    const tariffKey = `IMPORT|${tp.startDate ?? "ALL"}-${tp.endDate ?? "ALL"}`;
    
    const tiers = tp.usageCharge?.rates;
    if (!tiers?.length) continue;

    // allocate usage
    const cost = allocateTieredUsageWithPeriod({
      kwh: i.import_kwh,
      tiers,
      timestamp: i.timestamp_start,
      timeZone,
      tariffKey,
      accumulator,
    })

    const { monthKey } = getLocalParts(new Date(i.timestamp_start), timeZone);
    
    total += cost;
    monthly[monthKey] = (monthly[monthKey] || 0) + cost;
  }

  return { total, monthly };
}
