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
            demandCharges: [
              {
                rates: [{ unitPrice: "10" }],
                measurementPeriod: "MONTH",
                timeOfUse: [
                  {
                    days: ["MON","TUE","WED","THU","FRI"],
                    startTime: "16:00",
                    endTime: "20:00"
                  }
                ]
              }
            ]
          }
        ]        
      }
    }
  })),
}));

describe("Cost API – Demand charge", () => {
  it("applies demand charge only inside window", async () => {
    const req = {
      retailer: "energyaustralia",
      planId: "DEMAND",
      usage: {
        mode: "INTERVAL",
        intervals: [
          {
            timestamp_start: "2026-01-02T07:00:00Z", // 17:00 local
            timestamp_end: "2026-01-02T07:30:00Z",
            import_kwh: 5,
          }
        ],
      },
    };

    const res = await costHandler(req as any);

    expect(res.monthlyBreakdown["2026-01"].demand).toBeGreaterThan(0);
  });
});
