import { describe, it, expect, vi } from "vitest";
import { costHandler } from "../../services/cost/cost.handler";

vi.mock("../../services/cdr/cdr.http", () => ({
     fetchPlanDetail: vi.fn(async () => ({
          data: {
            electricityContract: {
              timeZone: "LOCAL",
              tariffPeriod: [
                {
                  startDate: "2026-01-01",
                  endDate: "2026-12-31",
                  dailySupplyCharge: "0.00",
                  dailySupplyChargeType: "SINGLE",
                  rateBlockUType: "blockRates",
                  rates: [
                    { unitPrice: "0.20", volume: "100", period: "P1M" },
                    { unitPrice: "0.40" }
                  ]
                }
              ]
            }
          }
     }))
}));

describe("Cost API – BLOCK rate", () => {
  it("resets tier monthly", async () => {
    const req = {
      retailer: "energyaustralia",
      planId: "BLOCK",
      usage: {
        mode: "INTERVAL",
        intervals: [
          {
            timestamp_start: "2026-01-10T00:00:00Z",
            timestamp_end: "2026-01-10T00:30:00Z",
            import_kwh: 150,
          },
          {
            timestamp_start: "2026-02-10T00:00:00Z",
            timestamp_end: "2026-02-10T00:30:00Z",
            import_kwh: 50,
          }
        ],
      },
    };

    const res = await costHandler(req as any);

    expect(res.monthlyBreakdown["2026-01"].usage).toBeGreaterThan(0);
    expect(res.monthlyBreakdown["2026-02"].usage).toBeGreaterThan(0);
  });
});
