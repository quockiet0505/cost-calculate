export function applyDiscounts({
  plan,
  baseTotal,
  usageTotal,
}: any) {

  // no discounts
  let best = baseTotal;

  // apply each discount
  for (const d of plan.discounts || []) {

    // apply discount based on type

    // discount of percentOfBill
    if (d.methodUType === "percentOfBill") {
      best -= baseTotal * (d.percentOfBill?.rate || 0);
    }

    // discount of percentOfUse
    if (d.methodUType === "percentOfUse") {
      best -= usageTotal * (d.percentOfUse?.rate || 0);
    }

    // discount of fixedAmount
    if (d.methodUType === "fixedAmount") {
      best -= d.fixedAmount?.amount || 0;
    }

    // discount of percentOverThreshold
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
