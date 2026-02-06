import { resolveTariffPeriod } from "./resolve-tariff-period";

function intervalHours(i: any) {
  const s = new Date(i.timestamp_start).getTime();
  const e = new Date(i.timestamp_end).getTime();
  return (e - s) / 36e5;
}

export function calculateDemandCharge({
  plan,
  usageSeries,
}: any) {
  let total = 0;
  const monthly: Record<string, number> = {};

  // tracker:
  // key = tariffPeriod|ruleId|measurementKey
  const peakTracker: Record<
    string,
    {
      kw: number;
      dc: any;
      monthKey: string;
    }
  > = {};

  // STEP 1: scan intervals
  for (const i of usageSeries) {
    if (i.import_kwh <= 0) continue;
    if (!i.localDate || !i.localMonth || !i.weekday || !i.startTime) continue;

    const tp = resolveTariffPeriod(
      plan.tariffPeriods,
      i.localDate
    );

    for (const dc of tp.demandCharges || []) {

      // time window check
      if (dc.timeWindows?.length) {
        const inWindow = dc.timeWindows.some(w => {
          if (!w.days.includes(i.weekday)) return false;

          const t = i.startTime;
          return w.startTime <= w.endTime
            ? t >= w.startTime && t < w.endTime
            : t >= w.startTime || t < w.endTime;
        });

        if (!inWindow) continue;
      }

      // kW
      const kw = i.import_kwh / intervalHours(i);

      // measurement grouping
      const measurementKey =
        dc.measurementPeriod === "DAY"
          ? i.localDate
          : i.localMonth;

      const ruleId =
        JSON.stringify(dc.timeWindows) + dc.unitPrice;

      const tariffKey =
        `${tp.startDate ?? "ALL"}-${tp.endDate ?? "ALL"}`;

      const trackerKey =
        `${tariffKey}|${ruleId}|${measurementKey}`;

      if (!peakTracker[trackerKey]) {
        peakTracker[trackerKey] = {
          kw: 0,
          dc,
          monthKey: i.localMonth,
        };
      }

      peakTracker[trackerKey].kw = Math.max(
        peakTracker[trackerKey].kw,
        kw
      );
    }
  }

  // STEP 2: apply bounds + bill (chargePeriod = MONTH)
  for (const key in peakTracker) {
    const { kw, dc, monthKey } = peakTracker[key];

    let billableKw = kw;

    if (dc.minDemand != null) {
      billableKw = Math.max(billableKw, dc.minDemand);
    }
    if (dc.maxDemand != null) {
      billableKw = Math.min(billableKw, dc.maxDemand);
    }

    const cost = billableKw * dc.unitPrice;

    total += cost;
    monthly[monthKey] = (monthly[monthKey] || 0) + cost;
  }

  return {
    total,
    monthly,
  };
}
