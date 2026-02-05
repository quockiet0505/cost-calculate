import { describe, it, expect, vi } from "vitest";
import { costHandler } from "../../services/cost/cost.handler";

// mock CDR fetch
vi.mock("../../services/cdr/cdr.http", () => ({
  fetchPlanDetail: vi.fn(async () => ({
    data: require("../fixtures/energyaustralia-tou-cl.json"),
  })),
}));

describe("Cost API – Solar FIT credit", () => {
  it("applies solar feed-in as negative cost", async () => {
    const req = {
      retailer: "energyaustralia",
      planId: "ENE976997MRE3@EME",
      usage: {
        mode: "INTERVAL",
        intervals: [
          {
            timestamp_start: "2026-01-02T00:00:00Z", // 11:00 local
            timestamp_end:   "2026-01-02T00:30:00Z",
            import_kwh: 0.3,
            export_kwh: 20,
            controlled_import_kwh: 0,
          },
        ],
      },
    };

    const res = await costHandler(req as any);

    expect(res.baseTotal).toBeGreaterThan(0); // supply dominates
    expect(res.monthlyBreakdown["2026-01"].solar).toBeLessThan(0);
     expect(res.monthlyBreakdown["2026-01"].supply).toBeGreaterThan(0);
     
    expect(res.monthlyBreakdown["2026-01"].solar).toBeLessThan(0);
    expect(res.monthlyBreakdown["2026-01"].total).not.toBeNaN();
  });
});
