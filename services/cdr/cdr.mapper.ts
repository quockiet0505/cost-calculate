import { CanonicalPlan } from "../../domain/plan/plan.model";
import { resolvePlanTimeZone } from "../../utils/timezone";

// map CDR plan format to canonical format
export function mapCdrPlanToCanonical(raw: any): CanonicalPlan {
  const plan = new CanonicalPlan();

  // basic info
  const contract = raw?.electricityContract ?? {};

  const tariffPeriods = (contract.tariffPeriod ?? []).map((tp: any) => {
    // --- map controlled load ONCE ---
    const clRaw = contract.controlledLoad?.[0];
  
    const controlledLoad = clRaw
      ? {
          supplyCharge: Number(
            clRaw.singleRate?.dailySupplyCharge ?? 0
          ),
          usageCharge: clRaw.singleRate
            ? {
                rateBlockUType: "SINGLE_RATE",
                rates: clRaw.singleRate.rates.map((r: any) => ({
                  unitPrice: Number(r.unitPrice),
                })),
              }
            : clRaw.timeOfUseRates
            ? {
                rateBlockUType: "TIME_OF_USE",
                timeOfUseRates: clRaw.timeOfUseRates,
              }
            : undefined,
        }
      : undefined;
  
    return {
      startDate: tp.startDate,
      endDate: tp.endDate,
  
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
  
      
      controlledLoad,
  
      demandCharges: (tp.demandCharges ?? []).map((dc: any) => ({
        unitPrice: Number(dc?.rates?.[0]?.unitPrice || 0),
        minDemand: dc.minDemand ? Number(dc.minDemand) : undefined,
        maxDemand: dc.maxDemand ? Number(dc.maxDemand) : undefined,
        measurementPeriod: dc.measurementPeriod ?? "MONTH",
        chargePeriod: "MONTH",
        timeWindows: dc.timeOfUse ?? [],
      })),
    };
  });
  
  
  plan.tariffPeriods = [...tariffPeriods].sort((a, b) => {
    const pDiff = tariffPeriodPriority(b) - tariffPeriodPriority(a);
    if (pDiff !== 0) return pDiff;
  
    const aStart = a.startDate || "0000";
    const bStart = b.startDate || "0000";
    return bStart.localeCompare(aStart);
  });
  
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


function tariffPeriodPriority(p: any): number {
  if (p.startDate && p.endDate && p.startDate.length >= 10) return 3; // absolute
  if (p.startDate && p.endDate && p.startDate.length === 5) return 2; // seasonal
  return 1; // open-ended
}
