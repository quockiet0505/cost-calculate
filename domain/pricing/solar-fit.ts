import { resolveTariffPeriod } from "./resolve-tariff-period";
import { findMatchingTouRate } from "../../utils/tou-utils";
import { allocateTieredUsageWithPeriod } from "./core/allocate-tiered-usage";
import { TierAccumulator } from "./core/tier-accumulator";
import { getLocalParts } from "../../utils/time";

export function calculateSolarFit({ plan, usageSeries }: any) {
  let total = 0;
  const monthly: Record<string, number> = {};

  // accumulator per FIT
  const accumulators = new Map<string, TierAccumulator>();

  for (const i of usageSeries) {
    if (i.export_kwh <= 0) continue;

    const tp = resolveTariffPeriod(plan.tariffPeriods, i.localDate!);
    const timeZone = tp.timeZone || "Australia/Sydney";
    const { monthKey } = getLocalParts(
      new Date(i.timestamp_start),
      timeZone
    );

    // filter applicable FITs (v1: RETAILER only)
    const fits = (plan.solarFIT || []).filter( (f: any) =>
      (f.payerType ?? "RETAILER") === "RETAILER"
    );

    for (const fit of fits) {
      let rates = [];
      let type = "SINGLE";

      if (fit.rateBlockUType === "SINGLE_RATE" && fit.rates) {
        rates = fit.rates;
      }

      if (fit.rateBlockUType === "TIME_OF_USE" && fit.timeOfUseRates) {
        const r = findMatchingTouRate(
          fit.timeOfUseRates,
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

      const accKey = `SOLAR|${fit.displayName ?? "FIT"}|${type}`;
      if (!accumulators.has(accKey)) {
        accumulators.set(accKey, new TierAccumulator());
      }

      const credit = allocateTieredUsageWithPeriod({
        kwh: i.export_kwh,
        tiers: rates,
        timestamp: i.timestamp_start,
        timeZone,
        tariffKey: accKey,
        accumulator: accumulators.get(accKey)!,
      });

      total += credit;
      monthly[monthKey] = (monthly[monthKey] || 0) + credit;
    }
  }

  return { total, monthly };
}
