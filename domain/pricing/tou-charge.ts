import { resolveTariffPeriod } from "./resolve-tariff-period";
import { findMatchingTouRate } from "../../utils/tou-utils";
import { allocateTieredUsageWithPeriod } from "./core/allocate-tiered-usage";
import { TierAccumulator } from "./core/tier-accumulator";
import { getLocalParts } from "../../utils/time";

// calculate time-of-use usage charge
export function calculateTouUsageCharge({
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
    const tp = resolveTariffPeriod(
      plan.tariffPeriods,
      i.localDate!
    );

    let timeZone = tp.timeZone || "Australia/Sydney";

    // get TOU rates
    const touRates = tp.usageCharge?.timeOfUseRates || [];
    if (!touRates.length) continue;

    // find matching TOU rate
    // 2. match TOU bằng canonical fields
    const rate = findMatchingTouRate(
      touRates,
      {
        weekday: i.weekday!,
        time: i.startTime!,
      }
    );
    
    if (!rate?.rates?.length) continue;

    const tariffKey = `TOU|${tp.startDate ?? "ALL"}-${tp.endDate ?? "ALL"}|${rate.type}`;

    // allocate usage
    const cost = allocateTieredUsageWithPeriod({
      kwh: i.import_kwh,
      tiers: rate.rates,
      timestamp: i.timestamp_start,
      timeZone,
      tariffKey,
      accumulator,
    });
    const { monthKey } = getLocalParts(new Date(i.timestamp_start), timeZone);

    total += cost;
    monthly[monthKey] = (monthly[monthKey] || 0) + cost;
  }

  return { total, monthly };
}
