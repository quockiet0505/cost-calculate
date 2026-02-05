
import { getLocalParts } from "../../utils/time";
import { resolveTariffPeriod } from "./resolve-tariff-period";

// calculate supply charge (daily)
export function calculateSupplyCharge({ plan, usageSeries }: any) {
  const chargedDays = new Set<string>();
  const monthly: Record<string, number> = {};
  let total = 0;

  for (const i of usageSeries) {
    const tp = resolveTariffPeriod(plan.tariffPeriods, i.timestamp_start);
    const timeZone = tp.timeZone || "Australia/Sydney";

    const { dateKey, monthKey } = getLocalParts(
      new Date(i.timestamp_start),
      timeZone
    );

    if (chargedDays.has(dateKey)) continue;
    chargedDays.add(dateKey);

    const daily = tp.supplyCharge?.dailyAmount ?? 0;

    total += daily;
    monthly[monthKey] = (monthly[monthKey] || 0) + daily;
  }

  return { total, monthly };
}
