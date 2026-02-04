import { resolveTariffPeriod } from "./resolve-tariff-period";

// calculate interval hours
function intervalHours(i: any) {
  const s = new Date(i.timestamp_start).getTime();
  const e = new Date(i.timestamp_end).getTime();
  return (e - s) / 36e5;
}

// calculate demand charge
export function calculateDemandCharge({
  plan,
  usageSeries,
}: any) {
  const monthlyPeak: Record<string, number> = {};
  const monthly: Record<string, number> = {};
  let total = 0;

// iterate usage series
  for (const i of usageSeries) {
    if (i.import_kwh <= 0) continue;

    // find tariff period
    const tp = resolveTariffPeriod(plan.tariffPeriods, i.timestamp_start);
    for (const dc of tp.demandCharges || []) {
      if (dc.measurementPeriod !== "MONTH") continue;

      // calculate kW
      const kw = i.import_kwh / intervalHours(i);
      const m = i.timestamp_start.slice(0, 7);

      // track monthly peak
      monthlyPeak[m] = Math.max(monthlyPeak[m] || 0, kw);
    }
  }

  // calculate costs
  for (const m of Object.keys(monthlyPeak)) {
    const tp = plan.tariffPeriods[0]; // safe v1
    const dc = tp.demandCharges?.[0];
    if (!dc) continue;

    // apply min/max demand limits
    let peak = monthlyPeak[m];
    if (dc.minDemand != null) peak = Math.max(peak, dc.minDemand);
    if (dc.maxDemand != null) peak = Math.min(peak, dc.maxDemand);

    // calculate cost for month
    const cost = peak * dc.unitPrice;
    monthly[m] = cost;
    total += cost;
  }

  return { total, monthly };
}
