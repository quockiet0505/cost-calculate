import { resolveTariffPeriod } from "./resolve-tariff-period";
import { findMatchingTouRate } from "../../utils/tou-utils";
import { allocateTieredUsageWithPeriod } from "./core/allocate-tiered-usage";
import { TierAccumulator } from "./core/tier-accumulator"; 
import { getLocalParts } from "../../utils/time"; 

export function calculateSolarFit({
  plan,
  usageSeries,
}: any) {
  let total = 0;
  const monthly: Record<string, number> = {};
  
  // solar fit accumulator
  const accumulator = new TierAccumulator();

  for (const i of usageSeries) {
    if (i.export_kwh <= 0) continue;

    const tp = resolveTariffPeriod(plan.tariffPeriods, i.timestamp_start);
    const timeZone = tp.timeZone || "Australia/Sydney";
    
    // get month key from local
    const { monthKey } = getLocalParts(new Date(i.timestamp_start), timeZone);

    const fit = plan.solarFIT?.[0];
    if (!fit) continue;
      
    let rates = [];
    let type = "SINGLE";

    if (fit.rateBlockUType === "SINGLE_RATE" && fit.rates) {
      rates = fit.rates;
    } else if (fit.rateBlockUType === "TIME_OF_USE" && fit.timeOfUseRates) {
      const r = findMatchingTouRate(
        fit.timeOfUseRates,
        {
          weekday: i.weekday!,
          time: i.startTime!,
        }
      );
      
      if (r?.rates) {
        rates = r.rates;
        type = r.type;
      }
    }

    if (!rates.length) continue;

    // create tariff key for accumulator
    const tariffKey = `SOLAR|${tp.startDate}-${tp.endDate}|${type}`;

    // call allocation function
    const credit = allocateTieredUsageWithPeriod({
      kwh: i.export_kwh,
      tiers: rates,
      timestamp: i.timestamp_start,
      timeZone,
      tariffKey,
      accumulator,
    });

    // totals accumulate
    total += credit;
    monthly[monthKey] = (monthly[monthKey] || 0) + credit;
  }

  return { total, monthly };
}