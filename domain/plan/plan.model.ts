import type { TariffPeriod } from "./tariff-period";

export class CanonicalPlan {
  tariffPeriods: TariffPeriod[] = [];
  controlledLoad?: any;
  demandCharges?: any[];
  fees: any[] = [];
  discounts: any[] = [];
}
