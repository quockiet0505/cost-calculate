import { resolveTariffPeriod } from "./resolve-tariff-period";
import { findMatchingTouRate } from "../../utils/tou-utils";

export function calculateTouUsageCharge({ plan, usageSeries }: any) {
  let total = 0;
  const monthly: Record<string, number> = {};

  for (const i of usageSeries) {
    if (i.import_kwh <= 0) continue;

    const tp = resolveTariffPeriod(plan.tariffPeriods, i.timestamp_start);
    const rate = findMatchingTouRate(tp.usageCharge?.timeOfUseRates || [], new Date(i.timestamp_start));
    if (!rate) continue;

    const unit = rate.rates?.[0]?.unitPrice;
    if (unit == null) continue;

    const cost = i.import_kwh * Number(unit);
    const m = i.timestamp_start.slice(0, 7);
    total += cost;
    monthly[m] = (monthly[m] || 0) + cost;
  }

  return { total, monthly };
}
