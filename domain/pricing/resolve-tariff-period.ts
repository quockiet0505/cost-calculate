import { TariffPeriod } from "../plan/tariff-period";

export function resolveTariffPeriod(
  periods: TariffPeriod[],
  localDate: string // YYYY-MM-DD
): TariffPeriod {

  if (!periods?.length) {
    throw new Error("No tariff periods defined");
  }

  const mmdd = localDate.slice(5); // MM-DD

  // Absolute date periods (highest priority)
  const absoluteMatches = periods.filter(p =>
    isAbsolute(p) &&
    localDate >= p.startDate! &&
    localDate <= p.endDate!
  );

  if (absoluteMatches.length === 1) {
    return absoluteMatches[0];
  }
  if (absoluteMatches.length > 1) {
    throw new Error("Multiple absolute tariff periods match date " + localDate);
  }

  //  Seasonal MM-DD periods
  const seasonalMatches = periods.filter(p => {
    if (!isSeasonal(p)) return false;

    const start = p.startDate!;
    const end = p.endDate!;

    if (start <= end) {
      return mmdd >= start && mmdd <= end;
    }
    // wrapped season (e.g. 07-01 → 06-30)
    return mmdd >= start || mmdd <= end;
  });

  if (seasonalMatches.length === 1) {
    return seasonalMatches[0];
  }
  if (seasonalMatches.length > 1) {
    throw new Error("Multiple seasonal tariff periods match date " + localDate);
  }

  // Open-ended fallback
  const openEnded = periods.filter(
    p => !p.startDate && !p.endDate
  );

  if (openEnded.length === 1) {
    return openEnded[0];
  }

  // Final fallback (explicit)
  throw new Error(
    "No matching tariff period for date " + localDate
  );
}


// function helper 
// MM/DD/YYY
function isAbsolute(p: TariffPeriod): boolean {
  return !!(p.startDate && p.endDate && p.startDate.length === 10);
}

// MM-DD
function isSeasonal(p: TariffPeriod): boolean {
  return !!(p.startDate && p.endDate && p.startDate.length === 5);
}
