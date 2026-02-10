import { safeNumber } from "./number";

export function sanitizeMonthlyBreakdown(
  mb?: Record<string, any>
): Record<string, any> {
  const out: Record<string, any> = {};

  for (const [month, v] of Object.entries(mb ?? {})) {
    out[month] = {
      supply: safeNumber(v?.supply),
      usage: safeNumber(v?.usage),
      solar: safeNumber(v?.solar),
      controlledLoadUsage: safeNumber(v?.controlledLoadUsage),
      controlledLoadSupply: safeNumber(v?.controlledLoadSupply),
      demand: safeNumber(v?.demand),
      total: safeNumber(v?.total),
    };
  }

  return out;
}
