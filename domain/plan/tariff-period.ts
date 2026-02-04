
export interface TariffPeriod {
  startDate?: string;
  endDate?: string;

  /**
   * Timezone of the tariff rules
   * Important for TOU & demand
   */
  timeZone?: string;

  /**
   * Supply charge (daily)
   */
  supplyCharge?: {
    type: "SINGLE" | "BANDED";
    dailyAmount?: number;
    bands?: {
      upToDays?: number; // inclusive
      amount: number;
    }[];
  };

  /**
   * Usage charge for IMPORT
   */
  usageCharge?: {
    rateBlockUType: "SINGLE_RATE" | "TIME_OF_USE" | "BLOCK";
    rates?: TieredRate[];
    timeOfUseRates?: TouRate[];
  };

  /**
   * Controlled load pricing
   */
  controlledLoad?: {
    supplyCharge?: number;
    usageCharge?: {
      rateBlockUType: "SINGLE_RATE" | "TIME_OF_USE";
      rates?: TieredRate[];
      timeOfUseRates?: TouRate[];
    };
  };

  /**
   * Demand charges
   */
  demandCharges?: DemandCharge[];

  /**
   * Solar feed-in tariffs
   */
  solarFIT?: SolarFIT[];
}


export interface TieredRate {
  unitPrice: number;
  volume?: number; // kWh
  period?: "P1D" | "P1M" | "P1Y";
}

export interface TouRate {
  type: string; // PEAK / OFF_PEAK / SHOULDER
  timeOfUse: {
    days: string[]; // ["MON","TUE",...]
    startTime: string; // "22:00"
    endTime: string;   // "07:00" (wrap midnight allowed)
  }[];
  rates: TieredRate[];
}

export interface DemandCharge {
  unitPrice: number;

  measurementPeriod: "DAY" | "MONTH";
  chargePeriod: "MONTH";

  timeWindows?: {
    days: string[];
    startTime: string;
    endTime: string;
  }[];

  minDemand?: number;
  maxDemand?: number;
}

export interface SolarFIT {
  rateBlockUType: "SINGLE_RATE" | "TIME_OF_USE";
  rates?: TieredRate[];
  timeOfUseRates?: TouRate[];
}
