export interface TariffPeriod {
     startDate?: string;
     endDate?: string;
   
     supplyCharge?: { amount: number };
     usageCharge?: {
       rateBlockUType: "SINGLE_RATE" | "TIME_OF_USE";
       rates?: any[];
       timeOfUseRates?: any[];
     };
   
     controlledLoad?: any;
     solarFIT?: any[];
   }
   