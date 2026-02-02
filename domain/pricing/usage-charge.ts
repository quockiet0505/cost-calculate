
import { resolveTariffPeriod } from "./resolve-tariff-period";

export function calculateSingleRateUsageCharge({ plan, usageSeries }: any) {
  let total = 0;
  const monthly: Record<string, number> = {};

  for (const i of usageSeries) {
    if (i.import_kwh <= 0) continue;
    const tp = resolveTariffPeriod(plan.tariffPeriods, i.timestamp_start);
    const rate = tp.usageCharge?.rates?.[0]?.unitPrice;
    if (rate == null) continue;

    const cost = i.import_kwh * Number(rate);
    const m = i.timestamp_start.slice(0, 7);
    total += cost;
    monthly[m] = (monthly[m] || 0) + cost;
  }

  return { total, monthly };
}
