
import { SolarFIT, TariffPeriod } from "./tariff-period";

// canonical representation of a plan
export class CanonicalPlan {
  tariffPeriods: TariffPeriod[] = [];
  fees: CanonicalFee[] = [];
  solarFIT: SolarFIT[] = [];
  discounts: CanonicalDiscount[] = [];
}


//  Fees are applied outside tariff periods

export interface CanonicalFee {
  type: string;
  term: "FIXED" | "DAILY" | "MONTHLY" | "PERCENT_OF_BILL";
  amount?: number;
  rate?: number;
}

/**
 * Discounts are applied after base cost
 * Base vs best-case handled in pricing layer
 */
export interface CanonicalDiscount {
  methodUType:| "percentOfBill"| "percentOfUse"| "fixedAmount"| "percentOverThreshold";

  percentOfBill?: { rate: number };
  percentOfUse?: { rate: number };
  fixedAmount?: { amount: number };
  percentOverThreshold?: {
    threshold: number;
    rate: number;
  };
}
