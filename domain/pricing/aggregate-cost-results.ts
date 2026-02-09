export function aggregateCostResults({
  supply,
  usage,
  solar,
  controlledLoadUsage,
  controlledLoadSupply,
  demand,
}: any) {
  const monthlyBreakdown: Record<string, any> = {};

  let annualSupply = 0;
  let annualUsage = 0;
  let annualControlledLoad = 0;
  let annualDemand = 0;
  let annualSolar = 0;

  const months = new Set([
    ...Object.keys(supply?.monthly || {}),
    ...Object.keys(usage?.monthly || {}),
    ...Object.keys(solar?.monthly || {}),
    ...Object.keys(controlledLoadUsage?.monthly || {}),
    ...Object.keys(controlledLoadSupply?.monthly || {}),
    ...Object.keys(demand?.monthly || {}),
  ]);

  for (const m of months) {
    const supplyM = supply?.monthly?.[m] ?? 0;
    const usageM = usage?.monthly?.[m] ?? 0;
    const clUsageM = controlledLoadUsage?.monthly?.[m] ?? 0;
    const clSupplyM = controlledLoadSupply?.monthly?.[m] ?? 0;
    const demandM = demand?.monthly?.[m] ?? 0;
    const solarM = solar?.monthly?.[m] ?? 0;

    const total =
      supplyM +
      usageM +
      clUsageM +
      clSupplyM +
      demandM -
      solarM;

    monthlyBreakdown[m] = {
      supply: supplyM,
      usage: usageM,
      controlledLoadUsage: clUsageM,
      controlledLoadSupply: clSupplyM,
      demand: demandM,
      solar: solarM,
      total,
    };

    annualSupply += supplyM;
    annualUsage += usageM;
    annualControlledLoad += clUsageM + clSupplyM;
    annualDemand += demandM;
    annualSolar += solarM;
  }

  const annualBaseTotal =
    annualSupply +
    annualUsage +
    annualControlledLoad +
    annualDemand -
    annualSolar;

  return {
    annualBaseTotal,
    monthlyBreakdown,
    componentTotals: {
      supply: annualSupply,
      usage: annualUsage,
      controlledLoad: annualControlledLoad,
      demand: annualDemand,
      solar: annualSolar,
    },
  };
}
