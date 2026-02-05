import { resolveTariffPeriod } from "./resolve-tariff-period";

// calculate interval duration in hours
function intervalHours(i: any) {
  const s = new Date(i.timestamp_start).getTime();
  const e = new Date(i.timestamp_end).getTime();
  return (e - s) / 36e5;
}

export function calculateDemandCharge({
  plan,
  usageSeries,
}: any) {
  let annualTotal = 0;
  const monthlyFinalBill: Record<string, number> = {};

  // Track peaks: Key="TimeKey|RuleID" -> Value={kw, rule}
  // This preserves the specific rule context for each peak found
  const peakTracker: Record<string, { kw: number; dc: any }> = {};

  // STEP 1: Scan intervals to find peaks
  for (const i of usageSeries) {
    if (i.import_kwh <= 0) continue;
    
    // Ensure canonical fields exist
    if (!i.localDate || !i.localMonth || !i.weekday || !i.startTime) continue;

    // Resolve applicable tariff period for this specific interval
    const tp = resolveTariffPeriod(
      plan.tariffPeriods,
      i.localDate!
    );

    // Iterate applicable demand rules
    for (const dc of tp.demandCharges || []) {
      
      // Check time window
      if (dc.timeWindows?.length) {
        const inWindow = dc.timeWindows.some(
          (w: { days: string[]; startTime: string; endTime: string }) => {
            if (!w.days.includes(i.weekday!)) return false;

            const start = w.startTime;
            const end = w.endTime;
            const time = i.startTime!;

            // Handle midnight wrap
            return start <= end
              ? time >= start && time < end
              : time >= start || time < end;
          }
        );

        if (!inWindow) continue;
      }

      // Calculate kW
      const kw = i.import_kwh / intervalHours(i);

      // Determine grouping key (Day vs Month)
      const measureTimeKey = dc.measurementPeriod === "DAY" ? i.localDate : i.localMonth;
      
      // Create unique rule ID to separate concurrent charges (e.g. Peak vs Offpeak)
      const dcRuleId = JSON.stringify(dc.timeWindows) + dc.unitPrice; 
      const trackerKey = `${measureTimeKey}|${dcRuleId}`;

      // Update max peak for this specific rule & period
      if (!peakTracker[trackerKey]) {
        peakTracker[trackerKey] = { kw: 0, dc: dc };
      }
      peakTracker[trackerKey].kw = Math.max(peakTracker[trackerKey].kw, kw);
    }
  }

  // STEP 2: Calculate costs (Apply bounds + price)
  for (const key in peakTracker) {
    const { kw, dc } = peakTracker[key];
    let billableKw = kw;

    // Apply demand bounds
    if (dc.minDemand != null) {
      billableKw = Math.max(billableKw, dc.minDemand);
    }
    if (dc.maxDemand != null) {
      billableKw = Math.min(billableKw, dc.maxDemand);
    }

    // Calculate cost
    const cost = billableKw * dc.unitPrice;

    // Aggregate totals
    annualTotal += cost;

    // Extract YYYY-MM for monthly breakdown
    const monthKey = key.substring(0, 7); 
    monthlyFinalBill[monthKey] = (monthlyFinalBill[monthKey] || 0) + cost;
  }

  return {
    total: annualTotal,
    monthly: monthlyFinalBill,
  };
}