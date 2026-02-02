import { resolveTariffPeriod } from "./resolve-tariff-period";

export function calculateSupplyCharge({ plan, usageSeries }: any) {
  const days = new Set<string>();
  let total = 0;
  const monthly: Record<string, number> = {};

  for (const i of usageSeries) {
    const day = i.timestamp_start.slice(0, 10);
    if (days.has(day)) continue;
    days.add(day);

    const tp = resolveTariffPeriod(plan.tariffPeriods, i.timestamp_start);
    const daily = Number(tp.supplyCharge?.amount || 0);
    const m = day.slice(0, 7);

    total += daily;
    monthly[m] = (monthly[m] || 0) + daily;
  }

  return { total, monthly };
}
