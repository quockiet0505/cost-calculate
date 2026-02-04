import { resolveTariffPeriod } from "./resolve-tariff-period";
import { findMatchingTouRate } from "../../utils/tou-utils";
import { allocateTieredUsage } from "./core/allocate-tiered-usage";

export function calculateTouUsageCharge({
  plan,
  usageSeries,
}: any) {
  let total = 0;
  const monthly: Record<string, number> = {};

  for (const i of usageSeries) {
    if (i.import_kwh <= 0) continue;

    const tp = resolveTariffPeriod(plan.tariffPeriods, i.timestamp_start);
    const touRates = tp.usageCharge?.timeOfUseRates || [];
    if (!touRates.length) continue;

    // const rate = findMatchingTouRate(
    //   touRates,
    //   new Date(i.timestamp_start)
    // );
    const rate = findMatchingTouRate(
      touRates,
      new Date(i.timestamp_start),
      tp.timeZone || "Australia/Sydney"
    );

    
    if (!rate?.rates?.length) continue;

    const cost = allocateTieredUsage(i.import_kwh, rate.rates);
    const m = i.timestamp_start.slice(0, 7);

    total += cost;
    monthly[m] = (monthly[m] || 0) + cost;
  }

  return { total, monthly };
}
