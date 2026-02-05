import { resolveTariffPeriod } from "./resolve-tariff-period";
import { findMatchingTouRate } from "../../utils/tou-utils";
import { allocateTieredUsageWithPeriod } from "./core/allocate-tiered-usage"; 
import { TierAccumulator } from "./core/tier-accumulator"; 
import { getLocalParts } from "../../utils/time"; 

// calculate controlled load usage charge
export function calculateControlledLoadUsageCharge({
  plan,
  usageSeries,
}: any) {
  let total = 0;
  const monthly: Record<string, number> = {};
  
  // create a single accumulator for controlled load
  const accumulator = new TierAccumulator();

  for (const i of usageSeries) {
    if ((i.controlled_import_kwh || 0) <= 0) continue;

    const tp = resolveTariffPeriod(plan.tariffPeriods, i.timestamp_start);
    const timeZone = tp.timeZone || "Australia/Sydney";
    const cl = tp.controlledLoad;

    if (!cl?.usageCharge) continue;

    // get month key from timestamp
    const { monthKey } = getLocalParts(new Date(i.timestamp_start), timeZone);

    let rates = [];
    let type = "SINGLE";

    // extract rates based on rate block
    if (cl.usageCharge.rateBlockUType === "SINGLE_RATE") {
      rates = cl.usageCharge.rates || [];
    } else if (cl.usageCharge.rateBlockUType === "TIME_OF_USE") {

      // find rate matching timestamp
      const r = findMatchingTouRate(
        cl.usageCharge.timeOfUseRates || [],
        new Date(i.timestamp_start),
        timeZone
      );
      if (r?.rates) {
        rates = r.rates;
        type = r.type; // PEAK/OFF_PEAK
      }
    }

    if (!rates.length) continue;

    // create unique tariff key
    const tariffKey = `CL|${tp.startDate}-${tp.endDate}|${type}`;

    // call allocation function
    const cost = allocateTieredUsageWithPeriod({
      kwh: i.controlled_import_kwh,
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