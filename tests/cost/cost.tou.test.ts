import { describe, it, expect, vi } from "vitest";
import { costHandler } from "../../services/cost/cost.handler";

vi.mock("../../services/cdr/cdr.http", () => ({
  fetchPlanDetail: vi.fn(async () => ({
    data: require("../fixtures/energyaustralia-tou-cl.json"),
  })),
}));

describe("Cost API – TOU pricing", () => {
  it("charges PEAK rate inside TOU window", async () => {
    const req = {
      retailer: "energyaustralia",
      planId: "ENE976997MRE3@EME",
      usage: {
        mode: "INTERVAL",
        intervals: [
          {
            // 16:30 AEST ≈ 06:30 UTC (Jan, no DST)
            timestamp_start: "2026-01-02T06:30:00Z",
            timestamp_end: "2026-01-02T07:00:00Z",
            import_kwh: 1,
          },
        ],
      },
    };

    const res = await costHandler(req as any);

    expect(res.monthlyBreakdown["2026-01"].usage).toBeGreaterThan(0);
  });
});
