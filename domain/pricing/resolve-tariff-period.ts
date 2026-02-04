
import { TariffPeriod } from "../plan/tariff-period";

// resolve the applicable tariff period for a given timestamp
export function resolveTariffPeriod(
  periods: TariffPeriod[],
  timestamp: string
): TariffPeriod {
  if (!periods?.length) {
    throw new Error("No tariff periods defined");
  }

  const t = new Date(timestamp);

  // find matching periods
  const matches = periods.filter(p => {

    // check date range
    const s = p.startDate ? new Date(p.startDate) : null;
    const e = p.endDate ? new Date(p.endDate) : null;

    // out of range
    if (s && t < s) return false;
    if (e && t > e) return false;
    return true;
  });

  if (!matches.length) {
    // deterministic fallback (guide-approved)
    return periods[0];
  }

  // pick most specific (latest startDate wins)
  return matches.sort(
    (a, b) =>
      new Date(b.startDate || 0).getTime() -
      new Date(a.startDate || 0).getTime()
  )[0];
}
