import { TariffPeriod } from "../plan/tariff-period";

export function resolveTariffPeriod(
  periods: TariffPeriod[],
  // dateInput: string
  localDate: string // YYYY-MM-DD 
): TariffPeriod {
  if (!periods?.length) {
    throw new Error("No tariff periods defined");
  }

  if (!localDate) {
    throw new Error("resolveTariffPeriod: localDate is undefined");
  }
  
  //const localDate = dateInput.substring(0, 10); // YYYY-MM-DD
  const mmdd = localDate.slice(5);              // MM-DD

  let bestAbsolute: TariffPeriod | undefined;
  let bestSeasonal: TariffPeriod | undefined;
  let openEnded: TariffPeriod | undefined;

  for (const p of periods) {
    if (isAbsolute(p)) {
      if (localDate >= p.startDate! && localDate <= p.endDate!) {
        if (!bestAbsolute || p.startDate! > bestAbsolute.startDate!) {
          bestAbsolute = p;
        }
      }
      continue;
    }

    if (isSeasonal(p)) {
      const start = p.startDate!;
      const end = p.endDate!;

      const match =
        start <= end
          ? mmdd >= start && mmdd <= end
          : mmdd >= start || mmdd <= end;

      if (match && !bestSeasonal) {
        bestSeasonal = p;
      }
      continue;
    }

    if (!p.startDate && !p.endDate && !openEnded) {
      openEnded = p;
    }
  }

  if (bestAbsolute) return bestAbsolute;
  if (bestSeasonal) return bestSeasonal;
  if (openEnded) return openEnded;

  // safety net: periods already sorted, so last one is least specific
  return periods[periods.length - 1];
}


// Helpers
function isAbsolute(p: TariffPeriod): boolean {
  return !!(p.startDate && p.endDate && p.startDate.length >= 10);
}

function isSeasonal(p: TariffPeriod): boolean {
  return !!(p.startDate && p.endDate && p.startDate.length === 5);
}