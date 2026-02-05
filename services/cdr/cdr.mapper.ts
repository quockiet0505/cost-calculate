import { CanonicalPlan } from "../../domain/plan/plan.model";
import { resolvePlanTimeZone } from "../../utils/timezone";

// map CDR plan format to canonical format
export function mapCdrPlanToCanonical(raw: any): CanonicalPlan {
  const plan = new CanonicalPlan();

  // basic info
  const contract = raw?.electricityContract ?? {};

  plan.tariffPeriods = (contract.tariffPeriod ?? []).map((tp: any) => ({
  startDate: tp.startDate,
  endDate: tp.endDate,
    
  //  set time zone at local
  timeZone: resolvePlanTimeZone(contract.timeZone),

  // normalize fee
  supplyCharge: {
    type: "SINGLE",
    dailyAmount: Number(tp.dailySupplyCharge || 0),
  },

  // extract cost block or TOU
  usageCharge: {
    rateBlockUType: normalizeRateBlockUType(tp.rateBlockUType),
    rates: (tp.rates ?? []).map((r: any) => ({
      unitPrice: Number(r.unitPrice),
      volume: r.volume ? Number(r.volume) : undefined,
    })),
    timeOfUseRates: tp.timeOfUseRates ?? [],
  },

  // controlled load: optional transform from CDR format -> number
  controlledLoad: contract.controlledLoad?.[0]
    ? {
        supplyCharge: Number(
          contract.controlledLoad[0]?.singleRate?.dailySupplyCharge || 0
        ),
        usageCharge: {
          // rateBlockUType = SINGLE_RATE || ....
          rateBlockUType: "SINGLE_RATE",
          rates:
            contract.controlledLoad[0]?.singleRate?.rates?.map((r: any) => ({
              unitPrice: Number(r.unitPrice),
            })) ?? [],
        },
      }
    : undefined,

    // demand charges optional transform from CDR format -> number
    demandCharges: (tp.demandCharges ?? []).map((dc: any) => ({
      unitPrice: Number(dc?.rates?.[0]?.unitPrice || 0),
      minDemand: dc.minDemand ? Number(dc.minDemand) : undefined,
      maxDemand: dc.maxDemand ? Number(dc.maxDemand) : undefined,
      measurementPeriod: dc.measurementPeriod ?? "MONTH",
      chargePeriod: "MONTH",
      timeWindows: dc.timeOfUse ?? [],
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
  
  // normalize fees
  plan.fees =
    (contract.fees ?? []).map((f: any) => ({
      type: f.type,
      term: f.term,
      amount: f.amount != null ? Number(f.amount) : undefined,
      rate: f.rate != null ? Number(f.rate) : undefined,
    })) ?? [];

    // normalize discounts
  plan.discounts = contract.discounts ?? [];

  return plan;
}


// transform CDR rateBlockUType to canonical format
function normalizeRateBlockUType(raw: any) {
  if (raw === "timeOfUseRates") return "TIME_OF_USE";
  if (raw === "singleRate") return "SINGLE_RATE";
  if (raw === "blockRates") return "BLOCK";
  return "SINGLE_RATE";
}


