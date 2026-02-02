import { resolveTariffPeriod } from "./resolve-tariff-period";

export function calculateSolarFit({ plan, usageSeries }: any) {
  let total = 0;
  const monthly: Record<string, number> = {};

  for (const i of usageSeries) {
    if (i.export_kwh <= 0) continue;
    const tp = resolveTariffPeriod(plan.tariffPeriods, i.timestamp_start);
    const rate = tp.solarFIT?.[0]?.singleTariff?.rates?.[0]?.unitPrice;
    if (rate == null) continue;

    const credit = i.export_kwh * Number(rate);
    const m = i.timestamp_start.slice(0, 7);
    total -= credit;
    monthly[m] = (monthly[m] || 0) - credit;
  }

  return { total, monthly };
}
