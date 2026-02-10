import { CanonicalUsageInterval } from "../usage/model/canonical-usage";
import { resolveTariffPeriod } from "../pricing/resolve-tariff-period";
import { TariffPeriod } from "../plan/tariff-period";

type TouType = "PEAK" | "OFF_PEAK" | "SHOULDER" | "UNKNOWN";

export function shiftPeakToOffPeak(
  usage: CanonicalUsageInterval[],
  plan: { tariffPeriods: TariffPeriod[] },
  ratio: number
) {
  if (ratio <= 0) return { shifted: usage };

  // Identify PEAK intervals
  const peakIntervals = usage.filter(i =>
    getTouType(i, plan) === "PEAK"
  );

  const peakTotal = peakIntervals.reduce(
    (sum, i) => sum + i.import_kwh,
    0
  );

  if (peakTotal === 0) {
    return { shifted: usage };
  }

  const shiftKwh = peakTotal * ratio;
  const perPeakReduction = shiftKwh / peakIntervals.length;

  //  Apply shift
  const shifted = usage.map(i => {
    const tou = getTouType(i, plan);

    if (tou === "PEAK") {
      return {
        ...i,
        import_kwh: Math.max(0, i.import_kwh - perPeakReduction),
      };
    }

    if (tou === "OFF_PEAK") {
      return {
        ...i,
        import_kwh: i.import_kwh + shiftKwh / usage.length,
      };
    }

    return i;
  });

  return { shifted };
}

// Helper
function getTouType(
  interval: CanonicalUsageInterval,
  plan: { tariffPeriods: TariffPeriod[] }
): TouType {

  if (!interval.localDate || !interval.startTime || !interval.weekday) {
    return "UNKNOWN";
  }

  const startMinute = toMinutes(interval.startTime);
  if (startMinute === null) return "UNKNOWN";

  const period = resolveTariffPeriod(
    plan.tariffPeriods,
    interval.localDate
  );

  const touWindow = period.tou?.find((w: any) =>
    w.weekdays.includes(interval.weekday!) &&
    isWithinWindow(startMinute, w.start, w.end)
  );

  return touWindow?.type ?? "UNKNOWN";
}

// Utils
function toMinutes(hhmm: string): number | null {
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function isWithinWindow(
  time: number,
  start: number,
  end: number
): boolean {
  // normal window (e.g. 07:00–22:00)
  if (start < end) {
    return time >= start && time < end;
  }

  // wrap-around window (e.g. 23:00–07:00)
  return time >= start || time < end;
}
