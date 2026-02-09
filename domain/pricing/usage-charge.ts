import { resolveTariffPeriod } from "./resolve-tariff-period";
import { findMatchingTouRate } from "../../utils/tou-utils";
import { allocateTieredUsageWithPeriod } from "./core/allocate-tiered-usage";
import { TierAccumulator } from "./core/tier-accumulator";
import { getLocalParts } from "../../utils/time";

// Calculate usage charges based on plan and usage series
export function calculateUsageCharge({
  plan,
  usageSeries,
}: any) {
  let total = 0;
  const monthly: Record<string, number> = {};

  const accumulator = new TierAccumulator();

  for (const i of usageSeries) {
    if (i.import_kwh <= 0) continue;

    // Find the applicable tariff period for the interval
    const tp = resolveTariffPeriod(plan.tariffPeriods, i.localDate!);
    const usageCharge = tp.usageCharge;
    if (!usageCharge) continue;

    const timeZone = tp.timeZone || "Australia/Sydney";
    const { monthKey } = getLocalParts(
      new Date(i.timestamp_start),
      timeZone
    );

    let rates = [];
    let type = "SINGLE";

    // if single rate
    if (usageCharge.rateBlockUType === "SINGLE_RATE") {
      rates = usageCharge.rates || [];
    }

    // if time-of-use
    if (usageCharge.rateBlockUType === "TIME_OF_USE") {
      const r = findMatchingTouRate(
        usageCharge.timeOfUseRates || [],
        {
          weekday: i.weekday!,
          time: i.startTime!,
        }
      );
      if (!r?.rates) continue;
      rates = r.rates;
      type = r.type;
    }

    if (!rates.length) continue;

    // create a unique tariff key
    const tariffKey = `IMPORT|${tp.startDate ?? "ALL"}-${tp.endDate ?? "ALL"}|${type}`;

    const cost = allocateTieredUsageWithPeriod({
      kwh: i.import_kwh,
      tiers: rates,
      timestamp: i.timestamp_start,
      timeZone,
      tariffKey,
      accumulator,
    });

    total += cost;
    monthly[monthKey] = (monthly[monthKey] || 0) + cost;
    
  }

  return { total, monthly };
}
