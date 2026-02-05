import { TariffPeriod } from "../plan/tariff-period";


//  Resolve applicable tariff period for a LOCAL date
//  - Supports ISO date (YYYY-MM-DD)
//  - Supports seasonal MM-DD (recurring yearly)

export function resolveTariffPeriod(
  periods: TariffPeriod[],
  localDate: string // YYYY-MM-DD
): TariffPeriod {
  if (!periods?.length) {
    throw new Error("No tariff periods defined");
  }

  const mmdd = localDate.slice(5); // MM-DD

  const matches = periods.filter(p => {
    if (!p.startDate || !p.endDate) return true;

    // absolute ISO range
    if (p.startDate.length === 10) {
      return localDate >= p.startDate && localDate <= p.endDate;
    }

    // seasonal MM-DD range
    const start = p.startDate;
    const end = p.endDate;

    // normal season (e.g. 01-01 → 06-30)
    if (start <= end) {
      return mmdd >= start && mmdd <= end;
    }

    // wrapped season (e.g. 07-01 → 06-30)
    return mmdd >= start || mmdd <= end;
  });

  // deterministic fallback (guide-approved)
  return matches.length ? matches[0] : periods[0];
}
