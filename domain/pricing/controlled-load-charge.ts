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

    const tp = resolveTariffPeriod(plan.tariffPeriods, i.localDate);
    // check
    
    // console.log("[CL DEBUG] TariffPeriod", {
    //   localDate: i.localDate,
    //   hasControlledLoad: !!tp.controlledLoad,
    //   controlledLoad: tp.controlledLoad,
    // });

    const planTimeZone = plan.timeZone || "Australia/Sydney";
    const cl = tp.controlledLoad;

    if (!cl?.usageCharge) continue;

    // get month key from timestamp
    const monthKey = i.localMonth; // "YYYY-MM"

    let rates = [];
    let type = "SINGLE";

    // extract rates based on rate block
    if (cl.usageCharge.rateBlockUType === "SINGLE_RATE") {
      rates = cl.usageCharge.rates || [];
    } else if (cl.usageCharge.rateBlockUType === "TIME_OF_USE") {

      // find rate matching timestamp
      const r = findMatchingTouRate(
        cl.usageCharge.timeOfUseRates || [],
        { 
          weekday: i.weekday, 
          time: i.startTime 
        }
      );
      if (r?.rates) {
        rates = r.rates;
        type = r.type; // PEAK/OFF_PEAK
      }
    }

    if (!rates.length) continue;

    // create unique tariff key
    const tariffKey = `CL|${tp.startDate}-${tp.endDate}|${type}`;

    // console.log("[CL COST INPUT]", {
    //   kwh: i.controlled_import_kwh,
    //   rates,
    //   rateCount: rates.length,
    //   tariffKey,
    // });
    

    // call allocation function
    const cost = allocateTieredUsageWithPeriod({
      kwh: i.controlled_import_kwh,
      tiers: rates,
      timestamp: i.timestamp_start,
      timeZone:planTimeZone,
      tariffKey,     
      accumulator,   
    });

    total += cost;
    monthly[monthKey] = (monthly[monthKey] || 0) + cost;
  }

  return { total, monthly };
}