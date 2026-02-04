import { resolveTariffPeriod } from "./resolve-tariff-period";
import { findMatchingTouRate } from "../../utils/tou-utils";
import { allocateTieredUsage } from "./core/allocate-tiered-usage";

export function calculateSolarFit({
  plan,
  usageSeries,
}: any) {
  let total = 0;
  const monthly: Record<string, number> = {};

  for (const i of usageSeries) {
    if (i.export_kwh <= 0) continue;

    // const tp = resolveTariffPeriod(plan.tariffPeriods, i.timestamp_start);
    // const fit = tp.solarFIT?.[0];
    // if (!fit) continue;
    const fit = plan.solarFIT?.[0];
      if (!fit) continue;
      
    let credit = 0;

    if (fit.rateBlockUType === "SINGLE_RATE" && fit.rates) {
      credit = allocateTieredUsage(i.export_kwh, fit.rates);
    }

    if (fit.rateBlockUType === "TIME_OF_USE" && fit.timeOfUseRates) {
      const r = findMatchingTouRate(
        fit.timeOfUseRates,
        new Date(i.timestamp_start)
      );
      if (r?.rates) {
        credit = allocateTieredUsage(i.export_kwh, r.rates);
      }
    }

    const m = i.timestamp_start.slice(0, 7);
    total -= credit;
    monthly[m] = (monthly[m] || 0) - credit;
  }

  return { total, monthly };
}
