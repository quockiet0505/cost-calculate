import { resolveTariffPeriod } from "./resolve-tariff-period";
import { getLocalParts } from "../../utils/time"; 

// calculate controlled load supply charge (daily)
export function calculateControlledLoadSupplyCharge({
  plan,
  usageSeries,
}: any) {
  const chargedDays = new Set<string>();
  const monthly: Record<string, number> = {};
  let total = 0;

  for (const i of usageSeries) {
    if ((i.controlled_import_kwh || 0) <= 0) continue;

    // find tariff period
    const tp = resolveTariffPeriod(plan.tariffPeriods, i.timestamp_start);
    const timeZone = tp.timeZone || "Australia/Sydney";

    // get date and month keys
    const { dateKey, monthKey } = getLocalParts(
      new Date(i.timestamp_start),
      timeZone
    );

    // skip if already charged for this day
    if (chargedDays.has(dateKey)) continue;
    chargedDays.add(dateKey);

    const daily = tp.controlledLoad?.supplyCharge ?? 0;

    // accumulate totals
    total += daily;
    monthly[monthKey] = (monthly[monthKey] || 0) + daily;
  }

  return { total, monthly };
}