import { CanonicalPlan } from "../../domain/plan/plan.model";

export function mapCdrPlanToCanonical(raw: any): CanonicalPlan {
  const plan = new CanonicalPlan();

  const contract = raw?.electricityContract ?? {};

  // ---- Tariff Periods ----
  plan.tariffPeriods = (contract.tariffPeriod ?? []).map((tp: any) => ({
    startDate: tp.startDate ?? null,
    endDate: tp.endDate ?? null,

    supplyCharge: {
      amount: Number(tp.dailySupplyCharge || 0)
    },

    usageCharge: {
      rateBlockUType: normalizeRateBlockUType(tp.rateBlockUType),
      rates: (tp.rates ?? []).map((r: any) => ({
        unitPrice: Number(r.unitPrice),
        measureUnit: r.measureUnit
      })),
      timeOfUseRates: tp.timeOfUseRates ?? []
    },

    solarFIT: contract.solarFeedInTariff ?? []
  }));

  // ---- Controlled Load (Phase 2) ----
  plan.controlledLoad = contract.controlledLoad
    ? {
        supplyCharge: Number(
          contract.controlledLoad?.[0]?.singleRate?.dailySupplyCharge || 0
        ),
        usageCharge: {
          rateBlockUType: "SINGLE_RATE",
          rates:
            contract.controlledLoad?.[0]?.singleRate?.rates?.map((r: any) => ({
              unitPrice: Number(r.unitPrice),
              measureUnit: r.measureUnit
            })) ?? []
        }
      }
    : null;

  // ---- Demand Charges (Phase 2) ----
  plan.demandCharges = (contract.demandCharges ?? []).map((dc: any) => ({
    unitPrice: Number(dc?.rates?.[0]?.unitPrice || 0),
    minDemand: dc.minDemand ? Number(dc.minDemand) : null,
    maxDemand: dc.maxDemand ? Number(dc.maxDemand) : null,
    measurementPeriod: dc.measurementPeriod || "P30M",
    chargePeriod: dc.chargePeriod || "P1M",
    timeWindows: dc.timeOfUse || []
  }));

  // ---- Fees ----
  plan.fees = (contract.fees ?? []).map((f: any) => ({
    type: f.type,
    term: f.term,
    amount: f.amount != null ? Number(f.amount) : null,
    rate: f.rate != null ? Number(f.rate) : null
  }));

  // ---- Discounts ----
  plan.discounts = contract.discounts ?? [];

  return plan;
}

// ---- Helpers ----
function normalizeRateBlockUType(raw: any): string {
  if (!raw) return "UNKNOWN";
  if (raw === "timeOfUseRates") return "TIME_OF_USE";
  if (raw === "singleRate") return "SINGLE_RATE";
  if (raw === "blockRates") return "BLOCK";
  return raw;
}
