import { CanonicalUsageInterval } from "../canonical-usage";

export function fillMissingIntervals(
  intervals: CanonicalUsageInterval[],
  intervalMinutes: number
): CanonicalUsageInterval[] {

  if (intervals.length === 0) return [];

  const result: CanonicalUsageInterval[] = [];
  const stepMs = intervalMinutes * 60 * 1000;

  for (let i = 0; i < intervals.length - 1; i++) {
    const curr = intervals[i];
    const next = intervals[i + 1];

    result.push(curr);

    const currEnd = new Date(curr.timestamp_end).getTime();
    const nextStart = new Date(next.timestamp_start).getTime();

    let gapMs = nextStart - currEnd;
    let missing = Math.round(gapMs / stepMs);

    if (missing <= 0) continue;

    // cap to avoid explosion
    missing = Math.min(missing, 96);

    for (let k = 0; k < missing; k++) {
      const start = new Date(currEnd + k * stepMs);
      const end = new Date(start.getTime() + stepMs);

      result.push({
        timestamp_start: start.toISOString(),
        timestamp_end: end.toISOString(),

        // v1 strategy: carry-forward
        import_kwh: curr.import_kwh,
        export_kwh: curr.export_kwh,
        controlled_import_kwh: curr.controlled_import_kwh,

        // quality flag (add field)
        quality: {
          estimated: false,
          source: "INPUT",
        },
      });
    }
  }

  result.push(intervals[intervals.length - 1]);
  return result;
}
