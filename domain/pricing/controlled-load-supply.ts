import { resolveTariffPeriod } from "./resolve-tariff-period";

export function calculateControlledLoadSupplyCharge({
  plan,
  usageSeries,
}: any) {
  const chargedDays = new Set<string>();
  const monthly: Record<string, number> = {};
  let total = 0;

  for (const i of usageSeries) {
    if ((i.controlled_import_kwh || 0) <= 0) continue;

    const day = i.timestamp_start.slice(0, 10);
    if (chargedDays.has(day)) continue;
    chargedDays.add(day);

    const tp = resolveTariffPeriod(plan.tariffPeriods, i.timestamp_start);
    const daily = tp.controlledLoad?.supplyCharge ?? 0;

    const m = day.slice(0, 7);
    total += daily;
    monthly[m] = (monthly[m] || 0) + daily;
  }

  return { total, monthly };
}
