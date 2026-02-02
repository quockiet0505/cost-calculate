import { UsageInterval } from "./usage.model";

const SEASONAL: Record<number, number> = {
     1: 1.1, 2: 1.1, 3: 1.0,
     4: 0.95, 5: 0.95, 6: 1.0,
     7: 1.05, 8: 1.05, 9: 1.0,
     10: 0.95, 11: 1.0, 12: 1.1
   };
   

export function simulateUsage12Months(input: any) {
  if (input.mode === "INTERVAL") return repeat(input.intervals);
  if (input.mode === "AVERAGE") {
    return buildFromAverage(
      input.averageMonthlyKwh,
      input.averageMonthlyControlledKwh || 0
    );
  }
  throw new Error("Unsupported usage mode");
}

function repeat(intervals: UsageInterval[]) {
  const out: UsageInterval[] = [];

  for (let m = 0; m < 12; m++) {
    for (const src of intervals) {
      const i = new UsageInterval();
      const s = new Date(src.timestamp_start);
      const e = new Date(src.timestamp_end);
      s.setUTCMonth(s.getUTCMonth() + m);
      e.setUTCMonth(e.getUTCMonth() + m);

      i.timestamp_start = s.toISOString();
      i.timestamp_end = e.toISOString();
      i.import_kwh = src.import_kwh;
      i.export_kwh = src.export_kwh;
      i.controlled_import_kwh = src.controlled_import_kwh;
      i.quality_flags = ["repeated"];

      out.push(i);
    }
  }

  return { usageSeries: out };
}

function buildFromAverage(avg: number, avgCL: number) {
  const usageSeries: UsageInterval[] = [];
  const base = new Date("2026-01-01T00:00:00Z");

  for (let m = 0; m < 12; m++) {
    const d = new Date(base);
    d.setUTCMonth(d.getUTCMonth() + m);

    const month = d.getUTCMonth() + 1;
    const days = new Date(d.getUTCFullYear(), month, 0).getDate();
    const factor = SEASONAL[month] || 1;

    const perInterval = (avg * factor) / (days * 48);
    const perIntervalCL = (avgCL * factor) / (days * 48);

    for (let day = 1; day <= days; day++) {
      for (let i = 0; i < 48; i++) {
        const u = new UsageInterval();
        const s = new Date(Date.UTC(
          d.getUTCFullYear(),
          d.getUTCMonth(),
          day,
          Math.floor(i / 2),
          (i % 2) * 30
        ));
        const e = new Date(s);
        e.setUTCMinutes(e.getUTCMinutes() + 30);

        u.timestamp_start = s.toISOString();
        u.timestamp_end = e.toISOString();
        u.import_kwh = perInterval;
        u.controlled_import_kwh = perIntervalCL;
        u.export_kwh = 0;
        u.quality_flags = ["synthetic"];

        usageSeries.push(u);
      }
    }
  }

  return { usageSeries };
}
