// domain/pricing/controlled-load-charge.ts
import { resolveTariffPeriod } from "./resolve-tariff-period";

export function calculateControlledLoadCharge({
  plan,
  usageSeries,
}: {
  plan: any;
  usageSeries: any[];
}) {
  let total = 0;
  const monthly: Record<string, number> = {};

  if (!plan.controlledLoad) {
    return { total: 0, monthly: {} };
  }

  for (const i of usageSeries) {
    const kwh = i.controlled_import_kwh || 0;
    if (kwh <= 0) continue;

    const tp = resolveTariffPeriod(plan.tariffPeriods, i.timestamp_start);
    const cl = tp.controlledLoad || plan.controlledLoad;

    const rate = cl?.usageCharge?.rates?.[0]?.unitPrice;
    if (rate == null) continue;

    const cost = kwh * Number(rate);
    const month = i.timestamp_start.substring(0, 7);

    total += cost;
    monthly[month] = (monthly[month] || 0) + cost;
  }

  return { total, monthly };
}
