import { CanonicalPlan } from "../../domain/plan/plan.model";

import { resolvePlanTimeZone } from "../../utils/timezone";

export function mapCdrPlanToCanonical(raw: any): CanonicalPlan {
  const plan = new CanonicalPlan();
  const contract = raw?.electricityContract ?? {};

  plan.tariffPeriods = (contract.tariffPeriod ?? []).map((tp: any) => ({
  startDate: tp.startDate ?? null,
  endDate: tp.endDate ?? null,
  timeZone: resolvePlanTimeZone(contract.timeZone),

  supplyCharge: {
    type: "SINGLE",
    dailyAmount: Number(tp.dailySupplyCharge || 0),
  },

  usageCharge: {
    rateBlockUType: normalizeRateBlockUType(tp.rateBlockUType),
    rates: (tp.rates ?? []).map((r: any) => ({
      unitPrice: Number(r.unitPrice),
      volume: r.volume ? Number(r.volume) : undefined,
    })),
    timeOfUseRates: tp.timeOfUseRates ?? [],
  },

  controlledLoad: contract.controlledLoad?.[0]
    ? {
        supplyCharge: Number(
          contract.controlledLoad[0]?.singleRate?.dailySupplyCharge || 0
        ),
        usageCharge: {
          rateBlockUType: "SINGLE_RATE",
          rates:
            contract.controlledLoad[0]?.singleRate?.rates?.map((r: any) => ({
              unitPrice: Number(r.unitPrice),
            })) ?? [],
        },
      }
    : undefined,

  demandCharges: (contract.demandCharges ?? []).map((dc: any) => ({
    unitPrice: Number(dc?.rates?.[0]?.unitPrice || 0),
    minDemand: dc.minDemand ? Number(dc.minDemand) : undefined,
    maxDemand: dc.maxDemand ? Number(dc.maxDemand) : undefined,
    measurementPeriod: "MONTH",
    chargePeriod: "MONTH",
    timeWindows: dc.timeOfUse || [],
  })),
}));
;

  // plan.solarFIT = contract.solarFeedInTariff ?? [];
  plan.solarFIT = (contract.solarFeedInTariff ?? []).map((fit: any) => {
    // SINGLE TARIFF 
    if (fit.tariffUType === "singleTariff" && fit.singleTariff?.rates) {
      return {
        rateBlockUType: "SINGLE_RATE",
        rates: fit.singleTariff.rates.map((r: any) => ({
          unitPrice: Number(r.unitPrice),
        })),
      };
    }
  
    // TIME OF USE FIT 
    if (fit.tariffUType === "timeOfUseTariff" && fit.timeOfUseTariff?.timeOfUseRates) {
      return {
        rateBlockUType: "TIME_OF_USE",
        timeOfUseRates: fit.timeOfUseTariff.timeOfUseRates,
      };
    }
  
    return null;
  }).filter(Boolean);
  
  plan.fees =
    (contract.fees ?? []).map((f: any) => ({
      type: f.type,
      term: f.term,
      amount: f.amount != null ? Number(f.amount) : undefined,
      rate: f.rate != null ? Number(f.rate) : undefined,
    })) ?? [];

  plan.discounts = contract.discounts ?? [];

  return plan;
}

function normalizeRateBlockUType(raw: any) {
  if (raw === "timeOfUseRates") return "TIME_OF_USE";
  if (raw === "singleRate") return "SINGLE_RATE";
  if (raw === "blockRates") return "BLOCK";
  return "SINGLE_RATE";
}
