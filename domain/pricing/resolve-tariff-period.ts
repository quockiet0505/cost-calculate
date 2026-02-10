import { TariffPeriod } from "../plan/tariff-period";


export function resolveTariffPeriod(
  periods: TariffPeriod[],
  localDate: string // YYYY-MM-DD
): TariffPeriod {
  if (!periods || periods.length === 0) {
    throw new Error("resolveTariffPeriod: no tariff periods defined");
  }

  if (!localDate) {
    throw new Error("resolveTariffPeriod: localDate is undefined");
  }

  const mmdd = localDate.slice(5); // MM-DD

  let bestAbsolute: TariffPeriod | undefined;
  let bestSeasonal: TariffPeriod | undefined;
  let openEnded: TariffPeriod | undefined;

  for (const p of periods) {
      // 1. Absolute date range
      if (isAbsolute(p)) {
      if (localDate >= p.startDate! && localDate <= p.endDate!) {
        // deterministic: latest startDate wins
        if (!bestAbsolute || p.startDate! > bestAbsolute.startDate!) {
          bestAbsolute = p;
        }
      }
      continue;
    }

      // 2. Seasonal (MM-DD → MM-DD)
      if (isSeasonal(p)) {
      const start = p.startDate!; // MM-DD
      const end = p.endDate!;     // MM-DD

      const match =
        start <= end
          ? mmdd >= start && mmdd <= end
          : mmdd >= start || mmdd <= end; // wrap-year

      if (match) {
        // deterministic: latest startDate wins
        if (!bestSeasonal || start > bestSeasonal.startDate!) {
          bestSeasonal = p;
        }
      }
      continue;
    }

      // 3. Open-ended fallback
      if (!p.startDate && !p.endDate && !openEnded) {
      openEnded = p;
    }
  }

  // Precedence resolution
  if (bestAbsolute) return bestAbsolute;
  if (bestSeasonal) return bestSeasonal;
  if (openEnded) return openEnded;

  // Gap = data or logic error
  throw new Error(
    `resolveTariffPeriod: no matching tariff period for localDate=${localDate}`
  );
}

// Helpers

function isAbsolute(p: TariffPeriod): boolean {
  return Boolean(
    p.startDate &&
    p.endDate &&
    p.startDate.length >= 10 && // YYYY-MM-DD
    p.endDate.length >= 10
  );
}

function isSeasonal(p: TariffPeriod): boolean {
  return Boolean(
    p.startDate &&
    p.endDate &&
    p.startDate.length === 5 && // MM-DD
    p.endDate.length === 5
  );
}
