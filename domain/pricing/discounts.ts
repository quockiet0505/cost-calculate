export function applyDiscounts({
  plan,
  baseTotal,
  usageTotal,
}: any) {
  let best = baseTotal;

  for (const d of plan.discounts || []) {
    if (d.methodUType === "percentOfBill") {
      best -= baseTotal * (d.percentOfBill?.rate || 0);
    }

    if (d.methodUType === "percentOfUse") {
      best -= usageTotal * (d.percentOfUse?.rate || 0);
    }

    if (d.methodUType === "fixedAmount") {
      best -= d.fixedAmount?.amount || 0;
    }

    if (d.methodUType === "percentOverThreshold") {
      const over = Math.max(
        0,
        baseTotal - (d.percentOverThreshold?.threshold || 0)
      );
      best -= over * (d.percentOverThreshold?.rate || 0);
    }
  }

  return {
    baseTotal,
    bestCaseTotal: Math.max(best, 0),
  };
}
