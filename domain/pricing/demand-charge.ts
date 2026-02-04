import { resolveTariffPeriod } from "./resolve-tariff-period";

function intervalHours(i: any) {
  const s = new Date(i.timestamp_start).getTime();
  const e = new Date(i.timestamp_end).getTime();
  return (e - s) / 36e5;
}

export function calculateDemandCharge({
  plan,
  usageSeries,
}: any) {
  const monthlyPeak: Record<string, number> = {};
  const monthly: Record<string, number> = {};
  let total = 0;

  for (const i of usageSeries) {
    if (i.import_kwh <= 0) continue;

    const tp = resolveTariffPeriod(plan.tariffPeriods, i.timestamp_start);
    for (const dc of tp.demandCharges || []) {
      if (dc.measurementPeriod !== "MONTH") continue;

      const kw = i.import_kwh / intervalHours(i);
      const m = i.timestamp_start.slice(0, 7);

      monthlyPeak[m] = Math.max(monthlyPeak[m] || 0, kw);
    }
  }

  for (const m of Object.keys(monthlyPeak)) {
    const tp = plan.tariffPeriods[0]; // safe v1
    const dc = tp.demandCharges?.[0];
    if (!dc) continue;

    let peak = monthlyPeak[m];
    if (dc.minDemand != null) peak = Math.max(peak, dc.minDemand);
    if (dc.maxDemand != null) peak = Math.min(peak, dc.maxDemand);

    const cost = peak * dc.unitPrice;
    monthly[m] = cost;
    total += cost;
  }

  return { total, monthly };
}
